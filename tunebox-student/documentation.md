# Tunebox — Documentation

This guide explains the Electron ideas Tunebox is built on, and where
each one is used in its code.

## 1. The three parts of Tunebox

| Part | Files | What it does in Tunebox |
|------|-------|-------------------------|
| **Main process** | `main/main.js`, `main/player.js` | Node.js. Creates the window, opens the dialogs, reads the music folder, starts and controls VLC, counts the elapsed time. |
| **Preload** | `preload/preload.js` | Runs before the page. Uses `contextBridge.exposeInMainWorld('tunebox', { … })` to give the page a fixed set of functions: `window.tunebox.<function>`. |
| **Renderer** | `src/App.jsx` | The web page (React). It shows the songs and the buttons, and reaches the main process only through `window.tunebox`. |

The page can only call the functions the preload exposes, under exactly
the names it exposes them. Calling a function that is not on
`window.tunebox` is an error in the page.

## 2. Messages from the interface: `invoke` / `handle` and `send` / `on`

Each `window.tunebox` function sends a message on a named **channel**
(`songs:choose-folder`, `player:play`…). There are two ways to send a
message, and each way has its own receiver in `main/main.js`:

| | `ipcRenderer.invoke` → `ipcMain.handle` | `ipcRenderer.send` → `ipcMain.on` |
|---|---|---|
| Received in the main process by | `ipcMain.handle(channel, …)` only | `ipcMain.on(channel, …)` only |
| Answer to the page | A promise of the handler's return value | None |
| No receiver of that kind on the channel | The promise is rejected; nothing is done | The message is lost; nothing is done |

In Tunebox, `songs:choose-folder` returns the list of songs to the page,
which `App` waits for with `await window.tunebox.chooseFolder()`.

In both cases, the main-process function receives the **event** object
first, then the values sent after the channel name. For example, in
`ipcMain.handle('player:play', async (event, songPath) => …)`, `songPath`
is the value given to `invoke` after `'player:play'`.

## 3. The elapsed time: messages from the main process

The elapsed time travels the other way: the main process sends it
without being asked. Every second, `startTimer()` in `main/main.js` calls

```js
win.webContents.send('player:progress', seconds);
```

The preload receives these messages by registering a **listener** with
`ipcRenderer.on('player:progress', listener)`. Electron calls the
listener once per message, with:

| Parameter | What it is |
|-----------|------------|
| **1st** | The **event** object, added by Electron. |
| **2nd** | The value given to `webContents.send` after the channel name — here, `seconds`. |

`ipcRenderer.removeListener('player:progress', listener)` stops a
listener. It only removes it when it is given **the same function** that
was given to `ipcRenderer.on`.

`App` starts listening in a `useEffect`:
`window.tunebox.onProgress(setElapsed)`. `setElapsed` is a React state
setter: it stores its **first** argument as the new `elapsed`. The
function `onProgress` returns is what React calls to stop listening.

## 4. Choosing the folder: `dialog.showOpenDialog`

The `songs:choose-folder` handler opens the system's folder dialog with
`dialog.showOpenDialog(win, { properties: ['openDirectory'] })`. The
promise resolves with an object:

| Property | What it is |
|----------|------------|
| `canceled` | `true` if the user closed the dialog without choosing anything. |
| `filePaths` | An **array** of strings: the full path of every folder (or file) chosen. Empty when `canceled` is `true`. |

`readSongs(folder)` in `main/player.js` lists a folder with
`fs.readdirSync(folder)`, which needs the folder's path as a **string**.

## 5. The quit question: `dialog.showMessageBox`

When the window is closed while a song is playing, the `close` listener
calls `dialog.showMessageBox(win, { … })`, which shows `message` with the
buttons listed in `buttons`, in that order. The promise resolves with an
object:

| Property | What it is |
|----------|------------|
| `response` | The **index** of the clicked button in the `buttons` array. Indexes start at 0. |
| `checkboxChecked` | The state of the checkbox (only used when a `checkboxLabel` is given). |

## 6. The Space shortcut: `before-input-event`

`createWindow()` listens to `before-input-event` on the window's
`webContents`. The main process receives every key event in the window
there, **before the page receives it**:

| `input` property | What it is |
|------------------|------------|
| `type` | `'keyDown'` when a key is pressed, `'keyUp'` when it is released. |
| `key` | The key: `' '` for Space, `'Enter'`, `'a'`… |
| `control`, `meta` | `true` if Ctrl / ⌘ is held. |

`event.preventDefault()` stops the page from receiving the key press.

A key press that is **not** prevented also does what it normally does in
the page. In Tunebox's page, the keyboard focus can be on one of its
buttons (*Choose music folder…*, *Pause / Resume*, *Stop*) after it has
been clicked, and pressing Space or Enter on a focused button clicks it.

## 7. Closing the window

The window emits `close` just before it closes. In Tunebox's `close`
listener:

- `event.preventDefault()` keeps the window open while the question is
  asked;
- `stopPlayback()` closes VLC and stops the timer;
- `win.destroy()` closes the window at once, without emitting `close`
  again;
- when the last window has closed, the app emits `window-all-closed`,
  and `main/main.js` quits the app there.
