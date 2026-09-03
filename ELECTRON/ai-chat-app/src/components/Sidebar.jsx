export default function Sidebar({
  personas,
  currentPersonaId,
  onPersonaSelect,
  onSettingsOpen,
  onLogsToggle,
  isLogsOpen,
  logCount = 0,
}) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🤖</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">NexusChat</span>
          <span className="sidebar-logo-tagline">AI Personas</span>
        </div>
      </div>

      {/* Persona List */}
      <div className="sidebar-section-label">Personas</div>
      <nav className="persona-list" aria-label="Persona list">
        {personas.map((persona) => (
          <div
            key={persona.id}
            className={`persona-item ${currentPersonaId === persona.id ? 'active' : ''}`}
            onClick={() => onPersonaSelect(persona.id)}
            role="button"
            tabIndex={0}
            aria-label={`Chat with ${persona.name}`}
            style={{ '--persona-color': persona.color, '--persona-grad': persona.gradient }}
            onKeyDown={(e) => e.key === 'Enter' && onPersonaSelect(persona.id)}
          >
            <div
              className="persona-avatar"
              style={{ background: persona.gradient }}
              aria-hidden="true"
            >
              {persona.emoji}
            </div>
            <div className="persona-item-info">
              <div className="persona-item-name">{persona.name}</div>
              <div className="persona-item-tagline">{persona.tagline}</div>
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Activity Logs Button */}
        <button
          className={`sidebar-footer-btn ${isLogsOpen ? 'active' : ''}`}
          onClick={onLogsToggle}
          aria-label="Toggle activity logs"
          style={{
            background: isLogsOpen ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
            borderColor: isLogsOpen ? 'rgba(124, 58, 237, 0.4)' : 'transparent',
            color: isLogsOpen ? '#fff' : 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="sidebar-footer-btn-icon">📋</span>
            Logs & Diagnostics
          </span>
          {logCount > 0 && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-2)',
            }}>
              {logCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          className="sidebar-footer-btn"
          onClick={onSettingsOpen}
          aria-label="Open settings"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="sidebar-footer-btn-icon">⚙️</span>
            Settings & API Keys
          </span>
        </button>
      </div>
    </aside>
  );
}
