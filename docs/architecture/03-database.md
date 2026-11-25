# Modelo de dados (Prisma / PostgreSQL)

*Última revisão: 2026-11-25. Fonte da verdade: `backend/prisma/schema.prisma`
(~99 models). Este documento é um mapa de navegação, não um substituto do
schema — em caso de dúvida sobre um campo específico, leia o schema.*

## Armadilha nº 1: nome do model ≠ nome da tabela

Em 5 models, o nome usado no código (Prisma Client, TypeScript) é
**diferente** do nome da tabela física no Postgres, por causa de um
rename de nomenclatura de negócio (Fase 1.0 do plano de módulos:
Programa → Projeto → **Atividade** → **Encontro**) feito **sem**
migration de rename de tabela — só o `@@map` mudou:

| Nome no código (Prisma Client) | Tabela física (`@@map`) | Conceito de negócio |
|---|---|---|
| `ActivityType` | `ActionType` | Tipo de Atividade |
| `Activity` | `ProjectAction` | **Atividade** (antes chamada "Ação") |
| `ActivityPeopleGroup` | `ActionPeopleGroup` | Grupos vinculados a uma Atividade |
| `Meeting` | `ActionOccurrence` | **Encontro** (uma ocorrência agendada de uma Atividade) |
| `MeetingAttendance` | `ProjectActionAttendance` | Presença de uma pessoa num Encontro |

Ao ler uma migration antiga, uma query SQL crua, ou um nome de variável
legado em algum arquivo (`actionId`, `occurrenceId`, `ProjectAction...`),
é isso que está por trás — não é um model diferente. Grep por
`ProjectAction` ou `ActionOccurrence` no SQL/migrations encontra a mesma
coisa que `Activity`/`Meeting` no código TypeScript.

Dois conceitos **diferentes** também colidiam de nome e por isso têm
enums com nomes deliberadamente não-óbvios — não confundir:

- Status de **presença** no Encontro: `AttendanceStatus`
  (PRESENT/ABSENT/EXCUSED) — nada a ver com o módulo Atendimento.
- Status do registro de **Ocorrência** (incidente, Fase 5): teve que se
  chamar `OccurrenceCaseStatus` (REGISTRADA/EM_ANALISE/DESFECHO_DEFINIDO)
  porque `OccurrenceStatus` já existia para o status do **Encontro**
  (SCHEDULED/DONE/CANCELED).
- Status do módulo **Atendimento** (Fase 6): `AttendanceCaseStatus`
  (ABERTO/ENCERRADO) pelo mesmo motivo — `AttendanceStatus` já era a
  presença do Encontro.

## Famílias de tabelas

### 1. Identidade / tenancy / RBAC / segurança de conta
`Tenant`, `User`, `Role`, `Permission`, `RolePermission`, `UserRole`,
`UserSession`, `PasswordResetToken`, `AccessLog`, `AuditLog`,
`TenantRegistration`, `UserMfaTotpSetup`, `UserMfaChallenge`,
`UserTrustedDevice`, `UserMfaRecoveryCode`.

- `Tenant` é a raiz de tudo — praticamente todo outro model tem
  `tenantId` apontando para ele.
- `Role`/`Permission`/`RolePermission`/`UserRole` são o catálogo RBAC —
  ver `01-backend-core.md` §Authorization para como o catálogo é
  sincronizado no boot vs. como papéis existentes recebem permissões
  novas (gap conhecido, ver `docs/backlog.md`).
- `AuditLog` é escrito automaticamente pelo `PrismaService` em toda
  escrita (ver `01-backend-core.md` §Audit); `AccessLog` registra
  login/IP; `PersonSensitiveAccessLog` (família Person, abaixo) é
  separado e específico para acesso a documento de saúde.
- `UserMfa*`/`UserTrustedDevice` sustentam o fluxo de MFA por TOTP —
  ver `01-backend-core.md` §Auth.

