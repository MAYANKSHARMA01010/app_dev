import os from 'node:os';
import type { PrivilegeInfo } from '../types/scan.js';

/**
 * Determine if the current process is running as root / administrator.
 * On POSIX: checks process.getuid() === 0.
 * On Windows: would check via PowerShell (Phase 2).
 */
export function isRoot(): boolean {
  if (process.platform === 'win32') {
    // Phase 2: use PowerShell to check for admin
    return false;
  }
  try {
    return process.getuid?.() === 0;
  } catch {
    return false;
  }
}

export function getCurrentUser(): string {
  return process.env['USER'] ?? process.env['USERNAME'] ?? os.userInfo().username ?? 'unknown';
}

export function getPrivilegeInfo(): PrivilegeInfo {
  const root = isRoot();
  const user = getCurrentUser();

  let note: string | undefined;
  if (!root) {
    note =
      'Some checks may return incomplete data without root/administrator privileges. ' +
      'Run with sudo to collect full security information.';
  }

  return { isRoot: root, currentUser: user, note };
}
