# Estrutura do projeto, stack base e padronização (guia vivo)

Este documento registra **como o projeto está organizado hoje**, **como ele funciona ponta-a-ponta**, e propõe uma **base (“esqueleto”) reutilizável** + **padrões/processos** para manter o código pequeno, consistente e fácil de evoluir.

> Complementa e aprofunda os arquivos em `docs/architecture.md`, `docs/database.md` e `docs/changelog.md`.

## 1) Objetivo (o que queremos garantir)

- Manutenção fácil: leitura rápida, poucos efeitos colaterais, mudanças localizadas.
- Evolução rápida: criar novas features sem “inventar” estrutura toda vez.
- Reuso: este repositório virar um **template** para novos sistemas.
- Código “humanizado”: **arquivos pequenos** (ideal ≤100 linhas; limite “dor” ≥200), nomes claros e responsabilidade única.

---

## 2) Stack atual (o que existe hoje)

### Frontend (`frontend/`)

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- `@tanstack/react-table` como base do `DataTable`
- Radix UI (wrapper em `frontend/src/components/ui/*`)
- Ícones: `lucide-react`
- Shadcn

Arquivos-base importantes:

- Rotas: `frontend/src/app/*`
- Abstração de API (token/refresh + tenant): `frontend/src/lib/api.ts`
- Resolução de tenant no browser (slug): `frontend/src/lib/tenant-path.ts`
- Redirecionamentos/compat legado (tenant): `frontend/middleware.ts`

### Backend (`backend/`)

- NestJS + TypeScript
- Prisma + MySQL (com adapter MariaDB via `@prisma/adapter-mariadb`)
- Auth: JWT + refresh token (cookie httpOnly)
- Autorização: permissões por role (`PermissionsGuard`)
- Auditoria: extension no Prisma (`CREATE/UPDATE/DELETE/...`)
- Request context: `AsyncLocalStorage` (requestId, ip, userAgent, userId, tenantId)

Arquivos-base importantes:

- Bootstrap: `backend/src/main.ts`
- Módulos: `backend/src/app.module.ts`
- Multi-tenancy (rota `/t/:slug/...`): `backend/src/core/tenancy/tenancy.middleware.ts`
- Prisma + auditoria: `backend/src/core/prisma/prisma.service.ts`
- Auth: `backend/src/core/auth/auth.controller.ts`, `backend/src/core/auth/auth.service.ts`
- Permissões: `backend/src/core/authorization/permissions.guard.ts`
- Schema/migrations/seed: `backend/prisma/schema.prisma`, `backend/prisma/migrations/*`, `backend/prisma/seed.ts`

### Infra (Docker)

- MySQL via compose: `backend/docker/docker-compose.yml`

Observação importante:

- Existe um `docker-compose.yml` na raiz que referencia `./nginx/default.conf` e `./certs`, mas **essas pastas não existem** no repo atual. Trate isso como **stale/rascunho** (ver seção 6).

---

## 3) Estrutura de pastas (visão “real” do repo)

### Raiz

- `backend/`: API NestJS + Prisma
- `frontend/`: App Next.js
- `docs/`: documentação já existente (arquitetura, banco, changelog)
- `doc/`: **(novo)** análises/decisões de padronização (este arquivo)

### Frontend (sugestão de leitura)

- `frontend/src/app/`: **rotas** (App Router)
  - `frontend/src/app/page.tsx`: entrada sem tenant (escolhe slug e redireciona)
  - `frontend/src/app/[tenant]/page.tsx`: “root” do tenant (redireciona para dashboard)
  - `frontend/src/app/[tenant]/(modules)/...`: páginas por módulo (admin, people, pantry, etc.)
- `frontend/src/features/`: **features (domínios)** com organização repetível
  - Ex.: `frontend/src/features/pantry/*` (api/config/domain/ui)
