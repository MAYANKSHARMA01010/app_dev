# CLI Song App

Interactive cross-platform CLI Song Player built with Node.js using `readline`, `fs`, `path`, `child_process.spawn`, and `process.stdin`.

## Features
- 📂 **Dynamic Directory Prompt**: Prompts for custom song directory on startup (with default `./songs` and `~` home expansion support).
- 🎵 **Multiple Audio Format Support**: Automatically scans and filters audio files (`.mp3`, `.wav`, `.aiff`, `.m4a`, `.ogg`, `.flac`, `.aac`).
- ⌨️ **Interactive Terminal UI**: Arrow keys (`↑`/`↓`) to navigate through the song list in real time.
- 🔊 **Cross-Platform Audio Playback**: Spawns native system players (`afplay` on macOS, PowerShell `SoundPlayer` on Windows, `aplay` on Linux).
- ⏹️ **Playback Management**: Automatically stops previously playing track before playing a new one; dedicated stop button (`s` / `Space`).

---

## How to Run

1. Navigate to the project directory:
   ```bash
   cd /Users/mayanksharma/Downloads/Pratice/APP_DEV/cli_song_app
   ```

2. Start the application:
   ```bash
   npm start
   # or
   node index.js
   ```

3. Enter the path to your songs folder (or press **Enter** to use the default `./songs` folder).

4. **Controls**:
   - `↑` / `↓`: Navigate songs
   - `Enter`: Play selected song
   - `p` / `P` / `Space`: Play / Pause playback
   - `Ctrl+C`: Quit application


