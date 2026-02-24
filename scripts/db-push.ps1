param()

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Using project root: $projectRoot"
Set-Location $projectRoot

pnpm exec supabase db push
