# Ruskview

A high-performance, native-feeling Elasticsearch/OpenSearch client for macOS, built with Tauri (Rust) and React.

## Functional Scope

### 1. Connection Management
- Support connecting to multiple Elasticsearch/OpenSearch clusters.
- Support Basic Authentication (Username/Password).
- Persist connection details (securely, if possible).

### 2. Search Capabilities
- **Raw Query Support**: Allow users to input raw JSON queries (DSL) for maximum flexibility.
- **High Performance**: Utilize a persistent HTTP client pool in the Rust backend to handle high-throughput requests.

### 3. Data Visualization
- **Results Table**: A virtualized, high-performance table to display thousands of search hits without lag.
- **JSON Inspector**: A developer-friendly JSON viewer for inspecting individual document details with syntax highlighting.

### 4. User Interface
- **macOS Native Feel**: The UI must strictly follow Apple's Human Interface Guidelines.
- **Responsive**: Fast interactions and smooth animations.

## Development
Please refer to the `project_docs/` directory for detailed architecture and design guidelines.
- `01_architecture_blueprint.md`
- `02_backend_design.md`
- `03_frontend_design.md`
