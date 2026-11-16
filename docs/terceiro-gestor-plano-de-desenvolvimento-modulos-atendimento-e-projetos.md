# Terceiro Gestor — Plano de Desenvolvimento

### Módulos "Atendimento" e "Gestão de Projetos" — Fases testáveis

> Base: People/PeopleGroup já implementado (hub central de pessoas, papéis e grupos com histórico via IsActive).
> Objetivo geral: tornar o registro do dia a dia (encontro, atendimento, ocorrência) tão rápido que ele deixa de ser visto como "burocracia" e passa a alimentar automaticamente todos os relatórios obrigatórios.

## Índice de implementação

Ordem de execução recomendada (dependências de cima para baixo). Cada
linha tem o que já existe hoje no código vs. o que falta — atualizar esta
tabela a cada fase concluída, com a evidência (comando + resultado) indo
para `PLAN.md`, como de costume. Legenda: `[x]` feita, `[~]` parcial (ver
coluna "Falta"), `[ ]` não iniciada.

| | Fase | O que já existe | Falta |
|---|---|---|---|
| `[x]` | **1.0 — Rename no código** (pré-requisito) | Feito em 2026-11-15 — ver evidência em `PLAN.md` | — |
| `[x]` | **1 — Estrutura básica de Projetos** | Feito em 2026-11-15 — ver evidência em `PLAN.md` | — |
| `[~]` | **2 — Registro ágil do Encontro** | Presença por participante, avaliação (nota 1-5 + observação), upload de foto — tudo já no `Meeting` (=`ActionOccorrence`) | Validar com usuário real o tempo de preenchimento (meta 3-5 min) — é teste de UX, não código novo a construir do zero |
| `[x]` | **3 — Presença Diária derivada (`DailyAttendance`)** | Feito em 2026-11-15 — ver evidência em `PLAN.md` | — |
| `[x]` | **4 — Recorrência e geração automática de agenda** | Feito em 2026-11-16 — ver evidência em `PLAN.md` | — |
| `[ ]` | **5 — Ocorrência** | nada | `Occurrence`, `OccurrencePeople`, ciclo registrada→em análise→desfecho |
| `[ ]` | **6 — Atendimento (social/psicológico)** | nada | `Attendance`, `AttendancePeople`, `Benefit`, evoluções, abertura/encerramento |
| `[ ]` | **7 — Encaminhamento** | nada | `Referral`, status com contrarreferência, dashboard de pendência |
| `[ ]` | **8 — Caso (agrupador)** | nada | `Case`, vínculo opcional em `Attendance`/`Referral`, parecer consolidado |
| `[ ]` | **9 — Relatórios por financiador** (absorve a antiga Fase R5) | nada | Motor de template por `funding_source`, relatório de metas, exportação por período |

## Status deste documento (revisão de 2026-11-15)

Este é agora **o plano mestre** para os módulos de Atendimento e Gestão de
Projetos — decisão do usuário ao revisar toda a documentação do projeto
nesta data. Ele substitui três documentos anteriores sobre o mesmo
território, movidos para `docs/historico/` (mantidos como registro do
raciocínio técnico e das decisões já tomadas, não como plano ativo):

- `docs/historico/plano-implementacao-scfv.md` (13/11) — Fases 1-3 (Encontro,
  UI, presença por encontro) **já implementadas**; Fases 4-9 superadas por
  este documento.
- `docs/historico/especificacao-completa-saas-para-ongs-de-scfv.md` (13/11).
- `docs/historico/plano-redesenho-grupos-matricula-atividades.md` (13/11) —
  Fases R1-R3 **já implementadas**; R4 e R5 dobram neste documento (ver
  "Mapeamento" abaixo).

`docs/pesquisa-de-mercado-modulo-scfv.md` continua ativo como referência —
é pesquisa regulatória (SCFV/SISC/RMA), não um plano, e alimenta as regras
de negócio mencionadas nas fases abaixo.

**Nomenclatura:** os nomes de entidade deste documento (`Meeting`,
`MeetingAttendance`, `MeetingEvaluation`, `DailyAttendance`, `Attendance`,
`AttendancePeople`, `Benefit`, `Referral`, `Occurrence`, `OccurrencePeople`,
`Case`, `Goal`/`Objective`) são a referência oficial para o trabalho ainda
não implementado (Fases 3 e 5-9). Para o que já existe no banco, ver o
mapeamento abaixo — não há rename de tabela já criada só para bater com
este texto.

### Mapeamento — o que este plano chama de X já existe no código como Y

