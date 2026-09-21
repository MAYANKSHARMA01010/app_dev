import chalk from 'chalk';

const VERSION = '1.0.0';

export function printBanner(): void {
  console.log('');
  console.log(chalk.bold.blue('  ███████╗██╗   ██╗███████╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ '));
  console.log(chalk.bold.blue('  ██╔════╝╚██╗ ██╔╝██╔════╝██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗'));
  console.log(chalk.bold.cyan('  ███████╗ ╚████╔╝ ███████╗██║  ███╗██║   ██║███████║██████╔╝██║  ██║'));
  console.log(chalk.bold.cyan('  ╚════██║  ╚██╔╝  ╚════██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║'));
  console.log(chalk.bold.blue('  ███████║   ██║   ███████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝'));
  console.log(chalk.bold.blue('  ╚══════╝   ╚═╝   ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ '));
  console.log('');
  console.log(`  ${chalk.gray('Agent-less macOS Security Vulnerability & Network Scanner')}`);
  console.log(`  ${chalk.gray('Version')} ${chalk.white(VERSION)} ${chalk.gray('•')} ${chalk.gray('Read-only • No telemetry • No cloud')}`);
  console.log('');
}

export function printVersion(): void {
  console.log(VERSION);
}
