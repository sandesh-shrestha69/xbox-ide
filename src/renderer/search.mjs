export class SearchManager {
    constructor(focusManager, editorController, tabManager, workspace) {
        this.focus = focusManager;
        this.editor = editorController;
        this.tabs = tabManager;
        this.workspace = workspace;
        this.el = document.getElementById('search-panel');
        this.input = document.getElementById('search-input');
        this.resultsEl = document.getElementById('search-results');
        this.replaceInput = document.getElementById('search-replace-input');
        this._results = [];
        this._focusIndex = 0;
        this._visible = false;

        this.focus.registerZone({
            id: 'search',
            focus: () => { if (this.input) this.input.focus(); this._updateFocus(); },
            navigate: (dx, dy) => this._navigate(dx, dy),
            confirm: () => this._openResult(),
            back: () => {},
            context: () => {},
        });

        this.input.addEventListener('input', () => this.search(this.input.value));
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { if (e.shiftKey) this._prevResult(); else this._nextResult(); }
            if (e.key === 'Escape') this.close();
        });
        document.getElementById('search-close-btn')?.addEventListener('click', () => this.close());
        document.getElementById('search-replace-btn')?.addEventListener('click', () => this.replaceAll());
    }

    show() {
        this._visible = true;
        document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.add('hidden'));
        this.el.classList.remove('hidden');
        document.querySelectorAll('.st-panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-sidebar="search"]')?.classList.add('active');
        if (this.input) { this.input.value = ''; this.input.focus(); }
        this.resultsEl.innerHTML = '<div class="search-info">Type to search across files</div>';
    }

    close() {
        this._visible = false;
        this.resultsEl.innerHTML = '';
    }

    toggle() {
        if (this._visible) this.close();
        else this.show();
    }

    async search(query) {
        if (!query || query.length < 2) {
            this._results = [];
            this.resultsEl.innerHTML = '<div class="search-info">Type at least 2 characters</div>';
            return;
        }
        const folders = this.workspace ? this.workspace.getFolders() : [];
        if (folders.length === 0) {
            this.resultsEl.innerHTML = '<div class="search-info">No workspace folders open</div>';
            return;
        }
        this.resultsEl.innerHTML = '<div class="search-info">Searching...</div>';
        try {
            const results = await window.xbox.search.files(folders, query);
            this._results = results || [];
            this._renderResults();
        } catch (e) {
            this.resultsEl.innerHTML = '<div class="search-info">Search failed: ' + e.message + '</div>';
        }
    }

    async replaceAll() {
        const replaceText = this.replaceInput ? this.replaceInput.value : '';
        if (!replaceText || this._results.length === 0) return;
        for (const r of this._results) {
            try {
                for (const m of r.matches) {
                    await window.xbox.fs.writeFile(r.path,
                        (await window.xbox.fs.readFile(r.path)).data.replace(m.match, replaceText));
                }
            } catch {}
        }
        window.notify?.(`Replaced in ${this._results.length} file(s)`);
        this.search(this.input.value);
    }

    _renderResults() {
        this.resultsEl.innerHTML = '';
        if (this._results.length === 0) {
            this.resultsEl.innerHTML = '<div class="search-info">No results found</div>';
            return;
        }
        let idx = 0;
        for (const file of this._results) {
            const header = document.createElement('div');
            header.className = 'search-file';
            header.textContent = `${file.path.split('/').pop()} (${file.matches.length})`;
            this.resultsEl.appendChild(header);
            for (const m of file.matches) {
                const item = document.createElement('div');
                item.className = 'search-result' + (idx === this._focusIndex ? ' focused' : '');
                item.dataset.index = idx;
                item.dataset.path = file.path;
                item.dataset.line = m.line;
                item.dataset.column = m.column;
                item.innerHTML = `<span class="sr-line">${m.line}</span> <span class="sr-text">${this._escape(m.text.trim())}</span>`;
                this.resultsEl.appendChild(item);
                idx++;
            }
        }
    }

    _navigate(dx, dy) {
        if (dy !== 0) {
            const items = this.resultsEl.querySelectorAll('.search-result');
            this._focusIndex = Math.max(0, Math.min(items.length - 1, this._focusIndex + dy));
            this._updateFocus();
        }
    }

    _nextResult() {
        this._navigate(0, 1);
        if (this._results.length > 0) this._openResult();
    }

    _prevResult() {
        this._navigate(0, -1);
        if (this._results.length > 0) this._openResult();
    }

    _openResult() {
        const items = this.resultsEl.querySelectorAll('.search-result');
        const el = items[this._focusIndex];
        if (!el) return;
        const path = el.dataset.path;
        const line = parseInt(el.dataset.line);
        try {
            window.xbox.fs.readFile(path).then(res => {
                if (res.data !== undefined) {
                    this.tabs.openTab(path, res.data);
                    if (line > 0) {
                        this.editor.editor?.setPosition({ lineNumber: line, column: parseInt(el.dataset.column) || 1 });
                        this.editor.editor?.revealPositionInCenter({ lineNumber: line, column: 1 });
                    }
                    this.editor.focus();
                }
            });
        } catch {}
    }

    _updateFocus() {
        this.resultsEl.querySelectorAll('.search-result').forEach((el, i) => {
            el.classList.toggle('focused', i === this._focusIndex);
        });
    }

    _escape(text) { return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
}
