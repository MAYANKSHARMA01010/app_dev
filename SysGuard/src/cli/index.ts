#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { printBanner } from './ui/banner.js';
import { makeScanCommand } from './commands/scan.js';
import { makeSystemCommand } from './commands/system.js';
import { makeSecurityCommand } from './commands/security.js';
import { makeNetworkCommand } from './commands/network.js';
import { makeFindingsCommand } from './commands/findings.js';
import { makeReportCommand } from './commands/report.js';
import { makeDoctorCommand } from './commands/doctor.js';
import { runInteractiveSelector } from './interactive/selector.js';
import { setVerbose } from '../utils/logger.js';

const program = new Command();

program
  .name('sysguard')
  .description('Agent-less macOS Security Vulnerability & Network Scanner')
  .version('1.0.0')
  .option('--verbose', 'Enable verbose debug output', false)
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts<{ verbose: boolean }>();
    if (opts.verbose) setVerbose(true);
  });

// Register subcommands
program.addCommand(makeScanCommand());
program.addCommand(makeSystemCommand());
program.addCommand(makeSecurityCommand());
program.addCommand(makeNetworkCommand());
program.addCommand(makeFindingsCommand());
program.addCommand(makeReportCommand());
program.addCommand(makeDoctorCommand());

// Default action: launch interactive selector checklist when in TTY, or show help
program.action(async () => {
  if (process.stdout.isTTY) {
    await runInteractiveSelector();
    return;
  }

  printBanner();
  console.log(chalk.bold.white('  Available Commands:'));
  console.log('');
  console.log(`  ${chalk.cyan('sysguard scan')}       Run a full security and network audit`);
  console.log(`  ${chalk.cyan('sysguard system')}     Display system information`);
  console.log(`  ${chalk.cyan('sysguard security')}   Display security controls and findings`);
  console.log(`  ${chalk.cyan('sysguard network')}    Display network information and ports`);
  console.log(`  ${chalk.cyan('sysguard findings')}   List security findings`);
  console.log(`  ${chalk.cyan('sysguard report')}     Generate HTML + JSON reports`);
  console.log(`  ${chalk.cyan('sysguard doctor')}     Verify environment and permissions`);
  console.log('');
  console.log(`  Use ${chalk.gray('sysguard <command> --help')} for command-specific options.`);
  console.log('');
});

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(chalk.red(`  Error: ${String(err)}`));
  process.exit(1);
});
