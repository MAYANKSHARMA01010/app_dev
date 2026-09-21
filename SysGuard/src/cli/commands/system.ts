import { Command } from 'commander';
import { scan } from '../../core/scanner.js';
import { renderTerminalReport } from '../../reporters/terminal.js';
import { startSpinner, stopSpinner } from '../ui/spinner.js';

export function makeSystemCommand(): Command {
  const cmd = new Command('system');
  cmd
    .description('Display system information')
    .action(async () => {
      startSpinner('Collecting system information…');
      const result = await scan({ modules: ['system'], format: 'table' });
      stopSpinner();
      renderTerminalReport(result);
    });
  return cmd;
}
