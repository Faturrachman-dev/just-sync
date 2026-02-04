# Tech Stack & Constraints

## Core Technologies
- **Language**: TypeScript (Strict Mode)
- **Bundler**: esbuild (Native minification enabled, Terser disabled for speed)
- **Framework**: Obsidian Plugin API
- **Database**: PouchDB (Local), CouchDB (Remote)
- **Validation**: Zod (if needed), manual checks preferred for speed.

## Project Structure (Simplified)
```
src/
  common/            # Shared utilities (logger, types, platform-agnostic helpers)
  modules/           # CORE LOGIC
    core/            # Startup, target filtering
    features/        # Settings UI, Sync Logic
    services/        # ServiceHub definition
  lib/               # Legacy libraries/helpers
```

## "Just Sync" Specifics
- **Removed**: P2P Sync, S3 Support, MinIO.
- **Added**: Server Control (Desktop), Cloudflared Tunnel Support, Optimized Build.
- **Versioning**: 0.2.x series.

## Critical Files
- `src/main.ts`: Entry point.
- `src/common/serverCommand.ts`: Desktop command executor.
- `install-plugin.mjs`: Deployment logic.
- `styles.css`: UI styling (includes .server-status classes).
