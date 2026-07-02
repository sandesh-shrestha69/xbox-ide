export class CommandRegistry {
    constructor() {
        this._commands = new Map();
        this._defaults();
    }

    register(id, fn, { label, category, key } = {}) {
        this._commands.set(id, { fn, label, category, key });
    }

    execute(id, ...args) {
        const cmd = this._commands.get(id);
        if (!cmd) { console.warn(`Unknown command: ${id}`); return; }
        return cmd.fn(...args);
    }

    get(id) { return this._commands.get(id); }

    all() {
        return Array.from(this._commands.entries()).map(([id, c]) => ({ id, ...c }));
    }

    search(query) {
        const q = query.toLowerCase();
        return this.all().filter(c =>
            c.label?.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q)
        );
    }

    _defaults() {
        const noop = () => {};
        const defaults = [
            ['file.open', noop, 'Open File', 'File'],
            ['file.save', noop, 'Save', 'File'],
            ['tab.next', noop, 'Next Tab', 'Tab'],
            ['tab.prev', noop, 'Previous Tab', 'Tab'],
            ['tab.close', noop, 'Close Tab', 'Tab'],
            ['tab.closeAll', noop, 'Close All Tabs', 'Tab'],
            ['editor.focus', noop, 'Focus Editor', 'Editor'],
            ['editor.undo', noop, 'Undo', 'Editor'],
            ['editor.redo', noop, 'Redo', 'Editor'],
            ['editor.indent', noop, 'Indent', 'Editor'],
            ['editor.outdent', noop, 'Outdent', 'Editor'],
            ['editor.comment', noop, 'Toggle Comment', 'Editor'],
            ['editor.format', noop, 'Format Document', 'Editor'],
            ['explorer.focus', noop, 'Focus Explorer', 'View'],
            ['explorer.toggle', noop, 'Toggle Explorer', 'View'],
            ['explorer.collapse', noop, 'Collapse All', 'View'],
            ['panel.toggle', noop, 'Toggle Panel', 'View'],
            ['panel.terminal', noop, 'Focus Terminal', 'View'],
            ['panel.problems', noop, 'Focus Problems', 'View'],
            ['commandPalette.open', noop, 'Command Palette', 'View'],
            ['keyboard.toggle', noop, 'Toggle Keyboard', 'View'],
            ['settings.open', noop, 'Open Settings', 'Preferences'],
            ['settings.theme', noop, 'Toggle Theme', 'Preferences'],
            ['focus.next', noop, 'Next Focus Zone', 'Navigation'],
            ['focus.prev', noop, 'Previous Focus Zone', 'Navigation'],
            ['contextMenu', noop, 'Context Menu', 'Editor'],
            ['find.open', noop, 'Find', 'Find'],
            ['find.replace', noop, 'Find and Replace', 'Find'],
            ['find.next', noop, 'Find Next', 'Find'],
            ['find.prev', noop, 'Find Previous', 'Find'],
            ['file.new', noop, 'New File', 'File'],
            ['file.saveAs', noop, 'Save As', 'File'],
            ['snippet.insert', noop, 'Insert Snippet', 'Editor'],
            ['emmet.expand', noop, 'Expand Emmet Abbreviation', 'Editor'],
            ['split.horizontal', noop, 'Split Editor Horizontally', 'View'],
            ['split.vertical', noop, 'Split Editor Vertically', 'View'],
            ['split.unsplit', noop, 'Unsplit Editor', 'View'],
            ['split.nextPane', noop, 'Next Pane', 'View'],
            ['split.prevPane', noop, 'Previous Pane', 'View'],
            ['git.toggle', noop, 'Toggle Git Panel', 'View'],
            ['git.refresh', noop, 'Refresh Git Status', 'View'],
            ['git.commit', noop, 'Git Commit', 'View'],
            ['terminal.focus', noop, 'Focus Terminal', 'View'],
            ['extensions.show', noop, 'Show Extensions', 'View'],
            ['manual.toggle', noop, 'Toggle Controls', 'View'],
        ];
        for (const [id, fn, label, category] of defaults) {
            this.register(id, fn, { label, category });
        }
    }
}
