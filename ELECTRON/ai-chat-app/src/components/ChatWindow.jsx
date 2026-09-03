import { useRef, useEffect, useState } from 'react';
import { PROVIDERS } from '../data/personas.js';
import MessageBubble from './MessageBubble.jsx';
import InputBar from './InputBar.jsx';

export default function ChatWindow({
  persona,
  messages,
  isStreaming,
  streamingContent,
  settings,
  onSend,
  onClearChat,
  onSettingsChange,
  onOpenSettings,
  onLogsToggle,
  isLogsOpen,
  logCount = 0,
}) {
  const messagesEndRef = useRef(null);
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const menuRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProviderMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentProvider = PROVIDERS.find((p) => p.id === settings.provider) || PROVIDERS[0];

  const handleProviderSelect = (provider) => {
    const firstModel = provider.models[0]?.id;
    onSettingsChange({ provider: provider.id, model: firstModel });
    setShowProviderMenu(false);
  };

  const handleModelChange = (model) => {
    onSettingsChange({ model });
  };

  const currentModels = currentProvider.models;

  return (
    <>
      {/* Header */}
      <header className="chat-header" id="chat-header">
        <div className="chat-header-persona">
          <div
            className="chat-header-avatar"
            style={{ background: persona.gradient }}
            aria-hidden="true"
          >
            {persona.emoji}
          </div>
          <div className="chat-header-info">
            <div className="chat-header-name">{persona.name}</div>
            <div className="chat-header-subtitle">{persona.tagline}</div>
          </div>
          <div className="dot-online" title="Active" style={{ marginLeft: '4px' }} />
        </div>

        <div className="chat-header-actions">
          {/* Model Selector */}
          <select
            className="model-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={settings.model}
            onChange={(e) => handleModelChange(e.target.value)}
            aria-label="Select model"
          >
            {currentModels.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* Provider Menu */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              className="provider-badge"
              onClick={() => setShowProviderMenu((v) => !v)}
              aria-label="Select AI provider"
              aria-expanded={showProviderMenu}
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              {currentProvider.icon} {currentProvider.name} ▾
            </button>
            {showProviderMenu && (
              <div className="provider-dropdown" role="menu">
                {PROVIDERS.map((p) => (
                  <div
                    key={p.id}
                    className={`provider-option ${settings.provider === p.id ? 'active' : ''}`}
                    onClick={() => handleProviderSelect(p)}
                    role="menuitem"
                  >
                    <span>{p.icon}</span>
                    <div>
                      <div className="provider-option-label">{p.name}</div>
                      <div className="provider-option-desc">{p.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logs Toggle Button */}
          <button
            className={`header-btn header-logs-btn ${isLogsOpen ? 'active' : ''}`}
            onClick={onLogsToggle}
            title={isLogsOpen ? 'Close logs console' : 'Open logs console'}
            aria-label="Toggle execution logs"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <span>📋 Logs</span>
            {logCount > 0 && <span className="header-logs-badge">{logCount}</span>}
          </button>

          {/* Clear button */}
          <button
            className="header-btn"
            onClick={onClearChat}
            title="Clear chat"
            aria-label="Clear chat history"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            🗑 Clear
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="messages-area" id="messages-area" aria-label="Chat messages" aria-live="polite">
        {messages.length === 0 && !isStreaming && (
          <ConversationStarter persona={persona} onSend={onSend} />
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} persona={persona} />
        ))}

        {/* Streaming bubble */}
        {isStreaming && (
          <MessageBubble
            message={{ role: 'assistant', content: streamingContent, timestamp: Date.now() }}
            persona={persona}
            isStreaming={!streamingContent}
          />
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <InputBar onSend={onSend} isStreaming={isStreaming} persona={persona} />
    </>
  );
}

function ConversationStarter({ persona, onSend }) {
  const starters = getStarters(persona.id);

  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ fontSize: '56px', lineHeight: 1 }}>{persona.emoji}</div>
      <div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
          Chat with {persona.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-2)', maxWidth: '360px', lineHeight: 1.6 }}>
          {persona.description}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '400px' }}>
        {starters.map((s, i) => (
          <button
            key={i}
            onClick={() => onSend(s)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-2)',
              padding: '10px 14px',
              cursor: 'pointer',
              fontSize: '13px',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
              lineHeight: 1.4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            💬 {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function getStarters(personaId) {
  const map = {
    'john-cena': ["What's your best motivation tip?", "How do you never give up?", "What's it like to be WWE Champion?"],
    'salman-khan': ["Bhai, what's your fitness secret?", "Tell me about Dabangg!", "What does Being Human mean to you?"],
    'einstein': ["Explain relativity simply", "What do you think about quantum mechanics?", "How do thought experiments work?"],
    'sherlock': ["Deduce something about me", "Tell me about your methods", "What's your most interesting case?"],
    'tony-stark': ["How do I build an Iron Man suit?", "What are you working on now?", "Tell me about your arc reactor"],
    'elon': ["How do we get to Mars?", "Explain first principles thinking", "What's next after Starship?"],
    'gordon': ["Rate my cooking skills", "What's the most important cooking technique?", "How do I make perfect scrambled eggs?"],
    'custom': ["Tell me about yourself", "What can you help me with?", "Let's have a conversation!"],
  };
  return map[personaId] || ["Hello! How are you?", "Tell me something interesting", "What can you help me with?"];
}
