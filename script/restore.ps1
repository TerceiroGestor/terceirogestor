[CmdletBinding()]
param(
  [string]$DatabaseBackup = "--latest",
  [string]$UploadsBackup = "--skip"
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

if ($DatabaseBackup -eq "--skip" -and $UploadsBackup -eq "--skip") {
  throw "Nothing to restore. Use -DatabaseBackup or -UploadsBackup."
}

$rootDir = Get-ProjectRoot
Set-Location $rootDir

Write-Host "== terceirogestor restore =="

Ensure-ComposeEnv -ProjectRoot $rootDir
Ensure-BackupDirectory -ProjectRoot $rootDir

Write-Host "[1/3] build backup helper"
Invoke-Compose build backup

Write-Host "[2/3] ensure mysql up"
Invoke-Compose up -d mysql
Wait-ForComposeServiceHealth -Service "mysql"

Write-Host "[3/3] restore selected data"
if ($DatabaseBackup -ne "--skip") {
  Invoke-Compose run --rm --no-deps backup restore-db $DatabaseBackup
}
if ($UploadsBackup -ne "--skip") {
  Invoke-Compose run --rm --no-deps backup restore-uploads $UploadsBackup
}