### 2. Pessoa (`Person`) e tudo que pende dela
`Person`, `DailyAttendance`, `PersonContact`, `PersonComment`,
`PersonAttachment`, `PersonRecordComment`, `PersonRecordAttachment`,
`PersonRecordTag`, `PersonSensitiveDocument`,
`PersonSensitiveAccessLog`, `PersonRelation`, `PersonHealthCondition`,
`PersonMedication`, `PersonEducation`, `PersonDetention`,
`PersonBenefit`.

`Person` é o model mais carregado do sistema (uma pessoa física
cadastrada — "Atendido", "Funcionário", "Voluntário" etc. via
`personType`). Campos sensíveis (CPF, documentos de saúde) passam por
criptografia PII — ver `01-backend-core.md` §PII. `PersonRecordComment`/
`PersonRecordAttachment`/`PersonRecordTag` são o padrão "genérico" de
metadata (comentário/anexo/tag) que módulos mais novos tendem a replicar
por entidade (ver, por módulo, os equivalentes `Program/Project/Pantry/
Deposit *Comment`/`*Attachment`, e a ausência disso em `Occurrence`/
`Attendance`, registrada como gap em `docs/backlog.md`).

### 3. Família (`Household`)
`Household`, `HouseholdMember`, `HouseholdProfile`, `HouseholdAsset`,
`PersonAsset`, `PersonIncome`, `PersonFinancialEntry`, `PersonExpense`,
`HouseholdTransfer`.

Agrupa pessoas num domicílio para visão socioeconômica (renda, despesa,
patrimônio, transferências). **Gap conhecido:** `HouseholdAsset`/
`PersonAsset` têm endpoints no backend mas nenhuma tela no frontend (ver
`docs/backlog.md`, seção "Módulo people — família").

### 4. Grupos (`PeopleGroup`)
`PeopleGroup`, `PeopleGroupAttachment`, `PeopleGroupParticipation`.

Agrupamento de pessoas (turma, equipe, ciclo) com tipo (`PeopleGroupType`:
CYCLE/SEGMENT/TEAM_POOL/NETWORK/OTHER) e propósito
(`PeopleGroupPurpose`: PUBLICO/EQUIPE). É a peça que permite "adicionar
um Grupo inteiro" a um Projeto/Atividade/Encontro e, por fan-out, criar
vínculo direto por pessoa — ver `02-backend-modules.md` §people-groups e
§actions.

### 5. Hierarquia Programa → Projeto → Atividade → Encontro
`Program`, `ProgramComment`, `ProgramAttachment`, `Project`,
`ProjectFundingSource`, `Goal`, `ProjectComment`, `ProjectAttachment`,
`ProjectPeopleGroup`, `ProjectEnrollment`, `ActivityType`, `Activity`
(tabela `ProjectAction`), `ProjectActionComment`,
`ProjectActionAttachment`, `ActivityPeopleGroup` (tabela
`ActionPeopleGroup`), `Meeting` (tabela `ActionOccurrence`),
`ActionOccurrenceTeamGroup`, `ActionOccurrencePeopleGroup`,
`MeetingAttendance` (tabela `ProjectActionAttendance`),
`ProjectActionPeopleParticipation`, `ProjectTeamParticipation`,
`MeetingTeamParticipation`.

Esta é a espinha dorsal do produto (modelo SCFV): um `Program` tem N
`Project`s; um `Project` tem matrículas (`ProjectEnrollment`) e N
`Activity`s (Atividades); uma `Activity` gera N `Meeting`s (Encontros,
cada um uma data/hora concreta); um `Meeting` tem presença
(`MeetingAttendance`) por pessoa. `ProjectActionPeopleParticipation` é a
fonte de verdade de "quem participa de qual Atividade" (vínculo direto,
desde a revisão de 2026-11-24 — antes era só calculado on-the-fly por
Grupo/matrícula). `ProjectTeamParticipation`/`MeetingTeamParticipation`
são o equivalente para equipe (quem facilita/acompanha). Detalhe de
negócio e dos arquivos de serviço: `02-backend-modules.md`.

