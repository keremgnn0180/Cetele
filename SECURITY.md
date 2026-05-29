# Security Policy

## Electron Hardening

- `contextIsolation` is enabled.
- `nodeIntegration` is disabled.
- `sandbox` is enabled.
- Navigation is restricted to the local app in production.
- New windows are denied; allowlisted external URLs open in the OS browser.
- A Content Security Policy is applied by the main process.

## IPC Policy

- Renderer access must go through `preload.js`.
- IPC channels must be allowlisted.
- All write payloads must be validated with schemas in `src/shared/schemas`.
- Raw stack traces must not be shown to end users.

## Data Safety

- SQLite uses foreign keys, WAL where supported, busy timeout and integrity checks.
- Backup restore should remain atomic and should never delete existing data before replacement succeeds.

## Reporting Vulnerabilities

Open a private GitHub security advisory or contact the maintainer directly. Do not publish exploit details before a fix is available.
