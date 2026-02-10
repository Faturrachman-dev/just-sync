# Current State (Handover)

**Date**: February 4, 2026
**Version**: 0.2.7

## Status
- **Build**: ✅ Passing and Optimized (Fast, ~1s).
- **Runtime**: ✅ Stable. All known issues fixed.
- **Tests**: ✅ 81 unit tests passing.
- **Features**: 
  - ✅ Renamed "Replicate" to "Just-Sync now!".
  - ✅ Added "Server Control" panel (Desktop only) with Start Server button.
  - ✅ Performance optimizations (8+ changes).
  - ✅ UX improvements (Troubleshooting panel, readable status bar).

## Version History
- **0.2.0**: Feature stripping (P2P, S3 removed), rebranding, crash fix.
- **0.2.1**: Build optimization, Server Control feature.
- **0.2.2**: Fixed child_process import, renamed log window to "Just Sync Log".
- **0.2.3**: All log messages rebranded to "Just Sync".
- **0.2.4**: Base64 comparison optimization, recursive array fix, DB fetch deduplication.
- **0.2.5**: Connection check (DB/write permissions), renamed "Scram!" to "Troubleshooting", human-readable sync status.
- **0.2.6**: Fixed status bar showing "Error" when connection fails.
- **0.2.7**: I/O parallelization (4 optimizations in HiddenFileSync/ConfigSync).

## New Files Added
- `src/common/serverCommand.ts` - Server command execution utility
- `src/common/serverCommand.unit.test.ts` - Unit tests for server command
- `docs/architecture.md` - Full architecture documentation
- `install-plugin.mjs` - Build + deploy script

## Key Settings Added
In `src/lib/src/common/types.ts`:
- `cloudflaredTunnelName: string` - Name of the Cloudflare tunnel to run (e.g. 'obsidian').

## Performance Optimizations
1. **Base64 comparison**: `isDocContentSame` now uses Uint8Array comparison.
2. **Recursive array fix**: Uses accumulator pattern instead of O(N²) concat.
3. **DB fetch dedup**: `loadPluginData` accepts pre-fetched document.
4. **I/O parallelization**: Promise.all in `adoptCurrentStorageFilesAsProcessed`, `adoptCurrentDatabaseFilesAsProcessed`, `scanInternalFiles`, `applyData`.

## UX Improvements
1. **Connection Check**: Verifies DB exists and write permissions before connecting.
2. **Troubleshooting Panel**: Renamed from "Scram!" for clarity.
3. **Readable Status Bar**: Shows "Idle", "Syncing", "Error" with icons.
4. **Error Status**: Status bar correctly shows "Error" on connection failure.

## UI Changes
In `src/modules/features/SettingDialogue/PaneRemoteConfig.ts`:
- **Server Control Panel**:
  - Input field: "Cloudflared Tunnel Name".
  - "Start Server" button runs: `cloudflared tunnel run "<NAME>"`.

## How to Resume
1.  Open workspace.
2.  Check `docs/architecture.md` to understand the project structure.
3.  Run `npm run build` to confirm environment.
4.  Run `npm run test:unit` to verify tests pass.
5.  Run `npm run build:deploy` to build and deploy to Obsidian.
