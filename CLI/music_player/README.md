# CLI Music Player

An interactive, flicker-free terminal Music Player built with **Node.js** featuring raw keyboard navigation, bidirectional standard I/O subprocess control, in-place ANSI screen redrawing, duration parsing, and real-time percentage-based progress tracking.

---

## 🌟 Key Features

- 📂 **Dynamic Directory Prompt**: Prompts for a custom songs directory on launch (with `./songs` default fallback).
- 🎵 **Multi-Format Audio Filtering**: Automatically scans and filters audio files (`.mp3`, `.aiff`, `.wav`).
- ⌨️ **Interactive Raw Stdin Navigation**: Real-time keystroke interception without requiring Enter after every navigation action.
- 🔄 **Flicker-Free In-Place Redraw**: Uses ANSI cursor positioning (`readline.cursorTo(process.stdout, 0, 0)`) and downward clearing to eliminate terminal scrolling and ghosting.
- ⏯️ **Reliable Pause & Resume**: Uses standard I/O IPC over VLC's headless Remote Control (`rc`) interface (`pause\n`) to preserve playback position accurately.
- ⏱️ **Track Duration & Percentage Progress Bar**: Dynamically queries song duration (`get_length`) and renders a real-time progress bar: `[=====>-----] 50% (5s / 10s)`.
- 🧹 **Robust Lifecycle & Process Management**: Cleans up child processes, removes event listeners, and stops timers when changing tracks or exiting with `Ctrl+C`.

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **VLC Media Player**: Ensure `vlc` is installed and accessible in your system's PATH.
  - *macOS*: `brew install --cask vlc` (or link `/Applications/VLC.app/Contents/MacOS/VLC` to `/usr/local/bin/vlc`)
  - *Ubuntu/Debian*: `sudo apt-get install vlc`
  - *Windows*: Add VLC installation directory to PATH.

---

## 🚀 How to Run

1. **Navigate to the project folder**:
   ```bash
   cd /Users/mayanksharma/Downloads/Pratice/APP_DEV/cli_song_app
   ```

2. **Start the application**:
   ```bash
   npm start
   # or
   node index.js
   ```

3. **Select Songs Folder**:
   - Press **Enter** to accept the default `./songs` directory, or enter a custom path.

---

## 🎮 Controls & Keybindings

| Key | Action | Description |
| :--- | :--- | :--- |
| `↑` (Up Arrow) | **Navigate Up** | Move cursor pointer (`>`) to previous song |
| `↓` (Down Arrow) | **Navigate Down** | Move cursor pointer (`>`) to next song |
| `Enter` | **Play Song** | Play the highlighted song from beginning |
| `p` / `P` / `Space` | **Play / Pause** | Toggle pause and resume from current position |
| `←` (Left Arrow) | **Previous Track** | Select previous song and play immediately |
| `→` (Right Arrow) | **Next Track** | Select next song and play immediately |
| `Ctrl + C` | **Quit** | Gracefully terminate audio subprocess & exit |

---

## 📁 Project Structure & Deliverables

```
cli_song_app/
├── index.js              # Core application logic, IPC manager & renderer
├── package.json          # Node.js project manifest
├── README.md             # Project overview & documentation
├── SUBMISSION.md         # Master submission document (Architecture & Questionnaire)
├── QUESTIONNAIRE.md      # Standalone answers to all 9 challenge questions
├── AI_CHAT_HISTORY.md    # Refined AI conversation & engineering prompt history
└── songs/                # Sample audio tracks folder (.mp3)
```

---

## 📄 Submission Files

For the Refinement Challenge submission requirements:
1. **Architecture Diagram**: See [SUBMISSION.md](file:///Users/mayanksharma/Downloads/Pratice/APP_DEV/cli_song_app/SUBMISSION.md#1-architecture-diagram).
2. **AI Chat History**: See [AI_CHAT_HISTORY.md](file:///Users/mayanksharma/Downloads/Pratice/APP_DEV/cli_song_app/AI_CHAT_HISTORY.md).
3. **Understanding Questionnaire**: See [QUESTIONNAIRE.md](file:///Users/mayanksharma/Downloads/Pratice/APP_DEV/cli_song_app/QUESTIONNAIRE.md).
