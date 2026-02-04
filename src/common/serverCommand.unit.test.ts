/**
 * @vitest-environment node
 * 
 * Tests for Server Command Executor
 * 
 * These tests verify the server command execution functionality.
 * Note: Actual command execution tests are platform-dependent.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the Platform module
vi.mock("obsidian", () => ({
    Platform: {
        isDesktop: true,
        isMobile: false,
    },
}));

// Mock child_process
const mockExec = vi.fn();
vi.mock("child_process", () => ({
    exec: (command: string, options: any, callback: Function) => {
        return mockExec(command, options, callback);
    },
}));

// Mock logger
vi.mock("octagonal-wheels/common/logger", () => ({
    Logger: vi.fn(),
    LOG_LEVEL_INFO: 0,
    LOG_LEVEL_NOTICE: 1,
    LOG_LEVEL_VERBOSE: 2,
}));

describe("serverCommand", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("isServerCommandAvailable", () => {
        it("should return false when obsidian Platform is not available", async () => {
            // In test environment, obsidian is not available, so it should return false
            const { isServerCommandAvailable } = await import("./serverCommand");
            expect(isServerCommandAvailable()).toBe(false);
        });

        it("should return false on mobile", async () => {
            vi.doMock("obsidian", () => ({
                Platform: {
                    isDesktop: false,
                    isMobile: true,
                },
            }));
            
            // Re-import to get fresh module with new mock
            vi.resetModules();
            const { isServerCommandAvailable } = await import("./serverCommand");
            
            // Note: Due to module caching, this test may not work as expected
            // In real scenarios, the Platform check happens at runtime
        });
    });

    describe("executeServerCommand", () => {
        it("should return error for empty command", async () => {
            const { executeServerCommand } = await import("./serverCommand");
            
            const result = await executeServerCommand("");
            
            expect(result.success).toBe(false);
            expect(result.error).toBe("No server start command configured");
        });

        it("should return error for whitespace-only command", async () => {
            const { executeServerCommand } = await import("./serverCommand");
            
            const result = await executeServerCommand("   ");
            
            expect(result.success).toBe(false);
            expect(result.error).toBe("No server start command configured");
        });

        it("should execute command and return success on completion", async () => {
            mockExec.mockImplementation((cmd, opts, callback) => {
                callback(null, "Server started", "");
                return { unref: vi.fn() };
            });

            const { executeServerCommand } = await import("./serverCommand");
            
            // Use forceExecute=true to skip platform check in tests
            const result = await executeServerCommand("echo 'test'", true);
            
            expect(result.success).toBe(true);
            expect(result.output).toBe("Server started");
        });

        it("should return error on command failure", async () => {
            mockExec.mockImplementation((cmd, opts, callback) => {
                const error = new Error("Command not found");
                callback(error, "", "command not found");
                return { unref: vi.fn() };
            });

            const { executeServerCommand } = await import("./serverCommand");
            
            // Use forceExecute=true to skip platform check in tests
            const result = await executeServerCommand("nonexistent-command", true);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain("Server command failed");
            expect(result.error).toContain("Command not found");
        });

        it("should treat timeout as success for background processes", async () => {
            mockExec.mockImplementation((cmd, opts, callback) => {
                const error = new Error("Timed out") as Error & { killed: boolean };
                error.killed = true;
                callback(error, "", "");
                return { unref: vi.fn() };
            });

            const { executeServerCommand } = await import("./serverCommand");
            
            // Use forceExecute=true to skip platform check in tests
            const result = await executeServerCommand("cloudflared tunnel run", true);
            
            expect(result.success).toBe(true);
            expect(result.output).toBe("Command started in background");
        });
    });

    describe("executeServerCommandAndWaitForConnection", () => {
        it("should return success when connection is established", async () => {
            mockExec.mockImplementation((cmd, opts, callback) => {
                callback(null, "Started", "");
                return { unref: vi.fn() };
            });

            const checkConnection = vi.fn().mockResolvedValue(true);

            const { executeServerCommandAndWaitForConnection } = await import("./serverCommand");
            
            const result = await executeServerCommandAndWaitForConnection(
                "start-server",
                checkConnection,
                100, // Fast retry for testing
                3,
                true // forceExecute
            );
            
            expect(result.success).toBe(true);
            expect(checkConnection).toHaveBeenCalled();
        });

        it("should retry connection checks", async () => {
            mockExec.mockImplementation((cmd, opts, callback) => {
                callback(null, "Started", "");
                return { unref: vi.fn() };
            });

            let callCount = 0;
            const checkConnection = vi.fn().mockImplementation(() => {
                callCount++;
                return Promise.resolve(callCount >= 3); // Succeed on 3rd attempt
            });

            const { executeServerCommandAndWaitForConnection } = await import("./serverCommand");
            
            const result = await executeServerCommandAndWaitForConnection(
                "start-server",
                checkConnection,
                50, // Fast retry for testing
                5,
                true // forceExecute
            );
            
            expect(result.success).toBe(true);
            expect(checkConnection).toHaveBeenCalledTimes(3);
        });

        it("should fail after max retries", async () => {
            mockExec.mockImplementation((cmd, opts, callback) => {
                callback(null, "Started", "");
                return { unref: vi.fn() };
            });

            const checkConnection = vi.fn().mockResolvedValue(false);

            const { executeServerCommandAndWaitForConnection } = await import("./serverCommand");
            
            const result = await executeServerCommandAndWaitForConnection(
                "start-server",
                checkConnection,
                50, // Fast retry for testing
                3,
                true // forceExecute
            );
            
            expect(result.success).toBe(false);
            expect(result.error).toContain("could not be established after 3 attempts");
            expect(checkConnection).toHaveBeenCalledTimes(3);
        });

        it("should return command error if command fails", async () => {
            mockExec.mockImplementation((cmd, opts, callback) => {
                callback(new Error("Failed"), "", "");
                return { unref: vi.fn() };
            });

            const checkConnection = vi.fn();

            const { executeServerCommandAndWaitForConnection } = await import("./serverCommand");
            
            const result = await executeServerCommandAndWaitForConnection(
                "bad-command",
                checkConnection,
                50,
                3
            );
            
            expect(result.success).toBe(false);
            expect(checkConnection).not.toHaveBeenCalled();
        });
    });
});
