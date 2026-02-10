/**
 * PouchDB Server Manager
 *
 * Manages a lightweight PouchDB Server (CouchDB-compatible) as a child process.
 * Uses `pouchdb-server` npm package — ~15 MB, instant start, no Docker needed.
 *
 * Desktop only.
 */

import { Logger, LOG_LEVEL_INFO, LOG_LEVEL_NOTICE, LOG_LEVEL_VERBOSE } from "octagonal-wheels/common/logger";
import { isServerCommandAvailable, type ServerCommandResult } from "./serverCommand";

// ─── Module State (singleton) ────────────────────────────────────────────────

/** Reference to the running pouchdb-server child process */
let serverProcess: ReturnType<typeof import("child_process").spawn> | null = null;
let serverPort: number = 5984;

// ─── Availability Checks ────────────────────────────────────────────────────

/**
 * Try to find `pouchdb-server` on the system.
 * Checks: npx resolution, global install, local node_modules.
 */
export async function isPouchDBServerAvailable(): Promise<{ available: boolean; method: "npx" | "global" | "none" }> {
    if (!isServerCommandAvailable()) {
        return { available: false, method: "none" };
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { execSync } = require("child_process");

        // Check global install first (fastest)
        try {
            execSync("pouchdb-server --version", { timeout: 5000, windowsHide: true, stdio: "pipe" });
            return { available: true, method: "global" };
        } catch {
            // not globally installed
        }

        // Check npx availability
        try {
            execSync("npx --yes pouchdb-server --version", { timeout: 15000, windowsHide: true, stdio: "pipe" });
            return { available: true, method: "npx" };
        } catch {
            // npx not available or pouchdb-server not resolvable
        }

        return { available: false, method: "none" };
    } catch {
        return { available: false, method: "none" };
    }
}

/**
 * Install pouchdb-server globally via npm.
 */
export async function installPouchDBServer(): Promise<ServerCommandResult> {
    if (!isServerCommandAvailable()) {
        return { success: false, error: "Not available on this platform" };
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { exec } = require("child_process");

        Logger("[PouchDB Server] Installing pouchdb-server globally...", LOG_LEVEL_NOTICE);

        return new Promise((resolve) => {
            exec("npm install -g pouchdb-server", {
                timeout: 120000, // 2 min for install
                windowsHide: true,
            }, (error: Error | null, stdout: string, stderr: string) => {
                if (error) {
                    Logger(`[PouchDB Server] Install failed: ${error.message}`, LOG_LEVEL_NOTICE);
                    resolve({ success: false, error: `Install failed: ${error.message}${stderr ? ` - ${stderr}` : ""}` });
                    return;
                }
                Logger("[PouchDB Server] Installed successfully", LOG_LEVEL_NOTICE);
                resolve({ success: true, output: stdout || "Installed successfully" });
            });
        });
    } catch (err) {
        return { success: false, error: `Install error: ${err instanceof Error ? err.message : String(err)}` };
    }
}

// ─── Server Lifecycle ───────────────────────────────────────────────────────

/**
 * Start a PouchDB Server on the specified port.
 *
 * @param port - Port to listen on (default 5984)
 * @param dataDir - Directory to store database files. If empty, uses pouchdb-server default.
 */
