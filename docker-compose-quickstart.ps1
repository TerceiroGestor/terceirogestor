# Quickstart script para rodar os docker-compose individuais
# Uso: .\docker-compose-quickstart.ps1 [postgres|backend|frontend|all|down|logs]

param(
    [string]$Command = "all",
    [switch]$Follow = $false
)

$ErrorActionPreference = "Stop"

function Test-Docker {
    try {
        docker ps > $null 2>&1
        return $true
    }
    catch {
        return $false
    }
}

function Wait-Service {
    param(
        [string]$Container,
        [int]$MaxRetries = 30,
        [int]$DelaySeconds = 2
    )
    
    Write-Host "⏳ Aguardando $Container ficar pronto..." -ForegroundColor Yellow
    
    for ($i = 0; $i -lt $MaxRetries; $i++) {
        $health = docker inspect $Container --format='{{.State.Health.Status}}' 2>$null
        if ($health -eq "healthy") {
            Write-Host "✅ $Container está pronto!" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds $DelaySeconds
        Write-Host "." -NoNewline
    }
    
    Write-Host ""
    Write-Host "⚠️  $Container não respondeu como healthy. Pode estar iniciando ainda." -ForegroundColor Yellow
    return $false
}

if (-not (Test-Docker)) {
    Write-Host "❌ Docker não está rodando! Inicie o Docker Desktop primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "🐳 Docker Compose Quickstart" -ForegroundColor Cyan
Write-Host ""

switch ($Command.ToLower()) {
    "postgres" {
        Write-Host "▶️  Subindo PostgreSQL..." -ForegroundColor Green
        docker compose -f docker-compose.postgres.yml up -d
        Start-Sleep -Seconds 2
        Wait-Service "tg_postgres"
        Write-Host ""
        Write-Host "ℹ️  PostgreSQL rodando em: postgresql://postgres:password@localhost:5432/terceirogestor" -ForegroundColor Cyan
    }
    
    "backend" {
        Write-Host "▶️  Subindo Backend..." -ForegroundColor Green
        docker compose -f docker-compose.backend.yml up -d
        Wait-Service "tg_backend"
        Write-Host ""
        Write-Host "ℹ️  Backend rodando em: http://localhost:3001" -ForegroundColor Cyan
    }
    
    "frontend" {
        Write-Host "▶️  Subindo Frontend..." -ForegroundColor Green
        docker compose -f docker-compose.frontend.yml up -d
        Wait-Service "tg_frontend"
        Write-Host ""
        Write-Host "ℹ️  Frontend rodando em: http://localhost:3000" -ForegroundColor Cyan
    }
    
    "all" {
        Write-Host "▶️  Subindo todos os serviços..." -ForegroundColor Green
        Write-Host ""
        
        Write-Host "1️⃣  PostgreSQL..." -ForegroundColor Cyan
        docker compose -f docker-compose.postgres.yml up -d
        Wait-Service "tg_postgres"
        Write-Host ""
        
        Write-Host "2️⃣  Backend..." -ForegroundColor Cyan
        docker compose -f docker-compose.backend.yml up -d
        Wait-Service "tg_backend"
        Write-Host ""
        
        Write-Host "3️⃣  Frontend..." -ForegroundColor Cyan
        docker compose -f docker-compose.frontend.yml up -d
        Wait-Service "tg_frontend"
        Write-Host ""
        
        Write-Host "✅ Todos os serviços rodando:" -ForegroundColor Green
        Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "   - Backend: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "   - PostgreSQL: postgresql://postgres:password@localhost:5432/terceirogestor" -ForegroundColor Cyan
    }
    
    "down" {
        Write-Host "⏹️  Parando todos os serviços..." -ForegroundColor Yellow
        docker compose -f docker-compose.postgres.yml down
        docker compose -f docker-compose.backend.yml down
        docker compose -f docker-compose.frontend.yml down
        Write-Host "✅ Todos os serviços parados" -ForegroundColor Green
    }
    
    "logs" {
        Write-Host "📋 Logs em tempo real..." -ForegroundColor Cyan
        Write-Host "   (pressione Ctrl+C para sair)" -ForegroundColor Gray
        Write-Host ""
        
        # Rodar logs em paralelo
        $jobs = @()
        $jobs += Start-Job -ScriptBlock { docker compose -f docker-compose.postgres.yml logs -f postgres 2>$null } -Name "postgres"
        $jobs += Start-Job -ScriptBlock { docker compose -f docker-compose.backend.yml logs -f backend 2>$null } -Name "backend"
        $jobs += Start-Job -ScriptBlock { docker compose -f docker-compose.frontend.yml logs -f frontend 2>$null } -Name "frontend"
        
        Wait-Job -Job $jobs
    }
    
    "status" {
        Write-Host "📊 Status dos serviços:" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "PostgreSQL:" -ForegroundColor Cyan
        docker compose -f docker-compose.postgres.yml ps
        Write-Host ""
        
        Write-Host "Backend:" -ForegroundColor Cyan
        docker compose -f docker-compose.backend.yml ps
        Write-Host ""
        
        Write-Host "Frontend:" -ForegroundColor Cyan
        docker compose -f docker-compose.frontend.yml ps
    }
    
    default {
        Write-Host "❌ Comando inválido: $Command" -ForegroundColor Red
        Write-Host ""
        Write-Host "Comandos disponíveis:" -ForegroundColor Yellow
        Write-Host "  postgres   - Subir só PostgreSQL"
        Write-Host "  backend    - Subir só Backend"
        Write-Host "  frontend   - Subir só Frontend"
        Write-Host "  all        - Subir tudo (padrão)"
        Write-Host "  down       - Parar todos"
        Write-Host "  logs       - Ver logs em tempo real"
        Write-Host "  status     - Ver status"
        Write-Host ""
        Write-Host "Exemplos:" -ForegroundColor Gray
        Write-Host "  .\docker-compose-quickstart.ps1"
        Write-Host "  .\docker-compose-quickstart.ps1 all"
        Write-Host "  .\docker-compose-quickstart.ps1 postgres"
        Write-Host "  .\docker-compose-quickstart.ps1 down"
        exit 1
    }
}
