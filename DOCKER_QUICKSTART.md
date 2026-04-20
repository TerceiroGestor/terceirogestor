# Docker Compose Individual - Quick Reference

## O que foi criado

```
✅ docker-compose.postgres.yml   - PostgreSQL standalone
✅ docker-compose.backend.yml    - Backend (NestJS) 
✅ docker-compose.frontend.yml   - Frontend (Next.js)
✅ DOCKER_GUIDE.md               - Guia completo com troubleshooting
✅ DOCKER_ARCHITECTURE.md        - Arquitetura técnica detalhada
✅ docker-manage.ps1             - Script PowerShell para gerencial
✅ docker-compose-quickstart.ps1 - Script simplificado para iniciar
✅ .env.example (atualizado)     - Com variáveis para docker separados
```

## Quick Start (3 minutos)

### 1. Primeira Configuração

```powershell
# Copiar arquivo de ambiente
Copy-Item .env.example .env

# Editar .env com suas variáveis (mínimo: POSTGRES_PASSWORD, JWT_SECRET)
notepad .env
```

### 2. Iniciar Serviços (OPÇÃO A - Automático)

```powershell
# Script principal (recomendado)
.\docker-manage.ps1 all
```

### 2. Iniciar Serviços (OPÇÃO B - Manual por etapas)

```powershell
# 1. PostgreSQL
docker compose -f docker-compose.postgres.yml up -d

# 2. Backend
docker compose -f docker-compose.backend.yml up -d

# 3. Frontend
docker compose -f docker-compose.frontend.yml up -d
```

### 3. Verificar Status

```powershell
# Opção A - Script
.\docker-manage.ps1 status

# Opção B - Manual
docker ps

# Opção C - Health individual
docker inspect tg_postgres --format='{{.State.Health.Status}}'
docker inspect tg_backend --format='{{.State.Health.Status}}'
docker inspect tg_frontend --format='{{.State.Health.Status}}'
```

### 4. Acessar

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001  
- **Database**: `postgresql://postgres:password@localhost:5432/terceirogestor`

---

## Comandos Diários

```powershell
# Ver status
.\docker-manage.ps1 status

# Ver logs de um serviço
.\docker-manage.ps1 logs

# Parar tudo
.\docker-manage.ps1 down

# Reiniciar após parada
.\docker-manage.ps1 all

# Rebuild depois de mudanças de código
.\docker-manage.ps1 all -Build

# Fazer backup
.\docker-manage.ps1 backup

# Resetar TUDO (deletar dados)
.\docker-manage.ps1 reset
```

---

## Variáveis Importantes do .env

```env
# --- Credenciais PostgreSQL ---
POSTGRES_USER=postgres
POSTGRES_PASSWORD=MUDE_ISSO ⚠️
POSTGRES_DB=terceirogestor

# --- Acessibilidade do Host ---
POSTGRES_BIND_ADDRESS=127.0.0.1    # só localhost
POSTGRES_HOST_PORT=5432             # porta que acesso do PC

# --- Hostname da Rede Docker ---
POSTGRES_HOST=postgres              # nome do container na rede

# --- Backend ---
BACKEND_PORT=3001
BACKEND_HOST=backend
JWT_SECRET=MUDE_ISSO ⚠️

# --- Frontend ---
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=/api

# --- URL Pública ---
WEB_URL=http://localhost           # mude aqui se mudar de IP/domínio
```

---

## Fluxo de Rede

```
Browser (localhost:3000)
    ↓
[Frontend Container]
    ├─→ Backend Request → http://backend:3001 (rede interna)
    │
[Backend Container]
    └─→ Database Request → postgresql://postgres:5432 (rede interna)
        ↓
[PostgreSQL Container]
```

---

## Como é diferente do original

| Aspecto | Antes | Agora |
|---------|-------|-------|
| **Arquivos** | 1 docker-compose.yml | 3 separados |
| **Iniciar** | `docker compose up -d` (tudo) | `docker-manage.ps1 all` (independente) |
| **Desenvolver** | Rebuild tudo | Rebuild só o serviço mudado |
| **Parar** | `docker compose down` | `docker-manage.ps1 down` |
| **Testes** | Difícil isolar serviços | Fácil testar um por um |
| **CloudSQL** | Precisa remover postgres do compose | Só muda DATABASE_URL no .env |

---

## Troubleshooting Rápido

### Port já está em uso
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Backend não encontra Postgres
```
✓ Postgres está running? docker ps
✓ Postgres é healthy? docker inspect tg_postgres --format='{{.State.Health.Status}}'
✓ DATABASE_URL usa "postgres"? grep DATABASE_URL .env
```

