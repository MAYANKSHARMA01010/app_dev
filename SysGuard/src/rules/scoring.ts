import type { Finding } from '../types/finding.js';
import { SEVERITY_DEDUCTIONS } from './severity.js';

const BASE_SCORE = 100;

/**
 * Calculate the SysGuard Risk Score from a list of findings.
 * Starts at 100; deducts points for FAIL findings by severity.
 * PASS, WARN, INFO, and NOT_APPLICABLE findings do not deduct points.
 *
 * Note: This is a proprietary SysGuard score — not an industry-standard metric.
 */
export function calculateScore(findings: Finding[]): number {
  let score = BASE_SCORE;

  for (const finding of findings) {
    if (finding.status === 'FAIL') {
      score -= SEVERITY_DEDUCTIONS[finding.severity];
    }
  }

  return Math.max(0, Math.min(100, score));
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical Risk';
}
