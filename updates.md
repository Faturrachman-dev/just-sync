# Updates

## 0.2.11
- **UX**: Removed deprecated MinIO/S3/R2 Object Storage backend (CouchDB is now the only supported remote sync method).
- **UX**: Removed deprecated P2P Sync backend (Peer-to-Peer sync is no longer available).
- **UX**: Cleaned up Settings UI by removing:
  - MinIO/S3/R2 configuration panel
  - Peer-to-Peer configuration panel
  - MinIO-specific journal history controls (Reset journal received/sent history, Reset/Purge/Wipe journal counter)
  - "Remote Database Tweak (In sunset)" panel
- **UX**: Simplified visibility helpers from 5 to 1 (only `onlyOnCouchDB` remains).
- **UX**: Moved "Enable compression for transferred data" toggle from Patches panel to Advanced panel.
- **Cleanup**: Removed unused imports and references to `REMOTE_MINIO` and `REMOTE_P2P` across settings modules.
- **Cleanup**: Removed orphaned utility functions `getP2PConfigSummary` and `getBucketConfigSummary` from settingUtils.
- **Note**: This release focuses exclusively on CouchDB sync — if you were using MinIO or P2P, you'll need to migrate to CouchDB before upgrading.

## 0.2.10
- **UX**: Replaced Docker dependency with two lightweight CouchDB backends:
  - **PouchDB Server**: ~15 MB npm package, instant start, no Docker needed.
  - **Native CouchDB**: Detects and manages OS-installed CouchDB (Windows Service, systemd, Homebrew).
- **UX**: Backend selector dropdown in Server Control panel.
- **UX**: One-click Install button for PouchDB Server (npm install -g).
- **UX**: Auto-detect native CouchDB installations across Windows/Linux/macOS.
- **New**: `pouchdbServer.ts` — manages PouchDB Server child process lifecycle.
- **New**: `nativeCouchDB.ts` — detects and controls native CouchDB services.
- **Refactor**: `serviceControl.ts` is now backend-agnostic (dispatches to selected backend).

## 0.2.9
- **UX**: Enhanced Server Control panel with CouchDB Docker management (start/stop/create containers).
- **UX**: Added one-click CouchDB auto-configuration (CORS, auth, size limits) via HTTP API.
- **UX**: Added "Start All Services" button to launch CouchDB + Cloudflared tunnel together.
- **UX**: Service status dashboard shows live state of CouchDB container and tunnel.
- **New**: `serviceControl.ts` module for managing Docker containers and CouchDB configuration programmatically.

## 0.2.8
- **Security**: Replaced innerHTML with DOM API (createEl, textContent) in settings and modals.
- **Compliance**: Moved inline styles to CSS classes for dialogs, conflict resolver, and plugin sync modal.
- **Cleanup**: Replaced runtime console.log with Logger calls at appropriate log levels.
- **Branding**: Fixed remaining "Self-hosted LiveSync" references in suspend/resume messages.

## 0.2.7
- **Performance**: Parallelized file scanning operations (adoptCurrentStorageFilesAsProcessed, adoptCurrentDatabaseFilesAsProcessed).
- **Performance**: Fixed scanInternalFiles to properly parallelize ignore checks.
- **Performance**: Config sync now writes files concurrently instead of sequentially.

## 0.2.6
- **Bugfix**: Status bar now correctly shows "Error ⚠" when server connection fails (previously showed "Idle ⏹").

## 0.2.5
- **Performance**: Parallelized chunk resurrection in database maintenance.
- **UX**: Enhanced connection check now verifies database existence and write permissions.
- **UX**: Renamed "Scram!" panel to "Troubleshooting" with clearer action descriptions.
- **UX**: Status bar now shows readable text ("Idle", "Syncing", "Paused", "Error") alongside icons.

## 0.2.4
- **Performance**: Optimized file content comparison (removed Base64 conversion overhead).
- **Performance**: Fixed O(N²) array concatenation in HiddenFileSync recursive traversal.
- **Performance**: Eliminated redundant database fetches in ConfigSync plugin scanning.

## 0.2.3
- **Rebranding**: All log messages now say "Just Sync" instead of "Self-hosted LiveSync".

## 0.2.2
- **Bugfix**: Fixed "Failed to resolve module specifier 'child_process'" error on Server Start.
- **Renamed**: Log window now shows "Just Sync Log" instead of "Self-hosted LiveSync Log".
- **Improved Logging**: Server command execution now appears in the log window.

## 0.2.1
- **New Feature**: Added "Server Control" panel (Desktop) to start your server command (e.g., cloudflared) directly from settings.
- **Build System Optimization**: Switched from Terser to Esbuild minification, resulting in 10x faster build times.
- **I18n Optimization**: Translation compilation is now on-demand (`npm run build:with-i18n`) rather than running on every build.

## 0.2.0
- Renamed "Replicate" command to "Just-Sync now!".
- Fixed initialization crash.
- Default settings optimized for Just Sync.
