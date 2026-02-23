/**
 * Cloudflared command helpers.
 */

function quoteForShell(value: string): string {
    return value.replace(/"/g, '\\"');
}

export function getCloudflaredConfigPath(): string {
    const homeDir = process.env.USERPROFILE || process.env.HOME;
    if (!homeDir) {
        return ".cloudflared/config.yml";
    }
    if (process.platform === "win32") {
        return `${homeDir}\\.cloudflared\\config.yml`;
    }
    return `${homeDir}/.cloudflared/config.yml`;
}

export function buildCloudflaredTunnelRunCommand(tunnelName: string): string {
    const trimmedTunnelName = tunnelName.trim();
    const configPath = getCloudflaredConfigPath();
    const safeTunnelName = quoteForShell(trimmedTunnelName);
    const safeConfigPath = quoteForShell(configPath);
    return `cloudflared --config "${safeConfigPath}" tunnel run "${safeTunnelName}"`;
}