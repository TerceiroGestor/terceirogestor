# Processos e Endpoints (guia de estudo/debug)

Este documento descreve (1) como os processos principais funcionam, e (2) quais endpoints existem hoje no `backend/`,
com foco em facilitar testes manuais e debug.

> Convenção importante: **tudo que é “tenant-scoped” deve ser chamado via `/t/:tenantSlug/...`**.
> O `backend/src/core/tenancy/tenancy.middleware.ts` resolve o `tenantSlug` para `tenantId` e reescreve a URL.

---

## 0) Como rodar/resetar e popular dados (dev)

### Backend (DB + migrate/seed)
- Rodar migrations: `cd backend && npx prisma migrate dev`
- Rodar seed: `cd backend && npx prisma db seed`
- Reset total (apaga dados): `cd backend && npx prisma migrate reset`

Observações:
- O seed atual cria a “Instituicao Exemplo” + usuários/roles/perms + dados de `people` e agora também `pantry`.
- Se o DB estiver em Docker, rode os comandos dentro do container (ou usando a mesma `DATABASE_URL`).

### Frontend
- `cd frontend && npm run dev`

---

## 1) Tenancy (multi-tenant por slug)

### O que acontece
- Requisições para `/t/:slug/...` passam pelo `TenancyMiddleware`.
- Ele busca `Tenant` por `slug`, injeta `req.tenantId` e reescreve `req.url` removendo o prefixo `/t/:slug`.

### Implicações
- Endpoints como `POST /auth/login` funcionam melhor como `POST /t/:slug/auth/login`, porque o backend já conhece o tenant.
- O MFA verify (`POST /auth/mfa/totp/verify`) **exige** tenant via `/t/:slug/...`.

---

## 2) Registro de tenant + admin (cadastro)

### Processo (email + código)
1) Frontend chama `POST /registration/tenant/request` com dados do tenant + admin.
2) Backend cria um `TenantRegistration` (PENDING_VERIFICATION) e envia um **código** para o email.
3) Usuário informa o código e o frontend chama `POST /registration/tenant/confirm`.
4) Backend confirma registro, cria `Tenant` + `User admin` + `Role/Permissions` necessárias e retorna:
   - `accessToken` (no body)
   - `refresh_token` (cookie HttpOnly)
   - `tenantSlug` (no body)
5) Frontend faz auto-login (já está com token) e redireciona para `/{slug}/dashboard`.

### Endpoints
- `POST /registration/tenant/request`
- `GET /registration/tenant/:id`
- `POST /registration/tenant/confirm` (seta cookie `refresh_token` e retorna `accessToken`)

### Registro por OAuth (Google/Microsoft)
- `GET /registration/oauth/google/start?tenantName=...`
- `GET /registration/oauth/google/callback?...`
- `GET /registration/oauth/microsoft/start?tenantName=...`
- `GET /registration/oauth/microsoft/callback?...`

O callback redireciona para o frontend em `/register/confirm?rid=...` para continuar o fluxo.

---

## 3) Login / Refresh / Logout (sessão)

### Como funciona
- Access Token: JWT retornado no body (frontend guarda em memória/local storage conforme o core atual).
- Refresh Token: cookie HttpOnly `refresh_token` (renovado no refresh).
- Quando TOTP está habilitado e não existe “trusted device”, o login retorna `mfaRequired: true`.

### Endpoints
- `POST /t/:slug/auth/login`
  - Retorna `{ accessToken }` **ou** `{ mfaRequired: true, challengeId, expiresAt }`
- `POST /t/:slug/auth/refresh`
  - Retorna `{ accessToken }` (e atualiza cookie)
- `POST /t/:slug/auth/logout` (JWT obrigatório)
- `GET /t/:slug/auth/access-logs` (JWT obrigatório)

---

## 4) 2FA (TOTP + trusted device)

### Conceito
- TOTP (Google Authenticator, Microsoft Authenticator etc.) é “offline”, sem custo por SMS/email.
- O usuário escaneia um QRCode/secret, confirma um código e a conta passa a exigir 2FA no login.
- “Trusted device” evita pedir 2FA sempre: grava um cookie com expiração (`TRUSTED_DEVICE_DAYS`).

### Setup/disable (usuário logado)
- `POST /t/:slug/auth/mfa/totp/setup` (JWT)
  - Retorna dados para gerar QRCode/secret + `setupId`
- `POST /t/:slug/auth/mfa/totp/confirm` (JWT)
  - Body: `{ setupId, code }`
- `POST /t/:slug/auth/mfa/totp/disable` (JWT)
  - Body: `{ code }`

### Verify (no login quando mfaRequired=true)
- `POST /t/:slug/auth/mfa/totp/verify`
  - Body: `{ challengeId, code, rememberDevice?: boolean }`
  - Retorna `{ accessToken }` e seta `refresh_token` (cookie)
  - Se `rememberDevice=true`, seta cookie de “trusted device”

