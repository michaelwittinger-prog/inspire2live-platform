#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Safe atomic git add → commit → push wrapper.

.DESCRIPTION
  Avoids PowerShell hanging on long chained git commands with multi-line
  commit messages.  Always call this script instead of chaining
  "git add && git commit -m '...' && git push" in a single shell invocation.

.PARAMETER Message
  Single-line commit message (required).

.PARAMETER Branch
  Branch to push to.  Defaults to "main".

.PARAMETER Remote
  Remote name.  Defaults to "origin".

.EXAMPLE
  pwsh scripts/git-push.ps1 -Message "feat: add new feature"
  pwsh scripts/git-push.ps1 "fix: quick patch" main origin
#>
param(
  [Parameter(Mandatory)]
  [string]$Message,

  [string]$Branch = "main",
  [string]$Remote = "origin"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── 1. Stage everything ────────────────────────────────────────────────────────
Write-Host "[git-push] git add -A" -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -ne 0) { throw "git add failed (exit $LASTEXITCODE)" }

# ── 2. Commit (skip if nothing staged) ───────────────────────────────────────
$status = git status --porcelain
if ($status) {
  Write-Host "[git-push] git commit -m `"$Message`"" -ForegroundColor Cyan
  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { throw "git commit failed (exit $LASTEXITCODE)" }
} else {
  Write-Host "[git-push] Nothing to commit — working tree clean." -ForegroundColor Yellow
}

# ── 3. Push ───────────────────────────────────────────────────────────────────
Write-Host "[git-push] git push $Remote $Branch" -ForegroundColor Cyan
git push $Remote $Branch
if ($LASTEXITCODE -ne 0) { throw "git push failed (exit $LASTEXITCODE)" }

Write-Host "[git-push] Done — $Remote/$Branch is up to date." -ForegroundColor Green
