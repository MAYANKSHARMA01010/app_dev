# SysGuard CLI Reference Manual

This document provides a technical reference for every command, flag, option, exit code, and configuration parameter in the SysGuard CLI.

---

## Global CLI Syntax

```bash
sysguard [command] [options]
```

### Global Options

| Option | Type | Description |
|---|---|---|
| `-V`, `--version` | Flag | Output the version number of SysGuard |
| `-h`, `--help` | Flag | Display help for command |

---

## Commands

### `scan`
Runs a full security, vulnerability, and network exposure audit.

```bash
sysguard scan [options]
```

#### Options:
- `--format <format>`:
  - Values: `table` (default), `json`, `html`, `pdf`
  - When set to `table` in a terminal (TTY), launches the interactive TUI dashboard.
  - When set to `json`, outputs normalized JSON to stdout or file.
  - When set to `html` or `pdf`, compiles the corresponding document.
- `--output <file>`:
  - Destination file path to save the generated report.
  - Automatically creates parent directories if they do not exist.
- `--modules <list>`:
  - Comma-separated list of modules to execute.
  - Supported modules: `system`, `security`, `network`.
  - Default: `system,security,network`.
- `--no-crawl`:
  - Disables the online CISA KEV (Known Exploited Vulnerabilities) feed crawler.
  - SysGuard will use its built-in offline CVE database.
- `--no-interactive`:
  - Disables the interactive terminal dashboard when `--format table` is used.
  - Prints static ANSI tables instead.
- `--demo`:
  - Runs with simulated Windows 11 Enterprise telemetry.
  - Useful for testing Windows auditing workflows on macOS or Linux.
- `--verbose`:
  - Enables detailed diagnostic logging.

---

### `doctor`
Performs an environment health check, testing permissions, Node.js version, and presence of all required native binaries.

```bash
sysguard doctor
```

#### Exit Codes:
- `0`: All system checks passed; ready to scan.
- `1`: One or more critical checks failed (e.g. Node.js < 18).

---

### `report`
Executes an audit and compiles all three report formats simultaneously (`.html`, `.pdf`, and `.json`).

```bash
sysguard report [options]
```

#### Options:
- `--output <dir>`: Destination folder for exported reports (Default: `./reports`).
- `--name <name>`: Base filename for the exported bundle (Default: `sysguard-report`).
- `--demo`: Generate reports from simulated Windows 11 telemetry.

---

### `system`
Runs only the system information module.

```bash
sysguard system
```
Outputs OS platform, architecture, hardware CPU brand, physical memory, uptime, and cataloged software packages.

---

### `security`
Runs only the security controls module.

```bash
sysguard security
```
Evaluates core OS defensive controls (SIP, FileVault, Gatekeeper, Firewall, Defender, UAC, Secure Boot, etc.) and lists all findings.

---

### `network`
Runs only the network exposure module.

```bash
sysguard network
```
Lists active interfaces, IP configurations, listening ports, process owners, and discovered ARP neighbors.

---

### `findings`
Displays evaluated security findings.

```bash
sysguard findings
```
Filters and displays all PASS, WARN, and FAIL findings with severity levels and remediation advice.

---

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Audit completed successfully. |
| `1` | General error (invalid arguments, scan failure, or permission error). |
| `127` | Command or binary not found in system `$PATH`. |

---

## Environment Variables

| Variable | Description |
|---|---|
| `SYSGUARD_OFFLINE` | Set to `1` or `true` to force offline mode (equivalent to `--no-crawl`). |
| `SYSGUARD_LOG_LEVEL` | Logging level: `debug`, `info`, `warn`, `error` (Default: `info`). |
| `NODE_ENV` | Environment mode (`development` or `production`). |
