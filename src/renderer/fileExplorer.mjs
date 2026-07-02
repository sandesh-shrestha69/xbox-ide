export class FileExplorer {
    constructor(focusManager, editorController, tabManager) {
        this.focus = focusManager;
        this.editor = editorController;
        this.tabs = tabManager;
        this.el = document.getElementById('file-tree');
        this._items = [];
        this._focusIndex = 0;
        this._basePath = '';
        this._expanded = new Set();

        this.focus.registerZone({
            id: 'explorer',
            focus: () => { this.el.scrollIntoView({ block: 'nearest' }); this._updateFocus(); },
            navigate: (dx, dy) => this._navigate(dx, dy),
            confirm: () => this._openSelected(),
            back: () => {},
            context: () => {},
        });
    }

    async load(path) {
        if (!path) {
            try { path = await window.xbox?.app?.getPath?.('home'); } catch {}
            if (!path) path = '/';
        }
        this._basePath = path;
        this._items = [];
        this._focusIndex = 0;
        this.el.innerHTML = '<div class="ft-item" style="color:#858585;padding:6px 12px;">Loading...</div>';
        try {
            const res = await window.xbox.fs.readDir(path, 3);
            if (res.entries) {
                this._items = res.entries;
                this._render();
            }
        } catch {
            this.el.innerHTML = '<div class="ft-item" style="color:#f44747;padding:6px 12px;">Failed to load</div>';
        }
    }

    _render() {
        this.el.innerHTML = '';
        this._flatItems = [];
        this._renderItem(this._items, 0);
        this._updateFocus();
    }

    _renderItem(item, depth) {
        if (Array.isArray(item)) {
            for (const child of item) this._renderItem(child, depth);
            return;
        }
        if (!item || !item.name) return;
        const isDir = item.type === 'directory';
        const expanded = this._expanded.has(item.path);
        const div = document.createElement('div');
        div.className = 'ft-item' + (isDir ? ' dir' : '');
        div.style.paddingLeft = (12 + depth * 16) + 'px';
        div.textContent = (isDir ? (expanded ? '▾ ' : '▸ ') : '  ') + item.name;
        div.dataset.path = item.path;
        div.dataset.dir = isDir ? 'true' : 'false';
        div.dataset.index = this._flatItems.length;
        this._flatItems.push({ el: div, path: item.path, isDir, children: item.children });
        this.el.appendChild(div);

        if (isDir && expanded && item.children) {
            for (const child of item.children) {
                if (typeof child === 'object') this._renderItem(child, depth + 1);
            }
        }
    }

    _navigate(dx, dy) {
        if (dy !== 0) {
            const newIdx = Math.max(0, Math.min(this._flatItems.length - 1, this._focusIndex + dy));
            this._focusIndex = newIdx;
            this._updateFocus();
        }
        if (dx > 0) {
            const item = this._flatItems[this._focusIndex];
            if (item && item.isDir) {
                if (this._expanded.has(item.path)) {
                    const ch = this._flatItems[this._focusIndex + 1];
                    if (ch) { this._focusIndex++; this._updateFocus(); }
                } else {
                    this._expanded.add(item.path);
                    this._render();
                }
            }
        }
        if (dx < 0) {
            const item = this._flatItems[this._focusIndex];
            if (item && item.isDir && this._expanded.has(item.path)) {
                this._expanded.delete(item.path);
                this._render();
            }
        }
    }

    _openSelected() {
        const item = this._flatItems[this._focusIndex];
        if (!item) return;
        if (item.isDir) {
            if (this._expanded.has(item.path)) this._expanded.delete(item.path);
            else this._expanded.add(item.path);
            this._render();
        } else {
            this._openFile(item.path);
        }
    }

    async _openFile(path) {
        try {
            const res = await window.xbox.fs.readFile(path);
            if (res.data !== undefined) {
                this.tabs.openTab(path, res.data);
                this.editor.focus();
            }
        } catch (e) {
            console.error('Failed to open file:', e);
        }
    }

    _updateFocus() {
        this._flatItems?.forEach((item, i) => {
            item.el.classList.toggle('focused', i === this._focusIndex);
        });
        const current = this._flatItems?.[this._focusIndex]?.el;
        if (current) {
            current.scrollIntoView({ block: 'nearest' });
            this.focus.selectItem(current);
        }
    }
}
