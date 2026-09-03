import { useState } from 'react';

const FREE_BADGE = (
  <span style={{
    background: 'rgba(16,185,129,0.15)',
    color: '#10b981',
    fontSize: '10px',
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: '10px',
    marginLeft: '6px',
    border: '1px solid rgba(16,185,129,0.3)',
  }}>FREE</span>
);

export default function SettingsModal({ settings, providers, onSave, onClose }) {
  const [local, setLocal] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState('provider');

  const update = (key, val) => setLocal((prev) => ({ ...prev, [key]: val }));

  const currentProvider = providers.find((p) => p.id === local.provider) || providers[0];

  const handleProviderChange = (pid) => {
    const p = providers.find((pr) => pr.id === pid);
    update('provider', pid);
    if (p?.models?.[0]) update('model', p.models[0].id);
  };

  const tabs = [
    { id: 'provider', label: '🤖 Provider' },
    { id: 'keys',     label: '🔑 API Keys' },
    { id: 'fallback', label: '⚡ Fallback' },
    { id: 'ollama',   label: '🏠 Ollama' },
  ];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ width: '600px' }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">⚙️ Settings</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        {/* Tab Bar */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '12px 24px 0',
          borderBottom: '1px solid var(--border)',
        }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '7px 14px',
                border: 'none',
                background: 'none',
                color: activeTab === t.id ? 'var(--text)' : 'var(--text-3)',
                fontSize: '12px',
                fontWeight: activeTab === t.id ? 600 : 400,
                cursor: 'pointer',
                borderBottom: activeTab === t.id ? '2px solid var(--purple)' : '2px solid transparent',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* ── Tab: Provider ─────────────────────────────────────── */}
          {activeTab === 'provider' && (
            <>
              <div className="settings-section">
                <div className="settings-section-title">Select AI Provider</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {providers.map((p) => (
                    <label
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${local.provider === p.id ? 'var(--purple)' : 'var(--border)'}`,
                        background: local.provider === p.id ? 'rgba(124,58,237,0.08)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name="provider"
                        value={p.id}
                        checked={local.provider === p.id}
                        onChange={() => handleProviderChange(p.id)}
                        style={{ accentColor: 'var(--purple)' }}
                      />
                      <span style={{ fontSize: '18px' }}>{p.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                          {p.name}
                          {p.free && FREE_BADGE}
                          {!p.requiresKey && (
                            <span style={{ fontSize: '10px', color: 'var(--green)', marginLeft: '6px' }}>
                              ✓ No key needed
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '1px' }}>
                          {p.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Model selector */}
              <div className="settings-section">
                <div className="settings-section-title">Model</div>
                <div className="settings-row">
                  <select
                    className="model-select"
                    value={local.model}
                    onChange={(e) => update('model', e.target.value)}
                  >
                    {currentProvider.models.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ── Tab: API Keys ──────────────────────────────────────── */}
          {activeTab === 'keys' && (
            <>
              <div style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '12px',
                color: 'var(--text-2)',
                marginBottom: '4px',
              }}>
                🆓 <strong style={{ color: 'var(--green)' }}>Free providers:</strong> Groq, Mistral, Gemini & Ollama offer free tiers — no credit card needed!
              </div>

              {/* Free providers first */}
              <div className="settings-section">
                <div className="settings-section-title">⚡ Free Providers</div>

                <KeyField
                  id="groq-key" label="⚡ Groq API Key" icon="⚡"
                  placeholder="gsk_..." badge="FREE"
                  value={local.groq_api_key || ''}
                  onChange={(v) => update('groq_api_key', v)}
                  link="console.groq.com"
                />
                <KeyField
                  id="mistral-key" label="🌀 Mistral API Key"
                  placeholder="API key..." badge="FREE"
                  value={local.mistral_api_key || ''}
                  onChange={(v) => update('mistral_api_key', v)}
                  link="console.mistral.ai"
                />
                <KeyField
                  id="together-key" label="🤝 Together AI Key"
                  placeholder="API key..." badge="$1 FREE"
                  value={local.together_api_key || ''}
                  onChange={(v) => update('together_api_key', v)}
                  link="api.together.xyz"
                />
                <KeyField
                  id="gemini-key" label="✨ Google Gemini Key"
                  placeholder="AIza..." badge="FREE TIER"
                  value={local.gemini_api_key || ''}
                  onChange={(v) => update('gemini_api_key', v)}
                  link="aistudio.google.com"
                />
              </div>

              {/* Paid providers */}
              <div className="settings-section">
                <div className="settings-section-title">💳 Paid Providers</div>
                <KeyField
                  id="openai-key" label="🤖 OpenAI API Key"
                  placeholder="sk-..."
                  value={local.openai_api_key || ''}
                  onChange={(v) => update('openai_api_key', v)}
                  link="platform.openai.com"
                />
                <KeyField
                  id="anthropic-key" label="🧠 Anthropic API Key"
                  placeholder="sk-ant-..."
                  value={local.anthropic_api_key || ''}
                  onChange={(v) => update('anthropic_api_key', v)}
                  link="console.anthropic.com"
                />
              </div>
            </>
          )}

          {/* ── Tab: Fallback ──────────────────────────────────────── */}
          {activeTab === 'fallback' && (
            <>
              <div className="settings-section">
                <div className="settings-section-title">Automatic Fallback</div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={local.fallback_enabled ?? true}
                    onChange={(e) => update('fallback_enabled', e.target.checked)}
                    style={{ accentColor: 'var(--purple)', marginTop: '2px', width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      Enable automatic fallback
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '3px', lineHeight: 1.5 }}>
                      If the primary provider fails or hits a rate limit, NexusChat automatically retries with the next available provider. A toast notification will appear when switching.
                    </div>
                  </div>
                </label>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">How Fallback Works</div>
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                  fontSize: '12px',
                  color: 'var(--text-2)',
                  lineHeight: 1.7,
                }}>
                  <div style={{ marginBottom: '10px', color: 'var(--text)', fontWeight: 600 }}>
                    Auto-detection order (based on your saved API keys):
                  </div>
                  {['groq', 'gemini', 'mistral', 'together', 'openai', 'anthropic', 'mock'].map((p, i) => {
                    const provider = [
                      { id: 'groq', name: 'Groq ⚡', icon: '⚡' },
                      { id: 'gemini', name: 'Gemini ✨', icon: '✨' },
                      { id: 'mistral', name: 'Mistral 🌀', icon: '🌀' },
                      { id: 'together', name: 'Together AI 🤝', icon: '🤝' },
                      { id: 'openai', name: 'OpenAI 🤖', icon: '🤖' },
                      { id: 'anthropic', name: 'Anthropic 🧠', icon: '🧠' },
                      { id: 'mock', name: 'Demo Mode 🎮', icon: '🎮' },
                    ].find(x => x.id === p);
                    const hasKey = p === 'mock' || local[`${p}_api_key`];
                    return (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ color: hasKey ? 'var(--green)' : 'var(--text-3)', fontSize: '11px' }}>
                          {i + 1}.
                        </span>
                        <span style={{ color: hasKey ? 'var(--text)' : 'var(--text-3)' }}>
                          {provider?.name}
                        </span>
                        {hasKey && <span style={{ color: 'var(--green)', fontSize: '10px' }}>✓ Available</span>}
                        {!hasKey && p !== 'mock' && <span style={{ color: 'var(--text-3)', fontSize: '10px' }}>× No key</span>}
                      </div>
                    );
                  })}
                  <div style={{ marginTop: '10px', color: 'var(--text-3)', fontSize: '11px' }}>
                    Providers without API keys are skipped. Demo Mode is always the last resort.
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">Rate Limit Behavior</div>
                <div style={{
                  background: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: 'var(--text-2)',
                  lineHeight: 1.6,
                }}>
                  <strong style={{ color: 'var(--blue)' }}>Exponential backoff:</strong> On rate limits (429), NexusChat waits 1s → 2s → 4s → 8s before trying the next provider. No hammering the API.
                </div>
              </div>
            </>
          )}

          {/* ── Tab: Ollama ────────────────────────────────────────── */}
          {activeTab === 'ollama' && (
            <div className="settings-section">
              <div className="settings-section-title">🏠 Ollama Local AI</div>
              <div className="settings-row">
                <label className="settings-label" htmlFor="ollama-url">Server URL</label>
                <input
                  id="ollama-url"
                  type="text"
                  className="settings-input"
                  placeholder="http://localhost:11434"
                  value={local.ollama_url || ''}
                  onChange={(e) => update('ollama_url', e.target.value)}
                />
                <div className="settings-hint">
                  Install Ollama from <span style={{ color: 'var(--blue)' }}>ollama.ai</span> to run AI completely locally.
                </div>
              </div>
              <div style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                fontSize: '12px',
                color: 'var(--text-2)',
                lineHeight: 1.5,
              }}>
                <strong style={{ color: 'var(--green)' }}>100% Free & Private:</strong> Ollama runs models locally on your machine — no data leaves, no API costs, works offline.
                <br /><br />
                Popular models: <code style={{ fontSize: '11px' }}>ollama pull llama3.2</code> · <code style={{ fontSize: '11px' }}>ollama pull deepseek-r1</code> · <code style={{ fontSize: '11px' }}>ollama pull mistral</code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(local)} id="save-settings-btn">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reusable Key Input ──────────────────────────────────────────────────────
function KeyField({ id, label, placeholder, badge, value, onChange, link }) {
  const [show, setShow] = useState(false);
  const hasValue = !!value;

  return (
    <div className="settings-row" style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
        <label className="settings-label" htmlFor={id} style={{ margin: 0 }}>{label}</label>
        {badge && (
          <span style={{
            background: 'rgba(16,185,129,0.15)',
            color: '#10b981',
            fontSize: '9px',
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: '8px',
            border: '1px solid rgba(16,185,129,0.3)',
          }}>{badge}</span>
        )}
        {hasValue && <span style={{ color: 'var(--green)', fontSize: '11px' }}>✓ Set</span>}
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: '6px' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="settings-input"
          style={{ flex: 1, fontFamily: hasValue ? 'monospace' : 'inherit' }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          onClick={() => setShow((s) => !s)}
          style={{
            padding: '0 10px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-2)',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'inherit',
          }}
          title={show ? 'Hide' : 'Show'}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>
      {link && (
        <div className="settings-hint">
          Get your key at <span style={{ color: 'var(--blue)' }}>{link}</span>
        </div>
      )}
    </div>
  );
}
