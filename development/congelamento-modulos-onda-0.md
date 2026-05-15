# Congelamento de Modulos - Onda 0

Data: 2026-05-13
Status: ativo

## 1. Objetivo

Congelar evolucao funcional de modulos fora do foco `people` para reduzir dispersao, preservar estabilidade e permitir refatoracao controlada.

## 2. Regra de congelamento

Enquanto o programa `People First` estiver ativo:

- nao iniciar novas features em modulos fora de `people`
- nao executar refatoracao ampla fora de `people`
- correcoes fora de `people` apenas se bloquearem operacao de `people` ou seguranca/compliance

## 3. Modulos congelados (backend)

- actions
- dashboard
- deposit
- pantry
- people-groups
- people-segments
- permissions
- programs
- project-structure
- projects
- registration
- roles
- tasks
- tenants
- users

Excecao:

- `permissions`, `registration`, `roles`, `tenants`, `users` podem receber ajustes minimos estritamente necessarios para seguranca/autenticacao/autorizacao do fluxo `people`.

## 4. Modulos congelados (frontend)

- actions
- core (exceto o que impacta autenticacao/seguranca)
- deposit
- nav (exceto ajustes de ocultacao/control-plane)
- onboarding
- pantry
- people-groups
- people-segments
- programs
- projects
- tasks

## 5. Estrategia de transicao

### Fase A - Congelar

- bloquear novas demandas nesses modulos
- registrar debt e gaps sem executar expansao de escopo

### Fase B - Desacoplar

- remover referencias de navegacao e bootstrap nao necessarias ao fluxo `people`
- isolar dependencias utilitarias compartilhadas

### Fase C - Remover

- excluir modulo apenas apos validacao de impacto e checklist de ruptura

## 6. Guardrails de engenharia

- toda alteracao fora de `people` deve explicitar justificativa vinculada a seguranca, tenancy ou compliance
- PR sem justificativa valida fora do escopo deve ser reprovado
- qualquer ajuste fora de `people` deve ser o menor patch possivel

## 7. Execucao tecnica aplicada

Backend:

- congelamento operacional aplicado no bootstrap em `backend/src/app.module.ts`
- modulos congelados ficam desativados quando `PEOPLE_FIRST_MODE=true` (padrao)
- rollback controlado disponivel com `PEOPLE_FIRST_MODE=false`

CI:

- gate automatizado publicado em `.github/workflows/frozen-modules-gate.yml`
- checagem de paths congelados publicada em `.github/scripts/check-frozen-modules.js`
- PR/push com alteracao em modulo congelado passa a falhar automaticamente
