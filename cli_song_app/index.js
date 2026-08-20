const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// Audio file extensions supported
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.aiff', '.m4a', '.ogg', '.flac', '.aac'];

let songsDir = '';
let songs = [];
let userSelectionIndex = 0;
let currentPlayProcess = null;
let currentPlayingSong = null;

// Prompt user for songs directory path
function promptSongDirectory() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        const ask = () => {
            rl.question('🎵 Enter songs directory path (default: ./songs): ', (answer) => {
                let inputPath = answer.trim();
                if (!inputPath) {
                    inputPath = './songs';
                }

                // Expand ~ to user home directory
                if (inputPath.startsWith('~')) {
                    inputPath = path.join(os.homedir(), inputPath.slice(1));
                }

                const resolvedPath = path.resolve(process.cwd(), inputPath);

                if (!fs.existsSync(resolvedPath)) {
                    console.log(`\x1b[31m❌ Directory not found: "${resolvedPath}". Please try again.\x1b[0m\n`);
                    ask();
                    return;
                }

                try {
                    const stats = fs.statSync(resolvedPath);
                    if (!stats.isDirectory()) {
                        console.log(`\x1b[31m❌ "${resolvedPath}" is not a directory. Please try again.\x1b[0m\n`);
                        ask();
                        return;
                    }
                } catch (err) {
                    console.log(`\x1b[31m❌ Error accessing "${resolvedPath}": ${err.message}. Please try again.\x1b[0m\n`);
                    ask();
                    return;
                }

                // Check if directory contains supported songs
                try {
                    const files = fs.readdirSync(resolvedPath);
                    const matchingSongs = files.filter((file) =>
                        AUDIO_EXTENSIONS.includes(path.extname(file).toLowerCase())
                    );

                    if (matchingSongs.length === 0) {
                        console.log(`\x1b[33m⚠️  No audio files found in "${resolvedPath}". Please choose a folder with audio files.\x1b[0m\n`);
                        ask();
                        return;
                    }
                } catch (err) {
                    console.log(`\x1b[31m❌ Error reading directory: ${err.message}. Please try again.\x1b[0m\n`);
                    ask();
                    return;
                }

                rl.close();
                resolve(resolvedPath);
            });
        };

        ask();
    });
}

// Load available songs from directory
function loadSongs(songDirectoryPath) {
    const files = fs.readdirSync(songDirectoryPath);
    songs = files.filter((file) =>
        AUDIO_EXTENSIONS.includes(path.extname(file).toLowerCase())
    );
}

// Render the interactive CLI UI
function renderUI() {
    console.clear();
    console.log('\x1b[1m\x1b[36m=== 🎧 CLI SONG PLAYER ===\x1b[0m');
    console.log(`\x1b[90m📁 Directory: ${songsDir}\x1b[0m\n`);

    if (currentPlayingSong) {
        console.log(`\x1b[32m▶️  Now Playing: \x1b[1m${currentPlayingSong}\x1b[0m`);
    } else {
        console.log('\x1b[90m⏹️  Playback: Stopped\x1b[0m');
    }

    console.log('\n\x1b[1m🎵 Song List:\x1b[0m');
    songs.forEach((song, ind) => {
        if (ind === userSelectionIndex) {
            console.log(`  \x1b[36m\x1b[1m❯ ${ind + 1}. ${song}\x1b[0m`);
        } else {
            console.log(`    \x1b[37m${ind + 1}. ${song}\x1b[0m`);
        }
    });

    console.log('\n\x1b[90m────────────────────────────────────────\x1b[0m');
    console.log('\x1b[33mControls:\x1b[0m \x1b[1m[↑/↓]\x1b[0m Navigate | \x1b[1m[Enter]\x1b[0m Play | \x1b[1m[s/Space]\x1b[0m Stop | \x1b[1m[q / Ctrl+C]\x1b[0m Quit');
}

// Stop current song playback
function stopSong() {
    if (currentPlayProcess) {
        try {
            currentPlayProcess.kill();
        } catch (e) {
            // Ignore if already dead
        }
        currentPlayProcess = null;
    }
    currentPlayingSong = null;
}

// Play song cross-platform
function playSong(songFilePath, songName) {
    stopSong();

    currentPlayingSong = songName;

    const platform = process.platform;
    if (platform === 'darwin') {
        currentPlayProcess = spawn('afplay', [songFilePath]);
    } else if (platform === 'win32') {
        currentPlayProcess = spawn('powershell', [
            '-c',
            `(New-Object Media.SoundPlayer "${songFilePath}").PlaySync()`
        ]);
    } else {
        currentPlayProcess = spawn('aplay', [songFilePath]);
    }

    currentPlayProcess.on('close', () => {
        if (currentPlayingSong === songName) {
            currentPlayingSong = null;
            renderUI();
        }
    });

    currentPlayProcess.on('error', (err) => {
        currentPlayingSong = `Error: ${err.message}`;
        renderUI();
    });

    renderUI();
}

// Cleanup and exit cleanly
function exitApp() {
    stopSong();
    if (process.stdin.isTTY) {
        try {
            process.stdin.setRawMode(false);
        } catch (e) {}
    }
    console.clear();
    console.log('\n👋 Thanks for using CLI Song Player. Goodbye!\n');
    process.exit(0);
}

// Main application flow
async function main() {
    console.clear();
    console.log('\x1b[1m\x1b[36m🎵 Welcome to CLI Song Player\x1b[0m\n');

    songsDir = await promptSongDirectory();
    loadSongs(songsDir);
    userSelectionIndex = 0;

    renderUI();

    // Setup raw mode for interactive navigation
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    process.stdin.resume();

    process.stdin.on('data', (rawUserInput) => {
        // Ctrl+C (0x03) or 'q' / 'Q' (0x71, 0x51)
        if (rawUserInput[0] === 0x03 || rawUserInput[0] === 0x71 || rawUserInput[0] === 0x51) {
            exitApp();
            return;
        }

        // Enter key (CR: 0x0d, LF: 0x0a)
        if (rawUserInput[0] === 0x0d || rawUserInput[0] === 0x0a) {
            if (songs.length > 0) {
                const selectedSong = songs[userSelectionIndex];
                playSong(path.join(songsDir, selectedSong), selectedSong);
            }
            return;
        }

        // 's' or 'S' (0x73, 0x53) or Space (0x20) -> Stop playback
        if (rawUserInput[0] === 0x73 || rawUserInput[0] === 0x53 || rawUserInput[0] === 0x20) {
            stopSong();
            renderUI();
            return;
        }

        // Arrow keys ANSI escape sequence: \x1b[A (Up) and \x1b[B (Down)
        if (rawUserInput[0] === 0x1b && rawUserInput[1] === 0x5b) {
            if (rawUserInput[2] === 0x41) {
                // Up Arrow
                userSelectionIndex = Math.max(0, userSelectionIndex - 1);
                renderUI();
                return;
            }
            if (rawUserInput[2] === 0x42) {
                // Down Arrow
                userSelectionIndex = Math.min(songs.length - 1, userSelectionIndex + 1);
                renderUI();
                return;
            }
        }
    });
}

main().catch((err) => {
    console.error('An unexpected error occurred:', err);
    process.exit(1);
});
