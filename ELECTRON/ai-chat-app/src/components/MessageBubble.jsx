import { useState, useCallback } from 'react';

// Simple inline markdown renderer
function renderMarkdown(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeLines = [];
  let codeLang = '';

  const processInline = (str, key) => {
    // Bold, italic, code inline
    const parts = [];
    let remaining = str;
    let i = 0;
    let result = '';

    // Simple regex-based inline parsing
    const inlineRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = inlineRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index));
      }
      if (match[1]) {
        parts.push(<strong key={`b-${match.index}`}>{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={`i-${match.index}`}>{match[4]}</em>);
      } else if (match[5]) {
        parts.push(<code key={`c-${match.index}`}>{match[6]}</code>);
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex));
    }

    return parts.length > 0 ? parts : str;
  };

  lines.forEach((line, idx) => {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
        codeLines = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <pre key={`pre-${idx}`}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
        codeLang = '';
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={idx} style={{ fontSize: '14px', fontWeight: 700, margin: '8px 0 4px', color: 'var(--text)' }}>{processInline(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={idx} style={{ fontSize: '15px', fontWeight: 700, margin: '10px 0 4px', color: 'var(--text)' }}>{processInline(line.slice(3))}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={idx} style={{ fontSize: '17px', fontWeight: 800, margin: '12px 0 6px', color: 'var(--text)' }}>{processInline(line.slice(2))}</h1>);
    } else if (line.match(/^[\-\*] /)) {
      elements.push(<li key={idx} style={{ marginLeft: '16px', marginBottom: '2px' }}>{processInline(line.slice(2))}</li>);
    } else if (line.match(/^\d+\. /)) {
      elements.push(<li key={idx} style={{ marginLeft: '16px', marginBottom: '2px' }}>{processInline(line.replace(/^\d+\. /, ''))}</li>);
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={idx}>{processInline(line.slice(2))}</blockquote>);
    } else if (line.trim() === '') {
      elements.push(<br key={idx} />);
    } else {
      elements.push(<p key={idx}>{processInline(line)}</p>);
    }
  });

  return elements;
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, persona, isStreaming }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [message.content]);

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`} role="article" aria-label={`${isUser ? 'You' : persona.name} said`}>
      {/* Avatar */}
      {isUser ? (
        <div className="message-avatar user-avatar" aria-hidden="true">Y</div>
      ) : (
        <div
          className="message-avatar"
          style={{ background: persona.gradient }}
          aria-hidden="true"
        >
          {persona.emoji}
        </div>
      )}

      {/* Bubble */}
      <div className="message-bubble">
        <div className={`message-content ${message.isError ? 'error-msg' : ''}`}>
          {/* Show typing dots when streaming with no content yet */}
          {isStreaming && !message.content ? (
            <div className="typing-indicator" aria-label="AI is typing">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          ) : (
            renderMarkdown(message.content)
          )}
        </div>

        <div className="message-meta">
          <span className="message-time">{formatTime(message.timestamp)}</span>
          {!isUser && !isStreaming && message.content && (
            <button
              className="message-copy-btn"
              onClick={handleCopy}
              title="Copy message"
              aria-label="Copy message to clipboard"
            >
              {copied ? '✓ Copied' : '⎘ Copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
