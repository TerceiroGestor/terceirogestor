# Plano de implementação — SaaS SCFV (módulo por módulo, testável)

Levantamento feito em 2026-11-13, a partir de
`docs/especificacao-completa-saas-para-ongs-de-scfv.md` (consolidação de
pesquisa de mercado + regras oficiais SCFV/SISC/RMA) e de
`docs/plano-reestruturacao-programas-projetos-atividades.md` (plano anterior,
mais restrito — este documento substitui e amplia aquele). **Isto é só um
plano — nada aqui foi implementado.** Pedido explícito do usuário: "por hora
só documente."

Cada fase abaixo é independente o suficiente para ser implementada, testada
(`tsc` + `npm test` + `npm run build` + teste manual) e marcada como concluída
no `PLAN.md` isoladamente — seguindo o mesmo padrão de checkpoint já usado no
resto do projeto (ver `AGENTS.md`).

## Como ler este documento

Cada fase tem 5 blocos: **Objetivo**, **Schema**, **Backend**, **Frontend**,
**Plano de teste**. Quando uma fase precisa de uma decisão do usuário antes
de começar, isso aparece em **Decisão necessária** logo no início da fase —
não espalhado num apêndice.

Ordem de dependência (quem bloqueia quem):

```
Fase 1 (Encontro) ──┬─→ Fase 2 (UI Encontros) ─────────────┐
                     └─→ Fase 3 (Presença por Encontro) ───┤
Fase 4 (relabel)    ──────────────────────────────── (paralela, sem dependência)
Fase 5 (Atendimento/Encaminhamento/Ocorrência) ──────────┬─┤
Fase 6 (regras SCFV: faixa etária, prioridade, espera) ──┘ │
                                                            ↓
                                        Fase 7 (Timeline 360° / aba Atendimentos)
                                                            ↓
                                        Fase 8 (Relatórios de estrutura/compliance)
                                                            ↓
                                        Fase 9 (Prontuário individual exportável)
```

---

## Fase 1 — Model `ActionOccurrence` (Encontro) — [x] feita em 2026-11-13

**Objetivo:** separar "Atividade" (recorrente, ex. Coral) de "Encontro"
(ocorrência concreta de uma data), com geração em lote.

**Evidência:**

- Migração `20261113042156_add_action_occurrence` — puramente aditiva
  (tabela nova + enum novo + 3 FKs; confirmado no SQL gerado), aplicada no
  Postgres local.
- Decisão tomada conforme recomendado: recorrência materializada na
  criação (sem RRULE "viva"), via `generateOccurrenceDates`
  (`backend/src/modules/actions/action-occurrence-schedule.ts`) — testada
  isoladamente com 6 testes puros (semanal, diária, período de 1 dia,
  nenhum dia bate, período invertido, lista de dias vazia).
- 6 endpoints implementados em `ActionsService`/`ProjectActionsController`:
  listar, criar 1, criar em lote (`/occurrences/bulk`), editar 1, editar
  em lote por `recurrenceBatchId` (`/occurrences/batch/:id`), excluir —
  todos reaproveitando as permissões `actions.read/create/update/delete`
  já existentes (nenhuma chave nova), e todos com `tenantId` do usuário
  autenticado em toda consulta.
- `peopleGroupId` do encontro só aceita grupo já vinculado à atividade via
  `ActionPeopleGroup` (`ensurePeopleGroupBelongsToAction`) — rejeita com
  400 caso contrário.
- `tsc --noEmit`: 0 erros. `npm test`: 27 suítes, 136 testes (6 novos).
  `npx eslint` nos arquivos tocados: 155 problemas — idêntico ao baseline
  medido antes da mudança (confirmado via `git stash`), nenhum problema
  novo introduzido; arquivos novos sem nenhum problema próprio.
  `npm run build`: ok.
