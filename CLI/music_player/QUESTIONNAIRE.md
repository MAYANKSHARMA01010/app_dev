# Understanding Questionnaire

**Project:** CLI Music Player — Refinement Challenge  
**Author:** Mayank Sharma  

---

### **1. Your first arrow-navigation version printed the song list again and again. Why did that happen, and how did you make the list redraw in the same place?**

**Why it happened:**  
By default, standard terminal output functions (`console.log()` / `process.stdout.write('\n')`) append output to the bottom of the active terminal scrollback buffer and advance the cursor to the next line. Whenever the raw input listener intercepted a key event (such as the Up or Down arrow key), the application re-invoked the render/list function. Because previous lines remained in the buffer, each keypress printed an entirely new block of lines beneath the old one, resulting in a continuous trail of repeated song lists scrolling down the screen.

**How to make it redraw in the same place:**  
To achieve in-place redrawing, we control the terminal cursor position directly using ANSI escape sequences or the native Node.js `readline` module:
```javascript
// Move cursor back to row 0, column 0 (top-left origin)
readline.cursorTo(process.stdout, 0, 0);

// Clear the viewport from the cursor downward
readline.clearScreenDown(process.stdout);
```
By resetting the cursor to `(0, 0)` before printing each frame, subsequent render cycles overwrite the exact same screen coordinates rather than appending downward.

---

### **2. Why do we need both cursor movement and line clearing while redrawing the terminal UI? What problem can happen if we only move the cursor?**

**Why both are needed:**  
- **Cursor Movement** sets the insertion coordinate `(x, y)` where character writing begins.
- **Line Clearing** (or downward screen clearing) erases all existing glyphs on that line or region before or as new text is written.

**Problem if we only move the cursor:**  
If we only move the cursor without clearing the line, printing a shorter string over a previously printed longer string results in **text ghosting** (visual artifacts).  
*Example Scenario:*
- Frame 1 writes: `Status: Currently Playing: Very_Long_Song_Name_Remix.mp3` (54 characters).
- Frame 2 moves cursor to start of line and writes: `Status: Paused` (14 characters).
- **Result without line clearing:** `Status: Pausedy Playing: Very_Long_Song_Name_Remix.mp3` (the trailing 40 characters from Frame 1 remain visible).

Using line clearing (e.g. `\x1b[K` or `readline.clearScreenDown`) ensures the line buffer is wiped completely clean before rendering new state.

---

### **3. What does the selected-song variable represent? How do you make sure the user cannot move above the first song or below the last song?**

**What it represents:**  
The selected-song variable (`userSelectionIndex`) is an integer pointer that stores the 0-based index of the currently highlighted track in the `songs` array (`songs[userSelectionIndex]`). It dictates which song is marked with the active cursor indicator (`> `) in the terminal UI.

**Ensuring bounds safety:**  
To prevent the user from moving out of bounds (above the first item `0` or below the last item `songs.length - 1`), bounds clamping is implemented on arrow keypresses:
- **Up Arrow (`↑`):**
  ```javascript
  userSelectionIndex = Math.max(0, userSelectionIndex - 1);
  ```
  *(Prevents decrementing below index `0`)*.
- **Down Arrow (`↓`):**
  ```javascript
  userSelectionIndex = Math.min(songs.length - 1, userSelectionIndex + 1);
  ```
  *(Prevents incrementing beyond `songs.length - 1`)*.

*(Alternatively, if cyclical looping is desired, modulo wrapping can be used: `(userSelectionIndex - 1 + songs.length) % songs.length` for Up, and `(userSelectionIndex + 1) % songs.length` for Down).*

---

### **4. Why was afplay + SIGSTOP/SIGCONT not a reliable solution for a real pause/resume feature? What changed in your final approach?**

**Why `afplay` + `SIGSTOP`/`SIGCONT` failed:**  
1. **No Application-Level IPC:** `afplay` is a bare-bones CLI utility without an interactive command interface or stdio channel.
2. **OS Signal Freezing:** `SIGSTOP` forcibly pauses execution at the OS kernel scheduler level. This freezes the audio hardware buffer in memory, frequently causing buffer underruns, popping noises, and core audio stream lockups on macOS.
3. **Timer Desynchronization:** Because the process is frozen blindly, JavaScript timers cannot query current position, remaining duration, or accurately synchronize state upon `SIGCONT`.
4. **Platform Lock-In:** `afplay` is exclusive to macOS and offers no Windows/Linux parity.

**What changed in the final approach:**  
We switched to a real-time headless media player spawned with an interactive standard I/O Remote Control interface (e.g. VLC spawned via `spawn('vlc', ['--intf', 'rc', '--play-and-exit', filePath])`).  
This enables structured, non-blocking inter-process communication (IPC):
- **Pause/Resume:** Sent via standard input: `currentProcess.stdin.write('pause\n')`.
- **Metadata Queries:** Request track length via `currentProcess.stdin.write('get_length\n')` and parse duration asynchronously from `stdout`.
- The playback process stays alive and healthy, holding its audio stream cleanly.

---

### **5. How would you prove that your pause/resume implementation is correct? Describe a small test you would perform.**

**Verification Test Procedure:**
1. **Start Playback:** Highlight a track and press `Enter`. Verify that audio plays and the timer/progress bar increments: `[=>-----------------] 5% (1s / 20s)`, `(2s / 20s)`, `(3s / 20s)`.
2. **Execute Pause:** At exactly `5s`, press `p` (or `Space`).
   - *Check 1 (Audio):* Audio output ceases immediately without lag or clipping.
   - *Check 2 (UI):* Terminal status changes to `Currently Paused`.
   - *Check 3 (Timer):* Progress bar freezes at `5s` (`25%`).
