export class WorkspaceManager {
    constructor(explorer, focusManager) {
        this.explorer = explorer;
        this.focus = focusManager;
        this._folders = [];
        this._workspaceFile = null;
        this._name = 'Untitled';
        this.el = document.getElementById('workspace-panel');
        this.listEl = document.getElementById('workspace-folders');

        this.focus.registerZone({
            id: 'workspace',
            focus: () => { if (this.listEl) this.listEl.scrollIntoView({ block: 'nearest' }); },
            navigate: (dx, dy) => {},
            confirm: () => {},
            back: () => {},
            context: () => {},
        });
    }

    async addFolder(folderPath) {
        if (this._folders.includes(folderPath)) return;
        this._folders.push(folderPath);
        await this.explorer.load(folderPath);
        this._render();
        window.notify?.(`Added folder: ${folderPath.split('/').pop()}`);
    }

    removeFolder(folderPath) {
        this._folders = this._folders.filter(f => f !== folderPath);
        if (this._folders.length > 0) this.explorer.load(this._folders[0]);
        else this.explorer.load('/');
        this._render();
    }

    getFolders() { return [...this._folders]; }
    getPrimaryFolder() { return this._folders[0] || null; }
    getName() { return this._name; }

    async saveAsWorkspace(filePath) {
        const content = JSON.stringify({ folders: this._folders.map(f => ({ path: f })) }, null, 2);
        try {
            await window.xbox.fs.writeFile(filePath, content);
            this._workspaceFile = filePath;
            this._name = filePath.split('/').pop().replace('.code-workspace', '');
            window.notify?.(`Workspace saved: ${this._name}`);
        } catch (e) {
            window.notify?.('Failed to save workspace: ' + e.message, 'err');
        }
    }

    async openWorkspace(filePath) {
        try {
            const res = await window.xbox.fs.readFile(filePath);
            if (res.data) {
                const ws = JSON.parse(res.data);
                this._folders = (ws.folders || []).map(f => f.path).filter(Boolean);
                this._workspaceFile = filePath;
                this._name = filePath.split('/').pop().replace('.code-workspace', '');
                if (this._folders.length > 0) await this.explorer.load(this._folders[0]);
                this._render();
                window.notify?.(`Opened workspace: ${this._name}`);
            }
        } catch (e) {
            window.notify?.('Failed to open workspace: ' + e.message, 'err');
        }
    }

    show() {
        document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.add('hidden'));
        this.el.classList.remove('hidden');
        document.querySelectorAll('.st-panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-sidebar="workspace"]')?.classList.add('active');
        this._render();
    }

    _render() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';
        if (this._folders.length === 0) {
            this.listEl.innerHTML = '<div class="ws-folder">No folders opened</div>';
            return;
        }
        for (const folder of this._folders) {
            const div = document.createElement('div');
            div.className = 'ws-folder';
            const name = folder.split('/').pop() || folder;
            div.innerHTML = `<span class="ws-icon">📁</span> ${name} <span class="ws-path">${folder}</span>`;
            this.listEl.appendChild(div);
        }
    }
}
