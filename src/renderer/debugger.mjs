export class DebuggerManager {
    constructor(focusManager, editorController) {
        this.focus = focusManager;
        this.editor = editorController;
        this.el = document.getElementById('debug-panel');
        this.toolbar = document.getElementById('debug-toolbar');
        this.variablesEl = document.getElementById('debug-variables');
        this.stackEl = document.getElementById('debug-stack');
        this.breakpointsEl = document.getElementById('debug-breakpoints');
        this._session = null;
        this._breakpoints = [];
        this._stackFrames = [];
        this._scopes = [];
        this._variables = {};
        this._running = false;
        this._seq = 0;

        this.focus.registerZone({
            id: 'debug',
            focus: () => { if (this.el) this.el.scrollIntoView({ block: 'nearest' }); },
            navigate: (dx, dy) => this._navigate(dx, dy),
            confirm: () => this._confirm(),
            back: () => {},
            context: () => {},
        });

        document.getElementById('debug-continue')?.addEventListener('click', () => this.continue());
        document.getElementById('debug-step-over')?.addEventListener('click', () => this.stepOver());
        document.getElementById('debug-step-into')?.addEventListener('click', () => this.stepInto());
        document.getElementById('debug-step-out')?.addEventListener('click', () => this.stepOut());
        document.getElementById('debug-restart')?.addEventListener('click', () => this.restart());
        document.getElementById('debug-stop')?.addEventListener('click', () => this.stop());
    }

    async start(config) {
        config = config || { type: 'node', request: 'launch', name: 'Launch', program: '${file}' };
        try {
            const program = config.program === '${file}' ? this.tabs?.currentPath() : config.program;
            if (!program) { window.notify?.('No file to debug', 'err'); return; }
            this._session = await window.xbox.debug.start({
                ...config,
                program,
                cwd: program.split('/').slice(0, -1).join('/') || '.',
            });
            this._running = true;
            this.el?.classList.remove('hidden');
            this._updateToolbar();
            window.notify?.('Debug session started');
            this._pollEvents();
        } catch (e) {
            window.notify?.('Debug start failed: ' + e.message, 'err');
        }
    }

    async stop() {
        if (this._session) {
            try { await window.xbox.debug.stop(this._session.id); } catch {}
            this._session = null;
        }
        this._running = false;
        this._stackFrames = [];
        this._scopes = [];
        this._variables = {};
        this.el?.classList.add('hidden');
        this._render();
        this._updateToolbar();
        window.notify?.('Debug session ended');
    }

    async continue() { await this._send('continue', {}); }
    async stepOver() { await this._send('next', {}); }
    async stepInto() { await this._send('stepIn', {}); }
    async stepOut() { await this._send('stepOut', {}); }
    async restart() { await this.stop(); await this.start(); }

    async toggleBreakpoint(filePath, line) {
        const existing = this._breakpoints.findIndex(b => b.path === filePath && b.line === line);
        if (existing >= 0) {
            this._breakpoints.splice(existing, 1);
        } else {
            this._breakpoints.push({ path: filePath, line, verified: false });
        }
        if (this._session) {
            try { await this._send('setBreakpoints', {
                source: { path: filePath },
                breakpoints: this._breakpoints.filter(b => b.path === filePath).map(b => ({ line: b.line })),
            }); } catch {}
        }
        this._render();
    }

    _send(command, args) {
        if (!this._session) return;
        return window.xbox.debug.send(this._session.id, { seq: ++this._seq, type: 'request', command, arguments: args });
    }

    async _pollEvents() {
        while (this._running && this._session) {
            try {
                const event = await window.xbox.debug.receive(this._session.id);
                if (!event) break;
                this._handleEvent(event);
            } catch { break; }
        }
    }

    _handleEvent(event) {
        if (event.type === 'event') {
            switch (event.event) {
                case 'stopped':
                    this._fetchStack();
                    break;
                case 'output':
                    if (event.body?.output) process.stdout.write(event.body.output);
                    break;
                case 'exited':
                case 'terminated':
                    this.stop();
                    break;
            }
        }
        if (event.type === 'response' && event.command === 'stackTrace' && event.body) {
            this._stackFrames = event.body.stackFrames || [];
            this._fetchScopes();
        }
        if (event.type === 'response' && event.command === 'scopes' && event.body) {
            this._scopes = event.body.scopes || [];
            this._fetchVariables();
        }
        if (event.type === 'response' && event.command === 'variables' && event.body) {
            const varRef = event.request_seq || 0;
            this._variables[varRef] = event.body.variables || [];
            this._render();
        }
        this._render();
    }

    async _fetchStack() {
        await this._send('stackTrace', { threadId: 1, startFrame: 0, levels: 20 });
    }

    async _fetchScopes() {
        if (this._stackFrames.length > 0) {
            await this._send('scopes', { frameId: this._stackFrames[0].id });
        }
    }

    async _fetchVariables() {
        for (const scope of this._scopes) {
            if (scope.variablesReference > 0) {
                await this._send('variables', { variablesReference: scope.variablesReference });
            }
        }
    }

    _navigate(dx, dy) {}
    _confirm() {}

    _updateToolbar() {
        if (!this.toolbar) return;
        this.toolbar.querySelectorAll('button').forEach(b => b.disabled = !this._running);
    }

    _render() {
        this._renderVariables();
        this._renderStack();
        this._renderBreakpoints();
    }

    _renderVariables() {
        if (!this.variablesEl) return;
        this.variablesEl.innerHTML = '<div class="dbg-header">VARIABLES</div>';
        for (const scope of this._scopes) {
            const sec = document.createElement('div');
            sec.className = 'dbg-scope';
            sec.textContent = scope.name;
            this.variablesEl.appendChild(sec);
            const vars = this._variables[scope.variablesReference] || [];
            for (const v of vars) {
                const row = document.createElement('div');
                row.className = 'dbg-var';
                row.innerHTML = `<span class="dbg-var-name">${v.name}</span> = <span class="dbg-var-val">${v.value || v.evaluateName || ''}</span>`;
                this.variablesEl.appendChild(row);
            }
        }
    }

    _renderStack() {
        if (!this.stackEl) return;
        this.stackEl.innerHTML = '<div class="dbg-header">CALL STACK</div>';
        for (const frame of this._stackFrames) {
            const div = document.createElement('div');
            div.className = 'dbg-frame';
            const src = (frame.source?.path || '').split('/').pop() || '<unknown>';
            div.textContent = `${frame.name} — ${src}:${frame.line}`;
            this.stackEl.appendChild(div);
        }
    }

    _renderBreakpoints() {
        if (!this.breakpointsEl) return;
        this.breakpointsEl.innerHTML = '<div class="dbg-header">BREAKPOINTS</div>';
        for (const bp of this._breakpoints) {
            const div = document.createElement('div');
            div.className = 'dbg-bp';
            const name = bp.path.split('/').pop();
            div.textContent = `${name}:${bp.line}`;
            this.breakpointsEl.appendChild(div);
        }
    }
}
