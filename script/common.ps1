Set-StrictMode -Version Latest

function Get-ProjectRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Ensure-ComposeEnv {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot
  )

  $envFile = Join-Path $ProjectRoot ".env"
  $templateFile = Join-Path $ProjectRoot ".env.example"

  if (-not (Test-Path $envFile) -and (Test-Path $templateFile)) {
    Write-Host "Creating .env from .env.example"
    Copy-Item $templateFile $envFile
  }
}

function Get-DotEnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot,

    [Parameter(Mandatory = $true)]
    [string]$Name,

    [string]$DefaultValue = ""
  )

  $envFile = Join-Path $ProjectRoot ".env"
  if (-not (Test-Path $envFile)) {
    return $DefaultValue
  }

  foreach ($line in Get-Content $envFile) {
    if ([string]::IsNullOrWhiteSpace($line)) {
      continue
    }

    $trimmed = $line.Trim()
    if ($trimmed.StartsWith("#") -or -not $trimmed.Contains("=")) {
      continue
    }

    $parts = $trimmed.Split("=", 2)
    if ($parts[0] -ne $Name) {
      continue
    }

    $value = $parts[1].Trim()
    if ($value.Length -ge 2) {
      $doubleQuoted = $value.StartsWith('"') -and $value.EndsWith('"')
      $singleQuoted = $value.StartsWith("'") -and $value.EndsWith("'")
      if ($doubleQuoted -or $singleQuoted) {
        $value = $value.Substring(1, $value.Length - 2)
      }
    }

    return $value
  }

  return $DefaultValue
}

function Ensure-BackupDirectory {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot
  )

  $configuredPath = Get-DotEnvValue -ProjectRoot $ProjectRoot -Name "BACKUP_PATH" -DefaultValue "./storage/backups"
  $targetPath = if ([System.IO.Path]::IsPathRooted($configuredPath)) {
    $configuredPath
  }
  else {
    Join-Path $ProjectRoot $configuredPath
  }

  if (-not (Test-Path $targetPath)) {
    New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
  }
}

function Invoke-NativeCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,

    [string]$FailurePrefix = $Name
  )

  & $Name @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FailurePrefix failed with exit code $LASTEXITCODE."
  }
}

function Invoke-Compose {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  Invoke-NativeCommand `
    -Name "docker" `
    -Arguments (@("compose") + $Arguments) `
    -FailurePrefix "docker compose $($Arguments -join ' ')"
}

function Wait-ForComposeServiceHealth {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Service,

    [int]$MaxAttempts = 60,
    [int]$SleepSeconds = 2
  )

  Write-Host "Waiting for $Service to be ready..."

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    $containerId = (& docker compose ps -q $Service | Out-String).Trim()
    if (-not $containerId) {
      Write-Host "  - $Service container not created yet (attempt $attempt/$MaxAttempts)"
      Start-Sleep -Seconds $SleepSeconds
      continue
    }

    $status = (& docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $containerId 2>$null | Out-String).Trim()
    if ($status -in @("healthy", "running")) {
      Write-Host "  - $Service is $status"
      return
    }

    if ([string]::IsNullOrWhiteSpace($status)) {
      $status = "unknown"
    }

    Write-Host "  - $Service status: $status (attempt $attempt/$MaxAttempts)"
    Start-Sleep -Seconds $SleepSeconds
  }

  throw "$Service did not become ready in time."
}
