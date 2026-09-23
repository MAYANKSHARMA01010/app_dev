import { app, BrowserWindow, ipcMain, dialog, desktopCapturer, screen } from "electron";
import path from "path";
import fs from "fs";
import { execFile } from "child_process";

let electronWindow = null;
let startTimestamp = null;
let timerInterval = null;
let captureInterval = null;
let isExamActive = false;
let originalMacSwipeGesture = null;

const CAMERA_DIR = path.join(import.meta.dirname, "user-camera-snap");
const SCREEN_DIR = path.join(import.meta.dirname, "user-screen-snap");

function ensureDirs() {
    if (!fs.existsSync(CAMERA_DIR)) fs.mkdirSync(CAMERA_DIR, { recursive: true });
    if (!fs.existsSync(SCREEN_DIR)) fs.mkdirSync(SCREEN_DIR, { recursive: true });
}

// Backup and disable 3-finger swipe gesture on macOS during exam
function disableMacSwipeGesture() {
    if (process.platform === 'darwin') {
        execFile('defaults', ['read', 'com.apple.AppleMultitouchTrackpad', 'TrackpadThreeFingerHorizSwipeGesture'], (err, stdout) => {
            if (!err && stdout.trim()) {
                originalMacSwipeGesture = stdout.trim();
            }
            execFile('defaults', ['write', 'com.apple.AppleMultitouchTrackpad', 'TrackpadThreeFingerHorizSwipeGesture', '-int', '0'], () => {});
        });
    }
}

// Restore 3-finger swipe gesture on macOS
function restoreMacSwipeGesture() {
    if (process.platform === 'darwin') {
        const val = originalMacSwipeGesture || '2';
        execFile('defaults', ['write', 'com.apple.AppleMultitouchTrackpad', 'TrackpadThreeFingerHorizSwipeGesture', '-int', val], () => {});
    }
}

async function captureOsScreen() {
    try {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.size;
        const scaleFactor = primaryDisplay.scaleFactor || 1;

        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: {
                width: Math.round(width * scaleFactor),
                height: Math.round(height * scaleFactor)
            }
        });

        if (sources && sources.length > 0 && !sources[0].thumbnail.isEmpty()) {
            return sources[0].thumbnail.toJPEG(80);
        }
    } catch (_err) {
        // Fallback gracefully if OS permissions restrict desktopCapturer
    }

    if (electronWindow && !electronWindow.isDestroyed()) {
        try {
            const img = await electronWindow.capturePage();
            if (!img.isEmpty()) {
                return img.toJPEG(80);
            }
        } catch (err) {
            console.error("capturePage error:", err);
        }
    }
    return null;
}

function stopTimers() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (captureInterval) {
        clearInterval(captureInterval);
        captureInterval = null;
    }
}

function applyKioskMode(enable) {
    if (!electronWindow || electronWindow.isDestroyed()) return;

    if (enable) {
        isExamActive = true;
        disableMacSwipeGesture();

        electronWindow.setFullScreenable(true);
        electronWindow.setKiosk(true);
        electronWindow.setFullScreen(true);
        electronWindow.setAlwaysOnTop(true, 'screen-saver');
        electronWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        electronWindow.focus();
        electronWindow.moveTop();
    } else {
        isExamActive = false;
        restoreMacSwipeGesture();

        electronWindow.setAlwaysOnTop(false);
        electronWindow.setVisibleOnAllWorkspaces(false);
        electronWindow.setKiosk(false);
        electronWindow.setFullScreen(false);
    }
}

function createWindow() {
    ensureDirs();

    electronWindow = new BrowserWindow({
        height: 1000,
        width: 1000,
        fullscreenable: true,
        webPreferences: {
            devTools: true,
            preload: path.join(import.meta.dirname, 'preload.js')
        }
    });

    electronWindow.loadURL('http://localhost:5173');

    // Intercept and prevent macOS trackpad swipe navigation
    electronWindow.on('swipe', (event) => {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
    });

    // Guard against window blur / swipe-away during exam
    electronWindow.on('blur', () => {
        if (isExamActive && electronWindow && !electronWindow.isDestroyed()) {
            electronWindow.focus();
            electronWindow.moveTop();
            electronWindow.webContents.send('blur-warning');
        }
    });

    electronWindow.on('closed', () => {
        stopTimers();
        restoreMacSwipeGesture();
        electronWindow = null;
    });
}

ipcMain.handle('enter-fullscreen', () => {
    applyKioskMode(true);
    return { success: true };
});

ipcMain.handle('exit-fullscreen', () => {
    applyKioskMode(false);
    return { success: true };
});

ipcMain.handle('start-timer', (_event) => {
    stopTimers();
    startTimestamp = Date.now();

    // Ensure full screen kiosk and gesture lockdown is active throughout the test
    applyKioskMode(true);

    // 1. Send Timer Tick every 1s
    timerInterval = setInterval(() => {
        if (electronWindow && !electronWindow.isDestroyed()) {
            electronWindow.webContents.send('timer', (Date.now() - startTimestamp) / 1000);
        }
    }, 1000);

    // 2. Periodic Proctoring Capture every 5s throughout the paper
    captureInterval = setInterval(async () => {
        if (electronWindow && !electronWindow.isDestroyed()) {
            // Trigger renderer to capture user camera snap
            electronWindow.webContents.send('camera-shot');

            // Capture OS screen
            try {
                const screenBuffer = await captureOsScreen();
                if (screenBuffer) {
                    ensureDirs();
                    const filePath = path.join(SCREEN_DIR, `${Date.now()}.jpg`);
                    fs.writeFileSync(filePath, screenBuffer);
                }
            } catch (err) {
                console.error("OS Screen capture error:", err);
            }
        }
    }, 5000);
});

ipcMain.handle('stop-timer', (_event) => {
    stopTimers();
    applyKioskMode(false);
    return { success: true };
});

ipcMain.handle('store-camera-snap-image-on-disk', (_event, data) => {
    ensureDirs();
    const filePath = path.join(CAMERA_DIR, `${Date.now()}.jpg`);
    fs.writeFileSync(filePath, Buffer.from(data));
});

ipcMain.handle('store-screen-snap-image-on-disk', (_event, data) => {
    ensureDirs();
    const filePath = path.join(SCREEN_DIR, `${Date.now()}.jpg`);
    fs.writeFileSync(filePath, Buffer.from(data));
});

ipcMain.handle('capture-screen-now', async (_event) => {
    const buffer = await captureOsScreen();
    if (buffer) {
        ensureDirs();
        const filePath = path.join(SCREEN_DIR, `${Date.now()}.jpg`);
        fs.writeFileSync(filePath, buffer);
        return { success: true, filePath };
    }
    return { success: false };
});

ipcMain.on("show-rules", () => {
    if (!electronWindow || electronWindow.isDestroyed()) return;
    dialog.showMessageBox(electronWindow, {
        type: "info",
        title: "Athena Exam Rules",
        message: "Exam Rules",
        detail:
            "1. Stay on the exam screen.\n" +
            "2. Camera must remain enabled.\n" +
            "3. Do not leave the exam or swipe between screens.\n" +
            "4. Do not use external assistance.\n" +
            "5. Click Exit Exam when finished."
    });
});

app.whenReady().then(createWindow);

app.on('before-quit', () => {
    restoreMacSwipeGesture();
});

app.on('window-all-closed', () => {
    stopTimers();
    restoreMacSwipeGesture();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});