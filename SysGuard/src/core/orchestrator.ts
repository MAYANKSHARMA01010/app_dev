import { randomUUID } from 'node:crypto';

// Native collectors
import { collectSystemRaw } from '../collectors/system.js';
import { collectSecurityRaw } from '../collectors/security.js';
import { collectNetworkRaw } from '../collectors/network.js';

// Parsers
import { parseSystemInfo } from '../parsers/system.parser.js';
import { parseSecurity } from '../parsers/security.parser.js';
import { parseNetwork } from '../parsers/network.parser.js';

// Defensive security rules
import { securityRules } from '../rules/security.rules.js';

// Network Topology
import { formulateNetworkTopology } from './topology.js';

// Defensive Rule Engine & Posture Scoring
import { RuleEngine } from '../rules/engine.js';
import { calculateScore } from '../rules/scoring.js';
import { getPrivilegeInfo } from './permissions.js';
import { getHostname, getArch, getPlatform, collectBasicSystemInfo } from './os-detector.js';
import { logger } from '../utils/logger.js';
import type { ScanResult, ScanOptions, ScanSummary } from '../types/scan.js';
import type { SystemInfo, SecurityInfo } from '../types/system.js';
import type { NetworkInfo } from '../types/network.js';
import type { Finding } from '../types/finding.js';

export type ProgressCallback = (step: string, current: number, total: number) => void;

export class Orchestrator {
  private onProgress?: ProgressCallback;

  constructor(onProgress?: ProgressCallback) {
    this.onProgress = onProgress;
  }

  private progress(step: string, current: number, total: number): void {
    this.onProgress?.(step, current, total);
  }

  async run(options: ScanOptions): Promise<ScanResult> {
    const startedAt = new Date().toISOString();
    const startMs = Date.now();
    const platform = getPlatform();
    const TOTAL_STEPS = 4;
    let step = 0;

    logger.info('SysGuard executing security posture & network audit…');

    // 1. Collect system info
    this.progress('Auditing system hardware & OS build…', ++step, TOTAL_STEPS);
    const system = await this.collectSystem();

    // 2. Audit security controls & policies
    this.progress('Auditing SIP, FileVault & Firewall controls…', ++step, TOTAL_STEPS);
    const security = options.modules.includes('security')
      ? await this.collectSecurity()
      : null;

    // 3. Map network exposure & formulate topology
    this.progress('Scanning listening sockets & active connections…', ++step, TOTAL_STEPS);
    const network = options.modules.includes('network')
      ? await this.collectNetwork()
      : null;

    // 4. Evaluate defensive security rules & score
    this.progress('Evaluating defensive security rules & scoring posture…', ++step, TOTAL_STEPS);
    const findings = this.evaluateRules(platform, system, security, network);
    const score = calculateScore(findings);
    const summary = buildSummary(findings, score);

    const completedAt = new Date().toISOString();
    const privilege = getPrivilegeInfo();

    return {
      id: randomUUID(),
      startedAt,
      completedAt,
      durationMs: Date.now() - startMs,
      platform,
      isMock: false,
      hostname: getHostname(),
      architecture: getArch(),
      privilege,
      system,
      security,
      network,
      findings,
      summary,
      score,
    };
  }

  // -------------------------------------------------------------------------
  // System collection
  // -------------------------------------------------------------------------
  private async collectSystem(): Promise<SystemInfo | null> {
    try {
      const basic = collectBasicSystemInfo();
      const privilege = getPrivilegeInfo();
      const rawSys = await collectSystemRaw();

      if (rawSys.data) {
        return parseSystemInfo(rawSys.data, privilege.currentUser, privilege.isRoot);
      }

      return {
        hostname: basic.hostname,
        os: { platform: 'darwin', architecture: basic.architecture },
        hardware: { cpu: basic.cpuModel, memoryBytes: basic.memoryBytes },
        uptimeSeconds: basic.uptimeSeconds,
        currentUser: privilege.currentUser,
        isRoot: privilege.isRoot,
      };
    } catch (err) {
      logger.error('System collection failed', err);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Security collection
  // -------------------------------------------------------------------------
  private async collectSecurity(): Promise<SecurityInfo | null> {
    try {
      const rawSec = await collectSecurityRaw();
      return rawSec.data ? parseSecurity(rawSec.data) : null;
    } catch (err) {
      logger.error('Security collection failed', err);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Network collection & Topology
  // -------------------------------------------------------------------------
  private async collectNetwork(): Promise<NetworkInfo | null> {
    try {
      const rawNet = await collectNetworkRaw();
      if (!rawNet.data) return null;
      const networkInfo = parseNetwork(rawNet.data);
      const hostname = getHostname();
      networkInfo.topology = formulateNetworkTopology(hostname, networkInfo);
      return networkInfo;
    } catch (err) {
      logger.error('Network collection failed', err);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Rule evaluation
  // -------------------------------------------------------------------------
  private evaluateRules(
    platform: 'darwin' | 'win32' | 'linux',
    system: SystemInfo | null,
    security: SecurityInfo | null,
    network: NetworkInfo | null
  ): Finding[] {
    const engine = new RuleEngine();
    engine.registerAll(securityRules);
    return engine.evaluate({ security, system, network, platform });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildSummary(findings: Finding[], score: number): ScanSummary {
  const summary: ScanSummary = {
    totalFindings: findings.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    passed: 0,
    warned: 0,
    failed: 0,
    notApplicable: 0,
    score,
  };

  for (const f of findings) {
    if (f.status === 'PASS') summary.passed++;
    else if (f.status === 'WARN') summary.warned++;
    else if (f.status === 'FAIL') summary.failed++;
    else if (f.status === 'NOT_APPLICABLE') summary.notApplicable++;

    const sev = f.severity.toLowerCase() as keyof Omit<ScanSummary, 'totalFindings' | 'score' | 'passed' | 'warned' | 'failed' | 'notApplicable'>;
    if (sev in summary) (summary[sev] as number)++;
  }

  return summary;
}
