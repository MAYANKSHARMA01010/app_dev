import type { Severity, FindingStatus } from '../types/finding.js';

// ---------------------------------------------------------------------------
// Severity → display color name (used by chalk in reporter)
// ---------------------------------------------------------------------------
export function severityColor(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL': return 'redBright';
    case 'HIGH':     return 'red';
    case 'MEDIUM':   return 'yellow';
    case 'LOW':      return 'cyan';
    case 'INFO':     return 'gray';
  }
}

// ---------------------------------------------------------------------------
// Severity → badge text
// ---------------------------------------------------------------------------
export function severityBadge(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL': return '● CRITICAL';
    case 'HIGH':     return '● HIGH';
    case 'MEDIUM':   return '◆ MEDIUM';
    case 'LOW':      return '◇ LOW';
    case 'INFO':     return '· INFO';
  }
}

// ---------------------------------------------------------------------------
// Status → badge text
// ---------------------------------------------------------------------------
export function statusBadge(status: FindingStatus): string {
  switch (status) {
    case 'PASS':           return '✔ PASS';
    case 'WARN':           return '⚠ WARN';
    case 'FAIL':           return '✖ FAIL';
    case 'NOT_APPLICABLE': return '— N/A';
  }
}

// ---------------------------------------------------------------------------
// Score → display color name
// ---------------------------------------------------------------------------
export function scoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'red';
  return 'redBright';
}

// ---------------------------------------------------------------------------
// Bytes → human-readable
// ---------------------------------------------------------------------------
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

// ---------------------------------------------------------------------------
// Truncate long strings for terminal display
// ---------------------------------------------------------------------------
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}
