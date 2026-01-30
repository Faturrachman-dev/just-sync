# Setup a CouchDB server

## Table of Contents

- [Setup a CouchDB server](#setup-a-couchdb-server)
  - [Table of Contents](#table-of-contents)
  - [1. Prepare CouchDB](#1-prepare-couchdb)
    - [A. Using Docker](#a-using-docker)
      - [1. Prepare](#1-prepare)
      - [2. Run docker container](#2-run-docker-container)
    - [B. Using Docker Compose](#b-using-docker-compose)
      - [1. Prepare](#1-prepare-1)
      - [2. Creating Compose file](#2-create-a-docker-composeyml-file-with-the-following-added-to-it)
      - [3. Boot check](#3-run-the-docker-compose-file-to-boot-check)
      - [4. Starting Docker Compose in background](#4-run-the-docker-compose-file-in-the-background)
    - [C. Install CouchDB directly](#c-install-couchdb-directly)
  - [2. Run couchdb-init.sh for initialise](#2-run-couchdb-initsh-for-initialise)
  - [3. Expose CouchDB to the Internet](#3-expose-couchdb-to-the-internet)
  - [4. Client Setup](#4-client-setup)
    - [1. Generate the setup URI on a desktop device or server](#1-generate-the-setup-uri-on-a-desktop-device-or-server)
    - [2. Setup Self-hosted LiveSync to Obsidian](#2-setup-self-hosted-livesync-to-obsidian)
  - [Manual setup information](#manual-setup-information)
    - [Setting up your domain](#setting-up-your-domain)
  - [Reverse Proxies](#reverse-proxies)
    - [Traefik](#traefik)
---

## 1. Prepare CouchDB
### A. Using Docker

#### 1. Prepare
```bash

# Adding environment variables.
export hostname=localhost:5984
export username=goojdasjdas     #Please change as you like.
export password=kpkdasdosakpdsa #Please change as you like

# Creating the save data & configuration directories.
mkdir couchdb-data
mkdir couchdb-etc
```

#### 2. Run docker container
1. Boot Check.
```
$ docker run --name couchdb-for-ols --rm -it -e COUCHDB_USER=${username} -e COUCHDB_PASSWORD=${password} -v ${PWD}/couchdb-data:/opt/couchdb/data -v ${PWD}/couchdb-etc:/opt/couchdb/etc/local.d -p 5984:5984 couchdb
```
> [!WARNING]
> If your container threw an error or exited unexpectedly, please check the permission of couchdb-data, and couchdb-etc.  
> Once CouchDB starts, these directories will be owned by uid:`5984`. Please chown it for that uid again.

2. Enable it in the background
```
$ docker run --name couchdb-for-ols -d --restart always -e COUCHDB_USER=${username} -e COUCHDB_PASSWORD=${password} -v ${PWD}/couchdb-data:/opt/couchdb/data -v ${PWD}/couchdb-etc:/opt/couchdb/etc/local.d -p 5984:5984 couchdb
```

Congrats, move on to [step 2](#2-run-couchdb-initsh-for-initialise)
### B. Using Docker Compose

#### 1. Prepare

```
# Creating the save data & configuration directories.
mkdir couchdb-data
mkdir couchdb-etc
```

#### 2. Create a `docker-compose.yml` file with the following added to it
```
services:
  couchdb:
    image: couchdb:latest
    container_name: couchdb-for-ols
    user: 5984:5984
    environment:
      - COUCHDB_USER=<INSERT USERNAME HERE>  #Please change as you like.
      - COUCHDB_PASSWORD=<INSERT PASSWORD HERE> #Please change as you like.
    volumes:
      - ./couchdb-data:/opt/couchdb/data
      - ./couchdb-etc:/opt/couchdb/etc/local.d
    ports:
      - 5984:5984
    restart: unless-stopped
```

#### 3. Run the Docker Compose file to boot check

```
docker compose up
# Or if using the old version
docker-compose up
```
> [!WARNING]
> If your container threw an error or exited unexpectedly, please check the permission of couchdb-data, and couchdb-etc.  
> Once CouchDB starts, these directories will be owned by uid:`5984`. Please chown it for that uid again.

#### 4. Run the Docker Compose file in the background
If all went well and didn't throw any errors, `CTRL+C` out of it, and then run this command
```
docker compose up -d
# Or if using the old version
docker-compose up -d
```

Congrats, move on to [step 2](#2-run-couchdb-initsh-for-initialise)


### C. Install CouchDB directly
Please refer to the [official document](https://docs.couchdb.org/en/stable/install/index.html). However, we do not have to configure it fully. Just the administrator needs to be configured.

## 2. Run couchdb-init.sh for initialise
```
curl -s https://raw.githubusercontent.com/vrtmrz/obsidian-livesync/main/utils/couchdb/couchdb-init.sh | bash
```

If it results like the following:
```
-- Configuring CouchDB by REST APIs... -->
{"ok":true}
""
""
""
""
""
""
""
""
""
<-- Configuring CouchDB by REST APIs Done!
```

Your CouchDB has been initialised successfully. If you want this manually, please read the script.

If you are using Docker Compose and the above command does not work or displays `ERROR: Hostname missing`, you can try running the following command, replacing the placeholders with your own values:
```
curl -s https://raw.githubusercontent.com/vrtmrz/obsidian-livesync/main/utils/couchdb/couchdb-init.sh | hostname=http://<YOUR SERVER IP>:5984 username=<INSERT USERNAME HERE> password=<INSERT PASSWORD HERE> bash
```

## 3. Expose CouchDB to the Internet

- You can skip this instruction if you using only in intranet and only with desktop devices.
  - For mobile devices, Obsidian requires a valid SSL certificate. Usually, it needs exposing the internet.

Whatever solutions we can use. For simplicity, the following sample uses Cloudflare Zero Trust for testing.

```
cloudflared tunnel --url http://localhost:5984
```

You will then get the following output:

```
2024-02-14T10:35:25Z INF Thank you for trying Cloudflare Tunnel. Doing so, without a Cloudflare account, is a quick way to experiment and try it out. However, be aware that these account-less Tunnels have no uptime guarantee. If you intend to use Tunnels in production you should use a pre-created named tunnel by following: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps
2024-02-14T10:35:25Z INF Requesting new quick Tunnel on trycloudflare.com...
2024-02-14T10:35:26Z INF +--------------------------------------------------------------------------------------------+
2024-02-14T10:35:26Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2024-02-14T10:35:26Z INF |  https://tiles-photograph-routine-groundwater.trycloudflare.com                            |
2024-02-14T10:35:26Z INF +--------------------------------------------------------------------------------------------+
  :
  :
  :
```
Now `https://tiles-photograph-routine-groundwater.trycloudflare.com` is our server. Make it into the background once, please.


## 4. Client Setup (Just Sync)

Once your CouchDB is running, you need to configure the plugin.

### Manual Configuration

1. In Obsidian, open Settings -> **Just Sync**.
2. Go to **Remote Configuration**.
3. Select **CouchDB** (The only option).
4. Fill in your details:
   - **URI**: `http://<your-server-ip>:5984` (or `https://<your-domain>`)
   - **Username**: The one you set in `COUCHDB_USER`.
   - **Password**: The one you set in `COUCHDB_PASSWORD`.
   - **Database Name**: Give it a name like `obsidian_vault`.
5. Click **Check** to test the connection.
   - If it says "Connected", you are good to go!
   - If it fails, check your CORS settings or firewall.
6. **End-to-End Encryption**: Enable this option and set a strong passphrase to encrypt your data on the server.
7. Click **Apply**.
8. Go back to the main General Settings and enable the plugin.


---

## Manual setup information

### Setting up your domain

Set the A record of your domain to point to your server, and host reverse proxy as you like.  
Note: Mounting CouchDB on the top directory is not recommended.  
Using Caddy is a handy way to serve the server with SSL automatically.

I have published [docker-compose.yml and ini files](https://github.com/vrtmrz/self-hosted-livesync-server) that launch Caddy and CouchDB at once. If you are using Traefik you can check the [Reverse Proxies](#reverse-proxies) section below.

And, be sure to check the server log and be careful of malicious access.


## Reverse Proxies

### Traefik

If you are using Traefik, this [docker-compose.yml](https://github.com/vrtmrz/obsidian-livesync/blob/main/docker-compose.traefik.yml) file (also pasted below) has all the right CORS parameters set. It assumes you have an external network called `proxy`.

```yaml
version: "2.1"
services:
  couchdb:
    image: couchdb:latest
    container_name: obsidian-livesync
    user: 1000:1000
    environment:
      - COUCHDB_USER=username
      - COUCHDB_PASSWORD=password
    volumes:
      - ./data:/opt/couchdb/data
      - ./local.ini:/opt/couchdb/etc/local.ini
    # Ports not needed when already passed to Traefik
    #ports:
    #  - 5984:5984
    restart: unless-stopped
    networks:
      - proxy
    labels:
      - "traefik.enable=true"
      # The Traefik Network
      - "traefik.docker.network=proxy"
      # Don't forget to replace 'obsidian-livesync.example.org' with your own domain
      - "traefik.http.routers.obsidian-livesync.rule=Host(`obsidian-livesync.example.org`)"
      # The 'websecure' entryPoint is basically your HTTPS entrypoint. Check the next code snippet if you are encountering problems only; you probably have a working traefik configuration if this is not your first container you are reverse proxying.
      - "traefik.http.routers.obsidian-livesync.entrypoints=websecure"
      - "traefik.http.routers.obsidian-livesync.service=obsidian-livesync"
      - "traefik.http.services.obsidian-livesync.loadbalancer.server.port=5984"
      - "traefik.http.routers.obsidian-livesync.tls=true"
      # Replace the string 'letsencrypt' with your own certificate resolver
      - "traefik.http.routers.obsidian-livesync.tls.certresolver=letsencrypt"
      - "traefik.http.routers.obsidian-livesync.middlewares=obsidiancors"
      # The part needed for CORS to work on Traefik 2.x starts here
      - "traefik.http.middlewares.obsidiancors.headers.accesscontrolallowmethods=GET,PUT,POST,HEAD,DELETE"
      - "traefik.http.middlewares.obsidiancors.headers.accesscontrolallowheaders=accept,authorization,content-type,origin,referer"
      - "traefik.http.middlewares.obsidiancors.headers.accesscontrolalloworiginlist=app://obsidian.md,capacitor://localhost,http://localhost"
      - "traefik.http.middlewares.obsidiancors.headers.accesscontrolmaxage=3600"
      - "traefik.http.middlewares.obsidiancors.headers.addvaryheader=true"
      - "traefik.http.middlewares.obsidiancors.headers.accessControlAllowCredentials=true"

networks:
  proxy:
    external: true
```

Partial `traefik.yml` config file mentioned in above:
```yml
...

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: "websecure"
          scheme: "https"
  websecure:
    address: ":443"

...
```
