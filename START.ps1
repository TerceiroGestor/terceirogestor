#!/usr/bin/env pwsh
# 🚀 START HERE - Terceiero Gestor Docker Setup

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🐳 Tercerio Gestor - Docker Setup                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Criando .env de .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Arquivo .env criado!" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE: Edite .env com suas variáveis!" -ForegroundColor Yellow
        Write-Host "   Abra em editor: notepad .env" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Variáveis OBRIGATÓRIAS:" -ForegroundColor Yellow
        Write-Host "   • POSTGRES_PASSWORD (senha do banco)" -ForegroundColor Gray
        Write-Host "   • JWT_SECRET (chave JWT)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Depois execute novamente: .\docker-manage.ps1" -ForegroundColor Cyan
        Write-Host ""
        exit 0
    }
    else {
        Write-Host "❌ .env.example não encontrado!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "ℹ️  Arquivo .env encontrado. Iniciando Docker..." -ForegroundColor Cyan
Write-Host ""

# Start docker management
& ".\docker-manage.ps1"