---

## 5) Admin / Configurações / Auditoria

### Auditoria
- `GET /t/:slug/audit-logs` (JWT + `audit.read`)
  - Query: `page`, `limit`, `action`, `entity`, `entityId`, `userId`, `from`, `to`, `search`

### Usuários (admin)
- `GET /t/:slug/users/me` (JWT)
- `PATCH /t/:slug/users/me` (JWT)
- `GET /t/:slug/users` (JWT + `users.read`)
- `GET /t/:slug/users/:id` (JWT + `users.read`)
- `GET /t/:slug/users/:id/access-logs` (JWT + `users.read`)
- `POST /t/:slug/users` (JWT + `users.create`)
- `PATCH /t/:slug/users/:id` (JWT + `users.update`)
- `DELETE /t/:slug/users/:id` (JWT + `users.delete`)

### Perfis / Permissões
- `GET /t/:slug/roles` (JWT + `roles.manage`)
- `POST /t/:slug/roles` (JWT + `roles.manage`)
- `PATCH /t/:slug/roles/:id` (JWT + `roles.manage`)
- `DELETE /t/:slug/roles/:id` (JWT + `roles.manage`)
- `GET /t/:slug/permissions` (JWT + `roles.manage`)

### Instituição (Tenant)
- `GET /t/:slug/tenants/me` (JWT)
- `PATCH /t/:slug/tenants/me` (JWT + `tenants.update`)
- `GET /tenants/slug/:slug` (público; usado para resolver tenant antes do login)

---

## 6) Módulos (People / Pantry)

### Permissões (padrão)
- Leituras: `*.read`
- Escritas: `*.create`, `*.update`, `*.delete`
- UI deve esconder botões quando não houver permissão, e a API deve negar também.

### People (API)
Base: `/t/:slug/people`

Regras:
- `GET` exige `people.read`
- `POST /people` exige `people.create`
- Qualquer escrita em sub-recursos exige `people.update`
- `DELETE /people/:id` exige `people.delete`

Endpoints principais:
- `POST /people`
- `GET /people`
- `GET /people/:id`
- `PATCH /people/:id`
- `DELETE /people/:id`

Sub-recursos (exemplos):
- Incomes: `GET/POST/PATCH/DELETE /people/:id/incomes`
- Expenses: `GET/POST/PATCH/DELETE /people/:id/expenses`
- Health conditions: `GET/POST/PATCH/DELETE /people/:id/health-conditions`
- Medications: `GET/POST/PATCH/DELETE /people/:id/medications`
- Transfers/Assets/Household/Relations: rotas conforme `backend/src/modules/people/people.controller.ts`

### Pantry (API)
Base: `/t/:slug/pantry`

Endpoints principais:
- Dashboard/analytics:
  - `GET /pantry/summary`
  - `GET /pantry/dashboard`
  - `GET /pantry/consumption`
  - `GET /pantry/flow`
  - `GET /pantry/usage`
- Items:
  - `GET /pantry/items`
  - `GET /pantry/items/:id`
  - `GET /pantry/items/:id/sectors`
  - `POST /pantry/items`
  - `PATCH /pantry/items/:id`
  - `DELETE /pantry/items/:id`
- Donors:
  - `GET /pantry/donors`
  - `POST /pantry/donors`
  - `PATCH /pantry/donors/:id`
  - `DELETE /pantry/donors/:id`
- Entries:
  - `GET /pantry/entries`
  - `GET /pantry/entries/:id`
  - `POST /pantry/entries`
  - `PATCH /pantry/entries/:id`
  - `DELETE /pantry/entries/:id`
  - `POST /pantry/entries/:id/reverse`
- Exits:
  - `GET /pantry/exits`
  - `GET /pantry/exits/:id`
  - `POST /pantry/exits`
  - `PATCH /pantry/exits/:id`
  - `DELETE /pantry/exits/:id`
  - `POST /pantry/exits/:id/reverse`

---

## 7) Uploads (files)

Base: `/t/:slug/files` (JWT obrigatório)
- `POST /files/avatars`
- `POST /files/health-documents`
- `POST /files/tenant-logos`

---

## 8) Como criar um novo módulo (padrão atual)

Checklist sugerido:
1) Backend:
   - Criar `module` + `controller` + `service`
   - Definir permissões `modulo.read/create/update/delete`
   - Proteger endpoints com `PermissionsGuard` + `@Permissions(...)`
2) Seed:
   - Adicionar permissões no seed e incluir no role Admin
3) Frontend:
   - Criar `frontend/src/modules/<modulo>/manifest.ts` com `permissions: ['<modulo>.read']`
   - Estruturar em `features/*` + `shared/*` + `api/*`
   - Nas telas: `canRead/canCreate/canUpdate/canDelete` (via `useCurrentUser()`)
   - Não renderizar botões/ações sem permissão (e ainda assim tratar erro da API com toast)

