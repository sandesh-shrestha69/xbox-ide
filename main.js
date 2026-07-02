const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork, execSync, spawn } = require('child_process');
const os = require('os');

let mainWindow = null;
let extensionHost = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 960,
        minWidth: 960,
        minHeight: 600,
        title: 'Xbox IDE',
        backgroundColor: '#1e1e1e',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

    mainWindow.webContents.on('before-input-event', (_e, input) => {
        if (input.type === 'keyDown' && !input.control && !input.meta && !input.alt) {
            if (!['Enter', 'Escape', 'Backspace', 'Tab'].includes(input.key)) {
                mainWindow.webContents.executeJavaScript(
                    `window.__swallowKey(${JSON.stringify(input.key)})`
                ).then(r => { if (r) _e.preventDefault(); });
            }
        }
    });

    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools({ mode: 'bottom' });
    }
}

function startExtensionHost() {
    const hostPath = path.join(__dirname, 'src', 'extensionHost', 'host.js');
    if (!fs.existsSync(hostPath)) return;
    extensionHost = fork(hostPath, [], { silent: true });
    extensionHost.on('message', (msg) => {
        if (mainWindow) mainWindow.webContents.send('ext:message', msg);
    });
}

app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();
    startExtensionHost();
});

app.on('window-all-closed', () => {
    if (extensionHost) extensionHost.kill();
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

function registerIpcHandlers() {
    ipcMain.handle('fs:readFile', async (_e, fp) => {
        try { return { data: fs.readFileSync(fp, 'utf-8') }; }
        catch (e) { return { error: e.message }; }
    });
    ipcMain.handle('fs:writeFile', async (_e, fp, content) => {
        try {
            const dir = path.dirname(fp);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(fp, content, 'utf-8');
            return { ok: true };
        } catch (e) { return { error: e.message }; }
    });
    ipcMain.handle('fs:readDir', async (_e, dirPath, depth) => {
        try { return { entries: walkDir(dirPath, 0, depth || 3) }; }
        catch (e) { return { error: e.message }; }
    });
    ipcMain.handle('fs:exists', async (_e, fp) => fs.existsSync(fp));
    ipcMain.handle('dialog:openFile', async () => {
        const r = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [{ name: 'Code', extensions: ['*'] }]
        });
        if (r.canceled) return null;
        const fp = r.filePaths[0];
        try { return { filePath: fp, content: fs.readFileSync(fp, 'utf-8') }; }
        catch (e) { return { error: e.message }; }
    });
    ipcMain.handle('dialog:saveFile', async (_e, content) => {
        const r = await dialog.showSaveDialog(mainWindow, {
            filters: [{ name: 'Code', extensions: ['*'] }]
        });
        if (r.canceled) return null;
        try {
            fs.writeFileSync(r.filePath, content, 'utf-8');
            return { filePath: r.filePath };
        } catch (e) { return { error: e.message }; }
    });
    ipcMain.handle('app:getPath', (_e, name) => app.getPath(name));
    ipcMain.handle('ext:request', (_e, msg) => {
        if (extensionHost) extensionHost.send(msg);
    });
}

