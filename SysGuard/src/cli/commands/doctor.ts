import { Command } from 'commander';
import chalk from 'chalk';
import { execFileSync } from 'node:child_process';
import { isWindows } from '../../core/os-detector.js';
import { getPrivilegeInfo } from '../../core/permissions.js';

interface CheckResult {
  name: string;
  ok: boolean;
  message: string;
}

function checkCommand(binary: string, args: string[]): boolean {
  try {
    execFileSync(binary, args, { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

function runChecks(): CheckResult[] {
  const checks: CheckResult[] = [];
  const priv = getPrivilegeInfo();

  // Node version
  const nodeVersion = process.version;
  const majorNum = parseInt(nodeVersion.slice(1), 10);
  checks.push({
    name: 'Node.js version',
    ok: majorNum >= 18,
    message: `${nodeVersion} (requires >= 18)`,
  });

  // Platform
  const win = isWindows();
  const darwin = process.platform === 'darwin';
  checks.push({
    name: 'Operating System',
    ok: win || darwin,
    message: win
      ? 'Windows 10/11 ✔'
      : darwin
      ? `macOS (${process.arch}) ✔ Native Support Active`
      : `${process.platform} ⚠ (SysGuard supports macOS & Windows)`,
  });

  // Privileges
  checks.push({
    name: 'Administrator privileges',
    ok: darwin ? true : priv.isRoot,
    message: priv.isRoot
      ? `Running as ${priv.currentUser} (Elevated) — full audit available`
      : darwin
      ? `Running as ${priv.currentUser} (Standard User — sudo optional)`
      : `Running as ${priv.currentUser} — run as Administrator for full data`,
  });

  if (darwin) {
    const darwinCommands: Array<[string, string[], string]> = [
      ['csrutil', ['status'], 'System Integrity Protection (SIP) verification'],
      ['fdesetup', ['status'], 'FileVault 2 Disk Encryption subsystem'],
      ['spctl', ['--status'], 'Gatekeeper Application Assessment subsystem'],
      ['socketfilterfw', ['--getglobalstate'], 'macOS Application Firewall daemon'],
      ['lsof', ['-v'], 'Network socket & open port inspection (lsof)'],
      ['scutil', ['-r', '127.0.0.1'], 'System Configuration framework (scutil)'],
      ['sysctl', ['kern.boottime'], 'Kernel telemetry and CPU statistics (sysctl)'],
      ['sw_vers', [], 'macOS Software version tool (sw_vers)'],
      ['dscl', ['.', '-read', '/Groups/admin'], 'Directory Service command-line tool (dscl)'],
    ];

    for (const [cmdlet, args, label] of darwinCommands) {
      const binary = cmdlet === 'socketfilterfw' ? '/usr/libexec/ApplicationFirewall/socketfilterfw' : cmdlet;
      checks.push({
        name: cmdlet,
        ok: checkCommand(binary, args),
        message: label,
      });
    }
  }

  if (win) {
    // Helper to test PowerShell cmdlets
    function checkPS(cmdlet: string): boolean {
      return checkCommand('powershell.exe', [
        '-NonInteractive', '-NoProfile', '-ExecutionPolicy', 'Bypass',
        '-Command', `Get-Command ${cmdlet} -ErrorAction Stop | Out-Null`,
      ]);
    }

    const psCmdlets: Array<[string, string]> = [
      ['Get-ComputerInfo', 'System information'],
      ['Get-NetFirewallProfile', 'Windows Firewall profiles'],
      ['Get-MpComputerStatus', 'Windows Defender status'],
      ['Confirm-SecureBootUEFI', 'Secure Boot configuration'],
      ['Get-LocalUser', 'Local users auditing'],
      ['Get-Service', 'Windows Services auditing'],
      ['Get-HotFix', 'Installed updates & patches'],
      ['Get-NetAdapter', 'Network adapters & interfaces'],
      ['Get-NetTCPConnection', 'TCP connections & open ports'],
      ['Get-NetUDPEndpoint', 'UDP endpoints'],
      ['Get-DnsClientCache', 'DNS client cache entries'],
      ['Get-SmbShare', 'Exposed SMB shares'],
    ];

    for (const [cmdlet, label] of psCmdlets) {
      checks.push({
        name: cmdlet,
        ok: checkPS(cmdlet),
        message: label,
      });
    }
  }

  return checks;
}

export function makeDoctorCommand(): Command {
  const cmd = new Command('doctor');
  cmd
    .description('Verify system environment and required audit utility availability')
    .action(() => {
      const isMac = process.platform === 'darwin';
      console.log('');
      console.log(chalk.bold.white(`  SysGuard Doctor — ${isMac ? 'macOS' : 'Windows'} Environment Check`));
      console.log('');

      const checks = runChecks();
      let allOk = true;

      for (const check of checks) {
        const icon = check.ok ? chalk.green('✔') : chalk.yellow('⚠');
        const name = chalk.white(check.name.padEnd(30));
        const msg = check.ok ? chalk.gray(check.message) : chalk.yellow(check.message);
        console.log(`  ${icon}  ${name} ${msg}`);
        if (!check.ok) allOk = false;
      }

      console.log('');

      if (allOk) {
        console.log(chalk.green(`  ✔ All ${isMac ? 'macOS' : 'Windows'} checks passed. Ready to scan.\n`));
      } else {
        console.log(chalk.yellow('  ⚠ Some checks did not pass. Some data may be unavailable.\n'));
      }
    });
  return cmd;
}
