const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateUI: (callback) => ipcRenderer.on('update-ui', callback)
});