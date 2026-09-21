import chalk from 'chalk';
import type { ScanResult } from '../../types/scan.js';
import type { Finding, FindingStatus } from '../../types/finding.js';
import { scoreLabel } from '../../rules/scoring.js';
import { generateJsonReport } from '../../reporters/json.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export interface DashboardOptions {
  onRescan: () => Promise<ScanResult>;
  onBackToMenu?: () => Promise<void>;
}

type Tab = 'findings' | 'network' | 'system';

export async function runInteractiveDashboard(
  initialResult: ScanResult,
  options: DashboardOptions
): Promise<void> {
  let result = initialResult;
  let activeTab: Tab = 'findings';
  let selectedIndex = 0;
  let filter: 'ALL' | FindingStatus = 'ALL';
  let inspecting = false;
  let message = '';
  let isScanning = false;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'findings', label: '1. 🛡️ Findings' },
    { id: 'network', label: '2. 🌐 Network & Ports' },
    { id: 'system', label: '3. 💻 System Controls' },
  ];

  function getFilteredFindings(): Finding[] {
    if (filter === 'ALL') return result.findings;
    return result.findings.filter((f) => f.status === filter);
  }

  // Switch to alternate screen buffer and hide cursor
  process.stdout.write('\x1B[?1049h\x1B[?25l');

  function render(): void {
    // In alternate buffer, reset cursor to top left and clear with zero flicker
    process.stdout.write('\x1B[H\x1B[2J');

    const findings = getFilteredFindings();
    if (selectedIndex >= findings.length) {
      selectedIndex = Math.max(0, findings.length - 1);
    }

    // 1. Header Banner (4 lines)
    const scoreVal = result.score;
    const scoreText = `${scoreVal}/100 (${scoreLabel(scoreVal)})`;
    const scoreColored =
      scoreVal >= 80 ? chalk.bgGreen.black.bold(` ${scoreText} `) :
      scoreVal >= 60 ? chalk.bgYellow.black.bold(` ${scoreText} `) :
      chalk.bgRed.white.bold(` ${scoreText} `);

    process.stdout.write(
      chalk.bold.blue('┌────────────────────────────────────────────────────────────────────────────┐\n') +
      chalk.bold.blue('│ ') + chalk.bold.white('🛡️  SYSGUARD INTERACTIVE AUDITOR') + ' '.repeat(24) + chalk.cyan.bold('🍎 macOS Native') + chalk.bold.blue('  │\n') +
      chalk.bold.blue('├────────────────────────────────────────────────────────────────────────────┤\n') +
      chalk.bold.blue('│ ') +
      `${chalk.gray('Host:')} ${chalk.white(result.hostname.padEnd(14))} ` +
      `${chalk.gray('User:')} ${chalk.white(result.privilege.currentUser.padEnd(10))} ` +
      `${chalk.gray('Score:')} ${scoreColored}` +
      ' '.repeat(Math.max(0, 16 - scoreText.length)) +
      chalk.bold.blue('│\n') +
      chalk.bold.blue('└────────────────────────────────────────────────────────────────────────────┘\n')
    );

    // 2. Tab Bar (2 lines)
    const tabHeaders = tabs
      .map((t) => {
        if (t.id === activeTab) {
          return chalk.bgBlue.white.bold(` ${t.label} `);
        }
        return chalk.gray(` ${t.label} `);
      })
      .join(' ');
    process.stdout.write(`\n  ${tabHeaders}\n\n`);

    // 3. Tab Contents (max 7 lines)
    if (activeTab === 'findings') {
      renderFindingsTab(findings);
    } else if (activeTab === 'network') {
      renderNetworkTab();
    } else if (activeTab === 'system') {
      renderSystemTab();
    }

    // 4. Status Message Banner
    if (message) {
      process.stdout.write(`\n  ${chalk.bgCyan.black.bold(' NOTICE ')} ${chalk.cyan(message)}\n`);
    } else if (isScanning) {
      process.stdout.write(`\n  ${chalk.bgYellow.black.bold(' SCANNING ')} ${chalk.yellow('Refreshing live telemetry in background…')}\n`);
    } else {
      process.stdout.write('\n');
    }

    // 5. Footer Keybindings Help (2 lines)
    process.stdout.write(
      chalk.gray('  ' + '─'.repeat(72)) + '\n' +
      `  ${chalk.bold.white('[↑/↓]')} Navigate   ` +
      `  ${chalk.bold.white('[Enter]')} ${inspecting ? 'Close' : 'Inspect'}   ` +
      `  ${chalk.bold.white('[Tab / 1-3]')} Tab   ` +
      `  ${chalk.bold.white('[F]')} Filter (${filter})\n` +
      `  ${chalk.bold.white('[R]')} Re-Scan    ` +
      `  ${chalk.bold.yellow('[B]')} Back to Menu   ` +
      `  ${chalk.bold.white('[E]')} Export JSON   ` +
      `  ${chalk.bold.red('[Q]')} Quit\n`
    );
  }

  function renderFindingsTab(findings: Finding[]): void {
    const summary = result.summary;
    process.stdout.write(
      `  ${chalk.red.bold(`✖ ${summary.failed} Failed`)}  |  ` +
      `  ${chalk.yellow.bold(`⚠ ${summary.warned} Warnings`)}  |  ` +
      `  ${chalk.green.bold(`✔ ${summary.passed} Passed`)}  |  ` +
      `  ${chalk.gray(`Filter: ${filter}`)}\n\n`
    );

    if (findings.length === 0) {
      process.stdout.write(`    ${chalk.gray('No findings match current filter.')}\n\n`);
      return;
    }

    // List max 5 visible items to keep screen compact
    const pageSize = 5;
    const startIdx = Math.max(0, Math.min(selectedIndex - 2, findings.length - pageSize));
    const endIdx = Math.min(findings.length, startIdx + pageSize);

    for (let i = startIdx; i < endIdx; i++) {
      const f = findings[i]!;
      const isSelected = i === selectedIndex;
      const pointer = isSelected ? chalk.cyan.bold('► ') : '  ';

      let statusIcon = chalk.green('✔');
      if (f.status === 'FAIL') statusIcon = chalk.red.bold('✖');
      else if (f.status === 'WARN') statusIcon = chalk.yellow.bold('⚠');
      else if (f.status === 'NOT_APPLICABLE') statusIcon = chalk.gray('○');

      let sev = chalk.gray(`[${f.severity}]`);
      if (f.severity === 'CRITICAL') sev = chalk.bgRed.white.bold(` ${f.severity} `);
      else if (f.severity === 'HIGH') sev = chalk.red(`[${f.severity}]`);
      else if (f.severity === 'MEDIUM') sev = chalk.yellow(`[${f.severity}]`);

      const title = isSelected ? chalk.bold.white.underline(f.title) : chalk.white(f.title);
      process.stdout.write(`${pointer}${statusIcon} ${sev.padEnd(10)} ${title}\n`);
    }

    // Drawer Inspector
    if (inspecting && findings[selectedIndex]) {
      const selected = findings[selectedIndex]!;
      process.stdout.write('\n' + chalk.gray('  ' + '─'.repeat(72)) + '\n');
      process.stdout.write(`  ${chalk.bold.cyan('Inspection:')} ${chalk.white.bold(selected.title)}\n`);
      process.stdout.write(`  ${chalk.gray('Details:')}    ${chalk.white(selected.description)}\n`);
      if (selected.evidence) {
        process.stdout.write(`  ${chalk.gray('Evidence:')}   ${chalk.cyan(selected.evidence)}\n`);
      }
      if (selected.remediation) {
        process.stdout.write(`  ${chalk.gray('Remedy:')}     ${chalk.green(selected.remediation)}\n`);
      }
    }
  }

  function renderNetworkTab(): void {
    const net = result.network;
    if (!net) {
      process.stdout.write(`    ${chalk.gray('Network telemetry not collected.')}\n`);
      return;
    }

    const ports = net.listeningPorts || [];
    process.stdout.write(
      `  ${chalk.bold('Active Subnets:')}     ${net.topology?.activeSubnets.join(', ') || '127.0.0.1'}\n` +
      `  ${chalk.bold('Discovered Neighbors:')} ${net.arpTable.length} ARP devices cached\n` +
      `  ${chalk.bold('Listening Sockets:')}   ${ports.length} ports open\n\n`
    );

    process.stdout.write(chalk.bold.white('  Top Listening Ports:\n'));
    for (const p of ports.slice(0, 4)) {
      const proc = p.process ? `(${p.process})` : '';
      process.stdout.write(
        `    • ${chalk.cyan(p.protocol)} ${chalk.yellow(String(p.localPort).padEnd(6))} ` +
        `${chalk.gray(p.localAddress.padEnd(14))} ${chalk.white(proc)}\n`
      );
    }
  }

  function renderSystemTab(): void {
    const sys = result.system;
    const sec = result.security;

    if (sys) {
      const memGb = sys.hardware.memoryBytes ? Math.round(sys.hardware.memoryBytes / (1024 ** 3)) : 8;
      process.stdout.write(
        `  ${chalk.bold('Operating System:')}    macOS (${sys.os.version ?? sys.os.platform})\n` +
        `  ${chalk.bold('CPU Model:')}           ${sys.hardware.cpu ?? 'Apple Silicon'} (${sys.os.architecture})\n` +
        `  ${chalk.bold('System Memory:')}       ${memGb} GB RAM\n\n`
      );
    }

    if (sec?.macSecurity) {
      const m = sec.macSecurity;
      const sipBadge = m.sip?.enabled ? chalk.green('ENABLED') : chalk.red.bold('DISABLED');
      const fvBadge = m.fileVault?.enabled ? chalk.green('ENABLED') : chalk.red.bold('DISABLED');
      const gkBadge = m.gatekeeper?.enabled ? chalk.green('ENABLED') : chalk.red.bold('DISABLED');
      const fwBadge = m.firewall?.enabled ? chalk.green('ENABLED') : chalk.red.bold('DISABLED');
      const stealthBadge = m.firewall?.stealthMode ? chalk.green('ENABLED') : chalk.yellow('DISABLED');

      process.stdout.write(chalk.bold.white('  Native macOS Security Controls:\n'));
      process.stdout.write(`    • System Integrity Protection (SIP): ${sipBadge}\n`);
      process.stdout.write(`    • FileVault Full Disk Encryption:    ${fvBadge}\n`);
      process.stdout.write(`    • Gatekeeper App Verification:       ${gkBadge}\n`);
      process.stdout.write(`    • macOS Application Firewall:        ${fwBadge}\n`);
      process.stdout.write(`    • Firewall Stealth Mode:             ${stealthBadge}\n`);
    }
  }

  render();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  return new Promise<void>((resolvePromise) => {
    function cleanupAndExit(): void {
      process.stdin.removeListener('data', onData);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      // Leave alternate screen buffer and restore cursor
      process.stdout.write('\x1B[?1049l\x1B[?25h\n');
      resolvePromise();
    }

    const onData = async (data: Buffer): Promise<void> => {
      const key = data.toString();
      message = '';

      // Ctrl + C or Q
      if (data[0] === 0x03 || key === 'q' || key === 'Q') {
        cleanupAndExit();
        return;
      }

      // Enter key
      if (data[0] === 0x0d) {
        if (activeTab === 'findings') {
          inspecting = !inspecting;
        }
      }

      // Tab key
      if (data[0] === 0x09) {
        const currentIdx = tabs.findIndex((t) => t.id === activeTab);
        activeTab = tabs[(currentIdx + 1) % tabs.length]?.id ?? 'findings';
        inspecting = false;
      }

      // Number keys 1-3 for quick tab selection
      if (key === '1') { activeTab = 'findings'; inspecting = false; }
      if (key === '2') { activeTab = 'network'; inspecting = false; }
      if (key === '3') { activeTab = 'system'; inspecting = false; }

      // Filter toggle (F)
      if (key === 'f' || key === 'F') {
        if (filter === 'ALL') filter = 'FAIL';
        else if (filter === 'FAIL') filter = 'WARN';
        else if (filter === 'WARN') filter = 'PASS';
        else filter = 'ALL';
        selectedIndex = 0;
      }

      // Re-scan live (R)
      if (key === 'r' || key === 'R') {
        if (!isScanning) {
          isScanning = true;
          render();
          try {
            result = await options.onRescan();
            message = '✔ Live re-scan completed with updated telemetry!';
          } catch (err) {
            message = `✖ Re-scan failed: ${String(err)}`;
          } finally {
            isScanning = false;
          }
        }
      }

      // Back to Commands Selector Menu (B)
      if (key === 'b' || key === 'B') {
        if (options.onBackToMenu) {
          cleanupAndExit();
          await options.onBackToMenu();
          return;
        }
      }

      // Export Report (E) - JSON Only
      if (key === 'e' || key === 'E') {
        try {
          const outDir = resolve(process.cwd(), 'reports');
          mkdirSync(outDir, { recursive: true });
          writeFileSync(resolve(outDir, 'sysguard-report.json'), generateJsonReport(result), 'utf-8');
          message = '✔ Exported JSON report to reports/sysguard-report.json!';
        } catch (err) {
          message = `✖ Export failed: ${String(err)}`;
        }
      }

      // Arrow Keys
      if (data[0] === 0x1b && data[1] === 0x5b) {
        const findings = getFilteredFindings();
        if (data[2] === 0x41) { // Up
          if (selectedIndex > 0) selectedIndex--;
        } else if (data[2] === 0x42) { // Down
          if (selectedIndex < findings.length - 1) selectedIndex++;
        } else if (data[2] === 0x44) { // Left (Previous Tab)
          const currentIdx = tabs.findIndex((t) => t.id === activeTab);
          activeTab = tabs[(currentIdx - 1 + tabs.length) % tabs.length]?.id ?? 'findings';
          inspecting = false;
        } else if (data[2] === 0x43) { // Right (Next Tab)
          const currentIdx = tabs.findIndex((t) => t.id === activeTab);
          activeTab = tabs[(currentIdx + 1) % tabs.length]?.id ?? 'findings';
          inspecting = false;
        }
      }

      render();
    };

    process.stdin.on('data', onData);
  });
}
