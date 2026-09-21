import type { SystemInfo, OsInfo, HardwareInfo } from '../types/system.js';
import type { SystemRaw } from '../collectors/system.js';

export function parseSystemInfo(
  raw: SystemRaw,
  currentUser: string,
  isRoot: boolean
): SystemInfo {
  let osVersion = 'Unknown';
  let osBuild = '';

  for (const line of raw.swVers.split('\n')) {
    const [key, ...valParts] = line.split(':');
    const val = valParts.join(':').trim();
    if (key?.includes('ProductVersion')) osVersion = val;
    if (key?.includes('BuildVersion')) osBuild = val;
  }

  const os: OsInfo = {
    platform: 'darwin',
    version: osVersion,
    build: osBuild,
    architecture: process.arch,
  };

  const memoryBytes = parseInt(raw.memoryBytes.trim(), 10) || 0;
  const hardware: HardwareInfo = {
    cpu: raw.cpuBrand.trim() || 'Apple Silicon',
    memoryBytes,
    model: 'Apple Mac',
  };

  let uptimeSeconds = 0;
  const bootMatch = raw.bootTime.match(/sec\s*=\s*(\d+)/);
  if (bootMatch && bootMatch[1]) {
    const bootEpoch = parseInt(bootMatch[1], 10);
    uptimeSeconds = Math.max(0, Math.floor(Date.now() / 1000) - bootEpoch);
  } else {
    uptimeSeconds = Math.floor(process.uptime());
  }

  const hostname = raw.computerName.trim() || 'Mac';

  return {
    hostname,
    os,
    hardware,
    uptimeSeconds,
    currentUser,
    isRoot,
    localUsers: raw.localUsers,
    startupItems: raw.startupItems,
    userFolderItems: raw.userFolderItems,
    environmentVariables: raw.environmentVariables,
    pathSecurity: raw.pathSecurity,
  } as SystemInfo;
}
