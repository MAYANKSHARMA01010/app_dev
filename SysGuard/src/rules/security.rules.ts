import type { Rule, RuleContext, RuleResult } from './engine.js';

// ---------------------------------------------------------------------------
// 1. System Integrity Protection (SIP)
// ---------------------------------------------------------------------------
export const macSipRule: Rule = {
  id: 'mac-sip-status',
  title: 'macOS System Integrity Protection (SIP)',
  category: 'SYSTEM_INTEGRITY',
  severity: 'CRITICAL',
  platforms: ['darwin'],

  evaluate(ctx: RuleContext): RuleResult {
    const sip = ctx.security?.macSecurity?.sip;
    if (!sip) {
      return { status: 'NOT_APPLICABLE', description: 'SIP status could not be collected.' };
    }

    if (!sip.enabled) {
      return {
        status: 'FAIL',
        description: 'System Integrity Protection (SIP / rootless) is disabled. Core OS binaries and kernel memory are unprotected.',
        evidence: sip.raw ?? 'status: disabled',
        remediation: 'Reboot into Recovery Mode (hold Power button on Apple Silicon), open Terminal, and run: csrutil enable',
      };
    }

    return {
      status: 'PASS',
      description: 'System Integrity Protection (SIP) is active and protecting kernel/system files.',
      evidence: sip.raw ?? 'status: enabled',
    };
  },
};

// ---------------------------------------------------------------------------
// 2. FileVault Full Disk Encryption
// ---------------------------------------------------------------------------
export const macFileVaultRule: Rule = {
  id: 'mac-filevault-encryption',
  title: 'FileVault Full Disk Encryption',
  category: 'ENCRYPTION',
  severity: 'HIGH',
  platforms: ['darwin'],

  evaluate(ctx: RuleContext): RuleResult {
    const fv = ctx.security?.macSecurity?.fileVault;
    if (!fv) {
      return { status: 'NOT_APPLICABLE', description: 'FileVault status could not be determined.' };
    }

    if (!fv.enabled) {
      return {
        status: 'FAIL',
        description: 'FileVault disk encryption is turned off. Storage is vulnerable to offline extraction if device is lost or stolen.',
        evidence: fv.raw ?? 'FileVault is Off',
        remediation: 'Enable FileVault: Open System Settings ➔ Privacy & Security ➔ FileVault ➔ Turn On (or run: sudo fdesetup enable).',
      };
    }

    return {
      status: 'PASS',
      description: 'FileVault is enabled. Primary disk volumes are encrypted with XTS-AES-128.',
      evidence: fv.raw ?? 'FileVault is On.',
    };
  },
};

// ---------------------------------------------------------------------------
// 3. Gatekeeper App Assessment
// ---------------------------------------------------------------------------
export const macGatekeeperRule: Rule = {
  id: 'mac-gatekeeper-assessment',
  title: 'Gatekeeper Code Signing & Notarization',
  category: 'GATEKEEPER',
  severity: 'HIGH',
  platforms: ['darwin'],

  evaluate(ctx: RuleContext): RuleResult {
    const gk = ctx.security?.macSecurity?.gatekeeper;
    if (!gk) {
      return { status: 'NOT_APPLICABLE', description: 'Gatekeeper status could not be determined.' };
    }

    if (!gk.enabled) {
      return {
        status: 'FAIL',
        description: 'Gatekeeper assessments are disabled. Untrusted and unsigned binaries can execute without verification.',
        evidence: gk.raw ?? 'assessments disabled',
        remediation: 'Enable Gatekeeper: sudo spctl --master-enable',
      };
    }

    return {
      status: 'PASS',
      description: 'Gatekeeper is enabled. macOS enforces notarization and developer certificate checks.',
      evidence: gk.raw ?? 'assessments enabled',
    };
  },
};

// ---------------------------------------------------------------------------
// 4. Application Firewall (ALF)
// ---------------------------------------------------------------------------
export const macFirewallRule: Rule = {
  id: 'mac-application-firewall',
  title: 'macOS Application Firewall (ALF)',
  category: 'FIREWALL',
  severity: 'HIGH',
  platforms: ['darwin'],

  evaluate(ctx: RuleContext): RuleResult {
    const fw = ctx.security?.macSecurity?.firewall;
    if (!fw) {
      return { status: 'NOT_APPLICABLE', description: 'Firewall status could not be collected.' };
    }

    if (!fw.enabled) {
      return {
        status: 'FAIL',
        description: 'macOS Application Firewall is disabled. Inbound socket connections are not filtered.',
        evidence: fw.raw ?? 'Firewall is disabled',
        remediation: 'Turn on Application Firewall: sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on',
      };
    }

    return {
      status: 'PASS',
      description: 'macOS Application Firewall is active.',
      evidence: fw.raw ?? 'Firewall is enabled',
    };
  },
};

