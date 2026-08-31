const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

let SONGS_DIR = "./songs"
let songs = undefined
let userSelectionIndex = 0
let currentlyPlaying = null
let currentProcess = null
let isPause = true
let time_elapsed = 0
let total_duration = 0
let progressInterval = null

// Percentage-based progress bar helper: [=====>-----] 50% (5s / 10s)
function renderProgressBar(time_elapsed, total_duration) {
    const size = 20
    const ratio = total_duration > 0 ? Math.min(1, time_elapsed / total_duration) : 0
    const percent = Math.round(ratio * 100)
    const filled = Math.round(size * ratio)
    const bar = '='.repeat(filled) + (filled < size ? '>' : '') + '-'.repeat(Math.max(0, size - filled - (filled < size ? 1 : 0)))
    return `[${bar}] ${percent}% (${time_elapsed}s / ${total_duration ? total_duration + 's' : '--'})`
}

// List Available Songs to User with In-Place Terminal Redrawing
function listSongs(songDirectoryPath) {
    songs = fs.readdirSync(songDirectoryPath).filter((file) => file.endsWith(".mp3") || file.endsWith(".aiff") || file.endsWith(".wav"))
    
    // In-place terminal redraw: move cursor to origin (0, 0) and clear screen downward
    readline.cursorTo(process.stdout, 0, 0)
    readline.clearScreenDown(process.stdout)

    process.stdout.write(`=== CLI Music Player ===\n\n`)
    process.stdout.write(`All Listed Songs:\n`)
    songs.forEach((song, ind) => {
        const prefix = ind === userSelectionIndex ? '> ' : '  ';
        process.stdout.write(`${prefix}${ind + 1}. ${song}\n`);
    });
    process.stdout.write(`\nControls:\n`)
    process.stdout.write(`  • [↑ / ↓]   : Navigate song list\n`)
    process.stdout.write(`  • [Enter]   : Play selected song\n`)
    process.stdout.write(`  • [Space/P] : Play / Pause\n`)
    process.stdout.write(`  • [← / →]   : Previous / Next track\n`)
    process.stdout.write(`  • [Ctrl + C]: Quit\n\n`)

    if (!currentlyPlaying) {
        process.stdout.write(`Status: Not Playing Anything\n`)
    } else if (isPause) {
        process.stdout.write(`Status: Currently Paused: ${currentlyPlaying}\n`)
        process.stdout.write(`Progress: ${renderProgressBar(time_elapsed, total_duration)}\n`)
    } else {
        process.stdout.write(`Status: Currently Playing: ${currentlyPlaying}\n`)
        process.stdout.write(`Progress: ${renderProgressBar(time_elapsed, total_duration)}\n`)
    }
}

// Play Song
function playSong(songFilePath) {
    if (currentProcess) {
        currentProcess.removeAllListeners('exit')
        currentProcess.kill()
    }
    if (progressInterval) clearInterval(progressInterval)

    time_elapsed = 0
    total_duration = 0
    isPause = false

    currentProcess = spawn('vlc', ["--intf", "rc", "--play-and-exit", songFilePath], {
        stdio: "pipe"
    })

    setTimeout(() => {
        if (currentProcess && currentProcess.stdin) {
            currentProcess.stdin.write("get_length\n")
        }
    }, 300)

    currentProcess.stdout.on('data', (chunk) => {
        const lines = chunk.toString().split(/[\r\n]+/)
        for (const line of lines) {
            const clean = line.replace('>', '').trim()
            const num = parseInt(clean, 10)
            if (!isNaN(num) && num > 0 && total_duration === 0) {
                total_duration = num
                listSongs(SONGS_DIR)
            }
        }
    })

    progressInterval = setInterval(() => {
        if (!isPause && currentlyPlaying) {
            time_elapsed += 1
            if (total_duration > 0 && time_elapsed > total_duration) {
                time_elapsed = total_duration
            }
            listSongs(SONGS_DIR)
        }
    }, 1000)

    currentProcess.on('exit', () => {
        if (progressInterval) clearInterval(progressInterval)
        currentProcess = null
        currentlyPlaying = null
        isPause = true
        time_elapsed = 0
        total_duration = 0
        listSongs(SONGS_DIR)
    })
}

// Toggle Play / Pause
function togglePlayPause() {
    if (!currentlyPlaying || !currentProcess) {
        currentlyPlaying = songs[userSelectionIndex]
        playSong(path.join(SONGS_DIR, songs[userSelectionIndex]))
    } else {
        currentProcess.stdin.write('pause\n')
        isPause = !isPause
        listSongs(SONGS_DIR)
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
            if (progressInterval) clearInterval(progressInterval)
            if (currentProcess) {
                currentProcess.removeAllListeners('exit')
                currentProcess.kill()
            }
            process.exit(0)
        } else if (rawUserInput[0] === 0x0d) { // Enter
            currentlyPlaying = songs[userSelectionIndex]
            playSong(path.join(SONGS_DIR, songs[userSelectionIndex]))
        } else if (rawUserInput[0] === 0x1b && rawUserInput[1] === 0x5b) {
            if (songs && songs.length > 0) {
                if (rawUserInput[2] === 0x41) { // Up Key (wrap to bottom)
                    userSelectionIndex = (userSelectionIndex - 1 + songs.length) % songs.length
                } else if (rawUserInput[2] === 0x42) { // Down Key (wrap to top)
                    userSelectionIndex = (userSelectionIndex + 1) % songs.length
                } else if (rawUserInput[2] === 0x44) { // Left Key (Previous song & play)
                    userSelectionIndex = (userSelectionIndex - 1 + songs.length) % songs.length
                    currentlyPlaying = songs[userSelectionIndex]
                    playSong(path.join(SONGS_DIR, songs[userSelectionIndex]))
                } else if (rawUserInput[2] === 0x43) { // Right Key (Next song & play)
                    userSelectionIndex = (userSelectionIndex + 1) % songs.length
                    currentlyPlaying = songs[userSelectionIndex]
                    playSong(path.join(SONGS_DIR, songs[userSelectionIndex]))
                }
            }
        }
        listSongs(SONGS_DIR)
    })
})
