// ---------------------------------------------------------------------------
// Internal debug / verbose logger
// ---------------------------------------------------------------------------

let _verbose = false;

export function setVerbose(v: boolean): void {
  _verbose = v;
}

export function isVerbose(): boolean {
  return _verbose;
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (_verbose) {
      const ts = new Date().toISOString();
      console.warn(`[DEBUG ${ts}] ${message}`, ...args);
    }
  },
  info(message: string, ...args: unknown[]): void {
    const ts = new Date().toISOString();
    console.info(`[INFO  ${ts}] ${message}`, ...args);
  },
  warn(message: string, ...args: unknown[]): void {
    const ts = new Date().toISOString();
    console.warn(`[WARN  ${ts}] ${message}`, ...args);
  },
  error(message: string, ...args: unknown[]): void {
    const ts = new Date().toISOString();
    console.error(`[ERROR ${ts}] ${message}`, ...args);
  },
};
