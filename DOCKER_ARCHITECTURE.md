# Arquitetura Docker - Terceiero Gestor

## Visão Geral - Serviços Separados

```
┌─────────────────────────────────────────────────────────────────┐
│                     TERCEIERO GESTOR DOCKER                      │
│                    Serviços Independentes                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│  FRONTEND (Next.js)  │     │ BACKEND (NestJS)     │     │  POSTGRES (Database) │
│  Port: 3000          │────▶│ Port: 3001           │────▶│  Port: 5432          │
│  Container: tg_*     │     │ Container: tg_      │     │  Container: tg_      │
│  .env vars:          │     │ .env vars:           │     │  .env vars:          │
│  - FRONTEND_PORT     │     │ - BACKEND_PORT       │     │  - POSTGRES_*        │
│  - FRONTEND_BIND...  │     │ - BACKEND_BIND...    │     │  - POSTGRES_HOST_*   │
│  - NEXT_PUBLIC_API_*𝗎│     │ - DATABASE_URL       │     │                      │
│  - API_INTERNAL_URL  │     │ - JWT_SECRET         │     │                      │
│                      │     │ - TOTP_*             │     │                      │
└──────────────────────┘     │ - PII_*              │     └──────────────────────┘
                             │ - SMTP_*             │
                             │ - OAUTH_*            │
                             │ - WEB_URL            │
                             │ - TZ                 │
                             └──────────────────────┘

                          ↑ Rede: terceirogestor_network ↑
                            (Docker bridge network)
```

---

## Como se comunicam

### Docker Internal Communication (via rede Docker)
- Frontend → Backend: `http://backend:3001` (via `API_INTERNAL_URL`)
- Backend → Postgres: `postgresql://postgres:password@postgres:5432/terceirogestor`
- Nome do container = hostname na rede interna

### Host Communication (via localhost)
- Browser → Frontend: `http://localhost:3000`
- Browser → Backend API: `http://localhost:3001`
- Client DB Tool → Postgres: `postgresql://postgres:password@localhost:5432/terceirogestor`

---

## Arquivos Docker Compose

### 1. docker-compose.postgres.yml
```yaml
postgres:
  image: postgres:16-alpine
  container_name: tg_postgres  ← hostname na rede
  ports: 127.0.0.1:5432:5432  ← acessível via localhost:5432
  networks: terceirogestor_network
  volumes: postgres_data:/var/lib/postgresql/data
  healthcheck: pg_isready -U postgres -d terceirogestor
```

**Quando usar**:
- Desenvolvimento local com banco local
- Testes de dados

**Quando NÃO usar** (futuro):
- Produção no GCP (usar CloudSQL)
- Múltiplas regiões/instances

---

### 2. docker-compose.backend.yml
```yaml
backend:
  build: ./backend
  container_name: tg_backend  ← hostname na rede
  ports: 127.0.0.1:3001:3001 ← acessível via localhost:3001
  networks: terceirogestor_network
  volumes: uploads_data:/app/uploads
  command: 
    - npm run db:migrate:deploy  ← roda migrations automaticamente
    - node dist/main
  depends_on:
    postgres: condition: service_healthy
  healthcheck: wget http://localhost:3001/
  environment:
    DATABASE_URL: postgresql://postgres:...@postgres:5432/...
    # ^^ usa "postgres" hostname, não localhost
```

**Responsabilidades do Backend**:
1. Criar database se não existir (`ensure-database.js`)
2. Rodar migrations do Prisma
3. Servir API em port 3001

---

### 3. docker-compose.frontend.yml
```yaml
frontend:
  build: ./frontend
  container_name: tg_frontend  ← hostname na rede
  ports: 127.0.0.1:3000:3000 ← acessível via localhost:3000
  networks: terceirogestor_network
  healthcheck: wget http://localhost:3000/
  environment:
    NEXT_PUBLIC_API_URL: /api  ← URL pública do API
    API_INTERNAL_URL: http://backend:3001  ← URL interna da docker rede
```

**Responsabilidades do Frontend**:
1. Build Next.js app
2. Servir página em port 3000
3. Fazer requests para `/api` (redirecionado pelo nginx/proxy)

---

## Variáveis de Ambiente - Mapeamento

### Host vs Docker Network

| Variável | Local Dev | Docker |
|----------|-----------|--------|
| `POSTGRES_HOST` | localhost | postgres |
| `BACKEND_HOST` | localhost | backend |
| `API_INTERNAL_URL` | http://localhost:3001 | http://backend:3001 |
| `DATABASE_URL` | postgresql://...@localhost:5432 | postgresql://...@postgres:5432 |

---

### Postgresql

