# Project Overview: Just Sync

**Just Sync** is a personal fork of the **obsidian-livesync** plugin.

## Core Philosophy
- **Reliable, self-hosted synchronization using CouchDB.**
- Removal of complex, unused features (P2P, MinIO/S3, etc.).
- "Set it and forget it" default configuration.

## Key Changes from Upstream
1.  **Feature Stripping**: Removed Peer-to-Peer (WebRTC) and Object Storage modules. Refocused specifically on CouchDB.
2.  **Rebranding**: Renamed to "Just Sync", Command "Just-Sync now!".
3.  **Defaults**: Adjusted default settings (`customChunkSize: 60`, `usePluginSyncV2`) to be optimal for CouchDB out of the box.

## Directory Structure
- `src/main.ts`: Entry point. definition of the plugin class and module loading.
- `src/modules/`: Modular architecture.
    - `modules/core/`: Core logic (Replicator, Database).
    - `modules/features/`: UI and user-facing features.
- `src/lib/`: Shared libraries (PouchDB adapters, replication logic).
