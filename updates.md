# Updates

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