- Teste manual real (Postgres local, tenant "Urna Lab", ação "Ensaio dos
  meninos da percussao"): listar vazio → gerar 4 encontros semanais
  (seg/qua, 2 semanas) → confirma as 4 datas certas → tentar com grupo não
  vinculado à atividade → 400 → tentar com período invertido → 400 →
  cancelar a série a partir de uma data → confirma que só os 2 encontros
  futuros mudaram, os 2 passados continuaram `SCHEDULED` → editar 1
  encontro (status `DONE` + notas) → excluir 1 encontro → acessar com
  `projectId` errado para o mesmo `actionId` → 404 (isolamento). Dados de
  teste removidos ao final (encontros excluídos, vínculo de grupo
  removido) — tenant restaurado ao estado original.
- **Não implementado nesta fase** (fica para a Fase 2): nenhuma tela de
  frontend — a Fase 1 é só a API, como o plano previa.

**Decisão necessária:** confirmar o formato de recorrência no MVP —
recomendo **materializar as datas na criação** (gerar N linhas de
`ActionOccurrence` de uma vez a partir de `{dias da semana, horário, período}`)
em vez de guardar uma regra RRULE "viva". Mais simples, mais fácil de
editar/cancelar 1 encontro sem afetar os outros. Ver seção 2.2 do plano
anterior para o racional completo.

### Schema
```prisma
model ActionOccurrence {
  id                String           @id @default(uuid()) @db.Char(36)
  tenantId          String           @db.Char(36)
  actionId          String           @db.Char(36)
  peopleGroupId     String?          @db.Char(36)
  scheduledDate     DateTime         @db.Date
  startTime         DateTime
  endTime           DateTime?
  status            OccurrenceStatus @default(SCHEDULED)
  notes             String?          @db.Text
  recurrenceBatchId String?          @db.Char(36)
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  tenant      Tenant        @relation(fields: [tenantId], references: [id])
  action      ProjectAction @relation(fields: [actionId], references: [id])
  peopleGroup PeopleGroup?  @relation(fields: [peopleGroupId], references: [id])

  @@index([tenantId, actionId])
  @@index([tenantId, scheduledDate])
  @@index([recurrenceBatchId])
}

enum OccurrenceStatus {
  SCHEDULED
  DONE
  CANCELED
}
```
Migração aditiva pura (tabela nova) — sem risco para dado existente.
`prisma migrate dev --name add_action_occurrence`.

### Backend
- Novo módulo `backend/src/modules/actions/occurrences/` (ou sub-rota dentro
  de `actions`, seguindo o padrão de `project-actions.controller.ts`):
  - `POST /projects/:projectId/actions/:actionId/occurrences` — cria 1
    encontro manual.
  - `POST /projects/:projectId/actions/:actionId/occurrences/bulk` — recebe
    `{ peopleGroupId, startDate, endDate, daysOfWeek[], startTime, endTime }`,
    gera N linhas com o mesmo `recurrenceBatchId` (uuid novo por chamada).
  - `GET /projects/:projectId/actions/:actionId/occurrences` — lista, filtro
    por período/status.
  - `PATCH /occurrences/:id` — editar 1 encontro (hora, status, notas).
  - `PATCH /occurrences/batch/:recurrenceBatchId` — editar/cancelar a série
    inteira (ex.: `{ status: "CANCELED", fromDate: ... }` para cancelar só os
    futuros).
  - `DELETE /occurrences/:id`.
  - DTOs com `class-validator` seguindo o padrão de
    `create-project-action.dto.ts`.
  - Nova permissão: `actions.occurrences.read` / `.create` / `.update` /
    `.delete` (ou reaproveitar `actions.*` existentes — decidir na
    implementação; não acrescenta decisão de produto, só de granularidade).
  - `peopleGroupId`, quando informado, **deve** estar entre os grupos já
    ligados à atividade via `ActionPeopleGroup` (validação de serviço, 400 se
    não estiver) — evita agendar encontro pra um grupo que a atividade nem
    atende.
  - Toda query filtrada por `tenantId` (regra inviolável do projeto).

### Frontend
- Nenhuma tela nova nesta fase — só a API. (Telas vêm na Fase 2, pra poder
  testar via Postman/Insomnia primeiro e isolar risco de schema vs. risco de
  UI.)

### Plano de teste
1. `cd backend && npx prisma migrate dev --name add_action_occurrence`
2. `npx tsc --noEmit -p tsconfig.build.json` → 0 erros.
3. Testes automatizados novos: `occurrences.service.spec.ts` cobrindo —
   geração em lote gera exatamente N datas corretas para `daysOfWeek`,
   `peopleGroupId` fora da lista da atividade rejeita, `tenantId` de outro
   tenant não aparece na listagem, cancelar por `recurrenceBatchId` só afeta
   os futuros quando `fromDate` é informado.
4. `npm test` → suíte completa continua verde.
5. Teste manual via curl/Insomnia: login real → criar atividade → gerar 8
   encontros semanais → listar → confirma 8 linhas com datas corretas →
   cancelar a série a partir de hoje → confirma só os futuros mudam de
   status.

---

## Fase 2 — UI de Encontros — [x] feita em 2026-11-13

**Objetivo:** tela de agendamento e visualização dos encontros dentro do
detalhe da Atividade.

**Evidência:**

- Arquitetura real da tela de detalhe da Atividade é diferente do que o
  plano original supôs: não existem `*-card.tsx` soltos — é um layout
  declarativo (`actions-detail-layout-contract.tsx`, `tabTemplates[]`)
  com `DetailShellEngine`. Seguido o padrão já usado por "Fotos"/
  "Relatório" (seções ad-hoc via `content`, sem precisar tocar nos
  ~860 campos de contexto do engine) — nova aba "Encontros" adicionada,
  renderizando um componente novo e autocontido
  (`action-occurrences-section.tsx`, com seu próprio fetch/estado, não
  acoplado ao engine).
- Cliente de API novo: `frontend/src/modules/actions/api/occurrences.ts`
  (6 funções, uma por endpoint da Fase 1) e
  `frontend/src/modules/actions/api/people-groups.ts`
  (`listActionPeopleGroups`, não existia no frontend ainda).
- UI: alternância Lista (`ListView`)/Calendário (`CalendarView`) — nenhuma
  biblioteca nova, como previsto; diálogo "Agendar encontros" (grupo
  restrito aos já vinculados à atividade, dias da semana, horário,
  período); diálogo de edição de 1 encontro (data/horário/grupo/status/
  notas) com atalho "Cancelar esta e as próximas da série" (usa o
  endpoint de lote da Fase 1).
- `tsc --noEmit`: 0 erros (frontend e backend). `npx eslint` nos arquivos
  novos: só a categoria `react-hooks/set-state-in-effect`, a mesma dívida
  já medida e documentada em `docs/backlog.md` (213 problemas
  pré-existentes) — nenhum problema de nenhuma outra categoria. `npm run
  build` (frontend) e `npm test` (backend, 27 suítes/136 testes): ok.
- **Teste manual real, de ponta a ponta, com navegador de verdade**
  (Playwright headless contra os dois servidores de dev reais, Postgres
  local, tenant "Urna Lab"): login → abrir a atividade "Ensaio dos
  meninos da percussão" → aba "Encontros" → "Agendar encontros" (seg/qua,
  2 semanas, 15h–16h) → confirma 4 linhas na lista com as datas corretas
  → alterna para Calendário → confirma os eventos aparecem no mês certo
  → volta para Lista → abre 1 encontro → muda status para Cancelado →
  salva → confirma só aquele encontro fica "Cancelado", os outros
  continuam "Agendado" → zero erros no console do navegador. Dados de
  teste removidos ao final (8 encontros excluídos via API — rodei o
  fluxo duas vezes depurando seletores do teste); tenant restaurado ao
  estado original. `.env`/`WEB_URL` precisou de um ajuste temporário
  (porta do dev server ocupada por outro processo já rodando na 3000) —
  revertido ao valor original ao final, confirmado por `git diff`.
