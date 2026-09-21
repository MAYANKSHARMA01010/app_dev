import { runCommand } from '../core/command-runner.js';
import { ok, failed } from '../types/collector.js';
import type { CollectorResult } from '../types/collector.js';

export interface SecurityRaw {
  sip: string;
  fileVault: string;
  gatekeeper: string;
  firewallState: string;
  firewallStealth: string;
  adminGroup: string;
  softwareUpdate: string;
  firewallApps: string;
}

export async function collectSecurityRaw(): Promise<CollectorResult<SecurityRaw>> {
  try {
    const [
      sipRes,
      fvRes,
      spRes,
      fwStateRes,
      fwStealthRes,
      adminRes,
      swUpdRes,
      fwAppsRes,
    ] = await Promise.all([
      runCommand('csrutil', ['status']),
      runCommand('fdesetup', ['status']),
      runCommand('spctl', ['--status']),
      runCommand('/usr/libexec/ApplicationFirewall/socketfilterfw', ['--getglobalstate']),
      runCommand('/usr/libexec/ApplicationFirewall/socketfilterfw', ['--getstealthmode']),
      runCommand('dscl', ['.', '-read', '/Groups/admin', 'GroupMembership']),
      runCommand('defaults', ['read', '/Library/Preferences/com.apple.SoftwareUpdate', 'AutomaticCheckEnabled']),
      runCommand('/usr/libexec/ApplicationFirewall/socketfilterfw', ['--listapps']),
    ]);

    const data: SecurityRaw = {
      sip: sipRes.data ?? '',
      fileVault: fvRes.data ?? '',
      gatekeeper: spRes.data ?? '',
      firewallState: fwStateRes.data ?? '',
      firewallStealth: fwStealthRes.data ?? '',
      adminGroup: adminRes.data ?? '',
      softwareUpdate: swUpdRes.data ?? '',
      firewallApps: fwAppsRes.data ?? '',
    };
    return ok(data);
  } catch (err) {
    return failed(err as Error);
  }
}
