import { z } from 'zod';
import type { SystemInfo, SecurityInfo } from './system.js';
import type { NetworkInfo } from './network.js';
import type { Finding } from './finding.js';

// ---------------------------------------------------------------------------
// Scan Options
// ---------------------------------------------------------------------------
export const ScanOptionsSchema = z.object({
  modules: z.array(z.enum(['system', 'security', 'network', 'processes'])).default([
    'system',
    'security',
    'network',
  ]),
  format: z.enum(['table', 'json', 'html', 'pdf']).default('table'),
  outputFile: z.string().optional(),
  verbose: z.boolean().default(false),
  crawlExploits: z.boolean().default(true),
  mock: z.boolean().default(false),
});
export type ScanOptions = z.infer<typeof ScanOptionsSchema>;

// ---------------------------------------------------------------------------
// Privilege Info
// ---------------------------------------------------------------------------
export interface PrivilegeInfo {
  isRoot: boolean;
  currentUser: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Scan Summary
// ---------------------------------------------------------------------------
export interface ScanSummary {
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  passed: number;
  warned: number;
  failed: number;
  notApplicable: number;
  score: number;
}

// ---------------------------------------------------------------------------
// Scan Result
// ---------------------------------------------------------------------------
export interface ScanResult {
  id: string;
  startedAt: string;       // ISO 8601
  completedAt: string;     // ISO 8601
  durationMs: number;
  platform: 'darwin' | 'win32' | 'linux';
  isMock?: boolean;
  hostname: string;
  architecture: string;
  privilege: PrivilegeInfo;
  system: SystemInfo | null;
  security: SecurityInfo | null;
  network: NetworkInfo | null;
  findings: Finding[];
  summary: ScanSummary;
  score: number;
  vulnerabilities?: unknown;
}
