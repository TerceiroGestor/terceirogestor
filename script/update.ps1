[CmdletBinding()]
param(
  [switch]$SeedDemoData
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$rootDir = Get-ProjectRoot
Set-Location $rootDir

Write-Host "== terceirogestor update =="

Initialize-ComposeEnvironment -ProjectRoot $rootDir

Write-Host "[1/7] build backup helper"
Invoke-Compose build backup

Write-Host "[2/7] ensure mysql up"
Invoke-Compose up -d mysql
Wait-ForComposeServiceHealth -Service "mysql"

Write-Host "[3/7] create safety backup"
Invoke-Compose run --rm --no-deps backup backup-now

Write-Host "[4/7] git pull"
Invoke-NativeCommand -Name "git" -Arguments @("pull", "--ff-only") -FailurePrefix "git pull --ff-only"

Write-Host "[5/7] rebuild images"
Invoke-Compose build --pull

Write-Host "[6/7] apply migrations and maintenance"
Invoke-Compose run --rm --no-deps backend node_modules/.bin/prisma migrate deploy
Invoke-Compose run --rm --no-deps backend node scripts/backfill-core-permissions.js

if ($SeedDemoData) {
  Write-Host "[seed] demo data"
  Invoke-Compose run --rm --no-deps backend node prisma/seed.js
}
else {
  Write-Host "[seed] demo data (skipped)"
}

Write-Host "[7/7] recreate stack"
Invoke-Compose up -d --force-recreate backend frontend nginx backup
Wait-ForComposeServiceHealth -Service "nginx"

Write-Host "[status]"
Invoke-Compose ps
