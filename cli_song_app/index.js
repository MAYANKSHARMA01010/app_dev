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
    console.log(`Press 'Up' or 'Down' arrow to navigate`)
    console.log(`Press 'Ctrl + C' to exit\n`)
    if (!currentlyPlaying) {
        console.log(`Not Playing Anything`)
    } else {
        console.log(`Currently Playing: ${currentlyPlaying}`)
    }
}

// Play Song
function playSong(songFilePath) {
    if (currentProcess) {
        currentProcess.kill()
    }
    currentProcess = spawn('afplay', [songFilePath])
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
        if (rawUserInput[0] === " ") {
            isPause = !isPause
            if (isPause) {
                currentProcess.kill()
            } else {
                playSong(SONGS_DIR + "/" + songs[userSelectionIndex])
            }
        }
        if (rawUserInput[0] === 0x03) { // Ctrl+C
            if (currentProcess) currentProcess.kill()
            process.exit(0)
        }
        if (rawUserInput[0] === 0x0d) { // Enter
            currentlyPlaying = songs[userSelectionIndex]
            playSong(SONGS_DIR + "/" + songs[userSelectionIndex])
        }
        if (rawUserInput[0] === 0x1b && rawUserInput[1] === 0x5b) {
            if (rawUserInput[2] === 0x41) { // Up Key
                userSelectionIndex = Math.max(0, userSelectionIndex - 1)
            }
            if (rawUserInput[2] === 0x42) { // Down Key
                userSelectionIndex = Math.min(songs.length - 1, userSelectionIndex + 1)
            }
        }
        listSongs(SONGS_DIR)
    })
})
