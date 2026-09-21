# SysGuard Documentation

Welcome to the comprehensive documentation for **SysGuard** — an agent-less, read-only system vulnerability, security posture, and network exposure auditing CLI.

SysGuard is designed to deliver immediate, actionable security audits across **macOS** (Apple Silicon & Intel) and **Windows** (10/11) without installing agents, background daemons, or kernel extensions.

---

## Quick Navigation

- [1. Prerequisites](#1-prerequisites)
- [2. How to Clone](#2-how-to-clone)
- [3. How to Install](#3-how-to-install)
- [4. How to Build & Link](#4-how-to-build--link)
- [5. Commands Reference ("Which Command Does What")](#5-commands-reference-which-command-does-what)
  - [`sysguard scan`](#sysguard-scan)
  - [`sysguard doctor`](#sysguard-doctor)
  - [`sysguard report`](#sysguard-report)
  - [`sysguard system`](#sysguard-system)
  - [`sysguard security`](#sysguard-security)
  - [`sysguard network`](#sysguard-network)
  - [`sysguard findings`](#sysguard-findings)
- [6. Interactive Terminal TUI Dashboard](#6-interactive-terminal-tui-dashboard)
- [7. Output Formats & Reports](#7-output-formats--reports)
- [8. Platform Architectures](#8-platform-architectures)
  - [macOS Native Auditing](#macos-native-auditing)
  - [Windows Agent-less Auditing](#windows-agent-less-auditing)
- [9. Demo Mode (Simulation)](#9-demo-mode-simulation)
- [10. Troubleshooting](#10-troubleshooting)
- [11. Complete AI Development & Chat History (ChatGPT + Antigravity)](CHAT_HISTORY.md)

---

## 1. Prerequisites

Before installing SysGuard, ensure your environment meets the minimum requirements:

- **Node.js**: Version `18.0.0` or higher (`node -v` to check)
- **Package Manager**: `npm` (v9+) or `pnpm` (v10+)
- **Operating Systems**:
  - **macOS**: Sonoma (14+), Sequoia (15+), macOS 26+ (Apple Silicon M1/M2/M3/M4 or Intel x86_64)
  - **Windows**: Windows 10 (Build 1903+) or Windows 11 (PowerShell 5.1+ / 7+)
- **Git**: Installed and available in your system `$PATH`

---

## 2. How to Clone

Clone the repository from GitHub using HTTPS or SSH:

```bash
# Using HTTPS
git clone https://github.com/MAYANKSHARMA01010/SysGuard.git

# Navigate into the project directory
cd SysGuard
```

Or using SSH:
```bash
git clone git@github.com:MAYANKSHARMA01010/SysGuard.git
cd SysGuard
```

---

## 3. How to Install

You can use either `npm` or `pnpm` to install all dependencies:

### Using `npm`
```bash
npm install
```

### Using `pnpm`
```bash
pnpm install
```

All required runtime dependencies (`chalk`, `commander`, `cli-table3`, `zod`, `ora`, `inquirer`) and development tooling (`typescript`, `tsx`, `vitest`, `eslint`, `prettier`) will be installed.

---

## 4. How to Build & Link

### Build the TypeScript Project
Compile the source code from `src/` to production JavaScript in `dist/`:

```bash
npm run build
# or: pnpm run build
```

### Global CLI Link (Recommended)
Link the package globally so you can invoke `sysguard` from anywhere in your terminal:

```bash
npm link
```

Verify that the CLI is accessible globally:
```bash
sysguard --help
```

### Run in Development Mode (Without Building)
If you are developing or modifying code, you can run directly with `tsx` without re-compiling:

```bash
npm run dev -- <command> [options]
# Example:
npm run dev -- scan
npm run dev -- doctor
```

---

## 5. Commands Reference ("Which Command Does What")

Here is the complete command reference table:

| Command | What It Does | Default Output | Recommended Use Case |
|---|---|---|---|
| `sysguard scan` | Performs a complete end-to-end security, vulnerability, and network audit | Interactive TUI Dashboard (or Table) | Daily audits, posture checks, interactive inspection |
| `sysguard doctor` | Pre-flight diagnostic check of all required system utilities and privileges | Status Checklist | Run first to verify your system has all required tools |
| `sysguard report` | Scans the system and writes HTML, PDF, and JSON reports to disk | File export to `reports/` | Creating official audit reports for documentation or sharing |
| `sysguard system` | Collects and displays OS build, kernel, hardware, CPU, memory, uptime, and software | Terminal Table | Fast inventory inspection |
| `sysguard security` | Inspects core OS security controls and evaluates defensive rules | Terminal Table | Security configuration hardening review |
| `sysguard network` | Maps active interfaces, open listening ports, process owners, and ARP cache | Terminal Table | Identifying exposed network services and unauthorized sockets |
| `sysguard findings` | Lists evaluated defensive security findings categorized by severity | Terminal Table | Focusing on failed checks and remediation fixes |

---

### Detailed Command Walkthroughs

#### `sysguard scan`
The primary command of SysGuard. It runs all audit modules in parallel and evaluates defensive security rules against the collected telemetry.

```bash
# 1. Launch the interactive terminal dashboard (Default on macOS/TTY)
sysguard scan

# 2. Run with static terminal tables (ideal for logging or automated pipelines)
sysguard scan --no-interactive

# 3. Output in JSON format (ideal for piping to jq or SIEM ingest)
sysguard scan --format json

# 4. Export directly to an HTML audit report
sysguard scan --format html --output reports/audit.html

# 5. Export directly to a printable PDF audit report
sysguard scan --format pdf --output reports/audit.pdf

# 6. Audit specific modules only
sysguard scan --modules system,security
sysguard scan --modules network

# 7. Run in offline / air-gapped mode (skips live CISA KEV web crawler)
sysguard scan --no-crawl

# 8. Run in demo mode (simulates a full Windows 11 Enterprise environment)
sysguard scan --demo
```

**Options for `scan`**:
- `--format <table|json|html|pdf>`: Choose output format (Default: `table`).
- `--output <file>`: Write results directly to a file path.
- `--modules <list>`: Comma-separated list: `system`, `security`, `network`.
- `--no-crawl`: Disable the online vulnerability/exploit crawler (useful in air-gapped networks).
- `--no-interactive`: Disable the interactive TUI and output static terminal tables.
- `--demo`: Simulate a Windows 11 Enterprise audit (for cross-platform testing).
- `--verbose`: Enable debug trace logs.

---

#### `sysguard doctor`
Verifies that your operating system has all the required tools, utilities, and privileges necessary to perform a complete audit.

```bash
sysguard doctor
```

**What it checks on macOS**:
- Node.js version (≥ 18)
- Operating system architecture (Apple Silicon `arm64` / Intel `x64`)
- User execution privilege
- System Integrity Protection (`csrutil`)
- FileVault 2 encryption tool (`fdesetup`)
- Gatekeeper assessment subsystem (`spctl`)
- macOS Application Firewall (`socketfilterfw`)
- Network socket inspection (`lsof`)
- System Configuration framework (`scutil`)
- Kernel telemetry (`sysctl`)
- Software version tool (`sw_vers`)
- Directory Services (`dscl`)

**What it checks on Windows**:
- PowerShell execution policy
- WMI and CIM availability
- Windows Defender cmdlets (`Get-MpComputerStatus`)
- Windows Firewall cmdlets (`Get-NetFirewallProfile`)
- Secure Boot status (`Confirm-SecureBootUEFI`)
- Network cmdlets (`Get-NetTCPConnection`, `Get-NetAdapter`, `Get-NetNeighbor`)
- Update management (`Get-HotFix`)

---

#### `sysguard report`
Executes a fresh audit and automatically compiles and writes all three major report formats (**HTML**, **PDF**, and **JSON**) into a folder.

```bash
# Generate reports into default directory (reports/)
sysguard report

# Specify custom destination directory and file base name
sysguard report --output /path/to/audits --name quarterly-audit-q3
```

Generated files:
- `reports/sysguard-report.html` — Interactive, dark-mode report with embedded Mermaid topology diagrams.
- `reports/sysguard-report.pdf` — Self-contained PDF document generated via headless Chrome/Edge.
- `reports/sysguard-report.json` — Structured machine-readable schema for automated processing.

---

#### `sysguard system`
Focuses purely on the host's operating system and hardware profile.

```bash
sysguard system
```
**Information gathered**:
- OS Platform, Version, and Kernel Build number
- Processor Architecture (`arm64` / `x64`) and CPU Brand (`Apple M3`, `Intel Core`, etc.)
- Total Physical Memory (RAM)
- System Uptime in hours/days
- Catalog of installed software applications and Homebrew packages

---

#### `sysguard security`
Focuses purely on active operating system security controls and hardening postures.

```bash
sysguard security
```
**Information gathered on macOS**:
- System Integrity Protection (SIP) active state
- FileVault Full Disk Encryption (XTS-AES) state
- Gatekeeper Code Signing and Notarization enforcement
- Application Firewall (ALF) global state and stealth mode
- Local Administrator accounts in the `admin` group
- Automatic background security update configuration

---

#### `sysguard network`
Inspects network exposure, interfaces, active sockets, and discovered local neighbors.

```bash
sysguard network
```
**Information gathered**:
- Network interfaces (`en0`, `lo0`, `wlan0`) with assigned IPv4/IPv6 addresses
- Active TCP listening sockets and open ports (e.g. 7000, 5000, 3000, 22)
- Bound IP addresses (`127.0.0.1` vs `0.0.0.0`)
- Process names and Process IDs (PID) owning each socket
- Local ARP neighbor cache table
- Automatically synthesized Mermaid.js network topology graph

---

#### `sysguard findings`
Displays the evaluated security findings from the defensive rule engine, sorted by severity.

```bash
sysguard findings
```
**Displays**:
- Finding ID and Rule Name
- Category (`SYSTEM_INTEGRITY`, `ENCRYPTION`, `GATEKEEPER`, `FIREWALL`, `NETWORK`, `USERS`, `UPDATES`)
- Severity Badge (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`)
- Status (`PASS`, `WARN`, `FAIL`, `NOT_APPLICABLE`)
- Technical Evidence snippet
- Direct Remediation Command / Fix instructions

---

## 6. Interactive Terminal TUI Dashboard

When running `sysguard scan` in a standard terminal session on macOS, SysGuard launches a flicker-free interactive terminal interface.

```
╔══════════════════════════════════════════════════════════════════════════════╗
║ 🛡️  SYSGUARD INTERACTIVE SECURITY AUDITOR                          🍎 macOS Native  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Host: Mayanks-MacBook-Pro-9.local User: mayanksharma Score:  100/100 (Excellent) ║
╚══════════════════════════════════════════════════════════════════════════════╝

   1. 🛡️ Findings   2. 🌐 Network & Ports   3. 💻 System Controls   4. ⚡ CVEs & Inventory 

  ✖ 0 Failed  |    ⚠ 2 Warnings  |    ✔ 6 Passed  |    Filter: ALL

▶ ✔  CRITICAL  macOS System Integrity Protection (SIP)
  ✔ HIGH     FileVault Full Disk Encryption
  ✔ HIGH     Gatekeeper Code Signing & Notarization
  ✔ HIGH     macOS Application Firewall (ALF)
  ⚠ MEDIUM   macOS Firewall Stealth Mode
  ✔ MEDIUM   macOS Administrator Account Audit
  ✔ HIGH     macOS Network Listening Services
  ⚠ MEDIUM   macOS Automatic Security Updates

──────────────────────────────────────────────────────────────────────────────
  [↑/↓] Navigate     [Enter] Inspect Rule     [Tab / 1-4] Switch Tab
  [F] Filter (ALL)     [R] Re-Scan Live     [E] Export Report     [Q] Quit
```

### Dashboard Keybindings

| Key | Action | Details |
|---|---|---|
| `↑` / `↓` | **Navigate** | Move selector through the list of findings or items |
| `Enter` | **Inspect Rule** | Toggle drawer showing detailed description, evidence, and remediation fix |
| `Tab` or `1-4` | **Switch Tab** | Seamlessly switch between the 4 main views: <br>• `1`: Findings & Rules<br>• `2`: Network & Listening Ports<br>• `3`: System Controls & Hardening<br>• `4`: CVEs & Software Inventory |
| `F` | **Filter Findings** | Cycle through status filters: `ALL` ➔ `FAIL` ➔ `WARN` ➔ `PASS` |
| `R` | **Live Re-Scan** | Trigger an instantaneous live re-scan of the host without restarting the CLI |
| `E` | **Export Reports** | Immediately export HTML, PDF, and JSON reports to the `reports/` directory |
| `Q` or `Ctrl+C` | **Quit** | Restores terminal cursor and exits cleanly |

---

## 7. Output Formats & Reports

SysGuard supports four primary output formats:

### 1. Terminal Tables (Interactive & Static)
Formatted with ANSI colors, status indicators, and clean borders. Supports both interactive mode (`sysguard scan`) and static pipes (`sysguard scan --no-interactive | cat`).

### 2. Structured JSON
Normalized, validated against strict Zod schemas (`ScanResultSchema`). Perfect for automated security pipelines, CI/CD gates, or sending to SIEM platforms (Splunk, Elastic).

### 3. Interactive Dark-Mode HTML Report
A standalone, zero-dependency HTML file featuring:
- Executive summary scorecard
- Color-coded security finding cards
- Embedded, client-side rendered **Mermaid.js** network topology diagram
- Searchable software inventory and open ports table
- CVE exploit intelligence and patch links

### 4. Self-Contained PDF Report
Exported using your system's native headless Chromium engine (Google Chrome, Microsoft Edge, or Chromium) without heavy external PDF rendering services.

---

## 8. Platform Architectures

SysGuard uses an adaptive multi-platform architecture that dispatches platform-specific collectors and rules:

```
                      ┌──────────────────────┐
                      │    sysguard scan     │
                      └──────────┬───────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
        [ macOS Detected ]            [ Windows Detected ]
                   │                           │
         Built-in Apple CLI            PowerShell & CIM/WMI
       (csrutil, fdesetup, spctl,    (Get-MpPreference, Defender,
        socketfilterfw, lsof, arp)    Get-NetTCPConnection, Firewall)
                   │                           │
                   └─────────────┬─────────────┘
                                 ▼
                     Normalized Scan Result
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
         Interactive TUI Dashboard     Exported Reports
         (Raw Terminal Navigation)     (HTML, PDF, JSON)
```

### macOS Native Auditing
- **Zero Third-Party Daemons**: Queries Apple's built-in binaries directly.
- **Fast Execution**: Full system, security, and network audit completes in **under 800ms**.
- **Non-Destructive**: All operations are strictly read-only inspection.

### Windows Agent-less Auditing
- **PowerShell / CIM / WMI**: Uses native Windows management cmdlets without installing agents.
- **AV/EDR Friendly**: Low-overhead queries designed to avoid triggering heuristic alerts.

---

## 9. Demo Mode (Simulation)

If you are developing or evaluating on macOS or Linux and wish to test the Windows auditing features, you can pass the `--demo` flag:

```bash
sysguard scan --demo
sysguard report --demo
```

This simulates a full Windows 11 Enterprise host with Microsoft Defender, AMSI providers, BitLocker, RDP sessions, and weaponized CVE exposures, allowing full verification on any operating system.

---

## 10. Troubleshooting

### Permission Denied on Ports / Security
- On macOS, standard user accounts can read SIP, FileVault, Gatekeeper, and Firewall state. However, to inspect root-owned network sockets or system files, run with `sudo`:
  ```bash
  sudo sysguard scan
  ```
- On Windows, open PowerShell **as Administrator** for complete Defender and Registry audit results.

### `command not found: sysguard`
- If you have not linked the package globally with `npm link`, run via npm script or tsx:
  ```bash
  npm run dev -- scan
  ```
- Or link globally:
  ```bash
  cd SysGuard
  npm link
  ```

### Reports Directory Permission
- Reports are saved to `./reports/` relative to your current working directory. Ensure the current user has write permissions in that folder.