| Neste documento | Já implementado como | Fase correspondente | Situação |
|---|---|---|---|
| `Program` | `Program` | Fase 1 | ✅ idêntico, já existe |
| `Project` (`funding_source`) | `Project` | Fase 1 | ✅ já existe (campo de fonte de financiamento a confirmar no schema real antes de assumir pronto) |
| `Activity` | `ProjectAction` | Fase 1 | ✅ rename físico no código (Fase 1.0) e relabel visual "Ação"→"Atividade" (2026-11-15) — os dois confirmados por teste real de navegador. A Fase 4 do plano SCFV antigo (relabel visual, nunca executada apesar de estar registrada como trivial) foi absorvida e fechada aqui |
| `Meeting` (Encontro) | `ActionOccurrence` | Fase 1-2 | ✅ já existe, com geração em lote por recorrência (dias da semana + período), calendário/lista, edição/cancelamento em série |
| `MeetingAttendance` | `ProjectActionAttendance` (chave por `occurrenceId`) | Fase 2-3 | ✅ já existe — presença já é por encontro, não por atividade inteira |
| `MeetingEvaluation` (nota/conceito por participante) | campo de avaliação em `ActionOccurrence`/presença (Fase R3 do plano anterior) | Fase 2 | ✅ já existe (nota 1-5 + observação por participante) |
| Planejamento/relatório/fotos do Encontro | `planHtml`/`executedHtml`/`conclusionHtml`/`photoPaths` em `ActionOccurrence` + grupo de equipe (`ActionOccurrenceTeamGroup`) | Fase 2 | ✅ já existe (Fase R3 do plano anterior) |
| `DailyAttendance` (derivada, dedup por dia) | **não existe** | Fase 3 | ❌ trabalho novo de verdade — é o único ponto real da Fase 3 |
| Geração automática de agenda anual + preview | geração em lote já existe; **preview antes de confirmar** e exceções/feriados não foram confirmados como implementados | Fase 4 | ⚠️ confirmar o que falta exatamente antes de iniciar (ver Fase 4) |
| `Attendance`/`AttendancePeople`/`Benefit`/`Referral`/`Occurrence`/`OccurrencePeople`/`Case` | **não existem** | Fases 5-8 | ❌ trabalho novo — módulo de Atendimento inteiro |
| `Goal`/`Objective` | **não existem** | Fase 1/9 | ❌ trabalho novo |

### Fase 1.0 — Rename de nomenclatura no código (pré-requisito, antes da Fase 1) `[x concluída]`

Absorvido de "Fase R4" do plano anterior: `ProjectAction`→`Activity`,
`ActionType`→`ActivityType`, `ActionOccurrence`→`Meeting` (nome adotado
deste documento, não `ActivityOccurrence` como o plano R4 original
propunha), `ProjectActionAttendance`→`MeetingAttendance`,
`ActionPeopleGroup`→`ActivityPeopleGroup` — via `@@map`/`@map` do Prisma,
sem migração de dado (a tabela física não muda de nome). Rotas HTTP
(`/actions`) continuam iguais, só o código interno/tipos do frontend
mudam de nome.

