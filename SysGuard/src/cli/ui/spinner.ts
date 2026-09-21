import ora, { type Ora } from 'ora';
import chalk from 'chalk';

let _spinner: Ora | null = null;

export function startSpinner(text: string): void {
  _spinner = ora({
    text: chalk.gray(text),
    spinner: 'dots',
    color: 'cyan',
  }).start();
}

export function updateSpinner(text: string): void {
  if (_spinner) {
    _spinner.text = chalk.gray(text);
  }
}

export function succeedSpinner(text: string): void {
  _spinner?.succeed(chalk.green(text));
  _spinner = null;
}

export function failSpinner(text: string): void {
  _spinner?.fail(chalk.red(text));
  _spinner = null;
}

export function stopSpinner(): void {
  _spinner?.stop();
  _spinner = null;
}
