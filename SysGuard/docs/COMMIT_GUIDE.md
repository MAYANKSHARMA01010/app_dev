# SysGuard Staged Commit Guide

This guide explains how [`scripts/commit.sh`](../scripts/commit.sh) stages and commits the SysGuard codebase in **6 realistic, logical phases** spaced **35 minutes apart**, starting from Friday after 9:00 PM.

---

## 📅 Commit Schedule & Breakdown

| Commit | Target Timestamp (IST) | Conventional Commit Message | Files Included |
|---|---|---|---|
| **1/6** | `2026-09-18 21:50:00 +0530` | `chore: initialize project configuration, typescript, and workspace dependencies` | `.gitignore`, `.eslintrc.cjs`, `.prettierrc`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `tsconfig.test.json`, `vitest.config.ts` |
| **2/6** | `2026-09-18 22:25:00 +0530` | `feat(core): implement core type definitions, os detector, and command runner` | `src/types/`, `src/utils/`, `src/core/os-detector.ts`, `src/core/command-runner.ts`, `src/core/permissions.ts` |
| **3/6** | `2026-09-18 23:00:00 +0530` | `feat(collectors): implement native system, security, and network telemetry collectors` | `src/collectors/` (`system.ts`, `security.ts`, `network.ts`), `src/parsers/` (`system.parser.ts`, `security.parser.ts`, `network.parser.ts`) |
| **4/6** | `2026-09-18 23:35:00 +0530` | `feat(engine): add defensive security rule engine, scoring, and network topology mapper` | `src/rules/` (`security.rules.ts`, `engine.ts`, `scoring.ts`, `severity.ts`), `src/core/topology.ts`, `src/core/orchestrator.ts`, `src/core/scanner.ts` |
| **5/6** | `2026-09-19 00:10:00 +0530` | `feat(cli): add interactive terminal tui, checklist selector, and json reporting` | `src/cli/` (`index.ts`, `interactive/`, `commands/`, `ui/`), `src/reporters/` (`json.ts`, `terminal.ts`) |
| **6/6** | `2026-09-19 00:45:00 +0530` | `docs: update project documentation, test suites, and automation scripts` | `README.md`, `docs/`, `tests/`, `scripts/` |

---

## 🚀 How to Use

### 1. Preview Without Committing (Dry Run)
To verify the schedule and simulated commits without making any changes to your git repository:
```bash
./scripts/commit.sh --dry-run
```

### 2. Run the Commits When Ready
When you are ready to create the 6 commits:
```bash
./scripts/commit.sh
```

### 3. Verify the Git Log
Check your clean, sequential commit history:
```bash
git log --oneline --graph --decorate
```
Or view full timestamps:
```bash
git log -7 --format="%h | %ad | %s" --date=format:"%Y-%m-%d %H:%M"
```

---

## ⚙️ Custom Options

You can customize the start time or interval:
```bash
# Custom 40-minute interval
./scripts/commit.sh --interval 40

# Custom start date
./scripts/commit.sh --start "2026-09-18 21:30:00 +0530" --interval 30
```
> [!NOTE]
> This script only creates local commits. It **never runs `git push`**.
