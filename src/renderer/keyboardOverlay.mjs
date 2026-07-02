export class KeyboardOverlay {
    constructor(editorController) {
        this.editor = editorController;
        this.isOpen = false;
        this._layerIndex = 0;
        this._focusX = 0;
        this._focusY = 0;
        this._suggestionFocus = -1;
        this._suggestions = [];
        this._shifted = false;
        this._layerNames = ['ABC', 'abc', '123', '#+=', 'KW'];
        this._onCommit = null;

        this._layers = {
            'ABC': [
                ['Q','W','E','R','T','Y','U','I','O','P'],
                ['A','S','D','F','G','H','J','K','L'],
                ['⇧','Z','X','C','V','B','N','M','⌫'],
                ['@','.','/','Space','_','-','\'','Enter']
            ],
            'abc': [
                ['q','w','e','r','t','y','u','i','o','p'],
                ['a','s','d','f','g','h','j','k','l'],
                ['⇧','z','x','c','v','b','n','m','⌫'],
                ['@','.','/','Space','_','-','\'','Enter']
            ],
            '123': [
                ['1','2','3','4','5','6','7','8','9','0'],
                ['!','@','#','$','%','^','&','*','(',')'],
                ['[',']','{','}','<','>','=','+','⌫'],
                ['/','\\','|','Space','_','-','"','Enter']
            ],
            '#+=': [
                ['~','`',':',';','?','!','%','^','&','*'],
                ['+','-','*','/','%','=','<','>','⌫'],
                ['(',')','[',']','{','}','|','\\','Enter'],
                [',','.','@','Space','_','#','$','\'']
            ],
            'KW': [
                ['def','class','if','elif','else','for'],
                ['while','return','import','from','as','try'],
                ['except','finally','raise','with','yield','lambda'],
                ['pass','break','continue','True','False','None'],
            ],
        };

        this.el = document.getElementById('keyboard-overlay');
        this.grid = document.getElementById('kbd-grid');
        this.suggestionsEl = document.getElementById('kbd-suggestions');
        this.layerNameEl = document.getElementById('kbd-layer-name');

        this._buildGrid();
        this._updateFocus();
    }

    open() {
        this.isOpen = true;
        this.el.classList.remove('hidden');
        this._focusX = 0;
        this._focusY = 0;
        this._suggestionFocus = -1;
        this._updateFocus();
        this._fetchSuggestions();
    }

    close() {
        this.isOpen = false;
        this.el.classList.add('hidden');
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    nextLayer() {
        this._layerIndex = (this._layerIndex + 1) % this._layerNames.length;
        this._focusX = 0;
        this._focusY = 0;
        this._shifted = false;
        this._buildGrid();
        this._updateFocus();
        this.layerNameEl.textContent = this._layerNames[this._layerIndex];
    }

    prevLayer() {
        this._layerIndex = (this._layerIndex - 1 + this._layerNames.length) % this._layerNames.length;
        this._focusX = 0;
        this._focusY = 0;
        this._shifted = false;
        this._buildGrid();
        this._updateFocus();
        this.layerNameEl.textContent = this._layerNames[this._layerIndex];
    }

    navigate(dx, dy) {
        if (this._suggestions.length > 0 && this._suggestionFocus >= 0) {
            this._suggestionFocus += dy;
            if (this._suggestionFocus < 0) { this._suggestionFocus = -1; this._focusX = 0; this._focusY = 0; }
            else if (this._suggestionFocus >= this._suggestions.length) this._suggestionFocus = this._suggestions.length - 1;
            this._updateFocus();
            return;
        }
        if (dy !== 0) {
            const rows = this.grid.children;
            const newY = Math.max(0, Math.min(rows.length - 1, this._focusY + dy));
            const cols = rows[newY]?.querySelectorAll('.kbd-key') || [];
            this._focusX = Math.min(this._focusX, Math.max(0, cols.length - 1));
            this._focusY = newY;
        }
        if (dx !== 0) {
            const rows = this.grid.children;
            const cols = rows[this._focusY]?.querySelectorAll('.kbd-key') || [];
            this._focusX = Math.max(0, Math.min(cols.length - 1, this._focusX + dx));
        }
        this._suggestionFocus = -1;
        this._updateFocus();
    }

    confirm() {
        if (this._suggestionFocus >= 0 && this._suggestions[this._suggestionFocus]) {
            this._commitText(this._suggestions[this._suggestionFocus].label);
            return;
        }
        const rows = this.grid.children;
        if (this._focusY >= rows.length) return;
        const cols = rows[this._focusY].querySelectorAll('.kbd-key');
        if (this._focusX >= cols.length) return;
        const key = cols[this._focusX];
        const val = key.dataset.value;
        this._handleKey(val);
    }

    back() {
        this.editor.insertText('\b');
    }

    _handleKey(val) {
        if (!val) return;
        if (val === '⇧') {
            this._shifted = !this._shifted;
            this._layerIndex = this._shifted ? 0 : 1;
            if (!this._shifted && this._layerNames[this._layerIndex] === 'ABC') this._layerIndex = 1;
            this._buildGrid();
            this._updateFocus();
            this.layerNameEl.textContent = this._layerNames[this._layerIndex];
            return;
        }
        if (val === '⌫') {
            this.editor.insertText('\b');
            return;
        }
        if (val === 'Enter') {
            this.editor.insertText('\n');
            return;
        }
        if (val === 'Space') {
            this.editor.insertText(' ');
            this._fetchSuggestions();
            return;
        }
        if (val === 'Tab') {
            this.editor.insertText('    ');
            return;
        }
        this._commitText(val);
    }

    _commitText(text) {
        this.editor.insertText(text);
        if (text.endsWith('()')) {
            const pos = this.editor.editor?.getPosition();
            if (pos) this.editor.editor?.setPosition({ lineNumber: pos.lineNumber, column: pos.column - 1 });
        }
        this._fetchSuggestions();
    }

    _fetchSuggestions() {
        const text = this.editor.getValue() || '';
        const lines = text.split('\n');
        const currentLine = lines[this.editor.editor?.getPosition()?.lineNumber - 1] || '';
        const lastWord = currentLine.split(/[\s\n(){}\[\];:,.=+-/*&|^~<>!?]+/).pop() || '';
        if (!lastWord || lastWord.length < 1) {
            this._suggestions = [];
            this._suggestionFocus = -1;
            this._renderSuggestions();
            return;
        }
        const lang = this.editor.editor?.getModel()?.getLanguageId() || 'javascript';
        const kwMap = {
            javascript: [
                'function','const','let','var','if','else','for','while',
                'return','class','import','export','async','await','try',
                'catch','throw','switch','case','break','continue','typeof',
                'instanceof','new','delete','this','super','extends',
                'null','undefined','true','false',
                'console.log','console.error','console.warn',
                'setTimeout','setInterval','Promise.resolve','Array.from',
                'Object.keys','JSON.stringify','JSON.parse',
                'document.querySelector','addEventListener','fetch',
            ],
            python: [
                'def','class','if','elif','else','for','while','return',
                'import','from','as','try','except','finally','raise',
                'with','yield','lambda','pass','break','continue',
                'True','False','None','self','print','len','range',
                'isinstance','enumerate','zip','map','filter','sorted',
                'dict','list','set','tuple','str','int','float','bool',
                'open','with','as','assert','del','global','nonlocal',
                'async','await','__init__','__str__','__repr__',
            ],
            typescript: [
                'function','const','let','var','if','else','for','while',
                'return','class','import','export','from','async','await',
                'try','catch','throw','interface','type','enum','extends',
                'implements','abstract','readonly','public','private',
                'protected','static','typeof','keyof','null','undefined',
                'true','false','console.log','Promise','Array.from',
                'Object.keys','JSON.stringify',
            ],
        };
        const keywords = kwMap[lang] || kwMap.javascript;
        this._suggestions = keywords
            .filter(k => k.startsWith(lastWord) && k !== lastWord)
            .slice(0, 12)
            .map(k => ({ label: k, type: 'keyword' }));
        this._suggestionFocus = this._suggestions.length > 0 ? 0 : -1;
        this._renderSuggestions();
    }

    _buildGrid() {
        this.grid.innerHTML = '';
        const layerName = this._layerNames[this._layerIndex];
        const keys = this._layers[layerName];
        if (!keys) return;
        for (const row of keys) {
            const rowEl = document.createElement('div');
            rowEl.className = 'kbd-row';
            for (const key of row) {
                const k = document.createElement('div');
                k.className = 'kbd-key';
                if (layerName === 'KW') k.classList.add('kw');
                if (['⇧','⌫','Enter','Tab','Space'].includes(key)) k.classList.add('special');
                k.textContent = key;
                k.dataset.value = key;
                rowEl.appendChild(k);
            }
            this.grid.appendChild(rowEl);
        }
    }

    _renderSuggestions() {
        this.suggestionsEl.innerHTML = '';
        for (let i = 0; i < this._suggestions.length; i++) {
            const el = document.createElement('span');
            el.className = 'kbd-suggestion' + (i === this._suggestionFocus ? ' focused' : '');
            el.textContent = this._suggestions[i].label;
            this.suggestionsEl.appendChild(el);
        }
    }

    _updateFocus() {
        const rows = this.grid.querySelectorAll('.kbd-row');
        rows.forEach((r, ri) => {
            const keys = r.querySelectorAll('.kbd-key');
            keys.forEach((k, ki) => {
                k.classList.toggle('focused', ri === this._focusY && ki === this._focusX && this._suggestionFocus < 0);
            });
        });
        if (this._suggestionFocus >= 0) {
            const suggs = this.suggestionsEl.querySelectorAll('.kbd-suggestion');
            suggs.forEach((s, i) => s.classList.toggle('focused', i === this._suggestionFocus));
        }
        this._renderSuggestions();
    }

    layerName() { return this._layerNames[this._layerIndex]; }
}
