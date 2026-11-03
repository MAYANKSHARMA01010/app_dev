# Tunebox

A desktop music player built with **Electron** and **React**: the
desktop version of the command-line music player. It lists the songs in a
folder and plays them with **VLC**.

- **Choose a music folder**: the list shows the `.mp3` files in it.
- **Click a song** to play it.
- The bottom of the window shows the **song that is playing** and the
  **time since it started** (`mm:ss`), updated every second.
- A **Pause / Resume** button. The **Space** key does the same, wherever
  the focus is in the window.
- A **Stop** button.
- Closing the window **while a song is playing** asks the user first.

The questions are in `questions.md`.

## The code

```
main/
  main.js        main process: the window, the keyboard shortcut, the requests from the interface, the timer
  player.js      reads the songs in a folder and controls VLC
preload/
  preload.js     defines window.tunebox — the bridge between the interface and the main process
src/
  App.jsx        the interface (React)
```

| File | Runs in | Contains |
|------|---------|----------|
| `main/main.js` | Main process | `startTimer()`, `togglePlayback()`, `stopPlayback()` — the elapsed-time timer and playback state; `createWindow()` — the `BrowserWindow`, the Space shortcut (`before-input-event`) and the question asked on closing (`close`); `registerIpcHandlers()` — one handler per channel; start-up (`app.whenReady`) and shutdown (`window-all-closed`) |
| `main/player.js` | Main process | `readSongs(folder)`, `play(songPath)`, `togglePause()`, `stop()`, `isPlaying()` |
| `preload/preload.js` | Renderer, before the page | `contextBridge.exposeInMainWorld('tunebox', { … })` — the functions the interface may call |
| `src/App.jsx` | Renderer (the page) | `formatTime()` and the `App` component: its state, what happens on each click, and what it shows |

`main/main.js` and `main/player.js` are ES modules: `main.js` imports the
five functions it needs from `player.js` by name
(`import { isPlaying, togglePause, stop, readSongs, play } from './player.js'`).
`preload/preload.js` loads Electron with `require`.

## How the application works

### Start-up

1. Electron starts the **main process** with `main/main.js`.
2. When Electron is ready (`app.whenReady()`), the main process registers
   the IPC handlers, then creates the window (`createWindow()`). The
   window has a size, a title, and the path of its preload script.
3. The window runs `preload/preload.js` first, which defines
   `window.tunebox`, then loads the interface (`src/App.jsx`).
4. When `App` appears, it starts listening for the elapsed time
   (`window.tunebox.onProgress(setElapsed)`). The song list is empty until
   a folder is chosen.

### How messages travel

The interface never starts VLC, never opens a dialog and never reads a
folder itself. Messages travel on named IPC channels, in two directions.

```
Interface → main process

src/App.jsx           window.tunebox.someFunction(value)
                              │
preload/preload.js    ipcRenderer.invoke(…) or ipcRenderer.send(…)
                              │   IPC
main/main.js          ipcMain.handle(…) or ipcMain.on(…)
                              │
main/player.js / Electron     VLC / folder / dialog


Main process → interface

main/main.js          win.webContents.send('player:progress', seconds)
                              │   IPC
preload/preload.js    ipcRenderer.on('player:progress', …)
                              │
src/App.jsx           the function given to window.tunebox.onProgress(…)
```

### Playing with VLC

`main/player.js` plays a song by starting VLC as a child process:

```js
vlc = spawn('vlc', ['--intf', 'rc', songPath]);
```

`--intf rc` starts VLC's **remote-control interface**, which reads
commands from its standard input. `togglePause()` writes `pause\n` to
`vlc.stdin`, which pauses a playing song and resumes a paused one.
`stop()` calls `vlc.kill()`, which closes VLC and stops the song.
`play()` first stops any song that is already playing, so only one VLC
runs at a time. `isPlaying()` is `true` while a VLC process is open.

### The features, step by step

**Choosing a folder.** Clicking *Choose music folder…* calls
`chooseFolder()` → channel `songs:choose-folder` → the handler opens a
folder dialog (`dialog.showOpenDialog` with `openDirectory`). If the
dialog is cancelled the handler returns `null` and the list does not
change. Otherwise it returns `readSongs(…)` for the chosen folder: a list
of `{ name, path }`, one per `.mp3` file, which `App` stores with
`setSongs` and shows as a list.

**Playing a song.** Clicking a song calls `playSong(song)` →
`play(song.path)` → channel `player:play` → the handler calls `play(songPath)`
from `player.js` and `startTimer()`. When the handler has finished, `App`
stores the song as `current`.

**Elapsed time.** `startTimer()` sets `seconds` to 0, sends it at once,
then every second adds 1 and sends the new value on `player:progress`
with `win.webContents.send` — except while the song is paused. In the
interface, `onProgress` listens on that channel and gives each value to
`setElapsed`. The bottom of the window shows
`<song name> — <formatTime(elapsed)>`, for example
`Morning Run.mp3 — 01:05`.

**Pause / Resume.** The button calls `window.tunebox.togglePause()` →
channel `player:toggle-pause` → `togglePlayback()` in `main/main.js`,
which (only if a song is playing) calls `togglePause()` from `player.js`
and flips `paused`, so the timer stops or continues counting.

**The Space key.** The main process listens to `before-input-event` on
the window's `webContents`. It runs for every key event in the window,
before the page receives it. When Space is pressed (`keyDown`), it calls
the same `togglePlayback()` as the button.

**Stop.** Clicking *Stop* calls `stopSong()` →
`window.tunebox.stop()` → channel `player:stop` → `stopPlayback()`,
which closes VLC (`stop()` from `player.js`) and stops the timer. `App`
sets `current` to `null`, so the bottom of the window shows
*Nothing playing*.

**Closing the window.** The main process listens to the window's `close`
event. When no song is playing, the window closes normally. When a song
is playing, `event.preventDefault()` keeps the window open and
`dialog.showMessageBox` asks *A song is playing. Quit Tunebox?* with two
buttons:

- **Keep listening**: nothing changes, and the song keeps playing.
- **Stop and quit**: `stopPlayback()` stops the song and `win.destroy()`
  closes the window. The last window is closed, so `window-all-closed`
  quits the app.

### IPC channels

| Channel | Direction | In the main process | Used for |
|---------|-----------|---------------------|----------|
| `songs:choose-folder` | interface → main | `ipcMain.handle` | choosing a folder; returns its songs |
| `player:play` | interface → main | `ipcMain.handle` | playing a song |
| `player:toggle-pause` | interface → main | `ipcMain.handle` | Pause / Resume |
| `player:stop` | interface → main | `ipcMain.on` | Stop |
| `player:progress` | main → interface | `win.webContents.send` | the elapsed seconds, every second |
