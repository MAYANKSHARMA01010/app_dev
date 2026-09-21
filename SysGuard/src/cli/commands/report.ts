import { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { scan } from '../../core/scanner.js';
import { generateJsonReport } from '../../reporters/json.js';
import { startSpinner, succeedSpinner, failSpinner } from '../ui/spinner.js';

export function makeReportCommand(): Command {
  const cmd = new Command('report');
  cmd
    .description('Generate JSON report from a fresh security audit')
    .option('--output <dir>', 'Output directory for reports', 'reports')
    .option('--name <name>', 'Base filename for report', 'sysguard-report')
    .action(async (opts: { output: string; name: string }) => {
      const outDir = resolve(opts.output);
      const baseName = opts.name;

      startSpinner('Running security posture and network scan…');

      let result;
      try {
        result = await scan({
          modules: ['system', 'security', 'network'],
          format: 'json',
        });
      } catch (err) {
        failSpinner(`Scan failed: ${String(err)}`);
        process.exit(1);
      }

      succeedSpinner('Scan complete.');

      mkdirSync(outDir, { recursive: true });

      const jsonPath = resolve(outDir, `${baseName}.json`);
      writeFileSync(jsonPath, generateJsonReport(result), 'utf-8');
      console.log(chalk.green(`  ✔ JSON report saved: ${jsonPath}\n`));
    });
  return cmd;
}
