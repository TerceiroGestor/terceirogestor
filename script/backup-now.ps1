[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "common.ps1")

$rootDir = Get-ProjectRoot
Set-Location $rootDir

Write-Host "== terceirogestor backup =="

Ensure-ComposeEnv -ProjectRoot $rootDir
Ensure-BackupDirectory -ProjectRoot $rootDir

Write-Host "[1/3] build backup helper"
Invoke-Compose build backup

Write-Host "[2/3] ensure mysql up"
Invoke-Compose up -d mysql
Wait-ForComposeServiceHealth -Service "mysql"

Write-Host "[3/3] create backup"
Invoke-Compose run --rm --no-deps backup backup-now
