[CmdletBinding()]
param(
  [switch]$SkipSeed,
  [switch]$WithNginx
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "docker-compose.common.ps1")

$rootDir = Get-ProjectRoot
Set-Location $rootDir

Write-Host "== system_development update =="

Ensure-ComposeEnv -ProjectRoot $rootDir
Prepare-BackendComposeEnv -ProjectRoot $rootDir
$composeFiles = Get-ComposeFiles -ProjectRoot $rootDir -WithNginx:$WithNginx

$buildServices = @("backend", "frontend")
if ($WithNginx) {
  $buildServices += "nginx"
}

$recreateServices = @("backend", "frontend", "backup")
if ($WithNginx) {
  $recreateServices += "nginx"
}

Write-Host "[1/8] git pull"
Invoke-NativeCommand -Name "git" -Arguments @("pull", "--ff-only") -FailurePrefix "git pull --ff-only"

Write-Host "[2/8] ensure mysql up"
Invoke-Compose -ComposeFiles $composeFiles up -d mysql backup
Wait-ForMySqlHealth

Write-Host "[3/8] build images"
Invoke-Compose -ComposeFiles $composeFiles build --pull @buildServices

Write-Host "[4/8] apply migrations (inside container)"
Invoke-Compose -ComposeFiles $composeFiles run --rm --no-deps backend npm run db:migrate:deploy

if ($SkipSeed) {
  Write-Host "[5/8] seed database (skipped)"
}
else {
  Write-Host "[5/8] seed database (inside container)"
  Invoke-Compose -ComposeFiles $composeFiles run --rm --no-deps backend npm run db:seed
}

Write-Host "[6/8] backfill core permissions"
Invoke-Compose -ComposeFiles $composeFiles run --rm --no-deps backend npm run permissions:backfill

Write-Host "[7/8] recreate containers"
Invoke-Compose -ComposeFiles $composeFiles up -d --force-recreate @recreateServices

Write-Host "[8/8] status"
Invoke-Compose -ComposeFiles $composeFiles ps
