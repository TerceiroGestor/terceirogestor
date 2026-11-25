# Infraestrutura, deploy e segurança

*Última revisão: 2026-11-25.*

## Ambientes Docker

Definidos em `DOCKER_README.md` (raiz) — ler primeiro em caso de dúvida,
este é só um resumo:

- **`docker/compose.full.yml`** — ambiente completo (postgres + backend +
  frontend em containers). Portas padrão: frontend `:3000`, backend
  `:3001`, postgres `:5432`.
- **`docker/compose.dev.yml`** — só Postgres em container; backend/
  frontend rodam localmente com hot reload (`npm run start:dev` /
  `npm run dev`).
- **`docker.ps1`** — script operacional (`up`/`down`/`logs`/`ps`) pra
  ambos os ambientes, só PowerShell.
- **`backend/Dockerfile`** / **`frontend/Dockerfile`** — também
  compatíveis com Cloud Run (GCP), usados nesse contexto secundário além
  do alvo principal.
- Volume `postgres_dev_data` guarda os dados em dev; `docker compose
  down -v` apaga o volume — evitar.

## Alvo de produção

Conforme `AGENTS.md`: **Railway** (app) + **Cloudflare** (DNS/R2). O
Dockerfile de cada app roda nos dois ambientes (Railway e,
secundariamente, Cloud Run — ver `DOCKER_README.md` §"Relação com GCP").
CI: `.github/workflows/ci.yml`, Node 22.x fixado (`.nvmrc` em `backend/`
e `frontend/`, mesma versão nos Dockerfiles).

### Variáveis de ambiente (`.env` na raiz, lido por backend e frontend)

Agrupadas por propósito (ver `.env.example` pros comentários completos,
incluindo como gerar cada segredo):

| Grupo | Variáveis |
|---|---|
| Postgres (dev local) | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_BIND_ADDRESS`, `POSTGRES_HOST_PORT` |
| Portas/bind | `BACKEND_BIND_ADDRESS`, `BACKEND_PORT`, `FRONTEND_BIND_ADDRESS`, `FRONTEND_PORT` |
| Banco | `DATABASE_URL`, `SHADOW_DATABASE_URL`, `RUN_DB_PRESTART` |
| URLs entre apps | `API_INTERNAL_URL`, `FRONTEND_PUBLIC_API_URL`, `NEXT_PUBLIC_API_URL`, `WEB_URL` (allowlist de CORS — ver `01-backend-core.md`) |
| App | `APP_NAME` |
| Segurança — **nunca mudar depois de setadas** | `JWT_SECRET`, `PII_MASTER_KEY`, `TOTP_ENCRYPTION_KEY` (regra do `AGENTS.md`: dado criptografado com elas fica ilegível se mudarem) |
| Proxy/topologia | `TRUST_PROXY_HOPS` (ver `01-backend-core.md` §Config — valor correto depende da topologia real Railway/Cloudflare, ainda não confirmado em staging, ver `docs/backlog.md`) |
| PWA (frontend) | `NEXT_PUBLIC_PWA_SW`, `NEXT_PUBLIC_PWA_FORCE_INSTALL` |
| E-mail | `RESEND_API_KEY`, `EMAIL_FROM` (sem a chave, `EmailService` só loga no console — ver `01-backend-core.md`) |
| Storage de arquivo | `STORAGE_DRIVER` (`local` ou `r2`), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` |
| Observabilidade | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT` |
| Timezone | `TZ` |
| GCP (uso secundário/Cloud Run) | `GCP_PROJECT_ID`, `GCP_BUCKET_NAME`, `GCS_SIGNED_URL_TTL_SENSITIVE`, `GCS_SIGNED_URL_TTL_MEDIUM`, `GCS_SIGNED_URL_TTL_LOW`, `CLOUD_SQL_CONNECTION_NAME`, `GOOGLE_APPLICATION_CREDENTIALS` |

No boot, `backend/src/core/config/env-validation.ts` exige e **parseia**
(não só checa presença de) `DATABASE_URL`, `JWT_SECRET`,
`PII_MASTER_KEY`, `TOTP_ENCRYPTION_KEY` — qualquer uma ausente ou mal
formada impede o processo de subir (ver `01-backend-core.md` §Config).

### Checklist antes de rodar localmente (resumo do `README.md`)

```powershell
Copy-Item .env.example .env
# editar POSTGRES_PASSWORD, JWT_SECRET, PII_MASTER_KEY, TOTP_ENCRYPTION_KEY
.\docker.ps1 up -Environment dev   # só Postgres
cd backend; npm ci; npx prisma generate; npm run start:dev
cd frontend; npm ci; npm run dev
```

### Comandos de checkpoint (`AGENTS.md`)

```bash
# backend
cd backend && npx tsc --noEmit -p tsconfig.build.json && npm test
npx eslint "src/**/*.ts"        # medir; npm run lint:fix aplica correção

