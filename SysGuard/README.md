# SysGuard

**Agent-less Windows System Vulnerability and Network Scanner**

SysGuard is a read-only, agent-less Windows security and vulnerability auditing CLI tool that maps potential misconfigurations, security posture, and network exposure — without installing agents, without cloud dependencies, and without performing destructive actions.

> ⚠️ **SysGuard is a read-only security observation tool.** It does not exploit vulnerabilities, modify system registry settings, terminate processes, disable security protections, or alter network configurations.

---

## Features

- **Agent-less Architecture**: Uses native PowerShell and CIM/WMI queries with zero persistent agents or background services.
- **AV/EDR Friendly**: Safe, read-only queries with low resource consumption.
- **Windows System Auditing**:
  - Windows Defender status (Antivirus, Antispyware, Real-time protection, Signature age, Exclusions)
  - AMSI registered providers & DLL verification
  - Windows Firewall profiles (Domain, Private, Public)
  - Secure Boot configuration (UEFI vs BIOS detection)
  - User Account Control (UAC) policy settings
  - Remote Desktop (RDP) state, session security, and network level authentication
  - Installed software inventory (32-bit & 64-bit registry keys)
  - .NET Framework and .NET Core runtime detection
  - Trusted Root and Intermediate Certificate store audit
  - System `%PATH%` SDDL directory permission analysis (DLL hijacking check)
  - Local users & group memberships (Administrators, Remote Desktop Users)
  - Startup programs (Win32_StartupCommand and Registry Run keys)
  - Installed hotfixes and patch recency
  - NTLMv1/LM authentication vulnerability check
  - Sysmon service/driver detection & advanced audit policies
  - PowerShell console history regex search with automatic token/credential redaction
- **Network Level Auditing**:
  - Network adapters, IPv4/IPv6 configuration, and default gateways
  - Neighbor ARP cache table
  - TCP listening ports and established connections with PID-to-process/service mapping
  - UDP endpoints
  - Exposed SMB shares
  - DNS client cache entries
  - RPC endpoint mapping
- **Automated Network Topology Formulation**:
  - Formulates structured network graphs with node classifications
  - Synthesizes interactive Mermaid.js diagrams directly into audit reports
- **Defensive Vulnerability & Exploit Crawler**:
  - Correlates installed software versions and missing KBs against known high-risk CVEs (PrintNightmare, BlueKeep, Zerologon, Follina, WinRAR, Chrome WebP, Outlook NTLM, Storm-0978)
  - Integrates with live CISA Known Exploited Vulnerabilities (KEV) catalog with automatic offline fallback
  - Highlights public exploit availability (Exploit-DB, Metasploit, GitHub PoC) and direct MSRC patch URLs
  - 100% defensive: zero payload execution or weaponization
- **Multi-Format Reporting**:
  - Colorized Terminal dashboard with risk score and topology stats
  - Machine-readable structured JSON
  - Interactive dark-mode HTML report with embedded Mermaid topology graph and CVE database
  - Agent-less native **PDF export** via headless Microsoft Edge or Chrome

---

## Requirements

- Node.js ≥ 18
- Windows 10 / 11 (PowerShell 5.1+ / 7+)
- Administrator privileges recommended for full data collection

---

## Installation

```bash
git clone https://github.com/MAYANKSHARMA01010/SysGuard.git
cd SysGuard
npm install
npm run build
```

### Link globally (optional)

```bash
npm link
sysguard --version
```

### Run without building (Dev Mode)

```bash
npx tsx src/cli/index.ts <command>
```

---

## Usage

### Full security and network audit (terminal table)

```bash
sysguard scan
```

### Full audit with JSON output

```bash
sysguard scan --format json
```

### Full audit with HTML report output

```bash
sysguard scan --format html --output reports/scan.html
```

### Full audit with native PDF report output

```bash
sysguard scan --format pdf --output reports/scan.pdf
```

### Scan in air-gapped / offline mode (disable online KEV crawler)

```bash
sysguard scan --no-crawl
```

### Generate multi-format report bundle (HTML, JSON, PDF)

```bash
sysguard report
sysguard report --output reports/ --name audit-report
```

### Audit specific modules

```bash
sysguard system       # System information & software inventory only
sysguard security     # Security controls & findings only
sysguard network      # Network interfaces, ports, topology & shares only
sysguard findings     # Security findings summary only
```

### Verify environment and cmdlet readiness

```bash
sysguard doctor
```

---

## CLI Options

| Flag | Description | Default |
|------|-------------|---------|
| `--format <format>` | Output format: `table`, `json`, `html`, `pdf` | `table` |
| `--output <file>` | Write report to file path | stdout |
| `--modules <list>` | Comma-separated: `system,security,network` | all |
| `--no-crawl` | Disable online CISA KEV vulnerability feed crawler | off (crawl enabled) |
| `--verbose` | Enable debug logging | off |

---

## Windows Security Checks & Rules

