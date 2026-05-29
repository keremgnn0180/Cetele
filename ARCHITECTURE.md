# Çetele Architecture

Çetele is an offline-first Electron desktop app for agricultural records and financial tracking.

## Runtime Layers

- `main.js`: Electron bootstrap, secure window creation, IPC registration, updater orchestration.
- `src/main/services`: production services such as health checks.
- `preload.js`: narrow IPC bridge exposed to the renderer.
- `database.js`: SQLite engine, migrations, backup and integrity operations.
- `src/renderer`: React UI, startup health gate, crash UI and feature screens.
- `src/shared`: shared schemas and type contracts used by main and renderer.

## Production Direction

- Split `main.js` into `src/main/window`, `src/main/ipc`, `src/main/updater`, `src/main/db`.
- Move SQL access behind repositories.
- Validate all IPC payloads with shared schemas.
- Keep renderer fully offline-capable and treat sync/update as optional services.

## Failure Strategy

- Renderer errors are caught by `ErrorBoundary`.
- Startup health checks block normal UI and show Recovery Mode when core services fail.
- Renderer process crashes load a static recovery page from `dist/recovery.html`.
