import { CommandRegistry } from './commands.js';
import { FocusManager } from './focusManager.js';
import { GamepadManager } from './gamepad.js';
import { EditorController } from './editor.js';
import { KeyboardOverlay } from './keyboardOverlay.js';
import { FileExplorer } from './fileExplorer.js';
import { TabManager } from './tabManager.js';
import { CommandPalette } from './commandPalette.js';
import { SettingsManager } from './settings.js';
import { FindReplace } from './findReplace.js';
import { SnippetManager } from './snippets.js';
import { SplitPaneManager } from './splitPanes.js';
import { GitManager } from './git.js';
import { TerminalManager } from './terminal.js';
import { ExtensionManager } from './extensions.js';
import { UserManual } from './userManual.js';

const cmds = new CommandRegistry();
const focus = new FocusManager();
const editor = new EditorController('editor-container');
const keyboard = new KeyboardOverlay(editor);
const tabs = new TabManager(editor, focus);
const explorer = new FileExplorer(focus, editor, tabs);
const palette = new CommandPalette(cmds, focus);
const settings = new SettingsManager(editor);
const findReplace = new FindReplace(editor, focus);
const snippets = new SnippetManager(editor);
const splitPanes = new SplitPaneManager(editor, focus);
const git = new GitManager(focus, editor, tabs);
const terminal = new TerminalManager(focus);
const extMgr = new ExtensionManager(cmds);
const manual = new UserManual();

