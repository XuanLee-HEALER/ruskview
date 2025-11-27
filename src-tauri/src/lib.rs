mod auth;
mod commands;
mod db;
mod es;
mod models;
mod state;

use state::{AppState, RequestJob};
use tauri::{
    Manager,
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
};
use tokio::sync::mpsc;
use tracing::{Level, error, info};
use tracing_subscriber::FmtSubscriber;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize Tracing
    if cfg!(debug_assertions) {
        // Debug Mode: Output to Console with Colors
        let subscriber = FmtSubscriber::builder()
            .with_max_level(Level::DEBUG)
            .with_ansi(true) // Enable colors
            .with_file(true)
            .with_line_number(true)
            .with_target(false) // Hide module path if file path is shown
            .finish();

        tracing::subscriber::set_global_default(subscriber)
            .expect("setting default subscriber failed");
    } else {
        // Release Mode: Output to File
        let file_appender = tracing_appender::rolling::daily("logs", "ruskview.log");
        let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

        let subscriber = FmtSubscriber::builder()
            .with_max_level(Level::INFO)
            .with_writer(non_blocking)
            .with_ansi(false) // Disable colors for file
            .with_file(true)
            .with_line_number(true)
            .finish();

        // Note: _guard must be kept alive for logs to be flushed.
        // Since we are in `run`, we might need to leak it or store it in AppState if we want it to persist properly,
        // but for now, let's just let it live as long as `run` executes (which is until app exit).
        // However, `tauri::Builder::default().run` blocks, so we need to be careful.
        // Actually, `set_global_default` sets the subscriber globally.
        // The `_guard` is for the non-blocking writer. If it drops, logs might be lost.
        // We can leak it for the lifetime of the app.
        Box::leak(Box::new(_guard));

        tracing::subscriber::set_global_default(subscriber)
            .expect("setting default subscriber failed");
    }

    info!("Starting Ruskview...");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .menu(|handle| {
            let menu = Menu::default(handle)?;
            Ok(menu)
        })
        .invoke_handler(tauri::generate_handler![
            commands::connect_to_cluster,
            commands::proxy_request,
            commands::test_connection,
            commands::perform_cluster_op,
            commands::perform_index_op,
            commands::save_profile,
            commands::get_profiles,
            commands::delete_profile
        ])
        .setup(|app| {
            let handle = app.handle();

            // Initialize Task Queue
            let (tx, mut rx) = mpsc::channel::<RequestJob>(100);

            // Initialize DB
            let app_handle = app.handle();
            let app_dir = app_handle
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_dir).expect("failed to create app data dir");
            let db = db::Database::init(&app_dir).ok();

            // Initialize AppState
            app.manage(AppState::new(tx, db));

            // Spawn Worker
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                info!("Worker thread started");
                // We need access to the client, but AppState is managed by Tauri.
                // However, we can't access AppState inside this closure easily before it's managed.
                // So we'll create the client here or pass it.
                // Better approach: Create AppState first, then spawn worker that uses it?
                // Or just let the worker have its own client reference?
                // Since we want to use the SAME client pool, we should probably initialize AppState manually first.

                // Actually, let's just create the client here and share it if needed,
                // OR just let the worker own the client for processing requests.
                // The commands only need to send to the queue.

                let client = reqwest::Client::builder()
                    .pool_idle_timeout(std::time::Duration::from_secs(90))
                    .pool_max_idle_per_host(10)
                    .build()
                    .expect("Failed to create HTTP client");

                while let Some(job) = rx.recv().await {
                    let client = client.clone();
                    // We need the current profile URL/Auth.
                    // This is tricky because the profile is in AppState (RwLock).
                    // We can pass the FULL request details in the Job, including the base URL and Auth headers.
                    // But the prompt says "http client pool is the consumer".

                    // Let's assume the Job contains everything needed to make the request
                    // OR the worker can access the state.
                    // Accessing Tauri state from a spawned tokio task is possible if we pass the app handle.

                    let state = app_handle.state::<AppState>();
                    let profile_guard = state.current_profile.read().await;

                    let active_profile = if let Some(p) = &job.profile_override {
                        Some(p.clone())
                    } else {
                        profile_guard.clone()
                    };

                    if let Some(profile) = active_profile {
                        let url = format!("{}{}", profile.url.trim_end_matches('/'), job.path);
                        info!("Processing request: {} {}", job.method, url);

                        let mut req_builder = client
                            .request(job.method.parse().unwrap_or(reqwest::Method::GET), &url);

                        if let Some(body) = job.body {
                            req_builder = req_builder.json(&body);
                        }

                        // Add Auth (Basic or AWS)
                        if profile.auth_type == "basic" {
                            if let (Some(u), Some(p)) = (&profile.username, &profile.password) {
                                req_builder = req_builder.basic_auth(u, Some(p));
                            }
                        }
                        // TODO: Add AWS SigV4 support here using profile.region, access_key, secret_key

                        let result = match req_builder.send().await {
                            Ok(res) => match res.json::<serde_json::Value>().await {
                                Ok(json) => Ok(json),
                                Err(e) => {
                                    error!("Failed to parse JSON: {}", e);
                                    Err(e.to_string())
                                }
                            },
                            Err(e) => {
                                error!("Request failed: {}", e);
                                Err(e.to_string())
                            }
                        };

                        let _ = job.responder.send(result);
                    } else {
                        let _ = job
                            .responder
                            .send(Err("No active connection profile".to_string()));
                    }
                }
            });

            // Create the menu
            let app_menu = Submenu::with_items(
                handle,
                "Ruskview",
                true,
                &[
                    &MenuItem::with_id(handle, "settings", "Settings", true, Some("CmdOrCtrl+,"))?,
                    &PredefinedMenuItem::separator(handle)?,
                    &MenuItem::with_id(handle, "quit", "Quit", true, Some("CmdOrCtrl+Q"))?,
                ],
            )?;

            let edit_menu = Submenu::with_items(
                handle,
                "Edit",
                true,
                &[
                    &PredefinedMenuItem::undo(handle, None)?,
                    &PredefinedMenuItem::redo(handle, None)?,
                    &PredefinedMenuItem::separator(handle)?,
                    &PredefinedMenuItem::cut(handle, None)?,
                    &PredefinedMenuItem::copy(handle, None)?,
                    &PredefinedMenuItem::paste(handle, None)?,
                    &PredefinedMenuItem::select_all(handle, None)?,
                ],
            )?;

            let menu = Menu::with_items(handle, &[&app_menu, &edit_menu])?;
            app.set_menu(menu)?;

            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
