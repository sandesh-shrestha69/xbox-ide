const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('xbox', {
    fs: {
        readFile: (fp) => ipcRenderer.invoke('fs:readFile', fp),
        writeFile: (fp, content) => ipcRenderer.invoke('fs:writeFile', fp, content),
        readDir: (dir, depth) => ipcRenderer.invoke('fs:readDir', dir, depth),
        exists: (fp) => ipcRenderer.invoke('fs:exists', fp),
    },
    dialog: {
        openFile: () => ipcRenderer.invoke('dialog:openFile'),
        saveFile: (content) => ipcRenderer.invoke('dialog:saveFile', content),
        saveAs: (content) => ipcRenderer.invoke('dialog:saveFile', content),
    },
    app: {
        getPath: (name) => ipcRenderer.invoke('app:getPath', name),
    },
    git: {
        status: (repoPath) => ipcRenderer.invoke('git:status', repoPath),
        branch: (repoPath) => ipcRenderer.invoke('git:branch', repoPath),
        stage: (repoPath, filePath) => ipcRenderer.invoke('git:stage', repoPath, filePath),
        unstage: (repoPath, filePath) => ipcRenderer.invoke('git:unstage', repoPath, filePath),
        commit: (repoPath, msg) => ipcRenderer.invoke('git:commit', repoPath, msg),
        diff: (repoPath, filePath) => ipcRenderer.invoke('git:diff', repoPath, filePath),
        branches: (repoPath) => ipcRenderer.invoke('git:branches', repoPath),
        log: (repoPath, count) => ipcRenderer.invoke('git:log', repoPath, count),
        checkout: (repoPath, branch) => ipcRenderer.invoke('git:checkout', repoPath, branch),
        createBranch: (repoPath, name) => ipcRenderer.invoke('git:createBranch', repoPath, name),
    },
    terminal: {
        connect: () => ipcRenderer.invoke('terminal:connect'),
        write: (data) => ipcRenderer.invoke('terminal:write', data),
        disconnect: () => ipcRenderer.invoke('terminal:disconnect'),
        resize: (cols, rows) => ipcRenderer.invoke('terminal:resize', cols, rows),
        onData: (cb) => ipcRenderer.on('terminal:data', (_e, data) => cb(data)),
        onError: (cb) => ipcRenderer.on('terminal:error', (_e, err) => cb(err)),
        onExit: (cb) => ipcRenderer.on('terminal:exit', (_e, code) => cb(code)),
    },
    ext: {
        request: (msg) => ipcRenderer.invoke('ext:request', msg),
        onMessage: (cb) => ipcRenderer.on('ext:message', (_e, msg) => cb(msg)),
        load: (manifestPath) => ipcRenderer.invoke('ext:load', manifestPath),
        loadDir: (dirPath) => ipcRenderer.invoke('ext:loadDir', dirPath),
    },
});