- **Achado colateral, fora do escopo desta fase:** o formulário de login
  (`login-form.tsx`) perde o que a pessoa já digitou se ela começar a
  digitar antes do nome da instituição carregar (a busca assíncrona do
  tenant reseta o formulário). Baixo impacto (o carregamento é rápido),
  mas vale registrar — não foi corrigido aqui, fora do escopo da Fase 2.

### Frontend
- Novo componente em
  `frontend/src/modules/actions/features/manage/ui/action-occurrences-card.tsx`
  (substitui/complementa `project-action-attendances-card.tsx` como ponto de
  entrada — a presença em si some desta tela e migra para dentro de cada
  encontro, ver Fase 3).
- Lista/calendário alternável reaproveitando `ListView`/`CalendarView` já
  existentes em `web-client/views/` — **sem biblioteca nova**.
- Diálogo "Agendar encontros": grupo (só os já ligados à atividade via
  `ActionPeopleGroup`) + dias da semana + horário + período → chama o bulk
  endpoint da Fase 1.
- Clicar num encontro abre o detalhe (edição de 1 encontro + status).
- Sem mudança de rota pública — tudo dentro da tela de detalhe da Atividade
  que já existe.

### Plano de teste
1. `cd frontend && npx tsc --noEmit` → 0 erros.
2. `npx eslint src` → não aumenta o total de problemas pré-existentes
   (medir antes/depois, igual ao padrão usado nas últimas sessões).
