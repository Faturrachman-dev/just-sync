/**
 * Service Control
 *
 * Orchestrates CouchDB backends (PouchDB Server or Native) and Cloudflared tunnels.
 * Desktop only — all operations check Platform.isDesktop before executing.
 */

import { Logger, LOG_LEVEL_INFO, LOG_LEVEL_NOTICE, LOG_LEVEL_VERBOSE } from "octagonal-wheels/common/logger";
import { executeServerCommand, type ServerCommandResult } from "./serverCommand";
import {
    startPouchDBServer,
    stopPouchDBServer,
    isPouchDBServerRunning,
    cleanupPouchDBServer,
} from "./pouchdbServer";
import {
    startNativeCouchDB,
    stopNativeCouchDB,
    isNativeCouchDBRunning,
    detectNativeCouchDB,
    type NativeCouchDBInfo,
} from "./nativeCouchDB";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CouchDBBackend = "" | "pouchdb-server" | "native";

export type ServiceStatus = "running" | "stopped" | "unknown" | "error";

export interface ServiceState {
    couchdb: ServiceStatus;
    couchdbBackendLabel: string;
    cloudflared: ServiceStatus;
    couchdbConfigured: boolean;
}

export interface CouchDBConfig {
    backend: CouchDBBackend;
    port: number;
    dataDir: string;
    username: string;
    password: string;
}

// ─── Backend Dispatch ────────────────────────────────────────────────────────

/**
 * Start the CouchDB backend based on user selection.
 */
export async function startCouchDB(config: CouchDBConfig): Promise<ServerCommandResult> {
    switch (config.backend) {
        case "pouchdb-server":
            return await startPouchDBServer(config.port, config.dataDir || undefined);
        case "native":
            return await startNativeCouchDB();
        default:
            return { success: false, error: "No CouchDB backend configured" };
    }
}

/**
 * Stop the CouchDB backend.
 */
export async function stopCouchDB(backend: CouchDBBackend): Promise<ServerCommandResult> {
    switch (backend) {
        case "pouchdb-server":
            return await stopPouchDBServer();
        case "native":
            return await stopNativeCouchDB();
        default:
            return { success: true, output: "No backend to stop" };
    }
}

/**
 * Check if the selected CouchDB backend is running.
 */
export async function isCouchDBRunning(backend: CouchDBBackend): Promise<boolean> {
    switch (backend) {
        case "pouchdb-server":
            return isPouchDBServerRunning();
        case "native":
            return await isNativeCouchDBRunning();
        default:
            return false;
    }
}

/**
 * Get display label for the current backend.
 */
export function getBackendLabel(backend: CouchDBBackend): string {
    switch (backend) {
        case "pouchdb-server": return "PouchDB Server";
        case "native": return "Native CouchDB";
        default: return "None";
    }
}

// ─── Auto-Detection ─────────────────────────────────────────────────────────

/**
 * Auto-detect available CouchDB backends on this system.
 */
export async function detectAvailableBackends(): Promise<{
    pouchdbServer: boolean;
    native: NativeCouchDBInfo;
}> {
    const { isPouchDBServerAvailable } = await import("./pouchdbServer");

    const [pouchdb, native] = await Promise.all([
        isPouchDBServerAvailable(),
        detectNativeCouchDB(),
    ]);

    return {
        pouchdbServer: pouchdb.available,
        native,
    };
}

// ─── CouchDB Auto-Configuration ─────────────────────────────────────────────

/**
 * Configure a CouchDB instance for use with Obsidian sync.
 * This replicates what couchdb-init.sh does, but via HTTP API.
 * Works on all platforms (uses Obsidian's requestUrl).
 *
 * Note: For PouchDB Server, most settings are not needed (no auth, built-in CORS),
 * but the function runs safely — failures on individual steps are reported, not fatal.
 */
