# Migração para CloudSQL do GCP

Este guia explica como migrar do PostgreSQL local (docker-compose.postgres.yml) para CloudSQL quando estiver pronto para produção.

## Por que migrar para CloudSQL?

✅ **Gerenciado**: GCP cuida de backups, patches, disponibilidade  
✅ **Escalável**: Cresce com a demanda automaticamente  
✅ **Seguro**: Encriptação em trânsito e em repouso  
✅ **Monitorado**: Dashboards e alertas de performance  
✅ **Sem operação**: Você não mantém servidor de database  

---

## Arquitetura: Antes vs Depois

### ANTES (Local Docker)
```
┌──────────────────────────────────────┐
│         Seu PC / Servidor            │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Backend Container  :3001      │  │
│  └───────┬────────────────────────┘  │
│          │                            │
│          ↓                            │
│  ┌────────────────────────────────┐  │
│  │  PostgreSQL Container           │  │
│  │  (docker-compose.postgres.yml)  │  │
│  │  :5432                          │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

### DEPOIS (CloudSQL)
```
┌──────────────────────────┐        ┌─────────────────────────────────┐
│   Seu PC / Servidor      │        │    Google Cloud Platform        │
│                          │        │                                 │
│  ┌────────────────────┐  │        │  ┌───────────────────────────┐  │
│  │ Backend Container  │  │  ◄────────│  CloudSQL Instance        │  │
│  │ (Cloud Run)        │  │        │  │  (Postgres 16)           │  │
│  │ :3001              │  │        │  │  Managed by GCP          │  │
│  └────────────────────┘  │        │  │  Auto-backup             │  │  
│                          │        │  │  HA Replication          │  │
│                          │        │  └───────────────────────────┘  │
│                          │        │                                 │
└──────────────────────────┘        └─────────────────────────────────┘
```

---

## Passo 1: Preparar CloudSQL no GCP

### 1.1 Criar Instância CloudSQL

```bash
# Via gcloud CLI
gcloud sql instances create terceeiro-gestor-db \
  --database-version=POSTGRES_16 \
  --region=southamerica-west1 \
  --tier=db-f1-micro \
  --backup-start-time=03:00 \
  --database-flags=cloudsql_iam_authentication=off

# Resultado: IP será algo como: 34.151.220.123
```

### 1.2 Criar Database

```bash
gcloud sql databases create terceeiro-gestor \
  --instance=terceeiro-gestor-db
```

### 1.3 Criar User

```bash
gcloud sql users create postgres \
  --instance=terceeiro-gestor-db \
  --password=super-strong-password-here
```

### 1.4 Anotar Informações

```
Project ID: seu-projeto-gcp-123
Instance: terceeiro-gestor-db
IP Público: 34.151.220.123
User: postgres
Password: super-strong-password-here
Database: terceeiro-gestor
```

---

## Passo 2: Backup do Banco Local

### Antes de qualquer mudança, faça backup!

```powershell
# Opção A - Script automático
.\docker-manage.ps1 backup

# Opção B - Manual
docker exec tg_postgres pg_dump -U postgres -d terceeiro-gestor > backup-antes-migracao.sql

# Salvar em local seguro (Google Drive, GitHub, etc)
```

---

## Passo 3: Atualizar .env

### Antes
```env
DATABASE_URL=postgresql://postgres:change-me-now@postgres:5432/terceeiro-gestor
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me-now
```

### Depois
```env
DATABASE_URL=postgresql://postgres:super-strong-password-here@34.151.220.123:5432/terceeiro-gestor
POSTGRES_HOST=34.151.220.123
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=super-strong-password-here
```

---

## Passo 4: Restaurar Dados (opcional)

Se quer copiar dados do banco local para CloudSQL:

```powershell
# 1. Fazer dump do local
docker exec tg_postgres pg_dump -U postgres -d terceeiro-gestor > dump.sql

# 2. Restaurar para CloudSQL
# Editar dump.sql e comentar "CREATE DATABASE" (CloudSQL já existe)
notepad dump.sql

# 3. Restaurar (do seu PC)
psql -h 34.151.220.123 -U postgres -d terceeiro-gestor < dump.sql
```

---

## Passo 5: Parar PostgreSQL Local

```powershell
# Parar container postgres (dados persistem em volume)
docker compose -f docker-compose.postgres.yml down

# OU deletar (se não precisa mais)
docker compose -f docker-compose.postgres.yml down -v
```

---

## Passo 6: Atualizar Backend

### Opção A - Continuar com docker-compose local

```powershell
# Backend ainda roda via docker-compose, mas aponta para CloudSQL
docker compose -f docker-compose.backend.yml up -d --build

# Migrations rodam automaticamente (prisma migrate deploy)
docker logs -f tg_backend
```

### Opção B - Migrar para Cloud Run

Futuramente você pode rodar backend em Cloud Run:

```bash
# Deploy
gcloud run deploy terceeiro-gestor-backend \
  --source ./backend \
  --region=southamerica-west1 \
  --env-vars-file=.env.yaml \
  --allow-unauthenticated \
  --memory=2Gi \
  --timeout=3600
```

---

## Passo 7: Testar Conectividade

```powershell
# 1. Verificar que backend consegue conectar
docker logs -f tg_backend

