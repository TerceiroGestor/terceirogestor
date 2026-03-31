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
  $templateFile = Join-Path $ProjectRoot ".env.compose.example"

  if (-not (Test-Path $envFile) -and (Test-Path $templateFile)) {
    Write-Host "Creating .env from .env.compose.example"
    Copy-Item $templateFile $envFile
  }
}

function Prepare-BackendComposeEnv {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot
  )

  $sourceFile = Join-Path $ProjectRoot "backend/.env"
  if (-not (Test-Path $sourceFile)) {
    return
  }

  $targetFile = Join-Path $ProjectRoot "backend/.env.docker"
  $content = foreach ($line in Get-Content $sourceFile) {
    if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith("#") -or -not $line.Contains("=")) {
      $line
      continue
    }

    $parts = $line.Split("=", 2)
    $value = $parts[1]

    if ($value.Length -ge 2) {
      $hasDoubleQuotes = $value.StartsWith('"') -and $value.EndsWith('"')
      $hasSingleQuotes = $value.StartsWith("'") -and $value.EndsWith("'")
      if ($hasDoubleQuotes -or $hasSingleQuotes) {
        $value = $value.Substring(1, $value.Length - 2)
      }
    }

    if ($value.Contains("'")) {
      "{0}={1}" -f $parts[0], $value
      continue
    }

    "{0}='{1}'" -f $parts[0], $value
  }

  $content | Set-Content -Path $targetFile -Encoding utf8
  $env:BACKEND_ENV_FILE = ((Resolve-Path $targetFile).Path -replace "\\", "/")
}

function Get-ComposeFiles {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot,

    [switch]$WithNginx
  )

  $files = @(
    "-f",
    (Join-Path $ProjectRoot "docker-compose.yml")
  )

  if ($WithNginx) {
    $files += @(
      "-f",
      (Join-Path $ProjectRoot "docker-compose.nginx.local.yml")
    )
  }

  return $files
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
    [Parameter(Mandatory = $true)]
    [string[]]$ComposeFiles,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  Invoke-NativeCommand `
    -Name "docker" `
    -Arguments (@("compose") + $ComposeFiles + $Arguments) `
    -FailurePrefix "docker compose $($Arguments -join ' ')"
}

function Wait-ForMySqlHealth {
  param(
    [string]$ContainerName = "mysql-terceirogestor",
    [int]$MaxAttempts = 60,
    [int]$SleepSeconds = 2
  )

  Write-Host "Waiting for MySQL to be healthy..."

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    & docker inspect $ContainerName *> $null
    if ($LASTEXITCODE -ne 0) {
      Write-Host "  - MySQL container not found yet (attempt $attempt/$MaxAttempts)"
      Start-Sleep -Seconds $SleepSeconds
      continue
    }

    $status = (& docker inspect -f '{{.State.Health.Status}}' $ContainerName 2>$null | Out-String).Trim()
    if ($status -eq "healthy") {
      Write-Host "  - MySQL is healthy"
      return
    }

    if ([string]::IsNullOrWhiteSpace($status)) {
      $status = "unknown"
    }

    Write-Host "  - MySQL status: $status (attempt $attempt/$MaxAttempts)"
    Start-Sleep -Seconds $SleepSeconds
  }

  throw "MySQL did not become healthy in time."
}
