# Platform (Packages versionado) — plano completo de desenvolvimento

Este documento sintetiza todas as decisões e ideias discutidas e descreve um **plano de desenvolvimento** para chegar em um **Platform repo** (core + UI) versionado, reutilizável para criar produtos diferentes onde o time foca **somente nos módulos e features do produto**.

## 0) Resultado esperado (visão)

Um repositório “Platform” que entrega um sistema completo **sem módulos de produto**, contendo:

- Multi-tenant seguro (sem risco de vazamento entre empresas).
- Auth robusta (JWT + refresh cookie + sessões).
- RBAC por perfis e permissões + telas admin completas.
- Auditoria automática (100% das mutações) + UI de auditoria global e por escopo (módulo/entidade).
- Sistema de “módulos vendáveis/habilitáveis” por tenant.
- Base de UI consistente (componentes padrão) para qualquer módulo futuro.
- Documentação + i18n/textos centralizados + processo para manter tudo saudável.
- Billing opcional (Mercado Pago) com política **seat-based** e `past_due` em **read-only**.

O objetivo é que um produto novo seja criado rapidamente com:
- Registro do módulo + migrations + endpoints + UI do módulo
- Sem tocar no core além do necessário

---

## 1) Princípios e regras do Platform

### 1.1 Separação de responsabilidades
- **Platform** resolve tudo que é transversal: tenancy, auth, RBAC, audit, módulo habilitado, UI base, docs, i18n, billing (opcional).
- **Produto** resolve apenas domínios: módulos + features do domínio (ex.: tasks, ponto, condomínio, ONG…).

### 1.2 Arquivos pequenos e responsabilidade única
- UI/Controller: ideal ≤100 linhas; “dor” ≥200 (refatorar).
- Engines (componentes robustos) podem ser maiores, mas devem ser divididos internamente (hooks/renderers/utils).

### 1.3 “Se é X, use sempre Y”
- Form: `FormEngine`
- Table/listagem: `TableEngine` (ou `DataTable` como nome público)
- Dialog: `SectionDialog` (pattern)
- Toast: `useToast`
- Confirm: `useConfirm`
- Auditoria no contexto do módulo: `AuditTimeline` (engine/pattern)
- Rotas multi-tenant: sempre via helper (`withTenantPath` / `withTenantApiPath`)

### 1.4 “Engine” apenas para config-driven
Adotado:
- `*Engine` somente para componentes de alto nível e orientados por configuração.
- Primitives/patterns mantêm nomes normais (Dialog/Tabs/Sheet…).

---

## 2) Arquitetura alvo (monorepo)

### 2.1 Estrutura recomendada

```
platform/
  apps/
    api/                  # Nest + Prisma (core)
    web/                  # Next (core UI)
  packages/
    ui/                   # UI base (engines + patterns + primitives wrappers)
    core/                 # tenancy/auth/rbac/audit/module-registry (shared)
    shared/               # types, contracts, helpers, enums
    i18n/                 # t(), loader, tipos, tooling
    billing-core/         # opcional (seats + policies)
    billing-mercadopago/  # opcional (provider MP)
    admin-billing-ui/     # opcional (telas de billing)
    config/               # eslint/tsconfig/prettier/tailwind base
  docs/                   # documentação estável (platform + módulos)
  doc/                    # decisões e análises (ADRs/políticas)
```

> Motivo: evitar “drift” entre produtos. O core vira pacote versionado e os produtos só consomem.

### 2.2 Contratos entre pacotes
- `packages/shared`: “source of truth” de tipos/contratos (ex.: paginação, erro, enum de `ModuleKey`, `PermissionKey`).
- `packages/core`: implementações do backend/frontend que dependem de `shared`.
- `packages/ui`: depende de `shared` + `i18n` (e opcionalmente `core`).
- Apps (`apps/api`, `apps/web`) consomem `core/ui/shared`.

---

## 3) Core do Platform (o que precisa existir)

### 3.1 Tenancy (multi-tenant)
Backend:
- Rota padrão API: `/t/:slug/...`
- Middleware resolve `tenantId` por `slug`, injeta em `req` e reescreve URL.
- `JwtStrategy` valida compatibilidade tenantId do token vs rota.