### Frontend não carrega
```
✓ Backend está running? docker ps
✓ NEXT_PUBLIC_API_URL está correto? grep NEXT_PUBLIC_API_URL .env
✓ Logs? docker logs -f tg_frontend
```

---

## Próximas Etapas

### Desenvolvimento Local
1. Deixe os docker-compose rodando
2. Faça mudanças no código
3. `docker-manage.ps1 backend -Build` para rebuild (ou `docker compose -f docker-compose.backend.yml up -d --build`)

### Para CloudSQL (GCP)
1. Crie uma instância CloudSQL
2. Atualize `.env`:
   ```env
   DATABASE_URL=postgresql://user:pass@cloudsql-ip:5432/terceirogestor
   POSTGRES_HOST=cloudsql-ip
   ```
3. Remova: `docker compose -f docker-compose.postgres.yml down`
4. Backend continua igual, apenas aponta para CloudSQL

### Para Produção
Futuramente você pode usar:
- **Cloud Run** (para backend/frontend)
- **CloudSQL** (para database)
- **Cloud Storage** (para uploads)

---

## Documentação Completa

Para mais detalhes, veja:
- `DOCKER_GUIDE.md` - Guia completo com todos os comandos
- `DOCKER_ARCHITECTURE.md` - Visão técnica da arquitetura

---

## Scripts Disponíveis

### `docker-manage.ps1` (Recomendado)
```powershell
.\docker-manage.ps1 all              # Iniciar tudo
.\docker-manage.ps1 postgres         # Só postgres
.\docker-manage.ps1 backend          # Só backend
.\docker-manage.ps1 frontend         # Só frontend
.\docker-manage.ps1 down             # Parar tudo
.\docker-manage.ps1 status           # Status
.\docker-manage.ps1 logs             # Logs em tempo real
.\docker-manage.ps1 backup           # Backup do DB
.\docker-manage.ps1 reset            # Reset (DELETE ALL!)
.\docker-manage.ps1 all -Build       # Rebuild
```

### `docker-compose-quickstart.ps1` (Simplificado)
```powershell
.\docker-compose-quickstart.ps1 postgres
.\docker-compose-quickstart.ps1 backend
.\docker-compose-quickstart.ps1 frontend
.\docker-compose-quickstart.ps1 all
.\docker-compose-quickstart.ps1 down
.\docker-compose-quickstart.ps1 status
.\docker-compose-quickstart.ps1 logs
```

---

## Dados Persistem

### Volumes
```
✅ postgres_data    - banco de dados (não é deletado com down)
✅ uploads_data     - uploads do usuário (não é deletado com down)
```

### Comandos Perigosos
```
⚠️  docker compose down -v        # DELETA VOLUMES!
❌  docker system prune -a --volumes  # DELETA TUDO!

✅  docker compose down           # OK, dados persistem
✅  docker compose up -d          # OK, recria containers
```

---

## Dúvidas?

```powershell
# Ver ajuda
.\docker-manage.ps1

# Ver logs detalhados
docker logs -f tg_backend

# Testar conectividade
docker exec tg_frontend ping backend

# Acessar terminal do container
docker exec -it tg_backend bash

# Verificar IP da rede
docker inspect tg_backend --format='{{json .NetworkSettings.Networks}}'
```

---

## Resumo da Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    FRONTEND     │────▶│      BACKEND     │────▶│    POSTGRESQL    │
│  :3000          │     │    :3001         │     │    :5432         │
│  Next.js        │     │    NestJS        │     │                  │
│                 │     │    Prisma ORM    │     │  volumes:        │
│ Volume:         │     │                  │     │  - postgres_data │
│ (uploads)       │     │ Volume:          │     │                  │
│                 │     │ - uploads_data   │     │                  │
└─────────────────┘     └──────────────────┘     └──────────────────┘
        ↑                       ↑                       ↑
        └───────── Docker Network: terceirogestor_network ────┘

Comunicação:
  Browser → Frontend (localhost:3000)
  Frontend → Backend (http://backend:3001)
  Backend → Postgres (postgresql://postgres:5432)
```

---

## TL;DR - 30 segundos

```powershell
# 1. Setup
Copy-Item .env.example .env
notepad .env  # editar POSTGRES_PASSWORD e JWT_SECRET

# 2. Iniciar
.\docker-manage.ps1

# 3. Acessar
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

Pronto! 🚀
