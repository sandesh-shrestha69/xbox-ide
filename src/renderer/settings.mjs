export class SettingsManager {
    constructor(editorController) {
        this.editor = editorController;
        this.el = document.getElementById('settings-overlay');
        this.body = document.getElementById('settings-body');
        this.closeBtn = document.getElementById('settings-close');
        this._isOpen = false;

        this._defaults = {
            theme: 'vs-dark',
            fontSize: 14,
            tabSize: 4,
            wordWrap: 'off',
            lineNumbers: 'on',
            minimap: true,
        };
        this._load();

        this.closeBtn.addEventListener('click', () => this.close());
        this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
    }

    open() {
        this._isOpen = true;
        this.el.classList.remove('hidden');
        this._render();
    }

    close() {
        this._isOpen = false;
        this.el.classList.add('hidden');
    }

    toggle() {
        if (this._isOpen) this.close();
        else this.open();
    }

    get(key) { return this._settings[key] ?? this._defaults[key]; }

    set(key, val) {
        this._settings[key] = val;
        this._save();
        this._apply(key, val);
    }

    _render() {
        this.body.innerHTML = `
            <div class="st-group">
                <h3>Editor</h3>
                <div class="st-row">
                    <span>Theme</span>
                    <select id="st-theme">
                        <option value="vs-dark" ${this.get('theme') === 'vs-dark' ? 'selected' : ''}>Dark (VS)</option>
                        <option value="vs" ${this.get('theme') === 'vs' ? 'selected' : ''}>Light (VS)</option>
                        <option value="hc-black" ${this.get('theme') === 'hc-black' ? 'selected' : ''}>High Contrast</option>
                    </select>
                </div>
                <div class="st-row">
                    <span>Font Size</span>
                    <select id="st-fontSize">
                        ${[10,12,14,16,18,20,22,24].map(s =>
                            `<option value="${s}" ${this.get('fontSize') == s ? 'selected' : ''}>${s}px</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="st-row">
                    <span>Tab Size</span>
                    <select id="st-tabSize">
                        ${[2,4,6,8].map(s =>
                            `<option value="${s}" ${this.get('tabSize') == s ? 'selected' : ''}>${s}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="st-row">
                    <span>Word Wrap</span>
                    <select id="st-wordWrap">
                        <option value="off" ${this.get('wordWrap') === 'off' ? 'selected' : ''}>Off</option>
                        <option value="on" ${this.get('wordWrap') === 'on' ? 'selected' : ''}>On</option>
                        <option value="wordWrapColumn" ${this.get('wordWrap') === 'wordWrapColumn' ? 'selected' : ''}>Word Wrap Column</option>
                    </select>
                </div>
                <div class="st-row">
                    <span>Line Numbers</span>
                    <select id="st-lineNumbers">
                        <option value="on" ${this.get('lineNumbers') === 'on' ? 'selected' : ''}>On</option>
                        <option value="off" ${this.get('lineNumbers') === 'off' ? 'selected' : ''}>Off</option>
                        <option value="relative" ${this.get('lineNumbers') === 'relative' ? 'selected' : ''}>Relative</option>
                    </select>
                </div>
                <div class="st-row">
                    <span>Minimap</span>
                    <input type="checkbox" id="st-minimap" ${this.get('minimap') ? 'checked' : ''}>
                </div>
            </div>
        `;
        this.body.querySelectorAll('select, input').forEach(el => {
            el.addEventListener('change', () => {
                const key = el.id.replace('st-', '');
                const val = el.type === 'checkbox' ? el.checked :
                    key === 'fontSize' || key === 'tabSize' ? parseInt(el.value) : el.value;
                this.set(key, val);
            });
        });
    }

    _apply(key, val) {
        switch (key) {
            case 'theme':
                monaco.editor.setTheme(val);
                break;
            case 'fontSize':
                this.editor.setOption('fontSize', val);
                break;
            case 'tabSize':
                this.editor.setOption('tabSize', val);
                break;
            case 'wordWrap':
                this.editor.setOption('wordWrap', val);
                break;
            case 'lineNumbers':
                this.editor.setOption('lineNumbers', val);
                break;
            case 'minimap':
                this.editor.setOption('minimap', { enabled: val });
                break;
        }
    }

    _load() {
        try {
            const saved = localStorage.getItem('xbox-ide-settings');
            this._settings = saved ? JSON.parse(saved) : { ...this._defaults };
        } catch {
            this._settings = { ...this._defaults };
        }
    }

    _save() {
        try { localStorage.setItem('xbox-ide-settings', JSON.stringify(this._settings)); } catch {}
    }
}
