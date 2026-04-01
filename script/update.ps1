[CmdletBinding()]
param(
  [switch]$SeedDemoData
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$rootDir = Get-ProjectRoot
Set-Location $rootDir

Write-Host "== terceirogestor update =="

Ensure-ComposeEnv -ProjectRoot $rootDir
Ensure-BackupDirectory -ProjectRoot $rootDir

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
Invoke-Compose run --rm --no-deps backend npm run db:migrate:deploy
Invoke-Compose run --rm --no-deps backend npm run permissions:backfill

if ($SeedDemoData) {
  Write-Host "[seed] demo data"
  Invoke-Compose run --rm --no-deps backend npm run db:seed
}
else {
  Write-Host "[seed] demo data (skipped)"
}

Write-Host "[7/7] recreate stack"
Invoke-Compose up -d --force-recreate backend frontend nginx backup
Wait-ForComposeServiceHealth -Service "nginx"

Write-Host "[status]"
Invoke-Compose ps
