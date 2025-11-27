use crate::es::cluster::ClusterRequest;
use crate::es::index::IndexRequest;
use crate::models::connection::ConnectionProfile;
use crate::state::{AppState, RequestJob};
use std::collections::HashMap;
use tauri::State;
use tokio::sync::oneshot;

#[tauri::command]
pub async fn test_connection(
    profile: ConnectionProfile,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let (tx, rx) = oneshot::channel();

    let job = RequestJob {
        method: "GET".to_string(),
        path: "/".to_string(),
        body: None,
        profile_override: Some(profile),
        responder: tx,
    };

    state
        .request_queue
        .send(job)
        .await
        .map_err(|e| e.to_string())?;

    rx.await.map_err(|e| e.to_string())?
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

                // Return a mock success response or minimal info since we trust the cache
                return Ok(serde_json::json!({
                    "status": "connected_from_cache",
                    "name": profile.name
                }));
            }
        }
    }

    // First test the connection
    let (tx, rx) = oneshot::channel();

    let job = RequestJob {
        method: "GET".to_string(),
        path: "/".to_string(),
        body: None,
        profile_override: Some(profile.clone()),
        responder: tx,
    };

    state
        .request_queue
        .send(job)
        .await
        .map_err(|e| e.to_string())?;

    let result = rx.await.map_err(|e| e.to_string())??;

    // If successful, update state and cache
    {
        let mut current = state.current_profile.write().await;
        *current = Some(profile.clone());
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
    let (tx, rx) = oneshot::channel();

    let job = RequestJob {
        method,
        path,
        body,
        profile_override: None,
        responder: tx,
    };

    state
        .request_queue
        .send(job)
        .await
        .map_err(|e| e.to_string())?;

    rx.await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn perform_cluster_op(
    operation: String,
    params: HashMap<String, String>,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
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
