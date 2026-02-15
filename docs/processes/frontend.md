# Frontend — Processos e integração (estudo/debug)

## 0) Rodar (dev)
```bash
cd frontend
npm run dev
```

URLs:
- Web: `http://localhost:3000`
- API: `http://localhost:3001`

---

## 1) Tenancy (slug na URL)

### Como funciona
- O frontend navega sempre em `/{tenantSlug}/...`.
- Rotas do tenant ficam em `frontend/src/app/[tenant]/...`.
- O backend recebe requests tenant-scoped em `/t/:slug/...`.

### Helpers importantes
- `withTenantPath('/people', tenantSlug)` — navegação
- `getTenantSlugFromPath(pathname)` — extrai slug

---

## 2) Registro de tenant + admin

### Rotas
- `GET /register`
- `GET /register/confirm?rid=...`

### Fluxo (alto nível)
1. Usuário preenche dados do tenant + admin (ou escolhe OAuth).
2. API cria registro pendente e envia código por email.
3. Usuário confirma o código.
4. API retorna `accessToken` + cookie refresh e o frontend redireciona para `/{slug}/dashboard`.

---

## 3) Login / sessão / refresh

### Rotas
- `GET /[tenant]/login`
- `GET /[tenant]/dashboard`

### Comportamento esperado
- Login chama `POST /t/:slug/auth/login`.
- Se `mfaRequired=true`, o frontend deve direcionar para a etapa de MFA.
- Refresh acontece via `POST /t/:slug/auth/refresh` (cookie HttpOnly).

---

## 4) 2FA (TOTP)

### Onde fica na UI
- Perfil: `GET /[tenant]/auth/profile` (aba Segurança)

### Fluxo
1. Setup: o usuário logado chama `POST /t/:slug/auth/mfa/totp/setup` e exibe QRCode.
2. Confirm: envia `{ setupId, code }` para `POST /t/:slug/auth/mfa/totp/confirm`.
3. Login: quando o backend exigir MFA, o frontend chama `POST /t/:slug/auth/mfa/totp/verify`.

---

## 5) RBAC (permissões) na UI

Regra:
- a UI **não renderiza** páginas sem `*.read`.
- a UI **não renderiza** botões/ações sem `*.create/update/delete`.

Fonte:
- `useCurrentUser()` (lista de permissões)

Exemplos:
- Pantry segue esse padrão de forma consistente.
- People segue esse padrão (list/detail/create/edit).

---

## 6) Estrutura de módulos no frontend

### Contrato do módulo
Cada módulo deve ter:
- `frontend/src/modules/<moduleKey>/manifest.ts`
- `frontend/src/modules/<moduleKey>/api/*`
- `frontend/src/modules/<moduleKey>/features/*`
- `frontend/src/modules/<moduleKey>/shared/*`

As páginas em `app/` devem ser wrappers finos:
- `frontend/src/app/[tenant]/(modules)/<moduleKey>/**/page.tsx` → `return <Screen />`

---

## 7) Requisições (API client)

Regras:
- sempre enviar `Authorization: Bearer <token>` quando autenticado
- sempre usar path tenant-scoped no backend (`/t/:slug/...`)
- para uploads: usar endpoints `files/*`

Sugestão de padrão por módulo:
- `modules/<moduleKey>/api/index.ts` (barrel)
- `modules/<moduleKey>/api/<resource>.ts` (requests por recurso)

---

## 8) Debug rápido (frontend)

Checklist quando “não chega no controller”:
1. Verificar URL do fetch (se está em `/t/:slug/...`).
2. Verificar `Content-Type` e body JSON.
3. Verificar response body (Nest retorna detalhes de validação em 400).
4. Verificar middleware de tenant (se o slug existe).
5. Verificar token e permissões (403).

