# Script completo para gerenciar docker-compose individuais com helpers
# Uso: .\docker-manage.ps1 [postgres|backend|frontend|all|down|status|logs|reset|backup]

param(
    [string]$Service = "all",
    [switch]$Build = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$WarningPreference = "SilentlyContinue"

# ============================================================
# Colors and Formatting
# ============================================================
$script:Colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
    Gray    = "Gray"
}

function Write-Log {
    param([string]$Message, [string]$Type = "Info")
    $color = $script:Colors[$Type] ?? "White"
    $prefix = switch ($Type) {
        "Success" { "✅" }
        "Error"   { "❌" }
        "Warning" { "⚠️ " }
        "Info"    { "ℹ️ " }
        default   { "→ " }
    }
    Write-Host "$prefix $Message" -ForegroundColor $color
}

function Test-Docker {
    try {
        docker ps > $null 2>&1
        return $true
    }
    catch {
        return $false
    }
}

function Test-DockerNetwork {
    $network = docker network ls --filter "name=terceirogestor_network" --quiet 2>$null
    return $null -ne $network
}

function Create-DockerNetwork {
    if (-not (Test-DockerNetwork)) {
        Write-Log "Criando rede Docker..." "Info"
        docker network create terceirogestor_network 2>$null
        Write-Log "Rede criada" "Success"
    }
}

function Test-Container {
    param([string]$Container)
    $running = docker ps --filter "name=$Container" --quiet 2>$null
    return $null -ne $running
}

