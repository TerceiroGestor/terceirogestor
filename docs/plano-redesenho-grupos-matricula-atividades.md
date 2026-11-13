# Plano — Redesenho Programa → Projeto → Atividade → Encontro

Levantamento feito em 2026-11-13, a pedido explícito do usuário, para
consolidar o modelo de grupos (`ProjectGroup` vs `PeopleGroup`), tornar a
matrícula orientada a grupo, dar ao Encontro um grupo de equipe/educadores
além do grupo participante, renomear "Ação"→"Atividade" no código (não só
na UI) e preparar relatórios em cascata (Encontro → Atividade → Projeto).
Decisões confirmadas com o usuário antes de codificar: rename no código
via `@@map` do Prisma (sem risco de migration de dado) e execução em fases
sequenciais, mesmo padrão de `docs/plano-implementacao-scfv.md`.

Este documento substitui, para este recorte, o plano anterior
`docs/plano-reestruturacao-programas-projetos-atividades.md` (mantido
como referência histórica).

## Ordem de dependência

```
Fase R1 (eliminar ProjectGroup) ──┬─→ Fase R2 (matrícula por grupo)
                                   └─→ Fase R3 (Encontro + grupo de equipe)
                                              │
                                              ↓
                                   Fase R4 (rename Ação→Atividade no código)
                                              │
                                              ↓
                                   Fase R5 (relatórios em cascata)
```

---

## Fase R1 — Eliminar `ProjectGroup` (consolidar em `PeopleGroup`)

**Objetivo:** hoje existem dois conceitos de "grupo" — `ProjectGroup`
(ad-hoc, só nome, por projeto) e `PeopleGroup` (tenant-wide, ligado a
pessoas reais via `PeopleGroupParticipation`, já com `purpose:
PUBLICO|EQUIPE`). Eliminar o primeiro em favor do segundo, usado em todo
lugar (projeto, atividade, encontro).

### Schema
- Remover `model ProjectGroup` e `model ProjectEnrollmentGroupMembership`.
- Remover `PROJECT_GROUP` do enum `ActionTarget` (fica
  `PROJECT | PEOPLE_GROUP | ENROLLMENT`).
- Remover `ProjectAction.groupId`/relação `group`.
- Sem dado de produção a preservar (confirmado nesta sessão) — migration
  só de remoção, sem backfill.

### Backend
- `backend/src/modules/project-structure/project-structure.service.ts` e
  `.controller.ts`: remover CRUD de `ProjectGroup`
  (`listGroups`/`createGroup`/`updateGroup`/`deleteGroup`) e o fluxo de
  `ProjectEnrollmentGroupMembership` (`addEnrollmentGroup` e afins).
- `backend/src/modules/actions/actions.service.ts`: remover o branch
  `PROJECT_GROUP` de `resolveScopeFromTarget`, `ensureProjectGroupBelongsToProject`
  e a validação de criar/editar Atividade que exige `groupId` para esse
  target; `listProjectActionAttendances` perde `scopedGroupId` (só
  `scopedPeopleGroupId` resta).
- DTOs `create/update-project-action.dto.ts`: remover `projectGroupId`.

### Frontend
- Remover a tela/picker de `ProjectGroup` (CRUD próprio) e a opção
  `PROJECT_GROUP` do seletor de `target` nos formulários de `ActionType`/
  Atividade.
- Confirmar que nada mais referencia `projectGroupId`/`ProjectGroup` nos
  tipos de `src/modules/actions/api/types.ts` e `src/modules/projects/api/`.

### Plano de teste
1. `npx prisma migrate dev` (remoção) → `npx tsc --noEmit` nos dois apps
   → 0 erros.
2. `npm test` (backend) sem regressão.
3. Teste manual: criar Atividade com target `PEOPLE_GROUP`/`ENROLLMENT`
   (os dois que restam) → confirma que não sobrou nenhuma referência a
   `ProjectGroup` na UI.

### Status: concluída (2026-11-13)

- **Schema/migration:** `backend/prisma/migrations/
  20261113170301_remove_project_group/migration.sql` — drop de
  `ProjectGroup`/`ProjectEnrollmentGroupMembership`, `ActionTarget` sem
  `PROJECT_GROUP`, `ProjectAction` sem `groupId`. Achado antes de aplicar:
  1 linha de seed com `target='PROJECT_GROUP'` no `ActionType` já
  existente no banco dev — corrigida via `UPDATE` direto antes da
  migration (e também em `prisma/seed.ts`, para não voltar no próximo
  `db:seed`). Sem produção ainda (confirmado com o usuário), então
  migration única de remoção, sem expand/contract.
