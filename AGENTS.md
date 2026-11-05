# AGENTS.md — Terceiro Gestor

SaaS multi-tenant para gestão de instituições do terceiro setor.
Objetivo atual: **chegar em produção (Railway + Cloudflare DNS/R2) sem
risco para os dados das instituições.** O plano completo está no documento
"Terceiro Gestor — Plano de Revisão e Produção"; o trabalho em andamento
fica em `PLAN.md`.

## Antes de qualquer tarefa

1. Leia `PLAN.md`. Ele diz em qual Parte estamos e o que está aberto.
2. Trabalhe **só** em itens da Parte atual. Ideia fora dela vai para
   `docs/backlog.md` com um gatilho, e não para o código.
3. Se a tarefa não está no `PLAN.md`, pergunte antes de começar.

Partes, em ordem: 1 Limpeza → 2 Pequenas correções → 3 Correções severas
→ 4 Produção → 5 Evolução de arquitetura (só depois do go-live).

## Estrutura

```
backend/    NestJS 11 (Express) + Prisma 7 + PostgreSQL
  src/core/      auth (JWT + MFA), authorization (RBAC), tenancy, pii,
                 audit, files, rate-limit
  src/modules/   domínio: people, people-groups, people-segments,
                 programs, projects, project-structure, actions, tasks,
                 deposit, pantry, dashboard, registration
  prisma/        schema.prisma, migrations/, seed.ts
frontend/   Next 16 (App Router) + React 19 + shadcn/ui + TanStack Table
  src/web-client/  infraestrutura de UI reutilizável (não conhece módulos)
  src/modules/     telas de cada módulo
  src/features/    legado: só auth, admin e uploads continuam válidos
docs/       documentação viva; docs/historico/ = o que não vale mais
.env        na RAIZ do repositório (lido pelo backend e pelo frontend)
```

## Comandos

```bash
# backend
cd backend
npm ci && npx prisma generate
npx tsc --noEmit -p tsconfig.build.json
npm test
npx eslint "src/**/*.ts"        # medir (NÃO use `npm run lint`: ele aplica --fix)
npm run start:dev

# frontend
cd frontend
npm ci
npx tsc --noEmit
npx eslint src
npm run build
npm run dev
```

**Checkpoint rápido** (todo commit): `tsc --noEmit` no app que mudou.
**Checkpoint completo** (fim de bloco): tsc + test + build nos dois apps

+ teste manual de login e do módulo afetado.
Nunca marque um item como feito sem rodar o checkpoint e colar o
resultado no `PLAN.md`.

## Regras invioláveis

+ **Tenant:** `tenantId` vem sempre do usuário autenticado (JWT, via
  `getTenantId()` no controller). Nunca do body, da query ou do slug
  `/t/:slug` da URL.
+ **Toda consulta de domínio filtra por `tenantId`.** Update/delete por
  `id` só depois de uma busca filtrada por tenant, ou com
  `updateMany`/`deleteMany` com `tenantId` no `where`.
+ **Banco:** nunca `prisma db push` fora do ambiente local. Mudança de
  schema = migration versionada (`prisma migrate dev --name ...`).
  Migrations de produção são só aditivas; remover ou renomear coluna leva
  dois deploys (expandir, depois contrair).
+ **Prisma `include`** sempre com `select`, para não vazar campos sensíveis.
+ **Arquivos:** nada servido sem autenticação. Download só por endpoint
  que confere tenant + permissão (alvo: URL assinada do R2).
+ **Segredos:** nunca em código, log ou `.env*` versionado. Só
  `.env.example` / `.env.production.example` com placeholders.
  `PII_MASTER_KEY` e `TOTP_ENCRYPTION_KEY`: se mudarem, os dados
  criptografados ficam ilegíveis. Nunca altere essas chaves.
+ **Não edite** `backend/src/generated/` (gerado pelo Prisma).
+ **Frontend:** `web-client/` não importa de `modules/`. `ColumnDef` com
  `cell` não atravessa Server→Client: cada módulo tem seu próprio
  `<Modulo>ListView.tsx` com `"use client"`.
+ **Não mude** o adapter (Express), majors de dependência ou a
  arquitetura de renderização antes da Parte 5.

## Como trabalhar

+ Um item do checklist = um branch (`p<parte>/<item>`) = commits pequenos.
+ Conventional Commits: `chore:` `fix:` `feat:` `refactor:` `test:` `docs:`.
+ Formatação em massa (prettier) sempre num commit isolado.
+ Correção de segurança ou de tenant vem com um teste que prova a correção.
+ Ao terminar um item: marque no `PLAN.md` com a evidência (comando +
  resultado). Ao fechar uma Parte: crie a tag (`v0.1-limpo`, `v0.2-verde`,
  `v0.3-seguro`, `v1.0-producao`).
+ Algo adiado vai para `docs/backlog.md` **sempre com gatilho**
  ("quando X acontecer").
+ Na dúvida entre fazer mais ou parar e perguntar: pare e pergunte.
