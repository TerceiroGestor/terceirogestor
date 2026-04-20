# Guia de Docker Compose Individual

Este projeto foi reorganizado para rodar serviços Docker de forma independente usando docker-compose separados para cada component.

## Estrutura

- `docker-compose.postgres.yml` - PostgreSQL standalone
- `docker-compose.backend.yml` - Backend (NestJS) com Prisma
- `docker-compose.frontend.yml` - Frontend (Next.js)
- `docker-compose.yml` - Orquestração completa (all-in-one) - _descontinuado_

## Rede Docker

Todos os serviços usam uma rede Docker chamada `terceirogestor_network`. Isso permite que eles se comuniquem entre si usando o hostname do container.

## Variáveis de Ambiente

Todas as variáveis usam o arquivo `.env` da raiz do projeto. Copie `.env.example` para `.env` antes de começar:

```powershell
Copy-Item .env.example .env
```

### Variáveis principais:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=seu_password_seguro
POSTGRES_DB=terceirogestor
POSTGRES_BIND_ADDRESS=127.0.0.1
POSTGRES_HOST_PORT=5432
POSTGRES_HOST=postgres  # hostname quando rodar via docker network

# Backend
BACKEND_BIND_ADDRESS=127.0.0.1
BACKEND_PORT=3001
BACKEND_HOST=backend  # hostname quando rodar via docker network

# Frontend
FRONTEND_BIND_ADDRESS=127.0.0.1
FRONTEND_PORT=3000

# URL pública
WEB_URL=http://localhost

# Chaves de segurança
JWT_SECRET=sua_jwt_secret_key
TOTP_ENCRYPTION_KEY=sua_totp_key
PII_MASTER_KEY=sua_pii_key

# Configurações adicionais
TZ=America/Sao_Paulo
APP_NAME=Terceiro Gestor
```

## Como rodar cada serviço

### 1. PostgreSQL

```powershell
# Subir
docker compose -f docker-compose.postgres.yml up -d

# Parar
docker compose -f docker-compose.postgres.yml down

# Parar e remover volumes (CUIDADO! Deleta os dados)
docker compose -f docker-compose.postgres.yml down -v

# Ver logs
docker compose -f docker-compose.postgres.yml logs -f postgres
```

**Porta padrão**: 5432 (localhost)  
**Acesso do host**: `postgresql://postgres:password@localhost:5432/terceirogestor`

---

### 2. Backend

```powershell
# Subir (automáticamente cria database e roda migrations)
docker compose -f docker-compose.backend.yml up -d

# Parar
docker compose -f docker-compose.backend.yml down

# Ver logs
docker compose -f docker-compose.backend.yml logs -f backend

# Fazer rebuild após mudanças no código
docker compose -f docker-compose.backend.yml up -d --build
```

**Pré-requisitos**: PostgreSQL deve estar rodando

**Porta padrão**: 3001 (localhost)  
**URL interna da rede**: `http://backend:3001`

**O que o backend faz na inicialização**:
1. Cria a database se não existir
2. Executa as migrations do Prisma
3. Inicia o servidor NestJS

---

### 3. Frontend

```powershell
# Subir
docker compose -f docker-compose.frontend.yml up -d

# Parar
docker compose -f docker-compose.frontend.yml down

# Ver logs
docker compose -f docker-compose.frontend.yml logs -f frontend

# Fazer rebuild após mudanças no código
docker compose -f docker-compose.frontend.yml up -d --build
```

**Pré-requisitos**: Backend deve estar rodando

**Porta padrão**: 3000 (localhost)  
**URL interna da rede**: `http://frontend:3000`

---

## Sequência recomendada para primeira subida

```powershell
# 1. Editar .env com suas variáveis
notepad .env

# 2. Subir PostgreSQL
docker compose -f docker-compose.postgres.yml up -d

# 3. Aguardar a database ficar pronta (verificar logs)
docker compose -f docker-compose.postgres.yml logs postgres

# 4. Subir Backend (vai rodar migrations automaticamente)
docker compose -f docker-compose.backend.yml up -d

# 5. Verificar se backend iniciou corretamente
docker compose -f docker-compose.backend.yml logs -f backend

# 6. Subir Frontend
docker compose -f docker-compose.frontend.yml up -d

# 7. Acessar
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

---

## Trabalhando com dados

### Backup do banco de dados

```powershell
# Fazer backup
docker exec tg_postgres pg_dump -U postgres -d terceirogestor > backup.sql

# Restaurar
docker exec -i tg_postgres psql -U postgres -d terceirogestor < backup.sql
```

### Seed de dados de demonstração

```powershell
# Dentro do container backend
docker exec tg_backend npm run db:seed

