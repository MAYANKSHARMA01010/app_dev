# SysGuard — macOS Security & Network Auditing

SysGuard provides native, agent-less auditing for macOS systems (both Apple Silicon `arm64` and Intel `x64`). It interacts directly with built-in Apple security subsystems using standard system command-line interfaces.

---

## Native Security Controls Audited

SysGuard evaluates the following critical macOS defensive controls:

### 1. System Integrity Protection (SIP / rootless)
- **What it is**: Apple kernel-level protection preventing unauthorized modification of protected files, directories, and running processes (even by `root`).
- **Command queried**: `csrutil status`
- **Rule**: `mac-sip-status` (`CRITICAL`)
- **Remediation if FAIL**: Boot into macOS Recovery mode (hold power button on Apple Silicon), open Terminal, and run:
  ```bash
  csrutil enable
  ```

### 2. FileVault 2 Full Disk Encryption
- **What it is**: XTS-AES-128 volume encryption protecting stored data from offline extraction if the machine is lost or stolen.
- **Command queried**: `fdesetup status`
- **Rule**: `mac-filevault-encryption` (`HIGH`)
- **Remediation if FAIL**: Enable FileVault via System Settings ➔ Privacy & Security ➔ FileVault, or via terminal:
  ```bash
  sudo fdesetup enable
  ```

### 3. Gatekeeper App Assessment Subsystem
- **What it is**: macOS verification system enforcing code-signing, developer identity verification, and notarization checks before binaries can execute.
- **Command queried**: `spctl --status`
- **Rule**: `mac-gatekeeper-assessment` (`HIGH`)
- **Remediation if FAIL**: Re-enable Gatekeeper enforcement:
  ```bash
  sudo spctl --master-enable
  ```

### 4. macOS Application Firewall (ALF)
- **What it is**: Built-in socket filter firewall controlling inbound connections on a per-application and per-port basis.
- **Command queried**: `/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate`
- **Rule**: `mac-application-firewall` (`HIGH`)
- **Remediation if FAIL**: Enable Application Firewall:
  ```bash
  sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
  ```

### 5. Firewall Stealth Mode
- **What it is**: Prevents the computer from responding to unsolicited probing requests (like ICMP pings and port scans).
- **Command queried**: `/usr/libexec/ApplicationFirewall/socketfilterfw --getstealthmode`
- **Rule**: `mac-firewall-stealth-mode` (`MEDIUM`)
- **Remediation if WARN**: Turn on stealth mode:
  ```bash
  sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setstealthmode on
  ```

### 6. Local Administrator Privileges Audit
- **What it is**: Audits the Directory Services admin group (`/Groups/admin`) to detect account proliferation.
- **Command queried**: `dscl . -read /Groups/admin GroupMembership`
- **Rule**: `mac-admin-accounts` (`MEDIUM`)
- **Remediation if WARN**: Demote non-essential admin accounts in System Settings ➔ Users & Groups.

### 7. Listening Ports & Sockets Audit
- **What it is**: Scans all active TCP listening sockets, correlating local binding addresses (`127.0.0.1` vs `0.0.0.0`) with process names and PIDs.
- **Command queried**: `lsof -nP -iTCP -sTCP:LISTEN`
- **Rule**: `mac-listening-ports` (`HIGH`)
- **Remediation if WARN**: Close insecure or unencrypted listening services (FTP, Telnet, VNC, HTTP) or restrict bindings to localhost.

### 8. Automatic Security Updates
- **What it is**: Checks whether automatic security patch checks and downloads are enabled.
- **Command queried**: `defaults read /Library/Preferences/com.apple.SoftwareUpdate AutomaticCheckEnabled`
- **Rule**: `mac-auto-updates` (`MEDIUM`)
- **Remediation if WARN**: Enable automatic updates in System Settings ➔ General ➔ Software Update.

---

## Network Topology & Exposure Formulation

SysGuard parses network configuration using:
- `ifconfig`: Network interfaces (`en0`, `lo0`), MAC addresses, and active IPv4/IPv6 assignments.
- `arp -an`: Local subnet neighbors and hardware MAC addresses.

From this telemetry, SysGuard automatically formulates an interactive **Mermaid.js** graph:
- Maps host interfaces to local subnets
- Groups discovered neighbors under subnets
- Highlights exposed listening ports and processes

---

## Permission Guidance

| Command | Standard User | With `sudo` |
|---|---|---|
| `sysguard doctor` | Complete | Complete |
| `sysguard scan` | Complete (inspects user sockets) | Full (inspects system/root daemon sockets) |
| `sysguard report` | Complete | Complete |
| `sysguard security` | Complete | Complete |
| `sysguard network` | User-owned sockets & interfaces | All system daemon sockets |
