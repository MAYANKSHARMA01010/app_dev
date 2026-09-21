import chalk from 'chalk';
import Table from 'cli-table3';
import type { ScanResult } from '../types/scan.js';
import type { Severity, FindingStatus } from '../types/finding.js';
import { formatDuration, formatDate, formatUptime } from '../utils/dates.js';
import { formatBytes, truncate, statusBadge, scoreColor } from '../utils/format.js';
import { scoreLabel } from '../rules/scoring.js';
import { compareSeverity } from '../rules/severity.js';

// ---------------------------------------------------------------------------
// Severity color helpers
// ---------------------------------------------------------------------------
function colorSeverity(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL': return chalk.bgRed.white.bold(` ${severity} `);
    case 'HIGH':     return chalk.red.bold(severity);
    case 'MEDIUM':   return chalk.yellow.bold(severity);
    case 'LOW':      return chalk.cyan(severity);
    case 'INFO':     return chalk.gray(severity);
  }
}

function colorStatus(status: FindingStatus): string {
  switch (status) {
    case 'PASS':           return chalk.green(statusBadge(status));
    case 'WARN':           return chalk.yellow(statusBadge(status));
    case 'FAIL':           return chalk.red.bold(statusBadge(status));
    case 'NOT_APPLICABLE': return chalk.gray(statusBadge(status));
  }
}

// ---------------------------------------------------------------------------
// Terminal Reporter
// ---------------------------------------------------------------------------
export function renderTerminalReport(result: ScanResult): void {
  renderScanHeader(result);
  if (result.system) renderSystemInfo(result);
  if (result.security) renderSecuritySummary(result);
  renderFindingsTable(result);
  if (result.network?.listeningPorts.length) renderNetworkTable(result);
  if (result.network?.topology) renderTopologySummary(result);
  renderScoreSummary(result);
}

function renderScanHeader(result: ScanResult): void {
  const title = result.platform === 'darwin'
    ? '   SysGuard macOS Security Audit Results   '
    : '   SysGuard Windows Security Audit Results  ';
  console.log('');
  console.log(chalk.bold.blue('  ┌─────────────────────────────────────────┐'));
  console.log(chalk.bold.blue('  │') + chalk.bold.white(title) + chalk.bold.blue('│'));
  console.log(chalk.bold.blue('  └─────────────────────────────────────────┘'));
  console.log('');
  console.log(`  ${chalk.gray('Scan ID')}     ${chalk.white(result.id)}`);
  console.log(`  ${chalk.gray('Platform')}    ${chalk.white(result.platform)}${result.isMock ? chalk.magenta.bold(' (Demo / Mock Windows Telemetry)') : ''}`);
  console.log(`  ${chalk.gray('Hostname')}    ${chalk.white(result.hostname)}`);
  console.log(`  ${chalk.gray('User')}        ${chalk.white(result.privilege.currentUser)}${result.privilege.isRoot ? chalk.yellow(' (Administrator)') : ''}`);
  console.log(`  ${chalk.gray('Started')}     ${chalk.white(formatDate(result.startedAt))}`);
  console.log(`  ${chalk.gray('Duration')}    ${chalk.white(formatDuration(result.durationMs))}`);
  if (result.privilege.note) {
    console.log('');
    console.log(`  ${chalk.yellow('⚠')} ${chalk.yellow(result.privilege.note)}`);
  }
  console.log('');
}

function renderSystemInfo(result: ScanResult): void {
  const sys = result.system!;
  console.log(chalk.bold.white('  ── System Information ─────────────────────'));
  console.log('');

  const t = new Table({
    style: { head: [], border: ['gray'] },
    chars: {
      top: '', 'top-mid': '', 'top-left': '', 'top-right': '',
      bottom: '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
      left: '  ', 'left-mid': '', mid: '', 'mid-mid': '',
      right: '', 'right-mid': '', middle: '  ',
    },
  });

  t.push(
    [chalk.gray('OS'), `${sys.os.platform} ${sys.os.version ?? ''} ${sys.os.build ? `(${sys.os.build})` : ''}`.trim()],
    [chalk.gray('Architecture'), sys.os.architecture ?? result.architecture],
    [chalk.gray('Model'), sys.hardware.model ?? '—'],
    [chalk.gray('CPU'), truncate(sys.hardware.cpu ?? '—', 60)],
    [chalk.gray('Memory'), sys.hardware.memoryFormatted ?? (sys.hardware.memoryBytes ? formatBytes(sys.hardware.memoryBytes) : '—')],
    [chalk.gray('Uptime'), sys.uptimeSeconds ? formatUptime(sys.uptimeSeconds) : '—'],
  );

  if (sys.installedSoftware?.length) {
    t.push([chalk.gray('Installed Software'), chalk.cyan(`${sys.installedSoftware.length} packages cataloged`)]);
  }
  if (sys.localUsers?.length) {
    t.push([chalk.gray('Local Users'), chalk.cyan(`${sys.localUsers.length} user account(s)`)]);
  }

  console.log(t.toString());
  console.log('');
}


