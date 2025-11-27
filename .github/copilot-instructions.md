## Quick orientation — ruskview (small Rust app)

This is a small Rust command-line project. Use these notes to make targeted, low-risk edits and to be productive quickly.

### Big picture

- Single binary crate at the repo root. Key files:
  - `Cargo.toml` — package metadata (edition = "2024").
  - `src/main.rs` — program entry point (currently prints "Hello, world!").
  - `target/` — build artifacts (ignored by source control).

### Developer workflows (commands you can rely on)

- Build locally: `cargo build` — produces debug artifacts in `target/debug/`.
- Run: `cargo run` — useful for quick iterations while editing `src/main.rs`.
- Test (no tests yet, but the workflow is): `cargo test`.
- Keep changes small and iterative: make a change → `cargo build` → `cargo run` → open a PR.

Notes for macOS users / fish shell

- Commands are standard Rust/Cargo commands and run the same across shells. On fish, use them as-is (e.g. `cargo build`).

### Project patterns & conventions (what to follow)

- This is intentionally minimal: avoid introducing heavy new dependencies unless necessary for a truthful feature.
- When adding dependencies update `Cargo.toml` and run `cargo build` to confirm there are no transitive issues.
- Keep the binary-focused layout (src/lib.rs only if you intend to share core logic) — most features should be small and focused.

### CI / automation notes (none present in repo)

- There are no detectable CI or contributor-specific automation files. Keep commits and PRs self-contained and ensure `cargo build` is green locally before pushing.

### What AI agents should do first

1. Read `Cargo.toml` and `src/main.rs` to confirm this is a tiny, single-crate CLI.
2. Prefer small, testable edits (one change per PR) and run `cargo build` / `cargo run` locally to validate.
3. If adding behavior, include a focused unit test under `tests/` or `src/` and run `cargo test`.

### Files to reference in PRs/edits

- `Cargo.toml` — when changing dependencies or metadata
- `src/main.rs` — program logic and entry point
- `target/` — build output (do not commit)

If anything here is unclear or you'd like more coverage (for example: expected CLI flags, planned features, or tests) tell me which area to expand and I'll update this file.