3. `npm run build` → ok.
4. Teste manual com os dois servidores de pé: criar atividade → agendar 4
   encontros semanais pela UI → ver os 4 na lista/calendário → cancelar 1 →
   status atualiza sem afetar os outros 3.

---

## Fase 3 — Presença migra para nível de Encontro

**Objetivo:** frequência real dia a dia (exigida pelo RMA/SISC), não "uma
presença por atividade inteira".

### Schema (migração aditiva, 2 deploys — regra do `AGENTS.md`)
**Deploy 1 (expandir):**
```prisma
model ProjectActionAttendance {
  // ...campos atuais...
  occurrenceId String? @db.Char(36)   // novo, opcional
  occurrence   ActionOccurrence? @relation(fields: [occurrenceId], references: [id])
}
```
Script de backfill (`backend/scripts/backfill-action-occurrences.js`, mesmo
padrão de `migrate-upload-keys-to-tenant-scoped.js`): para cada
`ProjectAction` com presença e **sem** nenhum `ActionOccurrence` ainda, criar
1 `ActionOccurrence` com `scheduledDate = executedStartAt` e apontar as
presenças existentes pra ele. Idempotente (pula ação que já tem encontro).

**Deploy 2 (contrair, só depois do backfill confirmado em produção):**
tornar `occurrenceId` obrigatório; trocar `@@unique([tenantId, actionId,
enrollmentId])` para `@@unique([tenantId, occurrenceId, enrollmentId])`;
remover os endpoints/branches que ainda aceitam presença por `actionId` direto.

### Backend
- `GET/PUT :occurrenceId/attendances` substitui `GET/PUT :actionId/attendances`
  (`project-actions.controller.ts` atual). Mesma forma de bulk-upsert, só
  troca a chave.
- Ajustar `dashboard.service.ts` (seção "totals.attendances"/"series") para
  continuar funcionando: a query de hoje agrupa por `actionId` nas presenças
  — passa a agrupar pelo `actionId` do `occurrence.action`, mesma contagem
  final, só muda o join.

### Frontend
- Tela de presença (hoje por atividade) passa a abrir por encontro
  (acessada a partir do card de um encontro específico, Fase 2).

### Plano de teste
1. Deploy 1: `npx prisma migrate dev --name add_attendance_occurrence_id`
   → rodar backfill localmente → confirmar `occurrenceId` preenchido pra
   toda presença existente (`SELECT count(*) FROM "ProjectActionAttendance"
   WHERE "occurrenceId" IS NULL` → 0).
2. `npm test` com os specs de attendance atualizados para a nova chave.
3. Teste manual: marcar presença por encontro específico → confirma reflete
   no dashboard (`totals.attendances`) sem regressão de contagem.
4. Deploy 2 (só depois do Deploy 1 validado em produção por um tempo):
   migration tornando `occurrenceId` obrigatório + ajuste do `@@unique`.

---

## Fase 4 — Relabel "Ação" → "Atividade" (paralela, baixo risco)

**Objetivo:** alinhar o vocabulário da UI à regra de negócio real, sem tocar
em schema/rotas.

### Frontend
- Todo texto visível do módulo `actions` (menu, breadcrumbs, títulos de
  botão, labels de formulário) troca "Ação"/"Ações" por "Atividade"/
  "Atividades". **Rotas (`/actions`, `/actions/new`) e nomes de componente
  continuam iguais** — só o texto renderizado muda (custo baixo, sem quebrar
  link salvo/favorito).

