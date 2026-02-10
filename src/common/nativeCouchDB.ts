/**
 * Native CouchDB Service Manager
 *
 * Detects and manages a locally installed CouchDB service via OS commands.
 * Supports Windows (sc/net), Linux (systemctl), and macOS (brew services).
 *
 * Desktop only.
 */

import { Logger, LOG_LEVEL_INFO, LOG_LEVEL_NOTICE, LOG_LEVEL_VERBOSE } from "octagonal-wheels/common/logger";
import { isServerCommandAvailable, type ServerCommandResult } from "./serverCommand";

// ─── Types ──────────────────────────────────────────────────────────────────

export type NativePlatform = "windows" | "linux" | "macos" | "unknown";
export type ServiceManager = "sc" | "systemctl" | "brew" | "none";

export interface NativeCouchDBInfo {
    platform: NativePlatform;
    serviceManager: ServiceManager;
    detected: boolean;
    running: boolean;
}

// ─── Platform Detection ─────────────────────────────────────────────────────

function getPlatform(): NativePlatform {
    if (!isServerCommandAvailable()) return "unknown";
    switch (process.platform) {
        case "win32": return "windows";
        case "darwin": return "macos";
        case "linux": return "linux";
        default: return "unknown";
    }
}

function execSyncSafe(cmd: string, timeout = 5000): string | null {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { execSync } = require("child_process");
        const result = execSync(cmd, { timeout, windowsHide: true, stdio: "pipe" });
        return result.toString().trim();
    } catch {
        return null;
    }
}

// ─── Detection ──────────────────────────────────────────────────────────────

/**
 * Detect if CouchDB is installed natively and which service manager controls it.
 */
export async function detectNativeCouchDB(): Promise<NativeCouchDBInfo> {
    const platform = getPlatform();
    const info: NativeCouchDBInfo = {
        platform,
        serviceManager: "none",
        detected: false,
        running: false,
    };

    if (platform === "unknown") return info;

    try {
        switch (platform) {
            case "windows": {
                // Check Windows service
                const scResult = execSyncSafe('sc query "Apache CouchDB"');
                if (scResult && scResult.includes("SERVICE_NAME")) {
                    info.serviceManager = "sc";
                    info.detected = true;
                    info.running = scResult.includes("RUNNING");
                    Logger(`[Native CouchDB] Windows service detected, running: ${info.running}`, LOG_LEVEL_VERBOSE);
                }
                break;
            }
            case "linux": {
                // Check systemctl
                const systemctlResult = execSyncSafe("systemctl is-active couchdb 2>/dev/null");
                if (systemctlResult !== null) {
                    info.serviceManager = "systemctl";
                    info.detected = true;
                    info.running = systemctlResult === "active";
                    Logger(`[Native CouchDB] systemd service detected, running: ${info.running}`, LOG_LEVEL_VERBOSE);
                } else {
                    // Fallback: check if couchdb binary exists
                    const whichResult = execSyncSafe("which couchdb 2>/dev/null");
                    if (whichResult) {
                        info.detected = true;
                        info.serviceManager = "systemctl"; // assume systemctl even if not active
                    }
                }
                break;
            }
            case "macos": {
                // Check brew services
                const brewResult = execSyncSafe("brew services list 2>/dev/null");
                if (brewResult && brewResult.includes("couchdb")) {
                    info.serviceManager = "brew";
                    info.detected = true;
                    // brew services list output: "couchdb started ..." or "couchdb none"
                    info.running = brewResult.split("\n")
                        .filter(line => line.includes("couchdb"))
                        .some(line => line.includes("started"));
                    Logger(`[Native CouchDB] brew service detected, running: ${info.running}`, LOG_LEVEL_VERBOSE);
                }
                break;
            }
        }
    } catch (err) {
        Logger(`[Native CouchDB] Detection error: ${err instanceof Error ? err.message : String(err)}`, LOG_LEVEL_VERBOSE);
    }

    return info;
}

/**
 * Check if native CouchDB service is currently running.
 */
export async function isNativeCouchDBRunning(): Promise<boolean> {
    const info = await detectNativeCouchDB();
    return info.running;
}

// ─── Service Control ────────────────────────────────────────────────────────

/**
 * Start the native CouchDB service.
 */
export async function startNativeCouchDB(): Promise<ServerCommandResult> {
    const info = await detectNativeCouchDB();

    if (!info.detected) {
        return { success: false, error: "CouchDB is not installed on this system" };
    }

    if (info.running) {
        return { success: true, output: "CouchDB is already running" };
    }

    Logger(`[Native CouchDB] Starting via ${info.serviceManager}...`, LOG_LEVEL_NOTICE);

    let cmd: string;
    switch (info.serviceManager) {
        case "sc":
            cmd = 'net start "Apache CouchDB"';
            break;
        case "systemctl":
            cmd = "sudo systemctl start couchdb";
            break;
        case "brew":
            cmd = "brew services start couchdb";
            break;
        default:
            return { success: false, error: `Unknown service manager: ${info.serviceManager}` };
    }

    const result = execSyncSafe(cmd, 15000);
    if (result !== null) {
        // Verify it actually started
        const check = await isNativeCouchDBRunning();
        if (check) {
            Logger("[Native CouchDB] Started successfully", LOG_LEVEL_INFO);
            return { success: true, output: result || "CouchDB started" };
        }
        return { success: false, error: "Command ran but CouchDB doesn't appear to be running" };
    }

    return { success: false, error: `Failed to start CouchDB via '${cmd}'` };
}

/**
 * Stop the native CouchDB service.
 */
export async function stopNativeCouchDB(): Promise<ServerCommandResult> {
    const info = await detectNativeCouchDB();

    if (!info.detected) {
        return { success: false, error: "CouchDB is not installed on this system" };
    }

    if (!info.running) {
        return { success: true, output: "CouchDB is already stopped" };
    }

    Logger(`[Native CouchDB] Stopping via ${info.serviceManager}...`, LOG_LEVEL_NOTICE);

    let cmd: string;
    switch (info.serviceManager) {
        case "sc":
            cmd = 'net stop "Apache CouchDB"';
            break;
        case "systemctl":
            cmd = "sudo systemctl stop couchdb";
            break;
        case "brew":
            cmd = "brew services stop couchdb";
            break;
        default:
            return { success: false, error: `Unknown service manager: ${info.serviceManager}` };
    }

    const result = execSyncSafe(cmd, 15000);
    if (result !== null) {
        Logger("[Native CouchDB] Stopped", LOG_LEVEL_INFO);
        return { success: true, output: result || "CouchDB stopped" };
    }

    return { success: false, error: `Failed to stop CouchDB via '${cmd}'` };
}

/**
 * Get a human-readable description of the detected CouchDB installation.
 */
export async function getNativeCouchDBDescription(): Promise<string> {
    const info = await detectNativeCouchDB();
    if (!info.detected) {
        return "Not detected";
    }

    const managerLabel = {
        sc: "Windows Service",
        systemctl: "systemd",
        brew: "Homebrew",
        none: "unknown",
    }[info.serviceManager];

    const status = info.running ? "running" : "stopped";
    return `${managerLabel} (${info.platform}) — ${status}`;
}