| Check | Severity | Description |
|-------|----------|-------------|
| Defender Antivirus | CRITICAL | Microsoft Defender Antivirus disabled |
| Defender Real-time Protection | HIGH | Real-time protection disabled |
| Defender Exclusions | HIGH | Broad or dangerous Defender exclusions configured |
| AMSI Provider Tampering | HIGH | Unverified or missing AMSI providers detected |
| Windows Firewall (Domain) | HIGH | Domain firewall profile disabled |
| Windows Firewall (Private) | HIGH | Private firewall profile disabled |
| Windows Firewall (Public) | HIGH | Public firewall profile disabled |
| Secure Boot | HIGH | Secure Boot disabled on supported UEFI |
| User Account Control (UAC) | HIGH | UAC disabled or set to no prompt |
| Remote Desktop (RDP) | MEDIUM | RDP enabled without restriction |
| Patch Freshness | MEDIUM | No hotfixes installed within 30 days |
| %PATH% SDDL Permissions | HIGH | Unprivileged write permissions on directories in `%PATH%` |
| Insecure NTLMv1 | HIGH | Insecure NTLMv1/LM authentication allowed |
| Local Admin Over-Privilege | MEDIUM | Excessive non-standard members in local Administrators group |
| PowerShell History | HIGH | Plain-text credentials or API tokens found in PSReadLine history |
| Weaponized CVE Found | CRITICAL | Installed software or missing KB matches a weaponized CVE |

---

## SysGuard Risk Score

The SysGuard Risk Score starts at **100** and deducts points per FAIL finding:

| Severity | Deduction |
|----------|-----------|
| CRITICAL | −20 |
| HIGH | −12 |
| MEDIUM | −6 |
| LOW | −2 |
| INFO | 0 |

---

## Output Formats

### 1. Terminal (Default)
Color-coded tables with status indicators, severity badges, remediation guidance, vulnerability CVSS scores, network topology statistics, and overall risk posture score.

### 2. JSON
Normalized, machine-readable output suitable for SIEM, Splunk, or pipeline ingestion (internal raw outputs are stripped).

### 3. HTML
Self-contained, dark-themed responsive audit report containing:
- Scan metadata & execution parameters
- Operating system details & hardware summary
- Aggregate risk summary cards
- Interactive **Mermaid.js** network topology diagram
- Vulnerability intelligence table with exploit sources and MSRC patch links
- Detailed security findings with evidence and remediation steps
- Listening ports, DNS cache, and software inventory tables

### 4. PDF
Clean, self-contained printable report automatically generated using native headless Microsoft Edge (`msedge.exe`) or Chrome without requiring external heavyweight PDF engines.

---

## Testing

SysGuard uses [Vitest](https://vitest.dev/) with static JSON/CIM fixtures from `tests/fixtures/windows/`. Tests run on any operating system without requiring a live Windows environment.

```bash
npm test
npm run test:coverage
```

---

## Privacy & Security

- **100% read-only**: No system changes, registry writes, or modifications are performed.
- **Zero persistent footprint**: No agents, services, or kernel drivers are installed.
- **Air-gap capable**: Offline CVE signature database allows vulnerability mapping without Internet connectivity.
- **Credential redaction**: Sensitive credentials, passwords, and API keys in PowerShell command history are proactively scrubbed using regex patterns before storage or reporting.

---

## Architecture

```
src/
  cli/           → Commander.js CLI commands and UI formatters
  core/          → Scanner, orchestrator, powershell runner, OS detector, topology engine
  collectors/    → Windows native PowerShell/CIM collectors (security, system, network, etc.)
  parsers/       → Pure parsers: raw JSON/string → normalized schemas
  rules/         → Rule engine, severity scoring, Windows audit & vulnerability rules
  vulnerability/ → CVE signature database and online/offline exploit crawler
  reporters/     → Terminal, JSON, HTML, and PDF report generators
  types/         → Zod schemas and TypeScript type definitions
  config/        → Default rule configuration
  utils/         → Logger, date/format utilities, error handlers
tests/
  unit/          → Parser, rule, reporter, and topology unit tests (13 suites, 99 tests)
  fixtures/      → Windows CIM/JSON command output samples
```

---

## Documentation & AI Development History

Comprehensive documentation and transcripts are available in the [`docs/`](docs/) directory:

- 📖 [**SysGuard Documentation Master Guide**](docs/README.md)
- 📜 [**Complete AI Pair Programming & Chat History**](docs/CHAT_HISTORY.md)
  - Full transcript of **ChatGPT** ideation & problem statement selection ([ChatGPT Share Link](https://chatgpt.com/share/6aaf77a3-8948-83ee-806c-0f3ea63b12fa))
  - Full transcript of **Google Antigravity** implementation, macOS native pivot, interactive TUI, and refactoring
- 💻 [**CLI Commands Reference**](docs/cli-reference.md)
- 🍏 [**macOS Native Security Auditor**](docs/macos.md)
- 🪟 [**Windows Agent-less Auditor**](docs/windows.md)
- 📦 [**Commit Guide**](docs/COMMIT_GUIDE.md)

---

## License

MIT — Copyright (c) 2026 Mayank Sharma