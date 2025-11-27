---
applyTo: '**'
---

# 01. Architecture Blueprint

## Project Overview

**Goal**: Build a high-performance, native-feeling Elasticsearch/OpenSearch client for macOS.
**Core Philosophy**: "Backend for Performance, Frontend for Experience."

- **Backend**: Rust (Tauri) handles heavy lifting, connection pooling, and raw HTTP throughput.
- **Frontend**: React + Custom Apple Design Implementation (Strict adherence to macOS Human Interface Guidelines).

## Technology Stack

### Core Framework

- **Tauri v2**: For bridging Rust and the WebView.
- **Version Policy**: All dependencies must use the **latest stable versions**.

### Backend (Rust)

- **Runtime**: `tokio` (Asynchronous runtime for high concurrency).
- **HTTP Client**: `reqwest` (with connection pooling enabled).
- **Serialization**: `serde` + `serde_json` (High-performance JSON handling).
- **State Management**: `std::sync::Arc` + `tokio::sync::RwLock` for sharing the HTTP client across Tauri commands.

### Frontend (Web Tech)

- **Framework**: React (TypeScript).
- **UI System**: **Apple Design First**.
  - **Principle**: Abandon third-party design systems (like Material or Adobe Spectrum). All interactions, visuals, and animations must prioritize the Apple App Design style (macOS native feel).
  - **Implementation**: Custom CSS / Tailwind CSS configured with macOS system tokens (fonts, colors, spacing).
- **State Management**: Zustand (Lightweight, efficient).
- **Build Tool**: Vite.

## Development Guidelines

1. **Rust Best Practices**:
   - Follow idiomatic Rust patterns.
   - **Module Organization**: Do NOT use `mod.rs` files. Use the filename-based module system (e.g., `es.rs` instead of `es/mod.rs`).
   - **Minimize `unsafe`**: Avoid `unsafe` code unless absolutely necessary for performance. If used, it must be documented and benchmarked.
2. **Modular Design**:
   - Ensure clear separation of concerns (e.g., separate modules for API logic, State, and Commands).
   - Frontend components should be small, reusable, and strictly typed.
3. **Testing**:
   - **Unit Tests**: Mandatory for the smallest functional units (both Rust and TypeScript).
   - Ensure core logic is testable in isolation from the UI/Tauri context where possible.
4. **Scope Management**:
   - The functional scope of the project is recorded **ONLY** in the root `README.md`.
   - Do not create separate documentation files for feature lists or roadmaps.

## High-Level Data Flow

1. **User Action**: User types a query in the React UI.
2. **IPC Call**: Frontend invokes a Tauri Command (e.g., `perform_search`).
3. **Rust Handler**:
   - Retrieves the shared `reqwest::Client` from Tauri State.
   - Constructs the Elasticsearch query.
   - Executes the request asynchronously via `tokio`.
4. **Response**: Rust deserializes the raw JSON and returns it to the frontend.
5. **Render**: React components render the results efficiently (virtualized lists for large datasets), styled to look like a native macOS table.

## Directory Structure Plan

```
ruskview/
├── src-tauri/           # Rust Backend
│   ├── src/
│   │   ├── main.rs      # Entry point, setup
│   │   ├── commands.rs  # Tauri commands (API surface)
│   │   ├── state.rs     # Shared application state (Client pool)
│   │   └── client.rs    # Elasticsearch/OpenSearch logic
│   └── Cargo.toml
├── src/                 # Frontend (React)
│   ├── components/      # macOS-styled components
│   ├── hooks/           # Custom hooks for Tauri commands
│   ├── stores/          # Zustand stores
│   └── App.tsx
├── project_docs/        # Design & Architecture Guidelines (Max 3 files)
└── README.md            # Project Scope & Functional Requirements
```

# Git Workflow & Contribution Guidelines

## Branching Strategy

We follow a **Feature Branch Workflow** (simplified Gitflow).

- **`main`**: The stable production branch. All code here must be buildable and pass tests.
- **`feat/name`**: For new features (e.g., `feat/login-ui`).
- **`fix/name`**: For bug fixes (e.g., `fix/connection-crash`).
- **`chore/name`**: For maintenance, refactoring, or tooling (e.g., `chore/update-deps`).

## Commit Messages (Conventional Commits)

We strictly follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

**Format**: `<type>(<scope>): <description>`

### Types

- **`feat`**: A new feature (correlates with MINOR in SemVer).
- **`fix`**: A bug fix (correlates with PATCH in SemVer).
- **`docs`**: Documentation only changes.
- **`style`**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- **`refactor`**: A code change that neither fixes a bug nor adds a feature.
- **`perf`**: A code change that improves performance.
- **`test`**: Adding missing tests or correcting existing tests.
- **`build`**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm).
- **`ci`**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs).
- **`chore`**: Other changes that don't modify src or test files.
- **`revert`**: Reverts a previous commit.

### Examples

- `feat(auth): add support for AWS IAM authentication`
- `fix(dashboard): prevent crash when cluster stats are empty`
- `chore(deps): upgrade tauri to v2.0.0`
- `docs: update architecture blueprint`

## Pull Requests

1. **Title**: Must follow the Conventional Commits format (same as commit messages).
2. **Description**:
   - **What**: Brief summary of changes.
   - **Why**: Context or motivation.
   - **How**: Technical approach (optional for small changes).
3. **Review Process**:
   - All PRs require at least one approval.
   - CI checks (build, lint, test) must pass.
