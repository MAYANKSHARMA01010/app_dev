// main/main.js
// Main process: creates the window, answers the interface's requests and
import path from 'path';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { isPlaying, togglePause, stop, readSongs, play } from './player.js';

let win = null;    // the application window
let timer = null;  // the interval that counts the elapsed seconds
let seconds = 0;   // elapsed time of the song that is playing
let paused = false;

function startTimer() {
  clearInterval(timer);
  seconds = 0;
  paused = false;
  win.webContents.send('player:progress', seconds);
  timer = setInterval(() => {
    if (paused) return;
    seconds += 1;
    win.webContents.send('player:progress', seconds);
  }, 1000);
}

function togglePlayback() {
  if (!isPlaying()) {
    return;
  };
  togglePause();
  paused = !paused;
}

function stopPlayback() {
  stop();
  clearInterval(timer);
}

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 640,
    title: 'Tunebox',
    webPreferences: {
      preload: path.join(import.meta.dirname, '..', 'preload', 'preload.js'),
    },
  });


  // Keyboard shortcut: Space pauses / resumes the song.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === ' ') {
      event.preventDefault();
      togglePlayback();
    }
  });

  win.loadURL('http://localhost:5173'); // the React interface (src/App.jsx)
  // Closing the window while a song is playing asks the user first.
  win.on('close', async (event) => {
    if (!isPlaying()) return;
    event.preventDefault();
    const { response } = await dialog.showMessageBox(win, {
      type: 'question',
      message: 'A song is playing. Quit Tunebox?',
      buttons: ['Keep listening', 'Stop and quit'],
    });
    if (response === 0) {
      stopPlayback();
      win.destroy();
    }
  });
}

function registerIpcHandlers() {
  ipcMain.handle('songs:choose-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose your music folder',
      properties: ['openDirectory'],
    });
    if (result.canceled) return null;
    return readSongs(result.filePaths);
  });

  ipcMain.handle('player:play', async (event, songPath) => {
    play(songPath);
    startTimer();
  });
  ipcMain.handle('player:toggle-pause', async () => togglePlayback());
  ipcMain.on('player:stop', () => stopPlayback());
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