function Wait-Service {
    param(
        [string]$Container,
        [int]$MaxRetries = 60,
        [int]$DelaySeconds = 2
    )
    
    Write-Log "Aguardando $Container ficar pronto..." "Info"
    
    for ($i = 0; $i -lt $MaxRetries; $i++) {
        try {
            $health = docker inspect $Container --format='{{.State.Health.Status}}' 2>$null
            if ($health -eq "healthy") {
                Write-Log "$Container está pronto!" "Success"
                return $true
            }
            if ($health -eq "unhealthy") {
                Write-Log "$Container falhou no healthcheck" "Error"
                return $false
            }
        }
        catch { }
        
        Start-Sleep -Seconds $DelaySeconds
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Log "$Container não respondeu como healthy. Pode estar ainda iniciando..." "Warning"
    return $false
}

function Get-ContainerHealth {
    param([string]$Container)
    try {
        $status = docker inspect $Container --format='{{.State.Status}}' 2>$null
        $health = docker inspect $Container --format='{{.State.Health.Status}}' 2>$null
        
        if ($null -eq $status) {
            return "not-found"
        }
        
        if ($status -eq "running") {
            return $health ?? "running (no healthcheck)"
        }
        
        return $status
    }
    catch {
        return "error"
    }
}

function Start-Service {
    param(
        [string]$Service,
        [string]$ComposeFile,
        [string]$Container,
        [bool]$WaitHealthy = $true
    )
    
    Write-Log "Iniciando $Service..." "Info"
    
    $buildFlag = if ($Build) { "--build" } else { "" }
    
    if ($Verbose) {
        iex "docker compose -f $ComposeFile up -d $buildFlag"
    }
    else {
        iex "docker compose -f $ComposeFile up -d $buildFlag 2>&1" | Out-Null
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Erro ao iniciar $Service" "Error"
        return $false
    }
    
    if ($WaitHealthy) {
        return (Wait-Service -Container $Container)
    }
    
    Write-Log "$Service iniciado" "Success"
    return $true
}

function Stop-Service {
    param([string]$Service, [string]$ComposeFile)
    
    Write-Log "Parando $Service..." "Info"
    
    if ($Verbose) {
        iex "docker compose -f $ComposeFile down"
    }
    else {
        iex "docker compose -f $ComposeFile down 2>&1" | Out-Null
    }
    
    Write-Log "$Service parado" "Success"
}

function Show-Status {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║              STATUS DOS SERVIÇOS DOCKER                        ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    $services = @(
        @{Name = "PostgreSQL"; Container = "tg_postgres"; File = "docker-compose.postgres.yml" }
        @{Name = "Backend"; Container = "tg_backend"; File = "docker-compose.backend.yml" }
        @{Name = "Frontend"; Container = "tg_frontend"; File = "docker-compose.frontend.yml" }
    )
    
    foreach ($svc in $services) {
        $health = Get-ContainerHealth -Container $svc.Container
        $healthColor = switch ($health) {
            "healthy" { "Green" }
            "running (no healthcheck)" { "Yellow" }
            "not-found" { "Gray" }
            default { "Red" }
        }
        
        $name = $svc.Name.PadRight(15)
        $healthDisplay = $health.PadRight(30)
        
        Write-Host "  $name │ $healthDisplay " -ForegroundColor $healthColor
    }
    
    Write-Host ""
    Write-Host "Rede Docker:" -ForegroundColor Cyan
    if (Test-DockerNetwork) {
        Write-Host "  ✅ terceirogestor_network (ativa)" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ terceirogestor_network (inativa)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Acesso:" -ForegroundColor Cyan
    Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  Backend:   http://localhost:3001" -ForegroundColor Cyan
    Write-Host "  Postgres:  postgresql://postgres@localhost:5432/terceirogestor" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Logs {
    param([string]$Service = "all")
    
    Write-Host ""
    Write-Log "Logs em tempo real (Ctrl+C para sair)..." "Info"
    Write-Host ""
    
    $jobs = @()
    
    if ($Service -in @("postgres", "all")) {
        $jobs += Start-Job -ScriptBlock {
            Write-Host "[postgres] " -NoNewline -ForegroundColor Cyan
            docker logs -f tg_postgres 2>$null | ForEach-Object { "[postgres] $_" }
        } -Name "postgres_logs"
    }
    
    if ($Service -in @("backend", "all")) {
        $jobs += Start-Job -ScriptBlock {
            Write-Host "[backend] " -NoNewline -ForegroundColor Yellow
            docker logs -f tg_backend 2>$null | ForEach-Object { "[backend] $_" }
        } -Name "backend_logs"
    }
    
    if ($Service -in @("frontend", "all")) {
        $jobs += Start-Job -ScriptBlock {
            Write-Host "[frontend] " -NoNewline -ForegroundColor Magenta
            docker logs -f tg_frontend 2>$null | ForEach-Object { "[frontend] $_" }
        } -Name "frontend_logs"
    }
    
    Wait-Job -Job $jobs
}

function Reset-Environment {
    Write-Host ""
    Write-Log "AVISO: Isso vai deletar TODOS os dados dos volumes!" "Warning"
    $confirm = Read-Host "Tem certeza? Digite 'sim' para confirmar"
    
    if ($confirm -ne "sim") {
        Write-Log "Cancelado" "Info"
        return
    }
    
    Write-Log "Parando todos os serviços..." "Info"
    Stop-Service -Service "Frontend" -ComposeFile "docker-compose.frontend.yml"
    Stop-Service -Service "Backend" -ComposeFile "docker-compose.backend.yml"
    Stop-Service -Service "PostgreSQL" -ComposeFile "docker-compose.postgres.yml"
    
    Write-Log "Removendo volumes..." "Warning"
    docker volume rm terceirogestor_postgres_data terceirogestor_uploads_data 2>$null
    
    Write-Log "Removendo imagens..." "Warning"
    docker rmi terceirogestor-backend terceirogestor-frontend 2>$null
    
    Write-Log "Ambiente resetado!" "Success"
    Write-Log "Execute novamente para recriar:" "Info"
    Write-Log "  .\docker-manage.ps1 all" "Gray"
}

function Backup-Database {
    param([string]$OutputPath = "backup-$(Get-Date -f 'yyyy-MM-dd-HHmmss').sql")
    
    Write-Log "Fazendo backup do banco de dados..." "Info"
    
    if (-not (Test-Container -Container "tg_postgres")) {
        Write-Log "PostgreSQL não está rodando!" "Error"
        return
    }
    
    try {
        docker exec tg_postgres pg_dump -U postgres -d terceirogestor > $OutputPath 2>&1
        Write-Log "Backup salvo em: $OutputPath" "Success"
    }
    catch {
        Write-Log "Erro ao fazer backup: $_" "Error"
    }
}

# ============================================================
# Main Logic
# ============================================================

if (-not (Test-Docker)) {
    Write-Log "Docker não está rodando! Inicie o Docker Desktop." "Error"
    exit 1
}

# Criar rede Docker se não existir
Create-DockerNetwork

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         TERCEIERO GESTOR - Docker Management Script            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

switch ($Service.ToLower()) {
    "postgres" {
        Start-Service -Service "PostgreSQL" -ComposeFile "docker-compose.postgres.yml" -Container "tg_postgres" -WaitHealthy $true
    }
    
    "backend" {
        if (-not (Test-Container -Container "tg_postgres")) {
            Write-Log "PostgreSQL não está rodando! Inicie với postgres primeiro." "Error"
            exit 1
        }
        Start-Service -Service "Backend" -ComposeFile "docker-compose.backend.yml" -Container "tg_backend" -WaitHealthy $true
    }
    
    "frontend" {
        if (-not (Test-Container -Container "tg_backend")) {
            Write-Log "Backend não está rodando! Inicie com backend primeiro." "Error"
            exit 1
        }
        Start-Service -Service "Frontend" -ComposeFile "docker-compose.frontend.yml" -Container "tg_frontend" -WaitHealthy $true
    }
    
    "all" {
        Write-Log "Iniciando todos os serviços..." "Info"
        Write-Host ""
        
        if (Start-Service -Service "PostgreSQL" -ComposeFile "docker-compose.postgres.yml" -Container "tg_postgres") {
            Write-Host ""
            if (Start-Service -Service "Backend" -ComposeFile "docker-compose.backend.yml" -Container "tg_backend") {
                Write-Host ""
                Start-Service -Service "Frontend" -ComposeFile "docker-compose.frontend.yml" -Container "tg_frontend" | Out-Null
            }
        }
        
        Show-Status
    }
    
    "down" {
        Stop-Service -Service "Frontend" -ComposeFile "docker-compose.frontend.yml"
        Stop-Service -Service "Backend" -ComposeFile "docker-compose.backend.yml"
        Stop-Service -Service "PostgreSQL" -ComposeFile "docker-compose.postgres.yml"
        Write-Host ""
        Write-Log "Todos os serviços parados (dados persistem em volumes)" "Success"
    }
    
    "status" {
        Show-Status
    }
    
    "logs" {
        Show-Logs -Service "all"
    }
    
    "reset" {
        Reset-Environment
    }
    
    "backup" {
        Backup-Database
    }
    
    default {
        Write-Host "Comandos disponíveis:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  postgres       - Iniciar só PostgreSQL" -ForegroundColor Gray
        Write-Host "  backend        - Iniciar só Backend" -ForegroundColor Gray
        Write-Host "  frontend       - Iniciar só Frontend" -ForegroundColor Gray
        Write-Host "  all            - Iniciar tudo (padrão)" -ForegroundColor Gray
        Write-Host "  down           - Parar todos os serviços" -ForegroundColor Gray
        Write-Host "  status         - Ver status de cada serviço" -ForegroundColor Gray
        Write-Host "  logs           - Ver logs em tempo real" -ForegroundColor Gray
        Write-Host "  reset          - Deletar TODOS os dados e recomeçar" -ForegroundColor Gray
        Write-Host "  backup         - Fazer backup do banco de dados" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Parametros:" -ForegroundColor Yellow
        Write-Host "  -Build         - Rebuild imagens (útil após mudanças)" -ForegroundColor Gray
        Write-Host "  -Verbose       - Mostrar output completo" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Exemplos:" -ForegroundColor Yellow
        Write-Host "  .\docker-manage.ps1" -ForegroundColor Cyan
        Write-Host "  .\docker-manage.ps1 all" -ForegroundColor Cyan
        Write-Host "  .\docker-manage.ps1 postgres" -ForegroundColor Cyan
        Write-Host "  .\docker-manage.ps1 all -Build" -ForegroundColor Cyan
        Write-Host "  .\docker-manage.ps1 down" -ForegroundColor Cyan
        Write-Host "  .\docker-manage.ps1 status" -ForegroundColor Cyan
        Write-Host ""
    }
}
