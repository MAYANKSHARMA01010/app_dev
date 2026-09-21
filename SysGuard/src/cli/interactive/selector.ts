import chalk from 'chalk';
import { scan } from '../../core/scanner.js';
import { runInteractiveDashboard } from './dashboard.js';
import type { ScanResult } from '../../types/scan.js';

export interface AuditCheckItem {
  id: string;
  category: 'system' | 'security' | 'network';
  title: string;
  command: string;
  description: string;
  enabled: boolean;
}

export const AUDIT_CHECKS: AuditCheckItem[] = [
  {
    id: 'listening_ports',
    category: 'network',
    title: 'Open Ports & Listening Sockets',
    command: 'lsof -nP -iTCP -sTCP:LISTEN',
    description: 'Scans all listening TCP/UDP ports, PIDs, and process owners',
    enabled: true,
  },
  {
    id: 'established_conns',
    category: 'network',
    title: 'Active Established Connections',
    command: 'lsof -nP -iTCP -sTCP:ESTABLISHED',
    description: 'Inspects active network sessions and remote connections',
    enabled: true,
  },
  {
    id: 'security_controls',
    category: 'security',
    title: 'Security Subsystems (SIP/FileVault/GK)',
    command: 'csrutil status && fdesetup status',
    description: 'Verifies System Integrity Protection, FileVault, and Gatekeeper',
    enabled: true,
  },
  {
    id: 'firewall',
    category: 'security',
    title: 'Application Firewall & Stealth Mode',
    command: 'socketfilterfw --getglobalstate',
    description: 'Audits macOS Application Firewall and ICMP stealth mode',
    enabled: true,
  },
  {
    id: 'interfaces_arp',
    category: 'network',
    title: 'Network Interfaces & ARP LAN Neighbors',
    command: 'ifconfig && arp -an',
    description: 'Discovers active network interfaces and cached ARP devices',
    enabled: true,
  },
  {
    id: 'persistence',
    category: 'system',
    title: 'Auto-Run Persistence (LaunchDaemons)',
    command: 'ls /Library/LaunchDaemons',
    description: 'Catalogs persistent background startup plists and daemons',
    enabled: true,
  },
  {
    id: 'local_users',
    category: 'system',
    title: 'Local Accounts & Admin Privileges',
    command: 'dscl . -read /Groups/admin',
    description: 'Audits accounts with administrator or root privileges',
    enabled: true,
  },
];

