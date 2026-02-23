# Cline Git Workflow

This document defines the safe commit/push protocol for Cline sessions in this repo.

## Why this exists

On 2026-02-21 Cline stalled at the commit/push step because a single `execute_command` call chained `git add && git commit && git push` with `requires_approval: true`. In Cline's tool model, **any command marked `requires_approval: true` blocks until the user explicitly clicks Approve**, regardless of what is chained after it. Since the entire chain was one command, nothing ran until the user manually approved — and the session had already been interrupted.

## Root cause

```text
# BAD — all three ops in one approval-required call
git -C inspire2live-platform add ... && git commit -m "..." && git push origin main
requires_approval: true
```

The `git push` (which genuinely needs approval because it writes to remote) was chained with `git add` and `git commit` (which are safe local operations). This forced the whole chain to need approval, and when the session was interrupted, the approval never arrived.

## The rule: split commit from push

### Step 1 — Stage + commit (no approval required, local-only)
```bash
git -C inspire2live-platform add <files>
git -C inspire2live-platform commit -m "type(scope): description"
# requires_approval: false
```

### Step 2 — Push (approval required, writes to remote)
```bash
git -C inspire2live-platform push origin main
# requires_approval: true
```

Run these as **two separate `execute_command` calls**. Never chain them.

## Commit message convention

```
type(scope): short description

Types: feat | fix | ux | docs | refactor | test | chore
Scope: congress | initiatives | auth | nav | ui | cline | vercel
```

## Build verification before push

Always run `pnpm test` and `pnpm build` before committing:

```bash
cd inspire2live-platform && pnpm test
cd inspire2live-platform && pnpm build
# requires_approval: false for both
```

Only commit if both pass.

## Checklist for every Cline implementation session

- [ ] All edits made and TypeScript errors resolved
- [ ] `pnpm test` passes (no failures)
- [ ] `pnpm build` succeeds (routes visible in output)
- [ ] Stage + commit in one call (`requires_approval: false`)
- [ ] Push in a separate call (`requires_approval: true`)

---

## Second root cause (2026-02-23): multi-line commit messages in chained PowerShell commands

### What happened

A session stalled when Cline chained `git add && git commit -m "...multi-line..." && git push`
in a single `execute_command` call.  PowerShell hangs waiting for stdin to close when a
multi-line string literal is spread across lines inside a shell argument, or the
terminal output buffer is never flushed because the process blocks.

### Rules (in addition to the above)

| # | Rule | Rationale |
|---|------|-----------|
| 1 | **Commit messages must be single-line.** | Multi-line `-m "..."` in PowerShell causes the shell to keep reading input. |
| 2 | **Never chain more than 2 git commands with `&&` in one `execute_command` call.** | Three-command chains (`add && commit && push`) are the most common hang pattern. |
| 3 | **Use `scripts/git-push.ps1` for the final push.** | It runs each step in its own `pwsh` statement, detects empty-tree gracefully, and exits with a clear error code on failure. |
| 4 | **Always verify with `git log --oneline -1` after a push.** | Confirms the push actually landed; takes <100 ms and cannot hang. |

### Approved git patterns

**Pattern A — Two separate execute_command calls (minimum):**
```powershell
# Call 1  (requires_approval: false)
git -C "..." add -A
git -C "..." commit -m "type(scope): single line message"

# Call 2  (requires_approval: false — auto-approve is active)
git -C "..." push origin main
```

**Pattern B — Use the helper script (recommended for complex messages):**
```powershell
# Single call  (requires_approval: false)
pwsh "c:/Users/micha/Inspire2Live Platform New/inspire2live-platform/scripts/git-push.ps1" `
  -Message "type(scope): single line message"
```

**Pattern C — Verify push landed (always do this after Pattern A or B):**
```powershell
git -C "..." log --oneline -1
# requires_approval: false
```

### Anti-patterns (NEVER do these)

```powershell
# ❌ Multi-line -m string
git commit -m "line 1
line 2
line 3"

# ❌ Three-op chain
git add -A && git commit -m "..." && git push origin main

# ❌ Chaining commit+push with requires_approval: true on the whole chain
git add ... && git push ... (requires_approval: true)
```
