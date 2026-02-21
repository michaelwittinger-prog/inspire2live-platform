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
