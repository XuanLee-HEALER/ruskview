use crate::auth::{aws::AwsSigV4Auth, basic::BasicAuth, Authenticator};
use crate::models::connection::ConnectionProfile;
use anyhow::Result;
use async_trait::async_trait;
use reqwest::Client;
use serde_json::Value;
use std::sync::Arc;
use tracing::info;

#[async_trait]
pub trait EsClient: Send + Sync {
    async fn proxy_request(
        &self,
        method: &str,
        path: &str,
        body: Option<Value>,
    ) -> Result<Value, String>;
}

pub struct StandardEsClient {
    client: Client,
    profile: ConnectionProfile,
}

impl StandardEsClient {
    pub fn new(profile: ConnectionProfile) -> Self {
        let client = Client::builder()
            .pool_idle_timeout(std::time::Duration::from_secs(90))
            .pool_max_idle_per_host(10)
            .build()
            .expect("Failed to create HTTP client");

        Self { client, profile }
    }
}

#[async_trait]
impl EsClient for StandardEsClient {
    async fn proxy_request(
        &self,
        method: &str,
        path: &str,
        body: Option<Value>,
    ) -> Result<Value, String> {
        let url = format!("{}{}", self.profile.url.trim_end_matches('/'), path);
        info!("Preparing request: {} {}", method, url);

        // 1. Build http::Request
        let mut builder = http::Request::builder().method(method).uri(&url);

        // Add Content-Type header if body is present
        if body.is_some() {
            builder = builder.header("Content-Type", "application/json");
        }

        let body_bytes = if let Some(b) = body {
            serde_json::to_vec(&b).map_err(|e| e.to_string())?
        } else {
            Vec::new()
        };

        let mut request = builder.body(body_bytes).map_err(|e| e.to_string())?;

        // 2. Sign Request
        if self.profile.auth_type == "iam" {
            AwsSigV4Auth
                .sign(&mut request, &self.profile)
                .map_err(|e| e.to_string())?;
        } else if self.profile.auth_type == "basic" {
            BasicAuth
                .sign(&mut request, &self.profile)
                .map_err(|e| e.to_string())?;
        }

        // 3. Convert to reqwest::Request
        let reqwest_request = reqwest::Request::try_from(request).map_err(|e| e.to_string())?;

        // 4. Execute
        let res = self
            .client
            .execute(reqwest_request)
            .await
            .map_err(|e| e.to_string())?;

        // 5. Handle Response
        let status = res.status();
        info!("Response status: {}", status);

        let text = res.text().await.map_err(|e| e.to_string())?;

        // Log preview
        let log_text = if text.len() > 500 {
            format!("{}...", &text[..500])
        } else {
            text.clone()
        };
        info!("Response body preview: {}", log_text);

        serde_json::from_str(&text)
            .map_err(|e| format!("Failed to parse JSON: {}. Body: {}", e, log_text))
    }
}

pub fn create_client(profile: ConnectionProfile) -> Arc<dyn EsClient> {
    Arc::new(StandardEsClient::new(profile))
}
