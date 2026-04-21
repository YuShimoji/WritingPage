// Preload script — secure IPC bridge between main process and renderer.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    platform: process.platform,

    /* --- File operations --- */
    onFileOpened: (callback) => ipcRenderer.on('file:opened', (_e, data) => callback(data)),
    onRequestContentForSave: (callback) => ipcRenderer.on('file:request-content-for-save', (_e, filePath) => callback(filePath)),
    onFileSaved: (callback) => ipcRenderer.on('file:saved', (_e, data) => callback(data)),
    sendSaveContent: (filePath, content) => ipcRenderer.send('file:save-content', { filePath, content }),
    exportFile: (content, defaultName, filters) => ipcRenderer.invoke('file:export', { content, defaultName, filters }),

    /* --- Menu commands (main -> renderer) --- */
    onMenuCommand: (callback) => {
        const channels = [
            'menu:new-document', 'menu:find', 'menu:find-replace', 'menu:print',
            'menu:toggle-sidebar', 'menu:toggle-toolbar', 'menu:toggle-focus',
            'menu:toggle-typewriter', 'menu:toggle-minimal', 'menu:toggle-split-view',
            'menu:zoom-in', 'menu:zoom-out', 'menu:zoom-reset', 'menu:export',
        ];
        channels.forEach(ch => {
            ipcRenderer.on(ch, (_e, ...args) => callback(ch, ...args));
        });
    },

    /* --- Window control --- */
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    setTitle: (title) => ipcRenderer.send('window:set-title', title),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onMaximizedChanged: (callback) => ipcRenderer.on('window:maximized-changed', (_e, v) => callback(v)),
    onMoved: (callback) => ipcRenderer.on('window:moved', () => callback()),
    toggleFrameless: (frameless) => ipcRenderer.send('window:toggle-frameless', frameless),
    onFramelessChanged: (callback) => ipcRenderer.on('window:frameless-changed', (_e, v) => callback(v)),

    /* --- App info --- */
    getAppInfo: () => ipcRenderer.invoke('app:get-info'),
    getSystemTheme: () => ipcRenderer.invoke('app:get-theme'),
    onThemeChanged: (callback) => ipcRenderer.on('app:theme-changed', (_e, theme) => callback(theme)),

    /* --- Auto-updater --- */
    checkForUpdates: () => ipcRenderer.send('updater:check'),
    downloadUpdate: () => ipcRenderer.send('updater:download'),
    installUpdate: () => ipcRenderer.send('updater:install'),
    onUpdateAvailable: (callback) => ipcRenderer.on('updater:update-available', (_e, info) => callback(info)),
    onUpdateNotAvailable: (callback) => ipcRenderer.on('updater:update-not-available', () => callback()),
    onDownloadProgress: (callback) => ipcRenderer.on('updater:download-progress', (_e, progress) => callback(progress)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('updater:update-downloaded', (_e, info) => callback(info)),
    onUpdaterError: (callback) => ipcRenderer.on('updater:error', (_e, msg) => callback(msg)),
});
