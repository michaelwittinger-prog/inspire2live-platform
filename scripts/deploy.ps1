#!/usr/bin/env pwsh
# deploy.ps1 — Non-interactive local production deploy to Vercel
#
# Usage:
#   ./scripts/deploy.ps1                      # deploy HEAD
#   ./scripts/deploy.ps1 -SkipTests           # skip unit tests (not recommended)
#   ./scripts/deploy.ps1 -Token "tok_xxx"     # override token for this run
#
# Prerequisites (one-time):
#   1. Run:  pnpm vercel login   (saves auth to ~/.vercel/auth.json)
#   2. Run:  pnpm vercel link    (links this directory to your Vercel project)
#   OR set environment variable VERCEL_TOKEN before running this script.

param(
    [switch]$SkipTests,
    [string]$Token = $env:VERCEL_TOKEN
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repo = Split-Path $PSScriptRoot -Parent

Write-Host "`n=== Inspire2Live — Local Production Deploy ===" -ForegroundColor Cyan
Write-Host "Repo: $repo" -ForegroundColor Gray

# ── 1. Run unit tests (unless skipped) ───────────────────────────────────────
if (-not $SkipTests) {
    Write-Host "`n[1/4] Running unit tests…" -ForegroundColor Yellow
    Push-Location $repo
    pnpm vitest run
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Tests failed. Deploy aborted." -ForegroundColor Red
        exit 1
    }
    Pop-Location
    Write-Host "Tests passed." -ForegroundColor Green
} else {
    Write-Host "[1/4] Tests SKIPPED (-SkipTests flag)" -ForegroundColor DarkYellow
}

# ── 2. Build ──────────────────────────────────────────────────────────────────
Write-Host "`n[2/4] Building…" -ForegroundColor Yellow
Push-Location $repo
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Deploy aborted." -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "Build succeeded." -ForegroundColor Green

# ── 3. Deploy to Vercel ───────────────────────────────────────────────────────
Write-Host "`n[3/4] Deploying to Vercel (production)…" -ForegroundColor Yellow
Push-Location $repo

$vercelArgs = @("deploy", "--prod", "--yes", "--no-clipboard")
if ($Token) {
    $vercelArgs += "--token=$Token"
}

$deployOutput = pnpm vercel @vercelArgs 2>&1
$deployUrl = ($deployOutput | Select-String "https://").Line.Trim()

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deploy failed:" -ForegroundColor Red
    Write-Host $deployOutput -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "Deployed successfully!" -ForegroundColor Green

# ── 4. Summary ────────────────────────────────────────────────────────────────
Write-Host "`n[4/4] Summary" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
if ($deployUrl) {
    Write-Host "  URL:    $deployUrl" -ForegroundColor White
}
Write-Host "  Commit: $(git -C $repo rev-parse --short HEAD)" -ForegroundColor White
Write-Host "  Branch: $(git -C $repo branch --show-current)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
