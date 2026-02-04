/**
 * Server Command Executor
 * 
 * Utility for executing server start commands on desktop platforms.
 * This module provides a way to start CouchDB tunnel/server from Obsidian.
 */

import { Logger, LOG_LEVEL_INFO, LOG_LEVEL_NOTICE, LOG_LEVEL_VERBOSE } from "octagonal-wheels/common/logger";

export interface ServerCommandResult {
    success: boolean;
    error?: string;
    output?: string;
}

/**
 * Check if server command execution is available on this platform.
 * Must be called at runtime since Platform is only available after Obsidian loads.
 */
export function isServerCommandAvailable(): boolean {
    try {
        // Dynamic import to avoid issues during testing
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Platform } = require("obsidian");
        return Platform?.isDesktop ?? false;
    } catch {
        return false;
    }
}

/**
 * Execute a server start command.
 * 
 * @param command - The command to execute (e.g., "cloudflared tunnel run my-tunnel")
 * @param forceExecute - Skip platform check (for testing)
 * @returns Promise with the result of the command execution
 */
export async function executeServerCommand(command: string, forceExecute: boolean = false): Promise<ServerCommandResult> {
    if (!command || command.trim() === "") {
        return {
            success: false,
            error: "No server start command configured",
        };
    }

    if (!forceExecute && !isServerCommandAvailable()) {
        return {
            success: false,
            error: "Server command execution is only available on desktop platforms",
        };
    }

    try {
        // Use require for Node modules in Electron/Obsidian (dynamic import doesn't work)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { exec } = require("child_process");
        
        Logger(`[Server Control] Executing: ${command}`, LOG_LEVEL_NOTICE);
        
        return new Promise((resolve) => {
            // Use exec with a timeout and detached mode for background processes
            const child = exec(command, {
                timeout: 5000, // 5 second timeout for initial spawn
                windowsHide: true,
            }, (error, stdout, stderr) => {
                if (error) {
                    // Check if it's just a timeout (which is expected for long-running processes)
                    if (error.killed) {
                        Logger(`Server command started (running in background)`, LOG_LEVEL_VERBOSE);
                        resolve({
                            success: true,
                            output: "Command started in background",
                        });
                        return;
                    }
                    
                    const errorMessage = `Server command failed: ${error.message}${stderr ? ` - ${stderr}` : ""}`;
                    Logger(errorMessage, LOG_LEVEL_NOTICE);
                    resolve({
                        success: false,
                        error: errorMessage,
                    });
                    return;
                }
                
                Logger(`Server command completed: ${stdout}`, LOG_LEVEL_VERBOSE);
                resolve({
                    success: true,
                    output: stdout,
                });
            });

            // Detach the child process so it continues running after timeout
            child.unref?.();
        });
    } catch (err) {
        const errorMessage = `Failed to execute server command: ${err instanceof Error ? err.message : String(err)}`;
        Logger(errorMessage, LOG_LEVEL_NOTICE);
        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Execute server command and wait for connection to become available.
 * 
 * @param command - The command to execute
 * @param checkConnection - Function to check if connection is now available
 * @param retryDelayMs - Delay between connection checks (default: 3000ms)
 * @param maxRetries - Maximum number of retries (default: 5)
 * @param forceExecute - Skip platform check (for testing)
 * @returns Promise with success status
 */
export async function executeServerCommandAndWaitForConnection(
    command: string,
    checkConnection: () => Promise<boolean>,
    retryDelayMs: number = 3000,
    maxRetries: number = 5,
    forceExecute: boolean = false
): Promise<ServerCommandResult> {
    const result = await executeServerCommand(command, forceExecute);
    
    if (!result.success) {
        return result;
    }

    Logger(`Waiting for server to become available...`, LOG_LEVEL_INFO);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Wait before checking
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        
        Logger(`Connection check attempt ${attempt}/${maxRetries}...`, LOG_LEVEL_VERBOSE);
        
        try {
            const isConnected = await checkConnection();
            if (isConnected) {
                Logger(`Server is now available after ${attempt} attempt(s)`, LOG_LEVEL_NOTICE);
                return {
                    success: true,
                    output: `Connected after ${attempt} attempt(s)`,
                };
            }
        } catch (err) {
            Logger(`Connection check failed: ${err instanceof Error ? err.message : String(err)}`, LOG_LEVEL_VERBOSE);
        }
    }

    return {
        success: false,
        error: `Server started but connection could not be established after ${maxRetries} attempts`,
    };
}
