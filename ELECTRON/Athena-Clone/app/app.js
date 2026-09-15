import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";

let window = null;
let startTimestamp = null
let count = 0

function createWindow() {
    window = new BrowserWindow({
        height: 1000,
        width: 1000,
        webPreferences: {
            devTools: true,
            preload: path.join(import.meta.dirname, 'preload.js')
        }
    })

    window.loadURL('http://localhost:5173')
}

ipcMain.handle('start-timer', (event) => {
    startTimestamp = Date.now()
    setInterval(() => {
        window.webContents.send('timer', (Date.now() - startTimestamp) / 1000);
        count += 1
        if (count === 5) {
            app.quit()
        }
    }, 1000);
})

ipcMain.handle('quit-app', () => {
    app.quit();
})

app.whenReady().then(createWindow);