# frontend
cd frontend && npx tsc --noEmit && npx eslint src && npm run build
```

Checkpoint rápido (todo commit): `tsc --noEmit` no app que mudou.
Checkpoint completo (fim de bloco): tsc + test + build nos dois + teste
manual de login e do módulo afetado.

## Segurança — o que já foi endurecido e por quê

Resumo navegável de `docs/auditoria-riscos.md` (16 itens, a maioria
fechada em 2026-11-06/10/11). Ler o documento completo para critério de
aceite/evidência de cada um; aqui só o "o quê" e "onde", pra orientar
investigação de regressão.

| # | Risco | Status | Onde a correção vive |
|---|---|---|---|
| 1 | Download de arquivo sem autenticação | Fechado | `core/files/` — URL assinada HMAC (ver `01-backend-core.md` §Files) |
| 2 | Download de doc. sensível sem auditoria | Fechado | `sign-uploads.interceptor.ts` grava `PersonSensitiveAccessLog` |
| 3 | Banco sem migration versionada | Fechado | `backend/prisma/migrations/0_init/`, `docker-entrypoint.sh` só roda `migrate deploy` |
| 4 | CORS aberto com cookies habilitados | Fechado | `WEB_URL` como allowlist, `core/auth/http/auth-http.ts` |
| 5 | `TenantGuard` morto | Fechado (removido) | Isolamento é garantido por `JwtStrategy` + convenção de controller, não por um guard próprio |
| 6 | Isolamento entre tenants sem teste automatizado | Fechado | `backend/test/tenant-isolation.e2e-spec.ts` (9 módulos cobertos) |
| 7 | Token de acesso durava 8h | Fechado (15 min) | `auth.module.ts`, `registration.module.ts` |
| 8 | Sem `helmet` | Fechado | `main.ts` |
| 9 | Env vars não validadas no boot | Fechado | `core/config/env-validation.ts` |
| 10 | Sem `GET /health` | Fechado | `app.controller.ts` (`SELECT 1` via Prisma) |
| 11 | IP do cliente perdido atrás de proxy | Parcial (de propósito) | `TRUST_PROXY_HOPS`, padrão `0` até confirmar topologia real em staging — gatilho em `docs/backlog.md` |
| 12 | Arquivos em disco efêmero no Railway | Parcial (de propósito) | Interface `StorageDriver` pronta (`local`/`r2`); driver R2 real pendente de bucket existir (Parte 4.2) |
| 13 | `.gitignore` escondia pastas novas silenciosamente | Fechado | entradas genéricas removidas |
| 14 | Seed sem build automatizado | Fechado | `npm run build:seed` + checagem no CI |
| 15 | Dependências vulneráveis não auditadas | Fechado (parcial) | `npm audit fix`; o que resta exige major (Parte 5) ou não tem fix estável ainda |
| 16 | Node local fora da faixa de `engines` | Fechado (lado do build) | Dockerfiles/CI em Node 22; dev local fica em v26 por decisão do usuário |

**Pendências ativas relacionadas à produção** (ver `docs/backlog.md`
para o texto completo e o gatilho de cada uma):
- `TRUST_PROXY_HOPS` real só pode ser confirmado quando o projeto
  Railway existir e a topologia Cloudflare (DNS puro vs. proxied) for
  decidida.
- Driver R2 de verdade depende do bucket existir (Parte 4.2).
- Rotação de `PII_MASTER_KEY`/`TOTP_ENCRYPTION_KEY`: gatilho é primeiro
  incidente de segurança ou 12 meses em produção.
- Rate limit em memória por processo: gatilho é precisar de 2ª réplica
  do `api` (ver `01-backend-core.md` §Rate limit).

## Observabilidade

- **Sentry** em backend (`@sentry/nestjs`, filtro global em
  `main.ts`) e frontend (`SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`).
- **`GET /health`** — `SELECT 1` via Prisma, pública, fora de rate
  limit — alvo de healthcheck do Railway (configuração no painel/
  `railway.json` ainda pendente, só faz sentido quando o projeto
  existir).
- **Auditoria** (`AuditLog`) e **log de acesso** (`AccessLog`) — ver
  `01-backend-core.md` §Audit.

## CI

`.github/workflows/ci.yml` — Node 22 nos dois jobs (backend/frontend).
Roda `build:seed` + `git diff --exit-code` nos artefatos gerados
(`prisma/seed.js`/`.d.ts`/`.js.map`) pra impedir PR com `seed.ts`
editado sem recompilar.
