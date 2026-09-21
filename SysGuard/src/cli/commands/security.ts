import { Command } from 'commander';
import { scan } from '../../core/scanner.js';
import { renderTerminalReport } from '../../reporters/terminal.js';
import { startSpinner, stopSpinner } from '../ui/spinner.js';

export function makeSecurityCommand(): Command {
  const cmd = new Command('security');
  cmd
    .description('Display security controls and findings only')
    .action(async () => {
      startSpinner('Collecting security controls…');
      const result = await scan({ modules: ['system', 'security'], format: 'table' });
      stopSpinner();
      renderTerminalReport(result);
    });
  return cmd;
}
