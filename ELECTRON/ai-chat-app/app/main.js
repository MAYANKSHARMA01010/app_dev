import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { streamLLMMessage } from './llm-service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

// ─── Persistent Storage ────────────────────────────────────────────────────
const getStoragePath = () => path.join(app.getPath('userData'), 'nexuschat-data.json');

function loadStorage() {
  try {
    const p = getStoragePath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('[NexusChat] Storage load error:', e.message);
  }
  return { settings: {}, conversations: {} };
}

function persistStorage(data) {
  try {
    fs.writeFileSync(getStoragePath(), JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[NexusChat] Storage save error:', e.message);
  }
}

let storage = loadStorage();
let mainWindow = null;

function emitSystemLog(level, message, meta = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('system:log', {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      level,
      message,
      meta,
    });
  }
}

// ─── Browser Window ────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 820,
    minWidth: 960,
    minHeight: 620,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#08080f',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  const devUrl = 'http://127.0.0.1:5173';

  if (process.env.ELECTRON_DEV && !app.isPackaged) {
    mainWindow.loadURL(devUrl);
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL(devUrl);
  }

  mainWindow.webContents.on('did-fail-load', () => {
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    emitSystemLog('info', 'NexusChat desktop application ready and initialized', {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
    });
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC: Settings ─────────────────────────────────────────────────────────
ipcMain.handle('settings:get', () => storage.settings || {});

ipcMain.handle('settings:save', (_, settings) => {
  storage.settings = settings;
  persistStorage(storage);
  emitSystemLog('info', 'Settings updated and saved to disk', {
    provider: settings.provider,
    model: settings.model,
    fallbackEnabled: settings.fallback_enabled,
  });
  return { success: true };
});

// ─── IPC: Conversations ────────────────────────────────────────────────────
ipcMain.handle('conversations:get-all', () => storage.conversations || {});

ipcMain.handle('conversations:save', (_, { id, data }) => {
  storage.conversations = storage.conversations || {};
  storage.conversations[id] = data;
  persistStorage(storage);
  return { success: true };
});

ipcMain.handle('conversations:delete', (_, id) => {
  if (storage.conversations) delete storage.conversations[id];
  persistStorage(storage);
  emitSystemLog('info', `Conversation cleared for persona: ${id}`);
  return { success: true };
});

// ─── IPC: Ollama Models ────────────────────────────────────────────────────
ipcMain.handle('ollama:list-models', async () => {
  try {
    const url = (storage.settings?.ollama_url || 'http://localhost:11434').replace(/\/$/, '');
    const res = await fetch(`${url}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m) => ({
      id: m.name,
      name: `${m.name} (Local)`,
    }));
  } catch (e) {
    return [];
  }
});

// ─── IPC: LLM Streaming ────────────────────────────────────────────────────
ipcMain.on('chat:stream', async (event, params) => {
  const {
    streamId, provider, model, messages, systemPrompt, personaId, ollamaUrl,
    fallbackEnabled, fallbackOrder,
  } = params;

  // Gather ALL provider API keys from persistent storage
  const apiKeys = {
    openai: storage.settings?.openai_api_key || '',
    anthropic: storage.settings?.anthropic_api_key || '',
    gemini: storage.settings?.gemini_api_key || '',
    groq: storage.settings?.groq_api_key || '',
    mistral: storage.settings?.mistral_api_key || '',
    together: storage.settings?.together_api_key || '',
  };

  const safe = (channel, ...args) => {
    if (!event.sender.isDestroyed()) event.sender.send(channel, ...args);
  };

  try {
    await streamLLMMessage({
      provider,
      model,
      apiKeys,
      messages,
      systemPrompt,
      personaId,
      ollamaUrl: ollamaUrl || storage.settings?.ollama_url || 'http://localhost:11434',
      fallbackEnabled: fallbackEnabled ?? storage.settings?.fallback_enabled ?? true,
      fallbackOrder: fallbackOrder ?? storage.settings?.fallback_order ?? [],
      onChunk: (chunk) => safe(`chat:chunk:${streamId}`, chunk),
      onComplete: () => safe(`chat:done:${streamId}`),
      onError: (err) => safe(`chat:error:${streamId}`, err.message || String(err)),
      onFallback: (prov, i, reason) => safe(`chat:fallback:${streamId}`, { provider: prov, attempt: i, reason }),
      onContextTrimmed: (info) => safe(`chat:trimmed:${streamId}`, info),
      onLog: (log) => safe(`chat:log:${streamId}`, log),
    });
  } catch (err) {
    safe(`chat:error:${streamId}`, err.message || String(err));
  }
});

// ─── IPC: Window Controls ─────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());
