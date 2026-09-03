import { useState, useEffect, useRef, useCallback } from 'react';
import { PERSONAS, PROVIDERS } from './data/personas.js';
import Sidebar from './components/Sidebar.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import LogsPanel from './components/LogsPanel.jsx';

const DEFAULT_SETTINGS = {
  provider: 'ollama',
  model: 'qwen2.5:latest',
  openai_api_key: '',
  anthropic_api_key: '',
  gemini_api_key: '',
  groq_api_key: '',
  mistral_api_key: '',
  together_api_key: '',
  ollama_url: 'http://localhost:11434',
  fallback_enabled: true,
  fallback_order: [],  // empty = auto-detect from available keys
};

export default function App() {
  const [currentPersonaId, setCurrentPersonaId] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [conversations, setConversations] = useState({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const cancelStreamRef = useRef(null);

  // ── Centralized Log Dispatcher ────────────────────────────────────────────
  const addLog = useCallback((entryOrLevel, message, meta) => {
    const entry = typeof entryOrLevel === 'object'
      ? entryOrLevel
      : {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
          level: entryOrLevel || 'info',
          message,
          meta,
        };
    setLogs((prev) => [...prev.slice(-300), entry]);
  }, []);

  // ── Load persisted data on mount ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      addLog('info', 'NexusChat UI initialized • Checking storage and system services');
      if (!window.electronAPI) {
        addLog('warn', 'Running in web browser mode (Electron IPC not present)');
        return;
      }

      const [savedSettings, savedConvos, localModels] = await Promise.all([
        window.electronAPI.getSettings(),
        window.electronAPI.getAllConversations(),
        window.electronAPI.getOllamaModels ? window.electronAPI.getOllamaModels().catch(() => []) : Promise.resolve([]),
      ]);

      const initialSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
      // Always prefer real free Ollama over mock demo
      if (initialSettings.provider === 'mock' || !initialSettings.provider) {
        initialSettings.provider = 'ollama';
        initialSettings.model = (localModels && localModels[0]?.id) || 'qwen2.5:latest';
        if (window.electronAPI.saveSettings) {
          await window.electronAPI.saveSettings(initialSettings);
        }
      }

      setSettings(initialSettings);
      setConversations(savedConvos || {});

      if (localModels && localModels.length > 0) {
        addLog('success', `✓ Local Ollama detected: ${localModels.map((m) => m.id).join(', ')}`);
      } else {
        addLog('info', 'Ollama provider ready • Default model: qwen2.5:latest');
      }

      addLog('info', `Active Provider: ${initialSettings.provider} (${initialSettings.model}) • Fallback: ${initialSettings.fallback_enabled !== false ? 'Enabled' : 'Disabled'}`);
    };
    load();
  }, [addLog]);

  // ── Global System Log Listener ────────────────────────────────────────────
  useEffect(() => {
    if (window.electronAPI?.onSystemLog) {
      const unsub = window.electronAPI.onSystemLog((log) => addLog(log));
      return unsub;
    }
  }, [addLog]);

  const currentPersona = PERSONAS.find((p) => p.id === currentPersonaId);
  const currentMessages = currentPersonaId ? (conversations[currentPersonaId]?.messages || []) : [];

  // ── Select Persona ────────────────────────────────────────────────────────
  const selectPersona = useCallback((personaId) => {
    if (isStreaming) return;
    const persona = PERSONAS.find((p) => p.id === personaId);
    setCurrentPersonaId(personaId);
    if (persona) {
      addLog('info', `Active persona switched to ${persona.name} (${persona.id})`);
    }
  }, [isStreaming, addLog]);

  // ── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || isStreaming || !currentPersona) return;

    const userMsg = { role: 'user', content: content.trim(), timestamp: Date.now() };
    const prevMessages = conversations[currentPersonaId]?.messages || [];
    const newMessages = [...prevMessages, userMsg];

    // Optimistic update
    setConversations((prev) => ({
      ...prev,
      [currentPersonaId]: { messages: newMessages },
    }));

    setIsStreaming(true);
    setStreamingContent('');

    const llmMessages = newMessages.map(({ role, content }) => ({ role, content }));
    let accumulated = '';

    addLog('info', `User prompted ${currentPersona.name}: "${content.slice(0, 60)}${content.length > 60 ? '...' : ''}"`, {
      persona: currentPersona.id,
      provider: settings.provider,
      model: settings.model,
    });

    if (!window.electronAPI?.streamMessage) {
      addLog('info', 'Desktop IPC bridge not detected. Connecting directly to local Ollama (http://localhost:11434)...');
      try {
        const response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: settings.model || 'qwen2.5:latest',
            messages: [
              { role: 'system', content: currentPersona.systemPrompt },
              ...llmMessages,
            ],
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`Ollama HTTP ${response.status}`);
        }

        addLog('stream', `Streaming response from local ${settings.model || 'qwen2.5:latest'}...`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                accumulated += parsed.message.content;
                setStreamingContent(accumulated);
              }
            } catch {}
          }
        }

        addLog('success', `✓ Completed local Ollama stream (${accumulated.length} chars)`);
        const aiMsg = { role: 'assistant', content: accumulated, timestamp: Date.now() };
        setConversations((prev) => ({
          ...prev,
          [currentPersonaId]: { messages: [...newMessages, aiMsg] },
        }));
        setIsStreaming(false);
        setStreamingContent('');
        return;
      } catch (err) {
        addLog('error', `Ollama connection error: ${err.message}. Ensure Ollama is running ('ollama serve').`);
        const errMsg = {
          role: 'assistant',
          content: `⚠️ Could not reach local Ollama: ${err.message}. Please launch the Electron desktop app or run \`ollama serve\` in your terminal.`,
          timestamp: Date.now(),
          isError: true,
        };
        setConversations((prev) => ({
          ...prev,
          [currentPersonaId]: { messages: [...newMessages, errMsg] },
        }));
        setIsStreaming(false);
        setStreamingContent('');
        return;
      }
    }

    const cancel = window.electronAPI.streamMessage(
      {
        provider: settings.provider,
        model: settings.model,
        messages: llmMessages,
        systemPrompt: currentPersona.systemPrompt,
        personaId: currentPersona.id,
        ollamaUrl: settings.ollama_url,
        fallbackEnabled: settings.fallback_enabled ?? true,
        fallbackOrder: settings.fallback_order ?? [],
      },
      // onChunk
      (chunk) => {
        accumulated += chunk;
        setStreamingContent(accumulated);
      },
      // onComplete
      () => {
        const aiMsg = { role: 'assistant', content: accumulated, timestamp: Date.now() };
        const finalMessages = [...newMessages, aiMsg];

        setConversations((prev) => {
          const updated = { ...prev, [currentPersonaId]: { messages: finalMessages } };
          if (window.electronAPI) {
            window.electronAPI.saveConversation(currentPersonaId, { messages: finalMessages });
          }
          return updated;
        });

        setIsStreaming(false);
        setStreamingContent('');
        cancelStreamRef.current = null;
      },
      // onError
      (error) => {
        const errMsg = {
          role: 'assistant',
          content: `⚠️ ${error || 'Something went wrong. Check your API key in Settings.'}`,
          timestamp: Date.now(),
          isError: true,
        };
        const finalMessages = [...newMessages, errMsg];
        setConversations((prev) => ({
          ...prev,
          [currentPersonaId]: { messages: finalMessages },
        }));
        setIsStreaming(false);
        setStreamingContent('');
        cancelStreamRef.current = null;
      },
      // onFallback
      ({ provider: fbProvider, attempt, reason }) => {
        showToast(`⚡ Switching to ${fbProvider} (attempt ${attempt})…`);
      },
      // onContextTrimmed
      ({ keptCount, totalCount, provider: p }) => {
        showToast(`✂️ Context trimmed to ${keptCount}/${totalCount} messages for ${p}`);
      },
      // onLog (Rich backend stream logs)
      (log) => {
        addLog(log);
      }
    );

    cancelStreamRef.current = cancel;
  }, [isStreaming, currentPersona, currentPersonaId, conversations, settings, addLog]);

  // ── Clear Chat ────────────────────────────────────────────────────────────
  const clearChat = useCallback(() => {
    if (isStreaming || !currentPersonaId) return;
    setConversations((prev) => {
      const updated = { ...prev, [currentPersonaId]: { messages: [] } };
      if (window.electronAPI) {
        window.electronAPI.saveConversation(currentPersonaId, { messages: [] });
      }
      return updated;
    });
    showToast('🗑 Chat cleared');
    addLog('info', `Cleared chat history for persona: ${currentPersona?.name || currentPersonaId}`);
  }, [isStreaming, currentPersonaId, currentPersona, addLog]);

  // ── Save Settings ─────────────────────────────────────────────────────────
  const saveSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    if (window.electronAPI) {
      await window.electronAPI.saveSettings(newSettings);
    }
    setShowSettings(false);
    showToast('✓ Settings saved');
    addLog('info', `Settings saved: Provider set to ${newSettings.provider} (${newSettings.model})`);
  }, [addLog]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ── Persona CSS vars ───────────────────────────────────────────────────────
  const personaCssVars = currentPersona
    ? { '--persona-color': currentPersona.color, '--persona-grad': currentPersona.gradient }
    : {};

  return (
    <div className="app-root" style={personaCssVars}>
      <Sidebar
        personas={PERSONAS}
        currentPersonaId={currentPersonaId}
        onPersonaSelect={selectPersona}
        onSettingsOpen={() => setShowSettings(true)}
        onLogsToggle={() => setIsLogsOpen((v) => !v)}
        isLogsOpen={isLogsOpen}
        logCount={logs.length}
      />

      <div className="main-content">
        {currentPersona ? (
          <ChatWindow
            persona={currentPersona}
            messages={currentMessages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            settings={settings}
            onSend={sendMessage}
            onClearChat={clearChat}
            onSettingsChange={(s) => {
              setSettings((prev) => ({ ...prev, ...s }));
              if (s.provider || s.model) {
                addLog('info', `Active model changed to: ${s.provider || settings.provider} (${s.model || settings.model})`);
              }
            }}
            onOpenSettings={() => setShowSettings(true)}
            onLogsToggle={() => setIsLogsOpen((v) => !v)}
            isLogsOpen={isLogsOpen}
            logCount={logs.length}
          />
        ) : (
          <WelcomeScreen personas={PERSONAS} onPersonaSelect={selectPersona} />
        )}

        {/* ── Interactive Logs Drawer ── */}
        <LogsPanel
          logs={logs}
          isOpen={isLogsOpen}
          onToggle={() => setIsLogsOpen((v) => !v)}
          onClear={() => {
            setLogs([]);
            addLog('info', 'Logs console cleared');
          }}
        />
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          providers={PROVIDERS}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
