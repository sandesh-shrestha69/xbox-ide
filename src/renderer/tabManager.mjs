const LANGUAGE_MAP = {
    '.js': 'javascript', '.ts': 'typescript', '.tsx': 'typescript', '.jsx': 'javascript',
    '.html': 'html', '.css': 'css', '.scss': 'scss', '.less': 'less',
    '.json': 'json', '.xml': 'xml', '.md': 'markdown', '.py': 'python',
    '.rb': 'ruby', '.php': 'php', '.java': 'java', '.c': 'c', '.cpp': 'cpp',
    '.cs': 'csharp', '.go': 'go', '.rs': 'rust', '.swift': 'swift',
    '.kt': 'kotlin', '.yml': 'yaml', '.yaml': 'yaml', '.sql': 'sql',
    '.sh': 'shell', '.bash': 'shell', '.bat': 'bat', '.txt': 'plaintext',
};

export class TabManager {
    constructor(editorController, focusManager) {
        this.editor = editorController;
        this.focus = focusManager;
        this.tabs = [];
        this.activeIndex = -1;
        this.container = document.getElementById('tab-container');
        this._dirty = new Set();
    }

    openTab(filePath, content) {
        const existing = this.tabs.findIndex(t => t.path === filePath);
        if (existing >= 0) {
            this._setActive(existing);
            return;
        }
        const ext = '.' + filePath.split('.').pop();
        const lang = LANGUAGE_MAP[ext] || 'plaintext';
        const name = filePath.split('/').pop() || filePath.split('\\').pop();
        this.tabs.push({ path: filePath, name, lang, content });
        this._setActive(this.tabs.length - 1);
        this._render();
    }

    closeTab(index) {
        if (index < 0 || index >= this.tabs.length) return;
        this._dirty.delete(this.tabs[index].path);
        this.tabs.splice(index, 1);
        if (this.tabs.length === 0) {
            this.activeIndex = -1;
            this.editor.setValue('');
            this._render();
            return;
        }
        if (this.activeIndex >= this.tabs.length) this.activeIndex = this.tabs.length - 1;
        this._loadTab(this.activeIndex);
        this._render();
    }

    nextTab() {
        if (this.tabs.length < 2) return;
        this._setActive((this.activeIndex + 1) % this.tabs.length);
    }

    prevTab() {
        if (this.tabs.length < 2) return;
        this._setActive((this.activeIndex - 1 + this.tabs.length) % this.tabs.length);
    }

    currentPath() { return this.tabs[this.activeIndex]?.path; }

    markDirty() {
        if (this.activeIndex >= 0) {
            this._dirty.add(this.tabs[this.activeIndex].path);
            this._render();
        }
    }

    markClean() {
        if (this.activeIndex >= 0) {
            this._dirty.delete(this.tabs[this.activeIndex].path);
            this._render();
        }
    }

    _setActive(index) {
        this.activeIndex = index;
        this._loadTab(index);
        this._render();
    }

    _loadTab(index) {
        const tab = this.tabs[index];
        if (!tab) return;
        this.editor.setValue(tab.content);
        this.editor.setLanguage(tab.lang);
        const statusLang = document.getElementById('status-lang');
        if (statusLang) {
            const labels = { javascript: 'JavaScript', python: 'Python', typescript: 'TypeScript',
                html: 'HTML', css: 'CSS', json: 'JSON', markdown: 'Markdown', cpp: 'C++',
                csharp: 'C#', rust: 'Rust', go: 'Go', java: 'Java', ruby: 'Ruby',
                php: 'PHP', sql: 'SQL', shell: 'Shell', yaml: 'YAML', plaintext: 'Plain Text' };
            statusLang.textContent = labels[tab.lang] || tab.lang;
        }
    }

    _render() {
        this.container.innerHTML = '';
        this.tabs.forEach((tab, i) => {
            const div = document.createElement('div');
            div.className = 'tab' + (i === this.activeIndex ? ' active' : '');
            div.textContent = tab.name;
            if (this._dirty.has(tab.path)) {
                const dot = document.createElement('span');
                dot.className = 'dot';
                div.appendChild(dot);
            }
            const close = document.createElement('span');
            close.className = 'x';
            close.textContent = '✕';
            close.addEventListener('click', (e) => { e.stopPropagation(); this.closeTab(i); });
            div.appendChild(close);
            div.addEventListener('click', () => this._setActive(i));
            this.container.appendChild(div);
        });
    }
}