### Plano de teste
1. `npx tsc --noEmit` (mudança só de string, não deveria quebrar nada).
2. `npx eslint src` sem regressão.
3. `npm run build`.
4. Teste manual: navegar por todas as telas do módulo e confirmar que não
   sobrou nenhum "Ação"/"Ações" visível fora do contexto correto (buscar por
   grep no bundle não serve — tem que ser visual, já que `header`/aria-label
   também precisam mudar).

---

## Fase 5 — Atendimento Técnico / Encaminhamento / Ocorrência (módulos novos)

**Decisões necessárias antes de começar:**
1. *Permissão de sigilo* — recomendo **não** criar papéis fixos
   ("Psicólogo", "Coordenação Técnica") no código. O RBAC do projeto já é
   baseado em chaves de permissão livres por tenant
   (`backend/src/modules/permissions/core-permissions.ts`) — a solução que
   já existe na arquitetura é criar chaves novas (`service-records.read`,
   `service-records.read.confidential`, `occurrences.read.confidential`
   etc.) e deixar o tenant atribuir essas chaves a qualquer papel que ele
   mesmo configurar. Resolve a pergunta sem inventar conceito novo — só
   precisa confirmar os **nomes exatos das chaves**.
2. *Encaminhamento sempre nasce de um Atendimento, ou pode ser direto?*
   Recomendo **opcional**: `Referral.sourceServiceRecordId` nullable — cobre
   os dois casos sem forçar um fluxo.
3. *Ocorrência é sempre de uma pessoa específica, ou pode ser coletiva (do
   grupo)?* Recomendo `PersonOccurrence.personId` **nullable** +
   `peopleGroupId` opcional — quando `personId` é nulo, é uma ocorrência do
   grupo/encontro como um todo (ex. "briga generalizada no encontro").

### Schema
```prisma
enum ServiceRecordType { SOCIAL PSICOLOGICO JURIDICO SAUDE OUTRO }
enum ServiceRecordModality { INDIVIDUAL FAMILIAR GRUPAL }
enum ServiceRecordStatus { OPEN IN_PROGRESS CLOSED }

model PersonServiceRecord {
  id                  String                 @id @default(uuid()) @db.Char(36)
  tenantId            String                 @db.Char(36)
  personId            String                 @db.Char(36)
  type                ServiceRecordType
  modality             ServiceRecordModality
  occurredAt          DateTime
  responsibleUserId   String                 @db.Char(36)
  demand              String                 @db.Text
  technicalNotes      String                 @db.Text
  nextSteps           String?                @db.Text
  confidential        Boolean                @default(false)
  status              ServiceRecordStatus    @default(OPEN)
  projectEnrollmentId String?                @db.Char(36)
  createdAt           DateTime               @default(now())
  updatedAt           DateTime               @updatedAt

  tenant       Tenant              @relation(fields: [tenantId], references: [id])
  person       Person              @relation(fields: [personId], references: [id])
  responsible  User                @relation(fields: [responsibleUserId], references: [id])
  enrollment   ProjectEnrollment?  @relation(fields: [projectEnrollmentId], references: [id])
  referrals    Referral[]

  @@index([tenantId, personId])
  @@index([tenantId, status])
}

enum ReferralTargetNetwork {
  CRAS CREAS CENTRO_POP SUS CONSELHO_TUTELAR ESCOLA MINISTERIO_PUBLICO OUTRO
}
enum ReferralStatus { SENT ACKNOWLEDGED IN_PROGRESS RETURNED NO_RESPONSE }

model Referral {
  id                    String                @id @default(uuid()) @db.Char(36)
  tenantId              String                @db.Char(36)
  personId              String                @db.Char(36)
  sourceServiceRecordId String?               @db.Char(36)
  targetNetwork         ReferralTargetNetwork
  targetUnitName        String?
  reason                String                @db.Text
  referredByUserId      String                @db.Char(36)
  status                ReferralStatus        @default(SENT)
  returnedAt            DateTime?
  returnNotes           String?               @db.Text
  createdAt             DateTime              @default(now())
  updatedAt             DateTime              @updatedAt

  tenant         Tenant               @relation(fields: [tenantId], references: [id])
  person         Person               @relation(fields: [personId], references: [id])
  sourceRecord   PersonServiceRecord? @relation(fields: [sourceServiceRecordId], references: [id])
  referredByUser User                 @relation(fields: [referredByUserId], references: [id])

  @@index([tenantId, personId])
  @@index([tenantId, status])
  @@index([tenantId, targetNetwork])
}

enum OccurrenceCategory { COMPORTAMENTAL VIOLACAO_DIREITOS SAUDE SEGURANCA ADMINISTRATIVA OUTRO }
enum OccurrenceSeverity { BAIXA MEDIA ALTA }

model PersonOccurrence {
  id                 String             @id @default(uuid()) @db.Char(36)
  tenantId           String             @db.Char(36)
  personId           String?            @db.Char(36)
  peopleGroupId      String?            @db.Char(36)
  actionOccurrenceId String?            @db.Char(36)
  category           OccurrenceCategory
  severity           OccurrenceSeverity
  description        String             @db.Text
  actionTaken        String?            @db.Text
  confidential       Boolean            @default(false)
  registeredByUserId String             @db.Char(36)
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  tenant          Tenant            @relation(fields: [tenantId], references: [id])
  person          Person?           @relation(fields: [personId], references: [id])
  peopleGroup     PeopleGroup?      @relation(fields: [peopleGroupId], references: [id])
  actionOccurrence ActionOccurrence? @relation(fields: [actionOccurrenceId], references: [id])
  registeredByUser User             @relation(fields: [registeredByUserId], references: [id])

  @@index([tenantId, personId])
  @@index([tenantId, category, severity])
}
```
(nomes de enum/campo sujeitos a ajuste fino na implementação; a forma
estrutural é o que importa para o plano.)