Frontend:
- Rota padrão app: `/<slug>/...`
- Helpers para caminhos com slug.
- Middleware do Next para redirecionar caminhos legados (sem slug) quando possível.

### 3.2 Auth e sessão
Backend:
- `POST /auth/login` → accessToken + refresh_cookie (httpOnly)
- `POST /auth/refresh` → rota com rotação de refresh
- `POST /auth/logout`
- `UserSession` com hash do refresh token + expiração + revogação

Frontend:
- Provider de Auth: token em sessionStorage (não localStorage)
- Refresh automático quando token expirado

### 3.3 RBAC (roles/permissões)
Backend:
- `@Permissions(...)` + guard
- Modelos: `Role`, `Permission`, `RolePermission`, `UserRole`
- Convenção: `<moduleKey>.<action>` (read/create/update/delete/manage…)

Frontend:
- `CurrentUserProvider` expõe `permissions`
- UI desabilita/oculta ações e telas conforme permissões (UX), mas o backend é a segurança real.

### 3.4 Auditoria (100% mutações)
Backend:
- Auditoria automática via extension Prisma: create/update/delete/upsert/bulk…
- Redaction de campos sensíveis
- Metadados: requestId, ip, userAgent, userId, tenantId

Frontend:
- Tela global de auditoria (Admin)
- Componente padrão de timeline para auditoria por escopo (módulo/entidade)

### 3.5 Módulos habilitáveis (vendáveis)
Backend:
- Tabela `TenantModule` (enabled por tenant e `moduleKey`)
- `ModuleRegistry` (fonte de verdade): define módulos disponíveis
- `ModuleEnabledGuard(moduleKey)` bloqueia endpoint quando módulo desabilitado

Frontend:
- Menu e rotas filtrados pelos módulos habilitados
- Tela Settings/Admin para habilitar/desabilitar módulos do tenant

### 3.6 Billing (opcional) — seats + Mercado Pago
Decisão fechada:
- Cobrança por usuário ativo (`isActive=true`).
- `past_due` = read-only + sem admin/escrita (carência configurável).

Documento: `doc/billing-assinaturas-seats-mercadopago.md`

---

## 4) UI Base do Platform (toolbox)

### 4.1 Categorias de UI
- **Primitives**: wrappers de Radix/shadcn-style (Dialog, Tabs, Sheet, AlertDialog, Dropdown, Button, Input…)
- **Patterns**: composições com UX padronizado (SectionCard, SectionDialog, ConfirmActionDialog, EmptyState, PageHeader, Breadcrumb…)
- **Engines** (config-driven):
  - `FormEngine` (forms por schema/config)
  - `TableEngine` (tabela robusta com filtros/agrupamento/export/paginação)
  - `TimelineEngine` (timeline genérica)
  - `AuditTimeline` (preset padrão: TimelineEngine + dados de AuditLog)

### 4.2 Regras de criação de componentes
- Não criar “variações locais” do mesmo componente (ex.: vários dialogs).
- Se um padrão se repetir 2–3 vezes, virar um pattern/engine no `packages/ui`.
- Todo componente base deve ter:
  - API clara (props)
  - textos via `t()` (i18n)
  - acessibilidade mínima (aria, focus, teclado)

---

## 5) Textos e i18n (centralização + tradução)

Objetivo:
- Textos não ficam espalhados em componentes.
- Permitir tradução e padronizar termos.

Padrão:
- Função `t(key)` com namespaces:
  - `core.actions.save`
  - `billing.status.past_due`
  - `modules.tasks.toast.created`

Backend:
- Retornar erros com `code` (não texto), frontend traduz.

Documento: `doc/documentacao-e-textos-i18n.md`

---

## 6) Documentação (processo obrigatório)

### 6.1 Tipos de doc
- `doc/`: decisões/padrões internos do Platform
- `docs/`: documentação estável (platform + módulos)

### 6.2 Documentação por módulo (sempre)
Ao criar um módulo de produto, criar:
- `docs/modules/<moduleKey>/user-guide.md`
- `docs/modules/<moduleKey>/dev-guide.md`

Templates:
- `docs/modules/_template/user-guide.md`
- `docs/modules/_template/dev-guide.md`

---

## 7) Contratos técnicos padrão (para evitar divergência)

### 7.1 API Response padrão
- Listas: `{ data, pagination }`
- Erros: `{ code, message?, details? }` (message pode ser só fallback)

