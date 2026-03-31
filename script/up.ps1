[CmdletBinding()]
param(
  [switch]$SkipSeed,
  [switch]$WithNginx
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "docker-compose.common.ps1")

$rootDir = Get-ProjectRoot
Set-Location $rootDir

Write-Host "== system_development up =="

Ensure-ComposeEnv -ProjectRoot $rootDir
Prepare-BackendComposeEnv -ProjectRoot $rootDir
$composeFiles = Get-ComposeFiles -ProjectRoot $rootDir -WithNginx:$WithNginx

$buildServices = @("backend", "frontend")
if ($WithNginx) {
  $buildServices += "nginx"
}

$upServices = @("backend", "frontend", "backup")
if ($WithNginx) {
  $upServices += "nginx"
}

Write-Host "[1/7] ensure mysql up"
Invoke-Compose -ComposeFiles $composeFiles up -d mysql backup
Wait-ForMySqlHealth

Write-Host "[2/7] build images"
Invoke-Compose -ComposeFiles $composeFiles build --pull @buildServices

Write-Host "[3/7] apply migrations (inside container)"
Invoke-Compose -ComposeFiles $composeFiles run --rm --no-deps backend npm run db:migrate:deploy

if ($SkipSeed) {
  Write-Host "[4/7] seed database (skipped)"
}
else {
  Write-Host "[4/7] seed database (inside container)"
  Invoke-Compose -ComposeFiles $composeFiles run --rm --no-deps backend npm run db:seed
}

Write-Host "[5/7] backfill core permissions"
Invoke-Compose -ComposeFiles $composeFiles run --rm --no-deps backend npm run permissions:backfill

Write-Host "[6/7] start application containers"
Invoke-Compose -ComposeFiles $composeFiles up -d @upServices

Write-Host "[7/7] status"
Invoke-Compose -ComposeFiles $composeFiles ps
