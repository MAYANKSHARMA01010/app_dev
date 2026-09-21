import { Command } from 'commander';
import chalk from 'chalk';
import { scan } from '../../core/scanner.js';
import { startSpinner, stopSpinner } from '../ui/spinner.js';
import { compareSeverity } from '../../rules/severity.js';

export function makeFindingsCommand(): Command {
  const cmd = new Command('findings');
  cmd
    .description('Display security findings from a fresh scan')
    .option('--format <format>', 'Output format: table, json', 'table')
    .action(async (opts: { format: string }) => {
      startSpinner('Running scan to collect findings…');
      const result = await scan({ modules: ['system', 'security', 'network'], format: 'table' });
      stopSpinner();

      const findings = [...result.findings]
        .filter((f) => f.status !== 'NOT_APPLICABLE')
        .sort((a, b) => compareSeverity(a.severity, b.severity));

      if (opts.format === 'json') {
        console.log(JSON.stringify(findings, null, 2));
        return;
      }

      console.log('');
      console.log(chalk.bold.white('  Security Findings'));
      console.log('');

      if (findings.length === 0) {
        console.log(chalk.green('  ✔ No findings to report.\n'));
        return;
      }

      for (const f of findings) {
        const statusColor =
          f.status === 'FAIL' ? chalk.red : f.status === 'WARN' ? chalk.yellow : chalk.green;
        const sevColor =
          f.severity === 'CRITICAL' || f.severity === 'HIGH'
            ? chalk.red
            : f.severity === 'MEDIUM'
            ? chalk.yellow
            : chalk.cyan;

        console.log(`  ${statusColor(f.status)}  ${sevColor(f.severity)}  ${chalk.white(f.title)}`);
        console.log(`          ${chalk.gray(f.description)}`);
        if (f.remediation && f.status === 'FAIL') {
          console.log(`          ${chalk.cyan('→')} ${chalk.cyan(f.remediation)}`);
        }
        console.log('');
      }
    });
  return cmd;
}