- `frontend/src/components/`: **componentes reutilizáveis**
  - `frontend/src/components/DataTable/*`: tabela robusta (filtros/agrupamento/export)
  - `frontend/src/components/FormEngine/*`: formulários declarativos por config
  - `frontend/src/components/section-dialog.tsx`: wrapper de dialog com header/scroll padronizado
  - `frontend/src/components/ui/*`: primitives (Radix/shadcn-style)
- `frontend/src/lib/`: helpers e utilidades (API client, datas, tenant, etc.)

### Backend (sugestão de leitura)

- `backend/src/core/`: infraestrutura/cross-cutting
  - `auth/`, `authorization/`, `prisma/`, `tenancy/`, `request-context/`, `audit/`, `utils/*`, `files/*`
- `backend/src/modules/`: domínios do sistema
  - Ex.: `backend/src/modules/pantry/*` e `backend/src/modules/people/*`
- `backend/prisma/`: schema + migrations + seed
- `backend/generated/prisma/`: Prisma Client gerado (copiado para o `dist/` no build)
- `backend/scripts/sync-generated-prisma-to-dist.js`: garante Prisma Client disponível em produção

---

## 4) Como o sistema funciona hoje (fluxo ponta-a-ponta)

### 4.1 Multi-tenancy (tenant via slug)

Frontend:

- O usuário acessa `/` (`frontend/src/app/page.tsx`) e informa/recupera um `tenantSlug`.
- A navegação padrão vira `/<slug>/...`.
- Para compatibilidade/legado, `frontend/middleware.ts` também redireciona caminhos “sem slug” (ex.: `/dashboard`) para `/<slug>/dashboard`.

Backend:

- O frontend chama a API sempre com prefixo `/t/<slug>/...` (ver `frontend/src/lib/tenant-path.ts` + `frontend/src/lib/api.ts`).
- O middleware `backend/src/core/tenancy/tenancy.middleware.ts`:
  - Extrai o slug do path `/t/:slug/...`
  - Resolve o `tenantId` via Prisma
  - Injeta `req.tenantId` e reescreve `req.url` removendo o prefixo `/t/:slug` (controllers ficam “limpos”)
- O `JwtStrategy` valida que o token pertence ao mesmo `tenantId` quando a rota tem tenant (defesa extra).

### 4.2 Auth (access token + refresh token)

Backend:

- `POST /auth/login`: retorna `accessToken` e grava `refresh_token` em cookie httpOnly.
- `POST /auth/refresh`: usa cookie, faz rotação de refresh, retorna novo `accessToken`.
- `POST /auth/logout`: revoga a sessão e zera o cookie.

Frontend:

- `AuthProvider` (`frontend/src/features/auth/auth-context.tsx`) guarda `accessToken` no `sessionStorage`.
- `apiRequest` (`frontend/src/lib/api.ts`) injeta `Authorization: Bearer ...` e tenta refresh quando o token está expirado.

### 4.3 Autorização por permissão

Backend:

- Decorator `@Permissions(...)` + `PermissionsGuard` checa permissões via roles do usuário.

Frontend:

- `useCurrentUser()` expõe `permissions` e a UI bloqueia telas/ações (ex.: auditoria exige `audit.read`).

### 4.4 Auditoria (before/after)

Backend:

- `backend/src/core/prisma/prisma.service.ts` aplica uma extensão que intercepta operações Prisma e grava `AuditLog`.
- Dados sensíveis são redigidos (`[REDACTED]`) com base em chaves/keywords.
- Metadados vêm do `RequestContextService` (requestId, ip, userAgent, userId, tenant).

Frontend:

- Página: `frontend/src/app/[tenant]/(modules)/admin/audit-logs/page.tsx`
- Tabela: `DataTable` (`frontend/src/components/DataTable/*`)

---

## 5) Padrões bons que já existem e devem virar regra

### Frontend