// ─── Git IPC ─────────────────────────────────────────────────────────────────
let _gitCwd = null;
ipcMain.handle('git:status', async (_e, repoPath) => {
    try {
        const out = execSync('git status --porcelain', { cwd: repoPath, encoding: 'utf-8', timeout: 5000 });
        const lines = out.trim().split('\n').filter(Boolean);
        _gitCwd = repoPath;
        return lines.map(line => {
            const staged = line[0] !== ' ';
            const untracked = line.startsWith('??');
            const pathStr = line.slice(3).trim();
            return { path: path.join(repoPath, pathStr), staged, untracked, raw: line };
        });
    } catch { return []; }
});
ipcMain.handle('git:branch', async (_e, repoPath) => {
    try {
        const out = execSync('git branch --show-current', { cwd: repoPath, encoding: 'utf-8', timeout: 5000 });
        return out.trim();
    } catch { return 'unknown'; }
});
ipcMain.handle('git:stage', async (_e, repoPath, filePath) => {
    try {
        execSync(`git add "${filePath}"`, { cwd: repoPath, encoding: 'utf-8', timeout: 5000 });
        return { ok: true };
    } catch (e) { return { error: e.message }; }
});
ipcMain.handle('git:unstage', async (_e, repoPath, filePath) => {
    try {
        execSync(`git restore --staged "${filePath}"`, { cwd: repoPath, encoding: 'utf-8', timeout: 5000 });
        return { ok: true };
    } catch (e) { return { error: e.message }; }
});
ipcMain.handle('git:commit', async (_e, repoPath, message) => {
    try {
        execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: repoPath, encoding: 'utf-8', timeout: 5000 });
        return 'Committed: ' + message;
    } catch (e) { return { error: e.message }; }
});
ipcMain.handle('git:diff', async (_e, repoPath, filePath) => {
    try {
        const rel = path.relative(repoPath, filePath);
        const out = execSync(`git diff "${rel}"`, { cwd: repoPath, encoding: 'utf-8', timeout: 5000 });
        return out || 'No diff available';
    } catch { return 'No diff available'; }
});

// ─── Terminal PTY ─────────────────────────────────────────────────────────────
let _ptyProcess = null;
ipcMain.handle('terminal:connect', async () => {
    try {
        const pty = require('node-pty');
        const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : 'bash');
        _ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cwd: process.cwd(),
            env: process.env,
        });
        _ptyProcess.onData((data) => {
            if (mainWindow) mainWindow.webContents.send('terminal:data', data);
        });
        _ptyProcess.onExit(({ exitCode }) => {
            if (mainWindow) mainWindow.webContents.send('terminal:exit', exitCode);
            _ptyProcess = null;
        });
        return { ok: true };
    } catch (e) {
        return { error: e.message };
    }
});
ipcMain.handle('terminal:write', async (_e, data) => {
    if (_ptyProcess) {
        _ptyProcess.write(data);
        return { ok: true };
    }
    return { error: 'No terminal' };
});
ipcMain.handle('terminal:disconnect', async () => {
    if (_ptyProcess) { _ptyProcess.kill(); _ptyProcess = null; }
    return { ok: true };
});
ipcMain.handle('terminal:resize', async (_e, cols, rows) => {
    if (_ptyProcess) { _ptyProcess.resize(cols, rows); }
    return { ok: true };
});

// ─── Extension Loading ────────────────────────────────────────────────────────
ipcMain.handle('ext:load', async (_e, manifestPath) => {
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        return {
            id: manifest.name || path.basename(path.dirname(manifestPath)),
            displayName: manifest.displayName || manifest.name,
            version: manifest.version,
            contributes: manifest.contributes || {},
        };
    } catch (e) { return { error: e.message }; }
});
ipcMain.handle('ext:loadDir', async (_e, dirPath) => {
    try {
        const results = [];
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const mp = path.join(dirPath, entry.name, 'package.json');
                if (fs.existsSync(mp)) {
                    try {
                        const manifest = JSON.parse(fs.readFileSync(mp, 'utf-8'));
                        results.push({
                            id: manifest.name || entry.name,
                            displayName: manifest.displayName || manifest.name,
                            version: manifest.version,
                            contributes: manifest.contributes || {},
                        });
                    } catch {}
                }
            }
        }
        return { extensions: results };
    } catch (e) { return { error: e.message }; }
});

function walkDir(dirPath, currentDepth, maxDepth) {
    if (currentDepth > maxDepth) return null;
    const name = path.basename(dirPath);
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) return { name, path: dirPath, type: 'file' };
    const entries = fs.readdirSync(dirPath);
    const children = [];
    for (const entry of entries) {
        if (entry.startsWith('.') || entry === 'node_modules') continue;
        try {
            const full = path.join(dirPath, entry);
            const child = walkDir(full, currentDepth + 1, maxDepth);
            if (child) children.push(child);
        } catch {}
    }
    children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
    return { name, path: dirPath, type: 'directory', children };
}
