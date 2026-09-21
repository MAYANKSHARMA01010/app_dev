import type { ScanResult } from '../types/scan.js';

/**
 * Generate a clean JSON report from a ScanResult.
 * Does NOT include raw command output — only normalized findings.
 * The rawStatus/rawValues fields from security objects are stripped.
 */
export function generateJsonReport(result: ScanResult): string {
  const sanitized = sanitizeScanResult(result);
  return JSON.stringify(sanitized, null, 2);
}

function sanitizeScanResult(result: ScanResult): unknown {
  const r = { ...result };

  // Strip internal raw fields from security
  if (r.security) {
    const s = { ...r.security };
    if (s.secureBoot) {
      s.secureBoot = { ...s.secureBoot, rawStatus: undefined };
    }
    if (s.uac) {
      s.uac = { ...s.uac, rawValues: undefined };
    }
    r.security = s;
  }

  return r;
}
