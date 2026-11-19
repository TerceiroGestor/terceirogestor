# Plano — reestruturação de Programas / Projetos / Ações → Atividades / Encontros

Levantamento feito em 2026-11-12. **Isto é só um plano — nada aqui foi
implementado.** Cobre o pedido do usuário: revisar a estrutura de Programa →
Projeto → Ação para refletir a regra de negócio real (Programa → Projeto →
Atividade → Encontro), com profissionais, Grupos, agendamento
recorrente e relatórios.

## Resumo da regra de negócio (como o usuário descreveu)

- **Programa**: o guarda-chuva amplo. Várias projetos.
- **Projeto**: tem início, meio e fim (ex.: "Projeto de música em 2026").
- **Atividade** (hoje chamada "Ação"): o serviço em si dentro do projeto. Um
  projeto de música pode ter várias atividades diferentes (coral, violão,
  percussão).
- **Encontro**: cada atividade tem vários encontros, agendáveis com
  facilidade — semanal, diário etc.
- **Encontro é realizado por profissionais** (professor, educador) **para
  atendidos** (pessoas atendidas).
- Uma atividade pode ter **um ou mais profissionais** e ser direcionada a
  **um ou mais Grupos** (facilita gerir quem vai participar no
  futuro). Encontros são organizados por **Grupos e horário**.
- Relatórios esperados: projetos por programa, pessoas atendidas por
  projeto, total de atividades no projeto, total de encontros.
- No detalhe de Pessoa: ver em quais projetos/atividades/encontros a pessoa
  está matriculada — o "registro completo dos serviços prestados".

## 1. O que já existe hoje (mapeado no código, não suposição)

| Conceito do usuário | O que existe hoje | Nível de atendimento |
| --- | --- | --- |
| Programa | `Program` (`schema.prisma:1101`) — nome, tipo, status, período | ✅ já corresponde |
| Projeto | `Project` (`schema.prisma:1165`) — `programId`, período (`startsAt/endsAt`) | ✅ já corresponde |
| Atividade | `ProjectAction` (`schema.prisma:1403`) — **hoje é tratada como um evento único**: um `plannedStartAt/plannedEndAt` e um `executedStartAt/executedEndAt`, sem repetição | ⚠️ existe mas no nível errado de granularidade |
| Encontro | **não existe nenhum modelo.** Não há `Occurrence`/`Meeting`/recorrência em lugar nenhum do schema (confirmado por grep) | ❌ não existe |
| Profissional na atividade | `ProjectActionPeopleParticipation` (`schema.prisma:1534`) — pessoa + papel (`FACILITADOR`, `APOIO`, `RESPONSAVEL_TECNICO`...), já com histórico temporal (`startsAt/endsAt/activeKey`) | ✅ já existe, só falta ligar ao Encontro |
| Grupos de pessoas → atividade | `ActionPeopleGroup` (`schema.prisma:1490`) — liga `PeopleGroup` a uma `ProjectAction` | ✅ já existe |
| Grupos de pessoas → projeto | `ProjectPeopleGroup` (`schema.prisma:1310`) | ✅ já existe |
| Presença no encontro | `ProjectActionAttendance` (`schema.prisma:1510`) — **1 registro por `(actionId, enrollmentId)`**, ou seja, 1 presença por atividade inteira, não por data | ⚠️ existe mas no nível errado |
| Matrícula da pessoa no projeto | `ProjectEnrollment` (`schema.prisma:1330`) — inclui papéis de equipe (`EQUIPE_TECNICA`, `OFICINEIRO`...) | ✅ já existe |
| Turma/Grupos dentro do projeto | `ProjectGroup` (`schema.prisma:1289`) + `ProjectEnrollmentGroupMembership` (histórico de entrada/saída) | ✅ já existe |
| Relatórios do dashboard | `DashboardService.getOverview` (`dashboard.service.ts:76`) — **só agrega por `ProjectAction`/`ProjectActionAttendance`**, nunca por `Program`/`Project`/Grupos | ❌ nada por programa/projeto hoje |
| Aba "Atendimentos" no detalhe de Pessoa | `people-detail-tabs.tsx:45` — **existe no enum da UI, mas `disabled: true` e sem componente nenhum** (`people-detail-engine-client-page.tsx:227`) | ❌ placeholder vazio |

