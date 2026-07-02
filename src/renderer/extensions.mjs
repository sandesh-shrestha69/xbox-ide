export class ExtensionManager {
    constructor(commandRegistry) {
        this.cmds = commandRegistry;
        this._extensions = new Map();
        this._initialized = false;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;

        window.xbox.ext.onMessage((msg) => {
            if (msg.type === 'extension:activated') {
                console.log(`Extension activated: ${msg.id}`);
            }
            if (msg.type === 'extension:command') {
                this.cmds.execute(msg.command, ...(msg.args || []));
            }
            if (msg.type === 'extension:completions') {
                this._onCompletions(msg);
            }
        });
    }

    async loadExtension(manifestPath) {
        try {
            const result = await window.xbox.ext.load(manifestPath);
            if (result && result.id) {
                this._extensions.set(result.id, result);
                this._registerExtensionCommands(result);
                window.notify?.(`Extension loaded: ${result.id}`);
                return result;
            }
        } catch (e) {
            console.error('Failed to load extension:', e);
            window.notify?.('Failed to load extension: ' + e.message, 'err');
        }
        return null;
    }

    async loadFromDirectory(dirPath) {
        try {
            const result = await window.xbox.ext.loadDir(dirPath);
            if (result && result.extensions) {
                for (const ext of result.extensions) {
                    if (ext.id) {
                        this._extensions.set(ext.id, ext);
                        this._registerExtensionCommands(ext);
                        console.log(`Loaded extension: ${ext.id}`);
                    }
                }
                window.notify?.(`Loaded ${result.extensions.length} extension(s)`);
                return result.extensions;
            }
        } catch (e) {
            console.error('Failed to load extensions from directory:', e);
        }
        return [];
    }

    _registerExtensionCommands(ext) {
        if (!ext.contributes || !ext.contributes.commands) return;
        for (const cmd of ext.contributes.commands) {
            const id = cmd.id || `${ext.id}.${cmd.command}`;
            if (!this.cmds.get(id)) {
                this.cmds.register(id, (...args) => {
                    window.xbox.ext.request({
                        type: 'command',
                        extensionId: ext.id,
                        command: cmd.command,
                        args,
                    });
                }, { label: cmd.label || cmd.command, category: ext.displayName || ext.id });
            }
        }
    }

    _onCompletions(msg) {
        // Extension completions handler - merged with editor completions
        if (window.__pendingCompletionCallback) {
            window.__pendingCompletionCallback(msg.suggestions || []);
            window.__pendingCompletionCallback = null;
        }
    }

    getExtension(id) {
        return this._extensions.get(id) || null;
    }

    getAllExtensions() {
        return Array.from(this._extensions.values());
    }

    async sendMessage(extensionId, message) {
        try {
            await window.xbox.ext.request({
                type: 'message',
                extensionId,
                message,
            });
        } catch (e) {
            console.error('Failed to send message to extension:', e);
        }
    }
}
