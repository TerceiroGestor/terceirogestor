# Congelamento de Modulos - Onda 0

Data: 2026-05-13
Status: encerrado por remocao

## 1. Objetivo

Congelar temporariamente a evolucao funcional de modulos fora do foco `people` para viabilizar a consolidacao do MVP e sua remocao definitiva.

## 2. Resultado final da estrategia

O congelamento cumpriu seu papel como etapa de transicao. A decisao atual do projeto e:

- manter apenas o nucleo MVP em execucao
- remover fisicamente os modulos congelados
- alinhar frontend, backend e banco ao mesmo escopo operacional

## 3. Modulos removidos (backend)

- actions
- dashboard
- deposit
- pantry
- people-groups
- people-segments
- programs
- project-structure
- projects
- tasks

## 4. Modulos removidos (frontend)

- actions
- deposit
- onboarding
- pantry
- people-groups
- people-segments
- programs
- projects
- tasks

## 5. Modulos mantidos

Backend:

- people
- permissions
- registration
- roles
- tenants
- users

Frontend:

- core
- nav
- people

## 6. Estrategia de transicao executada

### Fase A - Congelar

- bloquear novas demandas nesses modulos
- registrar debt e gaps sem executar expansao de escopo

### Fase B - Desacoplar

- remover referencias de navegacao e bootstrap nao necessarias ao fluxo `people`
- isolar dependencias utilitarias compartilhadas

### Fase C - Remover

- excluir modulo apos validacao de impacto, limpeza de referencias e alinhamento documental

## 7. Guardrails de engenharia

- toda alteracao fora de `people` deve explicitar justificativa vinculada ao nucleo MVP
- o catalogo oficial de modulos deve permanecer alinhado entre docs e codigo
- qualquer reintroducao de modulo removido exige nova decisao arquitetural registrada

## 8. Execucao tecnica aplicada

Backend:

- congelamento operacional aplicado inicialmente no bootstrap em `backend/src/app.module.ts`
- bootstrap simplificado para manter apenas os modulos do MVP
- schema Prisma em limpeza para remover os dominios congelados

Frontend:

- navegacao e registro institucional reduzidos ao escopo `people`
- app router em limpeza para eliminar rotas de modulos removidos

CI:

- gate temporario de congelamento removido por nao fazer mais sentido apos a exclusao fisica dos modulos
