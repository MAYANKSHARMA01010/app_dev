// ---------------------------------------------------------------------------
// SysGuard custom error class
// ---------------------------------------------------------------------------
export class SysGuardError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'SysGuardError';
    this.code = code;
    this.context = context;
    // Capture stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SysGuardError);
    }
  }
}

export class CollectorError extends SysGuardError {
  constructor(message: string, collector: string, cause?: Error) {
    super(message, 'COLLECTOR_ERROR', { collector, cause: cause?.message });
    this.name = 'CollectorError';
  }
}

export class UnsupportedPlatformError extends SysGuardError {
  constructor(platform: string, feature: string) {
    super(
      `Feature "${feature}" is not supported on platform "${platform}"`,
      'UNSUPPORTED_PLATFORM',
      { platform, feature }
    );
    this.name = 'UnsupportedPlatformError';
  }
}

export class PermissionDeniedError extends SysGuardError {
  constructor(command: string) {
    super(
      `Permission denied when running: ${command}`,
      'PERMISSION_DENIED',
      { command }
    );
    this.name = 'PermissionDeniedError';
  }
}

/** Safely extract an error message from any thrown value */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}

/** Check if a command output or error indicates permission denial */
export function isPermissionDenied(output: string): boolean {
  const lower = output.toLowerCase();
  return (
    lower.includes('permission denied') ||
    lower.includes('operation not permitted') ||
    lower.includes('not authorized') ||
    lower.includes('authorization required')
  );
}
