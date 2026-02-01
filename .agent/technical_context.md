# Technical Context

## Architecture
The plugin uses a **Modular Service Hub** architecture.
- **ServiceHub**: `src/modules/services/ObsidianServices.ts`. Central registry for services (Vault, Settings, Replicator).
- **Modules**: Classes in `src/modules/` that register themselves to the ServiceHub.

## Critical Implementation Details
### 1. File Filtering Fix (v0.1.0-fix)
The `ModuleTargetFilter` (`src/modules/core/ModuleTargetFilter.ts`) is **critical**.
- It provides `services.vault.isTargetFile`.
- Without it, `ModuleInitializerFile` crashes during startup scan.
- Ensure this module is always present in `src/main.ts`.

### 2. Build System (v0.2.1)
- **Tool**: `esbuild` (`esbuild.config.mjs`).
- **Optimization**:
    - Removed `terser` (slow) in favor of `esbuild` native minification.
    - Removed `bakei18n` (slow) from the default `build` command.
    - **Fast Build**: `npm run build` (< 1s).
    - **Full Build**: `npm run build:with-i18n` (if translations change).

### 3. Dependencies
- **PouchDB**: Used for local database.
- **CouchDB**: Remote backend (Self-hosted).
- **TypeScript**: Primary language.

## Key Files
- `src/main.ts`: Plugin entry point. **Modules are registered here.**
- `esbuild.config.mjs`: Build script.
- `package.json`: Scripts and dependencies.
- `src/lib/src/common/types.ts`: Default settings (`DEFAULT_SETTINGS`).
- `src/modules/essentialObsidian/ModuleObsidianMenu.ts`: Ribbon icon and main commands.
