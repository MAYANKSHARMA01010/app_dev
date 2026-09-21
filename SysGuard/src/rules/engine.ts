import type { Finding, FindingStatus, Severity, FindingCategory } from '../types/finding.js';
import type { SecurityInfo, SystemInfo } from '../types/system.js';
import type { NetworkInfo } from '../types/network.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Rule interface
// ---------------------------------------------------------------------------

export interface RuleContext {
  security: SecurityInfo | null;
  system: SystemInfo | null;
  network: NetworkInfo | null;
  platform: 'darwin' | 'win32' | 'linux';
}

export interface Rule {
  id: string;
  title: string;
  category: FindingCategory;
  severity: Severity;
  platforms: Array<'darwin' | 'win32' | 'linux'>;
  evaluate(ctx: RuleContext): RuleResult;
}

export interface RuleResult {
  status: FindingStatus;
  description: string;
  evidence?: string;
  remediation?: string;
}

// ---------------------------------------------------------------------------
// Rule Engine
// ---------------------------------------------------------------------------

export class RuleEngine {
  private rules: Rule[] = [];

  register(rule: Rule): void {
    this.rules.push(rule);
  }

  registerAll(rules: Rule[]): void {
    for (const rule of rules) {
      this.register(rule);
    }
  }

  evaluate(ctx: RuleContext): Finding[] {
    const findings: Finding[] = [];

    for (const rule of this.rules) {
      // Skip rules not applicable to this platform
      if (!rule.platforms.includes(ctx.platform)) {
        findings.push(makeFinding(rule, {
          status: 'NOT_APPLICABLE',
          description: `This check is not applicable on ${ctx.platform}.`,
        }, ctx.platform));
        continue;
      }

      try {
        const result = rule.evaluate(ctx);
        findings.push(makeFinding(rule, result, ctx.platform));
      } catch (err) {
        logger.warn(`Rule "${rule.id}" threw an error: ${String(err)}`);
        findings.push(makeFinding(rule, {
          status: 'NOT_APPLICABLE',
          description: `Rule evaluation failed unexpectedly: ${String(err)}`,
        }, ctx.platform));
      }
    }

    return findings;
  }
}

function makeFinding(
  rule: Rule,
  result: RuleResult,
  platform: 'darwin' | 'win32' | 'linux'
): Finding {
  return {
    id: randomUUID(),
    ruleId: rule.id,
    title: rule.title,
    severity: rule.severity,
    status: result.status,
    category: rule.category,
    description: result.description,
    evidence: result.evidence,
    remediation: result.remediation,
    platform,
  };
}
