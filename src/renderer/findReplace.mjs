export class FindReplace {
    constructor(editorController, focusManager) {
        this.editor = editorController;
        this.focus = focusManager;
        this.isOpen = false;
        this._mode = 'find';
        this.el = document.getElementById('find-overlay');
        this.findInput = document.getElementById('find-input');
        this.replaceInput = document.getElementById('replace-input');
        this.matchCount = document.getElementById('find-match-count');
        this._matchIndex = 0;
        this._totalMatches = 0;
        this._decorations = [];

        this.findInput.addEventListener('input', () => this._find());
        this.findInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.shiftKey ? this._findPrev() : this._findNext();
            }
            if (e.key === 'Escape') this.close();
        });
        this.replaceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) this.replaceAll();
                else this.replace();
            }
            if (e.key === 'Escape') this.close();
        });

        document.getElementById('find-next-btn').addEventListener('click', () => this._findNext());
        document.getElementById('find-prev-btn').addEventListener('click', () => this._findPrev());
        document.getElementById('find-replace-btn').addEventListener('click', () => this.replace());
        document.getElementById('find-replace-all-btn').addEventListener('click', () => this.replaceAll());
        document.getElementById('find-close-btn').addEventListener('click', () => this.close());
        document.getElementById('find-toggle-replace').addEventListener('click', () => this._toggleReplace());
    }

    open(mode = 'find') {
        this._mode = mode;
        this.isOpen = true;
        this.el.classList.remove('hidden');
        this.findInput.value = '';
        this.replaceInput.value = '';
        this._updateMode();
        this.findInput.focus();
        const sel = this.editor.editor?.getSelection();
        if (sel && !sel.isEmpty()) {
            this.findInput.value = this.editor.editor?.getModel()?.getValueInRange(sel) || '';
        }
        this._find();
    }

    close() {
        this.isOpen = false;
        this.el.classList.add('hidden');
        this._clearDecorations();
        if (this.editor.editor) this.editor.editor.focus();
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    navigate(dy) {
        if (dy < 0) this._findPrev();
        else this._findNext();
    }

    confirm() {
        if (this._mode === 'replace') this.replace();
        else this._findNext();
    }

    back() {
        this.close();
    }

    _toggleReplace() {
        this._mode = this._mode === 'find' ? 'replace' : 'find';
        this._updateMode();
    }

    _updateMode() {
        document.getElementById('find-replace-row').style.display = this._mode === 'replace' ? 'flex' : 'none';
        document.getElementById('find-toggle-replace').textContent = this._mode === 'find' ? 'Replace' : 'Find';
    }

    _find() {
        if (!this.editor.editor) return;
        const query = this.findInput.value;
        if (!query) {
            this._clearDecorations();
            this.matchCount.textContent = '';
            return;
        }
        const model = this.editor.editor.getModel();
        if (!model) return;
        const matches = model.findMatches(query, true, false, false, null, true);
        this._totalMatches = matches.length;
        this._matchIndex = this._totalMatches > 0 ? 0 : -1;
        this._decorations = this.editor.editor.createDecorationsCollection(
            matches.map((m, i) => ({
                range: m.range,
                options: {
                    className: i === this._matchIndex ? 'find-match-current' : 'find-match',
                    overviewRuler: { color: i === this._matchIndex ? '#ffcc00' : '#88888833', position: 4 },
                },
            }))
        );
        if (this._totalMatches > 0) {
            this.editor.editor.setSelection(matches[0].range);
            this.editor.editor.revealRangeInCenter(matches[0].range);
        }
        this.matchCount.textContent = this._totalMatches > 0
            ? `${this._matchIndex + 1}/${this._totalMatches}` : 'No results';
    }

    _findNext() {
        if (this._totalMatches === 0) return;
        this._matchIndex = (this._matchIndex + 1) % this._totalMatches;
        this._highlightCurrent();
    }

    _findPrev() {
        if (this._totalMatches === 0) return;
        this._matchIndex = (this._matchIndex - 1 + this._totalMatches) % this._totalMatches;
        this._highlightCurrent();
    }

    _highlightCurrent() {
        if (!this.editor.editor || this._totalMatches === 0) return;
        const model = this.editor.editor.getModel();
        if (!model) return;
        const matches = model.findMatches(this.findInput.value, true, false, false, null, true);
        this._decorations.clear();
        this._decorations = this.editor.editor.createDecorationsCollection(
            matches.map((m, i) => ({
                range: m.range,
                options: {
                    className: i === this._matchIndex ? 'find-match-current' : 'find-match',
                    overviewRuler: { color: i === this._matchIndex ? '#ffcc00' : '#88888833', position: 4 },
                },
            }))
        );
        this.editor.editor.setSelection(matches[this._matchIndex].range);
        this.editor.editor.revealRangeInCenter(matches[this._matchIndex].range);
        this.matchCount.textContent = `${this._matchIndex + 1}/${this._totalMatches}`;
    }

    replace() {
        if (this._totalMatches === 0 || this._matchIndex < 0) return;
        if (!this.editor.editor) return;
        const model = this.editor.editor.getModel();
        if (!model) return;
        const matches = model.findMatches(this.findInput.value, true, false, false, null, true);
        if (this._matchIndex >= matches.length) return;
        const range = matches[this._matchIndex].range;
        this.editor.editor.executeEdits('find-replace', [
            { range, text: this.replaceInput.value, forceMoveMarkers: true },
        ]);
        this._find();
    }

    replaceAll() {
        if (this._totalMatches === 0) return;
        if (!this.editor.editor) return;
        const model = this.editor.editor.getModel();
        if (!model) return;
        const matches = model.findMatches(this.findInput.value, true, false, false, null, true);
        this.editor.editor.executeEdits('find-replace-all',
            matches.map(m => ({ range: m.range, text: this.replaceInput.value, forceMoveMarkers: true }))
        );
        this._find();
    }

    _clearDecorations() {
        if (this._decorations && this._decorations.clear) {
            this._decorations.clear();
        }
        this._decorations = [];
    }
}
