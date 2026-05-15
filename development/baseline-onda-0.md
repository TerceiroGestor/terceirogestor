# Baseline Onda 0 - People First

Data de referencia: 2026-05-13
Status: concluida e consolidada

## 1. Escopo do baseline

Este baseline cobre:

- contratos ativos do modulo `people`
- rotas e endpoints ativos no fluxo `people`
- diagnostico tecnico inicial (erros)
- riscos de ruptura para refatoracao em grande porte

## 2. Inventario de modulos (estado atual)

### Backend (`backend/src/modules`)

- people
- permissions
- registration
- roles
- tenants
- users

### Frontend (`frontend/src/modules`)

- core
- nav
- people

## 3. Contratos tecnicos validados para `people`

### Backend

- modulo: `backend/src/modules/people/people.module.ts`
- controller principal: `backend/src/modules/people/people.controller.ts`
- service principal: `backend/src/modules/people/people.service.ts`

Observacoes de contrato:

- controller protegido por `JwtAuthGuard` + `PermissionsGuard`
- permissoes declaradas por rota via `@Permissions(...)`
- total de operacoes mapeadas no controller: 76 (`Get/Post/Patch/Put/Delete`)

### Frontend

- manifest: `frontend/src/modules/people/manifest.ts`
- tabs relacionais: `frontend/src/modules/people/shared/domain/people-relation-routes.ts`
- registro de navegacao global congelado para People First em `frontend/src/modules/registry.ts`

## 4. Inventario de rotas de pagina ativas (People)

Fonte: App Router em `frontend/src/app/[tenant]/(modules)/people`

Resumo:

- listagem principal: `/people`
- criacao principal: `/people/new`
- detalhe principal: `/people/[id]`
- arvore familiar: `/people/[id]/tree`
- relacoes com rotas dedicadas para: contatos, familia, endereco, financeiro (entries/incomes/expenses/transfers), saude, medicacoes, escolaridade, reclusao, beneficios

Total de paginas `people/**/page.tsx` encontradas no app router: 29

## 5. Baseline de qualidade tecnica (diagnostico inicial)

Fonte: diagnostico por diretorio em:

- `backend/src/modules/people`
- `frontend/src/modules/people`

Resultado inicial:

- sem erros reportados no escopo `people` pelos diagnosticos coletados nesta etapa

Cobertura de testes:

- nao aferida nesta etapa inicial da Onda 0
- pendencia registrada para fechamento da Onda 0 expandida

## 6. Riscos de ruptura catalogados por severidade

### Alta

- remocao fisica de modulos congelados exige limpeza consistente de schema, bootstrap e app router
- dependencias indiretas residuais de modulos removidos podem manter imports quebrados se a exclusao nao for completa

### Media

- desalinhamento documental entre catalogo oficial e estado real do repositorio apos a remocao
- necessidade de migration destrutiva para alinhar banco ao baseline MVP

### Baixa

- ruido documental entre plano e execucao se baseline nao for atualizado a cada onda

## 7. Encerramento da Onda 0

Itens concluidos nesta onda:

- inventario e baseline do dominio `people`
- congelamento operacional inicial para proteger a onda 0
- remocao definitiva dos modulos congelados no backend, frontend e app router
- simplificacao do bootstrap para o baseline MVP sem `People First` por flag
- retirada do gate temporario de congelamento apos consolidacao da remocao

Evidencias:

- `backend/src/app.module.ts`
- `backend/prisma/schema.prisma`
- `development/checklist-congelamento-operacional-frontend.md`
- `development/checklist-congelamento-backend-ci-onda-0.md`

## 8. Criterios de aceite Onda 0 - Status

- [x] lista oficial de modulos congelados publicada (ver documento dedicado)
- [x] inventario de endpoints e paginas `people` validado
- [x] riscos de ruptura catalogados por severidade
- [x] baseline salvo em documento versionado em `development/`
- [x] congelamento operacional frontend aplicado
- [x] congelamento operacional backend aplicado
- [x] remocao definitiva dos modulos congelados concluida para consolidar o MVP

