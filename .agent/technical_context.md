# Technical Context

## Architecture
The plugin uses a **Modular Service Hub** architecture.
- **ServiceHub**: `src/modules/services/ObsidianServices.ts`. Central registry for services (Vault, Settings, Replicator).
- **Modules**: Classes in `src/modules/` that register themselves to the ServiceHub.
- **Full Documentation**: See `docs/architecture.md` for comprehensive details.

## Critical Implementation Details
### 1. File Filtering Fix (v0.1.0-fix)
The `ModuleTargetFilter` (`src/modules/core/ModuleTargetFilter.ts`) is **critical**.
- It provides `services.vault.isTargetFile`.
- Without it, `ModuleInitializerFile` crashes during startup scan.
- Ensure this module is always present in `src/main.ts`.

### 2. Server Command Feature (v0.2.1)
**Purpose**: Start server (e.g., cloudflared) from within Obsidian.
- **Setting**: `cloudflaredTunnelName` in `CouchDBConnection`.
- **Logic**: Executes `cloudflared tunnel run "<name>"` when started.
- **Utility**: `src/common/serverCommand.ts` (generic executor).
- **UI**: "Server Control (Desktop)" panel in `PaneRemoteConfig.ts`.
- **Tests**: `src/common/serverCommand.unit.test.ts` (11 tests).
- **Security**: Manual button only, no auto-start.
- **Platform**: Desktop only (hidden on mobile via `Platform.isDesktop`).

### 3. Build & Deploy (v0.2.1)
- **Tool**: `esbuild` (`esbuild.config.mjs`).
- **Deploy**: `npm run build:deploy` builds and copies files to plugin folder.
- **Config**: Target path defined in `install-plugin.mjs`.
- **Optimization**:
    - Removed `terser` (slow) in favor of `esbuild` native minification.
    - Removed `bakei18n` (slow) from the default `build` command.
    - **Fast Build**: `npm run build` (< 1s).
    - **Full Build**: `npm run build:with-i18n` (if translations change).

### 4. Testing
- **Framework**: Vitest.
- **Unit Tests**: Files matching `src/**/*.unit.test.ts`.
- **Run**: `npm run test:unit`.
- **Note**: Tests in `test/` folder are for integration (not included in unit).

### 5. Dependencies
- **PouchDB**: Used for local database.
- **CouchDB**: Remote backend (Self-hosted).
- **TypeScript**: Primary language.

## Key Files
- `src/main.ts`: Plugin entry point. **Modules are registered here.**
- `esbuild.config.mjs`: Build script.
- `package.json`: Scripts and dependencies.
- `src/lib/src/common/types.ts`: Default settings (`DEFAULT_SETTINGS`).
- `src/modules/essentialObsidian/ModuleObsidianMenu.ts`: Ribbon icon and main commands.
- `src/common/serverCommand.ts`: Server command execution utility.
- `docs/architecture.md`: Full architecture documentation.
