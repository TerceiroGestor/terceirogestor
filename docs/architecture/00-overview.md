# Visão geral da arquitetura

*Última revisão: 2026-11-25.*

## O que é

SaaS multi-tenant para gestão de instituições do terceiro setor (ONGs,
CRAS/CREAS, entidades de assistência social). Cada **tenant** é uma
instituição; todos os dados de domínio (pessoas, projetos, doações,
tarefas...) são isolados por tenant dentro do mesmo banco de dados
(isolamento lógico via `tenantId`, não um banco por cliente).

Contexto de negócio completo (personas, dores, módulos planejados) está
em `docs/terceiro-gestor-plano-de-desenvolvimento-modulos-atendimento-e-projetos.md`
e `docs/pesquisa-de-mercado-modulo-scfv.md` — este documento aqui é só
sobre a arquitetura técnica.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS 11 sobre Express, TypeScript |
| ORM/banco | Prisma 7 + PostgreSQL |
| Frontend | Next.js 16 (App Router), React 19 |
| UI | shadcn/ui (Radix + Tailwind), TanStack Table |
| Autenticação | JWT (access + refresh) + MFA (TOTP) própria, sem provedor externo |
| Observabilidade | Sentry (backend e frontend) |
| E-mail | Resend (SDK oficial, não SMTP genérico) |
| Deploy alvo | Railway (app) + Cloudflare (DNS/R2) — ver `06-infra-deploy.md`. Dockerfiles também compatíveis com Cloud Run/GCP (uso secundário/legado, ver `DOCKER_README.md`) |

## Estrutura de pastas (resumo — ver `AGENTS.md` para a versão oficial)

```
backend/src/core/      infraestrutura transversal (auth, tenancy, RBAC, pii, audit, files, rate-limit)
backend/src/modules/   um módulo por domínio de negócio (controller + service + dto)
backend/prisma/        schema.prisma, migrations/, seed.ts
frontend/src/web-client/  infraestrutura de UI genérica — NÃO conhece nenhum módulo de negócio
frontend/src/modules/     telas de cada módulo (api/config/features/shared)
frontend/src/features/    legado — só auth, admin e uploads continuam válidos
```

Mapeamento detalhado de cada pasta: `01-backend-core.md`,
`02-backend-modules.md`, `04-frontend-web-client.md`,
`05-frontend-modules.md`.

## O invariante mais importante do sistema: `tenantId`

Toda a segurança multi-tenant do projeto se apoia numa única regra,
reforçada em vários pontos independentes (não existe um único "guard
mágico" — é defesa em profundidade):

1. O JWT de acesso carrega `tenantId` como claim.
2. `JwtStrategy.validate()` (`backend/src/core/auth/strategies/jwt.strategy.ts`)
   rejeita (401) qualquer token sem `tenantId`, **antes** de qualquer
   controller rodar.
3. Todo controller de domínio chama `getTenantId(req.user)` (nunca lê
   `tenantId` do body, da query ou do slug `/t/:slug` da URL) para
   montar o `where` de toda consulta Prisma.
4. Update/delete por `id` só acontece depois de uma busca que já filtrou
   por `tenantId` (ou via `updateMany`/`deleteMany` com `tenantId` no
   `where` direto).
5. Existe um teste e2e dedicado (`backend/test/tenant-isolation.e2e-spec.ts`)
   que sobe a aplicação inteira contra Postgres real, cria dois tenants
   e confirma que nenhuma operação (listar/ler/editar/excluir/comentar)
   de um módulo vaza entre eles — cobre 9 módulos.
6. Um `TenancyMiddleware` resolve o slug `/t/:slug` só para rotas
   **públicas** (ex.: tela de login, antes de autenticar) — nunca para
   decidir o `tenantId` de uma operação autenticada. Se um slug da URL e
   o `tenantId` do token não baterem, a `JwtStrategy` rejeita (401).

Qualquer mudança em código de domínio que toque `tenantId` deve manter
essa cadeia intacta. Detalhe dos arquivos: `01-backend-core.md` §Tenancy.

## Fluxo de uma requisição autenticada (visão de 30.000 pés)

```
Browser (Next.js, frontend/src/web-client/data-provider/rest/*)
  → HTTP com Authorization: Bearer <access token>
  → Express (backend/src/main.ts: helmet, CORS allowlist, no-store, ValidationPipe)
  → RateLimitGuard (global, backend/src/core/rate-limit/) — por rota marcada
  → TenancyMiddleware + RequestContextMiddleware (globais, todas as rotas)
  → JwtAuthGuard (por controller, extrai + valida o token, popula req.user)
  → PermissionsGuard / decorators de RBAC (por rota, backend/src/core/authorization/)
  → Controller do módulo (backend/src/modules/<modulo>/*.controller.ts)
  → Service do módulo — chama PrismaService, sempre filtrando por tenantId
  → RequestContextInterceptor (global) — fecha o contexto da requisição, dispara auditoria se aplicável
  → Resposta JSON
  → SignUploadsInterceptor (global) — se a resposta tiver string /uploads/<categoria>/<arquivo>, reassina com URL temporária
```

Autenticação, RBAC, PII e arquivos são detalhados em `01-backend-core.md`.

## Fluxo de uma tela no frontend (visão de 30.000 pés)

```
app/[tenant]/(modules)/<rota>/page.tsx          — Server Component, resolve o módulo
  → <Modulo>ListModuleClientPage.tsx ("use client", em frontend/src/modules/<modulo>/)
      usa o registry genérico (frontend/src/web-client/registry/) a partir de um
      contrato (*-list-module-client-page.tsx / *-detail-layout-contract.tsx)
  → data-provider (frontend/src/web-client/data-provider/rest/) chama a API REST do backend
  → ListView/Table (frontend/src/web-client/ui, registry) renderiza
  → ao abrir um registro: DetailLayoutConfig (frontend/src/web-client/detail/) monta
    headSlot/detailSlot/sideSlot/relationSlot a partir do mesmo contrato do módulo
  → autosave: useDetailAutoSaveController (frontend/src/web-client/detail/)
```

Esse padrão é o **canônico** (documentado inteiro em
`docs/canonical-web-client-standard.md`) e é o que todo módulo novo deve
seguir. Duas exceções documentadas: `people` (sistema de abas interno
próprio, não usa `mainTab`/`tabTemplates` — ver `05-frontend-modules.md`)
e partes do legado em `frontend/src/features/`.

## Por onde começar numa tarefa nova

Siga `AGENTS.md`: leia `PLAN.md` primeiro para saber em qual Parte do
plano de produção o projeto está e o que é ou não escopo agora. Esta
pasta (`docs/architecture/`) ajuda a **localizar** código; não substitui
`PLAN.md`/`AGENTS.md` para decidir **se** uma tarefa deve ser feita.