**Conclusão central:** a estrutura de dados já tem quase tudo (profissionais,
Grupos, matrícula) — falta exatamente **uma camada**: separar "Atividade"
(o serviço recorrente, ex. Coral) de "Encontro" (a ocorrência concreta de
uma data). Hoje as duas coisas estão fundidas em `ProjectAction`, o que
impede agendar recorrência e registrar presença por data.

## 2. Modelo de dados proposto

### 2.1. `ProjectAction` passa a significar "Atividade" (sem migração de tabela)

Não é necessário renomear a tabela/model no banco (renomear é um `expand +
contract` de dois deploys, alto custo, zero ganho funcional). A mudança é
**só de rótulo**: toda a UI/labels passam a chamar isso de "Atividade" em
vez de "Ação". O model, os campos e a API continuam `ProjectAction`/
`actions`. `ActionType` (coral, violão, percussão já são hoje modelados como
`ActionType`) continua sendo a taxonomia da atividade — já está certo.

Os campos de execução única (`executedStartAt/executedEndAt`,
`completionPercent`, `executedHtml`) deixam de ser "a execução da ação" e
passam a significar **o resumo agregado da atividade** (quando começou a
rodar / quando a atividade foi encerrada como um todo) — os encontros
individuais é que carregam a execução dia a dia.

### 2.2. Novo model: `ActionOccurrence` ("Encontro")

```prisma
model ActionOccurrence {
  id            String             @id @default(uuid()) @db.Char(36)
  tenantId      String             @db.Char(36)
  actionId      String             @db.Char(36)   // a Atividade (ProjectAction)
  peopleGroupId String?            @db.Char(36)   // qual Grupos este encontro atende
  scheduledDate DateTime           @db.Date
  startTime     DateTime           // hora de início (combinada com scheduledDate na app)
  endTime       DateTime?
  status        OccurrenceStatus   @default(SCHEDULED) // SCHEDULED/DONE/CANCELED
  notes         String?            @db.Text
  recurrenceBatchId String?        @db.Char(36)   // agrupa encontros gerados na mesma leva (editar/cancelar a série)
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  tenant      Tenant              @relation(fields: [tenantId], references: [id])
  action      ProjectAction       @relation(fields: [actionId], references: [id])
  peopleGroup PeopleGroup?        @relation(fields: [peopleGroupId], references: [id])
  attendances ProjectActionAttendance[]

  @@index([tenantId, actionId])
  @@index([tenantId, scheduledDate])
  @@index([recurrenceBatchId])
}
```

- **Profissionais do encontro**: por padrão, herdados de
  `ProjectActionPeopleParticipation` da atividade (não duplicar: se a
  atividade já diz "Coral tem a professora Maria", todo encontro de Coral
  já mostra Maria sem precisar reatribuir). Uma tabela de override por
  encontro (substituição pontual) **fica como melhoria futura**, só se
  virar necessidade real — evita construir algo especulativo agora.
- **Grupos do encontro**: `peopleGroupId` aponta pra um dos Grupos já
  vinculados à atividade via `ActionPeopleGroup` (o formulário de criação
  de encontro só oferece os Grupos já associados à atividade). Isso cobre
  "os encontros são organizados por Grupos e horário": uma atividade com 2
  Grupos (ex. Coral-Infantil e Coral-Adulto) gera duas séries de encontros
  em horários diferentes.
- **Geração em lote (agendamento fácil)**: endpoint
  `POST /projects/:projectId/actions/:actionId/occurrences/bulk` recebe
  `{ peopleGroupId, startDate, endDate, daysOfWeek: ["MON","WED"], startTime, endTime }`
  (ou `frequency: "DAILY"`) e **materializa** as linhas de `ActionOccurrence`
  de uma vez, todas com o mesmo `recurrenceBatchId`. Não guardamos uma regra
  de recorrência "viva" (sem motor de RRULE) — geramos as datas concretas na
  hora de criar. Mais simples, mais fácil de editar/cancelar 1 encontro sem
  afetar os outros, e já é o padrão usado por toda ferramenta de agenda que
  não precisa de recorrência infinita.
