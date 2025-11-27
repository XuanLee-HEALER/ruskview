use serde_json::Value;
use std::collections::HashMap;

pub struct IndexRequest {
    pub operation: String,
    pub index: String,
    pub params: HashMap<String, String>,
}

impl IndexRequest {
    pub fn new(operation: String, index: String, params: HashMap<String, String>) -> Self {
        Self {
            operation,
            index,
            params,
        }
    }

    pub fn build_path(&self) -> String {
        let base = match self.operation.as_str() {
            "search" => format!("/{}/_search", self.index),
            "mapping" => format!("/{}/_mapping", self.index),
            "settings" => format!("/{}/_settings", self.index),
            "stats" => format!("/{}/_stats", self.index),
            "create" => format!("/{}", self.index),
            "delete" => format!("/{}", self.index),
            _ => format!("/{}", self.index),
        };

        if self.params.is_empty() {
            base
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
            "create" => "PUT",
            "delete" => "DELETE",
            "search" => "POST", // Search usually POST with body
            _ => "GET",
        }
    }
}
