# Setup a CouchDB server

This guide matches the current Just Sync workflow (v0.2.10+):

- CouchDB is the only sync backend.
- Lightweight local options are preferred for desktop:
  - PouchDB Server (managed by plugin service control)
  - Native CouchDB service (managed by plugin service control)

## Table of contents

- [Setup a CouchDB server](#setup-a-couchdb-server)
  - [Table of contents](#table-of-contents)
  - [1. Choose your CouchDB endpoint](#1-choose-your-couchdb-endpoint)
    - [A. Lightweight local backend (recommended for desktop)](#a-lightweight-local-backend-recommended-for-desktop)
    - [B. Existing remote CouchDB](#b-existing-remote-couchdb)
  - [2. Initialize CouchDB defaults](#2-initialize-couchdb-defaults)
  - [3. (Optional) Expose CouchDB to the internet](#3-optional-expose-couchdb-to-the-internet)
  - [4. Configure Just Sync](#4-configure-just-sync)
  - [Troubleshooting checklist](#troubleshooting-checklist)

---

## 1. Choose your CouchDB endpoint

### A. Lightweight local backend (recommended for desktop)

Use the built-in **Server Control** in Just Sync to avoid heavy local stacks.

1. Open **Obsidian Settings → Just Sync → Remote Configuration**.
2. In **Server Control**, choose backend:
   - **PouchDB Server** (npm-based local CouchDB-compatible server), or
   - **Native CouchDB** (OS-installed CouchDB service).
3. Start the selected service from the UI.
4. Use local endpoint values:
   - URI: `http://127.0.0.1:5984`
   - Username / Password: your configured credentials
   - Database name: e.g. `obsidian_vault`

Notes:

- PouchDB Server is the easiest path when CouchDB is not installed yet.
- Native CouchDB is best if you already run CouchDB as a system service.

### B. Existing remote CouchDB

If you already have a remote CouchDB (Cloudant, VPS, managed host, etc.), use it directly.

1. Ensure the server is reachable from all devices.
2. Use HTTPS for mobile and internet-facing setups.
3. Confirm credentials have read/write access to your target database.

If you need fresh CouchDB installation instructions, follow the official docs:

- https://docs.couchdb.org/en/stable/install/index.html

## 2. Initialize CouchDB defaults

Initialize recommended CouchDB settings using the helper script:

```bash
curl -s https://raw.githubusercontent.com/vrtmrz/obsidian-livesync/main/utils/couchdb/couchdb-init.sh | bash
```

If your host, username, or password are not auto-detected, pass them explicitly:

```bash
curl -s https://raw.githubusercontent.com/vrtmrz/obsidian-livesync/main/utils/couchdb/couchdb-init.sh | hostname=http://<YOUR_HOST>:5984 username=<YOUR_USERNAME> password=<YOUR_PASSWORD> bash
```

## 3. (Optional) Expose CouchDB to the internet

Skip this section if all devices are on the same local network and you only sync desktop clients.

For mobile and cross-network sync, use HTTPS and a reverse proxy or tunnel.

Quick tunnel example with Cloudflared:

```bash
cloudflared tunnel --url http://localhost:5984
```

Then use the generated HTTPS URL as your CouchDB URI in Just Sync.

## 4. Configure Just Sync

1. Open **Settings → Just Sync → Remote Configuration**.
2. Keep remote type as **CouchDB**.
3. Fill:
   - **URI**: `http://<your-host>:5984` or `https://<your-domain>`
   - **Username**
   - **Password**
   - **Database Name**: e.g. `obsidian_vault`
4. Click **Check**.
5. Enable **End-to-End Encryption** and set a strong passphrase.
6. Click **Apply**.
7. Enable synchronization in the main Just Sync settings.

## Troubleshooting checklist

- Connection check fails:
  - Verify URI, credentials, and port.
  - Confirm CouchDB is running.
  - Check firewall / reverse proxy rules.
- Works on desktop but not mobile:
  - Use HTTPS with valid certificate.
  - Verify CORS settings on the CouchDB/proxy side.
- Authentication errors:
  - Recheck CouchDB admin/user credentials.
  - Ensure database permissions are correct.
