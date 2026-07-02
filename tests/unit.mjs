import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Load renderer modules via dynamic import with proper URL resolution
const commandsPath = new URL('../src/renderer/commands.mjs', import.meta.url).href;
const focusPath = new URL('../src/renderer/focusManager.mjs', import.meta.url).href;

const { CommandRegistry } = await import(commandsPath);
const { FocusManager } = await import(focusPath);

let passed = 0;
let failed = 0;

function test(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.error(`  ✗ ${name}\n    ${e.message}`); }
}

function mockDiagnostics(content) {
    const lines = content.split('\n');
    const markers = [];
    const varDecl = /(?:let|const|var|function|class)\s+(\w+)/g;
    const declared = new Set();
    const skipWords = new Set([
        'let','const','var','function','return','if','else','elif',
        'for','while','class','import','export','from','this','super',
        'true','false','null','undefined','typeof','new','delete',
        'async','await','try','catch','throw','switch','case',
        'break','continue','in','of','instanceof','void','with',
        'yield','lambda','def','pass','raise','except','finally',
        'global','nonlocal','assert','del','print','len','range',
        'console','Object','Array','JSON','Promise','Number',
        'String','Math','Date','RegExp','Set','Map','Symbol',
        'document','window','setTimeout','setInterval',
        'fetch','require','module','exports','process',
        '__dirname','__filename',
    ]);
    lines.forEach((line) => {
        let m;
        while ((m = varDecl.exec(line)) !== null) declared.add(m[1]);
    });

    lines.forEach((line) => {
        const clean = line.replace(/['"`][^'\"`]*['"`]/g, '').replace(/\/\/.*$/g, '');
        const tokens = clean.split(/[\s,;(){}\[\]+\-*/%=<>!&|^~?:]+/);
        const seen = new Set();
        for (const token of tokens) {
            const base = token.split('.')[0];
            if (!base || base.length < 3) continue;
            if (skipWords.has(base)) continue;
            if (declared.has(base)) continue;
            if (base[0] !== base[0].toLowerCase()) continue;
            if (seen.has(base)) continue;
            seen.add(base);
            markers.push({ message: `'${base}' may be undefined` });
            return;
        }
    });
    return markers;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CommandRegistry
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\nCommandRegistry');
{
    const cmds = new CommandRegistry();

    test('has default commands', () => {
        assert.ok(cmds.all().length > 20);
    });

    test('register adds a command', () => {
        let called = false;
        cmds.register('test.hello', () => { called = true; }, { label: 'Hello', category: 'Test' });
        assert.ok(cmds.get('test.hello'));
    });

    test('execute calls the function', () => {
        let called = false;
        cmds.register('test.exec', (a) => { called = a; }, {});
        cmds.execute('test.exec', 42);
        assert.equal(called, 42);
    });

    test('execute unknown command warns', () => {
        cmds.execute('does.not.exist');
    });

    test('search finds by label', () => {
        const results = cmds.search('Open File');
        assert.ok(results.length > 0);
        assert.ok(results.some(r => r.id === 'file.open'));
    });

    test('search finds by id', () => {
        const results = cmds.search('file.open');
        assert.ok(results.length > 0);
    });

    test('search with empty string returns all', () => {
        const all = cmds.all();
        const results = cmds.search('');
        assert.equal(results.length, all.length);
    });

    test('all returns entries with id, label, category', () => {
        const entries = cmds.all();
        assert.ok(entries.length > 0);
        assert.ok(entries[0].id);
        assert.ok(entries[0].label !== undefined);
        assert.ok(entries[0].category !== undefined);
    });

    test('get returns undefined for missing', () => {
        assert.equal(cmds.get('nope'), undefined);
    });

    test('execute returns the function result', () => {
        cmds.register('test.ret', () => 99, {});
        assert.equal(cmds.execute('test.ret'), 99);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FocusManager
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\nFocusManager');
{
    const focus = new FocusManager();

    let zoneNavigated = null;
    let zoneConfirmed = false;
    let zoneBacked = false;
    let zoneFocused = false;

    const mockZone = {
        id: 'test',
        focus: () => { zoneFocused = true; },
        navigate: (dx, dy) => { zoneNavigated = [dx, dy]; },
        confirm: () => { zoneConfirmed = true; },
        back: () => { zoneBacked = true; },
        context: () => {},
    };

    test('registerZone adds a zone', () => {
        focus.registerZone(mockZone);
        assert.equal(focus.zones.length, 1);
    });

    test('registerZone deduplicates by id', () => {
        focus.registerZone(mockZone);
        assert.equal(focus.zones.length, 1);
    });

    test('currentZone returns active zone', () => {
        assert.equal(focus.currentZone, mockZone);
    });

    test('navigate delegates to zone', () => {
        focus.navigate(1, 0);
        assert.deepEqual(zoneNavigated, [1, 0]);
    });

    test('confirm delegates to zone', () => {
        zoneConfirmed = false;
        focus.confirm();
        assert.ok(zoneConfirmed);
    });

    test('back delegates to zone', () => {
        zoneBacked = false;
        focus.back();
        assert.ok(zoneBacked);
    });

    test('context delegates to zone', () => {
        let ctxCalled = false;
        focus.zones[0].context = () => { ctxCalled = true; };
        focus.context();
        assert.ok(ctxCalled);
    });

    test('focusZone changes active zone', () => {
        zoneFocused = false;
        const zone2 = {
            id: 'z2',
            focus: () => { zoneFocused = true; },
            navigate() {}, confirm() {}, back() {}, context() {}
        };
        focus.registerZone(zone2);
        focus.focusZone(1);
        assert.ok(zoneFocused);
        assert.equal(focus.activeZone, 1);
    });

    test('focusZone ignores out-of-range low', () => {
        focus.focusZone(-1);
        assert.equal(focus.activeZone, 1);
    });

    test('focusZone ignores out-of-range high', () => {
        focus.focusZone(99);
        assert.equal(focus.activeZone, 1);
    });

    test('focusNextZone cycles forward', () => {
        focus.focusZone(0);
        focus.focusNextZone();
        assert.equal(focus.activeZone, 1);
        focus.focusNextZone();
        assert.equal(focus.activeZone, 0);
    });

    test('focusPrevZone cycles backward', () => {
        focus.focusZone(0);
        focus.focusPrevZone();
        assert.equal(focus.activeZone, 1);
    });

    const el = { classList: { add() {}, remove() {} }, scrollIntoView() {} };
    let addedClass = null;
    let removedClass = null;
    el.classList.add = (c) => { addedClass = c; };
    el.classList.remove = (c) => { removedClass = c; };

    test('selectItem adds focused class', () => {
        const prev = { classList: { add() {}, remove(c) { removedClass = c; } }, scrollIntoView() {} };
        focus.selectItem(prev);
        addedClass = null;
        focus.selectItem(el);
        assert.equal(addedClass, 'focused');
    });

    test('selectItem scrolls into view', () => {
        let scrolled = false;
        const e = { classList: { add() {}, remove() {} }, scrollIntoView: () => { scrolled = true; } };
        focus.selectItem(e);
        assert.ok(scrolled);
    });

    test('clearFocus removes focused class and resets activeItem', () => {
        let removed = false;
        const e = { classList: { add() {}, remove() { removed = true; } }, scrollIntoView() {} };
        focus.selectItem(e);
        focus.clearFocus();
        assert.ok(removed);
        assert.equal(focus.activeItem, null);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Extension Host (diagnostics logic)
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\nExtensionHost (diagnostics)');

test('diagnostics: no issues for clean JS', () => {
    const m = mockDiagnostics('const x = 1;\nconsole.log(x);');
    assert.equal(m.length, 0);
});

test('diagnostics: warns on undeclared variable', () => {
    const m = mockDiagnostics('console.log(undeclaredVar);');
    assert.ok(m.some(d => d.message.includes('undeclaredVar')));
});

test('diagnostics: skips JS keywords', () => {
    const m = mockDiagnostics('if (true) { return 1; } else { throw new Error(); }');
    assert.equal(m.length, 0);
});

test('diagnostics: skips short names (<=2 chars)', () => {
    const m = mockDiagnostics('fn(x);');
    assert.equal(m.length, 0);
});

test('diagnostics: multi-line scoped vars are clean', () => {
    const m = mockDiagnostics('function foo() {\n  const bar = 1;\n  console.log(bar);\n}');
    assert.equal(m.length, 0);
});

test('diagnostics: flags truly undeclared identifier', () => {
    const m = mockDiagnostics('someGlobalVar = 42;\n');
    assert.ok(m.some(d => d.message.includes('someGlobalVar')));
});

// ═══════════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(50)}\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