export async function configureCouchDB(
    hostname: string,
    username: string,
    password: string,
    requestFn: (params: {
        url: string;
        method: string;
        headers: Record<string, string>;
        body?: string;
        contentType?: string;
    }) => Promise<{ status: number; text: string }>,
): Promise<ServerCommandResult> {
    const node = "_local";
    const auth = btoa(`${username}:${password}`);
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
    };

    const steps: Array<{ desc: string; method: string; path: string; body: string }> = [
        {
            desc: "Enable single node setup",
            method: "POST",
            path: "/_cluster_setup",
            body: JSON.stringify({
                action: "enable_single_node",
                username,
                password,
                bind_address: "0.0.0.0",
                port: 5984,
                singlenode: true,
            }),
        },
        { desc: "Require valid user (chttpd)", method: "PUT", path: `/_node/${node}/_config/chttpd/require_valid_user`, body: '"true"' },
        { desc: "Require valid user (auth)", method: "PUT", path: `/_node/${node}/_config/chttpd_auth/require_valid_user`, body: '"true"' },
        { desc: "Set WWW-Authenticate header", method: "PUT", path: `/_node/${node}/_config/httpd/WWW-Authenticate`, body: '"Basic realm=\\"couchdb\\""' },
        { desc: "Enable CORS (httpd)", method: "PUT", path: `/_node/${node}/_config/httpd/enable_cors`, body: '"true"' },
        { desc: "Enable CORS (chttpd)", method: "PUT", path: `/_node/${node}/_config/chttpd/enable_cors`, body: '"true"' },
        { desc: "Set max HTTP request size", method: "PUT", path: `/_node/${node}/_config/chttpd/max_http_request_size`, body: '"4294967296"' },
        { desc: "Set max document size", method: "PUT", path: `/_node/${node}/_config/couchdb/max_document_size`, body: '"50000000"' },
        { desc: "Enable CORS credentials", method: "PUT", path: `/_node/${node}/_config/cors/credentials`, body: '"true"' },
        { desc: "Set CORS origins", method: "PUT", path: `/_node/${node}/_config/cors/origins`, body: '"app://obsidian.md,capacitor://localhost,http://localhost"' },
    ];

    const failed: string[] = [];
    for (const step of steps) {
        try {
            Logger(`[CouchDB Setup] ${step.desc}...`, LOG_LEVEL_VERBOSE);
            const url = `${hostname}${step.path}`;
            const result = await requestFn({
                url,
                method: step.method,
                headers,
                body: step.body,
                contentType: "application/json",
            });
            if (result.status >= 400) {
                failed.push(`${step.desc}: HTTP ${result.status}`);
                Logger(`[CouchDB Setup] Failed: ${step.desc} (HTTP ${result.status})`, LOG_LEVEL_VERBOSE);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            failed.push(`${step.desc}: ${msg}`);
            Logger(`[CouchDB Setup] Error: ${step.desc} - ${msg}`, LOG_LEVEL_VERBOSE);
        }
    }

    if (failed.length > 0) {
        return {
            success: false,
            error: `Failed ${failed.length}/${steps.length} steps:\n${failed.join("\n")}`,
        };
    }

    Logger("[CouchDB Setup] All configuration steps completed successfully", LOG_LEVEL_NOTICE);
    return { success: true, output: `All ${steps.length} configuration steps completed` };
}

// ─── Combined Service Control ────────────────────────────────────────────────

/**
 * Start all configured services (CouchDB backend + Cloudflared).
 */
export async function startAllServices(
    couchConfig: CouchDBConfig | undefined,
    tunnelName: string | undefined,
    onStatusUpdate: (message: string) => void,
): Promise<ServerCommandResult> {
    const results: string[] = [];
    const errors: string[] = [];

    // 1. Start CouchDB if configured
    if (couchConfig && couchConfig.backend) {
        onStatusUpdate(`⏳ Starting ${getBackendLabel(couchConfig.backend)}...`);
        const couchResult = await startCouchDB(couchConfig);
        if (couchResult.success) {
            results.push(`${getBackendLabel(couchConfig.backend)}: ${couchResult.output || "Started"}`);
        } else {
            errors.push(`${getBackendLabel(couchConfig.backend)}: ${couchResult.error || "Failed"}`);
        }
    }

    // 2. Start Cloudflared if configured
    if (tunnelName && tunnelName.trim()) {
        onStatusUpdate("⏳ Starting Cloudflared tunnel...");
        const tunnelResult = await executeServerCommand(`cloudflared tunnel run "${tunnelName}"`);
        if (tunnelResult.success) {
            results.push("Cloudflared: " + (tunnelResult.output || "Started"));
        } else {
            errors.push("Cloudflared: " + (tunnelResult.error || "Failed"));
        }
    }

    if (errors.length > 0) {
        return {
            success: results.length > 0,
            output: results.join(" | "),
            error: errors.join(" | "),
        };
    }

    if (results.length === 0) {
        return { success: false, error: "No services configured. Select a backend or set a tunnel name first." };
    }

    return { success: true, output: results.join(" | ") };
}

/**
 * Get the current status of all services.
 */
export async function getServiceStatus(
    backend: CouchDBBackend,
    tunnelName: string | undefined,
): Promise<ServiceState> {
    const state: ServiceState = {
        couchdb: "unknown",
        couchdbBackendLabel: getBackendLabel(backend),
        cloudflared: "unknown",
        couchdbConfigured: false,
    };

    if (backend) {
        try {
            const running = await isCouchDBRunning(backend);
            state.couchdb = running ? "running" : "stopped";
        } catch {
            state.couchdb = "error";
        }
    } else {
        state.couchdb = "stopped";
    }

    if (tunnelName && tunnelName.trim()) {
        state.cloudflared = "unknown";
    } else {
        state.cloudflared = "stopped";
    }

    return state;
}

/**
 * Cleanup all services on plugin unload.
 */
export async function cleanupAllServices(): Promise<void> {
    await cleanupPouchDBServer();
}
