[CmdletBinding()]
param(
  [switch]$SeedDemoData
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$rootDir = Get-ProjectRoot
Set-Location $rootDir

Write-Host "== terceirogestor up =="

Ensure-ComposeEnv -ProjectRoot $rootDir
Ensure-BackupDirectory -ProjectRoot $rootDir

Write-Host "[1/6] build images"
Invoke-Compose build --pull

Write-Host "[2/6] start mysql"
Invoke-Compose up -d mysql
Wait-ForComposeServiceHealth -Service "mysql"

Write-Host "[3/6] apply migrations"
Invoke-Compose run --rm --no-deps backend npm run db:migrate:deploy

Write-Host "[4/6] backfill core permissions"
Invoke-Compose run --rm --no-deps backend npm run permissions:backfill

if ($SeedDemoData) {
  Write-Host "[5/6] seed demo data"
  Invoke-Compose run --rm --no-deps backend npm run db:seed
}
else {
  Write-Host "[5/6] seed demo data (skipped)"
}

Write-Host "[6/6] start application stack"
Invoke-Compose up -d backend frontend nginx backup
Wait-ForComposeServiceHealth -Service "nginx"

Write-Host "[status]"
Invoke-Compose ps
