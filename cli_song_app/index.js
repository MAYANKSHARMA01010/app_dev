const { spawn } = require('child_process')
const fs = require('fs')
const readline = require('readline')

let SONGS_DIR = "./songs"
let songs = undefined
let userSelectionIndex = 0
let currentlyPlaying = null
let currentProcess = null
let isPause = true;

// List Available Songs to User
function listSongs(songDirectoryPath) {
    songs = fs.readdirSync(songDirectoryPath).filter((file) => file.endsWith(".mp3") || file.endsWith(".aiff"))
    console.clear()
    console.log(`All Listed Songs`)
    songs.forEach((song, ind) => {
        const prefix = ind === userSelectionIndex ? '> ' : '  ';
        console.log(`${prefix}${ind + 1}. ${song}`);
    });
    console.log(`\nPress 'Enter' to play song`)
    console.log(`Press 'p', 'P' or 'Space' to play/pause`)
    console.log(`Press 'Up' or 'Down' arrow to navigate`)
    console.log(`Press 'Left' or 'Right' arrow to change song`)
    console.log(`Press 'Ctrl + C' to exit\n`)
    if (!currentlyPlaying) {
        console.log(`Not Playing Anything`)
    } else if (isPause) {
        console.log(`Currently Paused: ${currentlyPlaying}`)
    } else {
        console.log(`Currently Playing: ${currentlyPlaying}`)
    }
}

// Play Song
function playSong(songFilePath) {
    if (currentProcess) {
        currentProcess.removeAllListeners('exit')
        currentProcess.kill()
    }
    isPause = false
    currentProcess = spawn('vlc', ["--intf", "rc", "--play-and-exit", songFilePath], {
        stdio: "pipe"
    })
    currentProcess.on('exit', () => {
        currentProcess = null
        currentlyPlaying = null
        isPause = true
        listSongs(SONGS_DIR)
    })
}

// Toggle Play / Pause
function togglePlayPause() {
    if (!currentlyPlaying || !currentProcess) {
        currentlyPlaying = songs[userSelectionIndex]
        playSong(SONGS_DIR + "/" + songs[userSelectionIndex])
    } else {
        currentProcess.stdin.write('pause\n')
        isPause = !isPause
    }
}

// Ask user for songs path
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

rl.question('Enter songs path (default ./songs): ', (answer) => {
    if (answer.trim()) {
        SONGS_DIR = answer.trim()
    }
    rl.close()

    listSongs(SONGS_DIR)

    // Take User Song Selection
    process.stdin.setRawMode(true)
    process.stdin.resume()

    process.stdin.on('data', (rawUserInput) => {
        const key = rawUserInput.toString()

        if (key === 'p' || key === 'P' || key === ' ' || rawUserInput[0] === 0x20) {
            togglePlayPause()
        } else if (rawUserInput[0] === 0x03) { // Ctrl+C
            if (currentProcess) {
                currentProcess.removeAllListeners('exit')
                currentProcess.kill()
            }
            process.exit(0)
        } else if (rawUserInput[0] === 0x0d) { // Enter
            currentlyPlaying = songs[userSelectionIndex]
            playSong(SONGS_DIR + "/" + songs[userSelectionIndex])
        } else if (rawUserInput[0] === 0x1b && rawUserInput[1] === 0x5b) {
            if (songs && songs.length > 0) {
                if (rawUserInput[2] === 0x41) { // Up Key (wrap to bottom)
                    userSelectionIndex = (userSelectionIndex - 1 + songs.length) % songs.length
                } else if (rawUserInput[2] === 0x42) { // Down Key (wrap to top)
                    userSelectionIndex = (userSelectionIndex + 1) % songs.length
                } else if (rawUserInput[2] === 0x44) { // Left Key (Previous song & play)
                    userSelectionIndex = (userSelectionIndex - 1 + songs.length) % songs.length
                    currentlyPlaying = songs[userSelectionIndex]
                    playSong(SONGS_DIR + "/" + songs[userSelectionIndex])
                } else if (rawUserInput[2] === 0x43) { // Right Key (Next song & play)
                    userSelectionIndex = (userSelectionIndex + 1) % songs.length
                    currentlyPlaying = songs[userSelectionIndex]
                    playSong(SONGS_DIR + "/" + songs[userSelectionIndex])
                }
            }
        }
        listSongs(SONGS_DIR)
    })
})

