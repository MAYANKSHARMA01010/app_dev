import { app, BrowserWindow, ipcMain, dialog, desktopCapturer, screen } from "electron";
import path from "path";
import fs from "fs";

let electronWindow = null;
let startTimestamp = null;
let timerInterval = null;
let captureInterval = null;

const CAMERA_DIR = path.join(import.meta.dirname, "user-camera-snap");
const SCREEN_DIR = path.join(import.meta.dirname, "user-screen-snap");

function ensureDirs() {
    if (!fs.existsSync(CAMERA_DIR)) fs.mkdirSync(CAMERA_DIR, { recursive: true });
    if (!fs.existsSync(SCREEN_DIR)) fs.mkdirSync(SCREEN_DIR, { recursive: true });
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

function createWindow() {
    ensureDirs();

    electronWindow = new BrowserWindow({
        height: 1000,
        width: 1000,
        webPreferences: {
            devTools: true,
            preload: path.join(import.meta.dirname, 'preload.js')
        }
    });

    electronWindow.loadURL('http://localhost:5173');

    electronWindow.on('closed', () => {
        stopTimers();
        electronWindow = null;
    });
}

ipcMain.handle('start-timer', (_event) => {
    stopTimers();
    startTimestamp = Date.now();

    // 1. Send Timer Tick every 1s
    timerInterval = setInterval(() => {
        if (electronWindow && !electronWindow.isDestroyed()) {
            electronWindow.webContents.send('timer', (Date.now() - startTimestamp) / 1000);
        }
    }, 1000);

    // 2. Periodic Proctoring Capture every 5s (Camera snap & OS screen shot in separate folders)
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
            "3. Do not leave the exam.\n" +
            "4. Do not use external assistance.\n" +
            "5. Click Exit Exam when finished."
    });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    stopTimers();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});