```env
# Credenciais (iguais em qualquer lugar)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me-now
POSTGRES_DB=terceirogestor

# Bind (acessibilidade do host)
POSTGRES_BIND_ADDRESS=127.0.0.1  # só localhost, não 0.0.0.0
POSTGRES_HOST_PORT=5432            # porta no host

# Hostname (usado quando rodar via docker)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
```

---

### Backend

```env
# Credenciais de DB (aponta via "postgres" hostname)
DATABASE_URL=postgresql://postgres:password@postgres:5432/terceirogestor
SHADOW_DATABASE_URL=postgresql://postgres:password@postgres:5432/terceirogestor_shadow

# Bind (acessibilidade do host)
BACKEND_BIND_ADDRESS=127.0.0.1
BACKEND_PORT=3001

# Hostname (usado quando rodar via docker)
BACKEND_HOST=backend

# Segurança
JWT_SECRET=change-me-now
TOTP_ENCRYPTION_KEY=...
PII_MASTER_KEY=...

# Configurações
APP_NAME=Terceiro Gestor
TZ=America/Sao_Paulo
```

---

### Frontend

```env
# Bind (acessibilidade do host)
FRONTEND_BIND_ADDRESS=127.0.0.1
FRONTEND_PORT=3000

# API públcio (usado pelo browser)
# Se rodando atrás de nginx: /api
# Se acesso direto: http://localhost:3001
NEXT_PUBLIC_API_URL=/api

# API interno (usado pelo servidor Next.js para SSR)
API_INTERNAL_URL=http://backend:3001
```

---

## Ciclo de Vida - Sequência correta

```
┌─────────────────────────────────────────┐
│ STARTUP - Ordem exata importante        │
└─────────────────────────────────────────┘

1. PostgreSQL
   ✓ docker compose -f docker-compose.postgres.yml up -d
   ✓ Aguardar healthcheck: "healthy"
   ✓ Verificar: docker inspect tg_postgres --format={{.State.Health.Status}}

2. Backend 
   ✓ docker compose -f docker-compose.backend.yml up -d
   ✓ Executa:
     - ensure-database.js (cria DB se não existe)
     - prisma migrate deploy (roda migrations)
     - node dist/main (inicia servidor)
   ✓ Aguardar healthcheck: "healthy"

3. Frontend
   ✓ docker compose -f docker-compose.frontend.yml up -d
   ✓ Faz requests para http://backend:3001 (rede interna)
   ✓ Aguardar healthcheck: "healthy"

┌─────────────────────────────────────────┐
│ SHUTDOWN - Ordem não importa            │
└─────────────────────────────────────────┘

docker compose -f docker-compose.frontend.yml down
docker compose -f docker-compose.backend.yml down
docker compose -f docker-compose.postgres.yml down

Dados persistem em volumes (postgres_data, uploads_data)
```

---

## Volumes

### postgresql
```
Volume Name: terceirogestor_postgres_data
Location: /var/lib/docker/volumes/terceirogestor_postgres_data/_data
Mounted at: /var/lib/postgresql/data (inside container)
Persists: Database files (all tables, schemas, data)
Backup method: pg_dump
```

### uploads
```
Volume Name: terceirogestor_uploads_data
Location: /var/lib/docker/volumes/terceirogestor_uploads_data/_data
Mounted at: /app/uploads (inside container)
Persists: User uploaded files (avatars, documents, etc)
Backup method: zip/tar the folder
```

---

## Network

### terceirogestor_network
```
Type: Bridge Network
Hostname Resolution:
  - postgres:5432     → tg_postgres container
  - backend:3001      → tg_backend container
  - frontend:3000     → tg_frontend container

Isolation:
  - Containers comunicam apenas via rede Docker
  - Host acessa via localhost:PORT mapeado
  - Altamente seguro para desenvolvimento local
```

---

## Healthchecks

Cada serviço tem healthcheck para determinar quando está "pronto":

```
PostgreSQL:
  ✓ Comando: pg_isready -U postgres -d terceirogestor
  ✓ Intervalo: 10s
  ✓ Timeout: 5s
  ✓ Status pronto em: ~20-30s

Backend:
  ✓ Comando: wget http://localhost:3001/
  ✓ Intervalo: 15s
  ✓ Timeout: 5s
  ✓ Status pronto em: ~30-40s (inclui migrations)

Frontend:
  ✓ Comando: wget http://localhost:3000/
  ✓ Intervalo: 15s
  ✓ Timeout: 5s
  ✓ Status pronto em: ~30-40s
```

Verificar status:
```powershell
docker inspect tg_postgres --format='{{.State.Health.Status}}'
docker inspect tg_backend --format='{{.State.Health.Status}}'
docker inspect tg_frontend --format='{{.State.Health.Status}}'
```

