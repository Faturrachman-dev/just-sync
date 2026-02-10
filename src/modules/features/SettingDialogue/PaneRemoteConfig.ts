import {
    REMOTE_COUCHDB,
    type ObsidianLiveSyncSettings,
} from "../../../lib/src/common/types.ts";
import { $msg } from "../../../lib/src/common/i18n.ts";
import { LiveSyncSetting as Setting } from "./LiveSyncSetting.ts";
import type { ObsidianLiveSyncSettingTab } from "./ObsidianLiveSyncSettingTab.ts";
import type { PageFunctions } from "./SettingPane.ts";
// import { visibleOnly } from "./SettingPane.ts";
import InfoPanel from "./InfoPanel.svelte";
import { writable } from "svelte/store";
import { SveltePanel } from "./SveltePanel.ts";
import {
    getCouchDBConfigSummary,
    getE2EEConfigSummary,
} from "./settingUtils.ts";

import { SetupManager, UserMode } from "../SetupManager.ts";
import { OnDialogSettingsDefault, type AllSettings } from "./settingConstants.ts";
import { Platform } from "../../../deps.ts";
import { executeServerCommand } from "../../../common/serverCommand.ts";
import {
    startCouchDB,
    stopCouchDB,
    isCouchDBRunning,
    getBackendLabel,
    detectAvailableBackends,
    configureCouchDB,
    startAllServices,
    type CouchDBConfig,
    type CouchDBBackend,
} from "../../../common/serviceControl.ts";
import { isPouchDBServerAvailable, installPouchDBServer } from "../../../common/pouchdbServer.ts";
import { getNativeCouchDBDescription } from "../../../common/nativeCouchDB.ts";

function getSettingsFromEditingSettings(editingSettings: AllSettings): ObsidianLiveSyncSettings {
    const workObj = { ...editingSettings } as ObsidianLiveSyncSettings;
    const keys = Object.keys(OnDialogSettingsDefault);
    for (const k of keys) {
        delete (workObj as any)[k];
    }
    return workObj;
}
const toggleActiveSyncClass = (el: HTMLElement, isActive: () => boolean) => {
    if (isActive()) {
        el.addClass("active-pane");
    } else {
        el.removeClass("active-pane");
    }
    return {};
};

