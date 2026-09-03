import { useState, useRef, useEffect, useMemo } from 'react';

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

const LEVEL_CONFIG = {
  info:     { label: 'INFO',     color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)',  border: 'rgba(96, 165, 250, 0.25)' },
  context:  { label: 'CONTEXT',  color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.25)' },
  stream:   { label: 'STREAM',   color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)',  border: 'rgba(52, 211, 153, 0.25)' },
  warn:     { label: 'WARN',     color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)',  border: 'rgba(251, 191, 36, 0.25)' },
  fallback: { label: 'FALLBACK', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)',  border: 'rgba(251, 146, 60, 0.35)' },
  error:    { label: 'ERROR',    color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.35)' },
  success:  { label: 'SUCCESS',  color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)',  border: 'rgba(74, 222, 128, 0.35)' },
};

export default function LogsPanel({ logs = [], isOpen, onToggle, onClear }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isTall, setIsTall] = useState(false);
  const [copied, setCopied] = useState(false);
  const listEndRef = useRef(null);

  // Auto-scroll to latest log entry
  useEffect(() => {
    if (isOpen && autoScroll) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen, autoScroll, filter, search]);

  // Counts for tabs
  const counts = useMemo(() => {
    let fallback = 0, context = 0, stream = 0, issues = 0;
    logs.forEach((l) => {
      if (l.level === 'fallback') fallback++;
      if (l.level === 'context') context++;
      if (l.level === 'stream' || l.level === 'success') stream++;
      if (l.level === 'warn' || l.level === 'error') issues++;
    });
    return { all: logs.length, fallback, context, stream, issues };
  }, [logs]);

  // Filtered log list
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      // Level filter
      if (filter === 'fallback' && l.level !== 'fallback') return false;
      if (filter === 'context'  && l.level !== 'context') return false;
      if (filter === 'stream'   && l.level !== 'stream' && l.level !== 'success') return false;
      if (filter === 'issues'   && l.level !== 'warn' && l.level !== 'error') return false;

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesMsg = l.message?.toLowerCase().includes(q);
        const matchesMeta = l.meta ? JSON.stringify(l.meta).toLowerCase().includes(q) : false;
        const matchesLevel = l.level?.toLowerCase().includes(q);
        return matchesMsg || matchesMeta || matchesLevel;
      }
      return true;
    });
  }, [logs, filter, search]);

  const handleCopyLogs = async () => {
    try {
      const text = filteredLogs.map((l) => {
        const metaStr = l.meta && Object.keys(l.meta).length > 0 ? ` ${JSON.stringify(l.meta)}` : '';
        return `[${formatTimestamp(l.timestamp)}] [${(l.level || 'info').toUpperCase()}] ${l.message}${metaStr}`;
      }).join('\n');

      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const latestLog = logs[logs.length - 1];

  return (
    <div className={`logs-drawer ${isOpen ? 'open' : 'closed'} ${isTall ? 'tall' : ''}`} id="logs-drawer">
      {/* ── Collapsed Minimal Bar ── */}
      {!isOpen && (
        <div className="logs-minibar" onClick={onToggle} role="button" tabIndex={0}>
          <div className="logs-minibar-left">
            <span className="logs-minibar-badge">📋 Logs ({logs.length})</span>
            {latestLog ? (
              <span className="logs-minibar-preview">
                <span className={`logs-dot dot-${latestLog.level || 'info'}`} />
                <span className="logs-minibar-time">{formatTimestamp(latestLog.timestamp)}</span>
                <span className="logs-minibar-text">{latestLog.message}</span>
              </span>
            ) : (
              <span className="logs-minibar-idle">System ready • No activity logs yet</span>
            )}
          </div>
          <button className="logs-minibar-btn" aria-label="Open Logs">
            ▲ Open Logs
          </button>
        </div>
      )}

      {/* ── Expanded Console ── */}
      {isOpen && (
        <div className="logs-panel-content">
          {/* Header */}
          <div className="logs-header">
            <div className="logs-title-group">
              <span className="logs-title-icon">📋</span>
              <span className="logs-title-text">Execution & LLM Logs</span>
              <span className="logs-counter-pill">{filteredLogs.length} / {logs.length}</span>
            </div>

            {/* Filter Tabs */}
            <div className="logs-filter-tabs">
              <button
                className={`logs-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({counts.all})
              </button>
              <button
                className={`logs-tab ${filter === 'fallback' ? 'active' : ''}`}
                onClick={() => setFilter('fallback')}
                title="Fallback events between providers"
              >
                ⚡ Fallbacks ({counts.fallback})
              </button>
              <button
                className={`logs-tab ${filter === 'context' ? 'active' : ''}`}
                onClick={() => setFilter('context')}
                title="Token budget & context trimming"
              >
                ✂️ Context ({counts.context})
              </button>
              <button
                className={`logs-tab ${filter === 'stream' ? 'active' : ''}`}
                onClick={() => setFilter('stream')}
                title="Streaming & performance metrics"
              >
                🌊 Stream ({counts.stream})
              </button>
              <button
                className={`logs-tab ${filter === 'issues' ? 'active' : ''}`}
                onClick={() => setFilter('issues')}
                title="Rate limits, warnings & errors"
              >
                ⚠️ Issues ({counts.issues})
              </button>
            </div>

            {/* Controls */}
            <div className="logs-actions">
              {/* Search box */}
              <input
                type="text"
                className="logs-search-input"
                placeholder="Filter logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                spellCheck={false}
              />

              {/* Auto scroll toggle */}
              <label className="logs-autoscroll-toggle" title="Auto-scroll to latest log">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
                <span>Auto-scroll</span>
              </label>

              {/* Copy */}
              <button
                className="logs-action-btn"
                onClick={handleCopyLogs}
                title="Copy displayed logs to clipboard"
              >
                {copied ? '✓ Copied' : '⎘ Copy'}
              </button>

              {/* Clear */}
              <button
                className="logs-action-btn"
                onClick={onClear}
                title="Clear logs"
              >
                🗑 Clear
              </button>

              {/* Expand / Collapse Height */}
              <button
                className="logs-action-btn"
                onClick={() => setIsTall((t) => !t)}
                title={isTall ? 'Compact View' : 'Tall View'}
              >
                {isTall ? '⤓ Compact' : '⤒ Tall'}
              </button>

              {/* Close / Minimize */}
              <button
                className="logs-action-btn close-btn"
                onClick={onToggle}
                title="Close logs panel"
              >
                ▼ Close
              </button>
            </div>
          </div>

          {/* Log Stream Output */}
          <div className="logs-viewport" role="region" aria-label="Logs console output">
            {filteredLogs.length === 0 ? (
              <div className="logs-empty">
                {search || filter !== 'all' ? (
                  <span>No logs match current filter criteria</span>
                ) : (
                  <span>No logs recorded yet. Send a message to see the fallback chain and context logs live!</span>
                )}
              </div>
            ) : (
              filteredLogs.map((log) => {
                const conf = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info;
                const hasMeta = log.meta && Object.keys(log.meta).length > 0;

                return (
                  <div key={log.id} className={`log-row level-${log.level || 'info'}`}>
                    <span className="log-time">{formatTimestamp(log.timestamp)}</span>
                    <span
                      className="log-badge"
                      style={{
                        color: conf.color,
                        background: conf.bg,
                        borderColor: conf.border,
                      }}
                    >
                      {conf.label}
                    </span>

                    {log.meta?.provider && (
                      <span className="log-provider-tag">
                        [{log.meta.provider}{log.meta.model ? `:${log.meta.model}` : ''}]
                      </span>
                    )}

                    <span className="log-msg">{log.message}</span>

                    {hasMeta && (
                      <span className="log-meta-tag" title={JSON.stringify(log.meta, null, 2)}>
                        {log.meta.ttftMs ? `TTFT: ${log.meta.ttftMs}ms` : ''}
                        {log.meta.tokensPerSec ? ` · ${log.meta.tokensPerSec} t/s` : ''}
                        {log.meta.trimmedCount ? ` · -${log.meta.trimmedCount} msgs` : ''}
                        {log.meta.backoffMs ? ` · backoff ${log.meta.backoffMs}ms` : ''}
                      </span>
                    )}
                  </div>
                );
              })
            )}
            <div ref={listEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