- Cancelar/editar a série = filtrar por `recurrenceBatchId` e aplicar em
  lote (ex.: "cancelar os encontros futuros desta leva").

### 2.3. Presença migra de `ProjectAction` para `ActionOccurrence`

`ProjectActionAttendance` (schema.prisma:1510) tem hoje
`@@unique([tenantId, actionId, enrollmentId])`. Precisa passar a ser por
encontro: `@@unique([tenantId, occurrenceId, enrollmentId])`.

Isso **é mudança de schema em produção** — segue a regra do `AGENTS.md`
(só aditivo, expandir depois contrair, dois deploys):

1. **Deploy 1 (expandir)**: adicionar `occurrenceId String? @db.Char(36)`
   nullable em `ProjectActionAttendance`, com FK pra `ActionOccurrence`.
   Script de backfill: para cada `ProjectAction` que já tem presenças
   hoje, criar **um** `ActionOccurrence` representando a execução antiga
   (`scheduledDate = executedStartAt`), e apontar as presenças existentes
   pra esse encontro gerado. Zero perda de dado histórico.
2. **Deploy 2 (contrair)**: tornar `occurrenceId` obrigatório, trocar o
   `@@unique` de `(actionId, enrollmentId)` para `(occurrenceId,
   enrollmentId)`, e só então remover a leitura/escrita direta por
   `actionId` nos endpoints de presença.

### 2.4. Enum novo

```prisma
enum OccurrenceStatus {
  SCHEDULED
  DONE
  CANCELED
}
```

## 3. Mudanças de UI/UX, por módulo

- **Programas**: sem mudança estrutural. Só label — nenhuma, já está certo.
- **Projetos**: sem mudança estrutural na aba "Ações" exceto renomear pra
  "Atividades" na navegação/breadcrumb/título. Lista de atividades do
  projeto continua igual (`project-actions-manage-route-client-page.tsx`).
- **Ações → renomear para "Atividades"** em todo rótulo visível (módulo,
  breadcrumbs, botões "Nova Ação" → "Nova Atividade"). Rotas internas
  (`/actions`, `/actions/new`) podem continuar com o slug atual — mudar URL
  pública é custo alto (links salvos, favoritos) para ganho só estético;
  only o texto visível muda.
- **Nova sub-feature "Encontros"**, dentro do detalhe da Atividade (como
  hoje existe `project-action-attendances-card.tsx`, essa tela passa a
  listar **encontros** em vez de presença direta):
  - Lista de encontros (data, horário, Grupos, status, profissionais
    herdados) com calendário/lista alternável (o `web-client` já tem
    `CalendarView` reutilizável, mesmo padrão usado no Dashboard/outros
    módulos — não precisa de biblioteca nova).
  - Botão "Agendar encontros" → abre o formulário de geração em lote
    (Grupos + padrão de recorrência + horário).
  - Clicar num encontro abre a tela de presença **daquele dia** (reaproveita
    o componente de attendance já existente, só troca a chave de
    `actionId` pra `occurrenceId`).
- **Pessoa → aba "Atendimentos"** (`people-detail-tabs.tsx:45`): implementar
  o conteúdo que falta — remover `disabled: true`, criar o componente que
  busca, por pessoa: projetos matriculados (`ProjectEnrollment`) → atividades
  do projeto em que a pessoa está no Grupos-alvo → encontros/presenças dessa
  pessoa (histórico + próximos agendados). Isso dá "o registro completo dos
  serviços prestados" pedido.

## 4. Relatórios propostos