function renderSecuritySummary(result: ScanResult): void {
  const sec = result.security!;
  console.log(chalk.bold.white('  ── Security Controls ──────────────────────'));
  console.log('');

  type StatusStr = 'ENABLED' | 'DISABLED' | 'UNKNOWN' | 'PERMISSION DENIED';

  function boolStatus(val: boolean | undefined): StatusStr {
    if (val === true) return 'ENABLED';
    if (val === false) return 'DISABLED';
    return 'UNKNOWN';
  }

  function colorControl(val: boolean | undefined, goodValue: boolean): string {
    if (val === goodValue) return chalk.green(boolStatus(val));
    if (val === undefined) return chalk.gray(boolStatus(val));
    return chalk.red.bold(boolStatus(val));
  }

  const t = new Table({
    style: { head: [], border: ['gray'] },
    chars: {
      top: '', 'top-mid': '', 'top-left': '', 'top-right': '',
      bottom: '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
      left: '  ', 'left-mid': '', mid: '', 'mid-mid': '',
      right: '', 'right-mid': '', middle: '  ',
    },
  });

  if (sec.defender) {
    t.push([chalk.gray('Defender Antivirus'), colorControl(sec.defender.antivirusEnabled, true)]);
    t.push([chalk.gray('Real-time Protection'), colorControl(sec.defender.realtimeProtectionEnabled, true)]);
  }
  if (sec.defenderExclusions) {
    const hasEx = sec.defenderExclusions.hasExclusions;
    t.push([chalk.gray('Defender Exclusions'), hasEx ? chalk.yellow('Configured (Review)') : chalk.green('None (Secure)')]);
  }
  if (sec.amsiProviders) {
    const count = sec.amsiProviders.length;
    const details = sec.amsiProviders.map((p) => `${p.name}${p.fileVersion ? ` (v${p.fileVersion})` : ''}`).join(', ');
    t.push([chalk.gray('AMSI Providers'), count > 0 ? chalk.green(`${count} registered: ${details}`) : chalk.red('None (Hijacked/Disabled)')]);
  }
  if (sec.windowsFirewall) {
    for (const p of sec.windowsFirewall) {
      t.push([chalk.gray(`Firewall (${p.profile})`), colorControl(p.enabled, true)]);
    }
  }
  if (sec.secureBoot) {
    t.push([chalk.gray('Secure Boot'), colorControl(sec.secureBoot.enabled, true)]);
  }
  if (sec.uac) {
    t.push([chalk.gray('UAC (Admin Approval)'), colorControl(sec.uac.enabled, true)]);
  }
  if (sec.rdp) {
    t.push([chalk.gray('RDP Restricted'), colorControl(!sec.rdp.enabled, true)]);
  }
  if (sec.ntlmSettings) {
    const isVulnerable = sec.ntlmSettings.isVulnerableNtlmv1;
    t.push([chalk.gray('NTLM Protocol'), isVulnerable ? chalk.red.bold('Vulnerable (LM/NTLMv1)') : chalk.green('Secure (NTLMv2)')]);
  }
  if (sec.sysmon) {
    const sysmonLabel = sec.sysmon.installed
      ? chalk.green(`Installed (Driver: ${sec.sysmon.driverRunning ? 'Active' : 'Inactive'}${sec.sysmon.hashingAlgorithm ? `, Hash: ${sec.sysmon.hashingAlgorithm}` : ''})`)
      : chalk.gray('Not Installed');
    t.push([chalk.gray('Sysmon Status & Config'), sysmonLabel]);
  }
  if (sec.auditPolicies || sec.classicAuditRegistry) {
    const advCount = sec.auditPolicies?.length ?? 0;
    const hasLegacy = sec.classicAuditRegistry?.sceNoApplyLegacyAuditPolicy !== undefined;
    t.push([chalk.gray('Audit Policies'), chalk.cyan(`${advCount} advanced policies${hasLegacy ? ' (Classic LSA flags parsed)' : ''}`)]);
  }
  if (sec.groupPolicies) {
    t.push([chalk.gray('Local Group Policies'), chalk.cyan(`${sec.groupPolicies.length} settings applied`)]);
  }
  if (sec.windowsUpdates) {
    const comCount = sec.windowsUpdates.comUpdates?.length ?? 0;
    t.push([
      chalk.gray('Installed Updates'),
      chalk.cyan(`${sec.windowsUpdates.hotfixes.length} WMI hotfixes${comCount > 0 ? `, ${comCount} COM updates` : ''}`),
    ]);
  }
  if (sec.psHistory) {
    const sensitive = sec.psHistory.matchCount > 0;
    const label = sensitive
      ? chalk.red.bold(`${sec.psHistory.matchCount} secrets detected!`)
      : chalk.green('Clean');
    t.push([chalk.gray('PowerShell History'), label]);
  }
  if (sec.macSecurity) {
    const m = sec.macSecurity;
    t.push([chalk.gray('System Integrity Protection (SIP)'), colorControl(m.sip?.enabled, true)]);
    t.push([chalk.gray('FileVault Full Disk Encryption'), colorControl(m.fileVault?.enabled, true)]);
    t.push([chalk.gray('Gatekeeper App Verification'), colorControl(m.gatekeeper?.enabled, true)]);
    t.push([chalk.gray('macOS Application Firewall'), colorControl(m.firewall?.enabled, true)]);
    t.push([chalk.gray('Firewall Stealth Mode'), colorControl(m.firewall?.stealthMode, true)]);
    if (m.adminUsers?.length) {
      t.push([chalk.gray('Local Admin Accounts'), chalk.cyan(m.adminUsers.join(', '))]);
    }
  }

  console.log(t.toString());
  console.log('');
}