### 6. Ocorrência (incidente) — Fase 5
`Occurrence`, `OccurrencePeople`.

Registro de um incidente/ocorrência envolvendo uma ou mais pessoas,
opcionalmente ligado a um `Meeting`. Ver nota sobre colisão de nome de
enum acima.

### 7. Atendimento (social/psicológico) — Fase 6
`Attendance`, `AttendancePeople`, `AttendanceEvolution`,
`AttendanceBenefit`.

Registro de atendimento técnico (social ou psicológico,
`AttendanceType`) a uma pessoa, com evolução (`AttendanceEvolution`) e
benefícios concedidos (`AttendanceBenefit`). Ver nota sobre colisão de
nome de enum acima. **Gap conhecido:** ainda sem Tags/Notas/Anexos
próprios (Fase B do plano do Atendimento, pendente — ver
`docs/backlog.md`).

### 8. Pantry e Deposit — dois módulos de doação em paralelo
**Pantry:** `PantryItem`, `PantrySector`, `PantryDonor`, `PantryEntry`,
`PantryExit`, `PantryExitAllocation`, `PantryItemComment`,
`PantryItemAttachment`, `PantryDonorComment`, `PantryDonorAttachment`,
`PantryEntryComment`, `PantryEntryAttachment`, `PantryExitComment`,
`PantryExitAttachment`.

**Deposit:** mesma estrutura exata, prefixo `Deposit*` em vez de
`Pantry*` (`DepositItem`, `DepositSector`, `DepositDonor`,
`DepositEntry`, `DepositExit`, `DepositExitAllocation`, + comments/
attachments espelhados).

Os dois módulos são deliberadamente paralelos (mesma modelagem,
provavelmente representam dois tipos de estoque/doação diferentes —
ex.: alimentos vs. outros bens). Qualquer correção estrutural num
tende a se aplicar no outro (ver histórico no `PLAN.md`: a migração de
padronização de UI tratou os dois juntos, e um bug de SQL cru achado num
foi corrigido nos dois ao mesmo tempo).

### 9. Tarefas internas (`TaskOrganizerTask`)
`TaskOrganizerTask`, `TaskOrganizerAttachment`,
`TaskOrganizerChecklistItem`, `TaskOrganizerSubtask`,
`TaskOrganizerComment`, `TaskOrganizerTaskDependency`.

Gestão de tarefas da própria equipe (não é um módulo de atendimento ao
público) — checklist, subtarefa, dependência entre tarefas.

## Convenções de schema

- **Chave primária:** sempre `id String @id @default(uuid()) @db.Char(36)`.
- **Multi-tenant:** quase todo model tem `tenantId String @db.Char(36)`
  com relação para `Tenant` e índice (`@@index([tenantId])` ou composto).
  Qualquer model de domínio sem `tenantId` é suspeito — verificar por quê.
- **Soft delete:** alguns models (ex.: `Activity`) têm `deletedAt
  DateTime?` em vez de exclusão física — ver
  `docs/canonical-web-client-standard.md` ("Exclusão é sempre soft delete,
  atrás de um status terminal do próprio módulo").
- **Migrations:** aditivas em produção (regra do `AGENTS.md`); remover/
  renomear coluna é sempre dois deploys (expandir, depois contrair).
  Nunca `prisma db push` fora do ambiente local — só `prisma migrate
  dev --name ...` versionado. Histórico de migrations:
  `backend/prisma/migrations/`.
- **Seed:** `backend/prisma/seed.ts` (compilado para `.js` via `npm run
  build:seed` — não editar o `.js` gerado diretamente). Gera dados
  fictícios em fases (`programs-projects-activities-fase3.ts`,
  `meetings-fase4.ts`, etc., em `backend/prisma/seed-data/` ou pasta
  equivalente) — ver arquivos de fase para entender volume/distribuição
  gerada.
- **Cliente gerado:** `backend/src/generated/prisma/` — nunca editar
  (regra do `AGENTS.md`), é saída do `prisma generate`.
