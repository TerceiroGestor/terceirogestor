# Docker - Exemplos Práticos

Cenários reais e como lidar com eles.

---

## Cenário 1: Primeira Subida do Projeto

```powershell
# 1. Clonar/atualizar código
git clone https://seu-repo.git
cd c:\server\system_development

# 2. Preparar ambiente
Copy-Item .env.example .env
notepad .env  # editar variáveis necessárias

# 3. Subir tudo
.\docker-manage.ps1

# Resultado:
# ✅ PostgreSQL iniciado e pronto (port 5432)
# ✅ Backend iniciado com migrations rodadas (port 3001)
# ✅ Frontend construído e pronto (port 3000)

# 4. Acessar
Start-Process http://localhost:3000
```

**Tempo total**: ~2-3 minutos  
**Dados**: Limpo (migrations rodam, seed opcionalmente)

---

## Cenário 2: Mudança no Código Backend

```powershell
# Você editou: backend/src/users/users.service.ts

# 1. Parar backend
docker compose -f docker-compose.backend.yml down

# 2. Rebuild com novas mudanças
docker compose -f docker-compose.backend.yml up -d --build

# Ver logs
docker logs -f tg_backend

# Resultado:
# ✅ Novo código compilado
# ✅ Servidor reiniciado com mudanças
# ✅ Connections mantidas com Postgres
```

**Tempo total**: ~30-60 segundos  
**Dados**: Preservados  
**Nota**: Database continua rodando em outro container

---

## Cenário 3: Mudança no Código Frontend

```powershell
# Você editou: frontend/src/pages/index.tsx

# 1. Parar frontend
docker compose -f docker-compose.frontend.yml down

# 2. Rebuild
docker compose -f docker-compose.frontend.yml up -d --build

# Ver logs
docker logs -f tg_frontend

# Resultado:
# ✅ Next.js rebuilt com hot-reload
# ✅ Novo código servido em http://localhost:3000
```

**Tempo total**: ~20-30 segundos  
**Dados**: Não afeta (é só frontend)  
**Dev Experience**: Next.js tem hot reload se rodasse local

---

## Cenário 4: Parou o Docker, Precisa Reiniciar

```powershell
# Seu PC foi reiniciado ou Docker parou

# Tudo continua onde deixou:
.\docker-manage.ps1

# Resultado:
# ✅ Containers reiniados
# ✅ Dados intactos (volumes persistiram)
# ✅ PostgreSQL, Backend e Frontend online
```

**Dados**: ✅ 100% preservados  
**Configuração**: Mantida (.env não mudou)

---

## Cenário 5: Problemas de Conexão Backend → Postgres

```powershell
# Você vê erro: "ECONNREFUSED at 127.0.0.1:5432"

# Diagnóstico
docker ps  # Ver containers rodando

# Se postgres não está rodando:
docker compose -f docker-compose.postgres.yml up -d

# Aguarde ficar healthy
docker inspect tg_postgres --format='{{.State.Health.Status}}'

# Depois reinicie backend
docker compose -f docker-compose.backend.yml restart

# Ver logs
docker logs -f tg_backend
```

**Causa comum**: Postgres parou, backend tentou conectar  
**Solução**: Seguir ordem: postgres → backend → frontend

---

## Cenário 6: Adicionar Seed de Dados de Teste

```powershell
# Backend está rodando

# Rodar seed script
docker exec tg_backend npm run db:seed

# Ver logs
docker logs -f tg_backend | Select-String "seed"

# Resultado:
# ✅ Dados de teste inseridos no banco
# ✅ Pronto para testar
```

---

## Cenário 7: Exportar/Restaurar Database

### Backup
```powershell
# Opção A - Script automático
.\docker-manage.ps1 backup

# Resultado: backup-YYYY-MM-DD-HHMMSS.sql criado

# Opção B - Manual
docker exec tg_postgres pg_dump -U postgres -d terceeiro-gestor > meu-backup.sql
```

### Restaurar
```powershell
# Banco está rodando

# Restaurar
docker exec -i tg_postgres psql -U postgres -d terceeiro-gestor < meu-backup.sql

# Verificar
docker exec tg_postgres psql -U postgres -d terceeiro-gestor -c "SELECT count(*) FROM users;"
```

---

## Cenário 8: Acessar Terminal do Container

