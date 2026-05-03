const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  onWindowMaximized: (cb) => ipcRenderer.on('window-maximized', (_, val) => cb(val)),

  // Data persistence
  readData: () => ipcRenderer.invoke('data-read'),
  writeData: (data) => ipcRenderer.invoke('data-write', data),

  // File / URL
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  fetchUrl: (url) => ipcRenderer.invoke('fetch-url', url),
});