- **Table**: sempre `DataTable` (evita tabelas “caseiras” sem filtro/export/paginação).
- **Form**: sempre `FormEngine` + `config/*-form-config.ts` (evita forms inconsistentes).
- **Dialog**: sempre `SectionDialog` (header/scroll/ações consistentes).
- **Confirmação**: sempre `useConfirm()` (evita `window.confirm` e divergência de UX).

Estrutura “feature-first” (modelo atual que vale manter):

- `features/<feature>/api.ts` (integração com backend + tipos)
- `features/<feature>/config/*` (configs do FormEngine, colunas, etc.)
- `features/<feature>/domain/*` (tipos e regras puras do domínio)
- `features/<feature>/ui/*` (telas/partes de UI)

### Backend

- Separação clara:
  - `core/*`: infra e cross-cutting (auth, prisma, tenancy, request-context, audit, utils)
  - `modules/*`: casos de uso do domínio (people, pantry, users, roles, tenants…)
- DTOs e validação (class-validator) nos endpoints.
- Multi-tenancy resolvida antes de chegar nos controllers (middleware).

---

## 6) Sinais de “bagunça” encontrados (com exemplos reais)

### 6.1 Arquivos grandes demais (refatoração prioritária)

Frontend (exemplos por linhas):

- `frontend/src/components/DataTable/DataTableClient.tsx` (~1000 linhas) — ok ser robusto, mas pede **subdivisão interna** por responsabilidades (hooks/renderers/utils).
- `frontend/src/features/people-financial/ui/people-financial-panel.tsx` (~900)
- `frontend/src/features/people/api.ts` (~788) — muito tipo + muita função no mesmo arquivo.
- `frontend/src/features/pantry/ui/pantry-item-movement-dialog.tsx` (~572) — dialog com muita regra/estado.

Backend:

- `backend/src/modules/people/people.service.ts` (~2000)
- `backend/src/modules/pantry/pantry.service.ts` (~1800)
- `backend/prisma/seed.ts` (~1488) — seed monolítico.

Meta de padrão:

- UI/controller: ≤200 (ideal ≤100)
- “framework components” (ex.: DataTable): pode passar, mas deve ter **arquitetura interna** (submódulos) para continuar legível.

### 6.2 Infra/documentação inconsistentes

- `docker-compose.yml` na raiz referencia `nginx/` e `certs/` que não existem.
- `backend/README.md` e `frontend/README.md` ainda são boilerplate (o guia real está em `README.md` na raiz).
- Existem arquivos duplicados `.env.exemple` e `.env.example` em `backend/` e `frontend/` (padronizar e manter só um).
- Inconsistência de credenciais do MySQL:
  - `backend/docker/docker-compose.yml` define um `MYSQL_ROOT_PASSWORD` diferente do exemplo em `backend/.env.example` (ajustar para não “quebrar” o setup rápido).
- O `docker-compose.yml` da raiz usa `ongdb`/`root123`, enquanto o backend usa `DATABASE_URL` (tende a confundir; escolher 1 abordagem).

### 6.3 Encoding (texto “quebrado”)

Há strings com caracteres corrompidos (ex.: `VocÃª`, `InstituiÃ§Ã£o`) em arquivos como:

- `frontend/src/app/page.tsx`
- `frontend/src/features/pantry/ui/pantry-entry-edit-dialog.tsx`
- `frontend/src/features/pantry/ui/pantry-item-movement-dialog.tsx`
- `docs/implementações.md`

Isso costuma ser “salvo/interpretado” com encoding errado. Padronizar **UTF-8** no repo.

### 6.4 Import patterns inconsistentes

Ex.: `FormEngine` aparece importado tanto de:

- `@/components/FormEngine`
  quanto de:
- `@/components/FormEngine/FormEngine`

Padronizar para o barrel `@/components/FormEngine` (menos variação, mais fácil refatorar).

### 6.5 Debug leftovers

- Há `console.log` em pontos de produção (ex.: `frontend/src/components/FormEngine/FormEngine.tsx`). Padronizar: **sem logs** fora de `_tests/` e ferramentas de debug.