function renderFindingsTable(result: ScanResult): void {
  console.log(chalk.bold.white('  ── Security Findings ──────────────────────'));
  console.log('');

  const findings = [...result.findings]
    .filter((f) => f.status !== 'NOT_APPLICABLE')
    .sort((a, b) => compareSeverity(a.severity, b.severity));

  if (findings.length === 0) {
    console.log(chalk.gray('  No findings to display.\n'));
    return;
  }

  for (const finding of findings) {
    const statusStr = colorStatus(finding.status);
    const sevStr = colorSeverity(finding.severity);

    console.log(`  ${statusStr}  ${sevStr}  ${chalk.white(finding.title)}`);
    console.log(`          ${chalk.gray(finding.description)}`);
    if (finding.evidence) {
      console.log(`          ${chalk.gray('Evidence:')} ${chalk.dim(truncate(finding.evidence, 100))}`);
    }
    if (finding.status === 'FAIL' && finding.remediation) {
      console.log(`          ${chalk.cyan('Fix:')} ${chalk.cyan(truncate(finding.remediation, 120))}`);
    }
    console.log('');
  }
}

function renderNetworkTable(result: ScanResult): void {
  const ports = result.network!.listeningPorts.slice(0, 30);
  console.log(chalk.bold.white('  ── Listening Ports ─────────────────────────'));
  console.log('');

  const t = new Table({
    head: [
      chalk.gray('Protocol'),
      chalk.gray('Port'),
      chalk.gray('Address'),
      chalk.gray('Process'),
      chalk.gray('Service'),
    ],
    style: { head: [], border: ['gray'] },
  });

  for (const p of ports) {
    t.push([
      p.protocol,
      String(p.localPort),
      p.localAddress,
      p.process ?? '—',
      p.service ?? '—',
    ]);
  }

  console.log(t.toString());
  console.log('');
}

function renderTopologySummary(result: ScanResult): void {
  const top = result.network?.topology;
  if (!top) return;

  console.log(chalk.bold.white('  ── Network Topology & Exposure ─────────────'));
  console.log('');
  console.log(`  ${chalk.gray('Attached Subnets / VLANs:')}  ${chalk.cyan(top.activeSubnets.join(', ') || 'Direct Link')}`);
  console.log(`  ${chalk.gray('Discovered ARP Neighbors:')}  ${chalk.white(String(top.neighborCount))}`);
  console.log(`  ${chalk.gray('Exposed SMB Network Shares:')} ${chalk.white(String(top.sharesCount))}`);
  console.log(`  ${chalk.gray('Active Listening Ports:')}     ${chalk.white(String(top.listeningPortsCount))}`);
  console.log(`  ${chalk.gray('Topology Graph Formulation:')} ${chalk.green('Mermaid Diagram Ready (viewable in HTML report)')}`);
  console.log('');
}

function renderScoreSummary(result: ScanResult): void {
  const s = result.summary;
  const chalkColor = scoreColor(result.score);
  const label = scoreLabel(result.score);

  console.log(chalk.bold.white('  ── SysGuard Risk Score ─────────────────────'));
  console.log('');
  const chalkFn = chalk[chalkColor as 'green' | 'yellow' | 'red'];
  console.log(`  Score: ${chalkFn.bold(`${result.score}/100`)}  ${chalkFn(label)}`);
  console.log('');

  const t = new Table({
    head: [
      chalk.red('Critical'),
      chalk.red('High'),
      chalk.yellow('Medium'),
      chalk.cyan('Low'),
      chalk.gray('Info'),
      chalk.green('Passed'),
      chalk.red('Failed'),
      chalk.yellow('Warned'),
    ],
    style: { head: [], border: ['gray'] },
  });

  t.push([
    chalk.red(String(s.critical)),
    chalk.red(String(s.high)),
    chalk.yellow(String(s.medium)),
    chalk.cyan(String(s.low)),
    chalk.gray(String(s.info)),
    chalk.green(String(s.passed)),
    chalk.red(String(s.failed)),
    chalk.yellow(String(s.warned)),
  ]);

  console.log(t.toString());
  console.log('');
}
