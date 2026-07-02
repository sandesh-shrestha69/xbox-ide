export class GitManager {
    constructor(focusManager, editorController, tabManager) {
        this.focus = focusManager;
        this.editor = editorController;
        this.tabs = tabManager;
        this.el = document.getElementById('git-panel');
        this.statusList = document.getElementById('git-status-list');
        this.branchLabel = document.getElementById('git-branch');
        this._statusItems = [];
        this._focusIndex = 0;
        this._repoPath = '';
        this._visible = false;

        this.focus.registerZone({
            id: 'git',
            focus: () => { if (this.el) this.el.scrollIntoView({ block: 'nearest' }); this._updateFocus(); },
            navigate: (dx, dy) => this._navigate(dx, dy),
            confirm: () => this._openSelected(),
            back: () => {},
            context: () => {},
        });
    }

    async refresh(path) {
        if (path) this._repoPath = path;
        if (!this._repoPath) return;
        try {
            const status = await window.xbox.git.status(this._repoPath);
            const branch = await window.xbox.git.branch(this._repoPath);
            this._statusItems = status || [];
            if (this.branchLabel) this.branchLabel.textContent = branch || 'unknown';
            this._render();
        } catch (e) {
            console.error('Git refresh failed:', e);
            this._statusItems = [];
            this._render();
        }
    }

    async stage(path) {
        try {
            await window.xbox.git.stage(this._repoPath, path);
            await this.refresh();
            window.notify?.('Staged: ' + path.split('/').pop());
        } catch (e) {
            console.error('Git stage failed:', e);
        }
    }

    async unstage(path) {
        try {
            await window.xbox.git.unstage(this._repoPath, path);
            await this.refresh();
            window.notify?.('Unstaged: ' + path.split('/').pop());
        } catch (e) {
            console.error('Git unstage failed:', e);
        }
    }

    async commit(message) {
        if (!message) message = 'Update';
        try {
            const result = await window.xbox.git.commit(this._repoPath, message);
            await this.refresh();
            window.notify?.(result || 'Committed successfully');
        } catch (e) {
            window.notify?.('Commit failed: ' + e.message, 'err');
        }
    }

    async diff(path) {
        try {
            const content = await window.xbox.git.diff(this._repoPath, path);
            if (content !== undefined) {
                this.tabs.openTab(path + ' (diff)', content);
                this.editor.focus();
            }
        } catch (e) {
            console.error('Git diff failed:', e);
        }
    }

    show() {
        this._visible = true;
        if (this.el) this.el.classList.remove('hidden');
        this.refresh();
    }

    hide() {
        this._visible = false;
        if (this.el) this.el.classList.add('hidden');
    }

    toggle() {
        if (this._visible) this.hide();
        else this.show();
    }

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
        if (item.staged) {
            this.unstage(item.path);
        } else {
            this.stage(item.path);
        }
    }

    _render() {
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
            this.statusList.appendChild(div);
        });
        this._updateFocus();
    }

    _updateFocus() {
        const items = this.statusList?.querySelectorAll('.git-item') || [];
        items.forEach((el, i) => el.classList.toggle('focused', i === this._focusIndex));
    }
}