**Feito em 2026-11-15.** Backend: os 5 models renomeados via `@@map`
(tabela física preservada); `ProjectActionComment`, `ProjectActionAttachment`,
`ProjectActionPeopleParticipation` e `ActionOccurrenceTeamGroup` ficaram de
fora de propósito (não listados no escopo original da Fase R4/1.0 — seus
nomes de modelo não mudam). Find-and-replace disciplinado de
`prisma.<accessor>` e `Prisma.<Tipo>` em `actions.service.ts`,
`dashboard.service.ts`, `people-groups.service.ts`,
`project-structure.service.ts`, `prisma/seed.ts` (+ `seed.js` recompilado),
scripts de migração e specs e2e. Frontend: tipos `Api*`/`*Input`/`*Response`
e funções do cliente de API renomeadas nos 20 arquivos de
`modules/actions`/`modules/projects`/`web-client` que os usavam; nomes de
componente React e arquivos **não** foram tocados (fora do escopo — só
"tipos e código interno", não a camada de UI). Rotas HTTP não mudam.
**Correção em 2026-11-15** (achada durante teste de navegador da Fase
1): ao contrário do que foi escrito aqui originalmente, os labels
visíveis **não** diziam "Atividade" — continuavam "Ação"/"Ações" em todo
lugar. Essa frase estava errada e nunca tinha sido verificada. Relabel
textual feito na mesma sessão (pedido explícito do usuário: "se ficou
pendência na Fase 1, finalize") — ver evidência completa em `PLAN.md`.
**Evidência:** backend `tsc --noEmit -p tsconfig.build.json` → 0 erros;
`npm test` → 28 suítes/143 testes sem regressão; `npm run build` → ok;
`eslint` nos 4 arquivos de serviço tocados → 141 problemas vs. 146 na
baseline (net -5, nenhuma categoria nova). Frontend `tsc --noEmit` → 0
erros; `npm run build` → ok; `eslint` nas áreas tocadas → mesma categoria
de dívida já documentada (`react-hooks/set-state-in-effect`), nenhuma
nova. Confirmado por grep: zero referência sobrando às 5 identidades
antigas fora de `docs/historico/`, migrations (SQL não muda, é histórico) e
dois pontos pré-existentes e intencionalmente não tocados — a string
`entity: "ProjectAction"` usada em 3 lugares (seed fictício, dashboard
`ENTITY_LABELS`, filtro de aba Auditoria) não corresponde a nenhuma
gravação real de audit log hoje (nenhum código escreve esse valor fora do
seed), então não é um tipo/identificador de código — decisão de deixar
como está. Plano de teste original: ver Fase R4 em
`docs/historico/plano-redesenho-grupos-matricula-atividades.md`.

**Achado incidental, fora do escopo desta fase:**
`backend/scripts/migrate-upload-keys-to-tenant-scoped.js#migrateProjectActionPhotoPaths`
já estava quebrado desde a Fase R3 do plano anterior (2026-11-14), que
moveu `photoPaths` de `ProjectAction`/`Activity` para `ActionOccurrence`/
`Meeting` — a função continua filtrando `activity.findMany({ where: {
photoPaths: ... } })`, campo que não existe mais nesse model. Script só
roda de novo quando a reorganização de chave física (item 3.2) precisar
ser repetida num ambiente com arquivos no formato antigo (gatilho já
registrado em `docs/backlog.md`); nenhum ambiente real foi afetado até
hoje. Registrado em `docs/backlog.md` para corrigir antes desse gatilho
chegar — não corrigido aqui porque exige decidir se a função deve migrar
para `meeting.photoPaths` ou se a lógica já é redundante.

### Fase 9 (revisão) — absorve "Fase R5" do plano anterior

A Fase 9 abaixo (relatórios por financiador) e a antiga "Fase R5"
(relatórios em cascata Encontro→Atividade→Projeto) são o mesmo trabalho
descrito em dois documentos diferentes — unificadas aqui. Ver Fase R5 em
`docs/historico/plano-redesenho-grupos-matricula-atividades.md` para o
detalhe de agregação por período (mês/ano) já desenhado.

---

## 1. Dores identificadas (consolidado)

### 1.1 Visão técnica/normativa

- Multiplicidade de prestações de contas para o mesmo serviço (municipal, estadual, federal, editais como ICMS/ProAC, projetos de terceiros).
- Dependência de registro manual (papel/planilha) no nível do encontro.
- Divergência entre números internos da OSC e o SISC (federal).
- Falta de rastreabilidade entre atividade realizada e meta/objetivo do Plano de Trabalho.
- Gestão de lista de espera e fluxo com CRAS desorganizada.
- Ausência de trilha de evidência organizada para visita técnica.
- Responsável técnico sobrecarregado com compilação de dados.
- Indicadores qualitativos difíceis de agregar (sem metodologia de registro padronizada).
- Diferentes exigências de relatório por município/financiador, sem modelo único nacional.

### 1.2 Visão prática (relato de campo)

- **Dor central:** quebra no fluxo *atividade realizada → relatório entregue*. O educador está focado na atividade, não sobra tempo para registrar; o registro vira tarefa acumulada de fim de mês.
- Registro fragmentado: parte em papel, parte em planilha — sem padrão, exige "juntar tudo" manualmente.
- Atraso crônico na entrega dos relatórios obrigatórios — consequência estrutural do acúmulo, não falta de disciplina.
- Um mesmo Projeto pode ter financiamento misto (municipal + estadual + federal) ou ser projeto de terceiro dentro da OSC — cada fonte com seu próprio template e prazo de prestação de contas, mas todos contam para o Plano de Trabalho consolidado da OSC.
- Vinculação atividade↔meta/objetivo existe conceitualmente, mas não é operacionalizada no dia a dia.
- Criar a agenda anual de atividades/encontros manualmente é inviável — precisa ser feito uma vez, por recorrência.
- Frequência precisa de dois níveis: por atividade (encontro) e por permanência no serviço (dia), sem duplicar contagem.
- Situações complexas (ex.: um caso de saúde) geram múltiplos atendimentos e encaminhamentos ao longo do tempo — se não forem agrupados, perde-se a visão consolidada necessária para cobrar a rede pública.

---

## 2. Modelo conceitual consolidado

```
PEOPLE (hub central — já implementado)
 │
 ├── GESTÃO DE PROJETOS
 │     Programa → Projeto (fonte de financiamento) → Atividade (meta/objetivo vinculado,
 │     regra de recorrência) → Encontro (presença, avaliação qualitativa, fotos, pode abrir Ocorrência)
 │     Encontro → deduz automaticamente Presença Diária
 │
 └── ATENDIMENTO
       Ocorrência (origem: Encontro OU externa) ──┐
                                                    ├──> Caso (agrupador opcional, histórico consolidado)
       Atendimento (social/psicológico, N:N pessoas)┤         │
         └── Benefício (cesta básica etc.)          │         │
         └── Encaminhamento (ciclo próprio: aberto/  │         │
             em acompanhamento/encerrado, anexos) ───┘─────────┘
```

**Entidades novas a modelar:**

- `Program`, `Project` (com `funding_source`), `Activity` (com vínculo a `Goal`/`Objective`, regra de recorrência), `Meeting` (encontro), `MeetingAttendance`, `MeetingEvaluation`, `DailyAttendance` (derivada).
- `Attendance` (atendimento social/psicológico), `AttendancePeople` (N:N com papel), `Benefit`, `Referral` (encaminhamento), `Occurrence`, `OccurrencePeople`, `Case` (caso/agrupador).
- `Goal`/`Objective` (metas e objetivos do Plano de Trabalho, vinculáveis a `Activity`).

---

## 3. Fases de implementação (testáveis incrementalmente)

> Cada fase entrega algo utilizável e testável isoladamente, mesmo antes da próxima existir. A ordem prioriza o fluxo que gera a dor mais crítica primeiro: registro ágil do dia a dia.

### **Fase 0 — Pré-requisito (já concluído)**

- Módulo People / PeopleGroup funcionando, com papéis e histórico.
- ✅ Critério de teste: cadastrar pessoas com papéis diferentes (atendido, familiar, educador) e agrupá-las, com histórico de entrada/saída via IsActive.

---

### **Fase 1 — Estrutura básica de Projetos (sem recorrência ainda)** `[x concluída]`

**Objetivo:** criar manualmente a hierarquia Programa → Projeto → Atividade → Encontro, para validar o modelo de dados antes de automatizar.

- Cadastro de `Program` (ex.: SCFV).
- Cadastro de `Project`, com campo `funding_source` (municipal/estadual/federal/terceiro) e vigência.
- Cadastro de `Activity`, vinculada a um `Project`, com vínculo a `Goal/Objective` (cadastro simples de metas do Plano de Trabalho).
- Cadastro de `Meeting` (encontro) manual, vinculado a uma `Activity` e a uma data.
- Vínculo de uma turma (reaproveitar `PeopleGroup` já existente) à `Activity`.

**✅ Critério de teste:** criar 1 projeto, 1 atividade vinculada a 1 meta, e cadastrar manualmente 3 encontros numa semana, cada um puxando a lista de participantes do grupo vinculado.

**Feito em 2026-11-15.** `Program`/`Activity`/`Meeting`/turma vinculada já
existiam (ver tabela de mapeamento no topo). Os dois gaps reais:

- **`funding_source`** — decisão do usuário: **não** é campo único no
  `Project` (a dor de financiamento misto, descrita na seção 1.2, é real).
  Model novo `ProjectFundingSource` (N por `Project`: `source`
  `MUNICIPAL/ESTADUAL/FEDERAL/TERCEIRO` + `name`/`notes` livres para
  identificar o convênio/edital específico). **Decisão explícita do
  usuário registrada aqui:** esta é uma modelagem de primeira passada —
  uma fase futura precisa revisitar a estrutura para habilitar boa
  **gestão dos recursos** do projeto (valores, prazos de prestação de
  contas, template por fonte) — ver `docs/backlog.md`.
- **`Goal`/`Objective`** — modelado como **uma única entidade** `Goal`
  (`title`/`description`, por `Project`), não duas. O documento usava os
  dois nomes de forma ambígua (vocabulário do negócio, não
  necessariamente dois conceitos distintos) — decisão tomada para manter
  "cadastro simples", como o texto desta fase pede. **Sinalizar se isso
  estiver errado:** se "Objetivo" precisar ser uma sub-entidade própria
  (N objetivos por meta, por exemplo), é uma migração aditiva simples de
  fazer depois (nova tabela `Objective` com `goalId`).
- `Activity.goalId` (nullable, FK para `Goal` do mesmo `Project`) —
  valida pertencimento ao projeto antes de salvar.

**Schema:** migration `20261115120000_add_goal_and_project_funding_source`
— enum `FundingSourceType`; tabelas `ProjectFundingSource`/`Goal`; coluna
`goalId` em `ProjectAction`. **Escrita à mão** (sem Postgres acessível
nesta sessão para `prisma migrate dev` gerar automaticamente) seguindo
exatamente o estilo das migrations já existentes no repositório —
**confirmar com `npx prisma migrate dev` (ou `migrate status`) na sua
máquina antes de aplicar em qualquer ambiente**, para garantir que o SQL
bate com o schema sem drift.

**Backend:** `ProjectStructureService`/`Controller` ganham CRUD completo
de `funding-sources` e `goals` (rotas `GET/POST /projects/:projectId/
funding-sources`, `PATCH/DELETE .../funding-sources/:id`, e o mesmo para
`/goals`), reaproveitando as permissões `project-structure.*` já
existentes (mesmo nível de `people-groups`, sem chave nova). `actions.service.ts`
(`createProjectAction`/`updateProjectAction`) valida `goalId` contra o
projeto (`ensureGoalBelongsToProject`) e inclui `goal: { id, title }` no
retorno da Atividade. Seed (`prisma/seed.ts`) ganhou 1 meta e 2 fontes de
financiamento de exemplo no "Projeto Música Manhã", com a atividade
"Ensaio dos meninos da percussão" já vinculada à meta.
**Evidência:** `npx prisma validate` + `npx prisma generate` → ok; `tsc
--noEmit -p tsconfig.build.json` → 0 erros; `npm test` → 28 suítes/143
testes sem regressão; `npm run build` → ok; `npm run build:seed` → ok;
`eslint` nos arquivos novos/tocados → 0 problemas novos (mesma baseline
de 141 nos 4 services já medida na Fase 1.0).

**Frontend:** tipos `ApiGoal`/`ApiProjectFundingSource` +
`GoalInput`/`ProjectFundingSourceInput` em `modules/projects/api/types/
structure.ts`; funções de API em `project-structure.ts`; duas novas
seções autocontidas (`ProjectGoalsSection`/`ProjectFundingSourcesSection`,
mesmo padrão de `ActionOccurrencesSection` — fetch próprio via
`useAuth()`, sem acoplar ao engine) plugadas como abas "Metas" e
"Financiamento" no detalhe do Projeto; seletor de Meta (opcional) no
formulário de criação/edição da Atividade (`action-create-form-section.tsx`).
**Evidência:** `tsc --noEmit` → 0 erros; `npm run build` → ok; `eslint`
nos arquivos novos → 4 problemas, todos `react-hooks/set-state-in-effect`
(a mesma dívida já tolerada em todo o projeto, nenhuma categoria nova).

**Testado manualmente em 2026-11-15** (Postgres local disponível depois
que o usuário religou o WSL). `npx prisma migrate dev` aplicou a
migration escrita à mão **sem detectar nenhum drift** — confirma que o
SQL bateu exatamente com o schema. `npm run db:seed` ok. Teste real de
navegador (Playwright + Chromium já em cache, login real
`admin@seed.local`, sem mock): aba "Metas" do Projeto mostra a meta do
seed e cria uma nova via diálogo; aba "Financiamento" mostra as 2 fontes
do seed com o badge certo (Municipal/Terceiro); formulário de Atividade,
ao selecionar o Projeto, popula o seletor "Meta (Plano de Trabalho)" com
as metas reais daquele projeto; zero erro no console do navegador nas 8
telas visitadas. Dados de teste (3 metas fictícias criadas pelo teste)
removidos via API depois, banco restaurado com `npm run db:seed`.
**Achado durante o teste, corrigido na documentação:** o mapeamento da
Fase 1.0 afirmava que o rótulo de UI já dizia "Atividade" — isso nunca
tinha sido verificado e está **errado** (confirmado nas telas: ainda é
"Ação"/"Ações" em todo lugar). Corrigido acima na tabela de mapeamento;
registrado como pendente em `docs/backlog.md`.

---

### **Fase 2 — Registro ágil do Encontro (o coração da dor prática)** `[~ parcial]`

**Objetivo:** validar a tela de registro rápido, antes de qualquer automação de agenda — é a feature que resolve a maior dor.

- Tela de "Relatar Encontro": lista de presença pré-carregada (toque único por pessoa), chips de atividade realizada, campo de observação curta opcional, avaliação rápida por participante (nota/conceito simples).
- Upload opcional de foto como evidência.
- Lançamento de `MeetingAttendance` e `MeetingEvaluation`.

**✅ Critério de teste:** medir o tempo real de um educador preenchendo um encontro simulado — meta: 3 a 5 minutos. Validar com usuário real (você ou outro educador) antes de seguir.

---

### **Fase 3 — Presença Diária derivada** `[x concluída]`

**Objetivo:** resolver a duplicidade de contagem (10 atividades no dia ≠ 10 presenças).

- Regra automática: ao salvar presença em qualquer `Meeting` do dia, verificar/criar `DailyAttendance` única por pessoa/data.
- Relatório simples: frequência por atividade vs. frequência de permanência no mês.

**✅ Critério de teste:** simular um atendido em 3 atividades no mesmo dia → deve gerar 3 registros de presença por atividade, mas 1 único registro de presença diária.

**Feito em 2026-11-15,** a pedido explícito do usuário ("implemente a
fase 3, os testes vou fazer depois"). **Escopo:** `DailyAttendance` é
**por pessoa/dia** (`tenantId`+`personId`+`date`), **não** por projeto —
decisão própria registrada aqui para confirmação futura, já que o texto
desta fase só diz "por pessoa/data", sem mencionar projeto; se depois
for preciso saber a presença diária *dentro de um projeto específico*
(em vez de "em qualquer serviço da instituição"), isso é uma migração
aditiva simples (adicionar `projectId` à tabela).

**Backend:** model `DailyAttendance` (migration
`20261115172019_add_daily_attendance`, aplicada com `prisma migrate dev`
contra Postgres real, sem drift). Regra de sincronização
(`syncDailyAttendanceForPersonDate`) **reavalia do zero** a cada escrita
— conta quantos `MeetingAttendance` com `status=PRESENT` existem para a
pessoa naquela data (em qualquer `Meeting`/atividade) e faz
upsert/remove conforme o resultado, em vez de incrementar/decrementar um
contador. Isso cobre corretamente o caso de corrigir uma presença de
`PRESENT` para `ABSENT`: se não sobrar nenhuma outra presença no dia, o
registro de presença diária é removido, não fica "fantasma". Conectado
nos 3 pontos que escrevem/apagam `MeetingAttendance`:
`upsertProjectActionAttendances` (fluxo principal), `deleteActionOccurrence`
e `deleteProjectAction` (evita registro órfão quando um encontro ou uma
atividade inteira é excluída). Relatório simples:
`GET /actions/attendance-summary/:personId?month=AAAA-MM` devolve
`{ activityAttendances, dailyAttendances }` comparando os dois números
no mês.
**Evidência:** `npx prisma migrate dev` → aplicou sem drift; `tsc
--noEmit -p tsconfig.build.json` → 0 erros; `npm test` → 28 suítes/143
testes sem regressão; `npm run build` → ok; `eslint` em
`actions.service.ts`/`actions-list.controller.ts` → 131 problemas vs.
132 na baseline (medida via `git stash`), net -1, nenhuma categoria
nova; DTO novo → 0 problemas. **Testado de ponta a ponta contra Postgres
real** (não só unitário) com backend de pé e dados do seed: criados 3
encontros em 3 atividades diferentes no mesmo dia (2026-04-01), marcada
presença `PRESENT` da mesma pessoa nos 3 → relatório confirmou
`activityAttendances: 3, dailyAttendances: 1` (bate exatamente com o
critério de teste da fase); corrigida 1 das 3 para `ABSENT` → `dailyAttendances`
continuou `1` (ainda sobravam 2 `PRESENT`); corrigidas as 2 restantes
para `ABSENT` → `dailyAttendances` caiu para `0`; marcada `PRESENT` de
novo e excluído o encontro (única presença do dia) → `dailyAttendances`
voltou a `0`, confirmando o gancho de exclusão. Dados de teste
removidos via API ao final; banco restaurado com `npm run db:seed`.
Seed também ganhou 4 registros de `DailyAttendance` de exemplo,
coerentes com as presenças `PRESENT` já existentes no seed (Projeto
Música Manhã e Apoio às Famílias).
**Não construído nesta fase, de propósito:** nenhuma tela de frontend
para o relatório — a fase pede "relatório simples" e o critério de
teste é inteiramente sobre o comportamento de dados, testável por API;
se quiser uma tela, é um próximo passo separado, de baixo esforço
(a API já existe).

---

### **Fase 4 — Recorrência e geração automática de agenda** `[x concluída]`

**Objetivo:** viabilizar a criação da estrutura anual em 1 dia de trabalho.

- Regra de recorrência na `Activity` (dias da semana, horário, vigência, exceções/feriados).
- Geração automática de `Meeting` a partir da regra, com tela de revisão/preview antes de confirmar.
- Edição pontual de um `Meeting` já gerado (cancelar, trocar educador, remarcar) sem afetar a série.

**✅ Critério de teste:** criar 1 atividade semanal com vigência de 1 ano → gerar automaticamente ~48 encontros, remover 3 datas de feriado no preview, confirmar, e depois editar 1 encontro pontual sem afetar os demais.

**Feito em 2026-11-16.** Dos 3 itens da fase, geração em lote por recorrência
(dias da semana + período) e edição/cancelamento pontual (via
`recurrenceBatchId`) **já existiam** desde a Fase 1-2 do plano SCFV
anterior — confirmado por investigação antes de codificar. Os 2 gaps
reais identificados no índice deste documento, resolvidos agora:

- **Preview antes de confirmar** — não existia (o endpoint de geração em
  lote já gravava direto no banco). Novo endpoint
  `POST .../occurrences/bulk/preview`, que roda as mesmas validações e o
  mesmo `generateOccurrenceDates` do endpoint de criação (nenhuma lógica
  de data duplicada), mas só retorna as datas calculadas, sem persistir.
- **Exceções/feriados** — decisão de design: em vez de um calendário de
  feriados à parte (modelo/cadastro novo), a exclusão acontece **dentro
  do próprio fluxo de preview**: o usuário vê a lista de datas geradas e
  desmarca manualmente as que não quer (feriado, ponto facultativo,
  qualquer motivo) antes de confirmar. Campo novo `excludedDates?: string[]`
  no DTO de criação em lote — o backend filtra essas datas da lista antes
  de criar, então "o que o preview mostrou, menos o que foi desmarcado" é
  exatamente o que é criado (sem recalcular nada no passo de confirmação).
  Decisão registrada para o usuário confirmar: isso cobre o caso de uso
  descrito no plano (remover feriados pontuais ao gerar a agenda), mas não
  é um calendário de feriados reaproveitável entre atividades — se isso
  for necessário no futuro, é uma feature nova à parte (ver
  `docs/backlog.md`).

**Backend:** `PreviewActionOccurrencesDto` (`startDate`/`endDate`/
`daysOfWeek`) e `previewActionOccurrences` em `actions.service.ts`
(mesma validação de período/limite de 200 do bulk-create, sem
`peopleGroupId`/`teamPeopleGroupIds` — preview não precisa validar
vínculo de grupo, só calcular datas). `BulkCreateActionOccurrencesDto`
ganhou `excludedDates?: string[]`; `bulkCreateActionOccurrences` filtra
as datas geradas por esse conjunto antes de aplicar o limite de 200 e
criar — excluir todas as datas geradas vira `400` com mensagem
específica ("Nenhuma data restou apos remover as datas excluidas"), não
um `200` vazio. Rota nova:
`POST /projects/:projectId/actions/:actionId/occurrences/bulk/preview`,
mesma permissão `actions.create` do bulk-create (sem chave nova).
**Evidência:** `tsc --noEmit -p tsconfig.build.json` → 0 erros; `npm
test` → 28 suítes/143 testes sem regressão; `eslint` nos 3 arquivos
tocados (`actions.service.ts`, `project-actions.controller.ts`,
`create-action-occurrence.dto.ts`) → 138 problemas, idêntico à baseline
medida via `git stash` (nenhum problema novo).

**Frontend:** `BulkScheduleOccurrencesDialog`
(`action-occurrences-section.tsx`) ganhou um segundo passo (`step: "form"
| "preview"`) — o botão "Agendar" virou "Ver datas geradas" (chama
`previewBulkMeetings`); a etapa de preview lista cada data com checkbox
(marcada por padrão) e dia da semana entre parênteses, contador "N de M
data(s) selecionada(s)" e botão "Confirmar e agendar (N)" com a contagem
ao vivo; "Voltar" retorna ao formulário sem perder os campos já
preenchidos. Ao confirmar, `bulkCreateMeetings` recebe `excludedDates`
com as datas desmarcadas. Tipos/funções novos: `PreviewMeetingsInput`/
`PreviewMeetingsResponse`, `previewBulkMeetings` (`occurrences.ts`).
**Evidência:** `tsc --noEmit` → 0 erros; `npm run build` → ok; `eslint`
no arquivo tocado → 3 problemas, idêntico à baseline medida via `git
stash` (mesma categoria já tolerada em todo o projeto,
`react-hooks/set-state-in-effect`, nenhum problema novo).

**Testado de ponta a ponta contra Postgres real**, via API direta e via
navegador real (Playwright + Chromium em cache, login real
`admin@seed.local`, backend e frontend de pé): preview de uma atividade
semanal (segunda-feira) de 2027-01-01 a 2027-12-31 devolveu exatamente
52 datas; excluídas 3 (simulando feriados) e confirmado → `created: 49`
(bate com o critério de teste: "~48 encontros, remover 3 datas de
feriado, confirmar"), nenhuma das 3 datas excluídas presente no
resultado. Testado também o caso de erro: período invertido → `400`;
excluir todas as datas geradas antes de confirmar → `400` com a
mensagem nova, não um lote vazio. No navegador: tela de preview mostra
"52 de 52 data(s) selecionada(s)", desmarcar 3 datas atualiza o contador
ao vivo para "49 de 52" e o botão para "Confirmar e agendar (49)";
depois de confirmar, a lista de Encontros da atividade mostra o primeiro
encontro em 25/01/2027 (a 4ª segunda-feira — as 3 primeiras ficaram de
fora, como esperado) e o toast "49 encontro(s) criado(s)"; zero erro no
console em todas as telas visitadas. Edição pontual sem afetar a série
não foi re-testada nesta sessão por já ter evidência própria das Fases
1-2 do plano SCFV anterior (mecanismo inalterado: `recurrenceBatchId`
e `PATCH .../occurrences/:occurrenceId` continua por registro
individual). Todos os 49 encontros de teste e os 49 de uma rodada
anterior via API (102 no total) foram excluídos via API ao final;
atividade de teste ("Ensaio dos meninos da percussao") confirmada sem
nenhum encontro residual (`GET .../occurrences` → `total: 0`); nenhum
dado de seed foi alterado (projeto "Projeto Musica Manha" confirmado com
`startsAt`/`endsAt`/`updatedAt` idênticos ao estado pré-teste).

---

### **Fase 5 — Ocorrência** `[ não iniciada]`

**Objetivo:** permitir registro rápido de fatos durante a atividade, com desfecho decidido depois.

- Cadastro de `Occurrence`, vinculável a N pessoas (papel: envolvido/testemunha), com origem opcional em um `Meeting` ou registrada de forma independente (demanda externa).
- Status: registrada → em análise → desfecho definido.
- Campo de desfecho (texto) e vínculo opcional a um `Attendance` gerado a partir dela.

**✅ Critério de teste:** abrir 1 ocorrência durante um encontro simulado (2 pessoas envolvidas), depois abrir separadamente 1 ocorrência externa (sem encontro), e evoluir ambas até "desfecho definido".

---

### **Fase 6 — Atendimento (social/psicológico)** `[ não iniciada]`

**Objetivo:** módulo de prontuário técnico, com controle de abertura/encerramento.

- Cadastro de `Attendance`: tipo, data, profissional, N:N com pessoas (papéis: atendido principal, atendido secundário, familiar), status aberto/encerrado, registros de evolução múltiplos.
- Origem opcional: espontâneo, decorrente de `Occurrence`.
- Feature de `Benefit` (cesta básica etc.) vinculada ao atendimento.

**✅ Critério de teste:** abrir 1 atendimento psicológico com a criança + a mãe, registrar 2 evoluções em datas diferentes, lançar 1 benefício (cesta básica), e encerrar o atendimento.

---

### **Fase 7 — Encaminhamento** `[ não iniciada]`

**Objetivo:** ciclo de vida independente, com alertas de pendência.

- Cadastro de `Referral`, vinculado a um `Attendance` de origem: tipo, rede de destino, status (aberto/em acompanhamento/encerrado), anexos, relato de desfecho.
- Dashboard simples: contagem de encaminhamentos abertos, tempo médio de fechamento.

**✅ Critério de teste:** abrir 1 encaminhamento a partir de um atendimento, deixá-lo "aberto" por simulação de 30 dias, depois encerrar sem solução, abrir um segundo encaminhamento para a mesma situação, e verificar se o dashboard reflete corretamente a contagem.

---

### **Fase 8 — Caso (agrupador consolidado)** `[ não iniciada]`

**Objetivo:** amarrar múltiplos atendimentos/encaminhamentos de uma mesma situação, para visão histórica e advocacy junto à rede.

- Cadastro de `Case`: título/resumo, status, N:N com pessoas.
- Campo opcional `case_id` em `Attendance` e `Referral`.
- Parecer consolidado no encerramento do Caso.
- Relatório: "Caso X gerou N atendimentos e M encaminhamentos, com desfecho Y."

**✅ Critério de teste:** recriar o cenário da "menina com situação de menstruação" — 2 atendimentos, 2 encaminhamentos (1 sem resposta), tudo vinculado ao mesmo `Case`, e gerar o relatório consolidado a partir dele.

---

### **Fase 9 — Relatórios e templates por financiador** `[ não iniciada]`

**Objetivo:** fechar o ciclo — transformar os dados já capturados nas fases anteriores em saída formatada.

- Motor de template de relatório configurável por `funding_source` (municipal/estadual/federal/terceiro), puxando dados agregados de `Meeting`, `DailyAttendance`, `MeetingEvaluation`, `Attendance`, `Referral`.
- Relatório de cumprimento de metas (via vínculo `Activity` ↔ `Goal/Objective`).
- Exportação por período (mensal/quadrimestral/semestral/anual) conforme exigência do financiador.

**✅ Critério de teste:** gerar 1 relatório mensal completo de um projeto fictício com dados das fases 1-8, no formato de um template municipal e de um template de edital estadual, comparando se os números batem entre si.

---

## 4. Observação sobre ordem de prioridade

A ordem acima prioriza **resolver a dor prática primeiro** (Fases 1-4, registro ágil e agenda) antes de avançar para Atendimento (Fases 5-8), porque é onde está o maior ganho imediato de adoção pelos educadores. Os relatórios (Fase 9) vêm por último de propósito: só fazem sentido quando os dados de origem já estão sendo capturados corretamente — testar relatório antes disso só revelaria problemas no dado de entrada, não no relatório em si.
