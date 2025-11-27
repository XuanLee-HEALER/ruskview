use serde_json::Value;
use std::collections::HashMap;

pub struct ClusterRequest {
    pub operation: String,
    pub params: HashMap<String, String>,
}

impl ClusterRequest {
    pub fn new(operation: String, params: HashMap<String, String>) -> Self {
        Self { operation, params }
    }

    pub fn build_path(&self) -> String {
        let base = match self.operation.as_str() {
            "health" => "/_cluster/health",
            "state" => "/_cluster/state",
            "stats" => "/_cluster/stats",
            "nodes" => "/_nodes",
            "info" => "/",
            _ => "/",
        };

        // Append query parameters if any
        if self.params.is_empty() {
            base.to_string()
        } else {
            let query: Vec<String> = self
                .params
                .iter()
                .map(|(k, v)| format!("{}={}", k, v))
                .collect();
            format!("{}?{}", base, query.join("&"))
        }
    }

    pub fn method(&self) -> &'static str {
        match self.operation.as_str() {
            _ => "GET",
        }
    }
}
