# Just Sync

![Version](https://img.shields.io/badge/version-0.2.11-blue.svg)

**Just Sync** is a streamlined fork of [Self-hosted LiveSync](https://github.com/vrtmrz/obsidian-livesync) for Obsidian.

It focuses on one path only: **reliable CouchDB synchronization**.

## Current Scope (v0.2.11)

**Just Sync includes:**
- ✅ CouchDB sync (PouchDB ↔ CouchDB)
- ✅ End-to-End Encryption (E2EE)
- ✅ Conflict handling and maintenance tools
- ✅ Desktop service controls for local backends

**Just Sync excludes:**
- ❌ Peer-to-Peer (WebRTC) sync
- ❌ Object Storage backends (S3 / MinIO / R2)

## Recent Changes

- **v0.2.11**
    - Removed deprecated P2P and Object Storage settings/UI
    - Simplified settings to CouchDB-only workflow
- **v0.2.10**
    - Replaced Docker-dependent local flow with lightweight options:
        - **PouchDB Server** backend (installable via npm)
        - **Native CouchDB** backend (uses OS-installed service)
    - Added backend selector and service controls in settings

Full release notes: [updates.md](updates.md)

## Requirements

1. **Obsidian**
2. **CouchDB endpoint**, using one of these options:
     - Managed/self-hosted CouchDB (Cloudant, VPS, Docker, etc.)
     - Desktop local backend managed by plugin service control:
         - PouchDB Server
         - Native CouchDB

## Installation

Manual install:

1. Download `main.js`, `manifest.json`, and `styles.css`.
2. Create folder `just-sync` under `.obsidian/plugins/`.
3. Put those files in `.obsidian/plugins/just-sync/`.
4. Reload Obsidian and enable **Just Sync**.

## Setup Guide

### 1) Prepare CouchDB

Bring up your CouchDB endpoint (remote or local).

For server setup details, see: [docs/setup_couchdb.md](docs/setup_couchdb.md)

### 2) Configure Just Sync

1. Open **Settings → Just Sync → Remote Configuration**.
2. Use **CouchDB** remote mode.
3. Fill:
     - **URI**: `http://your-server:5984` or `https://your-domain`
     - **Username**
     - **Password**
     - **Database Name** (for example `obsidian_sync`)
4. Click **Check** to validate connection.
5. Enable **End-to-End Encryption** and set a strong passphrase.
6. Click **Apply**.

### 3) Optional: Desktop Service Control

On desktop, you can use built-in service controls to run a local backend:

- Select backend: **PouchDB Server** or **Native CouchDB**
- Start/Stop service from settings
- Use **Start All Services** when working with tunnel workflows

### 4) Use Sync

- **Auto Sync** runs in the background.
- **Manual Sync** can be triggered from the ribbon action.

## Development

```bash
# Install dependencies
npm install

# Production build
npm run build

# Build with i18n regeneration
npm run build:with-i18n

# Watch mode
npm run dev

# Build and deploy to local Obsidian plugin directory
npm run build:deploy
```

Build output is generated in `dist/` (and deployed path when using `build:deploy`).

## License

Based on Obsidian LiveSync. Licensed under MIT.
