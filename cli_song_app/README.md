# CLI Song App

Cross-platform CLI Song Player built with Node.js using `fs`, `path`, `child_process.spawn`, and `process.stdin.on("data")`.

## Features
- 🌐 **Cross-Platform Directory Scanning**: Uses Node's native `fs.readdir` and `path.join` to list songs on macOS, Windows, and Linux.
- 🎵 **Audio File Filtering**: Automatically filters audio formats (`.mp3`, `.wav`, `.aiff`, `.m4a`, `.ogg`, `.flac`).
- 🔊 **OS-Aware Audio Playback**: Spawns the appropriate native player (`afplay` on macOS, PowerShell `SoundPlayer` on Windows, `aplay` on Linux).
- ⌨️ **Interactive Terminal Controls**: Select by song number (`1`, `2`, ...), `list`, `stop`, or `exit`.

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
