param(
    [ValidateSet('up', 'down', 'build', 'restart', 'logs', 'ps')]
    [string]$Command = 'up',

    [ValidateSet('all', 'database', 'backend', 'frontend')]
    [string]$Service = 'all',

    [switch]$Build
)

$ErrorActionPreference = 'Stop'

function Invoke-DockerCompose {
    param([string[]]$Arguments)

    & docker compose @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose failed: $($Arguments -join ' ')"
    }
}

function Test-Docker {
    & docker version *> $null
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker is not available. Start Docker Desktop and try again.'
    }
}

function Resolve-Services {
    param([string]$SelectedService)

    if ($SelectedService -eq 'all') {
        return @()
    }

    return @($SelectedService)
}

Test-Docker

$targetServices = Resolve-Services -SelectedService $Service

switch ($Command) {
    'up' {
        $args = @('up', '-d', '--remove-orphans')
        if ($Build) {
            $args += '--build'
        }
        $args += $targetServices
        Invoke-DockerCompose -Arguments $args
        Write-Host 'Frontend: http://localhost:3000'
        Write-Host 'Backend:  http://localhost:3001'
        Write-Host 'Database: localhost:5432'
    }

    'down' {
        Invoke-DockerCompose -Arguments @('down', '--remove-orphans')
    }

    'build' {
        $args = @('build') + $targetServices
        Invoke-DockerCompose -Arguments $args
    }

    'restart' {
        if ($targetServices.Count -eq 0) {
            Invoke-DockerCompose -Arguments @('restart')
        }
        else {
            Invoke-DockerCompose -Arguments (@('restart') + $targetServices)
        }
    }

    'logs' {
        if ($targetServices.Count -eq 0) {
            Invoke-DockerCompose -Arguments @('logs', '-f')
        }
        else {
            Invoke-DockerCompose -Arguments (@('logs', '-f') + $targetServices)
        }
    }

    'ps' {
        Invoke-DockerCompose -Arguments @('ps')
    }
}