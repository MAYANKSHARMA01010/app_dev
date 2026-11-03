# Tunebox — Questions

Read `readme.md` and , then the code in `main/`,
`preload/` and `src/`. Answer every question on your answer sheet.

When a question asks for code, write the complete code it asks for and
name the file it belongs to.

---

## Question 1 — Choosing a music folder

Clicking *Choose music folder…* opens a dialog in which the user picks a
folder. After a folder is chosen, the list should show the `.mp3` files
in it. At the moment the list stays empty after a folder is chosen.

`readSongs()` in `main/player.js` works correctly when it is given the
path of a folder. The problem is in the handler for the
`songs:choose-folder` channel in `main/main.js`.

1. Explain what `result.filePaths` contains, and why the handler's call
   to `readSongs()` fails.
2. Write the corrected handler.



#
---

## Question 2 — Elapsed time

While a song plays, the bottom of the window should show its name and the
time since it started, for example `Morning Run.mp3 — 01:05`, counting up
every second. At the moment the time always shows `NaN:NaN`.

The main process sends the correct number of seconds every second. The
problem is in the `onProgress` function in `preload/preload.js`.

1. Explain what `setElapsed` in `src/App.jsx` actually receives each
   second, and why.
2. Write the corrected `onProgress` function. It must still return a
   function that stops listening.

---

## Question 3 — Closing while a song plays

Closing the window while a song is playing should show the question
*A song is playing. Quit Tunebox?* with two buttons:

- **Keep listening**: the window stays open and the song keeps playing;
- **Stop and quit**: the song stops and the window closes.

At the moment each button does what the other one should do.

1. Explain what the `response` value given by `dialog.showMessageBox`
   contains, and why the two buttons do the opposite of their labels.
2. Write the corrected code.

---

## Question 4 — New connection: Stop

Clicking *Stop* should stop the song: VLC closes and the bottom of the
window shows *Nothing playing*. At the moment clicking *Stop* does
nothing, and the song keeps playing.

The main process already listens for this message, and the interface
already sends it, but the connection between them in
`preload/preload.js` is missing.

1. Name the function the interface calls on `window.tunebox` for this
   feature, and the IPC channel the main process listens on.
2. Write the code to add to `preload/preload.js` to implement the
   connection. Do not change any other file.
3. Explain which of `ipcRenderer.invoke` and `ipcRenderer.send` this
   connection must use, and why.