---

## Logs

Cada container produz logs independentes:

```powershell
# Ver logs específicos
docker logs -f tg_postgres
docker logs -f tg_backend
docker logs -f tg_frontend

# Via docker compose
docker compose -f docker-compose.postgres.yml logs -f
docker compose -f docker-compose.backend.yml logs -f
docker compose -f docker-compose.frontend.yml logs -f

# Histórico completo
docker logs --since 1h tg_backend
docker logs --tail 100 tg_backend
```

---

## Troubleshooting - Fluxos Comuns

### ❌ "Backend can't connect to Postgres"

```
Verificação:
1. Postgres está rodando?
   → docker compose -f docker-compose.postgres.yml ps

2. Postgres está healthy?
   → docker inspect tg_postgres --format='{{.State.Health.Status}}'

3. Logs do postgres?
   → docker compose -f docker-compose.postgres.yml logs postgres

4. DATABASE_URL está apontando para "postgres" (não localhost)?
   → grep DATABASE_URL .env
```

### ❌ "Frontend can't reach Backend"

```
Verificação:
1. Backend está rodando?
   → docker compose -f docker-compose.backend.yml ps

2. Backend está healthy?
   → docker inspect tg_backend --format='{{.State.Health.Status}}'

3. API_INTERNAL_URL está correto?
   → grep API_INTERNAL_URL .env
   → Deve ser: http://backend:3001

4. Teste conectividade:
   → docker exec tg_frontend wget -qO- http://backend:3001/
```

### ❌ "Port already in use"

```
Verificação:
1. Qual processo está usando a porta?
   → netstat -ano | findstr :3000
   → netstat -ano | findstr :3001
   → netstat -ano | findstr :5432

2. Encontrou? Kill it:
   → taskkill /PID <PID> /F

3. Ou mude a porta no .env:
   → FRONTEND_PORT=3001
   → BACKEND_PORT=3002
   → POSTGRES_HOST_PORT=5433
```

### ❌ "Migrations failing"

```
Verificação:
1. Database existe?
   → docker exec tg_postgres psql -U postgres -l

2. Tables estão criadas?
   → docker exec tg_postgres psql -U postgres -d terceirogestor -c "\dt"

3. Logs das migrations?
   → docker compose -f docker-compose.backend.yml logs backend

4. Resetar (CUIDADO - DELETA TUDO):
   → docker compose -f docker-compose.postgres.yml down -v
   → docker compose -f docker-compose.postgres.yml up -d
   → docker compose -f docker-compose.backend.yml up -d
```

---

## Futura Migração para CloudSQL (GCP)

Quando trocar para CloudSQL do GCP:

```env
# REMOVER esses:
# POSTGRES_BIND_ADDRESS
# POSTGRES_HOST_PORT
# (docker-compose.postgres.yml não será mais usado)

# ATUALIZAR para:
DATABASE_URL=postgresql://user:password@your-cloudsql-instance-ip:5432/terceirogestor
POSTGRES_HOST=your-cloudsql-instance-ip
POSTGRES_PORT=5432
POSTGRES_USER=seu_user
POSTGRES_PASSWORD=sua_password
```

**Tudo mais continua igual:**
- Backend via docker-compose.backend.yml (sem mudanças)
- Frontend via docker-compose.frontend.yml (sem mudanças)
- Migrations rodam automaticamente via `prisma migrate deploy`

---

## Performance e Boas Práticas

```
✅ DO:
  - Rodar serviços em ordem: postgres → backend → frontend
  - Fazer commit do docker-compose.*.yml (versionar)
  - Não committar .env (use .env.example)
  - Usar volume mounts para desenvolvimento
  - Resetar volumes quando migrations falham
  - Fazer backup antes de importantes changes

❌ DON'T:
  - Tentar subir backend antes do postgres
  - Usar 0.0.0.0 para BIND_ADDRESS em produção
  - Committar senhas no .env
  - Deletar volumes sem saber o que está fazendo
  - Usar -v flag (down -v) sem backup
  - Mudar DATABASE_URL em runtime
```

---

## Resumo Final

| Aspecto | Valor |
|--------|-------|
| **Docker Compose files** | 3 separados (postgres, backend, frontend) |
| **Network** | 1 compartilhada `terceirogestor_network` |
| **Volumes** | 2 (postgres_data, uploads_data) |
| **Containers** | 3 (tg_postgres, tg_backend, tg_frontend) |
| **Startup time** | ~2-3 minutos (dependendo do PC) |
| **Shutdown** | Instantâneo (dados persistem) |
| **Rebuild** | ~1-2 minutos (cache Docker ajuda) |
| **CloudSQL ready** | Sim, só muda DATABASE_URL |