- **Backend:** `project-structure.service/controller.ts` perderam o CRUD
  de `ProjectGroup` (`listGroups`/`createGroup`/`updateGroup`/
  `deleteGroup`/`addEnrollmentToGroup`/`removeEnrollmentFromGroup`) e os
  4 arquivos só usados por eles (2 DTOs + o controller de catálogo,
  removidos via `git rm`); `actions.service.ts` perdeu o branch
  `PROJECT_GROUP` de `resolveScopeFromTarget`,
  `ensureProjectGroupBelongsToProject`, e `scopedGroupId` de
  `listProjectActionAttendances` (só `scopedPeopleGroupId` resta);
  `projects.service.ts#deleteProject` não checa mais `projectGroup.count`.
  **Evidência:** `tsc --noEmit -p tsconfig.build.json` → 0 erros; `npm
  test` → 28 suítes, 143 testes, sem regressão; grep final em `src/` e
  `test/` por `ProjectGroup|projectGroupId|PROJECT_GROUP` → só 1 falso
  positivo (`ProjectGroupByArgs`, API de `groupBy()` do Prisma, não
  relacionado ao model removido).
- **Frontend:** removido o módulo standalone de `ProjectGroup` (4 rotas +
  7 arquivos de módulo/componente + 1 data-provider, via `git rm`), os 4
  exports em `modules/projects/index.ts`, as 4 window actions e a search
  view em `web-client/registry/`, e as referências remanescentes em
  `actions.constants.ts`, `action-types.ts`, `project-actions.ts`,
  `actions-module-contract.tsx`, `action-create-form-section.tsx` (+
  `action-create.constants.ts`), `actions-list-module-client-page.tsx`,
  `action-report-preview.tsx`, `actions-detail-layout-contract.tsx`,
  `projects-detail-layout-contract.tsx` (removeu a tab "Grupos de
  Participantes" inteira, que duplicava a tab "Grupos de Pessoas" já
  baseada em `PeopleGroup`), `rest/actions.ts`, `rest/provider.ts`,
  `searchViews/actions.ts`, `module-standard-smoke.ts` e
  `audit/domain/labels.ts`. `tsc --noEmit` revelou mais 7 arquivos com
  `enrollment.groups`/`row.groups` órfãos (campo renomeado para
  `peopleGroups` na Fase R1 do schema, não pego pelo grep por não conter
  a string "ProjectGroup") — corrigidos para `peopleGroups`, e um
  componente inteiro (`project-enrollment-picker-dialog.tsx`) que não
  tinha nenhum consumidor, removido via `git rm`.
  **Evidência:** `tsc --noEmit` → 0 erros; `eslint src` → 211 problemas,
  baseline pré-R1 (via `git stash`) → 217 — net -6, nenhuma categoria
  nova; `npm run build` → sucesso, sem warnings, rota
  `/[tenant]/projects/[id]/groups` confirmada ausente da listagem final
  de rotas.
- **Teste manual real:** não executado ainda nesta fase (dev servers não
  foram subidos) — pendente antes do commit, ou a registrar como
  "testado via tsc/build apenas" se o usuário preferir seguir para a
  próxima fase sem subir os servidores agora.

---

## Fase R2 — Matrícula por grupo

**Objetivo:** hoje matricular (`ProjectEnrollment`) é estritamente
pessoa-por-pessoa. Adicionar um atalho de matricular/revisar todos os
membros de um `PeopleGroup` de uma vez — a "matrícula por grupo" e a
"revisão anual" descritas pelo usuário.

### Backend
- Novo endpoint em `project-structure` (ex.:
  `POST /:projectId/people-groups/:peopleGroupId/sync-enrollments`):
  calcula o diff entre `PeopleGroupParticipation` ativas do grupo e
  `ProjectEnrollment` já existentes nesse projeto para essas pessoas →
  cria as que faltam (herdando `role`/`participationKind` do
  `ProjectPeopleGroup` que liga o grupo ao projeto) → encerra
  (`status=ENDED`) as de pessoas que já não estão mais no grupo. Devolve
  um resumo (`{ enrolled: [...], ended: [...] }`) em vez de aplicar
  silenciosamente — é uma ação explícita do usuário, não automática.
- Reaproveitar `createEnrollment` existente
  (`project-structure.service.ts:847-919`) para a parte de criação, sem
  duplicar a lógica de validação.

### Frontend
- Na tab "Grupos de Pessoas" do detalhe do Projeto (onde já existe
  `ProjectPeopleGroupPickerDialog`), adicionar ação "Matricular/revisar
  membros" por grupo, mostrando o resumo do diff antes de confirmar.

### Plano de teste
1. `tsc` + `npm test`.
2. Teste de serviço: grupo com 3 pessoas, 1 já matriculada, 1 nova, 1 que
   saiu do grupo mas continua com matrícula ativa → confirma que o sync
   cria 1, encerra 1, mantém 1.
3. Teste manual: criar grupo, matricular pessoas no grupo, rodar o sync
   no projeto → confirma matrícula criada; remover uma pessoa do grupo →
   rodar de novo → confirma matrícula encerrada.

---

## Fase R3 — Encontro com grupo participante + grupo(s) de equipe

**Objetivo:** hoje o Encontro só tem `peopleGroupId` (o grupo que
participa). Adicionar grupo(s) de equipe/educadores responsáveis por
aquele encontro específico.

