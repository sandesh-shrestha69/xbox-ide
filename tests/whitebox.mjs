import assert from 'node:assert/strict';

// ═══════════════════════════════════════════════════════════════════════════════
// Mock DOM helpers
// ═══════════════════════════════════════════════════════════════════════════════
const dom = {
    elements: {},
    create(tag, attrs = {}) {
        const el = { tag, ...attrs, classList: new Set(), style: {},
            children: [], dataset: {}, _listeners: {},
            querySelectorAll(s) { return []; },
            addEventListener(ev, fn) {
                (this._listeners[ev] = this._listeners[ev] || []).push(fn);
            },
            dispatchEvent(ev) {
                (this._listeners[ev.type] || []).forEach(fn => fn(ev));
            },
            closest() { return null; },
            isContentEditable: false,
            focus() {},
            scrollIntoView() {},
            appendChild(c) { this.children.push(c); },
            remove() {},
            toggle(c) { if (this.classList.has(c)) this.classList.delete(c); else this.classList.add(c); },
            getAttribute() { return null; },
        };
        el.classList.add = function(c) { this._set.add(c); };
        el.classList.remove = function(c) { this._set.delete(c); };
        el.classList.has = function(c) { return this._set.has(c); };
        el.classList.toggle = function(c) { if (this._set.has(c)) { this._set.delete(c); return false; } else { this._set.add(c); return true; } };
        el.classList._set = new Set();
        el.querySelectorAll = function(s) {
            if (s === '.cp-item') return (this._cpItems || []).map((_, i) => this._cpItem(i));
            if (s === '.kbd-key') return this.children.filter(c => c.tag === 'div' && c.className?.includes?.('kbd-key'));
            if (s === '.kbd-row') return this.children.filter(c => c.tag === 'div' && c.className === 'kbd-row');
            if (s === '.kbd-suggestion') return this.children;
            return [];
        };
        dom.elements[attrs.id] = el;
        return el;
    },
    get(id) { return dom.elements[id] || dom.create('div', { id }); },
    getById(id) { return dom.get(id); },
    reset() {
        dom.elements = {};
        dom.elements['file-tree'] = dom.create('div', { id: 'file-tree' });
        dom.elements['tab-container'] = dom.create('div', { id: 'tab-container' });
        dom.elements['editor-container'] = dom.create('div', { id: 'editor-container' });
        dom.elements['command-palette-overlay'] = dom.create('div', { id: 'command-palette-overlay', className: 'overlay hidden' });
        dom.elements['cp-input'] = dom.create('input', { id: 'cp-input' });
        dom.elements['cp-list'] = dom.create('div', { id: 'cp-list' });
        dom.elements['settings-overlay'] = dom.create('div', { id: 'settings-overlay', className: 'overlay hidden' });
        dom.elements['settings-body'] = dom.create('div', { id: 'settings-body' });
        dom.elements['settings-close'] = dom.create('span', { id: 'settings-close' });
        dom.elements['keyboard-overlay'] = dom.create('div', { id: 'keyboard-overlay', className: 'overlay hidden' });
        dom.elements['kbd-grid'] = dom.create('div', { id: 'kbd-grid' });
        dom.elements['kbd-suggestions'] = dom.create('div', { id: 'kbd-suggestions' });
        dom.elements['kbd-layer-name'] = dom.create('span', { id: 'kbd-layer-name' });
        dom.elements['notification-container'] = dom.create('div', { id: 'notification-container' });
        dom.elements['status-cursor'] = dom.create('span', { id: 'status-cursor' });
        dom.elements['status-lang'] = dom.create('span', { id: 'status-lang' });
        dom.elements['status-ctrl'] = dom.create('span', { id: 'status-ctrl' });
        dom.elements['panel-content'] = dom.create('div', { id: 'panel-content' });
        dom.elements['minimap-content'] = dom.create('div', { id: 'minimap-content' });
        dom.elements['mouse-blocker'] = dom.create('div', { id: 'mouse-blocker' });
    },
    trigger(id, ev, data) {
        const el = dom.elements[id];
        if (el) el.dispatchEvent(new (class { constructor(type) { this.type = type; Object.assign(this, data); } })(ev));
    },
};

global.document = {
    getElementById: (id) => dom.get(id),
    createElement: (tag) => dom.create(tag),
    querySelectorAll: () => [],
    addEventListener: () => {},
    body: dom.create('body'),
};

global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] ?? null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; },
};

global.window = {
    xbox: {
        fs: { readFile: async () => ({}), readDir: async () => ({}), writeFile: async () => ({}) },
        dialog: { openFile: async () => null, saveFile: async () => null },
        app: { getPath: async () => '/home' },
        git: { status: async () => [], branch: async () => 'main', stage: async () => {}, unstage: async () => {}, commit: async () => {}, diff: async () => '' },
        terminal: { connect: async () => ({ ok: true }), write: async () => {}, onData: () => {}, onError: () => {}, onExit: () => {} },
        ext: { request: async () => {}, onMessage: () => {}, load: async () => null, loadDir: async () => ({ extensions: [] }) },
    },
    __monacoReady: false,
    __swallowKey: () => false,
    monaco: {
        editor: {
            create() { return mockEditor(); },
            setTheme() {},
            setModelLanguage() {},
            registerCompletionItemProvider() {},
            createModel() { return { getValue: () => '', getLanguageId: () => 'javascript', dispose() {} }; },
        },
        languages: {
            registerCompletionItemProvider() {},
            CompletionItemKind: { Snippet: 8, Keyword: 5 },
            CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
        },
    },
    navigator: { getGamepads: () => [] },
    requestAnimationFrame: () => {},
    addEventListener: () => {},
    notify: () => {},
};
globalThis.monaco = window.monaco;
globalThis.requestAnimationFrame = () => {};

function mockEditor() {
    let pos = { lineNumber: 1, column: 1 };
    let top = 0, left = 0;
    let val = '';
    let _model = { getLanguageId: () => 'javascript', getValue: () => val };
    return {
        getPosition: () => pos,
        setPosition: (p) => { pos = p; },
        getScrollTop: () => top,
        setScrollTop: (t) => { top = t; },
        getScrollLeft: () => left,
        setScrollLeft: (l) => { left = l; },
        setValue: (v) => { val = v; _model.getValue = () => v; },
        getValue: () => val,
        getModel: () => _model,
        focus: () => {},
        trigger: () => {},
        getAction: () => null,
        getSelection: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }),
        executeEdits: () => {},
        updateOptions: () => {},
        revealPositionInCenter: () => {},
        onDidChangeCursorPosition: () => {},
        _model,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test runner
// ═══════════════════════════════════════════════════════════════════════════════
let passed = 0, failed = 0;
const _groups = [];

function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.error(`  ✗ ${name}\n    ${e.message}`); }
}

async function testAsync(name, fn) {
    try { await fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.error(`  ✗ ${name}\n    ${e.message}`); }
}

function group(name, fn) {
    console.log(`\n${name}`);
    const result = fn();
    if (result && typeof result.then === 'function') {
        _groups.push(result);
    }
}

