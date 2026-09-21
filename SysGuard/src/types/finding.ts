import { z } from 'zod';

// ---------------------------------------------------------------------------
// Severity
// ---------------------------------------------------------------------------
export const SeveritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);
export type Severity = z.infer<typeof SeveritySchema>;

// ---------------------------------------------------------------------------
// Finding Status
// ---------------------------------------------------------------------------
export const FindingStatusSchema = z.enum(['PASS', 'WARN', 'FAIL', 'NOT_APPLICABLE']);
export type FindingStatus = z.infer<typeof FindingStatusSchema>;

// ---------------------------------------------------------------------------
// Finding Category
// ---------------------------------------------------------------------------
export const FindingCategorySchema = z.enum([
  'FIREWALL',
  'ENCRYPTION',
  'SYSTEM_INTEGRITY',
  'GATEKEEPER',
  'REMOTE_ACCESS',
  'UPDATES',
  'NETWORK',
  'USERS',
  'PROCESSES',
  'SERVICES',
  'CONFIGURATION',
  'PERMISSIONS',
  // Windows specific
  'ANTIVIRUS',
  'SECURE_BOOT',
  'UAC',
  'HISTORY',
  'SMB',
  'AMSI',
  'CERTIFICATES',
  'AUDIT_POLICY',
  'VULNERABILITY',
  'EXPLOIT',
  'NTLM',
]);
export type FindingCategory = z.infer<typeof FindingCategorySchema>;

// ---------------------------------------------------------------------------
// Finding
// ---------------------------------------------------------------------------
export const FindingSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  title: z.string(),
  severity: SeveritySchema,
  status: FindingStatusSchema,
  category: FindingCategorySchema,
  description: z.string(),
  evidence: z.string().optional(),
  remediation: z.string().optional(),
  platform: z.enum(['darwin', 'win32', 'linux', 'common']),
});

export type Finding = z.infer<typeof FindingSchema>;