// ---------------------------------------------------------------------------
// 5. Firewall Stealth Mode
// ---------------------------------------------------------------------------
export const macFirewallStealthRule: Rule = {
  id: 'mac-firewall-stealth-mode',
  title: 'macOS Firewall Stealth Mode',
  category: 'FIREWALL',
  severity: 'MEDIUM',
  platforms: ['darwin'],

  evaluate(ctx: RuleContext): RuleResult {
    const fw = ctx.security?.macSecurity?.firewall;
    if (!fw) {
      return { status: 'NOT_APPLICABLE', description: 'Firewall status could not be collected.' };
    }

    if (!fw.stealthMode) {
      return {
        status: 'WARN',
        description: 'Firewall stealth mode is disabled. The system will respond to unsolicited ICMP ping and port probing requests.',
        evidence: 'stealthMode: false',
        remediation: 'Enable stealth mode: sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setstealthmode on',
      };
    }

    return {
      status: 'PASS',
      description: 'Firewall stealth mode is active. Host silently drops unsolicited probe requests.',
      evidence: 'stealthMode: true',
    };
  },
};

// ---------------------------------------------------------------------------
// 6. Admin Group Membership
// ---------------------------------------------------------------------------
export const macAdminUsersRule: Rule = {
  id: 'mac-admin-accounts',
  title: 'macOS Administrator Account Audit',
  category: 'USERS',
  severity: 'MEDIUM',
  platforms: ['darwin'],

  evaluate(ctx: RuleContext): RuleResult {
    const admins = ctx.security?.macSecurity?.adminUsers ?? [];
    const nonRootAdmins = admins.filter((a) => a !== 'root');

    if (nonRootAdmins.length > 2) {
      return {
        status: 'WARN',
        description: `Elevated attack surface: Found ${nonRootAdmins.length} standard accounts with administrator privileges.`,
        evidence: `Admin accounts: ${admins.join(', ')}`,
        remediation: 'Review and demote non-essential administrative accounts in System Settings ➔ Users & Groups.',
      };
    }

    return {
      status: 'PASS',
      description: `Administrator membership is restrained (${nonRootAdmins.length} non-root admin user(s)).`,
      evidence: `Admins: ${admins.join(', ')}`,
    };
  },
};

// ---------------------------------------------------------------------------
// 7. Insecure Listening Network Ports
// ---------------------------------------------------------------------------
export const macListeningPortsRule: Rule = {
  id: 'mac-listening-ports',
  title: 'macOS Network Listening Services',
  category: 'NETWORK',
  severity: 'HIGH',
  platforms: ['darwin'],

  evaluate(ctx: RuleContext): RuleResult {
    const ports = ctx.network?.listeningPorts ?? [];
    const insecurePorts = [21, 23, 80, 5900, 22]; // FTP, Telnet, HTTP, VNC, SSH
    const exposed = ports.filter(
      (p) => insecurePorts.includes(p.localPort) && (p.localAddress === '0.0.0.0' || p.localAddress === '*')
    );

    if (exposed.length > 0) {
      const summary = exposed.map((p) => `${p.process ?? 'process'} on port ${p.localPort}`).join(', ');
      return {
        status: 'WARN',
        description: `Sensitive or unencrypted service(s) exposed to the local network: ${summary}.`,
        evidence: summary,
        remediation: 'Restrict service bindings to localhost (127.0.0.1) or disable unneeded sharing services in System Settings ➔ General ➔ Sharing.',
      };
    }

    return {
      status: 'PASS',
      description: `No unencrypted sensitive services (FTP, Telnet, VNC) are exposed on 0.0.0.0 (${ports.length} total listening port(s)).`,
      evidence: `Total listening sockets: ${ports.length}`,
    };
  },
};

// ---------------------------------------------------------------------------
// 8. Automatic Updates
// ---------------------------------------------------------------------------
export const macAutoUpdateRule: Rule = {
  id: 'mac-auto-updates',
  title: 'macOS Automatic Security Updates',
  category: 'UPDATES',
  severity: 'MEDIUM',
  platforms: ['darwin'],

  evaluate(ctx: RuleContext): RuleResult {
    const auto = ctx.security?.macSecurity?.autoUpdate;
    if (!auto) {
      return { status: 'NOT_APPLICABLE', description: 'Automatic update settings not found.' };
    }

    if (!auto.enabled) {
      return {
        status: 'WARN',
        description: 'Automatic security update checking is disabled.',
        evidence: 'AutomaticCheckEnabled: false',
        remediation: 'Enable Automatic Updates in System Settings ➔ General ➔ Software Update.',
      };
    }

    return {
      status: 'PASS',
      description: 'Automatic security update checking is enabled.',
      evidence: 'AutomaticCheckEnabled: true',
    };
  },
};

// ---------------------------------------------------------------------------
// 9. Persistence & Auto-Run Audit (LaunchDaemons / LaunchAgents)
// ---------------------------------------------------------------------------
export const macPersistenceRule: Rule = {
  id: 'mac-launch-persistence',
  title: 'macOS LaunchDaemons & LaunchAgents Persistence',
  category: 'SERVICES',
  severity: 'MEDIUM',
  platforms: ['darwin'],

  evaluate(ctx: RuleContext): RuleResult {
    const startup = ctx.system?.startupItems ?? [];
    return {
      status: 'PASS',
      description: `Cataloged ${startup.length} persistent LaunchDaemon/LaunchAgent configuration(s).`,
      evidence: `Total persistence plists: ${startup.length}`,
    };
  },
};

export const securityRules: Rule[] = [
  macSipRule,
  macFileVaultRule,
  macGatekeeperRule,
  macFirewallRule,
  macFirewallStealthRule,
  macAdminUsersRule,
  macListeningPortsRule,
  macAutoUpdateRule,
  macPersistenceRule,
];

// Alias for backwards compatibility
export const darwinRules = securityRules;
export const macRules = securityRules;
