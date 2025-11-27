---
applyTo: "**/*.ts"
---

# 03. Frontend Design (Apple Design First)

## UI Philosophy

**Goal**: Create an interface that feels indistinguishable from a native macOS application.
**Principle**: "Apple Design First". We will not use generic web UI kits. Instead, we will implement components that strictly follow Apple's Human Interface Guidelines (HIG).

## Technology Strategy

- **Styling**: Tailwind CSS (configured with macOS system colors, fonts, and spacing variables).
- **Icons**: SF Symbols (via a compatible React library or SVG export).
- **Fonts**: San Francisco (System Font).

## Component Architecture

### 1. The Layout (macOS Window Structure)

- **Sidebar (Source List)**:
  - Translucent background (vibrancy effect if possible via CSS/Tauri).
  - Lists connected clusters and indices.
  - Uses native-style selection highlighting (rounded corners, blue accent).
- **Toolbar (Title Bar)**:
  - Integrated with the window title bar (unified style).
  - Contains the Search Field (centered or trailing) and primary actions.
- **Main Content Area**:
  - White/Dark background (depending on theme).
  - Displays search results or document details.

### 2. Key Components (Custom Implementation)

- **Search Field**:
  - Rounded rectangle, magnifying glass icon on the left.
  - Focus ring matches macOS system accent color.
- **Data Table**:
  - Alternating row colors (striped).
  - Sticky headers.
  - Resizable columns.
  - Virtualized rendering for performance (using `react-window` or `tanstack-virtual`).
- **JSON Viewer**:
  - A clean, syntax-highlighted view for JSON documents (e.g., `react-syntax-highlighter` with a custom theme matching Xcode).

### 3. Feedback & Interaction

- **Toast/Notifications**:
  - Do not use web-style toasts. Use native system notifications via Tauri API where appropriate, or unobtrusive status bar messages.
- **Loading States**:
  - Use a spinner that mimics the macOS system spinner.

## State Management (Zustand)

Create a store `useAppStore` to manage:

- `isConnected`: boolean
- `currentCluster`: string
- `searchResults`: Array<any>
- `isSearching`: boolean

## Integration with Tauri

We will create a custom hook `useTauri` or utility functions in `src/api/tauri.ts` to wrap the `invoke` calls.

```typescript
// src/api/tauri.ts
import { invoke } from "@tauri-apps/api/core";

export async function search(query: any) {
  return await invoke("proxy_request", {
    method: "POST",
    path: "/_search",
    body: query,
  });
}
```