---

## 7) “Esqueleto” (stack base) para reutilizar em outros projetos

### 7.1 O que este projeto já tem de “base padrão” (reutilizável)

Backend (baseline forte):

- Multi-tenancy via slug na rota (middleware + validação no JWT)
- Auth com refresh token rotativo + tabela de sessões
- PermissionsGuard (RBAC por permissão)
- Auditoria automática via Prisma extension (before/after + redaction)
- RequestContext via AsyncLocalStorage (requestId, ip, userAgent)
- ServeStatic para uploads

Frontend (baseline forte):

- Tenant-first routing (`/<slug>`) + compat com legado (`/t/<slug>`)
- API client com refresh automático e anexação de tenant no path
- Componentes padrão de sistema: `DataTable`, `FormEngine`, `SectionDialog`, `SectionCard`

### 7.2 Template sugerido (estrutura “padrão v1”)

Para novos projetos, a sugestão é usar **esta mesma base**, mas com algumas “regras do template”:

- `backend/`
  - `src/core/` (infra obrigatória): auth, authorization, prisma, tenancy, request-context, audit, utils
  - `src/modules/<feature>/` (domínio): controller + service(s) pequenos + dto + mappers
  - `prisma/` (schema + migrations + seed modular)
- `frontend/`
  - `src/app/[tenant]/(modules)/<module>/...` (páginas finas, orquestração)
  - `src/features/<feature>/` (feature-first: domain/data/ui/config)
  - `src/components/` (design system + “system components”)
  - `src/lib/` (api client, tenant-path, helpers)
- `docs/` (documentação estável)
- `doc/` (decisões e análises de padronização)

---

## 8) Padrões novos (propostos) para padronizar e reduzir repetição

### 8.1 Regra “se é X, use sempre Y”

- **Form**: sempre `FormEngine` + configs em `config/*-form-config.ts`
- **Table/Listagem**: sempre `DataTable` + `columns.tsx` separado do page/component
- **Dialog**: sempre `SectionDialog` (nada de dialog “na mão” em cada feature)
- **Alert/Confirm**: sempre `useConfirm()` + `toast` (não misturar abordagens)

### 8.2 Padrão de “CRUD UI” (para matar a explosão de dialogs)

Problema observado:

- Muitas features repetem o mesmo “shape”: abrir dialog → carregar entidade → mostrar form → salvar → toast → fechar → reload.

Padrão proposto (criar um componente reutilizável):

- `EntityFormDialog` (nome sugestivo):
  - Base: `SectionDialog`
  - Conteúdo: `FormEngine`
  - Estados padrão: `loading`, `saving`, `error`
  - Slots: `headerSlot`, `footerSlot`, `extraActions`
  - Contratos:
    - `load(id) -> entity`
    - `toInitialValues(entity) -> values`
    - `toPayload(values) -> payload`
    - `onSubmit(payload)`
    - `permissions` para habilitar/desabilitar ações

Isso reduz dezenas de arquivos “Dialog” para um padrão com configs pequenas.

### 8.3 Padronização da camada de API no frontend

Hoje, vários `api.ts` acumulam:

- Tipos + requests + helpers + mapeamento em um único arquivo grande.

Padrão proposto por feature:

- `features/<feature>/api/<feature>.client.ts` (somente chamadas HTTP)
- `features/<feature>/api/<feature>.types.ts` (tipos de resposta/payload)
- `features/<feature>/api/<feature>.mappers.ts` (conversões, labels, normalizações)
- `features/<feature>/api/index.ts` (barrel)

### 8.4 Padronização do backend (quebrar services enormes)

Problema observado:

- `people.service.ts` e `pantry.service.ts` viraram “god services”.

Padrão proposto:

- Um controller chama **serviços menores** por subdomínio/use case, por exemplo em `pantry/`:
  - `PantryItemsService` (items)
  - `PantryDonorsService` (donors)
  - `PantryEntriesService` (entries)
  - `PantryExitsService` (exits)
  - `PantryReportsService` (dashboard/usage)
  - `PantryReversalsService` (reverse entry/exit)
- Extract de helpers puros para `core/utils/*` ou `modules/<feature>/*.utils.ts`

Regra de dependência:

- Controller → UseCaseService → PrismaService
- Helpers/mappers **puros** (sem Prisma) ficam fora do service.

### 8.5 Seed e migrations (processo padrão)

Seed atual:

- `backend/prisma/seed.ts` é grande e contém muitos dados de exemplo com IDs fixos.

Padrão proposto:

- `backend/prisma/seed/` (modular):
  - `00-tenant.ts`, `01-permissions.ts`, `02-roles.ts`, `03-users.ts`, `10-people.ts`, `20-pantry.ts`, ...
  - Um `seed.ts` pequeno orquestra tudo.

Regras:

- Seed **nunca** rodar em produção.
- Preferir dados mínimos e reutilizáveis (evitar “excesso de mock” no seed principal).
- Backfills reais viram scripts em `backend/scripts/*` (como já existe).

---

## 9) Processos de melhoria (para manter a casa em ordem)

### 9.1 Checklist de PR (padrão)

- Novo endpoint:
  - está sob `/t/:slug/...`?
  - tem `JwtAuthGuard` + `@Permissions(...)` quando aplicável?
  - está auditando corretamente (não vazou dado sensível)?
- Nova UI:
  - listagem usa `DataTable`?
  - form usa `FormEngine`?
  - dialog usa `SectionDialog`?
- Arquivos:
  - nenhum arquivo novo passou de ~200 linhas sem justificativa?
  - imports padronizados (barrels)?
  - strings em UTF-8 (acentos ok)?

### 9.2 “Limpeza” periódica (mensal)

- Rodar varredura de arquivos órfãos (sugestões):
  - `ts-prune` (órfãos TS)
  - `madge` (ciclos/dependências)
  - ESLint (no-unused-vars, etc.)
- Remover páginas/components antigos ou mover para `__deprecated__/` com prazo.

### 9.3 Geração de features (evitar divergência estrutural)

- Criar um gerador (ex.: Plop/Hygen) para:
  - Backend: `module + controller + dto + service(s) + tests (opcional)`
  - Frontend: `feature folder (domain/api/ui/config) + page stub`

Isso evita que cada dev invente uma estrutura diferente.

---

## 10) Próximos passos (ordem sugerida e de alto impacto)

1. **Padronização de infra/docs**
   - Decidir: manter ou remover o `docker-compose.yml` da raiz (ou adicionar `nginx/` e `certs/`).
   - Unificar `backend/README.md` e `frontend/README.md` (ou apontar explicitamente para `README.md` da raiz).
   - Remover `*.env.exemple` e manter apenas `*.env.example`.

2. **Corrigir encoding (UTF-8)**
   - Normalizar arquivos com strings corrompidas (frontend + docs).

3. **Atacar os maiores arquivos por repetição**
   - Frontend: criar `EntityFormDialog` e refatorar dialogs repetidos.
   - Frontend: quebrar `features/*/api.ts` em `client/types/mappers`.
   - Backend: quebrar `people.service.ts` e `pantry.service.ts` por subdomínio.
   - Seed: modularizar em `backend/prisma/seed/*`.

4. **Definir “contratos padrão”**
   - Nomenclatura de permissões por feature (ex.: `pantry.read|create|update|delete`).
   - Padrão de paginação (`page/limit/search`) e respostas (`{ data, pagination }`) — já existe em várias partes, formalizar como contrato.

## 11) Documentos relacionados (Platform)

- Billing (seats + Mercado Pago): `doc/billing-assinaturas-seats-mercadopago.md`
- Processo de documentação + textos/i18n: `doc/documentacao-e-textos-i18n.md`
