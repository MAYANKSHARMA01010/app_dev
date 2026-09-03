import { useState, useRef, useCallback } from 'react';

export default function InputBar({ onSend, isStreaming, persona }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isStreaming, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setValue(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  return (
    <div className="input-bar" id="input-bar">
      <div className="input-container">
        <textarea
          ref={textareaRef}
          id="message-input"
          className="message-input"
          placeholder={isStreaming ? `${persona.name} is typing...` : `Message ${persona.name}...`}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isStreaming}
          aria-label="Message input"
          aria-disabled={isStreaming}
        />
        <button
          id="send-btn"
          className="send-btn"
          onClick={handleSend}
          disabled={!value.trim() || isStreaming}
          aria-label="Send message"
          title="Send (Enter)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <div className="input-hint">
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  );
}
