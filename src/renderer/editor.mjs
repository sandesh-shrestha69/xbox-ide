export class EditorController {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.editor = null;
        this._model = null;
        this._decorations = [];
    }

    async init() {
        if (!window.__monacoReady) {
            await new Promise(resolve => {
                const check = () => {
                    if (window.__monacoReady) resolve();
                    else setTimeout(check, 50);
                };
                check();
            });
        }
        const container = this.container;
        this.editor = monaco.editor.create(container, {
            value: '// Xbox IDE — Press START for settings\n// Press Y for Command Palette\n// Press BACK or L3 for Keyboard\n',
            language: 'javascript',
            theme: 'vs-dark',
            fontSize: 14,
            fontFamily: 'Consolas, "Cascadia Code", monospace',
            lineNumbers: 'on',
            minimap: { enabled: true },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: 'off',
            tabSize: 4,
            renderWhitespace: 'selection',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 8, bottom: 8 },
            bracketPairColorization: { enabled: true },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            acceptSuggestionOnCommitCharacter: true,
            contextmenu: false,
        });

        this.editor.onDidChangeCursorPosition((e) => {
            this._updateStatus(e.position);
        });

        monaco.languages.registerCompletionItemProvider('*', {
            triggerCharacters: ['.', '$', '@', '/'],
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };
                const suggestions = this._getKeywords().map(k => ({
                    label: k,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: k,
                    range,
                }));
                return { suggestions };
            }
        });

        this._model = this.editor.getModel();
    }

    setValue(val) {
        if (this.editor) this.editor.setValue(val);
    }

    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }

    setLanguage(lang) {
        if (this._model) {
            monaco.editor.setModelLanguage(this._model, lang);
        }
    }

    focus() { if (this.editor) this.editor.focus(); }

    undo() { if (this.editor) this.editor.trigger('gamepad', 'undo'); }
    redo() { if (this.editor) this.editor.trigger('gamepad', 'redo'); }
    format() { if (this.editor) this.editor.getAction('editor.action.formatDocument')?.run(); }
    commentLine() { if (this.editor) this.editor.trigger('gamepad', 'editor.action.commentLine'); }
    indent() { if (this.editor) this.editor.trigger('gamepad', 'tab'); }
    outdent() { if (this.editor) this.editor.trigger('gamepad', 'outdent'); }

    moveCursor(dx, dy) {
        if (!this.editor) return;
        const pos = this.editor.getPosition();
        if (!pos) return;
        const newPos = {
            lineNumber: Math.max(1, pos.lineNumber + dy),
            column: Math.max(1, pos.column + dx),
        };
        this.editor.setPosition(newPos);
        this.editor.revealPositionInCenter(newPos);
    }

    scroll(dx, dy) {
        if (!this.editor) return;
        const scroll = this.editor.getScrollTop();
        const scrollL = this.editor.getScrollLeft();
        this.editor.setScrollTop(scroll + dy);
        this.editor.setScrollLeft(scrollL + dx);
    }

    insertText(text) {
        if (!this.editor) return;
        const selection = this.editor.getSelection();
        const id = { major: 1, minor: 1 };
        const op = {
            identifier: id,
            range: selection,
            text,
            forceMoveMarkers: true,
        };
        this.editor.executeEdits('gamepad', [op]);
        this.editor.focus();
    }

    _getKeywords() {
        return [
            'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'do',
            'return', 'class', 'import', 'export', 'from', 'async', 'await',
            'try', 'catch', 'finally', 'throw', 'switch', 'case', 'break',
            'continue', 'typeof', 'instanceof', 'new', 'delete', 'this', 'super',
            'extends', 'static', 'constructor', 'null', 'undefined', 'true', 'false',
            'console.log', 'console.error', 'console.warn',
            'Array.from', 'Array.isArray', 'Object.keys', 'Object.values',
            'JSON.stringify', 'JSON.parse',
            'document.querySelector', 'document.getElementById',
            'addEventListener', 'setTimeout', 'setInterval',
            'Promise', 'Promise.all', 'async', 'await',
        ];
    }

    _updateStatus(pos) {
        const el = document.getElementById('status-cursor');
        if (el) el.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
    }

    setOption(key, val) {
        if (!this.editor) return;
        const opts = {};
        opts[key] = val;
        this.editor.updateOptions(opts);
    }
}