# Procure por:
# ✓ "Database migration completed"
# ✓ "Listening on port 3001"

# 2. Testar endpoint
curl http://localhost:3001/health

# 3. Testar banco
docker exec -ti tg_backend psql -U postgres -h 34.151.220.123 -d terceeiro-gestor -c "SELECT count(*) FROM users;"
```

---

## Passo 8: Configurar Backups

CloudSQL tem backups automáticos, mas você pode configurar:

```bash
# Backup automático diário às 3:00 AM
gcloud sql instances patch terceeiro-gestor-db \
  --backup-start-time=03:00

# Reter backups por 30 dias
gcloud sql backups describe [backup-id] \
  --instance=terceeiro-gestor-db
```

---

## Passo 9: Security & Firewall

### Restringir acesso apenas para sua aplicação

```bash
# Apenas Google Cloud (Cloud Run)
gcloud sql instances patch terceeiro-gestor-db \
  --require-ssl

# Whitelist IP específico (seu servidor)
gcloud sql instances patch terceeiro-gestor-db \
  --authorized-networks=200.100.50.25/32 \
  --backup-start-time=03:00
```

---

## Passo 10: Monitoramento

Acesse Google Cloud Console:
1. SQL → terceeiro-gestor-db
2. Abas disponíveis:
   - **Overview**: Status geral
   - **Metrics**: CPU, disco, conexões
   - **Backups**: Histórico de backups
   - **Logs**: Logs de erro/query
   - **Operations**: Histórico de mudanças

---

## Estrutura de Arquivos Após Migração

```
.env
  ├─ DATABASE_URL=postgresql://...@34.151.220.123:5432/...
  ├─ POSTGRES_HOST=34.151.220.123
  └─ (sem POSTGRES_BIND_ADDRESS ou POSTGRES_HOST_PORT)

docker-compose.backend.yml
  └─ (sem mudanças, apenas aponta para DATABASE_URL do .env)

docker-compose.frontend.yml
  └─ (sem mudanças)

docker-compose.postgres.yml
  └─ (DELETADO ou desativado)
```

---

## Checklist de Migração

```
□ Preparação
  □ Criar instância CloudSQL
  □ Criar database
  □ Criar user
  □ Fazer backup do banco local

□ Migração
  □ Atualizar DATABASE_URL no .env
  □ Restaurar dados (se necessário)
  □ Parar container postgres local

□ Testes
  □ Backend consegue conectar?
  □ Migrations executaram?
  □ Dados estão presentes?
  □ API responde normalmente?
  □ Frontend consegue usar API?

□ Cleanup
  □ Deletar container postgres local (opcional)
  □ Deletar volume postgres local (opcional)
  □ Documentar nova configuração
  □ Configurar backups nos alertas no GCP
```

---

## Custos GCP

Estimativa (pode mudar):

| Item | Custo |
|------|-------|
| CloudSQL db-f1-micro | ~$15/mês |
| Armazenamento (100GB) | ~$10/mês |
| Backups | Incluído |
| **Total** | **~$25/mês** |

Economize: use shared-core instances para development/staging

---

## Troubleshooting de Migração

### "Connection refused"
```
✓ IP de CloudSQL está correto?
✓ User/password estão corretos?
✓ Firewall de GCP permite seu IP?
✓ CloudSQL instance está "Available"?
```

### "Database does not exist"
```
✓ Database foi criado na instância?
✓ Nome está exatamente igual?
✓ Migrations executaram?
```

### "Migrations failing"
```
✓ Dados do backup foram restaurados?
✓ Buffer pool ini settings necessários?
✓ Logs: gcloud sql operations list --instance=terceeiro-gestor-db
```

---

## Rollback (Voltando para Local)

Se precisar voltar:

```powershell
# 1. Parar backend
docker compose -f docker-compose.backend.yml down

# 2. Mudar .env de volta para local
DATABASE_URL=postgresql://postgres:password@postgres:5432/terceeiro-gestor

# 3. Iniciar postgres local com dados antigos
docker compose -f docker-compose.postgres.yml up -d

# 4. Iniciar backend
docker compose -f docker-compose.backend.yml up -d

# Dados ainda estarão no volume local!
```

---

## Próximas Etapas Após CloudSQL

Agora você está pronto para:

1. **Cloud Run** - Rodado backend em servidor sem gerenciar
2. **Cloud Storage** - Armazenar uploads em bucket
3. **Cloud Load Balancer** - Distribuir requisições
4. **Cloud Armor** - Proteção contra DDoS
5. **Cloud CDN** - Cache de assets

---

## Suporte & Documentação

- [CloudSQL Docs](https://cloud.google.com/sql/docs)
- [Migração para CloudSQL](https://cloud.google.com/sql/docs/postgres/move-data-from-postgres)
- [Backup e Recovery](https://cloud.google.com/sql/docs/postgres/backup-recovery)
- [Preços](https://cloud.google.com/sql/pricing)

---

## Conclusão

Migrar para CloudSQL é um passo importante:
- ✅ Seu código NestJS continua igual
- ✅ Seu Prisma ORM continua igual
- ✅ Você apenas muda DATABASE_URL no .env
- ✅ GCP cuida do resto (backups, patches, updates)

Você ganha **escala**, **segurança** e **tranquilidade operacional**. 🚀
