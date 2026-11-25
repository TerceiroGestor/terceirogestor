# Backend — módulos de domínio (`backend/src/modules/`)

*Última revisão: 2026-11-25. Escopo: `backend/src/modules/*`. Pré-requisito:
`01-backend-core.md` (todo controller aqui usa
`@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@Permissions('...')` e
escopa por `user.tenantId`).*

## Tabela de referência rápida — "achei um bug, onde eu olho?"

| Sintoma | Comece em |
|---|---|
| Programa/Projeto: campos básicos, comentário, anexo | `programs/`, `projects/` |
| Matrícula com status errado, "já matriculado", sincronia de Grupo | `project-structure/project-structure.service.ts` (`syncPeopleGroupEnrollments`, `ensureNoActiveEnrollment`) |
| Atividade: CRUD, escopo/`target` | `actions/actions.service.ts` (`resolveScopeFromTarget`, `syncParticipantPeopleGroupScope`) |
| Encontro: agendamento/criação em lote | `actions/actions.service.ts` (`bulkCreateActionOccurrences`) + `action-occurrence-schedule.ts` |
| Membro de Grupo não aparece como participante da Atividade/Encontro | `actions/actions.service.ts#fanOutGroupToDirectParticipants` / `#fanOutGroupsToMeetingAttendance` |
| "Responsável"/equipe não propaga Encontro→Atividade→Projeto | `actions/actions.service.ts#ensurePersonOnActivityTeam` / `#ensurePersonOnProjectTeam` |
| Chamada/presença (`MeetingAttendance`), contagem de presença diária errada | `actions/actions.service.ts` (`upsertProjectActionAttendances`, `syncDailyAttendanceForPersonDate`) |
| Status de Ocorrência (incidente) | `occurrences/occurrence-status.ts` |
| Status de Atendimento (sessão de trabalho social) | `attendances/attendance-status.ts` |
| Prontuário de Pessoa (saúde, renda, educação, família, documentos) | `people/people.service.ts` + `people.filters.ts` (checar `core/pii` se for documento sensível) |
| Membro de Grupo não alimenta matrícula/presença | `people-groups/people-groups.service.ts` |
| Estoque geral vs. despensa de alimentos | `deposit/` vs `pantry/` (estruturalmente idênticos — confirmar qual domínio o relato descreve) |
| Chave de permissão faltando/não aplicada | `permissions/core-permissions.ts` + `required-permissions.ts` |
| Papel/usuário/admin de tenant | `roles/`, `users/`, `tenants/`, `registration/` |
| Tarefas internas da equipe | `tasks/` (models com prefixo `TaskOrganizer*`) |
| Números do dashboard | `dashboard/dashboard.service.ts` |

## Hierarquia central (modelo SCFV) e uma armadilha de nomenclatura

```
Program → Project → (project-structure: matrícula/grupos/equipe/metas/financiamento)
        → Activity ("Atividade") → Meeting ("Encontro", ocorrência de uma Atividade)
        → MeetingAttendance (presença por Encontro) → DailyAttendance (dedup por dia)
```

Um vertical **separado e sem relação direta** reaproveita vocabulário
parecido para gestão de casos:

```
Occurrence (caso "Ocorrência") → Attendance (caso "Atendimento", estilo PAIF/PAEFI)
```

**Não confundir** `Meeting` (Encontro de uma Atividade) com `Occurrence`
(registro de trabalho social) — são models independentes em módulos
diferentes que coincidem no nome em português/inglês. Da mesma forma,
`AttendanceStatus` (presença no Encontro: PRESENT/ABSENT/EXCUSED) não é
`AttendanceCaseStatus` (status do módulo Atendimento: ABERTO/ENCERRADO) —
ver `03-database.md` para a tabela completa dessas colisões de nome.

## programs

**Negócio:** Programa guarda-chuva (SCFV, PAIF, PAEFI, Cultural,
Qualificação, Outro) sob o qual Projetos rodam.