### 7.2 Query padrão (listas)
- `page`, `limit`, `search` (e filtros específicos)

### 7.3 Auditoria padrão
Filtragem mínima:
- por `entity`, `entityId`, `userId`, `search`, período
Evolução recomendada:
- adicionar `moduleKey`/`featureKey` no `AuditLog` para “auditoria no contexto do módulo”.

---

## 8) Versionamento (SemVer) e releases do Platform

### 8.1 SemVer
- `major`: quebra de contrato (API/UI/DB) que exige mudança no produto.
- `minor`: feature compatível (novo módulo core, novo componente, endpoint novo).
- `patch`: correções sem mudar contratos.

### 8.2 Changelog e automação
Recomendação:
- Usar Changesets (ou equivalente) para:
  - gerar changelog por pacote
  - bump automático de versão
  - publicar pacotes

### 8.3 Migrações Prisma no Platform
Regras:
- Migrações do core do Platform são versionadas e aplicadas nos produtos.
- Produtos adicionam migrações de seus módulos por cima.
- Evitar mudanças destrutivas sem janela (expand/contract).

---

## 9) Plano de desenvolvimento (milestones)

### Milestone 1 — Platform Core mínimo (MVP)
Objetivo: core pronto e utilizável sem módulos de produto.

Entregas:
- Tenancy end-to-end (api + web)
- Auth (login/refresh/logout) + sessions
- RBAC + tela admin para usuários/roles/permissões
- Auditoria automática + tela global (Admin)
- `TenantModule` + ModuleRegistry + tela de habilitar módulos (sem módulos reais ainda)
- UI base (FormEngine, TableEngine, SectionDialog, toast/confirm)
- Documentação base + i18n base (t())

Definition of Done:
- Um “produto vazio” roda com login e admin e não quebra sem módulo.

### Milestone 2 — Auditoria no contexto (timeline por módulo/entidade)
Entregas:
- `TimelineEngine` + `AuditTimeline` (preset)
- Endpoints com filtros completos
- Padrão: toda “página principal de módulo” tem section/tab de auditoria

### Milestone 3 — Billing opcional (seats + MP)
Entregas:
- `billing-core` + `billing-mercadopago`
- Webhook + idempotência + reconciliação
- Policy `past_due` read-only + banner UI
- Enforcement: bloqueio de mutações + bloqueio de criação/ativação de usuários

### Milestone 4 — Ferramentas de produtividade
Entregas:
- Gerador de módulo (backend + frontend + docs + mensagens)
- Checklists automatizados (lint, typecheck, build)
- Storybook (opcional) para UI base

### Milestone 5 — “Exemplo canônico” (módulo simples de referência)
Entregas:
- Criar um módulo de exemplo (ex.: `tasks`) em um repositório de produto de exemplo
- Ele vira o “hello world sério” para novos produtos

---

## 10) Como um produto consome o Platform (fluxo recomendado)

1) Criar repo do produto (vazio) e adicionar dependências do Platform (packages).
2) Configurar `apps/api` e `apps/web` do produto:
   - apontar para os packages do Platform
   - configurar `.env` do produto
3) Criar módulo do produto:
   - registrar `moduleKey` no ModuleRegistry do produto (ou plugin)
   - adicionar migrations do módulo
   - criar endpoints + UI usando engines/patterns do Platform
   - adicionar docs e mensagens
4) Habilitar módulo via tela Settings/Admin e testar auditoria no contexto.

---

## 11) Checklist “Platform pronto para virar padrão”

- Core roda sem módulos de produto.
- Todo endpoint é multi-tenant seguro.
- Auth/refresh robusto e testado.
- RBAC consistente e telas admin completas.
- Auditoria 100% nas mutações + UI global + UI por escopo.
- UI toolbox consistente (sem duplicações locais).
- i18n/textos centralizados + backend por `code`.
- Documentação (dev + user) com templates e processo.
- Releases versionadas (SemVer) + changelog por pacote.

---

## 12) Documentos relacionados

- Estrutura atual e padrões: `doc/estrutura-stack-padroes.md`
- Billing (seats + Mercado Pago): `doc/billing-assinaturas-seats-mercadopago.md`
- Documentação + textos/i18n: `doc/documentacao-e-textos-i18n.md`

