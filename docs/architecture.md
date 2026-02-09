# Arquitetura do Projeto

## Visao geral
- Backend: NestJS + Prisma (MySQL).
- Frontend: Next.js (App Router).
- Estrutura organizada por modulos (app) e features (shared).

## Estrutura de pastas (resumo)

### Backend
- `backend/src/core`
  - `auth`: autenticacao e estrategia JWT.
  - `prisma`: PrismaService e adapter.
  - outros utilitarios/infra.
- `backend/src/modules`
  - `people`: CRUD de pessoas e vinculos familiares.
  - `users`, `roles`, `permissions`, `tenants`.
- `backend/prisma`
  - `schema.prisma`: modelo de dados.
  - `seed.ts`: carga base (tenant/roles/users/people/vinculos).

### Frontend
- `frontend/src/app/(modules)`
  - `people`: paginas e componentes do dominio people.
  - `auth/login`: fluxo de login (fora do layout principal).
  - `auth/profile`: perfil do usuario + historico de acessos.
  - `admin/users`: administracao de usuarios.
  - `admin/roles`: perfis e permissoes.
- `frontend/src/features`
  - `people`: integracao com API de people.
  - `family-members`: feature de familia (context, data hook, UI).
  - `auth`: login, refresh, contexto de usuario/tenant.
  - `admin`: integracao de usuarios, perfis e permissoes.

## Padronizacao do frontend

### Modulo
1. Responsavel por renderizar e gerenciar os dados simples.
2. Quando necessario, chama as features que trabalham dados relacionais.

### Feature
1. Responsavel por renderizar e gerenciar seus dados relacionados ao modulo.
2. Responsavel pela renderizacao das paginas com sections, lists, tables e form.
3. Sempre usar os componentes padrao:
   - Section: `SectionCard`
   - List: `SectionList`
   - Group list: `SectionListCollapse`
   - Dialog: `SectionDialog`
   - Table: `DataTable`
   - Form: `FormEngine`

### Componentes padrao
- `SectionCard`: card padrao de secao.
- `SectionList`: lista compacta com hover actions.
- `SectionListCollapse`: lista com colapso, visual padrao de item.
- `SectionDialog`: dialog padrao com margem e scroll.
- `DataTable`: tabela com filtros/agrupamento/exportacao.
- `FormEngine`: formularios dinamicos com validacao.
- Futuro: `FeatureMenu` (menu de features do modulo).

## Modulo People (frontend)
- `people` orquestra telas e integra features.
- Feature de familia concentra toda a logica de familia:
  - `data/use-family-relations.ts`: busca/criacao/atualizacao/remocao.
  - `context/family-relations-context.tsx`: provider + hook.
  - `ui/*`: header preview, resumo, lista e dialogos.
  - Relatorios: rendas, moradia e bens (itens compartilhados e individuais).

Fluxo principal (PeopleDetail):
1. `PeopleDetailClientPage` recebe a pessoa e controla edicao.
2. `PeopleDetail` cria o contexto de familia.
3. `PeopleDetailHeader` usa preview da feature de familia.
4. Aba `familia` renderiza `FamilyRelationsSection`.

## Modulo Admin (frontend)
- `admin/users`: lista, cria e atualiza usuarios (perfis e status).
- `admin/roles`: lista perfis e permissoes vinculadas.
- Usa `DataTable` + `SectionCard` para padronizacao.

## Autenticacao e contexto do usuario
- `AuthProvider`: controla token e refresh.
- `CurrentUserProvider`: carrega usuario/tenant e permisssoes.
- Sidebar usa o tenant para header e o usuario no menu.

## Convencoes
- Pages ficam em `app/(modules)/<modulo>`.
- Logica de feature fica em `features/<feature>`.
- Componentes do modulo podem re-exportar features para manter compatibilidade.
- Nomes claros e responsabilidade unica por arquivo.

## Como adicionar uma nova feature
1. Modelagem no banco de dados (Prisma) e migracao.
2. Modulo backend (controller/service/dto).
3. Feature frontend:
   - `data/`: hooks e integracao de API.
   - `context/`: provider para estado compartilhado.
   - `ui/`: componentes.
4. Orquestracao no modulo `app/(modules)/...`.
5. Ajustar seed quando necessario.

## Testes e build
- Backend: `npm run build`.
- Frontend: `npm run build`.
