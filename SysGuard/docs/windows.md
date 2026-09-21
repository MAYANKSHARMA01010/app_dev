# SysGuard — Windows Support

## Requirements

- Windows 10 (version 1903+) or Windows 11
- Node.js 18 or later
- PowerShell 5.1 or later (included in all modern Windows)
- Administrator privileges for full results (some checks require elevation)

## Installation

```powershell
# Clone and install dependencies
git clone https://github.com/MAYANKSHARMA01010/SysGuard.git
cd SysGuard
npm install
npm run build
```

## Running on Windows

Open PowerShell **as Administrator** for complete results:

```powershell
# Run full audit
node dist/cli/index.js scan

# Check environment
node dist/cli/index.js doctor

# System information
node dist/cli/index.js system

# Security controls
node dist/cli/index.js security

# Network information
node dist/cli/index.js network

# List findings
node dist/cli/index.js findings

# Generate JSON + HTML report
node dist/cli/index.js report --output report.html
```

## Windows Security Checks

| Check | PowerShell Cmdlet | Severity |
|---|---|---|
| Firewall — Domain Profile | `Get-NetFirewallProfile` | HIGH |
| Firewall — Private Profile | `Get-NetFirewallProfile` | HIGH |
| Firewall — Public Profile | `Get-NetFirewallProfile` | HIGH |
| Defender — Antivirus | `Get-MpComputerStatus` | HIGH |
| Defender — Real-Time Protection | `Get-MpComputerStatus` | HIGH |
| Secure Boot | `Confirm-SecureBootUEFI` | MEDIUM |
| Remote Desktop (RDP) | Registry `fDenyTSConnections` | MEDIUM |
| User Account Control (UAC) | Registry `EnableLUA` | HIGH |
| Windows Updates (last hotfix age) | `Get-HotFix` | LOW |
| PowerShell History — Secret Patterns | PSReadLine history file | HIGH |

## Network Checks (Windows)

- Network adapters (`Get-NetAdapter`)
- IP configuration (`Get-NetIPConfiguration`)
- ARP / neighbor table (`Get-NetNeighbor`)
- TCP listening ports and established connections (`Get-NetTCPConnection`)
- UDP endpoints (`Get-NetUDPEndpoint`)
- DNS client cache (`Get-DnsClientCache`)
- SMB shares (`Get-SmbShare`)
- Network connection profiles (`Get-NetConnectionProfile`)

## Doctor Command on Windows

```powershell
node dist/cli/index.js doctor
```

Checks availability of:
- All required PowerShell cmdlets
- Administrator/elevated status
- Node.js version

## PowerShell History Scanning

SysGuard scans the PSReadLine history file for patterns like:

```
password=  passwd=  api_key=  secret=  token=  authorization:  bearer
-Password  ConvertTo-SecureString
```

**Important privacy guarantees:**
- Only the **line number** and **pattern name** are reported
- The actual matched value is **NEVER** stored or reported
- The history file content is **never** written to JSON output or HTML reports
- A finding shows `[REDACTED]` where a value would be

## Permission Considerations

| Check | Requires Admin? |
|---|---|
| Firewall profiles | No |
| Windows Defender | No |
| Secure Boot | No (may fail on some systems) |
| RDP registry | No |
| UAC registry | No |
| Local users | No |
| Services | No |
| Installed software | No |
| Network data | No |
| Process list | No (elevated for full path info) |
| PowerShell history | No (current user only) |

## Known Limitations

- **Secure Boot**: Returns `NOT_APPLICABLE` on legacy BIOS systems
- **Defender**: Returns `WARN` (not FAIL) if `Get-MpComputerStatus` is unavailable — indicates a third-party AV may be in use
- **RDP**: Reported as `WARN` (not `FAIL`) — RDP may be intentionally enabled in enterprise environments
- **UAC no-prompt mode**: `ConsentPromptBehaviorAdmin = 0` produces `WARN` not `FAIL`
- **PS History**: Only scans the current user's PSReadLine history file
- **Startup items**: Collected but not evaluated by rules in Phase 2 (informational only)
- **Services / Processes**: Collected but not evaluated by rules in Phase 2 (informational only)
