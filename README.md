# Ruskview

> A high-performance, native-feeling Elasticsearch/OpenSearch client for macOS.

![Version](https://img.shields.io/badge/version-0.0.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2-orange.svg)

**Ruskview** is a modern desktop application designed to provide a seamless and efficient experience for managing and querying Elasticsearch and OpenSearch clusters. Built with the "Backend for Performance, Frontend for Experience" philosophy, it combines the raw speed of Rust with the flexibility of React.

## ✨ Features

### 🔌 Connection Management
- **Multi-Cluster Support**: Easily switch between different environments (Dev, Staging, Prod).
- **Secure Storage**: Connection profiles (including credentials) are encrypted and stored locally using SQLite and `magic_crypt`.
- **Authentication**: Supports Basic Auth and AWS IAM (SigV4) authentication.

### 🔍 Search & Query
- **Raw DSL Support**: Full power of Elasticsearch JSON DSL for complex queries.
- **High Performance**: Rust-based HTTP client pool (`reqwest`) ensures low-latency request handling.

### 📊 Visualization & Dashboard
- **Cluster Health**: Real-time view of cluster status, node count, and shard allocation.
- **Native UI**: Strictly follows Apple's Human Interface Guidelines (HIG) for a native macOS feel.
- **Dark Mode**: Automatic system theme detection.

## 🛠️ Tech Stack

- **Core**: [Tauri v2](https://tauri.app/) (Rust)
- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Backend Storage**: SQLite (`rusqlite`)
- **HTTP Client**: `reqwest`

## 🚀 Getting Started

### Prerequisites
- **Rust**: `stable` toolchain
- **Node.js**: v18+
- **Package Manager**: `npm` or `pnpm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/XuanLee-HEALER/ruskview.git
   cd ruskview
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run tauri dev
   ```
   Or using the helper script:
   ```bash
   ./run_dev.sh
   ```

## 📂 Architecture

For detailed design documentation, please refer to the `.github/instructions/` directory:
- [Architecture Blueprint](.github/instructions/01_arch_blueprint.instructions.md)
- [Backend Design](.github/instructions/02_backend_design.instructions.md)
- [Frontend Design](.github/instructions/03_frontend_design.instructions.md)

## 📄 License

This project is licensed under the MIT License.