### Backend
Três módulos novos, mesmo padrão dos existentes (`controller` + `service` +
`dto/`), um por entidade — **não fundir num módulo genérico "casos"**, já
que cada um tem regras de validação e permissão próprias:
- `backend/src/modules/service-records/`
- `backend/src/modules/referrals/`
- `backend/src/modules/occurrences/`

Cada um com CRUD completo + filtro por pessoa/período/status/profissional, e
um guard de sigilo reaproveitável: um `ConfidentialAccessGuard` genérico
(parametrizado pela permissão `.confidential` do módulo) em vez de repetir a
lógica 3 vezes — essa é a única peça de infraestrutura nova de fato, e serve
também pra Ocorrência.

Auditoria: reaproveitar `PersonSensitiveAccessLog` (ou um equivalente
genérico `ConfidentialAccessLog` com `recordType`+`recordId`, seguindo o
padrão já usado em `PersonRecordComment`/`PersonRecordAttachment`) para logar
quem leu um registro confidencial.

### Frontend
Três módulos novos (`frontend/src/modules/service-records/`,
`referrals/`, `occurrences/`), seguindo o padrão canônico (`*-module-contract.tsx`,
`ListView`, `EntityModuleShell`) — reaproveita toda a infraestrutura genérica
do `web-client/`, sem inventar componente novo. Cada um ganha também uma
aba/seção dentro do detalhe de Pessoa (consumida de fato na Fase 7, a
timeline 360°) e, para Ocorrência, uma entrada a partir do detalhe de um
Encontro.

### Plano de teste
1. Migração (3 tabelas novas, aditiva, zero risco a dado existente).
2. `tsc` + testes de serviço novos por módulo (criação, filtro, sigilo:
   usuário sem a permissão `.confidential` não vê registro marcado
   confidencial — nem na listagem nem no detalhe — e tentativa direta por
   `id` dá 403, não 404, pra não revelar existência; teste que prova isso
   explicitamente, como manda o `AGENTS.md` para correção/feature de
   tenant/sigilo).
3. `npm test` completo.
4. Teste manual: criar atendimento confidencial com usuário A (tem a
   permissão) → logar como usuário B (sem a permissão) → confirmar que não
   aparece na lista nem é acessível por URL direta.

---

## Fase 6 — Regras de negócio oficiais do SCFV

**Objetivo:** refletir faixa etária, público prioritário, lista de espera e
motivo de desligamento — exigidos pelo RMA/SISC.

