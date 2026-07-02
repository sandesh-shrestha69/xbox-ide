export class TerminalManager {
    constructor(focusManager) {
        this.focus = focusManager;
        this.el = document.getElementById('panel-content');
        this._termEl = null;
        this._inputBuffer = '';
        this._cursorPos = 0;
        this._history = [];
        this._historyIndex = -1;
        this._prompt = '$ ';
        this._currentLine = '';
        this._initialized = false;

        this.focus.registerZone({
            id: 'terminal',
            focus: () => { if (this._termEl) this._termEl.focus(); },
            navigate: (dx, dy) => this._navigate(dx, dy),
            confirm: () => this._executeLine(),
            back: () => {},
            context: () => {},
        });
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        this._createTerminal();
        await this._connectPTY();
    }

    _createTerminal() {
        if (!this.el) return;
        this.el.innerHTML = '';
        this._termEl = document.createElement('div');
        this._termEl.className = 'terminal-widget';
        this._termEl.contentEditable = true;
        this._termEl.tabIndex = 0;
        this.el.appendChild(this._termEl);
        this._renderPrompt();

        this._termEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this._executeLine();
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                this._backspace();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this._historyUp();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this._historyDown();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this._cursorLeft();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this._cursorRight();
            } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this._interrupt();
            } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this._clear();
            } else if (e.key.length === 1) {
                e.preventDefault();
                this._insertChar(e.key);
            }
        });

        this._termEl.addEventListener('input', () => {});
        this._termEl.addEventListener('beforeinput', (e) => {
            if (e.inputType === 'insertText' || e.inputType === 'insertLineBreak') {
                e.preventDefault();
            }
        });
    }

    async _connectPTY() {
        try {
            await window.xbox.terminal.connect();
            window.xbox.terminal.onData((data) => {
                this._write(data);
            });
            window.xbox.terminal.onError((err) => {
                this._writeln('\r\n\x1b[31mError: ' + err + '\x1b[0m');
            });
            window.xbox.terminal.onExit((code) => {
                this._writeln('\r\n\x1b[33mProcess exited with code ' + code + '\x1b[0m');
                this._renderPrompt();
            });
        } catch (e) {
            this._writeln('\r\nTerminal not available: ' + e.message);
            this._renderPrompt();
        }
    }

    async write(data) {
        try {
            await window.xbox.terminal.write(data);
        } catch {}
    }

    focus() {
        if (this._termEl) this._termEl.focus();
    }

    writeln(text) {
        this._writeln(text);
    }

    _write(data) {
        if (!this._termEl) return;
        const lines = this._termEl.innerHTML.split('<br>');
        const lastLine = lines[lines.length - 1] || '';
        if (lastLine.startsWith(this._escapeHtml(this._prompt)) || lastLine === '') {
            lines[lines.length - 1] = '';
            this._termEl.innerHTML = lines.join('<br>') + this._escapeHtml(data);
        } else {
            this._termEl.innerHTML += this._escapeHtml(data);
        }
        this._scrollToBottom();
    }

    _writeln(text) {
        if (!this._termEl) return;
        this._termEl.innerHTML += this._escapeHtml(text);
        this._scrollToBottom();
    }

    _renderPrompt() {
        if (!this._termEl) return;
        const lines = this._termEl.innerHTML.split('<br>');
        let lastLine = lines[lines.length - 1] || '';
        const promptHtml = this._escapeHtml(this._prompt);
        if (!lastLine.endsWith(promptHtml) && lastLine !== '') {
            this._termEl.innerHTML += '<br>' + promptHtml;
        } else if (lastLine === '') {
            lines[lines.length - 1] = promptHtml;
            this._termEl.innerHTML = lines.join('<br>');
        }
        this._cursorPos = this._prompt.length;
        this._currentLine = '';
        this._scrollToBottom();
    }

    _executeLine() {
        const text = this._termEl ? this._termEl.innerText : '';
        const lines = text.split('\n');
        const lastLine = lines[lines.length - 1] || '';
        let cmd = lastLine;
        if (cmd.startsWith(this._prompt)) cmd = cmd.slice(this._prompt.length);
        cmd = cmd.trim();

        if (cmd) {
            this._history.push(cmd);
            this._historyIndex = this._history.length;
            this._writeln('\r\n');
            this.write(cmd + '\n').catch(() => {});
        } else {
            this._writeln('\r\n');
            this._renderPrompt();
        }
        this._currentLine = '';
        this._cursorPos = this._prompt.length;
    }

    _insertChar(ch) {
        if (!this._termEl) return;
        const text = this._termEl.innerText || '';
        const lines = text.split('\n');
        const lastLine = lines[lines.length - 1] || '';
        let newLast = lastLine.slice(0, this._cursorPos) + ch + lastLine.slice(this._cursorPos);
        lines[lines.length - 1] = newLast;
        this._currentLine = newLast.startsWith(this._prompt) ? newLast.slice(this._prompt.length) : newLast;
        this._cursorPos++;
        this._termEl.innerText = lines.join('\n');
        this._scrollToBottom();
    }

    _backspace() {
        if (!this._termEl) return;
        if (this._cursorPos <= this._prompt.length) return;
        const text = this._termEl.innerText || '';
        const lines = text.split('\n');
        const lastLine = lines[lines.length - 1] || '';
        const newLast = lastLine.slice(0, this._cursorPos - 1) + lastLine.slice(this._cursorPos);
        lines[lines.length - 1] = newLast;
        this._currentLine = newLast.startsWith(this._prompt) ? newLast.slice(this._prompt.length) : newLast;
        this._cursorPos--;
        this._termEl.innerText = lines.join('\n');
        this._scrollToBottom();
    }

    _cursorLeft() {
        if (this._cursorPos > this._prompt.length) this._cursorPos--;
    }

    _cursorRight() {
        if (!this._termEl) return;
        const text = this._termEl.innerText || '';
        const lines = text.split('\n');
        const lastLine = lines[lines.length - 1] || '';
        if (this._cursorPos < lastLine.length) this._cursorPos++;
    }

    _historyUp() {
        if (this._history.length === 0) return;
        if (this._historyIndex > 0) this._historyIndex--;
        this._replaceCurrentLine(this._history[this._historyIndex]);
    }

    _historyDown() {
        if (this._historyIndex >= this._history.length - 1) {
            this._historyIndex = this._history.length;
            this._replaceCurrentLine('');
        } else {
            this._historyIndex++;
            this._replaceCurrentLine(this._history[this._historyIndex]);
        }
    }

    _replaceCurrentLine(cmd) {
        if (!this._termEl) return;
        const text = this._termEl.innerText || '';
        const lines = text.split('\n');
        lines[lines.length - 1] = this._prompt + cmd;
        this._currentLine = cmd;
        this._cursorPos = this._prompt.length + cmd.length;
        this._termEl.innerText = lines.join('\n');
        this._scrollToBottom();
    }

    _interrupt() {
        this._writeln('^C\r\n');
        this._renderPrompt();
    }

    _clear() {
        if (this._termEl) this._termEl.innerHTML = '';
        this._renderPrompt();
    }

    _navigate(dx, dy) {
        if (dy < 0) this._historyUp();
        else if (dy > 0) this._historyDown();
        else if (dx < 0) this._cursorLeft();
        else if (dx > 0) this._cursorRight();
    }

    _scrollToBottom() {
        if (this.el) this.el.scrollTop = this.el.scrollHeight;
    }

    _escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, c => map[c] || c);
    }
}