export function paneRemoteConfig(
    this: ObsidianLiveSyncSettingTab,
    paneEl: HTMLElement,
    { addPanel, addPane }: PageFunctions
): void {
    const remoteNameMap = {
        [REMOTE_COUCHDB]: $msg("obsidianLiveSyncSettingTab.optionCouchDB"),
        // [REMOTE_MINIO]: $msg("obsidianLiveSyncSettingTab.optionMinioS3R2"),
        // [REMOTE_P2P]: "Only Peer-to-Peer",
    } as const;

    {
        /* E2EE */
        const E2EEInitialProps = {
            info: getE2EEConfigSummary({ ...this.editingSettings }),
        };
        const E2EESummaryWritable = writable(E2EEInitialProps);
        const updateE2EESummary = () => {
            E2EESummaryWritable.set({
                info: getE2EEConfigSummary(this.editingSettings),
            });
        };
        void addPanel(paneEl, "E2EE Configuration", () => {}).then((paneEl) => {
            new SveltePanel(InfoPanel, paneEl, E2EESummaryWritable);
            const setupButton = new Setting(paneEl).setName("Configure E2EE");
            setupButton
                .addButton((button) =>
                    button
                        .onClick(async () => {
                            const setupManager = this.plugin.getModule(SetupManager);
                            const originalSettings = getSettingsFromEditingSettings(this.editingSettings);
                            await setupManager.onlyE2EEConfiguration(UserMode.Update, originalSettings);
                            updateE2EESummary();
                        })
                        .setButtonText("Configure")
                        .setWarning()
                )
                .addButton((button) =>
                    button
                        .onClick(async () => {
                            const setupManager = this.plugin.getModule(SetupManager);
                            const originalSettings = getSettingsFromEditingSettings(this.editingSettings);
                            await setupManager.onConfigureManually(originalSettings, UserMode.Update);
                            updateE2EESummary();
                        })
                        .setButtonText("Configure And Change Remote")
                        .setWarning()
                );
            updateE2EESummary();
        });
    }
    {
        void addPanel(paneEl, $msg("obsidianLiveSyncSettingTab.titleRemoteServer"), () => {}).then((paneEl) => {
            const setting = new Setting(paneEl).setName("Active Remote Configuration");

            const el = setting.controlEl.createDiv({});
            el.setText(`${remoteNameMap[this.editingSettings.remoteType] || " - "}`);
            setting.addButton((button) =>
                button
                    .setButtonText("Change Remote and Setup")
                    .setCta()
                    .onClick(async () => {
                        const setupManager = this.plugin.getModule(SetupManager);
                        const originalSettings = getSettingsFromEditingSettings(this.editingSettings);
                        await setupManager.onSelectServer(originalSettings, UserMode.Update);
                    })
            );
        });
    }
    {
        const initialProps = {
            info: getCouchDBConfigSummary(this.editingSettings),
        };
        const summaryWritable = writable(initialProps);
        const updateSummary = () => {
            summaryWritable.set({
                info: getCouchDBConfigSummary(this.editingSettings),
            });
        };
        void addPanel(paneEl, $msg("obsidianLiveSyncSettingTab.titleCouchDB"), () => {}).then((paneEl) => {
            new SveltePanel(InfoPanel, paneEl, summaryWritable);
            const setupButton = new Setting(paneEl).setName("Configure Remote");
            setupButton
                .addButton((button) =>
                    button
                        .setButtonText("Configure")
                        .setCta()
                        .onClick(async () => {
                            const setupManager = this.plugin.getModule(SetupManager);
                            const originalSettings = getSettingsFromEditingSettings(this.editingSettings);
                            await setupManager.onCouchDBManualSetup(
                                UserMode.Update,
                                originalSettings,
                                this.editingSettings.remoteType === REMOTE_COUCHDB
                            );

                            updateSummary();
                        })
                )
                .addOnUpdate(() =>
                    toggleActiveSyncClass(paneEl, () => this.editingSettings.remoteType === REMOTE_COUCHDB)
                );
        });
    }

    // new Setting(paneEl)
    //     .setDesc("Generate ES256 Keypair for testing")
    //     .addButton((button) =>
    //         button.setButtonText("Generate").onClick(async () => {
    //             const crypto = await getWebCrypto();
    //             const keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    //                 "sign",
    //                 "verify",
    //             ]);
    //             const pubKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    //             const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    //             const encodedPublicKey = await arrayBufferToBase64Single(pubKey);
    //             const encodedPrivateKey = await arrayBufferToBase64Single(privateKey);

    //             const privateKeyPem = `> -----BEGIN PRIVATE KEY-----\n> ${encodedPrivateKey}\n> -----END PRIVATE KEY-----`;
    //             const publicKeyPem = `> -----BEGIN PUBLIC KEY-----\\n${encodedPublicKey}\\n-----END PUBLIC KEY-----`;

    //             const title = $msg("Setting.GenerateKeyPair.Title");
    //             const msg = $msg("Setting.GenerateKeyPair.Desc", {
    //                 public_key: publicKeyPem,
    //                 private_key: privateKeyPem,
    //             });
    //             await MarkdownRenderer.render(
    //                 this.plugin.app,
    //                 "## " + title + "\n\n" + msg,
    //                 generatedKeyDivEl,
    //                 "/",
    //                 this.plugin
    //             );
    //         })
    //     )
    //     .addOnUpdate(
    //         combineOnUpdate(
    //             this.enableOnlySyncDisabled,
    //             visibleOnly(() => this.editingSettings.useJWT)
    //         )
    //     );

    void addPanel(paneEl, $msg("obsidianLiveSyncSettingTab.titleNotification"), () => {}).then((paneEl) => {
        paneEl.addClass("wizardHidden");
        new Setting(paneEl).autoWireNumeric("notifyThresholdOfRemoteStorageSize", {}).setClass("wizardHidden");
    });

    // ─── Server Control Panel (Desktop Only) ────────────────────────────────────
    if (Platform.isDesktop) {
        void addPanel(paneEl, "Server Control (Desktop)", () => {}).then(async (paneEl) => {
            paneEl.addClass("wizardHidden");

            // ── Status Dashboard ──────────────────────────────────────────────
            const dashboardEl = paneEl.createDiv({ cls: "sls-service-dashboard" });
            const couchdbStatusEl = dashboardEl.createDiv({ cls: "sls-service-row" });
            const tunnelStatusEl = dashboardEl.createDiv({ cls: "sls-service-row" });

            const updateDashboard = async () => {
                const backend = this.editingSettings.couchdbBackend as CouchDBBackend;
                const tunnelName = this.editingSettings.cloudflaredTunnelName;

                // CouchDB status
                couchdbStatusEl.empty();
                if (backend) {
                    const running = await isCouchDBRunning(backend);
                    const icon = running ? "🟢" : "🔴";
                    const label = running ? "Running" : "Stopped";
                    couchdbStatusEl.createSpan({
                        text: `${icon} ${getBackendLabel(backend)}: ${label}`,
                    });
                } else {
                    couchdbStatusEl.createSpan({ text: "⚪ CouchDB: No backend selected", cls: "sls-service-dim" });
                }

                // Tunnel status
                tunnelStatusEl.empty();
                if (tunnelName) {
                    tunnelStatusEl.createSpan({ text: `⚪ Cloudflared tunnel: "${tunnelName}" (configured)` });
                } else {
                    tunnelStatusEl.createSpan({ text: "⚪ Cloudflared: Not configured", cls: "sls-service-dim" });
                }
            };
            void updateDashboard();

            // ── Status message area ──────────────────────────────────────────
            const statusEl = paneEl.createDiv({ cls: "server-status" });

            // Helper for status updates
            const setStatus = (msg: string, type: "info" | "success" | "error" = "info") => {
                statusEl.setText(msg);
                statusEl.removeClass("status-error");
                statusEl.removeClass("status-success");
                if (type === "success") statusEl.addClass("status-success");
                if (type === "error") statusEl.addClass("status-error");
            };

            // ── CouchDB Backend Selection ────────────────────────────────────
            new Setting(paneEl).setName("CouchDB backend").setHeading();

            const backendDescEl = paneEl.createDiv({ cls: "sls-service-row sls-service-dim" });
            const updateBackendDesc = async () => {
                const backend = this.editingSettings.couchdbBackend as CouchDBBackend;
                backendDescEl.empty();
                if (backend === "pouchdb-server") {
                    const avail = await isPouchDBServerAvailable();
                    backendDescEl.createSpan({
                        text: avail.available
                            ? `PouchDB Server found (${avail.method})`
                            : "PouchDB Server not installed — click Install below",
                    });
                } else if (backend === "native") {
                    const desc = await getNativeCouchDBDescription();
                    backendDescEl.createSpan({ text: `Native CouchDB: ${desc}` });
                } else {
                    backendDescEl.createSpan({ text: "Select a backend to manage CouchDB from within Obsidian." });
                }
            };
            void updateBackendDesc();

            new Setting(paneEl)
                .setName("Backend type")
                .setDesc("PouchDB Server is lightweight (~15 MB, npm). Native manages an OS-installed CouchDB.")
                .addDropdown((dropdown) =>
                    dropdown
                        .addOption("", "None (manual)")
                        .addOption("pouchdb-server", "PouchDB Server (lightweight)")
                        .addOption("native", "Native CouchDB (system service)")
                        .setValue(this.editingSettings.couchdbBackend || "")
                        .onChange((value) => {
                            this.editingSettings.couchdbBackend = value as CouchDBBackend;
                            void updateBackendDesc();
                            void updateDashboard();
                            // Show/hide backend-specific sections
                            pouchdbSection.style.display = value === "pouchdb-server" ? "" : "none";
                            nativeSection.style.display = value === "native" ? "" : "none";
                        })
                );

            new Setting(paneEl)
                .setName("Local port")
                .setDesc("Port for CouchDB / PouchDB Server (default: 5984).")
                .addText((text) =>
                    text
                        .setPlaceholder("5984")
                        .setValue(String(this.editingSettings.couchdbPort || 5984))
                        .onChange((value) => {
                            const port = parseInt(value, 10);
                            if (!isNaN(port) && port > 0 && port < 65536) {
                                this.editingSettings.couchdbPort = port;
                            }
                        })
                );

            // ── PouchDB Server Section ───────────────────────────────────────
            const pouchdbSection = paneEl.createDiv();
            pouchdbSection.style.display = this.editingSettings.couchdbBackend === "pouchdb-server" ? "" : "none";

            new Setting(pouchdbSection)
                .setName("Data directory")
                .setDesc("Where PouchDB Server stores its data. Leave empty for default location.")
                .addText((text) =>
                    text
                        .setPlaceholder("(default)")
                        .setValue(this.editingSettings.pouchdbDataDir || "")
                        .onChange((value) => {
                            this.editingSettings.pouchdbDataDir = value;
                        })
                )
                .then((setting) => {
                    setting.controlEl.querySelector("input")?.addClass("wide-input");
                });

            new Setting(pouchdbSection)
                .setName("Install PouchDB Server")
                .setDesc("Installs pouchdb-server globally via npm. Requires Node.js/npm on PATH.")
                .addButton((button) =>
                    button
                        .setButtonText("📦 Install")
                        .onClick(async () => {
                            setStatus("⏳ Installing pouchdb-server (this may take a minute)...");
                            const result = await installPouchDBServer();
                            if (result.success) {
                                setStatus("✅ " + (result.output || "Installed"), "success");
                            } else {
                                setStatus("❌ " + (result.error || "Install failed"), "error");
                            }
                            void updateBackendDesc();
                        })
                )
                .addButton((button) =>
                    button
                        .setButtonText("🔍 Check")
                        .onClick(async () => {
                            const avail = await isPouchDBServerAvailable();
                            if (avail.available) {
                                setStatus(`✅ pouchdb-server found (${avail.method})`, "success");
                            } else {
                                setStatus("❌ pouchdb-server not found. Click Install.", "error");
                            }
                        })
                );

            // ── Native CouchDB Section ───────────────────────────────────────
            const nativeSection = paneEl.createDiv();
            nativeSection.style.display = this.editingSettings.couchdbBackend === "native" ? "" : "none";

            new Setting(nativeSection)
                .setName("Detect native CouchDB")
                .setDesc("Checks for CouchDB installed via Windows Service, systemd, or Homebrew.")
                .addButton((button) =>
                    button
                        .setButtonText("🔍 Detect")
                        .onClick(async () => {
                            setStatus("⏳ Detecting...");
                            const backends = await detectAvailableBackends();
                            if (backends.native.detected) {
                                const desc = await getNativeCouchDBDescription();
                                setStatus(`✅ ${desc}`, "success");
                            } else {
                                setStatus("❌ No native CouchDB installation found", "error");
                            }
                        })
                );

            // ── Start / Stop ─────────────────────────────────────────────────
            new Setting(paneEl).setName("CouchDB control").setHeading();

            new Setting(paneEl)
                .setName("Start / Stop")
                .setDesc("Start or stop the selected CouchDB backend.")
                .addButton((button) =>
                    button
                        .setButtonText("▶ Start")
                        .setCta()
                        .onClick(async () => {
                            const backend = this.editingSettings.couchdbBackend as CouchDBBackend;
                            if (!backend) {
                                setStatus("⚠️ Select a backend first", "error");
                                return;
                            }

                            setStatus(`⏳ Starting ${getBackendLabel(backend)}...`);

                            const config: CouchDBConfig = {
                                backend,
                                port: this.editingSettings.couchdbPort || 5984,
                                dataDir: this.editingSettings.pouchdbDataDir || "",
                                username: this.editingSettings.couchDB_USER,
                                password: this.editingSettings.couchDB_PASSWORD,
                            };

                            const result = await startCouchDB(config);
                            if (result.success) {
                                setStatus("✅ " + (result.output || "Started"), "success");
                            } else {
                                setStatus("❌ " + (result.error || "Failed"), "error");
                            }
                            void updateDashboard();
                        })
                )
                .addButton((button) =>
                    button
                        .setButtonText("⏹ Stop")
                        .onClick(async () => {
                            const backend = this.editingSettings.couchdbBackend as CouchDBBackend;
                            if (!backend) return;

                            setStatus(`⏳ Stopping ${getBackendLabel(backend)}...`);
                            const result = await stopCouchDB(backend);
                            if (result.success) {
                                setStatus("✅ " + (result.output || "Stopped"), "success");
                            } else {
                                setStatus("❌ " + (result.error || "Failed"), "error");
                            }
                            void updateDashboard();
                        })
                );

            new Setting(paneEl)
                .setName("Auto-configure CouchDB")
                .setDesc("Set up CORS, auth, and size limits for Obsidian sync. Uses the credentials from your CouchDB connection above. Run once after first setup. (For PouchDB Server, most steps are optional.)")
                .addButton((button) =>
                    button
                        .setButtonText("🔧 Configure")
                        .onClick(async () => {
                            const uri = this.editingSettings.couchDB_URI;
                            const user = this.editingSettings.couchDB_USER;
                            const pass = this.editingSettings.couchDB_PASSWORD;

                            if (!uri || !user) {
                                setStatus("⚠️ Set CouchDB URI and credentials first (in CouchDB settings above)", "error");
                                return;
                            }

                            setStatus("⏳ Configuring CouchDB...");

                            const result = await configureCouchDB(uri, user, pass, async (params) => {
                                const { requestUrl } = await import("obsidian");
                                const resp = await requestUrl({
                                    url: params.url,
                                    method: params.method,
                                    headers: params.headers,
                                    body: params.body,
                                    contentType: params.contentType,
                                    throw: false,
                                });
                                return { status: resp.status, text: resp.text };
                            });

                            if (result.success) {
                                setStatus("✅ " + (result.output || "Configured"), "success");
                            } else {
                                setStatus("❌ " + (result.error || "Configuration failed"), "error");
                            }
                        })
                );

            // ── Cloudflared Tunnel ────────────────────────────────────────────
            new Setting(paneEl).setName("Cloudflared tunnel").setHeading();

            new Setting(paneEl)
                .setName("Tunnel name")
                .setDesc("Name of the Cloudflare tunnel to run (e.g., 'obsidian').")
                .addText((text) =>
                    text
                        .setPlaceholder("e.g., obsidian")
                        .setValue(this.editingSettings.cloudflaredTunnelName || "")
                        .onChange((value) => {
                            this.editingSettings.cloudflaredTunnelName = value;
                        })
                )
                .then((setting) => {
                    setting.controlEl.querySelector("input")?.addClass("wide-input");
                });

            new Setting(paneEl)
                .setName("Start tunnel")
                .setDesc("Execute 'cloudflared tunnel run <name>'.")
                .addButton((button) =>
                    button
                        .setButtonText("▶ Start Tunnel")
                        .setCta()
                        .onClick(async () => {
                            const tunnelName = this.editingSettings.cloudflaredTunnelName;
                            if (!tunnelName || tunnelName.trim() === "") {
                                setStatus("⚠️ Set a tunnel name first", "error");
                                return;
                            }

                            const command = `cloudflared tunnel run "${tunnelName}"`;
                            setStatus(`⏳ Starting tunnel '${tunnelName}'...`);

                            const result = await executeServerCommand(command);

                            if (result.success) {
                                setStatus("✅ Tunnel started: " + (result.output || "OK"), "success");
                            } else {
                                setStatus("❌ " + (result.error || "Failed to start"), "error");
                            }
                            void updateDashboard();
                        })
                );

            // ── Quick Actions ─────────────────────────────────────────────────
            new Setting(paneEl).setName("Quick actions").setHeading();

            new Setting(paneEl)
                .setName("Start all services")
                .setDesc("Start CouchDB backend and Cloudflared tunnel with one click.")
                .addButton((button) =>
                    button
                        .setButtonText("🚀 Start All")
                        .setCta()
                        .onClick(async () => {
                            const backend = this.editingSettings.couchdbBackend as CouchDBBackend;

                            const couchConfig: CouchDBConfig | undefined = backend
                                ? {
                                    backend,
                                    port: this.editingSettings.couchdbPort || 5984,
                                    dataDir: this.editingSettings.pouchdbDataDir || "",
                                    username: this.editingSettings.couchDB_USER,
                                    password: this.editingSettings.couchDB_PASSWORD,
                                }
                                : undefined;

                            const result = await startAllServices(
                                couchConfig,
                                this.editingSettings.cloudflaredTunnelName,
                                (msg) => setStatus(msg),
                            );

                            if (result.success) {
                                setStatus("✅ " + (result.output || "All services started"), "success");
                            } else {
                                setStatus("❌ " + (result.error || "Failed"), "error");
                            }
                            void updateDashboard();
                        })
                )
                .addButton((button) =>
                    button
                        .setButtonText("🔍 Test Connection")
                        .onClick(async () => {
                            setStatus("⏳ Testing connection...");

                            try {
                                await this.testConnection();
                                setStatus("✅ Connection successful", "success");
                            } catch (e) {
                                const errorMsg = e instanceof Error ? e.message : String(e);
                                setStatus("❌ Connection failed: " + errorMsg, "error");
                            }
                        })
                )
                .addButton((button) =>
                    button
                        .setButtonText("🔄 Refresh")
                        .onClick(async () => {
                            await updateDashboard();
                            setStatus("Dashboard refreshed");
                        })
                );
        });
    }

    // new Setting(paneEl).setClass("wizardOnly").addButton((button) =>
    //     button
    //         .setButtonText($msg("obsidianLiveSyncSettingTab.buttonNext"))
    //         .setCta()
    //         .setDisabled(false)
    //         .onClick(async () => {
    //             if (!(await checkConfig(checkResultDiv))) {
    //                 if (
    //                     (await this.plugin.confirm.askYesNoDialog(
    //                         $msg("obsidianLiveSyncSettingTab.msgConfigCheckFailed"),
    //                         {
    //                             defaultOption: "No",
    //                             title: $msg("obsidianLiveSyncSettingTab.titleRemoteConfigCheckFailed"),
    //                         }
    //                     )) == "no"
    //                 ) {
    //                     return;
    //                 }
    //             }
    //             const isEncryptionFullyEnabled =
    //                 !this.editingSettings.encrypt || !this.editingSettings.usePathObfuscation;
    //             if (isEncryptionFullyEnabled) {
    //                 if (
    //                     (await this.plugin.confirm.askYesNoDialog(
    //                         $msg("obsidianLiveSyncSettingTab.msgEnableEncryptionRecommendation"),
    //                         {
    //                             defaultOption: "No",
    //                             title: $msg("obsidianLiveSyncSettingTab.titleEncryptionNotEnabled"),
    //                         }
    //                     )) == "no"
    //                 ) {
    //                     return;
    //                 }
    //             }
    //             if (!this.editingSettings.encrypt) {
    //                 this.editingSettings.passphrase = "";
    //             }
    //             if (!(await this.isPassphraseValid())) {
    //                 if (
    //                     (await this.plugin.confirm.askYesNoDialog(
    //                         $msg("obsidianLiveSyncSettingTab.msgInvalidPassphrase"),
    //                         {
    //                             defaultOption: "No",
    //                             title: $msg("obsidianLiveSyncSettingTab.titleEncryptionPassphraseInvalid"),
    //                         }
    //                     )) == "no"
    //                 ) {
    //                     return;
    //                 }
    //             }
    //             if (isCloudantURI(this.editingSettings.couchDB_URI)) {
    //                 this.editingSettings = { ...this.editingSettings, ...PREFERRED_SETTING_CLOUDANT };
    //             } else if (this.editingSettings.remoteType == REMOTE_MINIO) {
    //                 this.editingSettings = { ...this.editingSettings, ...PREFERRED_JOURNAL_SYNC };
    //             } else {
    //                 this.editingSettings = { ...this.editingSettings, ...PREFERRED_SETTING_SELF_HOSTED };
    //             }
    //             if (
    //                 (await this.plugin.confirm.askYesNoDialog(
    //                     $msg("obsidianLiveSyncSettingTab.msgFetchConfigFromRemote"),
    //                     { defaultOption: "Yes", title: $msg("obsidianLiveSyncSettingTab.titleFetchConfig") }
    //                 )) == "yes"
    //             ) {
    //                 const trialSetting = { ...this.initialSettings, ...this.editingSettings };
    //                 const newTweaks = await this.services.tweakValue.checkAndAskUseRemoteConfiguration(trialSetting);
    //                 if (newTweaks.result !== false) {
    //                     this.editingSettings = { ...this.editingSettings, ...newTweaks.result };
    //                     this.requestUpdate();
    //                 } else {
    //                     // Messages should be already shown.
    //                 }
    //             }
    //             this.changeDisplay("30");
    //         })
    // );
}