- `programs.controller.ts` — CRUD + comentários + anexos sob `/programs`.
- `programs.service.ts` — CRUD, busca textual (nome/descrição/tags/tipo/
  status), sub-recursos de comentário/anexo (resolve `@mention`), bloqueia
  exclusão se existir `Project` filho.

**Models:** `Program`, `ProgramComment`, `ProgramAttachment`.

**Gotcha:** busca por tipo/status usa mapas de tokens escritos à mão
(`PROGRAM_TYPE_SEARCH_MAP`, `PROGRAM_STATUS_SEARCH_MAP`) pra sinônimos
PT/EN — fácil esquecer de atualizar ao adicionar um valor de enum novo.

## projects

**Negócio:** uma iniciativa concreta sob um Programa (ex.: "SCFV 2026 -
Unidade Centro"), com período/status próprio.

- `projects.controller.ts` / `projects.service.ts` — mesmo padrão CRUD/
  comentário/anexo de `programs`; busca também casa com
  `program.name`/`program.type` do pai. Exclusão bloqueada se existir
  `ProjectEnrollment`.

**Models:** `Project`, `ProjectComment`, `ProjectAttachment`.

**Relações:** filho de `programs`; pai de `project-structure` (matrícula,
metas, financiamento, equipe, grupos) e de `actions`
(`Activity.projectId`).

## project-structure

**Negócio:** tudo que define "quem/o que pertence estruturalmente a um
Projeto" — matrícula de participante/equipe (`ProjectEnrollment`),
vínculo Grupo↔Projeto (`ProjectPeopleGroup`), alocação individual de
equipe (`ProjectTeamParticipation`), fontes de financiamento e metas. É
a camada de matrícula/agrupamento entre Projeto e Atividade.

- `project-structure.controller.ts` — rotas aninhadas
  `/projects/:projectId/...` (people-groups, funding-sources, goals,
  team-participations, enrollments, eligible-people,
  `people-groups/:id/sync-enrollments`).
- `project-structure.service.ts` — o arquivo grande do módulo.
  Métodos-chave: `createEnrollment`/`updateEnrollment`/`deleteEnrollment`
  (garante só 1 matrícula ATIVA por pessoa por projeto via
  `ensureNoActiveEnrollment`), `listEligiblePeople` (pessoas dos Grupos
  do projeto ainda não matriculadas), `syncPeopleGroupEnrollments`
  (reconciliação em lote: matricula quem entrou no Grupo, encerra quem
  saiu), `createTeamParticipation`/`endTeamParticipation`.

**Models:** `ProjectEnrollment`, `ProjectPeopleGroup`,
`ProjectTeamParticipation`, `ProjectFundingSource`, `Goal`.

**Relações:**
- Lê `PeopleGroup`/`PeopleGroupParticipation` de `people-groups`
  (reaproveita `buildPeopleWhere`/`parseAdvancedFilters` de
  `people/people.filters.ts`).
- Alimenta `actions`: `Activity.goalId` → `Goal`; os `peopleGroupIds` de
  uma Atividade precisam já estar vinculados aqui
  (`ensurePeopleGroupBelongsToProject`, verificado em
  `actions.service.ts` contra as linhas de `ProjectPeopleGroup` criadas
  aqui); `ProjectTeamParticipation` é o espelho em nível de projeto que
  `actions.service.ts#ensurePersonOnProjectTeam` escreve quando um
  responsável de Encontro é adicionado.
- `deleteGoal`/`deletePeopleGroup` são bloqueados se `actions` tiver
  `Activity`/`ActivityPeopleGroup` vinculados.

**Gotcha:** comentário explícito no código (~linha 334-340) marca isso
como parte da "revisão da hierarquia de equipe (2026-11-21)" — mesmo
padrão de `ActionsService#ensurePersonOnProjectTeam/#ensurePersonOnActivityTeam`:
cadastro direto de equipe aqui continua funcionando independente da
cascata automática disparada por Encontros. `syncPeopleGroupEnrollments`
faz diff+transação (matricular/encerrar) — atenção a race condition se
chamado concorrentemente pro mesmo Grupo.

## actions

**Negócio:** "Atividade" é a unidade de trabalho recorrente dentro de um
Projeto (ex.: uma oficina semanal); cada Atividade gera "Encontros" —
sessões concretas com data/hora — que por sua vez carregam presença.
**Maior e mais alterado módulo do sistema** (service com ~3573 linhas).

- `action-types.controller.ts` — CRUD de `ActivityType` (`/action-types`).
- `actions-list.controller.ts` — `/actions` (lista geral do tenant) +
  `/actions/attendance-summary/:personId` (comparação mensal de
  presenças PRESENT vs. presença diária).
- `project-actions.controller.ts` — `/projects/:projectId/actions/...`
  (CRUD, comentários, anexos, grupos, encontros/`occurrences`, criação
  em lote de encontros, participações de equipe do encontro, presenças).
- `actions.service.ts` — toda a lógica de negócio dos itens acima
  (arquivo enorme, ver "áreas delicadas" abaixo).
- `action-occurrence-schedule.ts` (+ `.spec.ts`) — função pura
  `generateOccurrenceDates`, materializa datas de recorrência semanal
  pra criação em lote de Encontros.

**Models:** `ActivityType`, `Activity`, `ActivityPeopleGroup`,
`ProjectActionComment`, `ProjectActionAttachment`,
`ProjectActionPeopleParticipation`, `Meeting`,
`ActionOccurrenceTeamGroup`, `ActionOccurrencePeopleGroup`,
`MeetingAttendance`, `MeetingTeamParticipation`, `DailyAttendance`
(escreve, não é dono).

**Relações:** depende de `project-structure` (valida matrícula/grupos/
metas escopados ao projeto), de `people-groups`
(`PeopleGroupParticipation`, pro fan-out), lê `people`
(`Person.personType` escolhe papel/tipo de matrícula padrão).
`permissions`: `hasPermission(..., 'actions.manage')` decide se o
usuário vê só suas próprias Atividades criadas ou todas.

**Áreas delicadas / revisão recente** (comentários explícitos no código
citam "2026-11-24"/"2026-11-21"/"Fase 3 do plano mestre"):

1. `fanOutGroupToDirectParticipants` (~linha 731) — adicionar um
   `PeopleGroup` a uma Atividade ou Encontro é "um atalho": materializa
   uma linha direta de `ProjectActionPeopleParticipation` (Atividade) ou
   `MeetingAttendance` (Encontro) por membro ativo do grupo, criando
   `ProjectEnrollment` automaticamente via mapa
   `PERSON_TYPE_TO_ENROLLMENT_ROLE` se a pessoa não tiver nenhuma.
   **Remover o grupo depois NÃO remove esses vínculos diretos** — a
   participação direta fica independente da origem depois de criada.
2. `syncParticipantPeopleGroupScope` — só faz fan-out dos `peopleGroupIds`
   **novos** (diff contra `previousPeopleGroupIds`), nunca na remoção;
   só deve ser chamado depois de validar `peopleGroupIds`, senão
   Atividades ficam órfãs.
3. `ensurePersonOnActivityTeam` / `ensurePersonOnProjectTeam`
   (~linha 2780-2845) — adicionar um "responsável" (participante de
   equipe) a um Encontro cascateia automaticamente pra
   `ProjectActionPeopleParticipation` (Atividade) e
   `ProjectTeamParticipation` (Projeto). Cascata só aditiva (nunca
   remove automaticamente ao excluir o Encontro — ver comentário
   ~linha 2300).
4. `syncDailyAttendanceForPersonDate`/`syncDailyAttendanceForPeopleDate`
   ("Fase 3 do plano mestre") — reavalia `DailyAttendance` do zero (não
   incremental) a cada escrita/exclusão de `MeetingAttendance`, então uma
   pessoa presente em 2 Encontros no mesmo dia só conta uma vez pra
   "dias com presença".
5. `deleteProjectAction` — só soft-delete, e só permitido quando
   `status === 'INACTIVE'`; comentário explica que evita problema de
   cascata `RESTRICT` de FK com filhos (Encontros etc.) em vez de
   exclusão física.
6. `deleteActionOccurrence` apaga filhos manualmente, na ordem certa pra
   não violar FK `RESTRICT` (`MeetingAttendance`,
   `ActionOccurrenceTeamGroup`, `ActionOccurrencePeopleGroup`,
   `MeetingTeamParticipation`) antes do próprio `Meeting` — não há
   cascade configurado no banco.
7. `resolveScopeFromTarget` — `Activity.target`/`targetEnrollmentId`
   (ENROLLMENT vs. PEOPLE_GROUP vs. PROJECT) é legado; comentário afirma
   que Grupos não são mais exclusivos de `target === 'PEOPLE_GROUP'` —
   qualquer Atividade pode ter Grupos agora, campo mantido sem migration
   de remoção.
8. `MAX_BULK_OCCURRENCES = 200` — limite de Encontros criados em lote.

## occurrences

**Negócio:** "Ocorrência" de gestão de caso — um incidente/registro de
trabalho social, opcionalmente ligado a um `Meeting` (ex.: algo notável
que aconteceu num Encontro), que pode escalar pra um `Attendance`
formal.

- `occurrences.controller.ts` — CRUD + adicionar/remover pessoas
  vinculadas (`/occurrences/:id/people`).
- `occurrences.service.ts` — CRUD, `buildOccurrenceWhere`, aplicação das
  regras de transição de status.
- `occurrence-status.ts` — `assertOccurrenceStatusTransition` (só avança:
  REGISTRADA → EM_ANALISE → DESFECHO_DEFINIDO, nunca volta) e
  `assertOutcomeNotesRequiredForClosing`.

**Models:** `Occurrence` + tabela de junção de pessoas.

**Relações:** referencia opcionalmente `Meeting` (de `actions`,
`meetingId`); é referenciado opcionalmente por `attendances`
(`Attendance.occurrenceId`).

**Gotcha:** ciclo de vida "Fase 5" é monotônico/só avança — diferente do
ciclo reabrível de `attendances` (abaixo). Não copiar a guarda de
transição de um módulo pro outro.

## attendances

**Negócio:** "Atendimento" formal de trabalho social (sessão de caso,
estilo PAIF/PAEFI), feito por um `professional` (uma `Person`), com
evoluções (notas de progresso) e benefícios concedidos, opcionalmente
originado de uma `Occurrence`.

- `attendances.controller.ts` — CRUD + sub-recursos de pessoas,
  evoluções, benefícios.
- `attendances.service.ts` — CRUD + `buildAttendanceWhere`.
- `attendance-status.ts` — `assertClosingNotesRequiredForClosing`;
  comentário explícito: diferente de Occurrence, esse ciclo de vida
  ("Fase 6") **pode ser reaberto** depois de encerrado (ENCERRADO) —
  "prontuário técnico real tem esse fluxo" — não assumir avanço único
  aqui.

**Models:** `Attendance` + evoluções, benefícios, tabelas de junção de
pessoas.

**Relações:** `professionalId` → `people` (`Person`); `occurrenceId` →
`occurrences`.

**Armadilha de nome importante:** isto NÃO é o mesmo que
`MeetingAttendance` do módulo `actions`. "Atendimento" aqui = sessão de
trabalho de caso; "Attendance"/presença em `actions`/`MeetingAttendance`
= chamada/presença num Encontro. Mesma palavra em inglês, dois models
diferentes.

## people

**Negócio:** o registro central de toda pessoa física do tenant —
atendidos, familiares, equipe, voluntários, doadores, parceiros
(`PERSON_TYPE_OPTIONS`) — mais o prontuário completo social/saúde/
financeiro e dados de família (domicílio). **Maior módulo** (service de
~4200 linhas, controller de ~992 linhas, ~45 DTOs).

- `people.controller.ts` — `/people` CRUD + ~30 grupos de sub-recurso:
  contatos, rendas, despesas, lançamentos financeiros, condições de
  saúde, medicações, educação, benefícios, detenções, transferências
  (domicílio), patrimônio do domicílio/pessoa, perfil do domicílio,
  resumo de renda familiar, resumo familiar, relações/árvore de
  relações, identidade, documentos sensíveis, e um endpoint
  **polimórfico genérico**
  `/:id/records/:recordType/:recordId/{metadata,comments,attachments}`.
- `people.service.ts` — toda a lógica; usa `PiiCryptoService`
  (criptografa documentos sensíveis), `CepService`, `RequestContextService`.
- `people.filters.ts` (+ `.spec.ts`) — `buildPeopleWhere`,
  `parseAdvancedFilters`, `buildPeopleOrderBy`,
  `extractBirthdayMonthFilter`, `NOT_EXCLUDED_PERSON_FILTER` —
  reaproveitado por `project-structure` e `actions` pra consultas de
  pessoas elegíveis.
- `people.constants.ts` — listas de opção tipo-enum
  (`SEX_OPTIONS`, `STATUS_OPTIONS`, `PERSON_TYPE_OPTIONS`) e
  `EXCLUDED_PERSON_STATUS = 'Excluido'` — status de soft-delete mantido
  de propósito fora de `STATUS_OPTIONS` (validado por DTO) pra só o
  fluxo interno `remove()` poder setá-lo.

**Models:** `Person` (central) + muitas tabelas filhas para
`PEOPLE_RECORD_TYPES = ['education','health-condition','medication',
'detention','financial-entry','family-relation']`, models de domicílio
(patrimônio, transferências, resumo de renda), contatos, comentários/
anexos (tanto nível-pessoa quanto genérico por sub-registro).

**Relações:** consumido pesadamente por `project-structure`, `actions`,
`people-groups` (membresia), `attendances` (`professionalId`), vínculos
de pessoa de `occurrences`/`attendances`, `dashboard`.
`Person.personType` dirige o mapeamento de papel padrão em
`actions.service.ts#PERSON_TYPE_TO_ENROLLMENT_ROLE`.

**Gotcha:** os endpoints genéricos `records/:recordType/:recordId/
comments|attachments` validam `recordType` em runtime contra
`PEOPLE_RECORD_TYPES` (`assertRecordBelongsToPerson`) — adicionar um
novo tipo de sub-registro exige atualizar esse array e o mapeamento
correspondente, fácil de esquecer. Criptografia PII (documentos
sensíveis) é transversal via `core/pii` — bugs lá não aparecem como erro
de Prisma comum.

## people-groups

**Negócio:** "Grupos" — coortes reutilizáveis de pessoas, seja
segmentos de público (`groupType: SEGMENT`, ex.: "Crianças 6-12") seja
pools de equipe (`groupType: TEAM_POOL`), usados como atalho pra
vincular pessoas em lote a Projetos/Atividades/Encontros em vez de
matricular uma a uma.

- `people-groups.controller.ts` — CRUD, anexos,
  `/:id/participations` (adicionar/listar/encerrar membresia).
- `people-groups.service.ts` — CRUD + ciclo de vida de membresia
  (`createPeopleGroupParticipation`/`endPeopleGroupParticipation`),
  validação de faixa etária.

**Models:** `PeopleGroup`, `PeopleGroupParticipation`,
`PeopleGroupAttachment`.

**Relações:** é a origem de fan-out consumida por `project-structure`
(`ProjectPeopleGroup`, `syncPeopleGroupEnrollments`) e `actions`
(`ActivityPeopleGroup`, `fanOutGroupToDirectParticipants`,
`fanOutGroupsToMeetingAttendance`). A membresia aqui
(`PeopleGroupParticipation.isActive`) é o sinal que os dois módulos
consultam pra decidir quem matricular/dar presença.

## permissions / roles / tenants / users / registration

Cluster de admin/RBAC — sobrepõe com `core/authorization`/`core/auth`
(ver `01-backend-core.md`), mas é dono das peças a seguir.

**permissions:**
- `permissions.controller.ts` — `GET /permissions` (exige
  `roles.manage`), lista o catálogo pra UI de edição de papel.
- `permissions.service.ts` — leitura simples.
- `permissions-sync.service.ts` — hook `OnModuleInit` que faz upsert de
  `REQUIRED_PERMISSIONS` (de `required-permissions.ts`) na tabela
  `Permission` em todo boot — mecanismo de seed de chaves novas.
- `core-permissions.ts` — lista canônica de `CORE_PERMISSIONS`/
  `CORE_ROLES`/templates de papel×permissão, uma entrada por módulo
  (ex.: `programs.read/create/update/delete`, `actions.manage`,
  `enrollments.*`). **Toda permissão nova de módulo precisa entrar aqui
  ou em `required-permissions.ts`, senão a checagem sempre falha.**
  Gap conhecido (`docs/backlog.md`): esse catálogo é sincronizado no
  boot, mas papéis já existentes de um tenant (`RolePermission`) só
  ganham a permissão nova rodando o seed de novo — não há sync
  automático pros papéis padrão.

**roles:**
- `roles.controller.ts` — CRUD em `/roles`, tudo atrás de `roles.manage`.
- `roles.service.ts` — gerencia `Role` + linhas de junção
  `RolePermission`.

**tenants:**
- `tenants.controller.ts` — `GET /tenants/me`, `GET /tenants/slug/:slug`
  (**público** — usado pelo frontend pra resolver o tenant por slug
  antes do login), `PATCH /tenants/me`.
- `tenants.service.ts` — leitura/atualização de `Tenant`.

**users:**
- `users.controller.ts` — `/users/me` (+ troca de senha), `/users` CRUD,
  `/users/mentionable` (usado pelo `@mention` de comentário em
  programs/projects/actions/deposit/pantry), `/users/:id/access-logs`,
  `/users/:id/mfa/reset`.
- `users.service.ts` — gerencia `User`/`UserRole`/`AccessLog`/
  `UserSession`.

**registration:**
- `registration.controller.ts` — fluxo público de auto-cadastro de
  tenant: `POST /registration/tenant/request` → confirmação por e-mail →
  `POST /registration/tenant/confirm` (seta cookie de refresh, cria
  `Tenant` + primeiro `User`). Rate-limited.
- `registration.service.ts`, `.constants.ts`, `.utils.ts` — ciclo de
  vida de `TenantRegistration`, geração/validação de token.

**Relações:** `roles`/`permissions` controlam todo outro módulo via
`PermissionsGuard`/`@Permissions()` compartilhado (de
`core/authorization`). `registration` é o único módulo com endpoints
intencionalmente sem autenticação (bootstrap de tenant novo), junto de
`GET /tenants/me` e `slug/:slug` de `tenants`.

## dashboard

**Negócio:** camada de agregação/relatório só-leitura — KPIs de visão
geral (Atividades executadas por mês etc.) num intervalo de datas, pra
tela inicial.

- `dashboard.controller.ts` — `GET /dashboard/overview?from&to`.
- `dashboard.service.ts` — `buildDateRange` (padrão últimos 30 dias,
  teto de 740 dias de intervalo), `buildActionExecutedPeriodWhere`
  (consulta `Activity` com `status === 'EXECUTED'`, com fallback
  `executedStartAt` → `executedEndAt` → `updatedAt`), agrupamento por
  mês.

**Relações:** só consumidor — lê `Activity` (de `actions`) e
provavelmente outros módulos (checar o resto do service se o bug for
num número específico do dashboard).

## deposit

**Negócio:** gestão geral de almoxarifado/estoque ("Depósito") —
doadores, itens, entradas, saídas (empréstimo, remoção final,
transferência, ajuste, perda — saídas `LOAN` rastreiam
`expectedReturnAt`/`returnedAt`/`returnedQuantity`), setores, relatório
de consumo, reversão de movimento, histórico completo.

- `deposit.controller.ts` — rotas `/deposit`: resumo, dashboard, CRUD de
  itens/entradas/saídas/doadores/setores, comentários/anexos por
  entidade, consulta de consumo, reversão de movimento, histórico.
- `deposit.service.ts` — `validateExitBusinessRules` (LOAN/
  FINAL_REMOVAL/TRANSFER exigem `destinationName`; só LOAN permite/exige
  campos de rastreio de devolução).

**Models:** `DepositItem`, `DepositEntry`, `DepositExit`,
`DepositExitAllocation` (alocação estilo FIFO de saída contra entradas),
`DepositDonor`, `DepositSector` + tabelas de comentário/anexo por
entidade.

**Relações:** independente — estoque isolado por tenant, sem FK direta
pra programs/projects/people (doador é entidade própria
`DepositDonor`, não `Person`).

**Gotcha:** gêmeo estrutural quase linha-a-linha de `pantry` — se achar
bug num, checar o método homônimo no outro; provavelmente nasceram de
origem comum e podem desalinhar (ex.: motivos de saída de `pantry` são
`ATTENDED/DONATION/EVENT/PARTY/CORRECTION` vs. `LOAN/FINAL_REMOVAL/
TRANSFER/ADJUSTMENT/LOSS` de `deposit` — regra de negócio diferente,
mesma forma).

## pantry

**Negócio:** estoque de despensa/alimentos ("Despensa", cesta básica) —
mesma forma de CRUD de `deposit`, mas saídas representam alimento
distribuído a atendidos, doações, eventos, festas, ou correção de
estoque (sem conceito de empréstimo/devolução).

- `pantry.controller.ts`, `pantry.service.ts` — espelha `deposit`
  estruturalmente (ver diff acima): itens/entradas/saídas/doadores/
  setores, comentários/anexos, consumo, reversão de movimento,
  histórico.

**Models:** `PantryItem`, `PantryEntry`, `PantryExit`,
`PantryExitAllocation`, `PantryDonor`, `PantrySector` + tabelas de
comentário/anexo.

**Relações:** independente, mesmo isolamento de `deposit`.

## tasks

**Negócio:** organizador de tarefa/to-do interno da equipe (estilo
kanban) — tarefas com checklist, subtarefa, comentário, anexo,
dependência, usuário responsável, log de auditoria — pra coordenação de
trabalho da equipe, não ligado ao domínio Programa/Projeto. O model
Prisma por trás tem namespace `TaskOrganizer*` mesmo as rotas sendo só
`tasks`.

- `tasks.controller.ts` — CRUD `/tasks`, `/tasks/assignable-users`,
  `/tasks/:id/audit`, sub-recursos de checklist/subtarefa/comentário/
  anexo/dependência. Helpers `getTenantId(user)`/`assertUser(user)`
  tratam `JwtUser | undefined` defensivamente no controller.
- `tasks.service.ts` — lógica; escreve em `this.prisma.auditLog` pro
  histórico da tarefa.
- `tasks.filters.ts` — monta filtro de consulta (checar aqui primeiro
  pra bug de lista/busca).

**Models:** `TaskOrganizerTask`, `TaskOrganizerChecklistItem`,
`TaskOrganizerSubtask`, `TaskOrganizerComment`,
`TaskOrganizerAttachment`, `TaskOrganizerTaskDependency`; também escreve
no `AuditLog` compartilhado.

**Relações:** `assignableUsers`/dependências referenciam `users`
(`User`). Fora isso, independente — não ligado a Programas/Projetos.

> **Nota:** o módulo `tasks` do **frontend** é explicitamente um
> sandbox de teste de padronização visual, não um módulo de negócio
> real (nav desativado) — ver `05-frontend-modules.md`. O backend
> (`tasks.controller.ts`/`tasks.service.ts` acima) é real e tem dados
> de verdade; é só a tela que está desligada da navegação.