```powershell
# Backend - terminal com bash
docker exec -it tg_backend bash
  $ npm run build
  $ npm run test:e2e
  $ exit

# PostgreSQL - terminal SQL
docker exec -it tg_postgres psql -U postgres -d terceeiro-gestor
  terceeiro-gestor=# SELECT * FROM users LIMIT 5;
  terceeiro-gestor=# \dt  -- listar tabelas
  terceeiro-gestor=# \q   -- sair

# Frontend - terminal (menos útil, é server-side)
docker exec -it tg_frontend bash
```

---

## Cenário 9: Atualizar Código via Git

```powershell
# Novo código foi feito push para main

# 1. Parar tudo
.\docker-manage.ps1 down

# 2. Atualizar código
git pull origin main

# 3. Subir tudo rebuilt
.\docker-manage.ps1 all -Build

# Resultado:
# ✅ Novas mudanças baixadas
# ✅ Containers reconstruídos
# ✅ Migrations executadas (se houver)
# ✅ Dados preservados
```

**Nota**: Se teve mudanças em package.json ou prisma, rebuild garante tudo novo

---

## Cenário 10: Testar com IP da Máquina (não localhost)

```powershell
# Seu IP é 192.168.1.100 (em rede local)

# 1. Atualizar .env
POSTGRES_BIND_ADDRESS=0.0.0.0     # Aceita qualquer IP
BACKEND_BIND_ADDRESS=0.0.0.0      # Aceita qualquer IP
FRONTEND_BIND_ADDRESS=0.0.0.0     # Aceita qualquer IP
WEB_URL=http://192.168.1.100      # URL pública

# 2. Rebuild com novas settings
.\docker-manage.ps1 all -Build

# 3. Outro PC na rede acessa:
# Frontend: http://192.168.1.100:3000
# Backend: http://192.168.1.100:3001
# Database: postgresql://postgres:password@192.168.1.100:5432/terceeiro-gestor
```

⚠️ **CUIDADO**: 0.0.0.0 significa "aceita de qualquer lugar" - seguro só em rede local

---

## Cenário 11: Ver Logs de Erro em Tempo Real

```powershell
# Multi-stream (vê tudo simultâneo)
.\docker-manage.ps1 logs

# Ou individual
docker logs -f tg_postgres
docker logs -f tg_backend
docker logs -f tg_frontend

# Com grep (procura por erro)
docker logs tg_backend 2>&1 | Select-String "error|Error|ERROR"

# Últimas 100 linhas
docker logs --tail 100 tg_backend

# Desde 5 minutos atrás
docker logs --since 5m tg_backend
```

---

## Cenário 12: Resetar Tudo e Começar do Zero

```powershell
# ⚠️ CUIDADO - DELETA TODOS OS DADOS

.\docker-manage.ps1 reset

# Script pede confirmação: "Digite 'sim' para confirmar"

# O que acontece:
# 1. Todos containers param
# 2. Todos volumes deletados (DB e uploads gone)
# 3. Imagens removidas
# 4. Tudo limpo

# Depois:
.\docker-manage.ps1

# Resultado:
# ✅ Banco vazio (migrations rodam novamente)
# ✅ Uploads folder vazio
# ✅ Fresco como primeiro dia
```

---

## Cenário 13: Monitorar Performance

```powershell
# Ver uso de recursos dos containers
docker stats

# Resultado:
# CONTAINER           CPU %   MEM %    MEM USAGE  NET I/O
# tg_frontend         0.5%    150MB    150MiB     500KB/1MB
# tg_backend          2.1%    280MB    280MiB     50MB/30MB
# tg_postgres         1.8%    450MB    450MiB     100MB/80MB

# Se tá usando muita memória, pode aumentar limits em compose
```

---

## Cenário 14: Rodar Migrations Customizadas

```powershell
# Você criou uma migration:
# prisma/migrations/20240419123456_add_user_avatar/migration.sql

# Automático (acontece ao iniciar backend):
docker compose -f docker-compose.backend.yml up -d

# Ver o que foi rodado:
docker logs tg_backend | Select-String "migration"

# Verificar status
docker exec tg_backend npx prisma migrate status

# Se deu erro, desfazer
docker exec tg_backend npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Cenário 15: Usar Database Tool Externo (DBeaver, pgAdmin)

```powershell
# Instalar DBeaver ou pgAdmin (ferramentas visuais de SQL)

# Criar conexão com dados do .env:
Host:     localhost (ou seu IP)
Port:     5432
User:     postgres
Password: seu_password
Database: terceeiro-gestor

