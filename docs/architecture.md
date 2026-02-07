# Arquitetura do Projeto

## Visão geral
- Backend: NestJS + Prisma (MySQL).
- Frontend: Next.js (App Router).
- Estrutura organizada por módulos (app) e features (shared).

## Estrutura de pastas (resumo)

### Backend
- `backend/src/core`
  - `auth`: autenticação e estratégia JWT.
  - `prisma`: PrismaService e adapter.
  - outros utilitários/infra.
- `backend/src/modules`
  - `people`: CRUD de pessoas e vínculos familiares.
  - `users`, `roles`, `permissions`, `tenants`.
- `backend/prisma`
  - `schema.prisma`: modelo de dados.
  - `seed.ts`: carga base (tenant/roles/users/people/vínculos).

### Frontend
- `frontend/src/app/(modules)`
  - `people`: páginas e componentes do domínio people.
  - `auth/login`: fluxo de login (fora do layout principal).
- `frontend/src/features`
  - `people`: integração com API de people.
  - `family-members`: feature de família (context, data hook, UI).

## Módulo People (frontend)
- `people` orquestra telas e integra features.
- Feature de família concentra toda a lógica de família:
  - `data/use-family-relations.ts`: busca/criação/atualização/remoção.
  - `context/family-relations-context.tsx`: provider + hook.
  - `ui/*`: header preview, resumo, lista e diálogos.
  - Relatórios: rendas, moradia e bens (itens compartilhados e individuais).

Fluxo principal (PeopleDetail):
1. `PeopleDetailClientPage` recebe a pessoa e controla edição.
2. `PeopleDetail` cria o contexto de família.
3. `PeopleDetailHeader` usa preview da feature de família.
4. Aba `família` renderiza `FamilyRelationsSection`.

## Convenções
- Pages ficam em `app/(modules)/<modulo>`.
- Lógica de feature fica em `features/<feature>`.
- Componentes do modulo podem re-exportar features para manter compatibilidade.
- Nomes claros e responsabilidade única por arquivo.

## Como adicionar uma nova feature
1. Modelagem no banco de dados (Prisma) e migração.
2. Módulo backend (controller/service/dto).
3. Feature frontend:
   - `data/`: hooks e integração de API.
   - `context/`: provider para estado compartilhado.
   - `ui/`: componentes.
4. Orquestração no módulo `app/(modules)/...`.
5. Ajustar seed quando necessário.

## Testes e build
- Backend: `npm run build`.
- Frontend: `npm run build`.

