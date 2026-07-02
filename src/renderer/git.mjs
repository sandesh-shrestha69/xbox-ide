export class GitManager {
    constructor(focusManager, editorController, tabManager) {
        this.focus = focusManager;
        this.editor = editorController;
        this.tabs = tabManager;
        this.el = document.getElementById('git-panel');
        this.statusList = document.getElementById('git-status-list');
        this.branchLabel = document.getElementById('git-branch');
        this.commitInput = document.getElementById('git-commit-input');
        this.commitBtn = document.getElementById('git-commit-btn');
        this.branchesList = document.getElementById('git-branches');
        this.diffView = document.getElementById('git-diff-view');
        this._statusItems = [];
        this._focusIndex = 0;
        this._repoPath = '';
        this._branches = [];
        this._log = [];
        this._visible = false;

        this.focus.registerZone({
            id: 'git',
            focus: () => { if (this.el) this.el.scrollIntoView({ block: 'nearest' }); this._updateFocus(); },
            navigate: (dx, dy) => this._navigate(dx, dy),
            confirm: () => this._openSelected(),
            back: () => {},
            context: () => {},
        });

        this.commitBtn?.addEventListener('click', () => this._doCommit());
        this.commitInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._doCommit(); });
    }

    async refresh(path) {
        if (path) this._repoPath = path;
        if (!this._repoPath) return;
        try {
            const [status, branch, branches, log] = await Promise.all([
                window.xbox.git.status(this._repoPath),
                window.xbox.git.branch(this._repoPath),
                window.xbox.git.branches(this._repoPath).catch(() => []),
                window.xbox.git.log(this._repoPath, 20).catch(() => []),
            ]);
            this._statusItems = status || [];
            this._branches = branches || [];
            this._log = log || [];
            if (this.branchLabel) this.branchLabel.textContent = branch || 'unknown';
            this._render();
        } catch (e) {
            console.error('Git refresh failed:', e);
            this._statusItems = [];
            this._render();
        }
    }

    async stage(path) {
        try { await window.xbox.git.stage(this._repoPath, path); await this.refresh(); window.notify?.('Staged'); }
        catch (e) { console.error('Git stage failed:', e); }
    }

    async unstage(path) {
        try { await window.xbox.git.unstage(this._repoPath, path); await this.refresh(); window.notify?.('Unstaged'); }
        catch (e) { console.error('Git unstage failed:', e); }
    }

    async commit(message) {
        if (!message) return;
        try {
            const result = await window.xbox.git.commit(this._repoPath, message);
            await this.refresh();
            window.notify?.(result || 'Committed');
            if (this.commitInput) this.commitInput.value = '';
        } catch (e) {
            window.notify?.('Commit failed: ' + e.message, 'err');
        }
    }

    async diff(path) {
        try {
            const content = await window.xbox.git.diff(this._repoPath, path);
            if (content) {
                this.tabs.openTab(path + ' (diff)', content);
                this.editor.focus();
            }
        } catch (e) {
            console.error('Git diff failed:', e);
        }
    }

    async checkout(branch) {
        try {
            await window.xbox.git.checkout(this._repoPath, branch);
            await this.refresh();
            window.notify?.('Switched to ' + branch);
        } catch (e) {
            window.notify?.('Checkout failed: ' + e.message, 'err');
        }
    }

    async createBranch(name) {
        try {
            await window.xbox.git.createBranch(this._repoPath, name);
            await this.refresh();
            window.notify?.('Created branch: ' + name);
        } catch (e) {
            window.notify?.('Branch creation failed: ' + e.message, 'err');
        }
    }

    show() {
        this._visible = true;
        document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.add('hidden'));
        this.el.classList.remove('hidden');
        document.querySelectorAll('.st-panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-sidebar="git"]')?.classList.add('active');
        this.refresh();
    }

    hide() { this._visible = false; }
    toggle() { if (this._visible) this.hide(); else this.show(); }

    _navigate(dx, dy) {
        if (dy !== 0) {
            const items = this.statusList?.querySelectorAll('.git-item') || [];
            this._focusIndex = Math.max(0, Math.min(items.length - 1, this._focusIndex + dy));
            this._updateFocus();
        }
        if (dx > 0) this._openSelected();
    }

    _openSelected() {
        const item = this._statusItems[this._focusIndex];
        if (!item) return;
        if (item.staged) { this.unstage(item.path); }
        else { this.stage(item.path); }
    }

    _doCommit() {
        if (this.commitInput) this.commit(this.commitInput.value);
    }

    _render() {
        this._renderStatus();
        this._renderBranches();
        this._renderLog();
    }

    _renderStatus() {
        if (!this.statusList) return;
        this.statusList.innerHTML = '';
        if (this._statusItems.length === 0) {
            this.statusList.innerHTML = '<div class="git-item empty">No changes</div>';
            return;
        }
        this._statusItems.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'git-item' + (i === this._focusIndex ? ' focused' : '');
            const icon = item.staged ? '●' : item.untracked ? '?' : '○';
            const color = item.staged ? '#4ec9b0' : item.untracked ? '#858585' : '#e8bf6a';
            div.innerHTML = `<span style="color:${color}">${icon}</span> ${item.path.split('/').pop()}`;
            div.dataset.index = i;
            div.dataset.path = item.path;
            div.addEventListener('click', () => {
                if (item.staged) this.unstage(item.path);
                else this.stage(item.path);
            });
            div.addEventListener('dblclick', () => this.diff(item.path));
            this.statusList.appendChild(div);
        });
        this._updateFocus();
    }

    _renderBranches() {
        if (!this.branchesList) return;
        this.branchesList.innerHTML = '<div class="git-section">BRANCHES</div>';
        for (const b of this._branches) {
            const div = document.createElement('div');
            div.className = 'git-branch-item';
            const isCurrent = b.startsWith('*');
            div.textContent = isCurrent ? b.slice(2) : b;
            if (isCurrent) div.style.color = '#4ec9b0';
            div.addEventListener('click', () => this.checkout(div.textContent));
            this.branchesList.appendChild(div);
        }
    }

    _renderLog() {
        if (!this.diffView) return;
        this.diffView.innerHTML = '<div class="git-section">RECENT COMMITS</div>';
        for (const entry of this._log) {
            const div = document.createElement('div');
            div.className = 'git-log-item';
            div.innerHTML = `<span class="git-hash">${entry.hash.slice(0, 7)}</span> ${entry.message}`;
            this.diffView.appendChild(div);
        }
    }

    _updateFocus() {
        const items = this.statusList?.querySelectorAll('.git-item') || [];
        items.forEach((el, i) => el.classList.toggle('focused', i === this._focusIndex));
    }
}
