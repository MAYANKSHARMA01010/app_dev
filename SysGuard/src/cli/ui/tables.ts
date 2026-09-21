import Table from 'cli-table3';
import chalk from 'chalk';

export function makeTable(head: string[], rows: string[][]): string {
  const t = new Table({
    head: head.map((h) => chalk.gray(h)),
    style: { head: [], border: ['gray'] },
  });
  for (const row of rows) {
    t.push(row);
  }
  return t.toString();
}