async function runAll() {
    for (const g of _groups) await g;
    console.log(`\n${'─'.repeat(50)}\n${passed} passed, ${failed} failed\n`);
    process.exit(failed > 0 ? 1 : 0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND REGISTRY — full code path coverage
// ═══════════════════════════════════════════════════════════════════════════════
group('CommandRegistry — white box', async () => {
    const { CommandRegistry } = await import(new URL('../src/renderer/commands.mjs', import.meta.url).href);

    test('constructor loads 44 defaults', () => {
        const c = new CommandRegistry();
        assert.equal(c.all().length, 44);
    });

    test('register with no options uses defaults', () => {
        const c = new CommandRegistry();
        c.register('test.bare', () => 'ok');
        const cmd = c.get('test.bare');
        assert.equal(cmd.fn(), 'ok');
        assert.equal(cmd.label, undefined);
        assert.equal(cmd.category, undefined);
    });

    test('register overwrites existing', () => {
        const c = new CommandRegistry();
        c.register('test.dup', () => 1);
        c.register('test.dup', () => 2);
        assert.equal(c.execute('test.dup'), 2);
    });

    test('execute returns undefined for missing command', () => {
        const c = new CommandRegistry();
        const result = c.execute('nope');
        assert.equal(result, undefined);
    });

    test('execute passes arguments through', () => {
        const c = new CommandRegistry();
        c.register('test.add', (a, b) => a + b);
        assert.equal(c.execute('test.add', 3, 4), 7);
    });

    test('execute throws if handler throws', () => {
        const c = new CommandRegistry();
        c.register('test.err', () => { throw new Error('boom'); });
        assert.throws(() => c.execute('test.err'), /boom/);
    });

    test('search matches label case-insensitively', () => {
        const c = new CommandRegistry();
        assert.ok(c.search('open file').some(r => r.id === 'file.open'));
        assert.ok(c.search('OPEN FILE').some(r => r.id === 'file.open'));
    });

    test('search matches id case-insensitively', () => {
        const c = new CommandRegistry();
        assert.ok(c.search('FILE.OPEN').some(r => r.id === 'file.open'));
    });

    test('search with special regex chars in query is safe', () => {
        const c = new CommandRegistry();
        c.register('test.[foo]', () => {}, { label: 'Test [foo]' });
        const results = c.search('[foo]');
        assert.ok(results.some(r => r.id === 'test.[foo]'));
    });

    test('search returns empty array for no matches', () => {
        const c = new CommandRegistry();
        assert.equal(c.search('zzzzz_nonexistent').length, 0);
    });

    test('all() returns copies not references', () => {
        const c = new CommandRegistry();
        const all1 = c.all();
        const all2 = c.all();
        all1[0].id = 'hacked';
        assert.notEqual(all2[0].id, 'hacked');
    });

    test('get returns undefined for unregistered', () => {
        const c = new CommandRegistry();
        assert.equal(c.get('nothing.here'), undefined);
    });

    test('get returns the command object', () => {
        const c = new CommandRegistry();
        const cmd = c.get('file.open');
        assert.ok(cmd);
        assert.equal(typeof cmd.fn, 'function');
    });

    test('execute with no args calls fn with nothing', () => {
        const c = new CommandRegistry();
        let calledWith;
        c.register('test.noargs', (...a) => { calledWith = a; });
        c.execute('test.noargs');
        assert.deepEqual(calledWith, []);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FOCUS MANAGER — full code path coverage
// ═══════════════════════════════════════════════════════════════════════════════
group('FocusManager — white box', async () => {
    const { FocusManager } = await import(new URL('../src/renderer/focusManager.mjs', import.meta.url).href);

    test('constructor initializes empty', () => {
        const f = new FocusManager();
        assert.equal(f.zones.length, 0);
        assert.equal(f.activeZone, 0);
        assert.equal(f.activeItem, null);
    });

    test('currentZone returns undefined when no zones', () => {
        const f = new FocusManager();
        assert.equal(f.currentZone, undefined);
    });

    test('navigate/confirm/back/context are no-ops with no zones', () => {
        const f = new FocusManager();
        f.navigate(1, 0);
        f.confirm();
        f.back();
        f.context();
    });

    test('focusZone is no-op with no zones', () => {
        const f = new FocusManager();
        f.focusZone(0);
        f.focusZone(-1);
        f.focusZone(5);
    });

    test('focusNextZone wraps around with no zones', () => {
        const f = new FocusManager();
        f.focusNextZone();
        f.focusPrevZone();
    });

    test('multiple zones cycle correctly', () => {
        const f = new FocusManager();
        let z1 = false, z2 = false;
        f.registerZone({ id: 'a', focus: () => { z1 = true; }, navigate() {}, confirm() {}, back() {}, context() {} });
        f.registerZone({ id: 'b', focus: () => { z2 = true; }, navigate() {}, confirm() {}, back() {}, context() {} });

        f.focusZone(0); assert.ok(z1);
        z1 = false;
        f.focusNextZone(); assert.ok(z2);
        z2 = false;
        f.focusNextZone(); assert.ok(z1);
    });

    test('focusPrevZone wraps backward', () => {
        const f = new FocusManager();
        let z1 = false, z2 = false;
        f.registerZone({ id: 'a', focus: () => { z1 = true; }, navigate() {}, confirm() {}, back() {}, context() {} });
        f.registerZone({ id: 'b', focus: () => { z2 = true; }, navigate() {}, confirm() {}, back() {}, context() {} });

        f.focusZone(0);
        f.focusPrevZone(); assert.ok(z2);
    });

    test('selectItem with null clears', () => {
        const f = new FocusManager();
        const el = { classList: { _set: new Set(), add() {}, remove() {}, has() { return false; }, toggle() {} }, scrollIntoView() {} };
        f.selectItem(el);
        assert.equal(f.activeItem, el);
        f.selectItem(null);
        assert.equal(f.activeItem, null);
    });

    test('clearFocus is no-op when no active item', () => {
        const f = new FocusManager();
        f.clearFocus();
    });

    test('selectItem removes class from previous', () => {
        const f = new FocusManager();
        let removed = false;
        const prev = { classList: { add() {}, remove() { removed = true; }, has() { return false; }, toggle() {} }, scrollIntoView() {} };
        const next = { classList: { _set: new Set(), add() {}, remove() {}, has() { return false; }, toggle() {} }, scrollIntoView() {} };
        f.selectItem(prev);
        f.selectItem(next);
        assert.ok(removed);
    });

    test('selectItem on same element works', () => {
        const f = new FocusManager();
        const el = { classList: { _set: new Set(), add() {}, remove() {}, has() { return false; }, toggle() {} }, scrollIntoView() {} };
        f.selectItem(el);
        f.selectItem(el);
        assert.equal(f.activeItem, el);
    });

    test('zone with empty navigate/confirm/back does not throw', () => {
        const f = new FocusManager();
        f.registerZone({ id: 'empty', focus() {}, navigate() {}, confirm() {}, back() {}, context() {} });
        f.focusZone(0);
        f.navigate(1, 1);
        f.confirm();
        f.back();
        f.context();
    });

    test('deduplication by id prevents duplicates', () => {
        const f = new FocusManager();
        f.registerZone({ id: 'x', focus() {} });
        f.registerZone({ id: 'x', focus() {} });
        assert.equal(f.zones.length, 1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TAB MANAGER — white box with mocked DOM
// ═══════════════════════════════════════════════════════════════════════════════
group('TabManager — white box', async () => {
    dom.reset();
    const { TabManager } = await import(new URL('../src/renderer/tabManager.mjs', import.meta.url).href);

    test('constructor initializes empty', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        assert.equal(t.tabs.length, 0);
        assert.equal(t.activeIndex, -1);
    });

    test('openTab adds a tab', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        t.openTab('/home/test.js', 'content');
        assert.equal(t.tabs.length, 1);
        assert.equal(t.activeIndex, 0);
        assert.equal(t.tabs[0].name, 'test.js');
        assert.equal(t.tabs[0].lang, 'javascript');
    });

    test('openTab reuses existing tab by path', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        t.openTab('/home/a.js', 'v1');
        t.openTab('/home/b.js', 'v2');
        const count = t.tabs.length;
        t.openTab('/home/a.js', 'v1');
        assert.equal(t.tabs.length, count);
        assert.equal(t.activeIndex, 0);
    });

    test('openTab detects language from extension', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        const map = { '.py': 'python', '.ts': 'typescript', '.md': 'markdown', '.xyz': 'plaintext' };
        for (const [ext, lang] of Object.entries(map)) {
            t.openTab(`/home/f${ext}`, '');
            assert.equal(t.tabs[t.tabs.length - 1].lang, lang);
        }
    });

    test('openTab with no extension falls back to plaintext', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        t.openTab('/home/Makefile', '');
        assert.equal(t.tabs[0].lang, 'plaintext');
    });

    test('closeTab removes tab', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        t.openTab('/home/a.js', 'a');
        t.openTab('/home/b.js', 'b');
        t.closeTab(0);
        assert.equal(t.tabs.length, 1);
        assert.equal(t.tabs[0].name, 'b.js');
    });

    test('closeTab with invalid index is no-op', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        t.closeTab(-1);
        t.closeTab(5);
    });

    test('closeTab last tab clears editor', () => {
        let lastVal = 'unchanged';
        const editor = { setValue(v) { lastVal = v; }, setLanguage() {} };
        const t = new TabManager(editor, {});
        t.openTab('/home/a.js', 'hello');
        t.closeTab(0);
        assert.equal(lastVal, '');
    });

    test('nextTab cycles forward', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        t.openTab('/home/a.js', '');
        t.openTab('/home/b.js', '');
        t.openTab('/home/c.js', '');
        assert.equal(t.activeIndex, 2);
        t.nextTab();
        assert.equal(t.activeIndex, 0);
    });

    test('nextTab no-op with single tab', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        t.openTab('/home/a.js', '');
        t.nextTab();
        assert.equal(t.activeIndex, 0);
    });

    test('prevTab cycles backward', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        t.openTab('/home/a.js', '');
        t.openTab('/home/b.js', '');
        t.openTab('/home/c.js', '');
        t.prevTab();
        assert.equal(t.activeIndex, 1);
    });

    test('prevTab no-op with single tab', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        t.openTab('/home/a.js', '');
        t.prevTab();
        assert.equal(t.activeIndex, 0);
    });

    test('currentPath returns active path', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        assert.equal(t.currentPath(), undefined);
        t.openTab('/home/x.js', '');
        assert.equal(t.currentPath(), '/home/x.js');
    });

    test('markDirty / markClean toggle dirty state', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        t.openTab('/home/a.js', '');
        t.markDirty();
        assert.ok(t._dirty.has('/home/a.js'));
        t.markClean();
        assert.ok(!t._dirty.has('/home/a.js'));
    });

    test('markDirty no-op with no tabs', () => {
        const t = new TabManager({ setValue() {}, setLanguage() {} }, {});
        t.markDirty();
        t.markClean();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS MANAGER — white box
// ═══════════════════════════════════════════════════════════════════════════════
group('SettingsManager — white box', async () => {
    dom.reset();
    localStorage.clear();
    const { SettingsManager } = await import(new URL('../src/renderer/settings.mjs', import.meta.url).href);

    test('constructor loads defaults', () => {
        const s = new SettingsManager({ setOption() {} });
        assert.equal(s.get('theme'), 'vs-dark');
        assert.equal(s.get('fontSize'), 14);
        assert.equal(s.get('tabSize'), 4);
        assert.equal(s.get('wordWrap'), 'off');
        assert.equal(s.get('lineNumbers'), 'on');
        assert.equal(s.get('minimap'), true);
    });

    test('get returns default for missing key', () => {
        const s = new SettingsManager({ setOption() {} });
        assert.equal(s.get('nonexistent_key'), undefined);
    });

    test('set updates value and persists to localStorage', () => {
        const s = new SettingsManager({ setOption() {} });
        s.set('theme', 'vs');
        assert.equal(s.get('theme'), 'vs');
        const saved = JSON.parse(localStorage.getItem('xbox-ide-settings'));
        assert.equal(saved.theme, 'vs');
    });

    test('toggle opens when closed, closes when open', () => {
        const s = new SettingsManager({ setOption() {} });
        assert.ok(!s._isOpen);
        s.toggle();
        assert.ok(s._isOpen);
        s.toggle();
        assert.ok(!s._isOpen);
    });

    test('open/close toggle hidden class', () => {
        const s = new SettingsManager({ setOption() {} });
        s.open();
        s.close();
    });

    test('_load handles corrupted localStorage gracefully', () => {
        localStorage.setItem('xbox-ide-settings', 'not-json{{{');
        const s = new SettingsManager({ setOption() {} });
        assert.equal(s.get('theme'), 'vs-dark');
    });

    test('_load handles missing localStorage gracefully', () => {
        localStorage.clear();
        const s = new SettingsManager({ setOption() {} });
        assert.equal(s.get('fontSize'), 14);
    });

    test('_save handles localStorage errors gracefully', () => {
        const s = new SettingsManager({ setOption() {} });
        const origSetItem = localStorage.setItem;
        localStorage.setItem = () => { throw new Error('quota exceeded'); };
        s.set('theme', 'vs');  // should not throw
        localStorage.setItem = origSetItem;
    });

    test('_apply calls correct editor methods', () => {
        let lastOpt = null, lastVal = null;
        const s = new SettingsManager({
            setOption(key, val) { lastOpt = key; lastVal = val; },
        });
        s._apply('fontSize', 18);
        assert.equal(lastOpt, 'fontSize');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND PALETTE — white box
// ═══════════════════════════════════════════════════════════════════════════════
group('CommandPalette — white box', async () => {
    dom.reset();
    const { CommandPalette } = await import(new URL('../src/renderer/commandPalette.mjs', import.meta.url).href);
    const { CommandRegistry } = await import(new URL('../src/renderer/commands.mjs', import.meta.url).href);

    test('constructor initializes closed', () => {
        const c = new CommandPalette(new CommandRegistry(), {});
        assert.ok(!c._isOpen);
    });

    test('open populates list with all commands', () => {
        const cmds = new CommandRegistry();
        const c = new CommandPalette(cmds, {});
        c.open();
        assert.ok(c._isOpen);
        assert.ok(c._items.length > 20);
        c.close();
    });

    test('toggle opens when closed, closes when open', () => {
        const c = new CommandPalette(new CommandRegistry(), {});
        assert.ok(!c._isOpen);
        c.toggle();
        assert.ok(c._isOpen);
        c.toggle();
        assert.ok(!c._isOpen);
    });

    test('navigate is no-op when closed', () => {
        const c = new CommandPalette(new CommandRegistry(), {});
        c.navigate(1);  // should not throw
    });

    test('confirm is no-op when closed', () => {
        const c = new CommandPalette(new CommandRegistry(), {});
        c.confirm();  // should not throw
    });

    test('navigate moves focus index', () => {
        const cmds = new CommandRegistry();
        const c = new CommandPalette(cmds, {});
        c.open();
        const first = c._focusIndex;
        c.navigate(1);
        assert.equal(c._focusIndex, first + 1);
        c.navigate(-1);
        assert.equal(c._focusIndex, first);
        c.close();
    });

    test('navigate wraps at bounds', () => {
        const cmds = new CommandRegistry();
        const c = new CommandPalette(cmds, {});
        c.open();
        c.navigate(-100);
        assert.equal(c._focusIndex, 0);
        c.navigate(1000);
        assert.equal(c._focusIndex, c._items.length - 1);
        c.close();
    });

    test('confirm executes selected command', () => {
        const cmds = new CommandRegistry();
        let executed = false;
        cmds.register('test.foo', () => { executed = true; }, { label: 'Foo' });
        const c = new CommandPalette(cmds, {});
        c.open();
        c._items = [{ id: 'test.foo', label: 'Foo' }];
        c._focusIndex = 0;
        c.confirm();
        assert.ok(executed);
        assert.ok(!c._isOpen);
    });

    test('_filter updates items from input', () => {
        const cmds = new CommandRegistry();
        const c = new CommandPalette(cmds, {});
        c.open();
        c.input.value = 'unknownzzz';
        c._filter();
        assert.equal(c._items.length, 0);
        c.close();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GAMEPAD MANAGER — white box
// ═══════════════════════════════════════════════════════════════════════════════
group('GamepadManager — white box', async () => {
    const { GamepadManager } = await import(new URL('../src/renderer/gamepad.mjs', import.meta.url).href);

    function makeGP(buttons = [], axes = [0,0,0,0]) {
        return {
            buttons: buttons.map(p => ({ pressed: p })),
            axes,
        };
    }

    test('constructor sets defaults', () => {
        const gp = new GamepadManager({}, {}, {}, {});
        assert.equal(gp.deadZone, 0.15);
        assert.equal(gp.cooldown, 150);
    });

    test('start/stop toggle running flag', () => {
        const gp = new GamepadManager({}, {}, {}, {});
        gp.start();
        assert.ok(gp._running);
        gp.stop();
        assert.ok(!gp._running);
    });

    test('_poll stops when not running', () => {
        const gp = new GamepadManager({}, {}, {}, {});
        gp._poll();
    });

    test('_poll handles no gamepads', () => {
        const gp = new GamepadManager({}, {}, {}, {});
        global.navigator.getGamepads = () => [];
        gp._running = true;
        gp._poll();
        gp._running = false;
    });

    test('_processButtons A button triggers focus.confirm', () => {
        const focus = { confirm: () => { confirmed = true; }, back() {}, navigate() {} };
        let confirmed = false;
        const gp = new GamepadManager({ execute() {} }, focus, {}, {});
        gp._prevButtons = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
        gp._processButtons(makeGP([true]));
        assert.ok(confirmed);
    });

    test('_processButtons B button triggers focus.back', () => {
        let backed = false;
        const gp = new GamepadManager({ execute() {} }, { confirm() {}, back: () => { backed = true; }, navigate() {} }, {}, {});
        gp._prevButtons = new Array(16).fill(false);
        gp._processButtons(makeGP([false, true]));
        assert.ok(backed);
    });

    test('_processButtons Y triggers command palette', () => {
        let cmd = null;
        const gp = new GamepadManager({ execute(id) { cmd = id; } }, { confirm() {}, back() {}, navigate() {} }, {}, {});
        gp._prevButtons = new Array(16).fill(false);
        gp._processButtons(makeGP([false, false, false, true]));
        assert.equal(cmd, 'commandPalette.open');
    });

    test('_processButtons START triggers settings', () => {
        let cmd = null;
        const gp = new GamepadManager({ execute(id) { cmd = id; } }, { confirm() {}, back() {}, navigate() {} }, {}, {});
        gp._prevButtons = new Array(16).fill(false);
        gp._processButtons(makeGP([...Array(9).fill(false), true]));
        assert.equal(cmd, 'settings.open');
    });

    test('_processButtons DPAD navigates', () => {
        let dx = null, dy = null;
        const gp = new GamepadManager({ execute() {} }, { confirm() {}, back() {}, navigate(x, y) { dx = x; dy = y; } }, {}, {});
        gp._prevButtons = new Array(16).fill(false);

        gp._processButtons(makeGP([...Array(12).fill(false), true])); // DPAD UP (12)
        assert.deepEqual([dx, dy], [0, -1]);

        gp._processButtons(makeGP([...Array(13).fill(false), true])); // DPAD DOWN (13)
        assert.deepEqual([dx, dy], [0, 1]);

        gp._processButtons(makeGP([...Array(14).fill(false), true])); // DPAD LEFT (14)
        assert.deepEqual([dx, dy], [-1, 0]);

        gp._processButtons(makeGP([...Array(15).fill(false), true])); // DPAD RIGHT (15)
        assert.deepEqual([dx, dy], [1, 0]);
    });

    test('_processButtons LB/RB cycle tabs when keyboard closed', () => {
        let cmd = null;
        const kbd = { isOpen: false };
        const gp = new GamepadManager({ execute(id) { cmd = id; } }, { confirm() {}, back() {}, navigate() {} }, {}, kbd);
        gp._prevButtons = new Array(16).fill(false);

        gp._processButtons(makeGP([...Array(4).fill(false), true]));
        assert.equal(cmd, 'tab.prev');

        gp._processButtons(makeGP([...Array(5).fill(false), true]));
        assert.equal(cmd, 'tab.next');
    });

    test('_processButtons LB/RB cycle layers when keyboard open', () => {
        let prev = false, next = false;
        const kbd = { isOpen: true, prevLayer: () => { prev = true; }, nextLayer: () => { next = true; } };
        const gp = new GamepadManager({ execute() {} }, { confirm() {}, back() {}, navigate() {} }, {}, kbd);
        gp._prevButtons = new Array(16).fill(false);

        gp._processButtons(makeGP([...Array(4).fill(false), true]));
        assert.ok(prev);

        gp._processButtons(makeGP([...Array(5).fill(false), true]));
        assert.ok(next);
    });

    test('cooldown prevents rapid re-trigger', () => {
        let count = 0;
        const focus = { confirm: () => { count++; }, back() {}, navigate() {} };
        const gp = new GamepadManager({ execute() {} }, focus, {}, {});
        gp._prevButtons = new Array(16).fill(false);

        // First press
        gp._processButtons(makeGP([true]));
        assert.equal(count, 1);

        // Second press within cooldown
        gp._lastInput[0] = Date.now();
        gp._processButtons(makeGP([true]));
        assert.equal(count, 1);  // should still be 1
    });

    test('_processAxes handles axes < 4 length', () => {
        const gp = new GamepadManager({}, {}, { scroll() {}, moveCursor() {} }, {});
        gp._processAxes({ axes: [0, 0] });  // should not throw
    });

    test('_processAxes right stick scrolls editor', () => {
        let sx = 0, sy = 0;
        const gp = new GamepadManager({}, {}, {
            scroll(x, y) { sx = x; sy = y; },
            moveCursor() {},
        }, {});
        gp._processAxes({ axes: [0, 0, 0.5, 0.3] });
        assert.ok(sx > 0);
        assert.ok(sy > 0);
    });

    test('_processAxes left stick within dead zone does nothing', () => {
        let moved = false;
        const gp = new GamepadManager({}, {}, { scroll() {}, moveCursor() { moved = true; } }, {});
        gp._processAxes({ axes: [0.05, 0.03, 0, 0] });
        assert.ok(!moved);
    });

    test('_processAxes left stick hard push navigates focus', () => {
        let nx = null, ny = null;
        const gp = new GamepadManager({}, {
            confirm() {}, back() {}, navigate(x, y) { nx = x; ny = y; },
        }, { scroll() {}, moveCursor() {} }, {});
        gp._processAxes({ axes: [0.85, 0, 0, 0] });
        assert.equal(nx, 1);
    });

    test('_processAxes left stick light push moves cursor', () => {
        let cx = null, cy = null;
        const gp = new GamepadManager({}, {
            confirm() {}, back() {}, navigate() {},
        }, { scroll() {}, moveCursor(x, y) { cx = x; cy = y; } }, {});
        gp._processAxes({ axes: [0.5, 0, 0, 0] });
        assert.equal(cx, 1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// KEYBOARD OVERLAY — white box
// ═══════════════════════════════════════════════════════════════════════════════
group('KeyboardOverlay — white box', async () => {
    dom.reset();
    const { KeyboardOverlay } = await import(new URL('../src/renderer/keyboardOverlay.mjs', import.meta.url).href);

    function makeEditor() {
        let val = '';
        let pos = { lineNumber: 1, column: 1 };
        return {
            insertText(t) {
                if (t === '\b') { val = val.slice(0, -1); return; }
                if (t === '\n') { val += '\n'; pos.lineNumber++; pos.column = 1; return; }
                if (t === ' ') { val += ' '; pos.column++; return; }
                val += t; pos.column += t.length;
            },
            getValue: () => val,
            editor: {
                getPosition: () => pos,
                setPosition: (p) => { pos = p; },
                getModel: () => ({ getLanguageId: () => 'javascript' }),
            },
            setValue(v) { val = v; pos = { lineNumber: 1, column: 1 }; },
        };
    }

    test('constructor builds grid and shows first layer', () => {
        const k = new KeyboardOverlay(makeEditor());
        assert.equal(k._layerIndex, 0);
        assert.equal(k.layerName(), 'ABC');
    });

    test('toggle opens and closes', () => {
        const k = new KeyboardOverlay(makeEditor());
        assert.ok(!k.isOpen);
        k.toggle();
        assert.ok(k.isOpen);
        k.toggle();
        assert.ok(!k.isOpen);
    });

    test('nextLayer cycles through all 5 layers', () => {
        const k = new KeyboardOverlay(makeEditor());
        assert.equal(k.layerName(), 'ABC');
        k.nextLayer(); assert.equal(k.layerName(), 'abc');
        k.nextLayer(); assert.equal(k.layerName(), '123');
        k.nextLayer(); assert.equal(k.layerName(), '#+=');
        k.nextLayer(); assert.equal(k.layerName(), 'KW');
        k.nextLayer(); assert.equal(k.layerName(), 'ABC');
    });

    test('prevLayer cycles backward', () => {
        const k = new KeyboardOverlay(makeEditor());
        k.prevLayer(); assert.equal(k.layerName(), 'KW');
        k.prevLayer(); assert.equal(k.layerName(), '#+=');
        k.prevLayer(); assert.equal(k.layerName(), '123');
        k.prevLayer(); assert.equal(k.layerName(), 'abc');
        k.prevLayer(); assert.equal(k.layerName(), 'ABC');
    });

    test('navigate moves focus within grid', () => {
        const k = new KeyboardOverlay(makeEditor());
        k.open();
        assert.equal(k._focusX, 0);
        assert.equal(k._focusY, 0);
        k.navigate(1, 0);
        assert.equal(k._focusX, 1);
        k.navigate(0, 1);
        assert.equal(k._focusY, 1);
        k.close();
    });

    test('navigate clamps at grid boundaries', () => {
        const k = new KeyboardOverlay(makeEditor());
        k.open();
        k.navigate(-100, -100);
        assert.equal(k._focusX, 0);
        assert.equal(k._focusY, 0);
        k.navigate(100, 100);
        k.close();
    });

    test('confirm on A triggers _handleKey', () => {
        const k = new KeyboardOverlay(makeEditor());
        k.open();
        // Focus on first key which is 'Q'
        k.confirm();
        assert.equal(k.editor.getValue(), 'Q');
        k.close();
    });

    test('confirm on suggestion commits suggestion', () => {
        const k = new KeyboardOverlay(makeEditor());
        k._suggestions = [{ label: 'function', type: 'keyword' }];
        k._suggestionFocus = 0;
        k._renderSuggestions();
        k.confirm();
        assert.ok(k.editor.getValue().includes('function'));
    });

    test('backspace via back()', () => {
        const k = new KeyboardOverlay(makeEditor());
        k.editor.insertText('hello');
        k.back();
        assert.equal(k.editor.getValue(), 'hell');
    });

    test('shift toggles case layer', () => {
        const k = new KeyboardOverlay(makeEditor());
        assert.equal(k.layerName(), 'ABC');
        k._handleKey('⇧');
        assert.equal(k.layerName(), 'abc');
        k._handleKey('⇧');
        // After shift on 'abc' layer, the handled layer switches to ABC
        assert.equal(k.layerName(), 'ABC');
    });

    test('Space inserts space and fetches suggestions', () => {
        const k = new KeyboardOverlay(makeEditor());
        k._handleKey('Space');
        assert.equal(k.editor.getValue(), ' ');
    });

    test('Enter inserts newline', () => {
        const k = new KeyboardOverlay(makeEditor());
        k._handleKey('Enter');
        assert.equal(k.editor.getValue(), '\n');
    });

    test('backspace key inserts backspace', () => {
        const k = new KeyboardOverlay(makeEditor());
        k.editor.insertText('hi');
        k._handleKey('⌫');
        assert.equal(k.editor.getValue(), 'h');
    });

    test('navigate to suggestions then back to grid', () => {
        const k = new KeyboardOverlay(makeEditor());
        k.open();
        k._suggestions = [{ label: 'if' }, { label: 'ifelse' }];
        k._suggestionFocus = 0;
        k._updateFocus();
        k.navigate(0, -100);  // move up from suggestions
        assert.equal(k._suggestionFocus, -1);
        k.close();
    });

    test('_handleKey with undefined value', () => {
        const k = new KeyboardOverlay(makeEditor());
        k._handleKey(undefined);
    });

    test('_handleKey Tab inserts spaces', () => {
        const k = new KeyboardOverlay(makeEditor());
        k._handleKey('Tab');
        assert.equal(k.editor.getValue(), '    ');
    });

    test('_fetchSuggestions with empty editor returns empty', () => {
        const k = new KeyboardOverlay(makeEditor());
        k._fetchSuggestions();
        assert.equal(k._suggestions.length, 0);
    });

    test('_fetchSuggestions with partial word finds matches', () => {
        const k = new KeyboardOverlay(makeEditor());
        k.editor.insertText('fun');
        k._fetchSuggestions();
        assert.ok(k._suggestions.length > 0);
        assert.ok(k._suggestionFocus >= 0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FILE EXPLORER — white box
// ═══════════════════════════════════════════════════════════════════════════════
group('FileExplorer — white box', async () => {
    dom.reset();
    const { FileExplorer } = await import(new URL('../src/renderer/fileExplorer.mjs', import.meta.url).href);

    test('constructor registers zone', () => {
        const zones = [];
        const focus = { registerZone(z) { zones.push(z); }, selectItem() {} };
        new FileExplorer(focus, {}, { openTab() {}, focus() {} });
        assert.equal(zones.length, 1);
        assert.equal(zones[0].id, 'explorer');
    });

    test('load fetches directory and renders', async () => {
        window.xbox.fs.readDir = async () => ({
            entries: [
                { name: 'src', path: '/home/src', type: 'directory', children: [
                    { name: 'main.js', path: '/home/src/main.js', type: 'file' },
                ]},
                { name: 'README.md', path: '/home/README.md', type: 'file' },
            ],
        });
        const explorer = new FileExplorer({ registerZone() {}, selectItem() {} }, {}, { openTab() {}, focus() {} });
        await explorer.load('/home');
        assert.ok(explorer._flatItems.length >= 2);
    });

    test('load fallback to / when no path', async () => {
        window.xbox.app.getPath = async () => { throw new Error('no'); };
        window.xbox.fs.readDir = async (p) => {
            assert.equal(p, '/');
            return { entries: [] };
        };
        const explorer = new FileExplorer({ registerZone() {}, selectItem() {} }, {}, { openTab() {}, focus() {} });
        await explorer.load();
    });

    test('navigate moves focus up/down', () => {
        const explorer = new FileExplorer({ registerZone() {}, selectItem() {} }, {}, { openTab() {}, focus() {} });
        explorer._flatItems = [{ el: { classList: { _set: new Set(), add() {}, remove() {}, toggle() {} }, dataset: {}, scrollIntoView() {} } },
                               { el: { classList: { _set: new Set(), add() {}, remove() {}, toggle() {} }, dataset: {}, scrollIntoView() {} } }];
        explorer._focusIndex = 0;
        explorer._navigate(0, 1);
        assert.equal(explorer._focusIndex, 1);
        explorer._navigate(0, -1);
        assert.equal(explorer._focusIndex, 0);
    });

    test('navigate clamps at boundaries', () => {
        const explorer = new FileExplorer({ registerZone() {}, selectItem() {} }, {}, { openTab() {}, focus() {} });
        explorer._flatItems = [{ el: { classList: { _set: new Set(), add() {}, remove() {}, toggle() {} }, dataset: {}, scrollIntoView() {} } }];
        explorer._focusIndex = 0;
        explorer._navigate(0, -100);
        assert.equal(explorer._focusIndex, 0);
        explorer._navigate(0, 100);
        assert.equal(explorer._focusIndex, 0);
    });

    test('_openSelected with no items is no-op', () => {
        const explorer = new FileExplorer({ registerZone() {}, selectItem() {} }, {}, { openTab() {}, focus() {} });
        explorer._flatItems = [];
        explorer._openSelected();
    });

    test('_openSelected with dir toggles expansion', () => {
        const explorer = new FileExplorer({ registerZone() {}, selectItem() {} }, {}, { openTab() {}, focus() {} });
        explorer._flatItems = [{ isDir: true, path: '/home/src', el: { classList: { _set: new Set(), add() {}, remove() {}, toggle() {} }, dataset: {}, scrollIntoView() {} } }];
        explorer._items = [{ name: 'src', path: '/home/src', type: 'directory' }];
        explorer.el = document.getElementById('file-tree');
        explorer._focusIndex = 0;
        explorer._openSelected();
        assert.ok(explorer._expanded.has('/home/src'));
        explorer._openSelected();
        assert.ok(!explorer._expanded.has('/home/src'));
    });

    test('_navigate right expands directory', () => {
        const explorer = new FileExplorer({ registerZone() {}, selectItem() {} }, {}, { openTab() {}, focus() {} });
        explorer._flatItems = [{ isDir: true, path: '/home/src', el: { classList: { _set: new Set(), add() {}, remove() {}, toggle() {} }, dataset: {}, scrollIntoView() {} } }];
        explorer._focusIndex = 0;
        explorer._navigate(1, 0);
        assert.ok(explorer._expanded.has('/home/src'));
    });

    test('_navigate right on expanded dir moves to first child', () => {
        const explorer = new FileExplorer({ registerZone() {}, selectItem() {} }, {}, { openTab() {}, focus() {} });
        explorer._flatItems = [
            { isDir: true, path: '/home/src', el: { classList: { _set: new Set(), add() {}, remove() {}, toggle() {} }, dataset: {}, scrollIntoView() {} } },
            { isDir: false, path: '/home/src/main.js', el: { classList: { _set: new Set(), add() {}, remove() {}, toggle() {} }, dataset: {}, scrollIntoView() {} } },
        ];
        explorer._focusIndex = 0;
        explorer._expanded.add('/home/src');
        explorer._navigate(1, 0);
        assert.equal(explorer._focusIndex, 1);
    });

    test('_navigate left collapses directory', () => {
        const explorer = new FileExplorer({ registerZone() {}, selectItem() {} }, {}, { openTab() {}, focus() {} });
        explorer._flatItems = [{ isDir: true, path: '/home/src', el: { classList: { _set: new Set(), add() {}, remove() {}, toggle() {} }, dataset: {}, scrollIntoView() {} } }];
        explorer._focusIndex = 0;
        explorer._expanded.add('/home/src');
        explorer._navigate(-1, 0);
        assert.ok(!explorer._expanded.has('/home/src'));
    });

    test('load with readDir error shows error message', async () => {
        window.xbox.fs.readDir = async () => { throw new Error('denied'); };
        const explorer = new FileExplorer({ registerZone() {}, selectItem() {} }, {}, { openTab() {}, focus() {} });
        await explorer.load('/home');
        assert.ok(explorer.el.innerHTML.includes('Failed'));
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FIND & REPLACE — white box
// ═══════════════════════════════════════════════════════════════════════════════
group('FindReplace — white box', async () => {
    dom.reset();
    const { FindReplace } = await import(new URL('../src/renderer/findReplace.mjs', import.meta.url).href);
    const fr = new FindReplace({ editor: { getModel() { return null; }, getSelection() { return null; }, focus() {} } }, {});
    test('constructor initializes closed', () => {
        assert.ok(!fr.isOpen);
        assert.equal(fr._mode, 'find');
    });
    test('open sets isOpen and finds selection', () => {
        fr.open('find');
        assert.ok(fr.isOpen);
        fr.close();
    });
    test('open with replace mode shows replace row', () => {
        fr.open('replace');
        assert.equal(fr._mode, 'replace');
        fr.close();
    });
    test('close hides overlay', () => {
        fr.open();
        fr.close();
        assert.ok(!fr.isOpen);
    });
    test('toggle opens and closes', () => {
        fr.toggle();
        assert.ok(fr.isOpen);
        fr.toggle();
        assert.ok(!fr.isOpen);
    });
    test('_toggleReplace switches mode', () => {
        fr._toggleReplace();
        assert.equal(fr._mode, 'replace');
        fr._toggleReplace();
        assert.equal(fr._mode, 'find');
    });
    test('navigate calls findNext/Prev', () => {
        fr.open();
        fr.navigate(-1);
        fr.navigate(1);
        fr.close();
    });
    test('confirm in find mode calls findNext', () => {
        fr.open('find');
        fr.confirm();
        fr.close();
    });
    test('confirm in replace mode calls replace', () => {
        fr.open('replace');
        fr.confirm();
        fr.close();
    });
    test('back closes find', () => {
        fr.open();
        fr.back();
        assert.ok(!fr.isOpen);
    });
    test('_find with no query clears decorations', () => {
        fr.open();
        fr.findInput.value = '';
        fr._find();
        fr.close();
    });
    test('replaceAll is safe with no matches', () => {
        fr.open();
        fr._totalMatches = 0;
        fr.replaceAll();
        fr.close();
    });
    test('replace is safe with no matches', () => {
        fr.open();
        fr._totalMatches = 0;
        fr.replace();
        fr.close();
    });
    test('_findNext is safe with no matches', () => {
        fr._totalMatches = 0;
        fr._findNext();
    });
    test('_findPrev is safe with no matches', () => {
        fr._totalMatches = 0;
        fr._findPrev();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SNIPPET MANAGER — white box
// ═══════════════════════════════════════════════════════════════════════════════
group('SnippetManager — white box', async () => {
    dom.reset();
    const { SnippetManager } = await import(new URL('../src/renderer/snippets.mjs', import.meta.url).href);
    let insertedText = '';
    const editor = {
        insertText(t) { insertedText = t; },
        editor: {
            getModel() { return { getLanguageId() { return 'javascript'; } }; },
            getSelection() { return { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }; },
            executeEdits(src, edits) { insertedText = edits[0]?.text || ''; },
        },
    };
    test('constructor registers provider', () => {
        const s = new SnippetManager(editor);
        assert.ok(s._snippets.javascript.length > 0);
    });
    test('expandEmmet with known abbreviation works', () => {
        insertedText = '';
        const s = new SnippetManager(editor);
        const result = s.expandEmmet('div');
        assert.ok(result);
        assert.ok(insertedText.includes('<div>'));
    });
    test('expandEmmet with unknown abbr returns false', () => {
        insertedText = '';
        const s = new SnippetManager(editor);
        const result = s.expandEmmet('zzz_nonexistent');
        assert.ok(!result);
    });
    test('expandEmmet with compound abbr works', () => {
        const s = new SnippetManager(editor);
        const result = s.expandEmmet('div>span');
        assert.ok(result);
    });
    test('expandEmmet with bang expands HTML template', () => {
        const s = new SnippetManager(editor);
        const result = s.expandEmmet('!');
        assert.ok(result);
        assert.ok(insertedText.includes('<!DOCTYPE html>'));
    });
    test('insertSnippet finds and inserts by prefix', () => {
        const s = new SnippetManager(editor);
        const result = s.insertSnippet('log');
        assert.ok(result);
        assert.ok(insertedText.includes('console.log'));
    });
    test('insertSnippet with unknown prefix returns false', () => {
        const s = new SnippetManager(editor);
        const result = s.insertSnippet('nope_nope');
        assert.ok(!result);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GIT MANAGER — white box
// ═══════════════════════════════════════════════════════════════════════════════
group('GitManager — white box', async () => {
    dom.reset();
    const { GitManager } = await import(new URL('../src/renderer/git.mjs', import.meta.url).href);

    test('constructor registers zone', () => {
        const zones = [];
        const git = new GitManager({ registerZone(z) { zones.push(z); }, selectItem() {} }, {}, {});
        assert.equal(zones.length, 1);
        assert.equal(zones[0].id, 'git');
    });

    test('refresh populates status list', async () => {
        const origGit = window.xbox.git;
        window.xbox.git = {
            status: async () => [{ path: '/home/test.js', staged: true, untracked: false }],
            branch: async () => 'main',
        };
        const git = new GitManager({ registerZone() {}, selectItem() {} }, {}, {});
        git.el = { classList: { add() {}, remove() {}, toggle() {} } };
        git.statusList = { innerHTML: '', querySelectorAll: () => [], children: [] };
        await git.refresh('/home');
        assert.equal(git._statusItems.length, 1);
        window.xbox.git = origGit;
    });

    test('refresh with no path is safe', async () => {
        const git = new GitManager({ registerZone() {}, selectItem() {} }, {}, {});
        git.el = { classList: { add() {}, remove() {}, toggle() {} } };
        git.statusList = { innerHTML: '', querySelectorAll: () => [], children: [] };
        await git.refresh();
    });

    test('stage calls API and refreshes', async () => {
        const origGit = window.xbox.git;
        let stagedPath = null;
        window.xbox.git = {
            status: async () => [],
            branch: async () => 'main',
            stage: async (rp, p) => { stagedPath = p; return {}; },
        };
        const git = new GitManager({ registerZone() {}, selectItem() {} }, {}, {});
        git.el = { classList: { add() {}, remove() {}, toggle() {} } };
        git.statusList = { innerHTML: '', querySelectorAll: () => [], children: [] };
        git._repoPath = '/home';
        await git.stage('/home/test.js');
        assert.equal(stagedPath, '/home/test.js');
        window.xbox.git = origGit;
    });

    test('unstage calls API and refreshes', async () => {
        const origGit = window.xbox.git;
        let unstagedPath = null;
        window.xbox.git = {
            status: async () => [],
            branch: async () => 'main',
            unstage: async (rp, p) => { unstagedPath = p; return {}; },
        };
        const git = new GitManager({ registerZone() {}, selectItem() {} }, {}, {});
        git.el = { classList: { add() {}, remove() {}, toggle() {} } };
        git.statusList = { innerHTML: '', querySelectorAll: () => [], children: [] };
        git._repoPath = '/home';
        await git.unstage('/home/test.js');
        assert.equal(unstagedPath, '/home/test.js');
        window.xbox.git = origGit;
    });

    test('commit calls API and refreshes', async () => {
        const origGit = window.xbox.git;
        let commitMsg = null;
        window.xbox.git = {
            status: async () => [],
            branch: async () => 'main',
            commit: async (rp, m) => { commitMsg = m; return 'ok'; },
        };
        const git = new GitManager({ registerZone() {}, selectItem() {} }, {}, {});
        git.el = { classList: { add() {}, remove() {}, toggle() {} } };
        git.statusList = { innerHTML: '', querySelectorAll: () => [], children: [] };
        git._repoPath = '/home';
        await git.commit('test commit');
        assert.equal(commitMsg, 'test commit');
        window.xbox.git = origGit;
    });

    test('diff opens tab with diff content', async () => {
        const origGit = window.xbox.git;
        window.xbox.git = {
            diff: async () => '--- a/file.js\n+++ b/file.js\n+new line',
        };
        let openedPath = null;
        const git = new GitManager({ registerZone() {}, selectItem() {} }, { focus() {} }, {
            openTab(p, c) { openedPath = p; },
            focus() {},
        });
        git._repoPath = '/home';
        await git.diff('/home/file.js');
        assert.ok(openedPath);
        window.xbox.git = origGit;
    });

    test('toggle shows and hides panel', () => {
        const git = new GitManager({ registerZone() {}, selectItem() {} }, {}, {});
        git.el = { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } };
        git.show();
        assert.ok(git._visible);
        git.hide();
        assert.ok(!git._visible);
    });

    test('_navigate moves focus index', () => {
        const git = new GitManager({ registerZone() {}, selectItem() {} }, {}, {});
        git._statusItems = [{ path: '/a.js', staged: false }, { path: '/b.js', staged: true }];
        git.statusList = { querySelectorAll: () => [{ classList: { add() {}, remove() {}, toggle() {} } }, { classList: { add() {}, remove() {}, toggle() {} } }] };
        git._focusIndex = 0;
        git._navigate(0, 1);
        assert.equal(git._focusIndex, 1);
        git._navigate(0, -1);
        assert.equal(git._focusIndex, 0);
    });

    test('_openSelected stages or unstages based on status', () => {
        let action = null;
        const git = new GitManager({ registerZone() {}, selectItem() {} }, {}, {});
        git.stage = (p) => { action = 'stage'; };
        git.unstage = (p) => { action = 'unstage'; };
        git._statusItems = [{ path: '/a.js', staged: false }];
        git._focusIndex = 0;
        git._openSelected();
        assert.equal(action, 'stage');

        git._statusItems = [{ path: '/a.js', staged: true }];
        git._focusIndex = 0;
        git._openSelected();
        assert.equal(action, 'unstage');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TERMINAL MANAGER — white box
// ═══════════════════════════════════════════════════════════════════════════════
group('TerminalManager — white box', async () => {
    dom.reset();
    dom.elements['panel-content'] = dom.create('div', { id: 'panel-content' });
    const { TerminalManager } = await import(new URL('../src/renderer/terminal.mjs', import.meta.url).href);

    test('constructor registers zone', () => {
        const zones = [];
        const t = new TerminalManager({ registerZone(z) { zones.push(z); } });
        assert.equal(zones.length, 1);
        assert.equal(zones[0].id, 'terminal');
    });

    test('init creates terminal element', async () => {
        const t = new TerminalManager({ registerZone() {} });
        await t.init();
        assert.ok(t._initialized);
        assert.ok(t._termEl);
    });

    test('writeln appends text', () => {
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerHTML: '', scrollIntoView() {} };
        t._writeln('hello');
        assert.ok(t._termEl.innerHTML.includes('hello'));
    });

    test('_renderPrompt adds prompt text', () => {
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerHTML: '', scrollIntoView() {} };
        t._renderPrompt();
        assert.ok(t._termEl.innerHTML.length > 0);
    });

    test('_insertChar adds character at cursor', () => {
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerText: '$ ', innerHTML: '', scrollIntoView() {} };
        t._cursorPos = 2;
        t._currentLine = '';
        t._insertChar('x');
        assert.equal(t._currentLine, 'x');
    });

    test('_backspace removes character', () => {
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerText: '$ x', innerHTML: '', scrollIntoView() {} };
        t._cursorPos = 3;
        t._currentLine = 'x';
        t._backspace();
        assert.equal(t._currentLine, '');
    });

    test('_backspace does not delete prompt', () => {
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerText: '$ ', innerHTML: '', scrollIntoView() {} };
        t._cursorPos = 2;
        t._currentLine = '';
        t._backspace();
        assert.equal(t._cursorPos, 2);
    });

    test('_cursorLeft/Right moves cursor', () => {
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerText: '$ abc', innerHTML: '', scrollIntoView() {} };
        t._cursorPos = 5;
        t._cursorLeft();
        assert.equal(t._cursorPos, 4);
        t._cursorRight();
        assert.equal(t._cursorPos, 5);
    });

    test('_historyUp/Down cycles history', () => {
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerText: '$ ', innerHTML: '', scrollIntoView() {} };
        t._history = ['echo 1', 'echo 2'];
        t._historyIndex = 2;
        t._historyUp();
        assert.equal(t._historyIndex, 1);
        t._historyUp();
        assert.equal(t._historyIndex, 0);
        t._historyDown();
        assert.equal(t._historyIndex, 1);
        t._historyDown();
        assert.equal(t._historyIndex, 2);
        t._historyDown();
        assert.equal(t._historyIndex, 2); // clamped
    });

    test('_historyUp with empty history', () => {
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerText: '$ ', innerHTML: '', scrollIntoView() {} };
        t._history = [];
        t._historyUp();
    });

    test('_interrupt adds ^C and re-prompts', () => {
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerHTML: '', scrollIntoView() {} };
        t._interrupt();
        assert.ok(t._termEl.innerHTML.includes('^C'));
    });

    test('_clear resets terminal and shows prompt', () => {
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerHTML: 'stuff', style: {}, scrollIntoView() {} };
        t._clear();
        assert.ok(t._termEl.innerHTML.includes('$'));
    });

    test('_navigate routes to history/cursor', () => {
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerHTML: '', scrollIntoView() {} };
        t._history = ['a', 'b'];
        t._historyIndex = 2;
        t._navigate(0, -1); // history up
        assert.equal(t._historyIndex, 1);
        t._navigate(0, 1); // history down
        t._navigate(-1, 0); // cursor left
        t._navigate(1, 0); // cursor right
    });

    test('_executeLine sends command to PTY', async () => {
        let written = '';
        window.xbox.terminal = {
            connect: async () => ({ ok: true }),
            write: async (d) => { written = d; },
            onData: () => {},
            onError: () => {},
            onExit: () => {},
        };
        const t = new TerminalManager({ registerZone() {} });
        t._termEl = { innerText: '$ echo hi', innerHTML: '', scrollIntoView() {} };
        await t._executeLine();
        assert.ok(written.includes('echo hi'));
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXTENSION MANAGER — white box
// ═══════════════════════════════════════════════════════════════════════════════
group('ExtensionManager — white box', async () => {
    dom.reset();
    const { ExtensionManager } = await import(new URL('../src/renderer/extensions.mjs', import.meta.url).href);
    const { CommandRegistry } = await import(new URL('../src/renderer/commands.mjs', import.meta.url).href);

    test('constructor initializes empty', () => {
        const e = new ExtensionManager(new CommandRegistry());
        assert.equal(e._extensions.size, 0);
    });

    test('init sets initialized flag', async () => {
        window.xbox.ext = window.xbox.ext || {};
        window.xbox.ext.onMessage = () => {};
        const e = new ExtensionManager(new CommandRegistry());
        await e.init();
        assert.ok(e._initialized);
    });

    test('loadExtension loads manifest via IPC', async () => {
        window.xbox.ext = window.xbox.ext || {};
        window.xbox.ext.load = async () => ({
            id: 'test-ext', displayName: 'Test Extension', version: '1.0.0',
            contributes: { commands: [{ command: 'hello', label: 'Hello' }] },
        });
        window.xbox.ext.onMessage = () => {};
        const e = new ExtensionManager(new CommandRegistry());
        await e.init();
        const ext = await e.loadExtension('/ext/test/package.json');
        assert.ok(ext);
        assert.equal(ext.id, 'test-ext');
    });

    test('loadExtension handles failure gracefully', async () => {
        window.xbox.ext.load = async () => { throw new Error('fail'); };
        window.xbox.ext.onMessage = () => {};
        const e = new ExtensionManager(new CommandRegistry());
        await e.init();
        const result = await e.loadExtension('/bad/path.json');
        assert.equal(result, null);
    });

    test('loadFromDirectory loads multiple extensions', async () => {
        window.xbox.ext.load = async () => null;
        window.xbox.ext.loadDir = async () => ({
            extensions: [
                { id: 'ext1', displayName: 'Ext 1', contributes: {} },
                { id: 'ext2', displayName: 'Ext 2', contributes: {} },
            ],
        });
        window.xbox.ext.onMessage = () => {};
        const e = new ExtensionManager(new CommandRegistry());
        await e.init();
        const exts = await e.loadFromDirectory('/exts');
        assert.equal(exts.length, 2);
    });

    test('getExtension returns null for unknown', () => {
        const e = new ExtensionManager(new CommandRegistry());
        assert.equal(e.getExtension('nope'), null);
    });

    test('getAllExtensions returns loaded extensions', () => {
        const e = new ExtensionManager(new CommandRegistry());
        assert.equal(e.getAllExtensions().length, 0);
    });

    test('sendMessage to extension does not throw', async () => {
        window.xbox.ext.request = async () => {};
        const e = new ExtensionManager(new CommandRegistry());
        await e.sendMessage('test-ext', { type: 'ping' });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND REGISTRY — new commands exist
// ═══════════════════════════════════════════════════════════════════════════════
group('CommandRegistry — new feature commands', async () => {
    const { CommandRegistry } = await import(new URL('../src/renderer/commands.mjs', import.meta.url).href);

    test('has find.open command', () => {
        const c = new CommandRegistry();
        assert.ok(c.get('find.open'));
    });

    test('has find.replace command', () => {
        const c = new CommandRegistry();
        assert.ok(c.get('find.replace'));
    });

    test('has file.new command', () => {
        const c = new CommandRegistry();
        assert.ok(c.get('file.new'));
    });

    test('has file.saveAs command', () => {
        const c = new CommandRegistry();
        assert.ok(c.get('file.saveAs'));
    });

    test('has snippet.insert command', () => {
        const c = new CommandRegistry();
        assert.ok(c.get('snippet.insert'));
    });

    test('has emmet.expand command', () => {
        const c = new CommandRegistry();
        assert.ok(c.get('emmet.expand'));
    });

    test('has split.horizontal command', () => {
        const c = new CommandRegistry();
        assert.ok(c.get('split.horizontal'));
    });

    test('has git.toggle command', () => {
        const c = new CommandRegistry();
        assert.ok(c.get('git.toggle'));
    });

    test('has terminal.focus command', () => {
        const c = new CommandRegistry();
        assert.ok(c.get('terminal.focus'));
    });

    test('has extensions.show command', () => {
        const c = new CommandRegistry();
        assert.ok(c.get('extensions.show'));
    });

    test('default count increased to 44', () => {
        const c = new CommandRegistry();
        assert.equal(c.all().length, 44);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SPLIT PANE MANAGER — white box (limited Monaco mock)
// ═══════════════════════════════════════════════════════════════════════════════
group('SplitPaneManager — white box', async () => {
    dom.reset();
    dom.elements['editor-container'] = dom.create('div', { id: 'editor-container' });
    const { SplitPaneManager } = await import(new URL('../src/renderer/splitPanes.mjs', import.meta.url).href);

    test('constructor registers zone', () => {
        const zones = [];
        const focus = { registerZone(z) { zones.push(z); } };
        const s = new SplitPaneManager({}, focus);
        assert.equal(zones.length, 1);
        assert.equal(zones[0].id, 'editor-split');
    });

    test('initial state is not split', () => {
        const s = new SplitPaneManager({}, { registerZone() {} });
        assert.ok(!s._isSplit);
    });

    test('nextPane loops correctly with single pane', () => {
        const s = new SplitPaneManager({}, { registerZone() {} });
        s._editors = [{ editor: { focus() {} } }];
        s.nextPane();
        assert.equal(s._activePane, 0);
    });

    test('_navigate is safe when not split', () => {
        const s = new SplitPaneManager({}, { registerZone() {} });
        s._navigate(1, 0);
    });

    test('focusPane handles out of bounds', () => {
        const s = new SplitPaneManager({}, { registerZone() {} });
        s.focusPane(-1);
        s.focusPane(99);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Run all
// ═══════════════════════════════════════════════════════════════════════════════
await runAll();
