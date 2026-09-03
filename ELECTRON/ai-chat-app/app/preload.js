import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Settings ──────────────────────────────────────────────────────────
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  // ── Conversations ─────────────────────────────────────────────────────
  getAllConversations: () => ipcRenderer.invoke('conversations:get-all'),
  saveConversation: (id, data) => ipcRenderer.invoke('conversations:save', { id, data }),
  deleteConversation: (id) => ipcRenderer.invoke('conversations:delete', id),

  // ── Global System Logs ────────────────────────────────────────────────
  onSystemLog: (callback) => {
    const handler = (_, log) => callback(log);
    ipcRenderer.on('system:log', handler);
    return () => ipcRenderer.removeListener('system:log', handler);
  },

  // ── LLM Streaming (with fallback, context-trim, and rich log events) ───
  streamMessage: (params, onChunk, onComplete, onError, onFallback, onContextTrimmed, onLog) => {
    const streamId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const chunkHandler    = (_, chunk)  => onChunk(chunk);
    const doneHandler     = ()          => { cleanup(); onComplete(); };
    const errorHandler    = (_, error)  => { cleanup(); onError(error); };
    const fallbackHandler = (_, info)   => onFallback?.(info);
    const trimmedHandler  = (_, info)   => onContextTrimmed?.(info);
    const logHandler      = (_, log)    => onLog?.(log);

    const cleanup = () => {
      ipcRenderer.removeListener(`chat:chunk:${streamId}`,    chunkHandler);
      ipcRenderer.removeListener(`chat:done:${streamId}`,     doneHandler);
      ipcRenderer.removeListener(`chat:error:${streamId}`,    errorHandler);
      ipcRenderer.removeListener(`chat:fallback:${streamId}`, fallbackHandler);
      ipcRenderer.removeListener(`chat:trimmed:${streamId}`,  trimmedHandler);
      ipcRenderer.removeListener(`chat:log:${streamId}`,      logHandler);
    };

    ipcRenderer.on(`chat:chunk:${streamId}`,    chunkHandler);
    ipcRenderer.on(`chat:done:${streamId}`,     doneHandler);
    ipcRenderer.on(`chat:error:${streamId}`,    errorHandler);
    ipcRenderer.on(`chat:fallback:${streamId}`, fallbackHandler);
    ipcRenderer.on(`chat:trimmed:${streamId}`,  trimmedHandler);
    ipcRenderer.on(`chat:log:${streamId}`,      logHandler);

    ipcRenderer.send('chat:stream', { ...params, streamId });

    return cleanup; // caller can cancel
  },

  // ── Window Controls ────────────────────────────────────────────────────
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow:    () => ipcRenderer.send('window:close'),
});