# Resultado:
# ✅ Browse banco visualmente
# ✅ Execute queries
# ✅ Veja tabelas, schemas, indexes
# ✅ Faça backups via interface
```

---

## Cenário 16: Integração Contínua / Deploy

```yaml
# .github/workflows/docker.yml
name: Build and Test

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test123
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 22
      
      - name: Install Backend
        run: cd backend && npm ci
      
      - name: Build Backend
        run: cd backend && npm run build
      
      - name: Run Tests
        run: cd backend && npm test
        env:
          DATABASE_URL: postgresql://postgres:test123@localhost:5432/test
```

---

## Cenário 17: Problemas com Port em Uso

```powershell
# Erro: "Bind for 0.0.0.0:3000 failed: port is already allocated"

# Encontrar qual processo usa a porta
netstat -ano | findstr ":3000"

# Resultado pode ser:
# TCP    127.0.0.1:3000         LISTENING       12345

# Matar o processo
taskkill /PID 12345 /F

# Ou mudar porta no .env
FRONTEND_PORT=3001
BACKEND_PORT=3002
```

---

## Cenário 18: Memory Leak no Backend

```powershell
# Backend está usando muita memória e crescendo

# 1. Ver uso em tempo real
docker stats tg_backend

# 2. Ver logs de erro (pode ter exception não tratada)
docker logs tg_backend | Select-String "error|OutOfMemory"

# 3. Restart
docker compose -f docker-compose.backend.yml restart

# 4. Investigar código (buscar conexões não fechadas, listeners, etc)
# Comum: conexões HTTP abertas, listeners não removidos

# 5. Rebuild com fix
docker compose -f docker-compose.backend.yml up -d --build
```

---

## Cenário 19: Fazer Upload de Volumoso de Dados

```powershell
# Dados externos em backup.sql

# 1. Parar aplicações
docker compose -f docker-compose.backend.yml down

# 2. Importar dados (backend parado, banco ativo)
cat backup.sql | docker exec -i tg_postgres psql -U postgres -d terceeiro-gestor

# 3. Verificar imports
docker exec tg_postgres psql -U postgres -d terceeiro-gestor -c "SELECT count(*) FROM users;"

# 4. Reiniciar backend (vai rodar migrations, mas dados já existem)
docker compose -f docker-compose.backend.yml up -d

# 5. Testar API
curl http://localhost:3001
```

---

## Cenário 20: Documentação de Deploy

```markdown
# Deploy Checklist

## Antes de subir em PROD:

- [ ] .env criado com valores SEGUROS
- [ ] POSTGRES_PASSWORD é forte
- [ ] JWT_SECRET é único e seguro
- [ ] WEB_URL aponta para domínio correto
- [ ] Backups configurados
- [ ] Firewall configurado (se em servidor publico)
- [ ] SSL/TLS configurado (nginx with certbot)

## Procedimento

```powershell
# 1. Parar tudo
.\docker-manage.ps1 down

# 2. Fazer backup
.\docker-manage.ps1 backup

# 3. Atualizar código
git pull origin main

# 4. Subir com rebuild
.\docker-manage.ps1 all -Build

# 5. Verificar health
.\docker-manage.ps1 status

# 6. Testar crítico
curl https://seu-dominio.com/api/health
```

## Se der erro:

```powershell
# Rollback
git revert HEAD
.\docker-manage.ps1 all -Build

# Restore do backup
docker exec -i tg_postgres psql -U postgres -d terceeiro-gestor < backup-antes.sql
```
```

---

## Referência Rápida Completa

```powershell
# STATUS
.\docker-manage.ps1 status
docker ps

# INICIAR
.\docker-manage.ps1 postgres     # Só database
.\docker-manage.ps1 backend      # Só API
.\docker-manage.ps1 frontend     # Só web
.\docker-manage.ps1              # Tudo (padrão)

# PARAR
.\docker-manage.ps1 down

# REINSTALAR/REBUILD
.\docker-manage.ps1 all -Build

# LOGS
.\docker-manage.ps1 logs
docker logs -f tg_backend

# BACKUP
.\docker-manage.ps1 backup

# RESET (CUIDADO!)
.\docker-manage.ps1 reset

# ACESSO TERMINAL
docker exec -it tg_backend bash
docker exec -it tg_postgres psql -U postgres
```

---

Esses são os 20 cenários mais comuns que você vai enfrentar! 🚀