Local sugerido: não misturar com o Dashboard institucional (que é uma visão
geral do tenant) — criar relatórios **dentro do contexto de Projeto/Programa**,
reaproveitando o `GraphView`/`graph builder` que já existe no `web-client`
(usado em Pessoas, Ações etc. — é o padrão da casa, não precisa inventar
visualização nova):

| Relatório pedido | Fonte de dado | Onde expor |
| --- | --- | --- |
| Projetos realizados por programa | `Project.groupBy(['programId'])` | Detalhe do Programa, nova aba "Projetos" com contagem/lista |
| Pessoas atendidas pelo projeto | `ProjectEnrollment` filtrando `status=ACTIVE, participationKind=PARTICIPANT` por `projectId` | Detalhe do Projeto, já tem a aba Matrículas — só adicionar contador/resumo |
| Total de atividades no projeto | `count(ProjectAction) where projectId` | Detalhe do Projeto, resumo no topo |
| Total de encontros | `count(ActionOccurrence)` via join em `ProjectAction.projectId`, filtrável por período/status | Detalhe do Projeto e/ou da Atividade |

Todos esses são consultas simples (sem necessidade de nova infraestrutura de
agregação) — a única peça nova de fato é o `ActionOccurrence` para o último
item existir.

## 5. Fases sugeridas (cada uma entregável e testável isoladamente)

1. **Schema**: `ActionOccurrence` + enum + endpoints CRUD + bulk-generate.
   Sem tocar em `ProjectActionAttendance` ainda.
2. **UI de Encontros**: tela de lista/calendário + agendamento em lote,
   dentro do detalhe da Atividade.
3. **Migração de presença** (expandir → contrair, 2 deploys, conforme 2.3).
4. **Relabel "Ação" → "Atividade"** em toda a UI (mudança de texto, baixo
   risco, pode ser feita em paralelo/antes das fases de schema).
5. **Aba "Atendimentos" da Pessoa**: implementar com os dados já
   disponíveis a partir da fase 1 (projetos/atividades) e completa de verdade
   só depois da fase 3 (presença por encontro).
6. **Relatórios** (seção 4): depois que `ActionOccurrence` existir e tiver
   dado real pra contar.

## 6. Decisões que precisam do usuário antes de implementar

- **Profissional por encontro**: confirmar que "herdar da atividade, sem
  override por encontro" é suficiente pra agora (substituição pontual de
  professor fica pra depois, registrada no backlog) — ou já precisa de
  override desde o início?
- **Múltiplos Grupos por atividade com horários diferentes**: confirmar
  que o modelo "cada leva de encontros tem 1 Grupos" (uma atividade com 2
  Grupos gera 2 levas de agendamento, cada uma com seu horário) é como você
  imagina "organizados por Grupos e horário" — ou a ideia é outra (ex.: um
  mesmo encontro podendo ter mais de um Grupos simultaneamente)?
- **Renomear "Ação" → "Atividade" na URL** (`/actions` → `/activities`) ou
  manter a URL e só mudar o texto visível? (recomendo manter a URL, ver
  seção 3)
- **Onde ficam os relatórios**: dentro do detalhe de Projeto/Programa (como
  proposto) ou um módulo "Relatórios" separado, cross-projeto?
- **Dado histórico existente**: hoje provavelmente já existem `ProjectAction`
  com presença registrada (produção/uso real). O backfill da seção 2.3 cobre
  isso, mas vale confirmar antes: quantas ações/presenças já existem hoje,
  pra calibrar o script de migração.

## 7. Sobre o momento de fazer isso

Isto é uma mudança estrutural (schema novo + migração de dado existente +
retrabalho de UI em 3 módulos) — pelo `AGENTS.md`, esse tipo de trabalho é
"Parte 5 — Evolução de arquitetura", que o próprio projeto definiu como
"só depois do go-live". Hoje estamos entre a Parte 3 (fechada) e a Parte 4
(produção, ainda não iniciada — falta o projeto Railway existir). Vale
decidir com você se:

(a) isso fica registrado aqui como plano pra depois do go-live, ou
(b) você quer começar a implementar agora, à frente da Parte 4.

Nenhuma implementação começa até essa decisão.
