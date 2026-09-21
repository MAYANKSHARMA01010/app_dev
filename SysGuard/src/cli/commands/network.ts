import { Command } from 'commander';
import { scan } from '../../core/scanner.js';
import { renderTerminalReport } from '../../reporters/terminal.js';
import { startSpinner, stopSpinner } from '../ui/spinner.js';

export function makeNetworkCommand(): Command {
  const cmd = new Command('network');
  cmd
    .description('Display network information and listening ports')
    .action(async () => {
      startSpinner('Collecting network information…');
      const result = await scan({ modules: ['system', 'network'], format: 'table' });
      stopSpinner();
      renderTerminalReport(result);
    });
  return cmd;
}
