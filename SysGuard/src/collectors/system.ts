import { readdirSync, statSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { homedir } from 'node:os';
import { runCommand } from '../core/command-runner.js';
import { ok, failed } from '../types/collector.js';
import type { CollectorResult } from '../types/collector.js';
import type { StartupItem, UserFolderItem, EnvironmentVariable, LocalUser } from '../types/system.js';

export interface SystemRaw {
  swVers: string;
  cpuBrand: string;
  memoryBytes: string;
  bootTime: string;
  computerName: string;
  startupItems: StartupItem[];
  userFolderItems: UserFolderItem[];
  environmentVariables: EnvironmentVariable[];
  pathSecurity: Array<{ path: string; isWritableByUsers: boolean }>;
  localUsers: LocalUser[];
}

const RISKY_EXTENSIONS = new Set([
  '.sh', '.command', '.app', '.pkg', '.dmg', '.py', '.terminal', '.action',
  '.workflow', '.scpt', '.applescript', '.jar', '.bin', '.exe',
]);

function collectLaunchItems(dirPath: string, locationType: string): StartupItem[] {
  const items: StartupItem[] = [];
  try {
    const files = readdirSync(dirPath);
    for (const file of files) {
      if (file.endsWith('.plist')) {
        items.push({
          name: file.replace(/\.plist$/, ''),
          command: join(dirPath, file),
          location: locationType,
          user: locationType.includes('User') ? 'currentUser' : 'root',
        });
      }
    }
  } catch {
    // Ignore unreadable dirs
  }
  return items;
}

function collectUserFolderFiles(folderName: 'Downloads' | 'Documents' | 'Desktop'): UserFolderItem[] {
  const items: UserFolderItem[] = [];
  const home = homedir();
  const targetDir = resolve(home, folderName);

  try {
    const entries = readdirSync(targetDir, { withFileTypes: true });
    for (const entry of entries.slice(0, 40)) {
      const ext = extname(entry.name).toLowerCase();
      let sizeBytes = 0;
      try {
        if (entry.isFile()) {
          sizeBytes = statSync(join(targetDir, entry.name)).size;
        }
      } catch {
        // stat failed, skip
      }

      items.push({
        folder: folderName,
        name: entry.name,
        extension: ext,
        sizeBytes,
        isRiskyExtension: RISKY_EXTENSIONS.has(ext),
      });
    }
  } catch {
    // Permission or directory not found
  }

  return items;
}

function auditPathDirectories(): Array<{ path: string; isWritableByUsers: boolean }> {
  const pathVal = process.env['PATH'] ?? '';
  const dirs = pathVal.split(':').filter(Boolean);
  const results: Array<{ path: string; isWritableByUsers: boolean }> = [];

  for (const dir of dirs) {
    let isWritable = false;
    try {
      const st = statSync(dir);
      isWritable = (st.mode & 0o002) !== 0;
    } catch {
      // Directory doesn't exist or not readable
    }
    results.push({ path: dir, isWritableByUsers: isWritable });
  }

  return results;
}

export async function collectSystemRaw(): Promise<CollectorResult<SystemRaw>> {
  try {
    const [swResult, cpuResult, memResult, bootResult, nameResult, usersResult] = await Promise.all([
      runCommand('sw_vers', []),
      runCommand('sysctl', ['-n', 'machdep.cpu.brand_string']),
      runCommand('sysctl', ['-n', 'hw.memsize']),
      runCommand('sysctl', ['-n', 'kern.boottime']),
      runCommand('scutil', ['--get', 'ComputerName']),
      runCommand('dscl', ['.', '-list', '/Users', 'UniqueID']),
    ]);

    const home = homedir();
    const startupItems: StartupItem[] = [
      ...collectLaunchItems('/Library/LaunchDaemons', '/Library/LaunchDaemons (System Daemon)'),
      ...collectLaunchItems('/Library/LaunchAgents', '/Library/LaunchAgents (Global Agent)'),
      ...collectLaunchItems(join(home, 'Library/LaunchAgents'), '~/Library/LaunchAgents (User Agent)'),
    ];

    const userFolderItems: UserFolderItem[] = [
      ...collectUserFolderFiles('Downloads'),
      ...collectUserFolderFiles('Documents'),
      ...collectUserFolderFiles('Desktop'),
    ];

    const environmentVariables: EnvironmentVariable[] = Object.entries(process.env).map(([k, v]) => ({
      name: k,
      value: v ?? '',
      scope: 'Process',
    }));

    const pathSecurity = auditPathDirectories();

    const localUsers: LocalUser[] = [];
    if (usersResult.data) {
      for (const line of usersResult.data.split('\n')) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const uName = parts[0] ?? '';
          const uid = parseInt(parts[1] ?? '0', 10);
          if (uid >= 500 && !uName.startsWith('_')) {
            localUsers.push({
              name: uName,
              enabled: true,
              lastLogon: null,
            });
          }
        }
      }
    }

    const data: SystemRaw = {
      swVers: swResult.data ?? '',
      cpuBrand: cpuResult.data ?? '',
      memoryBytes: memResult.data ?? '',
      bootTime: bootResult.data ?? '',
      computerName: nameResult.data ?? '',
      startupItems,
      userFolderItems,
      environmentVariables,
      pathSecurity,
      localUsers,
    };

    return ok(data);
  } catch (err) {
    return failed(err as Error);
  }
}
