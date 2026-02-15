# Registro de Tenant + Usuário Admin (Email + OAuth)

## Objetivo
Permitir criar uma nova **instituição (tenant)** e o **usuário administrador**, com:
- `slug` gerado automaticamente a partir do nome (com sufixo se necessário).
- Confirmação obrigatória via **código enviado por email** (com expiração).
- Opção de cadastro via **Google** ou **Microsoft** (OAuth) + confirmação via código.
- Criação de roles/p permissões padrão, com **Admin** recebendo todas as permissões cadastradas.

## Backend (NestJS)

### Endpoints (públicos, sem `/t/:slug`)
- `POST /registration/tenant/request`
  - Body: `{ tenantName, adminName, adminEmail, adminPassword }`
  - Retorna: `{ registrationId }`
  - Envia email com código (ou imprime no console se SMTP não estiver configurado).

- `GET /registration/tenant/:id`
  - Retorna infos do registro (sem dados sensíveis), e se precisa definir senha (`passwordRequired`).

- `POST /registration/tenant/confirm`
  - Body: `{ registrationId, code, password? }`
  - Retorna: `{ accessToken, tenantSlug }` e seta cookie `refresh_token`.

- `GET /registration/oauth/google/start?tenantName=...` → redirect Google
- `GET /registration/oauth/google/callback` → envia código por email e redireciona para o web
- `GET /registration/oauth/microsoft/start?tenantName=...` → redirect Microsoft
- `GET /registration/oauth/microsoft/callback` → envia código por email e redireciona para o web

### Variáveis de ambiente (backend)
Em `backend/.env.example`:
- `WEB_URL` (para onde o callback OAuth redireciona, ex.: `http://localhost:3000`)
- SMTP (opcional): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- OAuth (opcional):
  - `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`
  - `MICROSOFT_OAUTH_CLIENT_ID`, `MICROSOFT_OAUTH_CLIENT_SECRET`, `MICROSOFT_OAUTH_REDIRECT_URI`

### Banco / migrations
- Novo model: `TenantRegistration`
- Migration: `backend/prisma/migrations/20260214000000_tenant_registration`

Script auxiliar (dev):
- `backend/scripts/ensure-database.js` cria o banco (se não existir) baseado no `DATABASE_URL`.

## Frontend (Next.js)

### Rotas
- `GET /register` → cria tenant + admin (email/senha) ou inicia OAuth.
- `GET /register/confirm?rid=...` → confirma código e finaliza criação (auto-login + redirect).

### Fluxo
1. Usuário preenche `tenantName` + dados do admin e envia.
2. Backend cria `TenantRegistration` e envia código.
3. Usuário confirma o código.
4. Backend cria `Tenant`, roles/permissões, e o `User` admin (com role Admin), e retorna `accessToken` + cookie refresh.
5. Frontend salva `tenantSlug` e redireciona para `/{tenantSlug}/dashboard`.

## Como testar (dev)
1. `cd backend`
2. `node scripts/ensure-database.js`
3. `npx prisma migrate deploy`
4. `npm run start:dev`
5. `cd ../frontend`
6. `npm run dev`
7. Abrir `http://localhost:3000/register`