async function init() {
    await editor.init();
    settings._apply('theme', settings.get('theme'));
    settings._apply('fontSize', settings.get('fontSize'));
    settings._apply('tabSize', settings.get('tabSize'));
    settings._apply('wordWrap', settings.get('wordWrap'));
    settings._apply('lineNumbers', settings.get('lineNumbers'));
    settings._apply('minimap', settings.get('minimap'));

    // Load home directory
    try {
        const home = await window.xbox?.app?.getPath?.('home');
        if (home) await explorer.load(home);
    } catch {}

    await terminal.init();
    await extMgr.init();

    // Register find overlay zone
    focus.registerZone({
        id: 'find',
        focus: () => findReplace.findInput?.focus(),
        navigate: (dx, dy) => findReplace.navigate(dy),
        confirm: () => findReplace.confirm(),
        back: () => findReplace.close(),
        context: () => {},
    });

    // Register Editor focus zone
    focus.registerZone({
        id: 'editor',
        focus: () => editor.focus(),
        navigate: (dx, dy) => editor.moveCursor(dx, dy),
        confirm: () => {},
        back: () => {},
        context: () => {},
    });

    // Wire commands
    cmds.register('file.open', async () => {
        const res = await window.xbox?.dialog?.openFile();
        if (res?.filePath && res.content !== undefined) {
            tabs.openTab(res.filePath, res.content);
        }
    }, { label: 'Open File', category: 'File' });

    cmds.register('file.save', async () => {
        const path = tabs.currentPath();
        const content = editor.getValue();
        if (path) {
            await window.xbox.fs.writeFile(path, content);
            tabs.markClean();
            notify('File saved');
        } else {
            const res = await window.xbox.dialog.saveFile(content);
            if (res?.filePath) {
                tabs.openTab(res.filePath, content);
                tabs.markClean();
                notify('File saved');
            }
        }
    }, { label: 'Save', category: 'File' });

    cmds.register('tab.next', () => tabs.nextTab(), { label: 'Next Tab', category: 'Tab' });
    cmds.register('tab.prev', () => tabs.prevTab(), { label: 'Previous Tab', category: 'Tab' });
    cmds.register('tab.close', () => tabs.closeTab(tabs.activeIndex), { label: 'Close Tab', category: 'Tab' });
    cmds.register('editor.undo', () => editor.undo(), { label: 'Undo', category: 'Editor' });
    cmds.register('editor.redo', () => editor.redo(), { label: 'Redo', category: 'Editor' });
    cmds.register('editor.format', () => editor.format(), { label: 'Format', category: 'Editor' });
    cmds.register('editor.comment', () => editor.commentLine(), { label: 'Toggle Comment', category: 'Editor' });
    cmds.register('editor.indent', () => editor.indent(), { label: 'Indent', category: 'Editor' });
    cmds.register('editor.outdent', () => editor.outdent(), { label: 'Outdent', category: 'Editor' });
    cmds.register('editor.focus', () => { focus.focusZone(1); editor.focus(); }, { label: 'Focus Editor', category: 'Editor' });

    cmds.register('explorer.focus', () => { focus.focusZone(0); }, { label: 'Focus Explorer', category: 'View' });
    cmds.register('explorer.toggle', () => {
        const el = document.getElementById('sidebar');
        el.style.display = el.style.display === 'none' ? '' : 'none';
    }, { label: 'Toggle Explorer', category: 'View' });

    cmds.register('panel.toggle', () => {
        document.getElementById('panel-area').classList.toggle('open');
    }, { label: 'Toggle Panel', category: 'View' });

    cmds.register('commandPalette.open', () => palette.open(), { label: 'Command Palette', category: 'View' });
    cmds.register('keyboard.toggle', () => keyboard.toggle(), { label: 'Toggle Keyboard', category: 'View' });
    cmds.register('settings.open', () => settings.open(), { label: 'Open Settings', category: 'Preferences' });
    cmds.register('settings.theme', () => {
        const t = settings.get('theme');
        const next = t === 'vs-dark' ? 'vs' : t === 'vs' ? 'hc-black' : 'vs-dark';
        settings.set('theme', next);
    }, { label: 'Toggle Theme', category: 'Preferences' });

    cmds.register('focus.next', () => focus.focusNextZone(), { label: 'Next Focus Zone', category: 'Navigation' });
    cmds.register('focus.prev', () => focus.focusPrevZone(), { label: 'Previous Focus Zone', category: 'Navigation' });

    cmds.register('contextMenu', () => {
        editor.focus();
        editor.editor?.trigger('gamepad', 'editor.action.showContextMenu');
    }, { label: 'Context Menu', category: 'Editor' });

    // Find / Replace
    cmds.register('find.open', () => findReplace.open('find'), { label: 'Find', category: 'Find' });
    cmds.register('find.replace', () => findReplace.open('replace'), { label: 'Find and Replace', category: 'Find' });
    cmds.register('find.next', () => findReplace._findNext(), { label: 'Find Next', category: 'Find' });
    cmds.register('find.prev', () => findReplace._findPrev(), { label: 'Find Previous', category: 'Find' });

    // File
    cmds.register('file.new', async () => {
        tabs.openTab('untitled-' + Date.now(), '');
        notify('New file created');
    }, { label: 'New File', category: 'File' });
    cmds.register('file.saveAs', async () => {
        const content = editor.getValue();
        const res = await window.xbox.dialog.saveFile(content);
        if (res?.filePath) {
            tabs.openTab(res.filePath, content);
            tabs.markClean();
            notify('File saved');
        }
    }, { label: 'Save As', category: 'File' });

    // Snippets / Emmet
    cmds.register('snippet.insert', () => {
        editor.editor?.trigger('gamepad', 'editor.action.triggerSuggest');
    }, { label: 'Insert Snippet', category: 'Editor' });
    cmds.register('emmet.expand', () => {
        const model = editor.editor?.getModel();
        const pos = editor.editor?.getPosition();
        if (model && pos) {
            const word = model.getWordUntilPosition(pos);
            const abbr = word.word;
            if (abbr) {
                const range = { startLineNumber: pos.lineNumber, endLineNumber: pos.lineNumber,
                    startColumn: word.startColumn, endColumn: word.endColumn };
                editor.editor?.executeEdits('emmet', [{ range, text: '', forceMoveMarkers: true }]);
                snippets.expandEmmet(abbr);
            }
        }
    }, { label: 'Expand Emmet', category: 'Editor' });

    // Split Panes
    cmds.register('split.horizontal', () => splitPanes.split('horizontal'), { label: 'Split Horizontal', category: 'View' });
    cmds.register('split.vertical', () => splitPanes.split('vertical'), { label: 'Split Vertical', category: 'View' });
    cmds.register('split.unsplit', () => splitPanes.unsplit(), { label: 'Unsplit', category: 'View' });
    cmds.register('split.nextPane', () => splitPanes.nextPane(), { label: 'Next Pane', category: 'View' });
    cmds.register('split.prevPane', () => splitPanes.prevPane(), { label: 'Previous Pane', category: 'View' });

    // Git
    cmds.register('git.toggle', () => git.toggle(), { label: 'Toggle Git', category: 'View' });
    cmds.register('git.refresh', () => git.refresh(), { label: 'Refresh Git', category: 'View' });
    cmds.register('git.commit', async () => {
        const msg = prompt('Commit message:');
        if (msg) await git.commit(msg);
    }, { label: 'Git Commit', category: 'View' });

    // Terminal
    cmds.register('terminal.focus', () => {
        document.getElementById('panel-area').classList.add('open');
        terminal.focus();
    }, { label: 'Focus Terminal', category: 'View' });

    // User Manual
    cmds.register('manual.toggle', () => manual.toggle(), { label: 'Toggle Controls', category: 'View' });

    // Auto-show controls on startup
    manual.show();

    // Extensions
    cmds.register('extensions.show', () => {
        const panel = document.getElementById('extensions-panel');
        if (panel) {
            document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.add('hidden'));
            panel.classList.remove('hidden');
            document.querySelectorAll('.st-panel-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('[data-sidebar="extensions"]')?.classList.add('active');
            const list = document.getElementById('ext-list');
            const exts = extMgr.getAllExtensions();
            list.innerHTML = exts.map(e =>
                `<div class="ext-item">${e.displayName || e.id} <span class="ext-ver">${e.version || ''}</span></div>`
            ).join('') || '<div class="ext-item">No extensions loaded</div>';
        }
    }, { label: 'Show Extensions', category: 'View' });

    // Sidebar tab switching
    document.querySelectorAll('.st-panel-tab').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.st-panel-tab').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById(el.dataset.sidebar + '-panel')?.classList.remove('hidden');
        });
    });

    document.getElementById('git-refresh-btn')?.addEventListener('click', () => git.refresh());
    document.getElementById('git-commit-btn')?.addEventListener('click', async () => {
        const msg = prompt('Commit message:');
        if (msg) await git.commit(msg);
    });
    document.getElementById('ext-load-btn')?.addEventListener('click', async () => {
        const dir = await window.xbox.dialog?.openFile?.();
        if (dir?.filePath) {
            const dirPath = dir.filePath.replace(/\/[^/]+$/, '');
            await extMgr.loadFromDirectory(dirPath);
        }
    });

    // Panel tab switching (terminal uses PTY now)
    document.querySelectorAll('.panel-tab').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            const panel = el.dataset.panel;
            if (panel === 'terminal') {
                document.getElementById('panel-content').innerHTML = '';
                terminal.init();
            } else if (panel === 'problems') {
                document.getElementById('panel-content').innerHTML = 'No problems detected in workspace.';
            }
        });
    });
    document.querySelectorAll('.panel-tab').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            const panel = el.dataset.panel;
            document.getElementById('panel-content').textContent =
                panel === 'terminal' ? '> Xbox IDE Terminal Ready\n> Press LB/RB to switch tabs\n' :
                panel === 'problems' ? 'No problems detected in workspace.' : '';
        });
    });

    // Route overlay-first for D-Pad, confirm, back
    const origNavigate = focus.navigate.bind(focus);
    focus.navigate = (dx, dy) => {
        if (keyboard.isOpen) { keyboard.navigate(dx, dy); return; }
        if (palette._isOpen) { palette.navigate(dy); return; }
        if (findReplace.isOpen) { findReplace.navigate(dy); return; }
        origNavigate(dx, dy);
    };
    const origConfirm = focus.confirm.bind(focus);
    focus.confirm = () => {
        if (keyboard.isOpen) { keyboard.confirm(); return; }
        if (palette._isOpen) { palette.confirm(); return; }
        if (findReplace.isOpen) { findReplace.confirm(); return; }
        origConfirm();
    };
    const origBack = focus.back.bind(focus);
    focus.back = () => {
        if (keyboard.isOpen) { keyboard.back(); return; }
        if (palette._isOpen) { palette.close(); return; }
        if (settings._isOpen) { settings.close(); return; }
        if (findReplace.isOpen) { findReplace.close(); return; }
        origBack();
    };

    function notify(msg, type = '') {
        const el = document.getElementById('notification-container');
        const div = document.createElement('div');
        div.className = 'notif ' + type;
        div.textContent = msg;
        el.appendChild(div);
        setTimeout(() => div.remove(), 2500);
    }
    window.notify = notify;

    document.getElementById('status-ctrl').textContent = '🎮';
    document.getElementById('status-lang').textContent = 'JavaScript';

    const gp = new GamepadManager(cmds, focus, editor, keyboard);
    gp.start();
    window.__gamepad = gp;
}

document.addEventListener('DOMContentLoaded', init);

window.__swallowKey = function(key) {
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
    if (isInput) return false;
    return true;
};

document.addEventListener('mousedown', (e) => {
    if (e.target.closest('#status-bar')) return;
    e.preventDefault();
    e.stopPropagation();
}, true);
document.addEventListener('mouseup', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
document.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
document.addEventListener('dblclick', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
document.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); }, true);
