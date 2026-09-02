import { app, BrowserWindow } from "electron";

function createWindow() {
    const win = new BrowserWindow({
        width: 500,
        height: 400
    });

    win.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);