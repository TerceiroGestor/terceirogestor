# Banco de Dados (Prisma)

## Visão geral
- Banco: **MySQL/MariaDB**
- ORM: **Prisma**
- Schema: `backend/prisma/schema.prisma`
- Migrations: `backend/prisma/migrations/*`
- Seed: `backend/prisma/seed.ts`

---

## Entidades “core”

### Tenant
Instituição/organização.
- Chaves: `id`, `name` (unique), `slug` (unique)
- Campos comuns: `logoUrl`, `cnpj`, `startYear`, `description`, `status`

### User / Role / Permission
RBAC por tenant.
- `User` pertence a `Tenant`
- `Role` pertence a `Tenant`
- `Permission` é global (chaves como `people.read`, `pantry.update`…)
- Ligação:
  - `UserRole` (N:N)
  - `RolePermission` (N:N)

### Sessão e logs
- `UserSession`: refresh token **hash**, expiração, revogação e metadados
- `AccessLog`: ações de auth (`LOGIN`, `REFRESH`, `LOGOUT`)
- `AuditLog`: `CREATE/UPDATE/DELETE` com before/after, requestId, ip, userAgent…

---

## Registro de tenant + admin

### TenantRegistration
Armazena o “cadastro pendente” até confirmação por código / OAuth.
- Campos: `tenantName`, `tenantSlug`, `adminEmail`, `adminPasswordHash` (quando aplicável)
- Verificação: `verificationCodeHash` + `verificationCodeExpiresAt`
- Integração OAuth: `oauthProviderSub`, `oauthStateHash`

---

## MFA (2FA)

### UserMfaTotpSetup
Setup temporário para habilitar TOTP.
- Expira após um tempo (`expiresAt`)
- Guarda `secretEnc` (secret criptografado)

### UserMfaChallenge
Desafio de MFA no login quando necessário.
- Expira após um tempo (`expiresAt`)
- Pode ser consumido (`consumedAt`) e tem tentativas (`attempts`)

### UserTrustedDevice
Dispositivo confiável (evita pedir MFA sempre).
- `tokenHash` + expiração

---

## Módulo People (resumo)

### Person
Cadastro de pessoa e dados base.
Campos típicos:
- Identificação: `fullName`, `socialName`, `birthDate`, `avatarUrl`
- Dados sociais: `sex`, `gender`, `raceColor`, `maritalStatus`, `nationality`
- Contato/documentos: `email`, `phone`, `document`, `rg`, `nis`
- Estado: `status`, `departureReason`, `tags` (JSON), `profileSummary` (richtext)

Sub-recursos (em tabelas dedicadas): rendas, despesas, saúde, relações familiares, bens e núcleo familiar.

---

## Módulo Pantry (resumo)

### PantryItem
Catálogo de itens.
- Campos: `name`, `group`, `unit`, `minStock`

### PantryDonor
Doadores (pessoa/empresa).
- Campos: `name`, `type`, `contact`

### PantryEntry
Entrada (lote).
- Campos: `itemId`, `donorId?`, `sector`, `quantity`, `unit`, `entryDate`, `expiryDate?`, `notes?`

### PantryExit
Saída (movimentação).
- Campos: `itemId`, `sector`, `quantity`, `unit`, `exitDate`, `type`, `eventName?`, `notes?`

### PantryExitAllocation
Alocação de saída em entradas (FIFO).
- Campos: `exitId`, `entryId`, `quantity`

---

## Migrations (como trabalhar com segurança)

### Dev
- Criar/atualizar migrations: `cd backend && npx prisma migrate dev`
- Reset total (apaga dados): `cd backend && npx prisma migrate reset`

### Produção
- Aplicar migrations existentes: `cd backend && npx prisma migrate deploy`
- **Não** rodar seed em produção

Boas práticas:
- Preferir migrations aditivas (expand/contract)
- Separar backfills em scripts (quando necessário)
- Revisar SQL gerado em `backend/prisma/migrations/*/migration.sql`

---

## Seed (dados de teste)
O seed:
- cria tenant exemplo + roles/perms + usuários
- cria dados de `people`
- cria dados realistas de `pantry` (itens/entradas/saídas/alocações)

Rodar:
- `cd backend && npx prisma db seed`

