# CLI Song App

Simple CLI Song Player built with Node.js using `child_process` (`spawn`), `ls`, `afplay` (macOS), and `process.stdin.on("data")`.

## Features
- **`listSongs(directoryPath)`**: Lists all audio files from the `./songs` directory using `spawn("ls", [directoryPath])`.
- **`playSong(songPath)`**: Plays the chosen audio file using `spawn("afplay", [songPath])`.
- **`process.stdin.on("data", ...)`**: Reads terminal input to let you choose songs by number, stop playback, list files, or exit.

---

## How to Run

1. Navigate to the project directory:
   ```bash
   cd /Users/mayanksharma/Downloads/Pratice/APP_DEV/cli_song_app
   ```

2. Start the application:
   ```bash
   node index.js
   ```

3. Type a song number (e.g. `1`), or commands like `list`, `stop`, `exit`.
