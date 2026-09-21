import chalk from 'chalk';

export function renderProgress(step: string, current: number, total: number): void {
  const pct = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 20);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
  process.stdout.write(
    `\r  ${chalk.cyan(bar)} ${chalk.gray(`${pct}%`)} ${chalk.white(step)}   `
  );
  if (current >= total) {
    process.stdout.write('\n');
  }
}
