// Preload script — runs in renderer context with Node access.
// Currently minimal; extend here for IPC bridges in the future.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,
});
