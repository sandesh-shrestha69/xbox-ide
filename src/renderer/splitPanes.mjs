export class SplitPaneManager {
    constructor(editorController, focusManager) {
        this.editor = editorController;
        this.focus = focusManager;
        this.container = document.getElementById('editor-container');
        this._panes = [];
        this._activePane = 0;
        this._direction = 'horizontal';
        this._editors = [editorController];
        this._isSplit = false;

        this._paneEls = [];

        this.focus.registerZone({
            id: 'editor-split',
            focus: () => this._focusActive(),
            navigate: (dx, dy) => this._navigate(dx, dy),
            confirm: () => {},
            back: () => {},
            context: () => {},
        });
    }

    get activeEditor() { return this._editors[this._activePane]; }

    split(direction) {
        if (this._isSplit) return;
        this._direction = direction || 'horizontal';
        this._isSplit = true;

        const models = [];
        if (this.editor.editor) {
            models.push(this.editor.editor.getModel());
        }

        this.container.innerHTML = '';
        this._paneEls = [];
        this._editors = [];

        for (let i = 0; i < 2; i++) {
            const pane = document.createElement('div');
            pane.className = 'split-pane' + (i === 0 ? ' active' : '');
            pane.dataset.pane = String(i);
            this.container.appendChild(pane);
            this._paneEls.push(pane);

            const ec = new EditorController(`split-editor-${i}`);
            ec.container = pane;
            this._editors.push(ec);
        }

        this._editors[0].editor = this.editor.editor;
        if (this.editor._model) {
            this._editors[0]._model = this.editor._model;
        }

        const secondModel = models[0] ? monaco.editor.createModel(models[0].getValue(), models[0].getLanguageId()) : null;
        if (secondModel) {
            this._editors[1].editor = monaco.editor.create(this._paneEls[1], {
                model: secondModel,
                theme: 'vs-dark',
                fontSize: 14,
                fontFamily: 'Consolas, "Cascadia Code", monospace',
                lineNumbers: 'on',
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                tabSize: 4,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                contextmenu: false,
            });
            this._editors[1]._model = secondModel;
        }

        this._activePane = 0;
        this._applyLayout();
        this._focusActive();
    }

    unsplit() {
        if (!this._isSplit) return;
        const primaryEditor = this._editors[0].editor;
        const primaryModel = this._editors[0]._model;

        for (let i = 1; i < this._editors.length; i++) {
            if (this._editors[i].editor) {
                this._editors[i].editor.dispose();
            }
            if (this._editors[i]._model) {
                this._editors[i]._model.dispose();
            }
        }

        this._editors = [this.editor];
        this._editors[0].editor = primaryEditor;
        this._editors[0]._model = primaryModel;
        this._editors[0].container = this.container;
        this.container.innerHTML = '';
        const mainPane = document.createElement('div');
        mainPane.className = 'split-pane active';
        mainPane.style.width = '100%';
        mainPane.style.height = '100%';
        this.container.appendChild(mainPane);
        this._paneEls = [mainPane];

        if (primaryEditor) {
            primaryEditor._domElement = null;
            const oldContainer = primaryEditor.getContainerDomNode ? primaryEditor.getContainerDomNode() : null;
            if (oldContainer && oldContainer.parentNode) {
                oldContainer.parentNode.removeChild(oldContainer);
            }
            mainPane.appendChild(mainPane);
            primaryEditor.layout();
        }

        this._isSplit = false;
        this._activePane = 0;
        this.editor.editor = primaryEditor || this.editor.editor;
    }

    focusPane(index) {
        if (index < 0 || index >= this._editors.length) return;
        this._activePane = index;
        this._updatePaneFocus();
        const ec = this._editors[index];
        if (ec && ec.editor) ec.editor.focus();
    }

    nextPane() {
        this.focusPane((this._activePane + 1) % this._editors.length);
    }

    prevPane() {
        this.focusPane((this._activePane - 1 + this._editors.length) % this._editors.length);
    }

    _navigate(dx, dy) {
        if (!this._isSplit) return;
        if (this._direction === 'horizontal') {
            if (dx > 0) this.nextPane();
            else if (dx < 0) this.prevPane();
        } else {
            if (dy > 0) this.nextPane();
            else if (dy < 0) this.prevPane();
        }
    }

    _focusActive() {
        const ec = this._editors[this._activePane];
        if (ec && ec.editor) ec.editor.focus();
    }

    _updatePaneFocus() {
        this._paneEls.forEach((el, i) => {
            el.classList.toggle('active', i === this._activePane);
        });
    }

    _applyLayout() {
        this._paneEls.forEach((el) => {
            if (this._direction === 'horizontal') {
                el.style.width = '50%';
                el.style.height = '100%';
                el.style.float = 'left';
            } else {
                el.style.width = '100%';
                el.style.height = '50%';
            }
        });
        if (this._editors[1] && this._editors[1].editor) {
            this._editors[1].editor.layout();
        }
    }
}

class EditorController {
    constructor(id) {
        this.container = null;
        this.editor = null;
        this._model = null;
        this._decorations = [];
    }

    setValue(val) { if (this.editor) this.editor.setValue(val); }
    getValue() { return this.editor ? this.editor.getValue() : ''; }
    setLanguage(lang) { if (this._model) monaco.editor.setModelLanguage(this._model, lang); }
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
        this.editor.setPosition({
            lineNumber: Math.max(1, pos.lineNumber + dy),
            column: Math.max(1, pos.column + dx),
        });
        this.editor.revealPositionInCenter(pos);
    }

    scroll(dx, dy) {
        if (!this.editor) return;
        this.editor.setScrollTop(this.editor.getScrollTop() + dy);
        this.editor.setScrollLeft(this.editor.getScrollLeft() + dx);
    }

    insertText(text) {
        if (!this.editor) return;
        this.editor.executeEdits('gamepad', [{
            identifier: { major: 1, minor: 1 },
            range: this.editor.getSelection(),
            text,
            forceMoveMarkers: true,
        }]);
        this.editor.focus();
    }

    setOption(key, val) {
        if (this.editor) this.editor.updateOptions({ [key]: val });
    }
}