3. **Hold State Verification:** Wait for 10 seconds while paused.
   - *Check 4 (Drift):* Verify the timer remains strictly at `5s` and does not drift or increment.
4. **Execute Resume:** Press `p` (or `Space`) again.
   - *Check 5 (Continuity):* Audio resumes seamlessly from the exact 5-second acoustic phrase without restarting from 0:00 or jumping ahead to 15s.
   - *Check 6 (Resumed Ticking):* Timer resumes incrementing: `6s`, `7s`, `8s`.

---

### **6. How is the progress percentage calculated? What should happen to the progress value while the song is paused?**

**Calculation Formula:**
$$\text{Ratio} = \begin{cases} \min\left(1.0, \frac{\text{time\_elapsed}}{\text{total\_duration}}\right) & \text{if } \text{total\_duration} > 0 \\ 0 & \text{otherwise} \end{cases}$$

$$\text{Percentage} = \text{Math.round}(\text{Ratio} \times 100)$$

In JavaScript:
```javascript
const ratio = total_duration > 0 ? Math.min(1, time_elapsed / total_duration) : 0;
const percent = Math.round(ratio * 100);
```

**Behavior while Paused:**  
While `isPause === true`, the interval timer (`progressInterval`) skips incrementing `time_elapsed`. Consequently, the calculated ratio and percentage stay completely constant, ensuring the progress bar displays a frozen percentage until playback resumes.

---

### **7. When the user starts a new song while another song is already playing, what needs to be stopped or cleaned up? What could happen if you do not do this?**

**What must be stopped / cleaned up:**
1. **Child Subprocess:** Terminate the active child process (`currentProcess.kill('SIGTERM')`).
2. **Event Listeners:** Remove previous `exit` and `stdout` listeners (`currentProcess.removeAllListeners('exit')`) so the old process's termination callback does not wipe the newly started track's state.
3. **Interval Timers:** Clear the existing interval timer (`clearInterval(progressInterval)`).
4. **Playback State:** Reset `time_elapsed = 0`, `total_duration = 0`, and `isPause = false`.

**What could happen if omitted:**
- **Audio Overlap:** Multiple audio streams play simultaneously through the speakers, creating audio chaos.
- **Resource Leaks / Zombie Processes:** Orphaned background player instances continue running in the background, consuming CPU and system audio channels.
- **Timer Race Conditions:** Multiple active `setInterval` timers run concurrently, causing `time_elapsed` to increment at 2x or 3x speed and making the UI progress bar flicker and jitter erratically.

---

### **8. Describe one bug or unexpected behaviour you faced while refining this application. What did you initially think was wrong, how did you investigate it, and what was the actual fix?**

**The Bug:**  
When querying track duration from the VLC Remote Control interface by sending `get_length\n`, `total_duration` either stayed at `0` or failed to parse, causing the progress bar to permanently display `0% (--s)`.

**Initial Hypothesis:**  
I initially thought VLC had not loaded the audio file metadata yet, or that the spawn options had blocked stdin/stdout communication.

**Investigation:**  
I attached a raw debug listener to the child process's standard output:
```javascript
currentProcess.stdout.on('data', (chunk) => {
    console.log("RAW STDOUT:", JSON.stringify(chunk.toString()));
});
```
The logs revealed that VLC's `rc` interface outputs an interactive prompt character (`> `) before and after commands, emitting chunks like `"> 185\r\n> "`. Running `parseInt("> 185")` returned `NaN` because of the leading prompt character.

**The Actual Fix:**  
I split incoming stdout data across line breaks, stripped all `>` characters and whitespace from each line, and parsed the clean numeric string:
```javascript
const lines = chunk.toString().split(/[\r\n]+/);
for (const line of lines) {
    const clean = line.replace('>', '').trim();
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num > 0 && total_duration === 0) {
        total_duration = num;
        listSongs(SONGS_DIR);
    }
}
```

---

### **9. If you had to add "jump forward 10 seconds" next, which part of your current application would you change and what existing playback information would you reuse?**

**What parts to change:**
1. **Input Key Dispatcher (`process.stdin.on('data')`):**  
   Add a listener for a designated seek key (e.g. key `f`, key `]`, or `Shift + Right Arrow` `0x1b 0x5b 0x31 0x3b 0x32 0x43`).
2. **Audio Process Seek Command:**  
   Send the seek command over the existing subprocess stdin stream:
   ```javascript
   if (currentProcess && currentProcess.stdin) {
       currentProcess.stdin.write('seek +10\n');
   }
   ```
3. **State Update:**  
   Advance `time_elapsed`:
   ```javascript
   time_elapsed = Math.min(total_duration, time_elapsed + 10);
   ```
4. **UI Update:**  
   Immediately trigger `listSongs(SONGS_DIR)` to instantly reflect the new progress bar and timestamp without waiting for the next 1-second interval tick.

**Existing playback information reused:**
- `currentProcess.stdin` (for non-blocking IPC command streaming).
- `time_elapsed` (to calculate the new timestamp offset).
- `total_duration` (to clamp the jump so the user cannot seek past the end of the track).
- `isPause` (to preserve paused/playing state during the seek).
