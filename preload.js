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
    },
    app: {
        getPath: (name) => ipcRenderer.invoke('app:getPath', name),
    },
    ext: {
        request: (msg) => ipcRenderer.invoke('ext:request', msg),
        onMessage: (cb) => ipcRenderer.on('ext:message', (_e, msg) => cb(msg)),
    },
});
