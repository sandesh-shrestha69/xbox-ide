export class TerminalManager {
    constructor(focusManager) {
        this.focus = focusManager;
        this.el = document.getElementById('panel-content');
        this._xterm = null;
        this._fitAddon = null;
        this._ptyConnected = false;
        this._initialized = false;
        this._history = [];
        this._historyIndex = -1;
        this._tabs = [];
        this._activeTab = 0;
        this._buffers = [''];

        this.focus.registerZone({
            id: 'terminal',
            focus: () => { if (this._xterm) this._xterm.focus(); },
            navigate: (dx, dy) => this._navigate(dx, dy),
            confirm: () => { if (this._xterm) this._xterm.focus(); },
            back: () => {},
            context: () => {},
        });
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        this._createXterm();
        await this._connectPTY();
    }

    _createXterm() {
        if (!this.el || typeof Terminal === 'undefined') {
            this._fallbackTerminal();
            return;
        }
        this.el.innerHTML = '';
        this.el.style.background = '#1e1e1e';
        this._xterm = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontSize: 13,
            fontFamily: '"Cascadia Code", "Consolas", monospace',
            theme: { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#d4d4d4',
                selectionBackground: '#094771', black: '#1e1e1e', red: '#f44747',
                green: '#4ec9b0', yellow: '#e8bf6a', blue: '#569cd6', magenta: '#c586c0',
                cyan: '#4fc1ff', white: '#d4d4d4' },
            allowTransparency: false,
            scrollback: 10000,
        });
        try {
            this._fitAddon = new FitAddon();
            this._xterm.loadAddon(this._fitAddon);
        } catch {
            try { this._fitAddon = new window.FitAddon?.(); if (this._fitAddon) this._xterm.loadAddon(this._fitAddon); }
            catch {}
        }
        this._xterm.open(this.el);
        if (this._fitAddon) setTimeout(() => this._fitAddon.fit(), 100);
        this._xterm.onKey((e) => {
            if (this._ptyConnected) {
                this.write(e.key).catch(() => {});
            } else {
                this._localEcho(e.key);
            }
        });
        this._xterm.onResize(({ cols, rows }) => {
            window.xbox.terminal.resize(cols, rows).catch(() => {});
        });
        this._xterm.focus();
        window.addEventListener('resize', () => { if (this._fitAddon) this._fitAddon.fit(); });
    }

    _fallbackTerminal() {
        this.el.innerHTML = '<div class="terminal-widget" contenteditable style="height:100%;padding:8px;font-family:monospace;font-size:13px;color:#d4d4d4;outline:none;overflow-y:auto;">Terminal ready</div>';
        const te = this.el.firstChild;
        te.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const cmd = te.innerText.split('\n').pop() || '';
                this.write(cmd + '\n').catch(() => {});
                te.innerHTML += '\n';
            } else if (e.key.length === 1) {
                // handled natively by contentEditable
            }
        });
    }

    async _connectPTY() {
        try {
            await window.xbox.terminal.connect();
            this._ptyConnected = true;
            if (this._xterm) this._xterm.writeln('Connected to shell');
            window.xbox.terminal.onData((data) => {
                if (this._xterm) this._xterm.write(data);
                else this._fallbackWrite(data);
            });
            window.xbox.terminal.onError((err) => {
                if (this._xterm) this._xterm.writeln('\x1b[31mError: ' + err + '\x1b[0m');
            });
            window.xbox.terminal.onExit((code) => {
                this._ptyConnected = false;
                if (this._xterm) this._xterm.writeln('\x1b[33mProcess exited with code ' + code + '\x1b[0m');
            });
        } catch (e) {
            if (this._xterm) this._xterm.writeln('Terminal unavailable: ' + e.message);
        }
    }

    async write(data) {
        try { await window.xbox.terminal.write(data); } catch {}
    }

    async resize(cols, rows) {
        try { await window.xbox.terminal.resize(cols, rows); } catch {}
    }

    focus() { if (this._xterm) this._xterm.focus(); }

    writeln(text) { if (this._xterm) this._xterm.writeln(text); }

    _localEcho(key) {
        if (key === '\r') {
            const line = this._buffers[this._activeTab];
            if (line.trim()) { this._history.push(line.trim()); this._historyIndex = this._history.length; }
            this._buffers[this._activeTab] = '';
            return;
        }
        if (key === '\x7f') {
            this._buffers[this._activeTab] = this._buffers[this._activeTab].slice(0, -1);
            return;
        }
        this._buffers[this._activeTab] += key;
    }

    _fallbackWrite(data) {
        const el = this.el.querySelector('.terminal-widget');
        if (el) el.innerHTML += this._escapeHtml(data);
    }

    _navigate(dx, dy) {}

    _escapeHtml(text) {
        return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
}
