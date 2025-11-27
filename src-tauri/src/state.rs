use crate::db::Database;
use crate::models::connection::ConnectionProfile;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Instant;
use tokio::sync::{RwLock, mpsc, oneshot};

pub struct AppState {
    pub current_profile: RwLock<Option<ConnectionProfile>>,
    pub request_queue: mpsc::Sender<RequestJob>,
    pub connection_cache: RwLock<HashMap<String, Instant>>,
    pub db: Mutex<Option<Database>>,
}

pub struct RequestJob {
    pub method: String,
    pub path: String,
    pub body: Option<Value>,
    pub profile_override: Option<ConnectionProfile>,
    pub responder: oneshot::Sender<Result<Value, String>>,
}

impl AppState {
    pub fn new(request_queue: mpsc::Sender<RequestJob>, db: Option<Database>) -> Self {
        Self {
            current_profile: RwLock::new(None),
            request_queue,
            connection_cache: RwLock::new(HashMap::new()),
            db: Mutex::new(db),
        }
    }
}
