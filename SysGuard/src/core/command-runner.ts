import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { CollectorResult } from '../types/collector.js';
import { ok, permissionDenied, failed } from '../types/collector.js';
import { isPermissionDenied } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const execFileAsync = promisify(execFile);

export interface RunOptions {
  /** Timeout in milliseconds. Default: 15 000 */
  timeoutMs?: number;
  /** Max stdout buffer size. Default: 5 MB */
  maxBuffer?: number;
}

/**
 * Run a command safely using execFile (no shell). Takes a fixed binary path
 * and a fixed argument array — never interpolates user-controlled strings.
 *
 * @param binary  Absolute path or name of the binary
 * @param args    Fixed argument array
 * @param options Runtime options
 */
export async function runCommand(
  binary: string,
  args: readonly string[],
  options: RunOptions = {}
): Promise<CollectorResult<string>> {
  const { timeoutMs = 15_000, maxBuffer = 5 * 1024 * 1024 } = options;
  const displayCmd = `${binary} ${args.join(' ')}`;

  logger.debug(`Running: ${displayCmd}`);

  try {
    const { stdout, stderr } = await execFileAsync(binary, args as string[], {
      timeout: timeoutMs,
      maxBuffer,
      // Never use shell: true
      shell: false,
      // Strip extra environment variables — use minimal env
      env: {
        PATH: process.env['PATH'] ?? '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
        HOME: process.env['HOME'] ?? '',
        USER: process.env['USER'] ?? '',
        LANG: 'en_US.UTF-8',
      },
    });

    const output = stdout.trim();
    const errOutput = stderr.trim();

    if (isPermissionDenied(errOutput) || isPermissionDenied(output)) {
      logger.debug(`Permission denied for: ${displayCmd}`);
      return permissionDenied<string>(
        `Permission denied when running: ${displayCmd}`
      );
    }

    logger.debug(`Success: ${displayCmd} (${output.length} bytes)`);
    return ok(output);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    const message = error.message ?? '';

    if (isPermissionDenied(message)) {
      return permissionDenied<string>(`Permission denied: ${displayCmd}`);
    }

    // ETIMEDOUT / ENOENT / non-zero exit etc.
    logger.debug(`Failed: ${displayCmd} — ${message}`);
    return failed<string>(error, `Command failed: ${displayCmd} — ${message}`);
  }
}

/**
 * Run multiple commands and merge the results. Returns the first success, or
 * the last failure result if all fail.
 */
export async function runFirstSuccessful(
  commands: Array<{ binary: string; args: readonly string[] }>,
  options: RunOptions = {}
): Promise<CollectorResult<string>> {
  let lastResult: CollectorResult<string> | null = null;
  for (const { binary, args } of commands) {
    const result = await runCommand(binary, args, options);
    if (result.status === 'success' && result.data) {
      return result;
    }
    lastResult = result;
  }
  return lastResult ?? failed<string>(new Error('No commands provided'));
}