### Schema
- `PeopleGroup.ageBracket` (enum ou faixa livre `ageMin`/`ageMax` já
  existem — só precisa de um enum `SCFVAgeBracket` opcional
  `{ CRIANCA_0_6, CRIANCA_6_15, ADOLESCENTE_15_17, ADULTO_18_MAIS }` pra
  mapear direto no relatório oficial, sem recalcular na hora).
- `Person.priorityCriteria Json?` (array de strings livres:
  `["TRABALHO_INFANTIL", "BPC", "PBF", "MEDIDA_PROTETIVA", "DEFICIENCIA",
  "FORA_DA_ESCOLA"]`) — ou uma tabela `PersonPriorityCriterion` se precisar
  de data de início/fim por critério (recomendo a tabela, já que "está fora
  da escola" pode deixar de ser verdade e o histórico importa pro relatório).
- `ProjectEnrollment.status` ganha `WAITLIST` no enum `EnrollmentStatus`
  (hoje só `ACTIVE/ENDED`) + `waitlistEnteredAt DateTime?`.
- `ProjectEnrollmentGroupMembership` ganha `exitReason` (enum:
  `TRANSFERENCIA_FAIXA, DESISTENCIA, MUDANCA_TERRITORIO, CONCLUSAO, OUTRO`)
  preenchido na saída.
- Carga horária diária por faixa etária (1h30/4h/3h/sob demanda): **não** é
  campo de schema — é uma regra de validação no bulk-generate da Fase 1
  (soma a duração dos encontros do dia pro grupo e emite **alerta**, não
  bloqueio — o próprio documento-fonte pede alerta, não trava).

### Backend
- Validação (alerta, não erro 400) no bulk-generate de encontros: se a soma
  diária de horas do grupo passar do limite da faixa, devolver um `warnings[]`
  na resposta em vez de rejeitar.
- Enrollment com `status=WAITLIST` não conta em "pessoas atendidas ativas"
  dos relatórios/dashboard — só no relatório específico de lista de espera.

### Frontend
- Formulário de `PeopleGroup`: campo faixa etária SCFV.
- Formulário de `Person`/matrícula: seleção de critérios de prioridade.
- Fluxo de matrícula: opção "colocar em lista de espera" quando o grupo está
  cheio (cheio = sem regra de capacidade máxima hoje — se quiser bloqueio
  por capacidade, é uma decisão nova, fora do que foi pedido; por ora só
  permite marcar manualmente).
- Saída de um membro do grupo: campo obrigatório de motivo.

### Plano de teste
1. `tsc` + testes de serviço (alerta de carga horária dispara certo nos 4
   limites de faixa; waitlist não entra na contagem de ativos).
2. `npm test`.
3. Teste manual: criar grupo 0-6 anos, agendar encontros somando mais de
   1h30/dia → confirma alerta aparece sem bloquear; registrar pessoa em
   lista de espera → confirma não aparece como "atendido ativo" no
   dashboard.

---

## Fase 7 — Timeline 360° (aba "Atendimentos" da Pessoa)

**Objetivo:** implementar a aba hoje `disabled: true`
(`people-detail-tabs.tsx:45`), unificando matrícula, frequência, atendimento,
encaminhamento e ocorrência numa linha do tempo só.

### Backend
- Novo endpoint agregador `GET /people/:id/timeline` (filtro por período e
  tipo de evento) — monta e ordena por data os 5 tipos de evento (matrícula/
  grupo, atividade/encontro+presença, atendimento, encaminhamento,
  ocorrência), respeitando o filtro de sigilo (um evento confidencial sem
  permissão vem **omitido do array**, não como item "censurado" visível —
  evita até confirmar que existe).

### Frontend
- Remove `disabled: true` do item `atendimentos` em `people-detail-tabs.tsx`.
- Novo componente de timeline filtrável (reaproveita padrão visual já usado
  em `audit-timeline-page.tsx`, que já existe no projeto — não inventar
  layout novo).

### Plano de teste
1. `tsc`.
2. Teste de serviço: timeline mistura e ordena corretamente os 5 tipos;
   evento confidencial sem permissão não aparece no array (não só
   "mascarado").
3. Teste manual: abrir pessoa com histórico misto → confirmar todos os
   eventos aparecem na ordem certa → logar com usuário sem permissão de
   sigilo → confirmar que o(s) evento(s) confidencial(is) desaparece(m) da
   timeline dessa pessoa.

---

## Fase 8 — Relatórios de estrutura e compliance

**Objetivo:** seções 9.1-9.3 da especificação.

**Decisão necessária:** relatórios cross-projeto (ex. "todos os grupos
ativos por faixa etária" olhando o tenant inteiro, não um projeto
específico) ficam dentro do detalhe de Programa/Projeto (como o documento
propõe) ou precisam também de uma visão solta, tipo um módulo
"Relatórios"? Recomendo: **dentro do contexto** para os relatórios de
estrutura (9.1 — eles já são por Programa/Projeto), e um **relatório SISC
solto** (9.2) à parte, porque ele é por tenant inteiro/período, não por
projeto — não cabe bem dentro de um único detalhe.

### Backend
- Endpoints simples, sem agregação nova de infraestrutura — consultas
  diretas (`groupBy`/`count`) sobre os models já existentes + os novos das
  Fases 1, 5 e 6:
  - `GET /programs/:id/projects-summary`
  - `GET /projects/:id/report` (pessoas atendidas, total de atividades,
    total de encontros realizados/agendados)
  - `GET /reports/sisc?period=...` (grupos ativos por faixa, entradas/
    saídas/lista de espera por grupo, carga horária semanal, público
    prioritário)

### Frontend
- Aba "Projetos" no detalhe do Programa; resumo no topo do Projeto
  (contadores); tela nova "Relatório SISC" (fora do contexto de projeto,
  só filtro de período) — reaproveitando `GraphView` já existente.

### Plano de teste
1. `tsc`.
2. Teste de serviço por endpoint (contagens corretas com dado conhecido de
   fixture).
3. Teste manual: comparar o número mostrado no relatório com uma contagem
   manual no banco (`SELECT count(*) ...`) pra pelo menos 2 dos 4
   relatórios, garantindo que a agregação está certa antes de confiar nela
   pra digitar no SISC de verdade.

---

## Fase 9 — Prontuário individual exportável

**Objetivo:** seção 9.4 — documento único por pessoa, respeitando sigilo.

### Backend
- `GET /people/:id/record-export` — reaproveita o endpoint da Fase 7
  (timeline) + dados de identificação, já filtrado por sigilo do usuário que
  pediu a exportação.

### Frontend
- Botão "Exportar prontuário" na aba Atendimentos → gera PDF/HTML
  imprimível (reaproveitar o mecanismo de impressão/PDF já usado em algum
  relatório existente, se houver um — se não houver, usar impressão nativa
  do navegador via CSS de print, sem biblioteca nova).

### Plano de teste
1. Teste manual: exportar prontuário de pessoa com atendimento confidencial,
   logado como quem **não** tem a permissão → confirmar que o PDF/HTML
   gerado não contém o registro confidencial, nem uma linha "1 registro
   oculto" (não revelar existência).
2. Exportar com usuário que **tem** a permissão → confirmar que aparece
   completo.

---

## Resumo das decisões que precisam de confirmação antes de codificar

1. Fase 1: formato de recorrência = materializar datas (recomendado) —
   confirmar.
2. Fase 5: nomes exatos das chaves de permissão de sigilo; encaminhamento
   com origem opcional (recomendado); ocorrência com pessoa opcional/grupo
   (recomendado).
3. Fase 6: tabela de critério de prioridade com histórico (recomendado) vs.
   campo `Json` simples; limite de carga horária como alerta (já decidido
   pelo documento-fonte, não é uma pergunta aberta).
4. Fase 8: relatório SISC solto fora do contexto de projeto (recomendado).

Nenhuma fase começa a ser codificada até a confirmação da fase correspondente
— cada fase pode ser aprovada e iniciada independentemente das outras, não
precisa aprovar o documento inteiro de uma vez.

## Sobre o momento de implementação

Mesma observação do plano anterior: isto é "Parte 5 — Evolução de
arquitetura" pelo `AGENTS.md`, que define esse tipo de trabalho como
"só depois do go-live". Decisão já registrada em `docs/backlog.md`
(2026-11-12): registrar e não iniciar antes do go-live (Parte 4). Este
documento substitui o escopo do plano anterior no backlog — mais completo,
mesma decisão de sequenciamento até segunda ordem.
