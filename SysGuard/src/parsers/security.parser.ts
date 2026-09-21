import type { SecurityInfo, FirewallRule } from '../types/system.js';
import type { SecurityRaw } from '../collectors/security.js';

export function parseSecurity(raw: SecurityRaw): SecurityInfo {
  // 1. SIP
  const sipRaw = raw.sip ?? '';
  const sipLower = sipRaw.toLowerCase();
  const sipEnabled = sipLower.includes('enabled') && !sipLower.includes('disabled');

  // 2. FileVault
  const fvRaw = raw.fileVault ?? '';
  const fvLower = fvRaw.toLowerCase();
  const fileVaultEnabled = fvLower.includes('is on') || fvLower.includes('enabled');

  // 3. Gatekeeper
  const gkRaw = raw.gatekeeper ?? '';
  const gkLower = gkRaw.toLowerCase();
  const gatekeeperEnabled = gkLower.includes('assessments enabled') || gkLower.includes('enabled');

  // 4. Application Firewall & Stealth
  const fwRaw = raw.firewallState ?? '';
  const fwLower = fwRaw.toLowerCase();
  const firewallEnabled = fwLower.includes('enabled') || fwLower.includes('state = 1');

  const stealthRaw = raw.firewallStealth ?? '';
  const stealthLower = stealthRaw.toLowerCase();
  const stealthEnabled = stealthLower.includes('is on') || stealthLower.includes('enabled');

  // 5. Admin Group
  let adminUsers: string[] = [];
  const adminRaw = raw.adminGroup ?? '';
  const adminMatch = adminRaw.match(/GroupMembership:\s*(.*)/i);
  if (adminMatch && adminMatch[1]) {
    adminUsers = adminMatch[1].trim().split(/\s+/).filter(Boolean);
  }

  // 6. Software Update
  const updateRaw = (raw.softwareUpdate ?? '').trim();
  const autoUpdate = updateRaw === '1' || updateRaw.toLowerCase() === 'true';

  // 7. Custom Application Firewall Rules
  const firewallRules: FirewallRule[] = [];
  if (raw.firewallApps) {
    const lines = raw.firewallApps.split('\n');
    let currentApp = '';
    for (const line of lines) {
      const appMatch = line.match(/^\d+\s*:\s*(.+)$/);
      if (appMatch && appMatch[1]) {
        currentApp = appMatch[1].trim();
      } else if (currentApp && line.includes('incoming connections')) {
        const isAllowed = line.toLowerCase().includes('allow');
        firewallRules.push({
          name: currentApp,
          displayName: currentApp.split('/').pop() ?? currentApp,
          enabled: true,
          direction: 'Inbound',
          action: isAllowed ? 'Allow' : 'Block',
          isOverlyPermissive: isAllowed,
        });
        currentApp = '';
      }
    }
  }

  return {
    macSecurity: {
      sip: { enabled: sipEnabled, raw: sipRaw.trim() },
      fileVault: { enabled: fileVaultEnabled, raw: fvRaw.trim() },
      gatekeeper: { enabled: gatekeeperEnabled, raw: gkRaw.trim() },
      firewall: {
        enabled: firewallEnabled,
        stealthMode: stealthEnabled,
        raw: fwRaw.trim(),
      },
      adminUsers,
      autoUpdate: { enabled: autoUpdate },
    },
    firewallRules,
  };
}
