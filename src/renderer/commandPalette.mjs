export class CommandPalette {
    constructor(commandRegistry, focusManager) {
        this.cmds = commandRegistry;
        this.focus = focusManager;
        this.el = document.getElementById('command-palette-overlay');
        this.input = document.getElementById('cp-input');
        this.list = document.getElementById('cp-list');
        this._isOpen = false;
        this._items = [];
        this._focusIndex = 0;

        this.input.addEventListener('input', () => this._filter());
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._confirm();
            if (e.key === 'ArrowDown') { e.preventDefault(); this._navigate(1); }
            if (e.key === 'ArrowUp') { e.preventDefault(); this._navigate(-1); }
            if (e.key === 'Escape') this.close();
        });
    }

    open() {
        this._isOpen = true;
        this.el.classList.remove('hidden');
        this.input.value = '';
        this._items = this.cmds.search('');
        this._focusIndex = 0;
        this._render();
        this.input.focus();
    }

    close() {
        this._isOpen = false;
        this.el.classList.add('hidden');
    }

    toggle() {
        if (this._isOpen) this.close();
        else this.open();
    }

    navigate(dy) {
        if (!this._isOpen) return;
        this._navigate(dy);
    }

    confirm() {
        if (!this._isOpen) return;
        this._confirm();
    }

    _navigate(dy) {
        this._focusIndex = Math.max(0, Math.min(this._items.length - 1, this._focusIndex + dy));
        this._updateFocus();
    }

    _confirm() {
        const item = this._items[this._focusIndex];
        if (item) {
            this.close();
            this.cmds.execute(item.id);
        }
    }

    _filter() {
        this._items = this.cmds.search(this.input.value);
        this._focusIndex = 0;
        this._render();
    }

    _render() {
        this.list.innerHTML = '';
        this._items.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'cp-item' + (i === this._focusIndex ? ' focused' : '');
            div.innerHTML = `<span>${item.label || item.id}</span><span class="cp-key">${item.category || ''}</span>`;
            this.list.appendChild(div);
        });
        this._updateFocus();
    }

    _updateFocus() {
        const items = this.list.querySelectorAll('.cp-item');
        items.forEach((el, i) => el.classList.toggle('focused', i === this._focusIndex));
        const current = items[this._focusIndex];
        if (current) current.scrollIntoView({ block: 'nearest' });
    }
}
