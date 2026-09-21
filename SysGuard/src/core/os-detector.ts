import os from 'node:os';

export type SupportedPlatform = 'darwin' | 'win32' | 'linux';

/**
 * Get the current OS platform.
 */
export function getPlatform(): SupportedPlatform {
  const p = os.platform();
  if (p === 'darwin' || p === 'win32' || p === 'linux') {
    return p;
  }
  return 'linux';
}

export function isMacOS(): boolean {
  return os.platform() === 'darwin';
}

export function isWindows(): boolean {
  return os.platform() === 'win32';
}

export function isLinux(): boolean {
  return os.platform() === 'linux';
}

export function getArch(): string {
  return os.arch();
}

export function getHostname(): string {
  return os.hostname();
}

export function getUptimeSeconds(): number {
  return os.uptime();
}

export function getTotalMemoryBytes(): number {
  return os.totalmem();
}

export interface BasicSystemInfo {
  hostname: string;
  platform: string;
  architecture: string;
  cpuModel?: string;
  memoryBytes: number;
  uptimeSeconds: number;
}

export function collectBasicSystemInfo(): BasicSystemInfo {
  const cpus = os.cpus();
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    cpuModel: cpus.length > 0 ? cpus[0]?.model : undefined,
    memoryBytes: os.totalmem(),
    uptimeSeconds: os.uptime(),
  };
}
