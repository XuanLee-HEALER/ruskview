---
applyTo: "**/*.rs"
---

# 02. Backend Design (Rust & Tokio)

## Core Concept: The Connection Pool

To achieve high performance, we must avoid creating a new HTTP client for every request. We will initialize a single `reqwest::Client` and share it across the application using Tauri's State management.

## State Management

We will define a struct to hold our application state.

```rust
use reqwest::Client;
use tokio::sync::RwLock;
use std::sync::Arc;

pub struct AppState {
    // The HTTP client is thread-safe and handles its own pooling.
    pub client: Client,
    // We might need to store active connection details (URL, Auth) safely.
    pub current_connection: RwLock<Option<ConnectionDetails>>,
}

pub struct ConnectionDetails {
    pub url: String,
    pub auth: Option<(String, String)>, // Basic Auth (username, password)
}
```

## Initialization

In `main.rs`, we will build the client with specific performance tunings:

```rust
let client = reqwest::Client::builder()
    .pool_idle_timeout(std::time::Duration::from_secs(90))
    .pool_max_idle_per_host(10)
    .build()
    .expect("Failed to create HTTP client");
```

## Tauri Commands

These are the functions callable from the Frontend.

### 1. `connect_to_cluster`

- **Input**: `url: String`, `username: Option<String>`, `password: Option<String>`
- **Action**: Validates the connection by hitting the root endpoint (`/`). If successful, updates `AppState.current_connection`.
- **Output**: `Result<ClusterInfo, String>`

### 2. `proxy_request` (The Workhorse)

Instead of writing a command for every single ES API, we can create a flexible proxy command for raw performance and flexibility.

- **Input**:
  - `method`: "GET" | "POST" | "PUT" | "DELETE"
  - `path`: String (e.g., `/_search`)
  - `body`: Option<serde_json::Value>
- **Action**:
  - Reads `current_connection` from State.
  - Uses `client` to send the request.
  - Returns the raw JSON response.
- **Benefit**: Allows the frontend to construct complex queries without recompiling the backend.

## Error Handling

- Use `anyhow` for internal errors.
- Map all errors to a `String` or a structured JSON error object before returning to Tauri, so the frontend can display a nice "Toast" notification (Adobe Spectrum style).
