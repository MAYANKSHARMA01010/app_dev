export default function WelcomeScreen({ personas, onPersonaSelect }) {
  return (
    <div className="welcome-screen" id="welcome-screen">
      {/* Hero */}
      <div className="welcome-hero">
        <div className="welcome-logo" aria-hidden="true">🤖</div>
        <h1 className="welcome-title">Welcome to NexusChat</h1>
        <p className="welcome-subtitle">
          Chat with <span>iconic personalities</span> powered by AI.{' '}
          Pick a persona below to start your conversation.
        </p>
      </div>

      {/* Persona Grid */}
      <div
        className="welcome-personas"
        role="list"
        aria-label="Available personas"
      >
        {personas.map((persona) => (
          <div
            key={persona.id}
            className="welcome-persona-card"
            style={{
              '--card-color': persona.color,
              '--card-grad': persona.gradient,
            }}
            onClick={() => onPersonaSelect(persona.id)}
            role="listitem"
            tabIndex={0}
            aria-label={`Chat with ${persona.name} — ${persona.tagline}`}
            onKeyDown={(e) => e.key === 'Enter' && onPersonaSelect(persona.id)}
          >
            <span className="welcome-persona-emoji">{persona.emoji}</span>
            <div className="welcome-persona-name">{persona.name}</div>
            <div className="welcome-persona-desc">{persona.tagline}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="welcome-cta">
        <span>🎮</span>
        <span>Demo mode is active — no API key required to start!</span>
      </div>
    </div>
  );
}
