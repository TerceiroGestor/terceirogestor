# Backend — Processos e Endpoints (estudo/debug)

Regra de tenancy: para requests tenant-scoped use **sempre**:
- `http://localhost:3001/t/<tenantSlug>/...`

O middleware `backend/src/core/tenancy/tenancy.middleware.ts` resolve o `tenantSlug` em `tenantId` e injeta no request.

---

## 0) Rodar / resetar / popular (dev)

### Reset total (apaga tudo)
```bash
cd backend
npx prisma migrate reset --force
npx prisma db seed
npm run start:dev
```

### Apenas criar/aplicar migrations (dev)
```bash
cd backend
npx prisma migrate dev
```

### Debug no VSCode
- `backend/package.json` tem `start:debug` (porta 9229).
```bash
cd backend
npm run start:debug
```
Depois conecte o debugger no VSCode (Node/Nest).

---

## 1) Registro de tenant + admin

### Fluxo (email + código)
1. `POST /registration/tenant/request`
2. Backend cria `TenantRegistration` e envia código por email
3. `POST /registration/tenant/confirm`
4. Backend cria `Tenant` + `User admin` + roles/perms e faz auto-login:
   - retorna `accessToken`
   - seta cookie `refresh_token`

### Endpoints
- `POST /registration/tenant/request`
- `GET /registration/tenant/:id`
- `POST /registration/tenant/confirm`

### OAuth (opcional)
- `GET /registration/oauth/google/start?tenantName=...`
- `GET /registration/oauth/google/callback?...`
- `GET /registration/oauth/microsoft/start?tenantName=...`
- `GET /registration/oauth/microsoft/callback?...`

---

## 2) Auth (login/refresh/logout)

### Endpoints (tenant-scoped)
- `POST /t/:slug/auth/login`
  - retorna `{ accessToken }` **ou** `{ mfaRequired: true, challengeId, expiresAt }`
- `POST /t/:slug/auth/refresh`
  - retorna `{ accessToken }` e atualiza cookie
- `POST /t/:slug/auth/logout` (JWT)
- `GET /t/:slug/auth/access-logs` (JWT)

---

## 3) 2FA (MFA TOTP + trusted device)

### Setup (usuário logado)
- `POST /t/:slug/auth/mfa/totp/setup` (JWT)
- `POST /t/:slug/auth/mfa/totp/confirm` (JWT) — `{ setupId, code }`
- `POST /t/:slug/auth/mfa/totp/disable` (JWT) — `{ code }`

### Verify (quando login retorna `mfaRequired=true`)
- `POST /t/:slug/auth/mfa/totp/verify`
  - body: `{ challengeId, code, rememberDevice?: boolean }`
  - retorna `{ accessToken }`, seta cookie `refresh_token`
  - se `rememberDevice=true`, seta cookie `trusted_device`

---

## 4) Admin / Configurações

### Auditoria
- `GET /t/:slug/audit-logs` (JWT + `audit.read`)
  - query: `page`, `limit`, `action`, `entity`, `entityId`, `userId`, `from`, `to`, `search`

### Users
- `GET /t/:slug/users/me` (JWT)
- `PATCH /t/:slug/users/me` (JWT)
- `GET /t/:slug/users` (JWT + `users.read`)
- `GET /t/:slug/users/:id` (JWT + `users.read`)
- `GET /t/:slug/users/:id/access-logs` (JWT + `users.read`)
- `POST /t/:slug/users` (JWT + `users.create`)
- `PATCH /t/:slug/users/:id` (JWT + `users.update`)
- `DELETE /t/:slug/users/:id` (JWT + `users.delete`)

### Roles / Permissions
- `GET|POST|PATCH|DELETE /t/:slug/roles` (JWT + `roles.manage`)
- `GET /t/:slug/permissions` (JWT + `roles.manage`)

### Tenant (instituição)
- `GET /t/:slug/tenants/me` (JWT)
- `PATCH /t/:slug/tenants/me` (JWT + `tenants.update`)
- `GET /tenants/slug/:slug` (público)

---

## 5) Módulos (endpoints)

### People
Base: `/t/:slug/people`
- `GET /people` (`people.read`)
- `GET /people/:id` (`people.read`)
- `POST /people` (`people.create`)
- `PATCH /people/:id` (`people.update`)
- `DELETE /people/:id` (`people.delete`)

Sub-recursos seguem o padrão:
- leitura: `people.read`
- escrita: `people.update`

### Pantry
Base: `/t/:slug/pantry` (tudo protegido por `pantry.*`)
- dashboard/analytics: `GET /summary|dashboard|consumption|flow|usage`
- items: `GET/POST/PATCH/DELETE /items` + `GET /items/:id/sectors`
- donors: `GET/POST/PATCH/DELETE /donors`
- entries: `GET/POST/PATCH/DELETE /entries` + `POST /entries/:id/reverse`
- exits: `GET/POST/PATCH/DELETE /exits` + `POST /exits/:id/reverse`

---

## 6) Uploads
Base: `/t/:slug/files` (JWT)
- `POST /files/avatars`
- `POST /files/health-documents`
- `POST /files/tenant-logos`

---

## 7) Roteiro de teste (registro + 2FA)
Guia prático: `docs/processes/testes-registro-2fa.md`.
