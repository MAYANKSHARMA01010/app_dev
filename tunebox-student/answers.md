# Tunebox — Answers (instructor only)

**Do not give this file to students.**

The code in this folder is the **correct** version. The student folder is
identical except for these five places:

| Question | File | Correct (this folder) | Student version |
|----------|------|-----------------------|-----------------|
| 1 | `main/main.js` | `return readSongs(result.filePaths[0]);` | `return readSongs(result.filePaths);` |
| 2 | `main/main.js` | `event.preventDefault();` before `togglePlayback();` in `before-input-event` | line missing |
| 3 | `preload/preload.js` | `onProgress` registers `(event, seconds) => callback(seconds)` and removes that same listener | `onProgress` registers `callback` itself |
| 4 | `main/main.js` | `if (response === 1) {` | `if (response === 0) {` |
| 5 | `preload/preload.js` | `stop: () => ipcRenderer.send('player:stop'),` | line missing |

---

## Question 1 — Choosing a music folder

**1. Explanation.** `dialog.showOpenDialog` resolves with
`{ canceled, filePaths }`. `filePaths` is an **array** of paths (here
an array with one element, the chosen folder), not a single path. The
handler passes the whole array to `readSongs()`, which calls
`fs.readdirSync(folder)`. `readdirSync` needs a path string, so it
throws. The handler fails, the promise of `chooseFolder()` is rejected,
and `setSongs` is never called, so the list stays empty.

**2. Corrected code** — `main/main.js`, inside:

```js
ipcMain.handle('songs:choose-folder', async () => {
  const result = await dialog.showOpenDialog(win, {
    title: 'Choose your music folder',
    properties: ['openDirectory'],
  });
  if (result.canceled) return null;
  return readSongs(result.filePaths[0]);
});
```


---


---

## Question 2 — Elapsed time

**1. Explanation.** `ipcRenderer.on` calls its listener with the **event
object first**, then the values that were sent:
`listener(event, seconds)`. The student version gives `App`'s
`callback` (`setElapsed`) directly to `ipcRenderer.on`, so Electron calls
`setElapsed(event, seconds)`. A React state setter only uses its first
argument, so `elapsed` becomes the **event object**, and the seconds are
ignored. `formatTime` then divides an object by 60 and takes it modulo
60. Both give `NaN`, so the screen shows `NaN:NaN`.

**2. Corrected code** — `preload/preload.js`, inside the exposed object:

```js
onProgress: (callback) => {
  const listener = (event, seconds) => callback(seconds);
  ipcRenderer.on('player:progress', listener);
  return () => ipcRenderer.removeListener('player:progress', listener);
},
```


---

## Question 3 — Closing while a song plays

**1. Explanation.** `response` is the **index** of the clicked button in
the `buttons` array, starting at 0:
`['Keep listening', 'Stop and quit']`, so *Keep listening* = **0** and
*Stop and quit* = **1**. The code stops and closes when
`response === 0`, so it does so on *Keep listening*. For
*Stop and quit* (1) it does nothing: the window stays open, because
`preventDefault()` already ran, and the song keeps playing.

**2. Corrected code** — `main/main.js`, in the `close` listener:

```js
if (response === 1) {
  stopPlayback();
  win.destroy();
}
```

## Question 4 — New connection: Stop

**1. Names.**
- The function the interface calls: **`stop`**
  (`window.tunebox.stop()` in `stopSong()` in `src/App.jsx`).
- The channel: **`player:stop`** (`ipcMain.on('player:stop', …)` in
  `registerIpcHandlers()` in `main/main.js`, which calls
  `stopPlayback()`).

**2. Code** — `preload/preload.js`, inside the object passed to
`contextBridge.exposeInMainWorld('tunebox', { … })`:

```js
stop: () => ipcRenderer.send('player:stop'),
```

The complete file afterwards:

```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tunebox', {
  chooseFolder: () => ipcRenderer.invoke('songs:choose-folder'),
  play: (songPath) => ipcRenderer.invoke('player:play', songPath),
  togglePause: () => ipcRenderer.invoke('player:toggle-pause'),
  stop: () => ipcRenderer.send('player:stop'),

  // Listens for the elapsed time sent by the main process.
  // Returns a function that stops listening.
  onProgress: (callback) => {
    const listener = (event, seconds) => callback(seconds);
    ipcRenderer.on('player:progress', listener);
    return () => ipcRenderer.removeListener('player:progress', listener);
  },
});
```

**3. `send`, and why.** The main process receives this channel with
**`ipcMain.on`**, which only receives messages sent with
`ipcRenderer.send`. `invoke` is only answered by `ipcMain.handle`, and
there is no `handle` for `player:stop`. With `invoke` the promise is
rejected ("No handler registered for 'player:stop'") and the song does
not stop. Also, `stopSong()` does not wait for an answer: Stop is a
one-way command, which is what `send` is for.

*Background for the marker:* with `invoke`, the interface still sets
`current` to `null` and shows *Nothing playing*, but VLC keeps playing.
