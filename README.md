# Just Sync

**Just Sync** is a streamlined, personal fork of the [Self-hosted LiveSync](https://github.com/vrtmrz/obsidian-livesync) plugin for Obsidian.

It is designed with a single goal: **Reliable, self-hosted synchronization using CouchDB.**

## Why "Just Sync"?
The original LiveSync plugin is a masterpiece of flexibility, supporting P2P (WebRTC), Object Storage (S3/MinIO), and CouchDB. However, for users who only need a robust database-backed sync, the extra features can add complexity and build weight.

**Just Sync removes:**
- ❌ Peer-to-Peer (WebRTC) connectivity
- ❌ Object Storage (S3/MinIO/R2) support
- ❌ Complex setup wizards for discontinued services

**Just Sync keeps:**
- ✅ The core CouchDB replication engine (PouchDB <-> CouchDB)
- ✅ End-to-End Encryption (E2EE)
- ✅ Conflict resolution
- ✅ Platform native performance

## Requirements

1.  **Obsidian**
2.  **A CouchDB Instance** (Self-hosted via Docker, Cloudant, etc.)

## Installation

Currently, this plugin is distributed as a manual build.

1.  Download the `main.js`, `manifest.json`, and `styles.css` from the releases (or build `dist` folder).
2.  Create a folder `just-sync` in your vault's `.obsidian/plugins/` directory.
3.  Place the files in that folder.
4.  Reload Obsidian and enable "Just Sync".

## Setup Guide

### 1. Prepare your CouchDB
You need a CouchDB server running and accessible.
👉 **[Read the CouchDB Setup Guide](docs/setup_couchdb.md)**

### 2. Configure the Plugin
1. Open Obsidian Settings > **Just Sync**.
2. Go to **Remote Configuration**.
3. Enter your CouchDB connection details:
    - **URI**: `http://your-server:5984` (or `https://...`)
    - **Username**: Your CouchDB username
    - **Password**: Your CouchDB password
    - **Database Name**: e.g., `obsidian_sync`
4. Click **Check** to verify connectivity.
5. Enable **End-to-End Encryption** (Highly Recommended) and set a passphrase.
6. Click **Apply** and then enable the plugin synchronization in the main settings.

## Development

To build this plugin from source:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build for development (watch mode)
npm run dev
```

The build artifacts will be in the `dist/` directory.

## License

Based on Obsidian LiveSync. Licensed under the MIT License.
