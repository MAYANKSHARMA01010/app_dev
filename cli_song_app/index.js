#!/Users/mayanksharma/.local/state/fnm_multishells/28595_1787032920678/bin/node
// Shebang
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const SONGS_DIR = path.join(__dirname, "songs");

let songList = [];
let currentPlayer = null;

// Supported audio file extensions
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".aiff", ".m4a", ".ogg", ".flac", ".aac"]);

// List all songs in the folder synchronously using `fs.readdirSync`
function listSongs(directoryPath) {
    try {
        const pathExist = fs.existsSync(directoryPath)
        // Check if songs directory exists, if not create it
        if (!pathExist) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        const files = fs.readdirSync(directoryPath);

        // Filter only audio files (or all files if extensions aren't matched)
        songList = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return AUDIO_EXTENSIONS.has(ext);
        });

        // If no matching audio extension found, fallback to all non-hidden files
        if (songList.length === 0) {
            songList = files.filter(file => !file.startsWith("."));
        }

        console.log(`\nSongs in ${directoryPath}:`);
        if (songList.length === 0) {
            console.log("  (No audio files found in ./songs directory)");
        } else {
            songList.forEach((song, index) => {
                console.log(`${index + 1}. ${song}`);
            });
        }
        console.log("\nEnter song number to play (or 'list', 'stop', 'exit'): ");
    } catch (err) {
        console.error(`Error reading directory: ${err.message}`);
    }
}

// Cross-platform audio player spawn helper
function getAudioPlayer(songPath) {
    const platform = process.platform;

    if (platform === "darwin") {
        // macOS built-in player
        return spawn("afplay", [songPath]);
    } else if (platform === "win32") {
        // Windows Media Player / PowerShell player
        return spawn("powershell", [
            "-c",
            `(New-Object System.Media.SoundPlayer "${songPath}").PlaySync()`
        ]);
    } else {
        // Linux (aplay, paplay, or mpv)
        return spawn("aplay", [songPath]);
    }
}

// Play a song
function playSong(songPath) {
    // If a song is already playing, stop it first
    if (currentPlayer) {
        currentPlayer.kill();
        currentPlayer = null;
    }

    console.log(`\n▶ Playing: ${path.basename(songPath)}`);
    currentPlayer = getAudioPlayer(songPath);

    currentPlayer.stderr.on("data", (data) => {
        console.error(`Playback notice: ${data}`);
    });

    currentPlayer.on("close", (code) => {
        if (code === 0) {
            console.log(`\nFinished playing: ${path.basename(songPath)}`);
        } else if (code !== null && code !== 0) {
            console.log(`Player stopped.`);
        }
        currentPlayer = null;
    });
}

// Stop currently playing song
function stopSong() {
    if (currentPlayer) {
        currentPlayer.kill();
        currentPlayer = null;
        console.log("⏹ Playback stopped.");
    } else {
        console.log("No song is currently playing.");
    }
}

// Initial listing of songs
listSongs(SONGS_DIR);

// Handle terminal inputs via process.stdin.on("data")
process.stdin.setEncoding("utf-8");

process.stdin.on("data", (data) => {
    const input = data.toString().trim();

    if (!input) return;

    const num = parseInt(input);

    if (!isNaN(num)) {
        // User entered a song number
        if (num >= 1 && num <= songList.length) {
            const selectedSong = songList[num - 1];
            const songPath = path.join(SONGS_DIR, selectedSong);
            playSong(songPath);
        } else {
            console.log(`Invalid number. Please select between 1 and ${songList.length}`);
        }
    } else if (input.toLowerCase() === "list" || input.toLowerCase() === "ls") {
        listSongs(SONGS_DIR);
    } else if (input.toLowerCase() === "stop") {
        stopSong();
    } else if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
        stopSong();
        console.log("Exiting song player...");
        process.exit(0);
    } else {
        console.log(`Unknown command: "${input}". Type a song number, 'list', 'stop', or 'exit'.`);
    }
});
