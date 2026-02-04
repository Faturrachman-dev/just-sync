# Updates

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
