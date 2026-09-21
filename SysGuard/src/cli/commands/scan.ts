import { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { scan } from '../../core/scanner.js';
import { renderTerminalReport } from '../../reporters/terminal.js';
import { generateJsonReport } from '../../reporters/json.js';
import { renderProgress } from '../ui/progress.js';
import { startSpinner, stopSpinner } from '../ui/spinner.js';
import { runInteractiveDashboard } from '../interactive/dashboard.js';
import { runInteractiveSelector } from '../interactive/selector.js';

export function makeScanCommand(): Command {
  const cmd = new Command('scan');
  cmd
    .description('Run a full security and network audit')
    .option('--format <format>', 'Output format: table, json', 'table')
    .option('--output <file>', 'Write JSON report to file')
    .option('--modules <list>', 'Comma-separated modules: system,security,network', 'system,security,network')
    .option('--verbose', 'Enable verbose logging', false)
    .option('--no-interactive', 'Disable interactive terminal dashboard and output static report')
    .action(async (opts: { format: string; output?: string; modules: string; verbose: boolean; interactive: boolean }) => {
      if (opts.format === 'table' && !opts.output && process.stdout.isTTY && opts.interactive !== false) {
        await runInteractiveSelector();
        return;
      }

      const modules = opts.modules.split(',').map((m) => m.trim()) as ('system' | 'security' | 'network')[];

      let result;
      try {
        if (opts.format === 'table') {
          result = await scan({ modules, format: 'table' }, renderProgress);
        } else {
          startSpinner('Running security posture and network audit…');
          result = await scan({ modules, format: 'json' });
          stopSpinner();
        }
      } catch (err) {
        stopSpinner();
        console.error(chalk.red(`  Scan failed: ${String(err)}`));
        process.exit(1);
      }

      if (opts.format === 'table' && !opts.output) {
        if (process.stdout.isTTY && opts.interactive !== false) {
          await runInteractiveDashboard(result, {
            onRescan: () => scan({ modules, format: 'table' }),
          });
          return;
        }

        renderTerminalReport(result);
        return;
      }

      const content = generateJsonReport(result);
      if (opts.output) {
        mkdirSync(dirname(opts.output), { recursive: true });
        writeFileSync(opts.output, content, 'utf-8');
        console.log(chalk.green(`  ✔ JSON Report saved to: ${opts.output}`));
      } else {
        console.log(content);
      }
    });

  return cmd;
}
