// preload/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tunebox', {
  chooseFolder: () => ipcRenderer.invoke('songs:choose-folder'),
  play: (songPath) => ipcRenderer.invoke('player:play', songPath),
  togglePause: () => ipcRenderer.invoke('player:toggle-pause'),

  // Listens for the elapsed time sent by the main process.
  // Returns a function that stops listening.
  onProgress: (callback) => {
    ipcRenderer.on('player:progress', callback);
    return () => ipcRenderer.removeListener('player:progress', callback);
  },
});