export async function startPouchDBServer(
    port: number = 5984,
    dataDir?: string,
): Promise<ServerCommandResult> {
    if (!isServerCommandAvailable()) {
        return { success: false, error: "Not available on this platform" };
    }

    // Already running?
    if (serverProcess && !serverProcess.killed) {
        if (serverPort === port) {
            return { success: true, output: `PouchDB Server already running on port ${port}` };
        }
        // Different port requested — stop old first
        await stopPouchDBServer();
    }

    const availability = await isPouchDBServerAvailable();
    if (!availability.available) {
        return {
            success: false,
            error: "pouchdb-server is not installed. Click 'Install' to install it via npm.",
        };
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { spawn } = require("child_process");

        const args: string[] = ["--port", String(port)];
        if (dataDir) {
            args.push("--dir", dataDir);
        }

        let command: string;
        let spawnArgs: string[];

        if (availability.method === "global") {
            command = "pouchdb-server";
            spawnArgs = args;
        } else {
            // npx
            command = process.platform === "win32" ? "npx.cmd" : "npx";
            spawnArgs = ["--yes", "pouchdb-server", ...args];
        }

        Logger(`[PouchDB Server] Starting: ${command} ${spawnArgs.join(" ")}`, LOG_LEVEL_INFO);

        serverProcess = spawn(command, spawnArgs, {
            detached: false,
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"],
        });

        serverPort = port;

        // Collect early output for diagnostics
        let earlyOutput = "";
        let earlyError = "";

        const stdout = (serverProcess as any).stdout;
        const stderr = (serverProcess as any).stderr;

        if (stdout) {
            stdout.on("data", (data: Buffer) => {
                const text = data.toString();
                earlyOutput += text;
                Logger(`[PouchDB Server] ${text.trim()}`, LOG_LEVEL_VERBOSE);
            });
        }

        if (stderr) {
            stderr.on("data", (data: Buffer) => {
                const text = data.toString();
                earlyError += text;
                Logger(`[PouchDB Server] stderr: ${text.trim()}`, LOG_LEVEL_VERBOSE);
            });
        }

        (serverProcess as any).on("exit", (code: number | null) => {
            Logger(`[PouchDB Server] Process exited with code ${code}`, LOG_LEVEL_INFO);
            serverProcess = null;
        });

        (serverProcess as any).on("error", (err: Error) => {
            Logger(`[PouchDB Server] Process error: ${err.message}`, LOG_LEVEL_NOTICE);
            serverProcess = null;
        });

        // Wait a moment for the server to start, then check if it's alive
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (serverProcess && !serverProcess.killed) {
            Logger(`[PouchDB Server] Running on port ${port}`, LOG_LEVEL_NOTICE);
            return { success: true, output: `PouchDB Server running on port ${port}` };
        } else {
            const errorInfo = earlyError || earlyOutput || "Process exited immediately";
            return { success: false, error: `Server failed to start: ${errorInfo}` };
        }
    } catch (err) {
        return { success: false, error: `Failed to spawn: ${err instanceof Error ? err.message : String(err)}` };
    }
}

/**
 * Stop the running PouchDB Server.
 */
export async function stopPouchDBServer(): Promise<ServerCommandResult> {
    if (!serverProcess || serverProcess.killed) {
        serverProcess = null;
        return { success: true, output: "No server running" };
    }

    try {
        Logger("[PouchDB Server] Stopping...", LOG_LEVEL_INFO);

        // On Windows, we need to kill the process tree
        if (process.platform === "win32") {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { execSync } = require("child_process");
            try {
                const pid = (serverProcess as any).pid;
                if (pid) {
                    execSync(`taskkill /pid ${pid} /T /F`, { windowsHide: true, stdio: "pipe" });
                }
            } catch {
                // Process may already be dead
            }
        } else {
            serverProcess.kill("SIGTERM");
        }

        serverProcess = null;
        Logger("[PouchDB Server] Stopped", LOG_LEVEL_INFO);
        return { success: true, output: "Server stopped" };
    } catch (err) {
        serverProcess = null;
        return { success: false, error: `Stop failed: ${err instanceof Error ? err.message : String(err)}` };
    }
}

/**
 * Check if the PouchDB Server process is currently running.
 */
export function isPouchDBServerRunning(): boolean {
    return serverProcess !== null && !serverProcess.killed;
}

/**
 * Get the port the PouchDB Server is running on.
 */
export function getPouchDBServerPort(): number {
    return serverPort;
}

/**
 * Cleanup: stop the server if running. Call on plugin unload.
 */
export async function cleanupPouchDBServer(): Promise<void> {
    if (isPouchDBServerRunning()) {
        await stopPouchDBServer();
    }
}
