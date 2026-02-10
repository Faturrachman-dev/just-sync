# Just Sync Architecture

This document describes the internal architecture of Just Sync for developers.

## Table of Contents
- [Overview](#overview)
- [Module System](#module-system)
- [Service Hub](#service-hub)
- [Key Components](#key-components)
- [Build System](#build-system)
- [File Structure](#file-structure)

---

## Overview

Just Sync is built on a **Modular Service Hub** architecture. The plugin is composed of many small, focused modules that register themselves to a central service hub. This allows for clean separation of concerns and easy feature toggling.

```
┌─────────────────────────────────────────────────────────┐
│                    ObsidianLiveSyncPlugin               │
│                       (src/main.ts)                     │
├─────────────────────────────────────────────────────────┤
│                      Service Hub                        │
│              (src/modules/services/)                    │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│  Vault   │ Settings │Replicator│   UI     │ Lifecycle  │
│ Service  │ Service  │ Service  │ Service  │  Service   │
├──────────┴──────────┴──────────┴──────────┴────────────┤
│                      Modules                            │
│     (core/ | coreFeatures/ | features/ | essential/)   │
└─────────────────────────────────────────────────────────┘
```

---

## Module System

### Module Types

| Folder | Purpose | Example |
|--------|---------|---------|
| `modules/core/` | Core sync logic (database, replication) | `ModuleReplicator`, `ModulePouchDB` |
| `modules/coreFeatures/` | Core features (conflict resolution) | `ModuleConflictResolver` |
| `modules/essential/` | Required for startup | `ModuleInitializerFile`, `ModuleMigration` |
| `modules/essentialObsidian/` | Obsidian-specific essentials | `ModuleObsidianMenu`, `ModuleObsidianAPI` |
| `modules/features/` | User-facing features | `ModuleLog`, `ModuleObsidianSetting` |
| `modules/extras/` | Development/testing | `ModuleDev`, `ModuleIntegratedTest` |

### Module Lifecycle

1. **Registration**: Modules are instantiated in `src/main.ts` and added to the `modules` array.
2. **Binding**: Each module's `onBindFunction()` is called, allowing it to register handlers on the ServiceHub.
3. **Initialization**: The `onLoad()` lifecycle triggers `appLifecycle.onInitialise` handlers.
4. **Ready**: After workspace is ready, `appLifecycle.onReady` is triggered.

### Creating a Module

```typescript
// src/modules/features/MyModule.ts
import { AbstractObsidianModule } from "../AbstractObsidianModule.ts";

export class MyModule extends AbstractObsidianModule {
    onBindFunction(core: typeof this.plugin, services: typeof core.services): void {
        // Register handlers
        services.appLifecycle.onLoaded.addHandler(this._onLoad.bind(this));
    }

    private _onLoad(): Promise<boolean> {
        // Do something on load
        return Promise.resolve(true);
    }
}
```

---

## Service Hub

The Service Hub (`src/modules/services/ObsidianServices.ts`) is the central registry for all services.

### Key Services

| Service | Purpose | Access |
|---------|---------|--------|
| `services.vault` | File operations, target filtering | `isTargetFile()`, `getActiveFilePath()` |
| `services.setting` | Settings management | `saveSettingData()`, `realiseSetting()` |
| `services.replication` | Sync operations | `replicate()`, `isReplicationReady()` |
| `services.replicator` | Replicator factory | `getNewReplicator()`, `getActiveReplicator()` |
| `services.appLifecycle` | Plugin lifecycle events | `onLoad`, `onReady`, `isSuspended()` |
| `services.UI` | User interface helpers | `confirm` |
| `services.conflict` | Conflict detection | `queueCheckForIfOpen()` |

### Accessing Services

From any module:
```typescript
this.services.vault.isTargetFile(path);
this.services.replication.replicate(true);
```

---

## Key Components

### 1. Entry Point (`src/main.ts`)

- Defines `ObsidianLiveSyncPlugin` class (extends Obsidian's `Plugin`).
- Contains `modules` array where all modules are registered.
- Contains `addOns` array for legacy command handlers.

**Critical**: The order of modules in the array can matter for dependencies.

### 2. Replication (`src/lib/src/replication/`)

| File | Purpose |
|------|---------|
| `LiveSyncAbstractReplicator.ts` | Base class for all replicators |
| `couchdb/LiveSyncReplicator.ts` | CouchDB-specific replication logic |

Key methods:
- `tryConnectRemote()`: Test connection to remote database
- `openReplication()`: Start continuous sync
- `closeReplication()`: Stop sync

### 3. Database (`src/lib/src/pouchdb/`)

| File | Purpose |
|------|---------|
| `LiveSyncLocalDB.ts` | Local PouchDB wrapper |
| `chunks.ts` | Chunk management for large files |

### 4. Settings (`src/lib/src/common/types.ts`)

- `ObsidianLiveSyncSettings`: Main settings interface
- `DEFAULT_SETTINGS`: Default values for all settings
- `RemoteDBSettings`: CouchDB connection settings

### 5. UI (`src/modules/features/SettingDialogue/`)

| File | Purpose |
|------|---------|
| `ObsidianLiveSyncSettingTab.ts` | Main settings tab controller |
| `PaneRemoteConfig.ts` | Remote server configuration pane |
| `SetupWizard/` | Setup wizard dialogs (Svelte components) |

---

## Build System

### Commands

| Command | Purpose | Speed |
|---------|---------|-------|
| `npm run build` | Production build (fast) | ~1s |
| `npm run build:with-i18n` | Build with translation recompilation | ~10s |
| `npm run dev` | Watch mode for development | - |

### Pipeline

1. **esbuild** (`esbuild.config.mjs`): Bundles TypeScript to JavaScript
2. **Svelte**: Compiles `.svelte` components
3. **Minification**: esbuild's native minification (replaced Terser for speed)

### Output

Build artifacts are placed in `dist/`:
- `main.js` - Plugin code
- `manifest.json` - Plugin metadata
- `styles.css` - Plugin styles

---

## File Structure

```
src/
├── main.ts                 # Entry point, module registration
├── deps.ts                 # Re-exports Obsidian APIs
├── common/
│   ├── events.ts           # Event hub constants
│   ├── stores.ts           # Svelte stores
│   └── utils.ts            # Utility functions
├── lib/
│   └── src/
│       ├── common/
│       │   ├── types.ts    # Settings, types, DEFAULT_SETTINGS
│       │   ├── logger.ts   # Logging utilities
│       │   └── i18n.ts     # Internationalization
│       ├── pouchdb/        # Local database
│       └── replication/    # Remote sync
│           └── couchdb/    # CouchDB replicator
├── modules/
│   ├── AbstractModule.ts           # Base module class
│   ├── AbstractObsidianModule.ts   # Obsidian-specific base
│   ├── services/                   # Service Hub
│   ├── core/                       # Core modules
│   ├── coreFeatures/               # Core feature modules
│   ├── essential/                  # Essential modules
│   ├── essentialObsidian/          # Obsidian essentials
│   ├── features/                   # Feature modules
│   │   └── SettingDialogue/        # Settings UI
│   └── extras/                     # Dev/test modules
└── features/                       # Legacy addons
    ├── ConfigSync/                 # Config sync feature
    └── HiddenFileSync/             # Hidden file sync
```

---

## Critical Implementation Notes

### 1. ModuleTargetFilter is Required
The `ModuleTargetFilter` (`src/modules/core/ModuleTargetFilter.ts`) provides `services.vault.isTargetFile()`. Without it, `ModuleInitializerFile` crashes during startup. **Always ensure this module is in the modules array.**

### 2. Settings Location
- **Interface**: `src/lib/src/common/types.ts` (search for `ObsidianLiveSyncSettings`)
- **Defaults**: Same file, `DEFAULT_SETTINGS` constant
- **UI**: `src/modules/features/SettingDialogue/`

### 3. Adding a New Setting

1. Add to interface in `types.ts`
2. Add default value in `DEFAULT_SETTINGS`
3. Add UI in appropriate pane (e.g., `PaneRemoteConfig.ts`)
4. Access via `this.settings.yourSetting` in modules

### 4. Connection Flow

```
User clicks "Just-Sync now!"
    ↓
ModuleObsidianMenu → services.replication.replicate()
    ↓
ModuleReplicator → core.replicator.openReplication()
    ↓
LiveSyncCouchDBReplicator → connectRemoteCouchDB()
    ↓
PouchDB ↔ CouchDB (HTTP)
```