export async function runInteractiveSelector(): Promise<void> {
  const items = AUDIT_CHECKS.map((item) => ({ ...item }));
  let selectedIndex = 0;
  let statusMessage = '';

  // Switch to alternate terminal screen buffer and hide cursor (like htop / vim)
  process.stdout.write('\x1B[?1049h\x1B[?25l');

  function render(): void {
    // In alternate buffer, reset cursor to home and clear screen with zero flicker
    process.stdout.write('\x1B[H\x1B[2J');

    const selectedCount = items.filter((i) => i.enabled).length;

    // Compact 4-line Header
    process.stdout.write(
      chalk.bold.blue('┌────────────────────────────────────────────────────────────────────────────┐\n') +
      chalk.bold.blue('│ ') + chalk.bold.white('🛡️  SYSGUARD AUDIT CHECKLIST SELECTOR') + ' '.repeat(16) + chalk.cyan.bold('🍎 macOS Native') + chalk.bold.blue('  │\n') +
      chalk.bold.blue('├────────────────────────────────────────────────────────────────────────────┤\n') +
      chalk.bold.blue('│ ') +
      `${chalk.bold.white('Selected:')} ${chalk.green.bold(`${selectedCount}/${items.length}`)} checks enabled` +
      ' '.repeat(Math.max(0, 32 - `${selectedCount}/${items.length}`.length)) +
      chalk.yellow.bold('[D] Deselect All') + '  ' + chalk.cyan.bold('[A] Select All') +
      chalk.bold.blue(' │\n') +
      chalk.bold.blue('└────────────────────────────────────────────────────────────────────────────┘\n\n')
    );

    // Compact list of 7 checks (7 lines)
    items.forEach((item, index) => {
      const isCurrent = index === selectedIndex;
      const pointer = isCurrent ? chalk.cyan.bold('► ') : '  ';
      const checkMark = item.enabled ? chalk.green.bold('[●]') : chalk.gray('[○]');
      const title = isCurrent ? chalk.bold.white.underline(item.title.padEnd(42)) : chalk.white(item.title.padEnd(42));
      const cmdShort = chalk.gray(`(${item.command.split(' ')[0]})`);

      process.stdout.write(`${pointer}${checkMark} ${title} ${cmdShort}\n`);
    });

    // Inspector details for currently highlighted item (2 lines)
    const current = items[selectedIndex];
    process.stdout.write('\n' + chalk.gray('  ' + '─'.repeat(72)) + '\n');
    if (current) {
      process.stdout.write(`  ${chalk.gray('Command:')} ${chalk.yellow.bold(current.command)}   ${chalk.gray('Scope:')} ${chalk.white(current.description)}\n`);
    }

    // Status Message if any
    if (statusMessage) {
      process.stdout.write(`  ${chalk.bgCyan.black.bold(' NOTICE ')} ${chalk.cyan(statusMessage)}\n`);
    } else {
      process.stdout.write('\n');
    }

    // Footer Controls (2 lines)
    process.stdout.write(
      chalk.gray('  ' + '─'.repeat(72)) + '\n' +
      `  ${chalk.bold.white('[↑/↓]')} Move   ` +
      `  ${chalk.bold.white('[Space]')} Toggle   ` +
      `  ${chalk.bold.yellow('[D]')} Deselect All   ` +
      `  ${chalk.bold.cyan('[A]')} Select All\n` +
      `  ${chalk.bold.green('[Enter]')} RUN AUDIT ON SELECTED CHECKS   ` +
      `  ${chalk.bold.red('[Q]')} Exit\n`
    );
  }

  render();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  return new Promise<void>((resolvePromise) => {
    function cleanupAndExit(): void {
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
      statusMessage = '';

      // Ctrl + C or Q
      if (data[0] === 0x03 || key === 'q' || key === 'Q') {
        process.stdin.removeListener('data', onData);
        cleanupAndExit();
        return;
      }

      // 'D' key: Deselect All
      if (key === 'd' || key === 'D') {
        items.forEach((i) => { i.enabled = false; });
        statusMessage = 'All checks deselected. Press [Space] to enable specific checks.';
        render();
        return;
      }

      // 'A' key: Select All
      if (key === 'a' || key === 'A') {
        items.forEach((i) => { i.enabled = true; });
        statusMessage = 'All checks selected.';
        render();
        return;
      }

      // Space key: toggle
      if (key === ' ' || data[0] === 0x20) {
        const item = items[selectedIndex];
        if (item) {
          item.enabled = !item.enabled;
        }
        render();
        return;
      }

      // Arrow Keys (Up / Down)
      if (data[0] === 0x1b && data[1] === 0x5b) {
        if (data[2] === 0x41) { // Up
          if (selectedIndex > 0) selectedIndex--;
          render();
          return;
        } else if (data[2] === 0x42) { // Down
          if (selectedIndex < items.length - 1) selectedIndex++;
          render();
          return;
        }
      }

      // Enter key: Execute selected checks
      if (data[0] === 0x0d) {
        const enabledItems = items.filter((i) => i.enabled);
        if (enabledItems.length === 0) {
          statusMessage = 'Please select at least one check to run.';
          render();
          return;
        }

        const modules: ('system' | 'security' | 'network')[] = [];
        if (enabledItems.some((i) => i.category === 'system')) modules.push('system');
        if (enabledItems.some((i) => i.category === 'security')) modules.push('security');
        if (enabledItems.some((i) => i.category === 'network')) modules.push('network');

        process.stdin.removeListener('data', onData);

        process.stdout.write('\x1B[H\x1B[2J');
        process.stdout.write(
          chalk.bold.blue('\n  ┌────────────────────────────────────────────────────────────────────────────┐\n') +
          chalk.bold.blue('  │ ') + chalk.bold.white('🛡️  SYSGUARD AUDITING ACTIVE CHECKS…') + ' '.repeat(38) + chalk.bold.blue('│\n') +
          chalk.bold.blue('  └────────────────────────────────────────────────────────────────────────────┘\n\n')
        );
        for (const it of enabledItems) {
          process.stdout.write(`  ${chalk.green('✔')} ${chalk.yellow(it.command.padEnd(42))} ${chalk.gray(it.title)}\n`);
        }
        process.stdout.write(chalk.bold.white('\n  Running commands and analyzing security posture…\n'));

        try {
          const result: ScanResult = await scan({ modules, format: 'table' });

          await runInteractiveDashboard(result, {
            onRescan: async () => {
              return scan({ modules, format: 'table' });
            },
            onBackToMenu: async () => {
              await runInteractiveSelector();
            },
          });
        } catch (err) {
          process.stdout.write(chalk.red(`\n  ✖ Scan failed: ${String(err)}\n`));
        }

        cleanupAndExit();
      }
    };

    process.stdin.on('data', onData);
  });
}
