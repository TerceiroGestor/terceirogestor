# Arquitetura do Projeto (template)

## Visão geral
- **Backend:** NestJS + Prisma (MySQL/MariaDB)
- **Frontend:** Next.js (App Router)
- **Multi-tenant:** por `tenantSlug`
  - Backend tenant-scoped: `/t/:slug/...`
  - Frontend tenant-scoped: `/{slug}/...`
- **Auth:** JWT (access token) + refresh token (cookie HttpOnly)
- **RBAC:** permissões por perfil (`PermissionsGuard` + `@Permissions(...)`)
- **Auditoria:** `AuditLog` com before/after e metadados de request

---

## Estrutura de pastas (resumo)

### Backend
- `backend/src/core/`
  - `tenancy/` (middleware `/t/:slug`)
  - `auth/` (login/refresh/logout + MFA TOTP)
  - `authorization/` (RBAC: guard/decorator)
  - `audit/` (consulta de logs)
  - `prisma/` (PrismaService + extensão de auditoria)
  - `email/` (envio de códigos, templates)
- `backend/src/modules/`
  - `registration/` (registro de tenant + admin)
  - `users/`, `roles/`, `permissions/`, `tenants/`
  - `people/`
  - `pantry/`
- `backend/prisma/`
  - `schema.prisma`
  - `migrations/*`
  - `seed.ts`

### Frontend
- `frontend/src/app/`
  - `register/*` (cadastro de tenant + confirmação)
  - `[tenant]/` (rotas do tenant)
    - `(modules)/...` (páginas por módulo)
- `frontend/src/modules/` (**domínio por módulo**)
  - `<moduleKey>/manifest.ts` (menu/permissões do módulo)
  - `<moduleKey>/api/*` (requests do módulo)
  - `<moduleKey>/features/*` (sub-funcionalidades do módulo)
  - `<moduleKey>/shared/*` (reuso interno do módulo)
- `frontend/src/components/` (toolbox global: `DataTable`, `FormEngine`, `SectionDialog`, etc.)
- `frontend/src/features/` (infra cross-module: `auth`, `uploads`, etc.)
- `frontend/src/lib/` (helpers: tenant-path, API client, datas, etc.)

---

## Convenções principais

### Tenancy
- Backend: chamadas tenant-scoped **sempre** via `/t/:slug/...`.
- Frontend: navegação tenant-scoped **sempre** via `/{slug}/...` e helpers (`withTenantPath`).

### “App Router é wiring-only”
No Next.js:
- `src/app/**` deve ser **apenas** rota/layout/redirecionamento + wrapper fino.
- Toda lógica de domínio (hooks, components de tela, mappers, API) fica em `src/modules/**`.

### Segurança (regra de ouro)
- **Backend decide:** endpoints protegidos com `JwtAuthGuard` + `PermissionsGuard` + `@Permissions(...)`.
- **Frontend melhora UX:** oculta/desabilita ações sem permissão, mas nunca substitui o backend.

---

## Onde estudar os processos
- Backend (processos/endpoints): `docs/processes/backend.md`
- Frontend (processos/telas/padrões): `docs/processes/frontend.md`