### Schema
- Nova tabela `ActionOccurrenceTeamGroup` (`tenantId`, `occurrenceId`,
  `peopleGroupId`), mesma forma de `ActionPeopleGroup` mas no nível do
  Encontro — N grupos de equipe por encontro.

### Backend
- DTOs de criar/editar `ActionOccurrence` ganham `teamPeopleGroupIds?:
  string[]`.
- Validação igual à já existente para `peopleGroupId`
  (`ensurePeopleGroupBelongsToAction`): cada grupo de equipe precisa estar
  entre os `ActionPeopleGroup` com `participationKind: TEAM` já vinculados
  à Atividade.

### Frontend
- `action-occurrences-section.tsx` → `EditOccurrenceDialog` ganha um
  segundo campo (multi-select) "Educadores/Equipe", carregado com
  `listActionPeopleGroups(..., { participationKind: "TEAM" })` — mesmo
  padrão já usado para o campo de grupo participante.

### Plano de teste
1. `tsc` + `npm test`.
2. Teste de serviço: grupo de equipe que não pertence à Atividade → 400;
   grupo de equipe válido → aceito e devolvido no GET do encontro.
3. Teste manual: agendar encontro com 1 grupo participante + 2 grupos de
   equipe → confirma os 3 aparecem corretos na edição.

---

## Fase R4 — Rename "Ação" → "Atividade" no código (`@@map`, zero risco de dado)

**Objetivo:** o rename visual (Fase 4 do SCFV) já estava planejado; agora
o código interno também passa a usar "Activity" em vez de "Action", via
`@@map`/`@map` do Prisma — a tabela física no Postgres não muda de nome,
só o nome que o Prisma Client e o TypeScript usam.

### Schema
```prisma
model Activity { ... }               @@map("ProjectAction")
model ActivityType { ... }           @@map("ActionType")
model ActivityOccurrence { ... }     @@map("ActionOccurrence")
model ActivityAttendance { ... }     @@map("ProjectActionAttendance")
model ActivityPeopleGroup { ... }    @@map("ActionPeopleGroup")
```
Feito por último de propósito: é refactor mecânico de nome, sem mudança
de comportamento — mais seguro depois que R1-R3 já estabilizaram o
modelo (menos coisa para renomear duas vezes).

### Backend
- `backend/src/modules/actions/**` → avaliar mover para
  `backend/src/modules/activities/**` (rotas HTTP continuam `/actions`,
  só o código interno muda de nome/pasta).
- Find-and-replace disciplinado de `ProjectAction`/`ActionType`/
  `ActionOccurrence`/`ProjectActionAttendance`/`ActionPeopleGroup` em
  todo o backend, incluindo os consumidores fora do módulo
  (`dashboard.service.ts`, `project-structure.service.ts`).
  `tsc --noEmit` é a rede de segurança — qualquer referência esquecida
  não compila.

### Frontend
- Mesma troca nos tipos (`ApiProjectAction`→`ApiActivity` etc.) e nos
  textos visíveis em toda a UI (absorve a Fase 4 original do SCFV).
  Rotas (`/actions`) continuam iguais de propósito, para não quebrar
  link salvo/favorito — só o nome interno do código muda.

### Plano de teste
1. `tsc --noEmit` nos dois apps → 0 erros (principal rede de segurança
   desse refactor).
2. `npm test` + `npm run build` sem regressão.
3. Teste manual: navegar por todas as telas do módulo, confirmar que não
   sobrou nenhum "Ação"/"Ações" visível fora do contexto correto.

---

## Fase R5 — Relatórios em cascata (Encontro → Atividade → Projeto)

**Objetivo:** Encontro gera relatório diário; Atividade agrega os
Encontros do mês; Projeto agrega as Atividades do mês/ano.

### Backend
- Estender o padrão de agregação já usado no relatório por 1 Encontro
  (`action-report-preview.tsx`, hoje consumindo
  `listProjectActionAttendances` por `occurrenceId`) para aceitar um
  período (mês) e agregar N Encontros de uma Atividade.
- Endpoint novo em `projects`/`programs`, reaproveitando
  `listMonthKeys`/`toMonthKey` (`dashboard.service.ts:53-70`) para
  relatório mensal e anual do Projeto (presença, Encontros
  realizados/agendados, destaques/qualidade).

### Frontend
- Tab "Relatório" da Atividade ganha seletor de período (hoje é só 1
  Encontro).
- Tab nova "Relatório" no Projeto usando `GroupedListView.tsx` (hoje sem
  nenhum consumidor no projeto) agrupando presença por
  Atividade/Encontro.

### Fora de escopo nesta rodada
- Avaliação mensal por atendido (mencionada como "talvez" pelo usuário):
  registrar em `docs/backlog.md` com gatilho, não implementar agora.

### Plano de teste
1. `tsc` + `npm test`.
2. Teste manual: comparar o número mostrado no relatório mensal/anual com
   uma contagem manual no banco, para pelo menos 1 Atividade e 1 Projeto.
