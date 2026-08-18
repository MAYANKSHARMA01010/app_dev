const { spawn } = require("child_process");
const path = require("path");

const SONGS_DIR = "./songs";

let songList = [];
let currentPlayer = null;

// List all songs in the folder using `ls`
function listSongs(directoryPath) {
    const scanner = spawn("ls", [directoryPath]);

    scanner.stdout.on("data", (data) => {
        songList = data
            .toString()
            .split("\n")
            .filter(song => song.trim() !== "");

        console.log(`\nSongs in ${directoryPath}:`);
        songList.forEach((song, index) => {
            console.log(`${index + 1}. ${song}`);
        });
        console.log("\nEnter song number to play (or 'list', 'stop', 'exit'): ");
    });

    scanner.stderr.on("data", (data) => {
        console.error(`Error listing songs: ${data}`);
    });
}

// Play a song using `afplay`
function playSong(songPath) {
    // If a song is already playing, stop it first
    if (currentPlayer) {
        currentPlayer.kill();
        currentPlayer = null;
    }

    console.log(`\n▶ Playing: ${songPath}`);
    currentPlayer = spawn("afplay", [songPath]);

    currentPlayer.stderr.on("data", (data) => {
        console.error(`Error playing song: ${data}`);
    });

    currentPlayer.on("close", (code) => {
        if (code === 0) {
            console.log(`\nFinished playing: ${songPath}`);
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
