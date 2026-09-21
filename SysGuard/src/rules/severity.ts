import type { Severity } from '../types/finding.js';

// ---------------------------------------------------------------------------
// Severity enum and deduction map
// ---------------------------------------------------------------------------

/** Deduction from SysGuard Risk Score per severity level */
export const SEVERITY_DEDUCTIONS: Record<Severity, number> = {
  CRITICAL: 20,
  HIGH: 12,
  MEDIUM: 6,
  LOW: 2,
  INFO: 0,
};

/** Display label for each severity */
export const SEVERITY_LABELS: Record<Severity, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  INFO: 'Info',
};

/** Sort order (lower number = higher severity) */
export const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_ORDER[a] - SEVERITY_ORDER[b];
}
