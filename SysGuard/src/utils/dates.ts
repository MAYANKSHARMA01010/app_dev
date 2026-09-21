// ---------------------------------------------------------------------------
// Duration formatting
// ---------------------------------------------------------------------------

/**
 * Format a duration in milliseconds to a human-readable string.
 * Examples: "450ms", "2.3s", "1m 05s"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

/**
 * Format an ISO date string to a readable local time.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

/**
 * Format uptime in seconds to days/hours/minutes.
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${Math.floor(seconds)}s`);
  return parts.join(' ');
}