# Ou via cli local (se tiver postgres-client instalado e backend rodando local)
# cd backend && npm run db:seed
```

---

## Troubleshooting

### Backend não consegue conectar ao PostgreSQL

**Sintoma**: Erro `ECONNREFUSED` ou timeout na conexão com postgres

**Solução**:
```powershell
# Verificar se postgres está rodando
docker compose -f docker-compose.postgres.yml ps

# Verificar logs do postgres
docker compose -f docker-compose.postgres.yml logs postgres

# Esperar um pouco (o postgres pode levar alguns segundos para ficar pronto)
# Verificar a health do postgres
docker inspect tg_postgres --format='{{.State.Health.Status}}'
```

### Frontend não consegue falar com Backend

**Sintoma**: Erros de CORS ou requisições não chegam ao backend

**Solução**:
1. Verificar que `NEXT_PUBLIC_API_URL` está correto no .env
2. Verificar que `API_INTERNAL_URL` aponta para o backend rodando
3. Backend deve estar respondendo em `http://localhost:3001` no host

```powershell
# Testar conectividade
curl http://localhost:3001/

# Dentro do container frontend
docker exec tg_frontend wget -qO- http://backend:3001/
```

### Volumes não são criados automaticamente

```powershell
# Criar volumes manualmente se necessário
docker volume create terceirogestor_postgres_data
docker volume create terceirogestor_uploads_data
```

### Limpar tudo e recomeçar

```powershell
# Parar todos os containers
docker compose -f docker-compose.postgres.yml down
docker compose -f docker-compose.backend.yml down
docker compose -f docker-compose.frontend.yml down

# Remover volumes (DELETE DADOS!)
docker volume rm terceirogestor_postgres_data terceirogestor_uploads_data

# Limpar imagens
docker rmi terceirogestor-backend terceirogestor-frontend

# Iniciar novamente
docker compose -f docker-compose.postgres.yml up -d
# ... aguarde ...
docker compose -f docker-compose.backend.yml up -d
# ... aguarde ...
docker compose -f docker-compose.frontend.yml up -d
```

---

## Configuração para CloudSQL do GCP (futuro)

Quando migrar para CloudSQL:

1. **Remova** o `docker-compose.postgres.yml`
2. **Atualize** as variáveis de ambiente no `.env`:

```env
# Apontar para CloudSQL
DATABASE_URL=postgresql://user:password@your-cloudsql-instance-ip:5432/terceirogestor
POSTGRES_HOST=your-cloudsql-instance-ip
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=your-password
```

3. **Backend** continuará funcionando igual, apenas apontando para CloudSQL
4. **Migrations** continuarão sendo rodadas via `npm run db:migrate:deploy`

---

## Monitoramento

### Ver status de todos os containers

```powershell
# PostgreSQL
docker compose -f docker-compose.postgres.yml ps

# Backend
docker compose -f docker-compose.backend.yml ps

# Frontend
docker compose -f docker-compose.frontend.yml ps
```

### Ver logs em tempo real

```powershell
# Todos os logs
docker compose -f docker-compose.postgres.yml logs -f
docker compose -f docker-compose.backend.yml logs -f
docker compose -f docker-compose.frontend.yml logs -f

# Seguir múltiplos services
docker logs -f tg_postgres &
docker logs -f tg_backend &
docker logs -f tg_frontend
```

### Inspecionar um container

```powershell
# Variáveis de ambiente
docker inspect tg_backend --format='{{json .Config.Env}}' | ConvertFrom-Json

# Health status
docker inspect tg_backend --format='{{.State.Health.Status}}'

# IP da rede
docker inspect tg_backend --format='{{json .NetworkSettings.Networks}}'
```

---

## Notas importantes

- ✅ Os serviços se comunicam internamente via rede Docker usando hostnames (postgres, backend, frontend)
- ✅ Para acessar do host, use `localhost` ou `127.0.0.1` com portas específicas
- ✅ Volumes persistem dados entre paradas do container
- ✅ `docker compose down` para os containers mas **não deleta dados**
- ✅ `docker compose down -v` para e **deleta os volumes**
- ✅ Migrations do Prisma rodam automaticamente na inicialização do backend
- ✅ Certificar que cada serviço está saudável antes de iniciar o próximo

---

## Diferença com o docker-compose.yml original

O `docker-compose.yml` original orquestrava tudo junto (postgres + backend + frontend + nginx), enquanto que agora você tem flexibilidade de rodar cada serviço separadamente:

| Aspecto | Original | Novo (individual) |
|--------|----------|-------------------|
| **Arquivos** | 1 docker-compose.yml | 3 docker-compose.yml separados |
| **Complexidade** | Tudo junto, risco de cascade failures | Modular, falha isolada |
| **Desenvolvimento** | Rebuild todo para mudanças | Rebuild apenas do serviço afetado |
| **CloudSQL** | Precisa remover serviço postgres | Fácil: só atualiza .env |
| **Teste** | Difícil testar componente isolado | Fácil testar cada um |
