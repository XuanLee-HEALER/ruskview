use crate::es::client::create_client;
use crate::es::cluster::ClusterRequest;
use crate::es::index::IndexRequest;
use crate::models::connection::ConnectionProfile;
use crate::state::AppState;
use std::collections::HashMap;
use tauri::State;
use tracing::info;

#[tauri::command]
pub async fn test_connection(
    profile: ConnectionProfile,
    _state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let client = create_client(profile);
    client.proxy_request("GET", "/", None).await
}

#[tauri::command]
pub async fn connect_to_cluster(
    profile: ConnectionProfile,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    // Check cache first
    {
        let cache = state.connection_cache.read().await;
        if let Some(expiry) = cache.get(&profile.id) {
            if std::time::Instant::now() < *expiry {
                // Cache hit and valid
                let mut current = state.current_profile.write().await;
                *current = Some(profile.clone());

                // Update active client
                let mut client_guard = state.active_client.write().await;
                *client_guard = Some(create_client(profile.clone()));

                // Return a mock success response or minimal info since we trust the cache
                return Ok(serde_json::json!({
                    "status": "connected_from_cache",
                    "name": profile.name
                }));
            }
        }
    }

    // First test the connection
    let client = create_client(profile.clone());
    let result = client.proxy_request("GET", "/", None).await?;

    // If successful, update state and cache
    {
        let mut current = state.current_profile.write().await;
        *current = Some(profile.clone());
    }

    {
        let mut client_guard = state.active_client.write().await;
        *client_guard = Some(client);
    }

    {
        let mut cache = state.connection_cache.write().await;
        // Cache for 5 minutes
        cache.insert(
            profile.id,
            std::time::Instant::now() + std::time::Duration::from_secs(300),
        );
    }

    Ok(result)
}

#[tauri::command]
pub async fn proxy_request(
    method: String,
    path: String,
    body: Option<serde_json::Value>,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let client_guard = state.active_client.read().await;

    if let Some(client) = client_guard.as_ref() {
        client.proxy_request(&method, &path, body).await
    } else {
        Err("No active connection".to_string())
    }
}

#[tauri::command]
pub async fn perform_cluster_op(
    operation: String,
    params: HashMap<String, String>,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    info!("perform_cluster_op called with operation: {}", operation);
    let req = ClusterRequest::new(operation, params);
    proxy_request(req.method().to_string(), req.build_path(), None, state).await
}

#[tauri::command]
pub async fn perform_index_op(
    operation: String,
    index: String,
    params: HashMap<String, String>,
    body: Option<serde_json::Value>,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let req = IndexRequest::new(operation, index, params);
    proxy_request(req.method().to_string(), req.build_path(), body, state).await
}

#[tauri::command]
pub async fn save_profile(
    profile: ConnectionProfile,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db_guard = state.db.lock().map_err(|_| "Failed to lock db")?;
    if let Some(db) = db_guard.as_ref() {
        db.save_profile(&profile).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_profiles(state: State<'_, AppState>) -> Result<Vec<ConnectionProfile>, String> {
    let db_guard = state.db.lock().map_err(|_| "Failed to lock db")?;
    if let Some(db) = db_guard.as_ref() {
        db.get_profiles().map_err(|e| e.to_string())
    } else {
        Err("Database not initialized".to_string())
    }
}

#[tauri::command]
pub async fn delete_profile(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let db_guard = state.db.lock().map_err(|_| "Failed to lock db")?;
    if let Some(db) = db_guard.as_ref() {
        db.delete_profile(&id).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Database not initialized".to_string())
    }
}
