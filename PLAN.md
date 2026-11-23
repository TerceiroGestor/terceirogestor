# PLAN.md — Terceiro Gestor

Só o que está em andamento. Plano completo: `docs/Terceiro Gestor — Plano de
Revisão e Produção.md`. Regras do projeto: `AGENTS.md`. Auditoria de riscos
(Parte 3 detalhada, tarefa por tarefa): `docs/auditoria-riscos.md`.

## Seed de homologação, Fase 2 - Atendimentos/Ocorrências (2026-11-23)

Continuação da Fase 1 (Pessoas), a pedido do usuário: histórico de 3 anos
(2024, 2025, 2026) de `Attendance`/`Occurrence` em cima dos 120 atendidos
ativos gerados na Fase 1, pelo menos ~15 `Attendance` ("atendimentos") por
ano por atendido ativo, mais `Occurrence` ("ocorrências") esporádicas.
Fora de escopo de propósito (número fixo "120 atendidos" pedido pelo
usuário): atendidos desligados/em espera não ganham histórico nesta
rodada; `meetingId` sempre nulo (Fase 4/Encontros ainda não existe).

**Novo: `backend/prisma/seed/attendances-occurrences-fase2.ts`**, chamado
por `seed.ts` depois da Fase 1 - consome o `PeopleFase1Result` (em vez de
IDs fixos). `people-fase1.ts` ganhou 2 campos novos no retorno pra isso:
`familiaresByAtendido` (familiar → atendido(s) vinculado(s), construído a
partir dos `relationPlans` já calculados na Fase 1) e
`householdSiblingsByAtendido` (atendidos que moram no mesmo household,
pra um segundo atendido no mesmo caso - `ATENDIDO_SECUNDARIO`).

**Geração, por atendido ativo (120) × ano (2024-2026, 2026 limitado a
"hoje"):**
- `Occurrence`: 25% de chance por atendido/ano (título/descrição de um
  pool de 10 cenários realistas - conflito, falta recorrente,
  comportamento agressivo etc.), status sorteado pela "idade" do registro
  (recente → REGISTRADA/EM_ANALISE, antigo → DESFECHO_DEFINIDO com
  `outcomeNotes`), `OccurrencePeople` com o atendido (ENVOLVIDO) e 30% de
  chance de testemunha (familiar vinculado ou funcionário).
- `Attendance`: 13-18 por ano (média ~15,5, "pelo menos ~15" pedido),
  tipo SOCIAL/PSICOLOGICO (peso 65/35) com profissional sorteado do pool
  certo (`assistentesSociais`/`psicologas` da Fase 1), status
  ABERTO/ENCERRADO pela idade do registro (só os mais recentes ficam
  abertos), `closingNotes` quando encerrado. 40% das `Occurrence` geram
  1 `Attendance` extra de acompanhamento (`occurrenceId` setado, poucos
  dias depois). `AttendancePeople`: atendido sempre (ATENDIDO_PRINCIPAL),
  40% de chance de um familiar vinculado (FAMILIAR), 8% de chance de um
  atendido do mesmo household (ATENDIDO_SECUNDARIO).
- `AttendanceEvolution`: 1-3 por `Attendance`, datadas entre a data do
  atendimento e o encerramento (ou "hoje", se ainda aberto).
- `AttendanceBenefit`: 12% de chance de 1 por `Attendance` (cesta básica,
  kit de higiene etc.).

**Volumes gerados** (confirmados rodando o seed de verdade contra o
Postgres local, não só lendo o código): 102 `Occurrence` (88
DESFECHO_DEFINIDO, 12 EM_ANALISE, 2 REGISTRADA), 5576 `Attendance`
(~1850/ano, 13-18 por atendido/ano confirmado por query direta - mínimo
observado 13 -, 5514 ENCERRADO / 62 ABERTO), 11164 `AttendanceEvolution`,
682 `AttendanceBenefit`. Nenhuma referência órfã (`Attendance.occurrenceId`
→ `Occurrence.id` confirmado por query direta).

**Evidência:** `tsc --noEmit -p tsconfig.build.json` (app principal,
`prisma/**/*.ts` fora desse projeto de propósito, igual Fase 1) → 0
erros; `npm run build:seed` → compila sem erro, sem pasta aninhada;
`npm run db:seed` rodado de verdade contra o Postgres local → sucesso,
contagens pós-seed confirmadas por query direta (ver acima); `npm test`
→ 30 suítes/159 testes sem regressão. Fase 3 (Programas/Projetos/
Atividades) e Fase 4 (Encontros) pendentes - próximas rodadas.

## Seed de homologação, Fase 1 - Pessoas (2026-11-22)

Usuário pediu um seed grande e realista (Faker) pra testar todos os
módulos, em 4 fases: 1) Pessoas, 2) Atendimentos/Ocorrências, 3)
Programas/Projetos/Atividades, 4) Encontros. Esta rodada implementa só a
Fase 1.

**Decisão de escopo:** o `seed.ts` antigo tinha um bloco estático único
(Pessoas → Programas → Projetos → Atividades → Encontros → AuditLog, ~650
linhas) referenciando `people[N]` por índice fixo. Como a Fase 1 troca o
array de Pessoas inteiro por um gerado aleatoriamente, esse bloco
downstream ficaria com índices inexistentes - removido por completo (não
dava pra manter "funcionando pela metade"). Fases 2-4 recriam esse
histórico nas próximas rodadas, consumindo o resultado tipado que a Fase
1 devolve (`PeopleFase1Result` - IDs por categoria: atendidos ativos/
desligados/em espera, familiares, equipe, + mapa dos 12 grupos) em vez de
IDs fixos.

**`@faker-js/faker` adicionado como dependência de desenvolvimento**
(`fakerPT_BR`, `faker.seed(20260101)` fixo - reprodutível a cada
`db seed`, mesma convenção de IDs fixos do resto do projeto).

**Novo: `backend/prisma/seed/`** (3 arquivos, chamados por `seed.ts`):
- `faker-helpers.ts` - instância do Faker, gerador de CPF com dígito
  verificador real (mesmo algoritmo de `src/core/utils/cpf.ts`), RG/NIS/
  CNS (sem dígito verificador - o backend não valida esses, só tamanho),
  endereço (pool fixo de bairros de uma única região - uma organização
  atende uma região, não o Brasil inteiro), telefone, pickers com peso.
- `pii-crypto-for-seed.ts` - cópia deliberada (não import) das 3 funções
  puras de `src/core/pii/pii-crypto.ts`. **Achado:** `build:seed` compila
  `prisma/seed.ts` como arquivo único sem tsconfig próprio (ver
  `package.json`); um import de **valor** (não só tipo) de fora de
  `prisma/` faz o `tsc` recalcular o rootDir pra `backend/` inteiro e
  aninhar a saída (`prisma/prisma/seed.js`, `prisma/src/...`) em vez de
  gerar `prisma/seed.js` no lugar esperado por `prisma.seed`
  (`package.json`) - por isso a cópia local, com comentário explicando o
  motivo pra não "corrigir" de volta um dia achando que é redundante.
  `import type` de `src/generated/prisma` (só tipos dos models/enums)
  continua são, não aninha nada - confirmado testando.
- `people-fase1.ts` - o gerador: Person + 7 sub-entidades (contato,
  Household/HouseholdProfile/HouseholdMember, documentos sensíveis
  **criptografados de verdade** via `pii-crypto-for-seed.ts`, financeiro,
  saúde, medicação, escolaridade, reclusão), vínculos familiares
  bidirecionais (`PersonRelation`, tipo coerente com o sexo do familiar -
  achado corrigido depois do 1º teste, "Pai"/"Mãe" sorteados batendo com
  `sex`) e os 12 `PeopleGroup` (6 ciclos C1-3 manhã/tarde + Familiares/
  Funcionarios/Voluntarios/Oficineiros/Parceiros/Doadores).

**Volumes gerados** (confirmados rodando o seed de verdade, não só lendo
o código): 459 Pessoas - 120 Atendidos ativos + 30 desligados (com
`departureReason`) + 50 em espera, 200 Familiares, 15 Funcionários + 10
Parceiros + 10 Voluntários + 10 Oficineiros + 10 Doadores + 2 Assistentes
Sociais + 2 Psicólogas (como Funcionário + tag). 6 ciclos com 20
atendidos ativos cada (≥15 pedido). 400 vínculos familiares (200 pares ×
2 direções), famílias que "moram junto" compartilham o mesmo
`Household`/endereço (confirmado por query direta). 459 documentos
sensíveis criptografados (decriptografia testada - volta exatamente o
CPF/RG/NIS/CNS gerado). ~230 lançamentos financeiros, 111 condições de
saúde, 78 medicações (correlacionadas com quem tem condição de saúde),
371 registros de escolaridade, 10 de reclusão.

**Evidência:** `tsc --noEmit -p tsconfig.build.json` (app principal,
`prisma/**/*.ts` fica fora desse projeto de propósito, igual já era) → 0
erros; `npm run build:seed` → compila sem erro, `prisma/seed.js` no lugar
certo (confirmado - sem pasta aninhada); `npm run db:seed` rodado de
verdade contra o Postgres local → sucesso, contagens pós-seed confirmadas
por query direta (ver acima) batendo com o pedido do usuário. Fases 2
(Atendimentos/Ocorrências), 3 (Programas/Projetos/Atividades) e 4
(Encontros) pendentes - próximas rodadas.

## Fase 5 (revisão) - Motor de abas único com visual "fichário" + ícones pra todos os módulos, People migrado pro motor genérico (2026-11-22)

Usuário revisou a decisão da rodada anterior (manter o sistema de abas
próprio de People, separado do genérico) e pediu o oposto: mesclar os
dois visualmente (ícones + "fichário" - abas que parecem parte física da
página, não botões flutuantes) **só no motor único e compartilhado**
(`DetailTabsRenderer`), e migrar People pra usá-lo de verdade - sem
perguntas, decisões tomadas agora.

**Motor compartilhado (`web-client/`, afeta TODOS os módulos com abas -
Projects, Programs, Pantry, Deposit, Attendances, Occurrences, People-Groups,
Actions):**
- `registry/types.ts` - `DetailTabTemplate` ganhou `icon?: React.ReactNode`
  e `disabled?: boolean | (context) => boolean` (aba visível mas sem
  clique, caso do "Atendimentos" de People - "em breve", módulo ainda não
  ligado); `mainTab` ganhou `icon?` também, pra a 1ª aba (quando é o
  `main`/formulário principal, não uma `tabTemplates`) também ter ícone.
- `DetailShellEngine.tsx` - novas props `activeTab`/`onActiveTabChange`
  (controla a aba ativa de fora - só People usa, pra sincronizar com
  `?tab=` na URL; todo o resto continua descontrolado via
  `defaultValue`, sem mudança de comportamento).
- `ModulePrimitives.tsx` - `MODULE_TABS_LIST_CLASS_NAME`/
  `MODULE_TAB_TRIGGER_CLASS_NAME` redesenhados pro visual "fichário": só
  a aba ATIVA perde a borda inferior e ganha `-mb-px` (sobrepõe 1px da
  linha de base do container, mesma cor do conteúdo abaixo - ilusão de
  "parte da página"); abas inativas mantêm a borda, como se estivessem
  recuadas atrás da aba ativa num fichário de verdade.
- `DetailLayoutSections.tsx` - `DetailTabsRenderer` ganhou `value`/
  `onValueChange` opcionais (controlado só quando os dois vêm, senão
  `defaultValue` como sempre), renderiza `tab.icon` antes do label, aplica
  `tab.disabled`. Extraído `ScrollableTabsRow` (novo, scroll horizontal +
  setas quando as abas não cabem na largura - só People tinha isso,
  5 arquivo próprio) - agora é parte do motor, qualquer módulo com abas
  suficientes ganha de graça.

**People migrado pro motor genérico de verdade** (não só visual - a
decisão arquitetural da rodada anterior foi revertida):
`people-detail-layout-contract.tsx` trocou a composição manual (`Tabs`
próprio + `PeopleDetailTabs` + `PeopleDetailContent`) por `mainTab`
("Dados básicos", ícone `IdCard`) + `tabTemplates` (as outras 10 abas,
cada uma com o ícone que já existia em `people-detail-tabs.tsx` - Contatos/
Endereço/Documentos sensíveis/Família/Financeiro/Saúde/Medicação/
Escolaridade/Reclusão/Atendimentos, essa última com `disabled: true`).
`people-detail-tabs.tsx` e `people-detail-content.tsx` apagados (sem uso
restante, confirmado por grep). `FamilyRelationsProvider` (contexto
compartilhado por Família/Financeiro/Endereço) subiu de dentro do `main`
pra envolver `<DetailShellEngine>` direto na engine page, já que agora
cada aba é renderizada de forma independente pelo motor genérico, não
mais todas filhas de uma árvore JSX só. Sincronização da aba ativa com
`?tab=` na URL preservada via as novas props `activeTab`/
`onActiveTabChange` (sem isso, a convenção de compartilhar link direto
pra uma aba específica de uma Pessoa se perderia).

**Evidência:** `tsc --noEmit` → 0 erros; `eslint` em todos os arquivos
tocados (`registry/types.ts`, `DetailShellEngine.tsx`,
`DetailLayoutSections.tsx`, `ModulePrimitives.tsx`,
`people-detail-layout-contract.tsx`, `people-detail-engine-client-page.tsx`)
→ só a categoria já tolerada (`react-hooks/set-state-in-effect` e outras
do mesmo grupo, todas pré-existentes e fora do range editado, confirmado
por `git diff --unified=0`); `npm run build` → sucesso, todas as rotas
geradas sem erro, incluindo as de People. Teste manual no navegador ainda
pendente - mudança visual em componente compartilhado por todos os
módulos, merece confirmação visual antes de fechar.

## Fase 5 - People: tabela, Detail, relations e convenção de criar/editar (2026-11-22)

Usuário pediu pra seguir pra Fase 5 (People) sem pausar pra perguntas,
aplicando a convenção completa: tabela com coluna principal fixada +
coluna com limite de tamanho/tooltip + scroll só na área da tabela;
Metadata padrão; Detail com header sem informação e abas com padding;
relation sempre com `PainelSearch` completo (busca+colunas+filtro, depois
TypeView+Novo); criar sempre em diálogo com os campos obrigatórios,
editar clicando na linha leva pro Detail.

**Decisão arquitetural (a pergunta que a Fase 5 deixou aberta - ver
entrada "Fase 3 da padronização... People" de 2026-11-21): mantida a barra
de abas própria de People** (`PeopleDetailTabs`, com scroll horizontal por
setas pra caber as 11 abas), em vez de migrar pra `tabTemplates`/
`DetailTabsRenderer` genérico. Investigação (`DetailRelationTablePanel.tsx`)
mostrou que esse painel **já é** `RelationListHost` + `ListView` por baixo
(só trocava `TableView`, um wrapper fino, no meio) - a convenção de
relation podia ser aplicada inteira sem tocar no motor de abas. Migrar pro
genérico exigiria recriar o scroll-com-setas (que o genérico não tem hoje,
por nenhum outro módulo ter 11 abas) dentro dele - risco maior sem
ganho real, já que todo o resto da convenção (tabela, Metadata, diálogo de
criar) é independente de qual motor de abas renderiza o conteúdo.

**1) Tabela (as 7 relations que usam `DetailRelationTablePanel` - Contatos,
Família, Financeiro, Saúde, Medicação, Escolaridade, Reclusão):**
`DetailRelationTablePanel.tsx` trocou `TableView` por `ListView` direto
(mesma dupla causa do bug de Pantry/Deposit desta sessão: `TableView` tinha
seu próprio `overflow-x-auto`, duplicando o container de scroll com o do
`ListView`, quebrando sticky) e passou a repassar `columns`/
`flushToolbar`/`stickyHeaderOffsetPx={117}` pro `RelationListHost` - isso
sozinho destrava o botão "Colunas" (não aparecia antes, `TableView` forçava
`showColumnVisibilityButton={false}` sem alternativa) e o scroll contido
nos 7 painéis de uma vez, em 1 arquivo compartilhado. Confirmado que
Attendances também usa esse componente (3 relations) - `tableMinWidthClassName`
removido dos 3 call sites lá também (prop que não existe mais, media de
largura mínima abandonada a favor do limite de largura por coluna, igual
ao resto do projeto desde a correção de Pantry/Deposit).
Nos 7 painéis: trocado o `truncate()` manual (reimplementado em cada
arquivo, limite de caracteres arbitrário e sem tooltip) por
`TruncatedTextCell` em toda coluna de texto livre; a coluna principal de
cada tabela ganhou `tableInitialColumnPinning={{ left: [...] }}` (fixada à
esquerda, antes só a coluna de ações à direita fixava).

**2) Metadata:** já estava correto (confirmado por leitura - `tags`/
`notes` com `richText`+`mentionUsers`/`attachments`/`tabOrder`), igual o
usuário já esperava. Nenhuma mudança.

**3) Detail - header sem informação + padding no corpo da aba:** o
`header.slot` de People (Status/Tipo/Nascimento/Cadastro) duplicava campos
que já existem na aba "Dados básicos" (Status/Tipo/Nascimento) - mesma
regressão já corrigida em Encontro (2026-11-21) - removido por completo
(`people-detail-layout-contract.tsx`); "Cadastro" (criado em) não tinha
outro lugar, mas fica disponível via aba Atividade/Auditoria, igual todo
resto do projeto não duplica esse dado no formulário principal.
`PeopleDetailContent.tsx`: as 4 abas de formulário simples (Dados básicos/
Endereço/Documentos + a antiga faixa de texto solta de Contatos, removida)
ganharam `px-4 py-4`; as 7 abas de relation ficam só `py-4` (sem `px-4` -
a própria barra de busca do `RelationListHost`, `flushToolbar`, já tem
`px-4 py-4` encostando nas bordas reais da aba - duplicar criaria respiro
dobrado).

**4) Relation - `PainelSearch` completo:** `filterFields`/
`buildSearchRecord`/`searchActionId` adicionados aos 7 painéis (Contatos
não tinha nenhum dos 3 antes). Botão "Colunas" liberado pelo item 1. Menu
de TypeView não se aplica (nenhuma das 7 relations tem visualização
alternativa à lista, igual os painéis mais recentes de Pantry/Deposit/
Occurrences não usam `viewSwitcherSlot` quando só existe "Lista").

**5) Criar = diálogo, editar = Detail:** 6 das 7 relations (Saúde,
Medicação, Escolaridade, Reclusão, Família, Financeiro) navegavam pra uma
rota própria (`/new`) ao clicar em "Novo" - fora da convenção ("diálogo de
criação rápida, nunca navegação pra criar"). Criados 6 diálogos novos
(`health-condition-quick-create-dialog.tsx`,
`medication-quick-create-dialog.tsx`, `education-quick-create-dialog.tsx`,
`detention-quick-create-dialog.tsx`,
`family-relation-quick-create-dialog.tsx` - com seletor de pessoa, já que
vínculo familiar referencia outra Pessoa, igual o diálogo de Envolvidos de
Occurrences -, `financial-entry-quick-create-dialog.tsx`), cada um só com
o campo obrigatório + 1-2 campos rápidos do domínio (ex.: tipo de condição,
medicamento, nível de escolaridade), molde idêntico ao
`AttendanceEvolutionDialog`/`AttendanceBenefitDialog` já aceitos no
projeto (mesmo texto-padrão "pode ser ajustado depois, na tela de..."
pros campos que ficaram de fora). Clicar na linha continua abrindo o
Detail de verdade (inalterado - já estava certo). Contatos **não** ganhou
diálogo novo - já tinha um (criação e edição), por ser um registro simples
sem Detail própria; só ganhou os ajustes dos itens 1 e 4.

**Achado incidental, não corrigido (fora do pedido desta rodada, risco de
apagar trabalho em andamento sem confirmação):** `frontend/src/modules/
people/features/benefits/` é código órfão - `BenefitsPanel` é só um alias
pra `PeopleFinancialRelationsPanel`, nenhuma aba referencia o feature, mas
as rotas `/people/[id]/benefits/{new,[benefitId]}` e os endpoints de
backend (`:id/benefits`) continuam existindo. Registrado em
`docs/backlog.md` com gatilho.

**Evidência:** `tsc --noEmit` (frontend) → 0 erros; `eslint` em todos os
~20 arquivos tocados (6 diálogos novos + 7 painéis + `DetailRelationTablePanel.tsx`
+ `RelationListHost.tsx` + `attendances-detail-layout-contract.tsx` +
`people-detail-layout-contract.tsx` + `people-detail-content.tsx`) → só a
categoria já tolerada (`react-hooks/set-state-in-effect`, no mesmo padrão
"resetar o formulário quando o diálogo abre" que `AttendanceEvolutionDialog`
já usa, pré-existente, mesmo erro lá); `npm run build` → sucesso, todas as
rotas (incluindo as de People) geradas sem erro. Teste manual no navegador
ainda pendente de confirmação do usuário.

## Tasks desativado (não é módulo de negócio) + Fase 3 - 5º módulo: Occurrences (2026-11-22)

Usuário informou que **Tasks foi criado só pra testar a padronização visual,
não faz parte do modelo de negócio** - pediu pra desativar o módulo mas
mantê-lo visível no sidebar como "muted" (pra não esquecer que ele existe),
e começar a padronização de Occurrences no lugar dele.

**Tasks desativado, não apagado:** `tasks-manifest.ts` ganhou
`disabled: true, badge: "Desativado"` no item do sidebar - mecanismo já
existente e usado em produção pelos placeholders "Em breve"
(`sidebar-placeholders.ts`/`comingSoon()`): o item continua no grupo
"Gestão", mas vira não-clicável e acinzentado (`aria-disabled:opacity-50
aria-disabled:pointer-events-none`, já no componente base do sidebar, zero
CSS novo). As 3 rotas (`tasks/page.tsx`, `tasks/[id]/page.tsx`,
`tasks/new/page.tsx`) trocaram `<ScreenHost>` por um aviso simples
("Módulo desativado.") - sem isso, acesso direto por URL continuaria
funcionando normalmente, já que `disabled` só afeta o item do menu, não a
rota. Nada foi apagado: controller/service/DTOs do backend, o contract e
as páginas client de Tasks continuam intactos, só inacessíveis pela UI -
fácil de reverter (`disabled: false` + devolver o `<ScreenHost>`) se o
módulo for reaproveitado um dia.

**Fase 3 - Occurrences (único módulo restante, Tasks saiu da ordem por
estar desativado):** a única relation do módulo (aba "Envolvidos" - pessoas
vinculadas à ocorrência com papel Envolvido/Testemunha) ainda estava no
padrão antigo (`DetailRelationConfig`/`relations: [...]`, renderizado via
`DetailRelationsRenderer`). Migrada pro molde `RelationListHost` +
`ListView` (`OccurrencePeopleSection`, arquivo novo) seguindo o template da
aba Encontros da Atividade: `PainelSearch` completo (busca por
pessoa/papel + filtro por Papel), botão "Novo" reaproveitando o diálogo de
busca+seleção que já existia (`OccurrencePeoplePickerDialog` - escolhe uma
pessoa existente e o papel, não precisou de diálogo novo), clique na linha
abre o Detail da Pessoa (já era assim, confirmado que é o comportamento
correto - vínculo com entidade existente, não sub-registro com tela
própria). Removida a função `peopleColumns` antiga do contract (motor de
colunas moveu pra dentro da nova section) junto com os imports que só ela
usava (`Badge`, `Button`, `ColumnDef`).

**Módulo pequeno, só tinha essa 1 relation** - confirmado por grep
(`DetailRelationConfig`/`relations:` zero ocorrências restantes em
`modules/occurrences`) que isso fecha a Fase 3 inteira de Occurrences, não
é um primeiro passo de vários.

**Fora do escopo desta rodada, de propósito:** Occurrences ainda não tem
Tags/Notas/Anexos de verdade no Metadata (só Auditoria) - gap de schema já
backlogado como "Fase 6" (`docs/backlog.md`, trabalho de backend), não é
parte da Fase 3 (que é só sobre migrar relations). Não toquei no `side`/
`StandardDetailMetadataSide` do contract por esse motivo.

**Evidência:** `tsc --noEmit` (frontend) → 0 erros; `eslint` nos 6 arquivos
tocados (`occurrences-detail-layout-contract.tsx`,
`occurrence-people-section.tsx` novo, `tasks/manifest.ts` e as 3 rotas de
Tasks) → 0 erros, 0 warnings. Teste manual no navegador ainda pendente de
confirmação do usuário.

## Correção: Pantry/Deposit - scroll/pin da tabela, padding do Metadata, campo notes duplicado (2026-11-22)

Usuário apontou 4 itens depois de testar a correção anterior (exclusão via
checkbox + regra de edição).

**1) Coluna principal não fixava à esquerda e desaparecia no scroll
horizontal; 2) scroll horizontal de algumas telas rolava a página inteira
(PainelSearch e Header incluídos), não só a área da tabela:** causa raiz
era a falta de um container de scroll delimitado nas relations
`flushToolbar` (Entradas/Saídas de Despensa/Depósito e todo o resto que usa
esse padrão - Projetos, Programas, Grupos, Ocorrências/Atividades, mesmo
bug latente, não era específico de Pantry/Deposit). O `ListView` nesse modo
ficava `overflow-visible` de propósito, sem scroll próprio, dependendo de
um ancestral (a página toda) pra rolar - sem nenhum container com
`overflow-x` delimitado em nenhum nível, o scroll horizontal vazava pra
`<body>` e o `position: sticky` das colunas fixadas não tinha um container
de scroll real pra calcular a posição contra.

Resolvido trocando o modelo "sticky contra um ancestral distante" pelo
mesmo já usado (e já funcionando) na Lista Principal: o `ListView` sempre
tem seu próprio `overflow-auto` (os dois eixos) e o cabeçalho sempre cola
em `top-0` relativo a si mesmo, independente do valor de
`stickyHeaderOffsetPx` recebido (a prop continua existindo, só vira sinal
booleano pros ~20 chamadores existentes - não precisou tocar nenhum deles).
Pra esse `overflow-auto` ter uma altura real pra rolar dentro, a barra de
busca da relation (`RelationListHost.tsx`) virou uma coluna flex de altura
limitada pelo ancestral em vez de ficar sticky contra a página, e o
wrapper do conteúdo de aba `flushContent` (`DetailLayoutSections.tsx`)
passou a ceder altura (`flex-1 min-h-0`) em vez de ficar travado na altura
natural do conteúdo (`shrink-0`). 3 arquivos: `ListView.tsx`,
`RelationListHost.tsx`, `DetailLayoutSections.tsx` - nenhum arquivo
específico de Pantry/Deposit precisou mudar.

**3) Itens internos do Metadata sem padding:** `DetailSideTabs.tsx` (painel
compartilhado de todas as abas do Metadata, qualquer módulo) ganhou
`px-3 py-3` no wrapper do conteúdo - 1 linha, benefício universal.

**4) Notas do Metadata sem a mesma barra de formatação (RichText/@menção)
dos outros módulos:** os 4 blocos `notes={{...}}` de cada contract
(Item/Doador/Entrada/Saída, Pantry e Deposit) ganharam
`richText: true, mentionUsers: mentionableUsers` - `DetailNotesPanel.tsx`
já suportava isso de ponta a ponta, só não estava sendo ligado aqui.

**5) Backend - campo `notes` duplicado com o Metadata (`internalNotes`):**
usuário confirmou (via pergunta) remover `notes` dos 3 (Item, Entrada e
Saída, os 2 módulos) e trocar as colunas "Notas" de relation/Histórico pra
mostrar `internalNotes` no lugar de somar. Mudança "expandir" (só parar de
ler/escrever o campo, sem dropar coluna ainda - `AGENTS.md`, migração em 2
deploys): DTOs (12 arquivos, `notes` removido), `pantry.service.ts` e
`deposit.service.ts` (serialize*, create/update Item/Entrada/Saída, SQL
bruto do `listHistory` trocando `e."notes"`/`x."notes"` por
`e."internalNotes"`/`x."internalNotes"` mantendo o alias `AS "notes"` -
zero mudança de frontend pro Histórico global -, `getStockSummary` e os
fluxos de estorno, que agora gravam a nota automática/informada em
`internalNotes` em vez de `notes`), tipos de API, drafts, contracts
(removida a entrada "Notas" solta do formulário principal - só existe mais
no Metadata), 6 engine pages e as colunas "Notas" de 10 relations
(Entradas/Saídas do Item, Doações do Doador, Saídas vinculadas da Entrada,
Pantry e Deposit) trocando a fonte pra `internalNotes`. Também removidos de
passagem: `EntryDraft`/`ExitDraft` (tipos mortos, nada importava), e as
entradas de label "notes" em `*_AUDIT_FIELD_LABELS`/domain adapters que só
existiam pro campo removido.

**Pendente (backlog):** dropar as colunas `notes` de
`PantryItem`/`PantryEntry`/`PantryExit`/`DepositItem`/`DepositEntry`/`DepositExit`
numa migração futura (fase "contrair") - ver `docs/backlog.md`.

**Evidência:** `tsc --noEmit` (backend `-p tsconfig.build.json` e
frontend) → 0 erros nos dois; `eslint` em todos os arquivos tocados
(backend: services + DTOs; frontend: `ListView.tsx`,
`RelationListHost.tsx`, `DetailLayoutSections.tsx`, contracts, engine
pages, relations, tipos de API, constantes) → 0 erros novos (só o
`react-hooks/set-state-in-effect` pré-existente, fora do range editado,
confirmado via `git diff --unified=0`). Teste manual no navegador ainda
pendente de confirmação do usuário - mudança de scroll/pin é estrutural
(`ListView.tsx`/`RelationListHost.tsx`/`DetailLayoutSections.tsx` são
compartilhados por todos os módulos, não só Pantry/Deposit) e merece
verificação visual antes de considerar fechada.

## Correção: Pantry/Deposit - coluna Notas vazando, aba redundante de Saída, redirect com casing errado (2026-11-22)

Usuário confirmou que a correção anterior (exclusão via checkbox + regra de
edição) funcionou bem e apontou mais 3 itens.

**1) Coluna "Notas" voltou a vazar pra fora da tela com texto longo** -
mesma pegadinha já documentada e corrigida em Encontros da Atividade
(`docs/canonical-web-client-standard.md`: um `<div className="truncate">`
sozinho não trava a largura da coluna, só `TruncatedTextCell` garante
isso de verdade, com tooltip do valor completo). As seções novas desta
sessão (Fase 3 de Pantry/Deposit) foram criadas com texto puro em vez de
`TruncatedTextCell` - não reaproveitei o componente certo na hora.
**Corrigido em 12 arquivos:** as 5 relations por módulo
(`*-item-entries-section`, `*-item-exits-section`, `*-item-history-section`,
`*-donor-donations-section`, `*-entry-allocated-exits-section`) + as 2
telas globais de Histórico (`*-history-module-client-page.tsx`, mesmo bug,
não fazia parte da Fase 3 mas é a mesma coluna/mesmo bug).

**2) Aba "Lotes vinculados"/"Entradas vinculadas" da Saída era
redundante:** o usuário esclareceu a cardinalidade real - uma Saída só
tem vínculo com **uma** Entrada (o campo "Entrada de origem", que já
existe no formulário principal, já mostra isso); é a Entrada que pode
ter **várias** Saídas (a aba "Saídas vinculadas" da Entrada, que
**continua** - não foi tocada, cardinalidade diferente e correta).
Removida a aba por completo dos 2 módulos: `tabTemplates`/`mainTab`
saíram de `pantryExitDetailLayout`/`depositExitDetailLayout` (sem
nenhuma outra aba, a tela volta a ser só o formulário, sem barra de
abas - comportamento já previsto no `DetailShellEngine`, não precisou de
mudança de infra) - `PantryExitAllocationsSection`/
`DepositExitAllocationsSection` apagados, junto com `entryById`/
`onOpenEntry`/`openEntryDetail` (só alimentavam essa aba, confirmado por
grep antes de apagar) e o `relatedSources` de cada módulo que também
referenciava esse mesmo `onOpenEntry` agora removido.

**3) "Tipo de Saída" em Deposit precisaria ser select igual Pantry:**
investigação extensa (formulário principal, diálogo de criação rápida,
filtro da relation, coluna da lista de Histórico) não achou nenhum lugar
onde o campo seja texto livre - em todo lugar já é um `<Select>` com as
mesmas opções/labels que o Pantry usa, incluindo no diálogo de criação
rápida construído na correção anterior. Não encontrei a causa - avisar o
usuário pra apontar a tela exata se o comportamento persistir depois do
hot-reload, já que pode ser um problema de cache do navegador em vez de
código.

**Achado incidental, corrigido de passagem:** os 3 redirects
`/deposit/{entries,exits,items}` apontavam pra `/Deposit/stock` (D
maiúsculo) em vez de `/deposit/stock` (minúsculo, igual
`DEPOSIT_ROUTES.stock` e igual o equivalente em Pantry) - funciona em
dev no Windows (filesystem case-insensitive) mas quebraria em produção
(Railway/Linux, case-sensitive) com 404. Corrigido nos 3 arquivos.

**Evidência:** `tsc --noEmit` → 0 erros; `eslint` nos 21 arquivos
tocados → só a categoria já tolerada (`react-hooks/set-state-in-effect`,
pré-existente); `npm run build` → ok. Teste manual no navegador ainda
pendente de confirmação do usuário - em especial o item 3 (Tipo de
Saída), que não consegui reproduzir via leitura de código.

## Correção: Pantry/Deposit - exclusão fora da convenção + regra de edição bloqueando campos sem relação com o lote (2026-11-22)

Usuário testou a correção anterior (dialog de criação + SQL do Histórico)
e apontou 2 problemas novos.

**1) Exclusão de Entrada/Saída continuava na tela de Detail (botão
"Excluir" no cabeçalho), não na tabela com checkbox** - convenção já
usada em Encontros/Atividades (`ActionOccurrencesSection`: seleciona
linhas, "Excluir selecionados", confirma, reporta "Excluídos: X —
Falharam: Y"). Replicado esse exato padrão nas abas "Entradas"/"Saídas"
do Item (`PantryItemEntriesSection`/`PantryItemExitsSection` e os
equivalentes `Deposit*`) - `ListView` ganhou `enableRowSelection`/
`onSelectionChange`/`bulkActions`, cada seção agora recebe `token`/
`canDelete`/`onDeleted` do contract (que por sua vez vêm do Item engine
page - `canDeleteEntry`/`canDeleteExit` calculados via
`canUseModuleAction(pantryEntryDetailModuleDefinition, "delete", ...)`/
idem Exit, `onDeleted` aponta pra `loadMovements` já existente).

**Mesma validação de antes, virou um aviso em vez de um botão
desabilitado silencioso:** antes de confirmar a exclusão, a seção de
Entradas verifica se alguma linha selecionada tem `allocatedTotal > 0`
(já vem na resposta da API) - se sim, bloqueia a exclusão em massa toda
com um toast explicando quais entradas têm saída vinculada e pede pra
remover da seleção antes de continuar (mesmo padrão de pré-checagem já
usado em `actions-list-module-client-page.tsx` pra status inválido).
Saída não tem essa restrição (sempre pode excluir), só confirmação
simples. Removido o botão "Excluir" + toda a lógica associada
(`canDelete`/`handleDelete`/`headerActionsSlot`) das 4 telas de Detail
(Pantry Entrada/Saída, Deposit Entrada/Saída) - os campos `canDelete`/
`onDelete`, que só alimentavam esse botão e não eram lidos em nenhum
outro lugar do contract, saíram dos 4 tipos de contexto também.

**2) Regra de edição bloqueava Notas/Doador mesmo sem nenhuma intenção
de tocar no lote:** causa raiz - o autosave deste projeto sempre reenvia
o rascunho **completo** a cada campo editado (`commitField`/
`useDetailAutoSaveController`, padrão usado em toda a aplicação, não só
Pantry/Deposit), mas `updateEntry` decidia bloquear só checando se
`sector`/`quantity`/`unit`/`entryDate`/`expiryDate` **estavam presentes**
no DTO - não se o valor tinha mudado de verdade. Como esses campos
sempre viajam no payload, qualquer edição (até só Notas) disparava o
bloqueio "Entrada possui saídas vinculadas". Perguntei ao usuário se o
Setor deveria continuar travado como Quantidade/Unidade ou ficar sempre
livre como Notas - **confirmado: mesma trava de Quantidade/Unidade**
(só bloqueia se o **valor** mudar, não só por estar presente no payload).

**Corrigido nos 2 módulos:** `updateEntry` (`pantry.service.ts`/
`deposit.service.ts`) agora compara valor-contra-valor
(`dto.campo !== undefined && dto.campo !== entry.campo`, com
`normalizeSector`/`toNumber`/comparação de timestamp pras datas) em vez
de só presença - mesma regra real (não pode mudar lote/quantidade com
saída vinculada), sem o falso positivo. `updateExit` tinha um problema
pior: apagava e recriava **todas** as alocações a cada edição,
independente do campo - além de caro, isso podia falhar com "Saldo
insuficiente" numa edição de Notas se o saldo do lote tivesse mudado
por outra saída nesse meio tempo. Agora só reaplica a alocação
(`needsReallocation`) quando `itemId`/`sector`/`quantity`/`entryId`
realmente mudam de valor - inclui um novo `include: { allocations: true }`
na busca inicial da saída pra saber o `entryId` atual (quando a saída
está presa a um único lote) e comparar.

**Achado de quebra, corrigido de passagem:** o diálogo de criação
rápida de Saída de Deposit (`DepositExitQuickCreateDialog`, criado na
correção anterior) teria falhado ao criar qualquer saída dos tipos
padrão (`LOAN`/`FINAL_REMOVAL`/`TRANSFER`) porque o backend
(`validateExitBusinessRules`) exige "Destino" pra esses 3 tipos e "Retorno
previsto" pra `LOAN` - nenhum dos dois era coletado no diálogo (Destino
era opcional, Retorno previsto nem existia). Corrigido: "Destino" passa
a ser obrigatório quando o tipo exige (label e validação do botão
"Criar" mudam dinamicamente), e um campo "Retorno previsto" aparece só
quando o tipo é `LOAN`. Pantry não tem essa exigência (confirmado por
grep - `eventName` é sempre opcional nos 5 tipos), não precisou de
ajuste.

**Evidência:** `tsc --noEmit` (backend com `-p tsconfig.build.json`,
frontend padrão) → 0 erros nos 2; `eslint` nos 15 arquivos tocados
(6 engine pages, 4 sections, 2 services, 1 dialog, 2 contracts) → só a
mesma categoria já tolerada (`react-hooks/set-state-in-effect`,
pré-existente nas engine pages e no reset-on-open dos diálogos, mesmo
padrão aceito em `ProgramProjectQuickCreateDialog`) + 2 quebras de linha
do prettier no código novo, corrigidas. Testado via `curl` direto contra
a API: (a) `PATCH` só em Notas numa entrada com alocação → sucesso antes
bloqueado; (b) `PATCH` tentando mudar Setor/Quantidade de verdade na
mesma entrada → continua bloqueado com a mesma mensagem; (c) `PATCH` só
em Notas numa saída → sucesso, alocação preservada intacta (confirmado
lendo a saída antes/depois). Banco local resetado (truncate + reseed)
pra limpar os registros de teste. Teste manual no navegador ainda
pendente de confirmação do usuário.

## Correção: Pantry/Deposit - erro de sintaxe no Histórico + criação de Entrada/Saída fora da convenção (2026-11-22)

Usuário testou o item anterior (migração de Pantry/Deposit pra
`RelationListHost`) e reportou 2 problemas em ambos os módulos.

**1) Erro de sintaxe real no banco, não só no front:** `listHistory`
(`pantry.service.ts`/`deposit.service.ts`) montava SQL cru
(`$queryRaw`/`Prisma.sql`) com identificador entre **crase** (`` `group` ``,
`` `PantryEntry` ``) - sintaxe de MySQL, não de Postgres (que é o banco
real do projeto). Toda chamada a `/pantry/history` ou `/deposit/history`
quebrava com 500 ("Internal server error" pro front, erro de sintaxe de
verdade no Postgres por trás) - e esse endpoint é chamado automaticamente
sempre que a tela de Item recarrega os movimentos, inclusive depois de
criar uma entrada/saída, por isso "a entrada não acontece por completo":
o POST em si tinha sucesso (confirmado por `curl` direto), só o refresh
seguinte que quebrava, deixando a tela inconsistente. Causa teria sempre
quebrado - não é regressão desta sessão, só não tinha sido exercitada
antes por falta de dado (item anterior, seed novo).

**Corrigido:** identificadores entre aspas duplas (`"group"`,
`"PantryEntry"`), igual todo o resto do projeto Postgres - mas corrigir só
a crase não bastava: toda coluna mixed-case da tabela (`tenantId`,
`itemId`, `entryDate`, `createdAt`...) também precisa de aspas duplas, ou
o Postgres faz fold pra minúsculo e não acha a coluna (confirmado nas
migrations - `CREATE TABLE` já cria tudo entre aspas, mixed-case). Mesma
lógica pro alias de cada coluna calculada (`AS "movementId"` etc.) - sem
aspas no alias, o nome que volta pro `$queryRaw` também vira minúsculo e
`row.movementId` no código TS ficava `undefined`. Reescrito por completo
(`entryWhere`/`exitWhere`/`entrySelect`/`exitSelect`/`ORDER BY` externo)
nos 2 services. De passagem, troquei `LIKE` por `ILIKE` nos filtros de
busca - Postgres diferencia maiúscula/minúscula por padrão (MySQL não),
outra pegadinha do mesmo código escrito pensando no banco errado.

**2) Criação de Entrada/Saída pelas Relations não seguia a convenção
("criar = diálogo, editar = Detail"):** os botões "Nova entrada"/"Nova
saída" (aba Entradas/Saídas do Item, aba "Saídas vinculadas" da Entrada)
navegavam pro formulário completo em modo `create` (`/pantry/entries/new`
etc.) - decisão própria tomada na migração anterior (justifiquei por
Entrada/Saída terem campos próprios, no molde de Encontro/Evolução/
Benefício), que o usuário corrigiu: diálogo de criação rápida também
aqui, sem excepcionar por volume de campo.

**4 diálogos novos** (`PantryEntryQuickCreateDialog`/
`PantryExitQuickCreateDialog` reaproveitado por Item e por Entrada, +
equivalentes `Deposit*`), mesmo molde de
`ProjectActionQuickCreateDialog` (dialog "burro" - só coleta os campos e
chama `onSubmit`, quem faz o POST + refresh da lista é a engine page que
já tinha `loadMovements`/`loadAllocatedExits`). Campos: Doador/Fonte
(opcional), Setor, Quantidade, Validade/Data limite (opcional) pra
Entrada; Setor, Quantidade, Tipo, Evento/Destino (opcional) pra Saída -
`unit`/`entryDate`/`exitDate` seguem default silencioso (unidade do
Item, hoje), ajustáveis depois no Detail completo, igual o resto dos
diálogos de criação rápida do projeto.

**Pegadinha nova, achada ao implementar:** quando a Saída é criada a
partir de uma Entrada específica (`entryId` no payload), o backend exige
que o setor da Saída seja **exatamente** o mesmo da Entrada (where
`sector: normalizedSector` na busca do lote) - senão rejeita com "Entrada/
lote não encontrado para esta saída". Por isso o diálogo de Saída ganhou
uma prop `lockedSector` - quando vem de uma Entrada, o campo Setor fica
fixo (Input desabilitado) em vez de Select livre, pra não deixar o
usuário escolher uma combinação que o backend vai rejeitar.

As telas de lista standalone (`/pantry/entries`, `/pantry/exits`) só
redirecionam pra `/pantry/stock` - não existem como grid própria, então
`PantryEntryNewEngineClientPage`/`PantryExitNewEngineClientPage` e as
rotas `/new` ficaram sem nenhum link apontando pra elas depois dessa
troca. Não apaguei (ainda funcionam se alguém acessar a URL direto, e
`createModuleWindowAction` as registra como parte do sistema de janelas) -
registrado no backlog se vale a pena remover numa limpeza futura.

**Evidência:** reproduzido o erro de sintaxe batendo direto em
`/pantry/history` e `/deposit/history` via `curl` (500 antes, dado
correto depois); `npx tsc --noEmit` → 0 erros; `eslint` nos 8 arquivos
novos/tocados → só a mesma categoria já tolerada
(`react-hooks/set-state-in-effect` no reset-on-open dos diálogos, mesmo
padrão aceito em `ProgramProjectQuickCreateDialog`/pré-existente nas
engine pages); `npm run build:seed` + banco local resetado (truncate +
reseed, autorizado pelo usuário) pra limpar os registros de teste
criados via `curl` durante a investigação. Testado via `curl` end-to-end:
criar entrada (auto), criar saída com alocação automática, criar saída
com `entryId` fixo (setor travado) - os 3 fluxos retornam 201 com a
alocação correta. Teste manual no navegador ainda pendente de
confirmação do usuário.

## Fase 3 - 4º módulo: Pantry/Deposit (2026-11-22)

**Pantry e Deposit são estruturalmente idênticos** (Deposit é a variante de
doações materiais - "Fonte"/"destino" em vez de "Doador"/"evento" - com mais
alguns campos de devolução na Saída que não afetam as relations). Migrados
juntos, como já fora feito na Fase 2.

**Mapeamento antes de migrar:** cada módulo tem 4 sub-telas de Detail (Item,
Doador/Fonte, Entrada, Saída), cada uma com exatamente 1 relation (Item tem
3: Entradas/Saídas/Histórico, via `tabTemplates[].relations`; Doador/Entrada/
Saída tinham 1 cada, mas no mecanismo antigo `bottomRelations` - lista fixa
embaixo do formulário, não uma aba). Total: 12 relations (6 por módulo).

**Decisão sobre `bottomRelations`:** mesmo mecanismo antigo que
`tabTemplates[].relations` (`DetailRelationConfig`, confirmado no type em
`web-client/registry/types.ts`) - também alvo da Fase 3. Convertidas em
`tabTemplates` (aba ao lado de "Detalhes", `mainTab: true` já estava
aplicado desde a Fase 2), no mesmo molde de People-Groups/Programs (1
relation = 1 aba), não deixadas como lista fixa.

**Fluxo de criação não mudou:** "Nova entrada"/"Nova saída" já navegavam
para a tela de Detail completa de Entrada/Saída (não um diálogo) - confirmado
em `pantry-item-detail-engine-client-page.tsx` (`openNewEntry`/`openNewExit`
via `router.push`). Correto pela convenção já estabelecida ("diálogo só
quando o sub-registro é simples ou é vínculo a algo existente" - Entrada/
Saída têm campos próprios extensos, mesmo caso de Encontro/Evolução/
Benefício). Nenhuma mudança nesse ponto, só a migração da lista em si.

**6 componentes novos por módulo** (`<Modulo>ItemEntriesSection`,
`<Modulo>ItemExitsSection`, `<Modulo>ItemHistorySection`,
`<Modulo>DonorDonationsSection`, `<Modulo>EntryAllocatedExitsSection`,
`<Modulo>ExitAllocationsSection`), mesmo molde de `ProjectActionsSection`/
`ProgramProjectsSection` (rows/loading/canAdd via props do contract, sem
fetch próprio). Filtro "Tipo" adicionado em Saídas/Histórico/Saídas
vinculadas (reaproveita `PANTRY_EXIT_TYPE_OPTIONS`/`DEPOSIT_EXIT_TYPE_OPTIONS`
já existentes - pegadinha: são array de strings, não `{value,label}`,
precisou mapear com `*_EXIT_TYPE_LABELS` pra virar `SearchFieldOption[]`,
senão `tsc` reclama de `readonly` não compatível com `SearchFieldOption[]`
mutável). Doações/Lotes vinculados ficaram só com busca livre (sem enum
óbvio pra filtrar), mesmo critério já usado nas fases anteriores.

**Código morto removido** (confirmado sem outro uso antes de apagar):
`pantry-item-movements-tabs.tsx`/`deposit-item-movements-tabs.tsx`
(`PantryItemMovementsTabs`/`DepositItemMovementsTabs`) - componente de abas
com `ListView` cru duplicando exatamente as 3 abas de Item (Entradas/Saídas/
Histórico), sem nenhum import no resto do repo (confirmado por grep) - sobra
de uma versão anterior à migração para `tabTemplates`/`DetailShellEngine`.
As 6 funções de colunas antigas + `formatOptionalDate`/
`resolveMovementKindLabel` locais saíram dos 2 contracts (movidas pros
componentes novos, `formatOptionalDate`/`resolveMovementKindLabel` foram pros
respectivos `*-item-detail.helpers.ts`, reusados pelos 6 componentes de cada
módulo em vez de duplicados).

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` nos 16 arquivos
tocados/novos (8 por módulo: contract + 6 sections + helpers) → 0
problemas; `npm run build` → ok, todas as rotas de `/pantry` e `/deposit`
presentes. Teste manual no navegador ainda pendente de confirmação do
usuário (abrir Item/Doador/Entrada/Saída de cada módulo, confirmar as abas
novas carregando dados reais, testar filtro "Tipo" e os botões "Nova
entrada"/"Nova saída").

**Seed de homologação adicionado** (pedido do usuário - não havia dado
nenhum pra testar esses 2 módulos): `seedPantryLikeDomain` novo em
`prisma/seed.ts`, reusado pelos 2 módulos (estrutura idêntica, só muda
terminologia/enum de saída) via 2 configs (`PANTRY_SEED_CONFIG`/
`DEPOSIT_SEED_CONFIG`). Gera, em cada módulo: 10 itens, 10 doadores/fontes,
20 entradas (2 por item) e 15 saídas (itens 1-5 com 1 saída, 6-10 com 2),
cada saída com 1 alocação contra a 1ª entrada do mesmo item - garante dado
de verdade também nas abas "Saídas vinculadas"/"Lotes vinculados" migradas
acima, não só nas 4 listas principais. Ids determinísticos no mesmo formato
UUID-v4-falso do resto do seed (`makeDomainId`, dígito `2`=Pantry/`3`=Deposit
repetido nos grupos) - precisa continuar parecendo v4 porque os controllers
validam `:id` da rota com `ParseUUIDPipe({ version: '4' })`.

**Evidência:** `npm run build:seed` → compila sem erro; `npm run db:seed` →
executado contra o Postgres local (`localhost:5432/terceirogestor`,
truncate + reseed completo, mesmo comportamento de sempre do script);
contagem pós-seed confirmada via query direta: Pantry e Deposit com 10
items/10 donors/20 entries/15 exits/15 allocations cada. `tsc --noEmit -p
tsconfig.build.json` → 0 erros (prisma/**/*.ts já é excluído desse build,
sem mudança de comportamento).

**Próximo módulo (ainda não iniciado):** Tasks → Occurrences, na ordem
sugerida do plano.

## Fase 3 - 3º módulo: Projects (2026-11-22)

**Investigação pedida pelo usuário antes de migrar:** Projects tinha 4
relations no mecanismo antigo (`peopleGroups`/"Grupos",
`teamPeopleGroups`/"Grupos de Equipe", `participants`/"Participantes",
`actions`/"Atividades") + 3 abas já em `content:` (Equipe, Metas,
Financiamento). Usuário suspeitou de duplicação entre "Grupos de
Equipe" e "Equipe" e pediu pra revisar antes de migrar. Investigação em
`project-structure.service.ts` (`syncPeopleGroupEnrollments`, linhas
446-540) confirmou que não era só nomenclatura duplicada: o backend
hardcoda `participationKind: 'PARTICIPANT'` e lança
`BadRequestException` se o `ProjectPeopleGroup` não for desse tipo - ou
seja, o botão "Matricular/revisar membros" da aba "Grupos de Equipe"
(que só lida com grupos `TEAM`) sempre falhava. Confirmado por grep que
`ParticipationKind.TEAM` em `ProjectPeopleGroup` não tem nenhum outro
consumidor no backend. Usuário escolheu remover a aba (não corrigir o
backend pra suportar sync de equipe).

**Remoção de "Grupos de Equipe":** `handleCreateTeamPeopleGroup`,
`teamPeopleGroupRows` (memo e contexto), `onCreateTeamPeopleGroup` e o
tabTemplate inteiro removidos de `projects-detail-engine-client-page.tsx`
e `projects-detail-layout-contract.tsx`. `project-people-group-picker-dialog.tsx`
perdeu a prop `purpose` ("PUBLICO"/"EQUIPE") - o diálogo agora só
vincula público (`purpose: "PUBLICO"` fixo na chamada a
`listPeopleGroups`), e a coluna "Finalidade" (que só mostrava
"Equipe"/"Publico") saiu por ficar sempre "Publico". `participationKind`
em `handlePickPeopleGroup` também virou fixo `"PARTICIPANT"`.

**Migração das 3 relations restantes pra `RelationListHost`** (mesmo
molde de Programs/People-Groups):

- `project-people-groups-section.tsx` (`ProjectPeopleGroupsSection`) -
  busca livre (nome/categoria/descrição/faixa etária), botão
  "Matricular/revisar membros" preservado por linha.
- `project-participants-section.tsx` (`ProjectParticipantsSection`) -
  filtro por Papel (`PROJECT_PARTICIPATION_ROLE_OPTIONS`) e Status
  (Ativa/Encerrada), colunas iguais às antigas (`PersonIdentityAvatarTrigger`,
  botão "Encerrar matrícula").
- `project-actions-section.tsx` (`ProjectActionsSection`) - filtro por
  Status (`ACTION_STATUS_OPTIONS`).

As 3 funções de colunas antigas (`peopleGroupRelationColumns`,
`enrollmentRelationColumns`, `actionRelationColumns`) e o helper
`formatAgeRange` saíram do contract (só eram usados ali); `formatPeriod`/
`formatActionStatus` foram exportados do contract pra reuso nos 3
componentes novos (mesmo padrão de `formatProjectStatus`/`formatPeriod`
em Programs).

**"Nova atividade" parou de navegar pra `/actions/new`:** violava a
convenção "criar em relation = diálogo". `project-action-quick-create-dialog.tsx`
(`ProjectActionQuickCreateDialog`) novo - Título + Tipo (select de
`listActivityTypes` filtrado por `target === "PROJECT"`), fecha sozinho
ao confirmar, sem navegar (mesmo molde do diálogo de Programs). Clicar
numa atividade da lista continua abrindo o Detail completo
(`onOpenAction`, inalterado) - só a criação mudou. "Equipe", "Metas" e
"Financiamento" ficaram como estavam (já funcionais com diálogo
próprio + lista simples, sem o toolbar do `RelationListHost` -
registrado no backlog).

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` em todos os
arquivos tocados/novos → só a categoria já tolerada
(`react-hooks/set-state-in-effect`, incluindo a instância nova do
diálogo de atividade, mesmo padrão aceito em
`ProgramProjectQuickCreateDialog`) + 1 `react-hooks/preserve-manual-memoization`
pré-existente em `selectedProgram` (não tocado nesta sessão). `npm run
dev` + `curl` em `/instituicao-exemplo/projects` e `/projects/new` →
200, sem exceção no log do servidor (backend não estava de pé, único
erro no log foi `ECONNREFUSED :3001`, não relacionado). **Teste manual
no navegador ainda pendente** (login + abrir um projeto existente +
confirmar as 3 abas migradas carregando dados reais + testar o diálogo
"Nova atividade" de ponta a ponta) - não há ferramenta de navegador
disponível nesta sessão para fazer isso automaticamente.

**Próximo módulo (ainda não iniciado):** Pantry/Deposit → Tasks →
Occurrences, na ordem sugerida do plano.

## Fase 3 - 2º módulo: Programs (2026-11-22)

**Programs tem 1 relation só** ("Projetos vinculados", aba "Projetos") -
migrada de `tabTemplates[].relations` pra `RelationListHost`, mesmo
molde de People-Groups/Encontros.

**Decisão perguntada ao usuário antes de migrar:** o botão "Novo
projeto" navegava pra `/projects/new?programId=...` (tela de Detail
completa) - viola a convenção "criar em relation = diálogo" (Project
não é um vínculo a algo que já existe, nem um sub-registro simples como
Encontro, mas o `CreateProjectDto` só exige `programId`+`name`, então um
diálogo de criação rápida é viável). Usuário escolheu criar o diálogo
novo (não manter a navegação).

**Novo:** `program-project-quick-create-dialog.tsx`
(`ProgramProjectQuickCreateDialog`) - só campo "Nome", mesmo molde de
`attendance-benefit-dialog.tsx` (único campo obrigatório, fecha sozinho
ao confirmar, sem navegar). `program-projects-section.tsx`
(`ProgramProjectsSection`) - `RelationListHost` com filtro de Status
(`PROJECT_STATUS_OPTIONS`), busca livre (nome/descrição/status/período/
tags, mesma lógica do `filterRows` antigo) e `projectRelationColumns()`
movida pra lá (corrigido de passagem o mesmo bug de `text-foreground`
fixo na coluna "Projeto", já que a célula estava sendo reescrita de
qualquer forma).

**Engine page:** o fetch de projetos virou `loadProjects` (callback
reutilizável, antes era só um `useEffect` inline) pra poder recarregar
a lista depois de criar um projeto pelo diálogo, sem precisar de reload
de página; `onCreateProject` trocou de navegação pra abrir o diálogo;
`handleSubmitCreateProject` novo chama `createProject` (API já existia,
não precisou de nada no backend) e recarrega a lista. Clicar na linha
continua abrindo o Detail completo do projeto (`onOpenProject`,
inalterado) - só a criação mudou.

**Código morto evitado:** `formatProjectStatus`/`formatPeriod` e
`ColumnDef` ficaram usados só no contract antes da migração;
exportei os dois do contract em vez de duplicá-los no componente novo
(ainda são usados em outros pontos do mesmo arquivo - `contextItems`,
`auditSources`). `id` saiu do array de dependências do `context`
`useMemo` (ficou sem uso depois que `onCreateProject` deixou de montar
uma URL com ele - pego pelo eslint, `exhaustive-deps`).

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` nos 4
arquivos tocados/novos → só a categoria já tolerada
(`react-hooks/set-state-in-effect`, incluindo 1 instância nova no
diálogo, mesmo padrão aceito em `AttendanceBenefitDialog`); `npm run
build` → ok, rotas intactas. Teste visual no navegador ainda pendente
de confirmação do usuário (abrir aba Projetos, criar um projeto pelo
diálogo, confirmar que a lista atualiza sem navegar, clicar numa linha
pra abrir o Detail).

**Próximo módulo (ainda não iniciado):** Projects - precisa mapear
quantas relations tem (prováveis candidatas: Equipe, Matrículas,
Grupos públicos, Metas, Fontes de financiamento, Atividades) antes de
migrar.

## Tags e Anexos de verdade pra People-Groups - gap de backend fechado (2026-11-22)

Usuário pediu pra resolver agora a pendência registrada no backlog
(People-Groups sem `tags`/`attachments` no schema, só `notes`/
`Auditoria` funcionando de verdade na Metadata). Investigado o padrão
já usado por Program (`ProgramAttachment`, `normalizeTags`/`parseTags`
serializando um array em `tags String? @db.Text`) e replicado
igual, ponta a ponta.

**Backend:**

- `schema.prisma`: `PeopleGroup.tags String? @db.Text` (campo novo,
  mesmo padrão de Program/Project/Task/Activity) + model novo
  `PeopleGroupAttachment` (espelha `ProgramAttachment` - mesmos campos,
  `onDelete: Cascade` no Grupos, `onDelete: SetNull` no usuário que
  enviou) + relações inversas em `Tenant`/`User`. Migration
  `20261122013214_add_people_group_tags_and_attachments` - só
  `ADD COLUMN`/`CREATE TABLE`, aditiva, sem risco pra dado existente.
  `prisma generate` rodado.
- DTOs: `tags?: string[]` em `create`/`update-people-group.dto.ts`;
  `CreatePeopleGroupAttachmentDto` novo (espelha
  `create-program-attachment.dto.ts`).
- `people-groups.service.ts`: `normalizeTags`/`parseTags` +
  `mapPeopleGroupAttachmentItem`/`serializePeopleGroup` (mesma função
  aplicada em list/get/create/update, igual Program); `tags` entra na
  busca textual (`where.OR`); `getPeopleGroup` passou a incluir
  `attachments` (só no get, não na listagem, pra não fazer N+1 na
  lista); `addAttachment`/`deleteAttachment` novos, mesma validação de
  `filePath` por prefixo (`/uploads/people-groups/`) que todo módulo já
  usa.
- `people-groups.controller.ts`: `POST`/`DELETE
  :id/attachments(/:attachmentId)`, permissão `people.update` (mesma
  que já protege `update`/participações neste controller).
- Upload: categoria `people-groups` em `upload-paths.ts`
  (`UPLOAD_CATEGORY_DIRS`) + endpoint novo `POST
  /files/people-group-attachments` em `files.controller.ts` (mesmo
  `FileInterceptor`/allowlist de extensão que os outros anexos).

**Frontend:**

- `api/types.ts`: `tags: string[]` e `attachments:
  ApiPeopleGroupAttachment[]` em `ApiPeopleGroup`; tipo
  `ApiPeopleGroupAttachment` novo; `tags?`/`PeopleGroupAttachmentInput`
  novos.
- `api/people-groups.ts`: `addPeopleGroupAttachment`/
  `deletePeopleGroupAttachment`.
- `features/uploads/api.ts`: `uploadPeopleGroupAttachment` (mesmo
  padrão copy-paste dos outros 7 - `POST /files/people-group-attachments`).
- `people-groups-detail-layout-contract.tsx`: `tags: string[]` no
  `PeopleGroupDetailDraft`; `tabOrder` voltou pros 4 canônicos
  (`["tags", "notes", "attachments", "activity"]` - era só `["notes",
  "activity"]` desde a correção anterior); `tags={{...}}` e
  `attachments={{...}}` wireados no `side`, mesmo formato de
  Projects/Programs/Tasks; `buildPeopleGroupAttachmentItems` novo
  (espelha `buildProgramAttachmentItems`).
- `people-groups-detail-engine-client-page.tsx`: `tags` entrou em
  `buildDraft`/`normalizeDraft`/`toPayload` (flui pelo
  `dataProvider.update` genérico que o módulo já usa pro resto do
  formulário, sem endpoint novo pra isso); `handleSelectAttachment`/
  `handleDeleteAttachment` novos (upload + registro, exclusão),
  `attachmentInputRef` + `<input type="file" className="hidden">` no
  JSX, `suspendDetailAutoSave`/`resumeDetailAutoSave` ao redor do
  upload (mesmo padrão de Programs/Projects/Tasks).

**Evidência:** `npx prisma validate` → schema válido;
`prisma migrate dev` → aplicada, só `ADD COLUMN`/`CREATE TABLE`; `npm
run build` no backend → ok; frontend `tsc --noEmit` → 0 erros; `eslint`
nos arquivos tocados (backend + frontend) → só a mesma dívida de lint
já tolerada em `programs.service.ts`/outros arquivos (confirmada
pré-existente, não introduzida aqui - ver comparação linha a linha);
`npm run build` no frontend → ok, rota `/[tenant]/people-groups/[id]`
presente. Teste manual no navegador real ainda pendente de confirmação
do usuário (criar/editar tags, enviar/excluir anexo).

**Documentação:** `docs/backlog.md` - a entrada "People-Groups, Occurrences
e Attendances são um caso pior" precisa de atualização pra tirar
People-Groups da lista (feito a seguir) - Occurrences/Attendances
continuam pendentes, mesmo padrão exato pode ser repetido lá quando
chegar a vez.

## Correção: People-Groups ficou inconsistente por pular as Fases 1/2 (2026-11-21)

Usuário testou a tela de Detail de Grupos (depois da migração da
relation, item abaixo) e reportou 3 problemas: (1) a relation ficou
"embaixo" em vez de virar aba "Participantes" ao lado de "Detalhes";
(2) a barra de info embaixo do header não saiu; (3) o Metadata
continuava errado (Histórico/Contexto, não Tags/Notas/Anexos/
Auditoria).

**Causa raiz: decisão própria errada.** People-Groups foi
deliberadamente excluído das Fases 1 e 2 porque não tem `tags`/
`attachments` no schema (gap de backend, igual Attendance/Occurrences),
mas isso só bloqueia a Metadata **de verdade** (Tags/Anexos reais).
`mainTab`/header **não dependem** desse gap - eu já tinha anotado isso
no backlog ao pular a Fase 2 ("não participou desta rodada por ligação
com a Fase 1, mas o `header.slot` em si não depende disso"), mas não
voltei pra aplicar antes de migrar a relation (Fase 3) - resultado:
migrei só 1 das 3 partes da tela, deixando um estado pior que antes (a
relation nova, sem o `mainTab` que a abriga como aba, ficava solta
embaixo do formulário sempre visível, sem nunca ter existido assim nas
outras 5 Fases 1/2).

**Corrigido agora, igual aos outros 5 módulos:**

- `header.slot` removido (Status/Tipo/Finalidade/Categoria/Faixa etária
  já existiam no formulário principal - só "Participantes" era contagem
  derivada, já visível no badge da própria aba); `mainTab: true`
  adicionado.
- Metadata: como `tags`/`attachments` genuinamente não existem pra
  Grupos (confirmado no schema), `tabOrder={["notes", "activity"]}` -
  mostra só Notas+Auditoria, as únicas 2 abas reais; Histórico e
  Contexto saem da tela (mesma lógica do `tabOrder={["activity"]}` já
  usado em Attendance pra Fase B pendente). Tags/Anexos continuam de
  fora até o backend existir - **não é um bug resolvido, é a mesma
  limitação já documentada**, só não mostra mais as abas erradas
  enquanto isso.

**Código morto removido** (confirmado sem outro uso): `resolveStatusBadge`
e o import `Badge` (só serviam à barra); `formatAgeRange` e
`buildPeopleGroupsHistoryItems`, com os imports `buildGroupedAuditFeed`,
`resolveAuditActionLabel` e `resolveAuditChangedFieldsSummary` (só
serviam ao `contextItems`/`history` removidos do side).

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` → 0
problemas (1 warning de parâmetro não usado corrigido no caminho).
Teste visual no navegador ainda pendente de confirmação do usuário -
**desta vez, as 3 partes da tela devem estar coerentes** (aba
Detalhes/Participantes, sem barra, side com Notas+Auditoria só).

**Lição pra aplicar no resto da Fase 3:** antes de migrar a relation de
um módulo que ficou de fora das Fases 1/2, conferir primeiro se ele já
passou por elas - não assumir que "a Fase X não depende da Y" é
suficiente, a tela como um todo precisa ficar coerente a cada módulo
tocado, não só a parte que está sendo trabalhada no momento.

## Fase 3 da padronização - Relation → `RelationListHost` - 1º módulo: People-Groups (2026-11-21, em andamento)

Fase mais cara do plano - migrar cada relation de
`DetailRelationsRenderer`/`tabTemplates[].relations` (mecanismo antigo)
pra `RelationListHost` (`PainelSearch` completo: busca+Colunas+Filtros+
TypeView+Novo), no molde exato de Encontros da Atividade. Começando
pelo módulo com menor volume de relations, como sugerido no plano.

**People-Groups (1 relation - "Participantes"):** migrado. Novo
componente `people-group-participants-section.tsx`
(`PeopleGroupParticipantsSection`) - reaproveita quase 1:1 a estrutura
de `action-team-section.tsx` (Equipe da Atividade), que é o
caso mais parecido já existente (lista de pessoas vinculadas, papel
fixo não aplicável aqui mas Status/Tipo sim, ação "Encerrar vínculo"
por linha, picker dialog já existente - `PeopleGroupPeoplePickerDialog`,
não tocado, já segue a convenção de diálogo de busca+seleção).

**O que mudou na prática:**

- `tabTemplates[].relations` (busca/filtro manual, sem `SearchPanelMenu`)
  → `content:` renderizando o componente novo, com
  `RelationListHost flushToolbar` de verdade - ganha Colunas/Filtros/
  busca no padrão, de graça.
- Filtro adicionado: "Status" (Ativo/Encerrado), via `filterFields` do
  `SearchPanelMenu` - antes só dava pra buscar por texto livre.
- `canAdd` separado de `canManageParticipations` no novo componente -
  a regra antiga escondia o botão "Novo" com 3 condições
  (`readOnly`/`mode`/`canManageParticipations`) mas a ação "Encerrar
  vínculo" por linha só checava `canManageParticipations` - preservei a
  assimetria exatamente como estava, em vez de simplificar pra uma
  condição só (teria mudado comportamento).
- Corrigido de passagem (já estava tocando o código): `text-foreground`
  fixo na coluna "Pessoa" (mesmo bug de sempre) - removido, já que
  estava reescrevendo essa célula de qualquer forma.

**Código morto removido do contract** (`people-groups-detail-layout-contract.tsx`,
confirmado sem outro uso antes de apagar): `participationColumns`,
`formatParticipationStatus`, `formatPeriod` + imports que só serviam a
eles (`ColumnDef`, `Button`, `PersonIdentityAvatarTrigger`,
`formatDateOnlyPtBR`) - movidos pro componente novo, não duplicados.

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` nos 2
arquivos (contract + componente novo) → 0 problemas. Teste visual no
navegador ainda pendente de confirmação do usuário.

**Próximo módulo (ainda não iniciado):** Programs - próximo da lista por
volume de relations, só precisa de mapear quantas/quais relations ele
tem antes de migrar (ainda não investigado).

## Fase 2 da padronização - Header sem barra + `mainTab` (6 módulos, 12 contracts) (2026-11-21)

Usuário testou a Fase 1 e pediu pra seguir direto pra Fase 2, sem
ajuste. Escopo: Projects, Programs, Tasks, Occurrences (1 contract cada)
e Pantry/Deposit (4 contracts cada - Item/Doador/Entrada/Saída) - 6
módulos, 12 telas de Detail no total.

**Decisão pedida ao usuário no meio da execução:** Pantry/Deposit, nas
telas de Item e Entrada, tinham métricas **calculadas** na barra (Saldo,
Próx. validade, Último movimento, Restante) que não duplicavam nenhum
campo do formulário - diferente dos outros casos (Status/Tipo/Período
já editáveis em outro lugar). Usuário decidiu: **descartar por agora**,
com interesse em revisitar onde mostrar essas métricas numa sessão
futura (não é mais uma barra de header, de qualquer forma - fica como
decisão de design em aberto, não um bug). Registrado no backlog.

**Aplicado em cada um dos 12 contracts:** removida a função `header.slot`
por completo (não só escondida) e adicionado `mainTab: true`. Nos 4
módulos onde os campos da barra já existiam no formulário principal
(Projects: Status/Programa; Programs: Status/Tipo; Tasks: Status/
Prioridade/Entrega/Marco; Occurrences: Status/Origem), nenhuma mudança
adicional foi necessária no formulário - já cobrem a mesma informação.
Pantry/Deposit Doador e Saída também eram puro duplicado (Tipo/Contato/
Nome; Quantidade/Tipo/Setor) - removidos sem mudança no formulário.

**Limpeza de código morto decorrente** (funções/imports que só existiam
pra montar a barra removida, confirmado sem outro uso no arquivo antes
de apagar): `resolveStatusBadge` + import `Badge` (Programs, Projects,
Occurrences - 3 funções quase idênticas, uma por módulo);
`PANTRY_DETAIL_BAND_CLASS`/`DEPOSIT_DETAIL_BAND_CLASS` (Pantry/Deposit).

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` nos 6 arquivos
(todos os 12 contracts) → 0 problemas, inclusive os 2 warnings de
constante não usada (`*_DETAIL_BAND_CLASS`) resolvidos. Teste visual no
navegador ainda pendente de confirmação do usuário.

**Achado incidental, não corrigido (fora do escopo desta fase, é Fase
4):** durante a leitura dos arquivos, vi mais ocorrências do bug
`text-foreground` fixo em colunas de relation ainda não documentadas -
`projects-detail-layout-contract.tsx` (coluna "Pessoa" da relation de
matrículas) e `occurrences-detail-layout-contract.tsx` (coluna "Pessoa"
da relation "Envolvidos") - anotar no backlog quando a Fase 4 chegar
nesses 2 módulos.

**Documentação:** `docs/backlog.md` - nova entrada sobre as métricas
calculadas descartadas de Pantry/Deposit, com gatilho pra revisão
futura; entradas de header.slot marcadas como resolvidas pros 6
módulos.

**Próximo passo (Fase 3, ainda não iniciada):** migrar as relations dos
mesmos 6 módulos (+ People-Groups, que não participou das Fases 1/2 por
causa do gap de backend, mas relation não depende disso) de
`DetailRelationsRenderer`/`tabTemplates[].relations` pra
`RelationListHost`/`DetailRelationTablePanel`, no molde de Encontros da
Atividade. É a fase mais cara do plano - ordem sugerida (menor volume de
relations primeiro): People-Groups → Programs → Projects → Pantry/
Deposit → Tasks → Occurrences.

## Fase 1 da padronização - Metadata (5 de 6 módulos concluídos) (2026-11-21)

Usuário confirmou a ordem de fases do plano abaixo e pediu início
imediato, com 1 correção: Metadata precisa terminar com os **4** canônicos
(Tags/Notas/Anexos/Auditoria), não um subconjunto.

**Achado antes de aplicar:** People-Groups, dos 6 módulos cotados pra
Fase 1 (a mais barata, "só esconder abas antigas"), é diferente dos
outros 5 - conferido o `schema.prisma`, `PeopleGroup` **não tem** coluna
`tags` nem uma tabela de anexo própria (`PeopleGroupAttachment` não
existe) - o contract só passa `notes`/`history`/`contextItems`, nunca
chegou a ganhar `tags`/`attachments`. Isso não é "só esconder abas", é
backend novo (migration + DTO + endpoint, no molde de
`ProjectActionComment`/`ProjectActionAttachment`) - mesma categoria da
Fase B de Attendance/Occurrences, não a Fase 1 barata. **Removido da
Fase 1, movido pra uma fase de backend futura** (junto com
Attendance/Occurrences Fase B, já backlogada) - não fiz nenhuma mudança
em People-Groups nesta entrada.

**Aplicado nos 5 módulos que já tinham tudo funcionando** (só faltava
esconder Comentários/Histórico/Contexto, que ficavam pendurados ao lado
de Tags/Notas/Anexos já reais): `tabOrder={["tags", "notes",
"attachments", "activity"]}` em `StandardDetailMetadataSide` de:

- `projects-detail-layout-contract.tsx` (1 contract)
- `programs-detail-layout-contract.tsx` (1 contract)
- `tasks-detail-layout-contract.tsx` (1 contract)
- `pantry-detail-layout-contract.tsx` (**4** contracts - achado durante
  a execução: não são 3 sub-telas, são 4 - Item, Doador, Entrada, Saída)
- `deposit-detail-layout-contract.tsx` (**4** contracts, mesma estrutura
  de Pantry - Item, Doador, Entrada, Saída)

Nenhum código de `comments`/`history`/`contextItems` foi removido ainda,
só filtrado da exibição via `tabOrder`, igual Attendance já fazia.
Remoção do código morto por trás fica pra uma limpeza futura, backlogada
separada (conferir antes que não há nenhum outro lugar do sistema
lendo esses campos antes de apagar).

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` nos 5 arquivos
→ 0 problemas. Teste visual no navegador ainda pendente de confirmação
do usuário (abrir um registro de cada um dos 5 módulos e confirmar só
Tags/Notas/Anexos/Auditoria no painel lateral).

**Documentação:** `docs/backlog.md` - a entrada de People-Groups
("Infraestrutura de UI") precisa de uma nota nova sobre o gap de schema
(tags/anexos), a fazer na próxima atualização de docs.

**Próximo passo (Fase 2, ainda não iniciada):** header sem barra +
`mainTab`, nos mesmos 5 módulos + Occurrences (People-Groups fica de
fora por ora, junto com o resto do seu backend pendente - ou entra
normalmente na Fase 2/3 pra header/relation, já que esses dois pontos
não dependem do gap de Tags/Anexos).

## Plano: padronizar todos os módulos no padrão de Atividades (2026-11-21, aguardando confirmação de sequência)

Usuário confirmou Atividades como a referência completa de convenção
(List Principal + Detail + Metadata + Relation + Tabela) e pediu um
plano pra levar todos os outros módulos ao mesmo padrão, cobrindo 6
frentes: TypeView, Table, Detail, Metadata, Relation (com
`SearchPanelMenu`/`RelationListHost`) e a convenção de criar (diálogo)
vs. editar (Detail). **Nada foi implementado ainda nesta entrada - é só
o plano**, revisando `docs/canonical-web-client-standard.md` (lido na
íntegra, 1151 linhas) e `docs/backlog.md` contra o código real (greps
diretos, não só o que os docs já diziam - achei 2 gaps não documentados,
registrados no backlog agora: Tasks/Pantry/Deposit também têm a barra de
header antiga, e Pantry/Deposit também têm o bug de `text-foreground`).

### Matriz de conformidade (confirmada por leitura/grep direto do código, 2026-11-21)

| Módulo | A. Header sem barra | B. `mainTab` (Detalhes = 1ª aba) | C. Metadata (só Tags/Notas/Anexos/Auditoria) | D. Relation = `RelationListHost` | F. Tabela sem `text-foreground` fixo |
| --- | --- | --- | --- | --- | --- |
| **Atividades (referência)** | ✅ | ✅ | ✅ | ✅ (4 relations) | ✅ |
| Attendances | ✅ (Fase A) | ✅ | 🟡 (só Auditoria - Fase B depende de schema novo no backend) | ✅ (Fase A, 3 relations) | ✅ (só a coluna principal tinha o bug - já corrigida) |
| Occurrences | ❌ | ❌ | ❌ (nem passa tags/notes/attachments - pior caso) | ❌ (`DetailRelationConfig` antigo) | ❌ |
| Projects | ❌ | ❌ | 🟡 (tags/notes já funcionam, falta só tirar/ocultar Comentários/Histórico/Contexto) | ❌ | ❌ |
| Programs | ❌ | ❌ | 🟡 (idem Projects) | ❌ | ❌ |
| Tasks | ❌ (achado novo - Status/Prioridade/Prazo/Entrega/Marco/Atualizado) | ❌ | 🟡 (idem) | ❌ | ❌ (coluna principal + várias secundárias + card) |
| Pantry | ❌ (achado novo - ×3: Item/Entrada/Saída) | ❌ | 🟡 (idem) | ❌ | ❌ (achado novo) |
| Deposit | ❌ (achado novo - ×3: Item/Entrada/Saída) | ❌ | 🟡 (idem) | ❌ | ❌ (achado novo) |
| People-Groups | ❌ | ❌ | 🟡 (idem) | ❌ | ❌ |
| People | ❓ (doc antigo dizia que tinha; não confirmado no `header` do contract - só `leadingSlot` do avatar; pode viver em outro lugar do sistema de abas próprio) | N/A (sistema de abas **próprio**, não `mainTab`/`tabTemplates` - decisão arquitetural maior, não um fix pontual) | ✅ (já segue as 4 abas) | ✅ (7 painéis já em `DetailRelationTablePanel`) | ❌ |

**G. TypeView** não entra na matriz porque é, na prática, automático (`RecordBrowserViewSwitcher` compartilhado) - o gap aqui não é "módulo X está fora do padrão visual", é "módulo X ainda não oferece Kanban/Calendário/Gantt/Gráfico onde o domínio suportaria" - uma decisão de produto por módulo, não um bug de convenção. Auditar caso a caso dentro de cada fase abaixo, não como frente separada.

**E. Criar relation = diálogo, editar = Detail** também não entra como coluna própria porque só é auditável relation por relation, depois que cada módulo migrar pra `RelationListHost` (coluna D) - vira parte do trabalho da Fase 3, não uma frente paralela.

### Fases propostas, da mais barata/segura pra mais cara (cada módulo pode ser feito independente - não precisa fechar uma fase inteira antes de começar a próxima, mas dentro de um módulo a ordem A→B→C→D é a que faz sentido: C costuma destravar junto com A/B, D é sempre o maior)

**Fase 1 - Metadata (coluna C), 6 módulos, risco quase zero:** Projects, Programs, Tasks, Pantry (×3 contracts), Deposit (×3 contracts), People-Groups já têm `tags`/`notes`/`attachments` funcionando - só precisam de `tabOrder={["tags", "notes", "attachments", "activity"]}` pra esconder as abas antigas (Comentários/Histórico/Contexto), igual Attendances já fez com `tabOrder={["activity"]}`. Não remove nenhum dado nem código ainda (só filtra o que aparece) - código morto por trás (handlers/estado de `comments`/`history`/`contextItems`) fica pra uma limpeza posterior, backlogado separado (ver "Remover código morto" nas instruções do projeto - fazer isso depois de confirmar visualmente que nada quebrou, não no mesmo commit).

**Fase 2 - Header sem barra (coluna A) + `mainTab` (coluna B), mesmos 6 módulos + Occurrences:** remover a função que monta `header.slot` de cada contract (não só escondê-la) e levar os campos pro formulário principal, 1ª linha (Título-Status-Tipo-relacionamento, mesma convenção da Atividade); adicionar `mainTab: true`. Tasks/Pantry/Deposit precisam disso nas sub-telas (Entrada/Saída) também, não só no módulo principal. People fica de fora desta fase (arquitetura de abas própria, decisão maior - ver Fase 5).

**Fase 3 - Relation (coluna D) + convenção de criar/editar (E), a mais cara:** migrar cada relation de `DetailRelationsRenderer`/`DetailRelationConfig` pra `RelationListHost` (ou `DetailRelationTablePanel` quando não precisar de visualização alternativa), seguindo o template exato da aba Encontros da Atividade (`PainelSearch` completo: busca+Colunas+Filtros+Agrupar, TypeView quando aplicável, botão Novo). Pra cada relation migrada, decidir e implementar o fluxo de criação (diálogo de busca+seleção OU diálogo de criação rápida) e confirmar que clicar na linha abre uma tela de Detail de verdade (criando uma nova, no molde do Encontro/Evolução/Benefício, quando o sub-registro tiver campos próprios). Ordem sugerida por volume de relations (menor primeiro): People-Groups → Programs → Projects → Pantry/Deposit → Tasks → Occurrences.

**Fase 4 - Tabela (coluna F):** revisar todo `cell` de `ColumnDef` de cada módulo (list principal **e** as relations migradas na Fase 3), tirando `text-foreground`/cor fixa que não seja `text-muted-foreground` intencional - mesma correção já aplicada em Attendances/Atividades. Fazer **depois** da Fase 3 em cada módulo, porque a Fase 3 recria as colunas de qualquer forma (menos retrabalho que corrigir cor antes de migrar a estrutura).

**Fase 5 - People (dedicada, fora da sequência acima):** decidir se migra as 11 abas internas pra `tabTemplates`/`mainTab` (ganha `RelationListHost` de graça pra quem ainda não tem, badge de contagem, etc.) ou se formaliza o sistema próprio como exceção documentada. Reconfirmar nessa sessão se a barra de header antiga existe de verdade ou não (gap encontrado na auditoria desta entrada).

**Fase 6 (fora desta rodada, já backlogada) - Fase B de Attendances/Occurrences:** schema novo no backend pra Tags/Notas/Anexos de verdade (hoje só Auditoria) - trabalho de backend, não de frontend/convenção.

### Antes de começar

Confirmar com o usuário: (1) ordem de execução entre fases/módulos (a
sugerida acima é só uma recomendação, por risco crescente); (2) se cada
módulo é um commit/sessão por si (parece mais seguro, dado o volume) ou
se Fase 1 (barata, 6 módulos) pode ir tudo numa sessão só; (3) se People
entra nesta rodada ou fica pra depois, dado que é decisão arquitetural,
não só um fix.

## Coluna "Notas" ainda vazava pra fora da tela - correção final em `TruncatedTextCell` (2026-11-21)

Depois de trocar "Notas" (Encontros) pra `TruncatedTextCell` (item
abaixo), usuário testou de novo: tooltip apareceu certo, mas a coluna
continuava crescendo e saindo da tela com uma nota de verdade longa
(várias frases) - pediu um "bloqueio" real pro texto respeitar o
tamanho da coluna.

**Causa raiz (mesma família do bug anterior, só que o `min-w-0` do
`TruncatedTextCell` não é suficiente pra qualquer tamanho):** um
`<span>` com `white-space: nowrap` (exigido pelo `truncate`/ellipsis)
tem largura mínima de conteúdo igual ao texto inteiro - pra um nome
curto isso nunca estoura o `max-width`, mas pra uma nota de várias
frases, essa largura mínima pode vencer o `max-width` do wrapper mesmo
com `min-w-0`, e a coluna cresce de qualquer jeito.

**Correção, em `TruncatedTextCell.tsx` (afeta toda célula que já usa
esse componente - Projeto, Grupos, Participante, Título, etc., não só
Notas):**

1. `maxWidthPx` (nova prop, default 280) aplicado como `style={{
   maxWidth: maxWidthPx }}` **inline** no wrapper, não só via className.
2. O valor **exibido** (não o do tooltip, que continua mostrando o texto
   inteiro) é cortado em JavaScript, **antes** de chegar no DOM, num
   limite de caracteres calculado a partir de `maxWidthPx`
   (`Math.floor(maxWidthPx / 7)`, 7px/caractere - estimativa conservadora
   pro texto de 13px da tabela). Isso garante que a largura mínima de
   conteúdo do `<span>` nunca passe de `maxWidthPx`, **independente** de
   qualquer detalhe do algoritmo de layout do navegador - o texto em si
   já chega curto o suficiente, o `max-width`/ellipsis só faz o corte
   fino visual do que sobrar.

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` em
`TruncatedTextCell.tsx` → 0 problemas. Teste visual no navegador ainda
pendente de confirmação do usuário (nota bem longa em Encontros).

**Documentação:** `docs/canonical-web-client-standard.md` - a
"pegadinha real" reescrita pra contar as 2 rodadas até fechar de
verdade (texto puro → `TruncatedTextCell` sozinho → `TruncatedTextCell`
com corte em JS + `maxWidth` inline), já que a explicação anterior
("`min-w-0` resolve") estava incompleta.

## Tooltip automático: 2 bugs reais achados testando (2026-11-21)

Usuário testou o item anterior (tooltip automático + coluna principal
dinâmica) em 2 rodadas e achou 2 bugs reais de verdade, ambos na coluna
"Notas" de Encontros (`action-occurrences-section.tsx`):

**Bug 1 - falso positivo (tooltip aparecendo sem truncar nada):**
tolerância de 1px pra decidir "truncou" era curta demais - escala de
tela do Windows ≠ 100% (125%/150%, comum) já cria 1-2px de diferença
entre `scrollWidth`/`clientWidth` por arredondamento de subpixel, sem
nenhum corte real de texto. Corrigido em `TableCell`
(`components/ui/table.tsx`): tolerância subiu pra 2px
(`CELL_OVERFLOW_TOLERANCE_PX`) e a 1ª medição passou a esperar 2
`requestAnimationFrame` (layout/fonte assentarem) antes de checar - uma
medição cedo demais podia "travar" como truncada pra sempre, já que o
`ResizeObserver` só reage se o próprio `<td>` mudar de tamanho depois.

**Bug 2 - a coluna "Notas" tinha 2 problemas em sequência, mesma causa
raiz:** originalmente usava `whitespace-normal break-words` - quebra a
regra geral da tabela ("nunca quebra linha") e fazia a **altura** da
linha crescer pra caber a nota inteira, em vez de truncar. 1ª tentativa
de correção trocou pra um texto simples (string direta no `cell`, sem
wrapper) - a altura parou de crescer, mas a **largura da coluna**
cresceu no lugar, e o tooltip automático nunca aparecia. Causa raiz
real: um `<td>` com `white-space: nowrap` tem largura mínima de
conteúdo igual ao texto inteiro (não quebra nem uma palavra) - no
layout automático de tabela HTML, essa largura mínima vence o
`max-width` da célula e força a **coluna inteira** a crescer, mesmo com
`overflow-hidden`/`text-ellipsis` no CSS (não é bug de código, é assim
que o algoritmo de tabela funciona). `TruncatedTextCell`
(`web-client/ui/TruncatedTextCell.tsx`) não tem esse problema porque seu
wrapper usa `min-w-0` - diz ao navegador "o mínimo desse elemento pode
ser zero, não o do conteúdo", quebrando a cadeia que força a coluna a
crescer. **Corrigido:** a coluna "Notas" agora usa `TruncatedTextCell`
(igual "Título" na mesma tabela), em vez de texto puro.

**Achado incidental, não tocado (perguntei, resposta pendente):**
`attendances-detail-layout-contract.tsx`, coluna "Registro" das
Evoluções do Atendimento, tem o mesmo `whitespace-normal break-words` -
mas ali o texto É o conteúdo principal da tabela (a evolução em si), não
uma nota secundária; pode ser intencional mostrar por completo. Não
mudei sem confirmação do usuário.

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` em
`table.tsx`/`action-occurrences-section.tsx` → só a categoria já
tolerada (`react-hooks/set-state-in-effect`, pré-existente, não tocada).

**Documentação:** `docs/canonical-web-client-standard.md` - parágrafo
de tooltip automático atualizado com a tolerância de 2px e os 2
`requestAnimationFrame`; nova "pegadinha real" documentando que
`max-width` sozinho num `<td>` não garante truncar texto livre
realmente longo (regra: usar sempre `TruncatedTextCell` pra isso, nunca
texto puro no `cell`).

## Tooltip automático em toda célula + coluna principal dinâmica (2026-11-21)

Usuário pediu 2 coisas depois das rodadas anteriores: (1) tooltip no
valor completo em **toda** célula de **toda** tabela, não só nas
colunas que já usavam `TruncatedTextCell`; (2) a coluna principal
(`--table-column-primary-max-width`) ficando grande demais em telas com
título curto - pediu pra "respeitar o tamanho do nome" em vez de um
tamanho fixo.

**Decisão de design perguntada antes de implementar** (mudança no
componente mais compartilhado do frontend, `table.tsx`, usado por toda
tabela do sistema): balão estilizado (igual ao que `TruncatedTextCell`
já mostra) vs. tooltip nativo do navegador (`title` do HTML). Cheguei a
implementar a versão nativa primeiro (menor risco/escopo), mas o usuário
pediu pra usar a recomendação original (balão estilizado), então troquei
pra essa antes de fechar o item.

**(1) Tooltip automático - `TableCell` (`components/ui/table.tsx`):**
cada `<td>` mede, via `ref` + `ResizeObserver`, se o próprio conteúdo
truncou de verdade (`scrollWidth > clientWidth`) e, só nesse caso,
envolve a célula em `Tooltip`/`TooltipTrigger asChild`/`TooltipContent`
(mesmos componentes que `TruncatedTextCell` já usa), mostrando o
`textContent` real do DOM - funciona com qualquer conteúdo (texto puro,
`<div>`, `<Badge>`), não só string. Não duplica tooltip em quem já usa
`TruncatedTextCell`: a truncagem dela é num `<span>` interno, então o
`<td>` por fora nunca mede overflow nesse caso (o filho já ficou do
tamanho certo) - `TruncatedTextCell` continua válido pras colunas que
precisam de `icon`/placeholder vazio, que o mecanismo automático não
cobre.

**(2) Coluna principal dinâmica - `getColumnWidthStyle` (`ListView.tsx`):**
causa raiz real: o `<table>` é `w-full`, e sem nenhum peso de largura o
layout automático do HTML distribui a sobra de espaço entre as colunas -
como só a coluna principal tem fundo próprio
(`bg-table-column-primary`), é nela que essa sobra "aparece" como vazio,
mesmo com nome curto (nas outras colunas a mesma sobra existe, só não se
nota porque o fundo é igual ao da linha). Adicionado `width: "1%"` só na
coluna principal - truque clássico de tabela HTML pra "não dar peso
extra" no layout automático - ela agora encolhe pro tamanho real do
maior valor visível (cabeçalho ou célula), e
`--table-column-primary-max-width` continua sendo só o teto pra nome
realmente longo.

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` em
`table.tsx`/`ListView.tsx` → 0 problemas. Teste visual no navegador
ainda pendente de confirmação do usuário.

**Documentação:** `docs/canonical-web-client-standard.md` (seção
Tabela) - parágrafo de tooltip reescrito (automático por padrão,
`TruncatedTextCell` como complemento, não mais obrigatório) e parágrafo
da coluna principal atualizado pra explicar `width: "1%"`.
`docs/backlog.md` - removida a entrada "coluna principal trunca sem
tooltip" (resolvida por este item).

## Cor da tabela: varredura completa das relations de Atividades (2026-11-21)

Depois das 2 rodadas anteriores (item abaixo), usuário pediu um plano
pra revisar **todas** as tabelas do que ele chamou de "módulo de
atendimento" - esclarecido antes de agir (as abas citadas, Participantes/
Encontros/Qualidade/Equipe, são relations de **Atividades**, não de
**Atendimento**/Attendance, que tem Pessoas/Evoluções/Benefícios) -
usuário confirmou: Atividades.

**Varredura (grep `text-foreground` em todo `src/modules/actions`) +
leitura dos arquivos de cada aba, pra achar todo `cell` com cor fixa, não
só o da coluna principal (lição da rodada anterior - "Tipo" também tinha
o bug):**

- **Limpas, sem bug (referência já correta):** Encontros
  (`action-occurrences-section.tsx`, já usa `TruncatedTextCell`) e
  Qualidade (`action-quality-section.tsx` + `renderParticipantIdentity`
  compartilhado em `action-operational-relations.tsx`, já usa
  `font-medium` sem cor fixa).
- **Corrigidas (mesmo padrão das rodadas anteriores - tirado
  `text-foreground`, mantido `font-medium`/`text-xs`/`font-semibold`):**
  - `action-participants-section.tsx` (aba Participantes da Atividade) -
    coluna "Participante" e o valor principal de "Frequência".
  - `action-team-section.tsx` (aba Equipe) - coluna "Pessoa".
  - `meeting-participants-section.tsx` (dentro do Detail de um Encontro,
    aba Participantes) - coluna "Participante".
  - `meeting-responsibles-section.tsx` (dentro do Detail de um Encontro,
    aba Responsáveis) - coluna "Pessoa".
  - `action-people-participation-picker-dialog.tsx` (diálogo
    "Adicionar") - coluna de pessoa.
  - `meeting-team-picker-dialog.tsx` (diálogo "Adicionar responsável" do
    Encontro) - coluna "Pessoa".

Os 3 ajustes de componente compartilhado das rodadas anteriores
(variáveis de checkbox, de coluna fixada, de largura da coluna
principal) já valem automaticamente pra essas 6 telas, sem precisar de
nada específico - só a cor fixa por módulo precisava de correção
arquivo por arquivo.

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` nos 6
arquivos tocados → só a mesma categoria já tolerada
(`react-hooks/set-state-in-effect`, pré-existente em 3 deles, nenhuma
nova). Teste visual no navegador ainda pendente de confirmação do
usuário (as 4 abas da Atividade + Detail de um Encontro + os 2
diálogos).

**Atividades (módulo Activity) fica com a tabela 100% revisada** - as 4
relations do rodapé, as 2 sub-relations dentro de Encontro e os 2
diálogos de adicionar pessoa/responsável. `docs/backlog.md` atualizado:
removida a entrada antiga de "Atividades ainda não revisada" (não
existia mais, mas confirmar se há menção redundante); os módulos que
ainda faltam revisar (mesmo padrão, não tocados) continuam
`occurrences`/`programs`/`tasks`/`projects`/`people-groups`/`people` (o
módulo **Attendance**, de Atendimento, continua só com a coluna
principal corrigida - os outros módulos citados aqui são os que usam a
palavra "Activity"/"Atividade" no código, não confundir com o módulo
Attendance).

## Cor/tamanho da tabela (`ListView`): 2ª rodada - Atividades, checkbox e coluna fixada (2026-11-21)

Usuário testou a correção anterior (item abaixo) na lista principal de
Atividades e reportou 4 problemas restantes: (1) texto da coluna
principal ("Atividade") ainda não acompanha
`--table-column-primary-foreground`; (2) a 2ª coluna ("Tipo") não
acompanha `--table-row-foreground` como as demais; (3) checkbox da
coluna de seleção sem variável própria; (4) nenhuma variável pra cor de
coluna fixada manualmente (menu "Fixar à esquerda/direita").

**(1) e (2) - mesma causa raiz do item anterior, em outro módulo:**
`actions-list-module-client-page.tsx` tinha o mesmo `text-foreground`
fixo - na coluna principal (`<div className="font-medium
text-foreground">`) **e também** em "Tipo", "Inicio", "Cadastro"
(`<span className="text-foreground">`) - confirmando que o bug não é
exclusivo da coluna principal. Corrigidas as 4 colunas (tirado
`text-foreground`, mantido `font-medium`/`text-sm` onde já existia).
Atualizado `docs/backlog.md`: os módulos ainda não revisados podem ter
o mesmo problema em colunas secundárias, não só na principal
(confirmado em `programs`/`tasks` por grep, não corrigidos).

**(3) e (4) - variáveis novas que realmente não existiam:** o checkbox
da coluna `__select__` usava `border-muted-foreground/40` (token
global, não de tabela) pra borda e a cor padrão do componente
(`bg-primary`/`text-primary-foreground`) pro estado marcado - nada
dedicado à tabela. Colunas fixadas manualmente (fora a principal/
seleção) usavam `var(--color-background)` direto. Criadas 4 variáveis em
`globals.css` (`:root`+`.dark`): `--table-checkbox-border`,
`--table-checkbox-checked-background`, `--table-checkbox-checked-foreground`,
`--table-pinned-background`. `SELECTION_CHECKBOX_CLASS_NAME` (`ListView.tsx`)
passou a usar as 3 primeiras **com `!`** - a base `Checkbox`
(`components/ui/checkbox.tsx`) já declara `border-primary`/
`data-[state=checked]:bg-primary` no próprio componente, então sem `!`
a vitória dependeria da ordem de geração do Tailwind (mesma classe de
bug já documentado para `bg-table-column-primary`, agora também no
checkbox). `getPinnedStyles` trocou `var(--color-background)` por
`var(--table-pinned-background)`.

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` em
`ListView.tsx` → 0 problemas; `eslint` em
`actions-list-module-client-page.tsx` → só a categoria já tolerada
(`react-hooks/set-state-in-effect`, pré-existente, linha não tocada
nesta sessão), nenhuma categoria nova. Teste visual no navegador ainda
pendente de confirmação do usuário.

**Documentação:** `docs/canonical-web-client-standard.md` (seção
Tabela) atualizada pra 16 variáveis (eram 10), com as 4 novas na
tabela de referência, nota de que a pegadinha de herança de `color` não
é exclusiva da coluna principal, e um novo caso da "regra de
arquitetura" (classe do `ListView` vs. classe que já vem de dentro do
componente `Checkbox` - `!` é a única saída confiável aqui, não dá pra
mover a base pro elemento pai). `docs/backlog.md` ampliado: a entrada
do `text-foreground` passou a cobrir colunas secundárias, não só a
principal.

## Cor/tamanho da tabela (`ListView`): coluna principal e variáveis, correção + recalibração (2026-11-21)

Usuário revisou as telas de Atendimento (Fase 6) e reportou 4 problemas
na tabela compartilhada: (1) a coluna principal não muda de cor nem de
tamanho; (2) mudar `--table-row-foreground` não muda o texto de todas as
linhas/colunas; (3) mudar `--table-column-primary-foreground` só afeta o
cabeçalho, não o corpo da coluna; (4) pediu uma variável nova pra
controlar a largura da 1ª coluna (ficou grande demais em algumas telas)
e uma recalibração visual das cores ("mais bonito").

**Causa raiz real de (1)-(3):** o `cell` da coluna principal, em
Attendances (e em mais 7 módulos - ver `docs/backlog.md`), envolve o
valor num `<div className="font-medium text-foreground">` - esse
`text-foreground` fixa a cor **dentro** da célula, que é mais interna
que o `<tr>`/`<td>` que carregam as variáveis - herança de `color` não
tem como vencer uma declaração mais interna (não é uma questão de
especificidade CSS). Corrigido em
`attendances-list-module-client-page.tsx` (tirado `text-foreground`,
mantido `font-medium`) - único módulo tocado nesta sessão, por ser o que
estava em revisão; os outros 7 (`occurrences`/`programs`/`tasks`/
`actions`/`projects`/`people-groups`/`people`) foram pro backlog com o
mesmo gatilho.

**Bug adicional, achado durante a investigação:** a célula da coluna
principal, no branch **não agrupado** de `ListView.tsx` (o caminho usado
por toda lista sem `groupByFields`, incluindo Attendances), tinha
`bg-table-column-primary` mas não `!text-table-column-primary-foreground`,
diferente do branch agrupado e do cabeçalho, que já tinham os dois.
Igualado nos 3 lugares.

**Item (4):** nova variável `--table-column-primary-max-width` (320px,
`globals.css`, `:root`+`.dark`) - a coluna principal usava
`{ maxWidth: "none" }` (sem limite nenhum, crescia com o maior valor da
tela); agora trunca com "..." acima de 320px, igual qualquer outra
coluna (`getColumnWidthStyle` em `ListView.tsx`).

**Item "mais bonito":** recalibradas as cores de header/zebra/coluna
principal no tema claro - estavam **idênticas** nas 3 (mesmo valor
oklch, cópia de uma calibração anterior), por isso a tabela parecia "uma
cor só". Agora os 3 fundos usam o mesmo matiz de `--primary` (252) em
luminosidades crescentes de destaque (row 100% > zebra 97.3% > header
95% > coluna principal 93%); tema escuro recebeu o mesmo ajuste de
consistência de matiz (já tinha os 3 fundos distintos, só não alinhados
em matiz). `--table-column-primary-foreground` ganhou um pouco mais de
contraste (0.6 claro / 0.8 escuro, vs. 0.64/0.72 antes).

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` em
`ListView.tsx` → 0 problemas; `eslint` em
`attendances-list-module-client-page.tsx` → só a categoria já tolerada
(`react-hooks/set-state-in-effect`, pré-existente, não tocada nesta
sessão), nenhuma categoria nova. Teste visual no navegador ainda
pendente de confirmação do usuário.

**Documentação:** `docs/canonical-web-client-standard.md` (seção
Tabela) ganhou a 10ª variável na tabela de referência, a pegadinha de
herança de `color` com checklist pra `cell` novo/revisado, e a nota de
que a coluna principal agora trunca (candidata a `TruncatedTextCell`
se algum valor passar de 320px). `docs/backlog.md` ganhou 3 entradas: os
7 módulos com o mesmo `text-foreground` fixo (gatilho: próxima vez que
cada um for tocado), a coluna principal truncando sem tooltip ainda
(gatilho: usuário reportar corte), e `--table-cell-padding-y`
desincronizado entre temas (15px claro/8px escuro - achado, não
corrigido por não ter sido pedido).

## Atendimento — Fase A da revisão de convenção (2026-11-21)

Com a convenção fechada (ver itens acima), o usuário pediu pra iniciar
a atualização do módulo de Atendimento seguindo o checklist já
registrado em `docs/backlog.md` ("Plano de revisão do Atendimento").
Dividido em 2 fases por decisão própria, dado o tamanho: **Fase A**
(só frontend, feita agora) e **Fase B** (schema novo no backend pra
Tags/Notas/Anexos, fica pendente e documentada).

Pesquisei 2 precedentes antes de implementar (2 agentes de exploração):
o padrão de metadata de Activity (`ProjectActionComment`/
`ProjectActionAttachment`, exige schema novo — por isso virou Fase B) e
o padrão de sub-registro com Detail própria de People
(`PeopleRelationDetailShell`/`defineRelationDetailModule`,
Escolaridade como exemplo) — mas o People cria via navegação pra uma
rota `/new`, o que contradiz a convenção de diálogo que acabamos de
fechar, então não copiei esse detalhe literalmente.

**Feito (Fase A):** `attendances-detail-layout-contract.tsx` —
removida a barra de info do header; `mainTab: true` (Detalhes vira a
1ª aba); Pessoas/Evoluções/Benefícios migradas pra
`DetailRelationTablePanel` (mesmo componente que as 7 sub-telas de
People já usam); side ganhou `tabOrder={["activity"]}` pra esconder as
abas erradas (Histórico/Contexto). Evoluções e Benefícios ganharam
Detail própria nova (`/attendances/[id]/evolutions/[evolutionId]`,
`/attendances/[id]/benefits/[benefitId]`, modo edição só — criar
continua pelo diálogo rápido já existente, agora simplificado pra só
criar, sem mais reabrir preenchido pra editar).

**Achado durante a implementação:** `defineRelationDetailModule`
(helper compartilhado, usado por People e agora por Atendimento) não
passava `detailLayout`, e uma validação newer (`registry/types.ts`)
rejeita isso com throw — bug pré-existente que **também** quebrava
`/people/[id]/education/new` (e as outras sub-telas de People do mesmo
molde), não só o código novo. Corrigido no helper compartilhado
(`detailLayout: {}`), consertando os dois módulos de uma vez. Confirmado
com teste real: a rota de Education do People, que estava quebrada,
voltou a funcionar.

**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` nos arquivos
novos/tocados → só a categoria já tolerada (`react-hooks/
set-state-in-effect`), nenhuma nova; `npm run build` → ok, as 2 rotas
novas aparecem. Testado de ponta a ponta no navegador real (servidor
do usuário, não reiniciado, um atendimento com dados): aba Pessoas com
busca/Colunas/Filtros via `DetailRelationTablePanel`; aba Evoluções
mostra o registro existente numa tabela de verdade; criado 1 benefício
pelo diálogo ("Novo" → preencher → "Criar") — fecha sem navegar, lista
atualiza, toast confirma; clicado na linha do benefício → abriu a tela
de Detail nova, com breadcrumb (Atendimentos > tipo > nome do
benefício), editei a Quantidade e autosave confirmado persistido via
API; aba Auditoria da tela nova mostra o evento real de criação. Dado
de teste removido via API ao final.

**Não fechado nesta sessão (Fase B, documentada em
`docs/backlog.md`):** Tags/Notas/Anexos de verdade no side do
Atendimento (hoje só Auditoria) — depende de schema novo no backend
(tabelas de comentário/tag/anexo + categoria de upload nova),
trabalho de backend genuíno, fora do escopo desta revisão de UI.

**Achado incidental, não tocado:** o atendimento usado pra testar
(`Social`, profissional "Bianca Torres", 4 pessoas vinculadas, 1
evolução de texto "teste") já existia antes desta sessão - não fui eu
quem criou, parece sobra de teste de uma sessão anterior que não foi
limpa. Mesma situação do "Atividade Nova" sinalizado antes. Vale
conferir e decidir se apaga.

## Item avulso — convenção de criação em relation vira regra única: sempre diálogo (2026-11-21)

Depois da revisão de convenção acima, o usuário pediu pra decidir entre
duas opções especificamente pro "Novo" do Encontro: manter a tela de
Detail completa reaproveitada (como é hoje) ou trocar por um diálogo
rápido com clique na linha levando ao Detail depois. Analisei os campos
realmente obrigatórios do Encontro pra criar (só Data + Início — Título
se auto-gera, Status fica travado em "Agendado", Grupos/Notas/
Planejamento/Fotos são opcionais ou só aparecem em modo edit) e
recomendei diálogo, já que cabe confortavelmente nos campos mínimos.
Usuário concordou e foi além: decidiu que essa vira **a convenção única
do projeto para criar dentro de qualquer relation, em qualquer módulo,
sem exceção** — inclusive pra registros antes considerados "complexos
demais pra diálogo" (o próprio Encontro, que era a referência dessa
exceção). "Novo" sempre abre diálogo (de seleção ou de criação rápida,
inclusive o fluxo em lote); clicar na linha sempre abre o Detail
completo pra editar mais.

**Implementado nesta sessão, como prova concreta da convenção:**
`MeetingQuickCreateDialog` (`modules/actions/features/manage/ui/
meeting-quick-create-dialog.tsx`) — diálogo novo com só Título
(opcional)/Data/Início/Término, chama `createMeeting` existente. O botão
"Novo" da aba Encontros (`action-occurrences-section.tsx`) trocou de
`router.push("/meetings/new")` pra abrir esse diálogo; ao criar, o
diálogo fecha, a lista recarrega e um toast confirma — sem navegar pra
lugar nenhum, permitindo criar vários Encontros avulsos em sequência
sem sair da Atividade. Clicar numa linha já criada continua levando pro
Detail completo (`/meetings/[id]`), inalterado. A rota `/meetings/new`
e o modo `create` do Detail do Encontro **não foram removidos** —
decisão deliberada de não arriscar uma limpeza maior sem necessidade
(a rota não tem mais nenhum link apontando pra ela na UI, mas continua
funcional via URL direta; avaliar remoção numa sessão de limpeza, não
nesta).
**Evidência:** frontend `tsc --noEmit` → 0 erros; `eslint` nos 2
arquivos tocados → só a categoria já tolerada em todo o projeto
(`react-hooks/set-state-in-effect`), nenhuma categoria nova; `npm run
build` → ok. Testado de ponta a ponta no navegador real (servidor do
usuário, não reiniciado): aba Encontros → "Novo" abre o diálogo com os
4 campos; preenchido Data+Início e confirmado → diálogo fecha, toast
"Encontro criado" aparece, a nova linha ("Agendado") surge na lista
junto com o Encontro do seed, sem navegar pra fora da Atividade; zero
erro de console/HTTP. Encontro de teste removido via API ao final;
nenhum dado de seed alterado.

**Documentação:** `docs/canonical-web-client-standard.md` reescrita —
a seção "Criar dentro de uma relation" virou regra única (antes tinha 2
ramos, um deles permitindo tela dedicada pra caso complexo); registra
`MeetingQuickCreateDialog` como a 2ª referência viva (ao lado de
`OccurrencePeoplePickerDialog`). `docs/backlog.md` atualizado: a entrada
do plano de revisão do Atendimento ajustada pra não citar mais o
Encontro como exemplo de "pode ter tela dedicada" — agora reforça que
nem ele é exceção.

**Correção, mesma sessão (logo em seguida):** usuário revisou o
resultado e simplificou mais um passo — reparou que o Encontro já tinha
2 botões de criação em paralelo (`Novo`, que eu tinha acabado de trocar
pro diálogo rápido, e "Agendar em lote", que já existia antes e abre
`BulkScheduleOccurrencesDialog`). Decisão: **isso suja o padrão "só o
botão Novo"** — o diálogo de lote já resolve criar um só registro também
(basta `De` = `Até` com o dia da semana marcado, o preview mostra
exatamente 1 data), então não precisa de 2 diálogos fazendo
essencialmente a mesma coisa. `MeetingQuickCreateDialog` **foi removido
nesta mesma sessão** (arquivo apagado, nunca chegou a ser commitado) —
o botão "Novo" agora abre direto o `BulkScheduleOccurrencesDialog`
(mesmo componente de antes), e o botão secundário "Agendar em lote"
foi removido do `viewSwitcherSlot`. Convenção final, documentada em
`docs/canonical-web-client-standard.md`: **um único botão "Novo" por
relation, em qualquer módulo**, abrindo um diálogo que resolve criar 1
ou N registros de uma vez quando fizer sentido (não precisa de dois
fluxos/dois botões separados).
**Evidência:** `tsc --noEmit` → 0 erros; `eslint` → só a mesma categoria
já tolerada (2 ocorrências, ambas pré-existentes, nenhuma nova); `npm
run build` → ok. Testado no navegador: só "Novo" aparece na barra da
aba Encontros; clicar nele abre "Agendar encontros" (o diálogo que já
existia); testado criar 1 único Encontro por esse mesmo diálogo (`De`=
`Até`=18/12/2026, dia "Sex" marcado) → preview mostrou "1 de 1 data(s)",
confirmado criou exatamente 1 Encontro; zero erro de console/HTTP.
Encontro de teste removido via API ao final. **Achado incidental, não
tocado:** a atividade tinha um Encontro residual chamado "Atividade
Nova" (não criado por mim nesta sessão) — sinalizar pro usuário
confirmar se é dado de teste esquecido de uma sessão anterior ou dado
real, antes de alguém excluir.

## Revisão de convenção visual: Atividades + documentação (2026-11-21)

Usuário revisou as telas de Atendimento (Fase 6, item acima) e apontou
que saíram fora do padrão visual atual — Atendimento copiou Ocorrências
(Fase 5), que nunca foi atualizada para as mudanças de convenção que
vieram depois (2026-11-18/19/20). Pediu: revisão das telas de
Atendimento com plano de correção (pra sessão futura), atualização do
módulo de Atividades (referência "mais atualizada") pra bater 100% com
a convenção, e documentação da convenção revisando falhas — incluindo
uma regra nova: criar vínculo N:N usa diálogo rápido que fica aberto
entre seleções (já era assim em `OccurrencePeoplePickerDialog`), mas
toda linha criada continua precisando de uma tela de Detail própria
pra edição depois (o que faltava pra Evoluções/Benefícios do
Atendimento).

Investigação (2 agentes de exploração, depois leitura direta dos
arquivos críticos) confirmou que Atividades já está conforme em quase
tudo — único bug real: o Encontro (`meeting-detail-layout-contract.tsx`,
relação da própria Atividade) ainda tinha a barra de info no header
(`header.slot` mostrando só "Status"), regressão isolada que escapou da
migração original de 2026-11-18, mesmo a Atividade-mãe já estando limpa
(Status já existe na 1ª linha do formulário principal, então a barra
era pura duplicação).

**Código:** removido `header.slot` + a função `resolveStatusBadge`/
import `Badge` que só serviam a ele, de
`meeting-detail-layout-contract.tsx`. **Evidência:** frontend `tsc
--noEmit` → 0 erros; `eslint` no arquivo → 0 problemas; `npm run build`
→ ok, rotas `/meetings/[id]`/`/meetings/new` intactas. Testado no
navegador real (servidor do usuário, não reiniciado): abriu um Encontro
existente do seed, confirmado que a tela renderiza sem a barra (header
fica só "Encontro · Pronto" + abas Detalhes/Participantes/Responsáveis
coladas embaixo) e o campo Status continua funcional no formulário
principal; zero erro de console/HTTP.

**Documentação:** `docs/canonical-web-client-standard.md` ganhou (a)
regra nova em `relationSlot` distinguindo vínculo-com-diálogo-que-fica-
aberto (referência `OccurrencePeoplePickerDialog`) de sub-registro-com-
Detail-própria (referência Encontro), substituindo a frase vaga antiga;
(b) correção das listas de "ainda não migrado" (barra de header e
`sideSlot`) pra incluir People/Occurrences/Attendances, que não
estavam listados; (c) nota de que Occurrences/Attendances ainda usam o
mecanismo antigo de relation (`DetailRelationConfig`), achado novo; (d)
nome explícito da prop `mainTab` (a doc nunca citava o nome literal).
`docs/backlog.md` ganhou: correção da entrada de 2026-11-18 sobre
`RelationListHost` (Participantes/Qualidade/Equipe da Atividade já
migraram em 2026-11-19 — a entrada estava desatualizada; refocada pra
Occurrences/Attendances, que são o gap real hoje); entrada nova sobre
People usar um sistema de abas próprio (não `mainTab`); e a entrada
principal pedida pelo usuário — **plano de revisão completo do
Atendimento**, com os 6 pontos concretos a corrigir (barra de header,
`mainTab`, migração de relation, tabela compartilhada, metadata de 4
abas — que exige schema novo no backend — e Detail próprio por
Evolução/Benefício), gatilho "sessão dedicada de revisão de módulos",
como o usuário pediu.

Nenhuma mudança de código em People/Occurrences/Attendances nesta
sessão — só documentação do que precisa mudar, para a sessão futura.

## Fase 6 do plano mestre (Atendimento) — concluída (2026-11-21)

Implementada a pedido explícito do usuário ("implemente tudo e teste
depois"), direto em cima dos itens avulsos já registrados abaixo (que
vieram antes, preparando o terreno). Evidência completa, decisões de
nomenclatura e teste de ponta a ponta (API + navegador real) estão em
`docs/terceiro-gestor-plano-de-desenvolvimento-modulos-atendimento-e-projetos.md`,
seção "Fase 6 — Atendimento (social/psicológico)" — não duplicado aqui.

Resumo: módulo novo `Attendance`/`AttendancePeople`/
`AttendanceEvolution`/`AttendanceBenefit` (migration
`20261121172107_add_attendance`, sem drift), módulo backend
`attendances` completo (CRUD + sub-recursos de pessoas/evoluções/
benefícios), permissões `attendances.*` (Admin/Gestor/Atendimento/
Leitor — exigiu `npm run build:seed && npm run db:seed` pra sincronizar
o tenant de teste, mesmo achado da Fase 5), módulo frontend canônico
`attendances` completo (lista + detalhe com abas Pessoas/Evoluções/
Benefícios), botão novo "Registrar atendimento" no header da Ocorrência.
**Evidência:** backend `tsc --noEmit` 0 erros, `npm test` 30 suítes/159
testes sem regressão, `npm run build` ok; frontend `tsc --noEmit` 0
erros, `npm run build` ok (3 rotas novas); `eslint` sem categoria nova
em nenhum arquivo tocado. Testado de ponta a ponta com servidores reais
do usuário (não reiniciados por mim) — critério de teste da Fase 6
batido exatamente (atendimento psicológico com 2 pessoas, 2 evoluções,
1 benefício, encerramento com parecer, e reabertura). Todos os dados de
teste removidos via API; nenhum dado de seed alterado.

## Item avulso — Encontro ganha Título (editável, auto-gerado se vazio) (2026-11-21)

Usuário testou os pontos 1+2 acima e pediu um ajuste: Encontro precisa de
um campo "Título" - se o usuário escrever algo (ex.: "Dinâmica sobre
bullying"), vira o título; se deixar em branco, gera automaticamente
"Encontro - dd/mm/aaaa" (inclusive nos Encontros criados em lote, que
nunca pedem título por item). Em qualquer caso o campo continua
**editável depois** - o educador/facilitador/responsável pode ajustar no
dia do encontro.

**Schema:** migration `20261121140400_add_meeting_title` - `Meeting.title
String @default("")` (não nulo, sempre tem valor real; o default vazio é
só rede de segurança da migration em cima de linhas já existentes - a
aplicação nunca grava string vazia de propósito). 17 Encontros do seed já
existentes (sem título) corrigidos com um backfill pontual (SQL direto via
`pg`, mesma fórmula de título usada no service) - sem tocar em nenhum
outro dado.

**Backend:** `buildDefaultMeetingTitle(scheduledDate)` (novo helper em
`actions.service.ts`) - `createActionOccurrence`/`bulkCreateActionOccurrences`/
`updateActionOccurrence` passam a usar: título informado e não-vazio vence,
senão gera o padrão a partir da data (na edição, limpar o campo também
regenera o padrão, mesma regra de "nunca fica vazio de verdade"). DTOs
`CreateActionOccurrenceDto`/`UpdateActionOccurrenceDto` ganham `title?`
(`@MaxLength(160)`, mesmo limite já usado em `Activity.title`) -
`BulkCreateActionOccurrencesDto` não ganha, de propósito (nunca pede
título por item). **Evidência:** `npx prisma migrate dev` → sem drift;
`tsc --noEmit -p tsconfig.build.json` → 0 erros; `npm test` → 29
suítes/153 testes sem regressão.

**Frontend:** campo "Título" novo no Detail do Encontro
(`meeting-detail-layout-contract.tsx`), campo-âncora acima de Data/Status
(mesmo princípio já usado no formulário da Atividade), com placeholder
explicando o auto-preenchimento; título real substitui o antigo texto fixo
"Encontro - {data}" no header/breadcrumb; lista de Encontros
(`action-occurrences-section.tsx`) ganha coluna "Título" como coluna
primária (`TruncatedTextCell`, mesma convenção das outras tabelas), entra
também na busca por texto e no card do Calendário. **Evidência:** `tsc
--noEmit` → 0 erros.

**Testado via navegador real** (Playwright + Chromium, login real,
servidores do usuário - não foram reiniciados por mim): campo Título
presente no formulário de criação; deixado em branco, ao salvar o H1 e o
próprio campo mostram "Encontro - 05/12/2026" (bate exatamente com a data
escolhida); editar o campo pra "Dinâmica sobre bullying" e sair do campo
atualiza o H1 na hora (autosave por campo); de volta na lista de
Encontros, a linha mostra "Dinâmica sobre bullying" na coluna Título.
Zero erro de console. Encontro de teste excluído via API ao final;
servidores confirmados de pé (`200`) antes e depois.

## Item avulso — revisão do módulo de Projetos, pontos 1+2: equipe hierárquica (Projeto→Atividade→Encontro) + Detail do Encontro (2026-11-21)

Revisão de estrutura/regras de negócio do módulo de Projetos, a pedido
explícito do usuário, antes de seguir para a Fase 6 do plano mestre. Dois
pontos discutidos e aprovados via plano (`EnterPlanMode`/`ExitPlanMode`)
antes de implementar:

1. **Equipe hierárquica.** Hoje a equipe era registrada de 3 formas
   desconectadas: Projeto só via Grupos (`ProjectPeopleGroup` kind=TEAM),
   Atividade com pessoa+papel individual (`ProjectActionPeopleParticipation`),
   Encontro só via Grupos (`ActionOccurrenceTeamGroup`) - sem nenhum campo
   individual de "responsável pelo encontro", impedindo relatórios como
   "encontros por profissional" ou "equipe do projeto". **Decidido:**
   pessoa+papel individual nos 3 níveis, com **cadeia automática subindo**
   (Encontro→Atividade→Projeto) ao vincular no nível mais baixo - nunca
   remove sozinha, cadastro direto em Atividade/Projeto continua
   funcionando, Grupos continuam mecanismo paralelo (não expandem em
   linhas individuais). Um único enum de papel nos 3 níveis
   (`ActionPeopleParticipationRole`, já usado pela Atividade - nenhum enum
   novo). Teto de 10 responsáveis por Encontro, sem mínimo obrigatório.
   Criação de pessoa nova sem sair do Encontro **ficou de fora desta
   rodada**, de propósito - registrado em `docs/backlog.md` como próximo
   ponto.
2. **Detail do Encontro.** A convenção do projeto é "criar sempre abre o
   Detail em modo create" - Encontro não seguia isso (só existia como
   diálogo, `EditOccurrenceDialog`, dentro da aba "Encontros" da
   Atividade, sem rota própria). Ganhou uma tela de Detail de verdade
   (`DetailShellEngine`/`defineRecordModule`, mesmo motor genérico de
   Atividade/Ocorrência), com abas Detalhes/Participantes/Responsáveis -
   também serviu de teste de que o motor genérico aplica todas as
   convenções visuais já fechadas numa entidade aninhada nova (precisa de
   `projectId`+`actionId`, não só `id`).

**Schema:** migration `20261121030354_add_project_meeting_team_participation`
- `ProjectTeamParticipation` (equipe do Projeto, mesmo formato de
  `ProjectActionPeopleParticipation` um nível acima, com soft-timeline
  `isActive`/`startsAt`/`endsAt`/`deletedAt`/`activeKey`) e
  `MeetingTeamParticipation` (equipe do Encontro, vínculo pontual sem
  janela de tempo, mais parecido com `OccurrencePeople`). Aplicada sem
  drift via `npx prisma migrate dev`.

**Backend** (`actions.service.ts`, `project-structure.service.ts`/
`.controller.ts`, `project-actions.controller.ts`):
`ensurePersonOnActivityTeam`/`ensurePersonOnProjectTeam` (idempotentes,
devolvem se criaram vínculo novo, pro resumo do aviso no frontend);
`addMeetingTeamParticipations` valida o teto de 10 e dispara a cadeia pra
cada pessoa nova; `listMeetingTeamParticipations`/
`removeMeetingTeamParticipation`; CRUD de `ProjectTeamParticipation`
(`listTeamParticipations`/`createTeamParticipation`/`endTeamParticipation`,
reaproveita permissões `project-structure.*` já existentes - nenhuma
permissão nova). Endpoint singular novo
`GET :projectId/actions/:actionId/occurrences/:occurrenceId` (não existia -
só list/create/update/delete/bulk), necessário pra Detail carregar direto
pela URL. **Evidência:** `npx prisma migrate dev` → sem drift; `tsc
--noEmit -p tsconfig.build.json` → 0 erros; `npm test` → 29 suítes/153
testes sem regressão; `eslint` nos arquivos tocados → medido via diff
contra baseline (`git stash`), todo problema novo introduzido foi
corrigido manualmente (nenhum lote de `--fix`, pra não misturar com a
dívida pré-existente já documentada).

**Frontend:** aba "Equipe" nova no Projeto (`project-team-section.tsx` +
`project-team-picker-dialog.tsx`, autocontido, mesmo padrão de
`ProjectGoalsSection`); `MeetingResponsiblesSection`/
`MeetingTeamPickerDialog` (busca entre pessoas já cadastradas via
`listPeople`, sem criar pessoa nova - decisão registrada acima); módulo
novo `modules/actions/features/meetings/` (detail-only, sem lista/nav
própria - só acessível a partir da aba "Encontros" da Atividade) com
`meeting-detail-layout-contract.tsx` (`mainTab` pro form virar a 1ª aba
"Detalhes", campos obrigatórios com asterisco) e
`MeetingParticipantsSection` (presença+avaliação do Encontro, agora com
`ListView`+avatar, substituindo a tabela manual `<table>` sem foto);
rotas `app/.../meetings/new` e `.../meetings/[id]`; registro em
`web-client/registry/actions/meetings.tsx` +
`web-client/registry/index.ts`; `action-occurrences-section.tsx`: clique
na linha e botão "+" agora navegam pro Detail (`EditOccurrenceDialog` e
a tabela manual de presença removidos, ~650 linhas de código morto);
"Agendar em lote" (`BulkScheduleOccurrencesDialog`) continua existindo
como ação secundária, ao lado do switcher Lista/Calendário. **Evidência:**
`tsc --noEmit` → 0 erros; `npm run build` → ok, rotas `/meetings/[id]` e
`/meetings/new` aparecem; `eslint` nos arquivos novos/tocados → só
`react-hooks/set-state-in-effect` (categoria já tolerada em todo o
projeto, mesmo padrão de `ProjectGoalsSection`/`OccurrencePeoplePickerDialog`),
2 `no-unused-vars` corrigidos (helpers mortos após remover o diálogo).

**2 bugs reais achados e corrigidos durante o teste end-to-end (Playwright
+ Chromium, login real, backend e frontend de pé):**

1. **Modo create/edit errado no Detail do Encontro.** `mode = id === "new"
   ? "create" : "edit"` assumia que `useParams().id` seria literalmente
   a string `"new"` - verdade em `/meetings/[id]` navegando com esse
   valor, mas **falso** na rota própria `/meetings/new/page.tsx` (sem
   segmento `[id]` nenhum, `params.id` vem `undefined`). Resultado: a
   tela de criação carregava em modo "edit" por engano - abas
   Participantes/Responsáveis apareciam antes de salvar, campos de
   RichText/fotos também, e não tinha botão "Salvar" (`onSave` só é
   passado em modo create). Mesmo bug que `OccurrencesDetailEngineClientPage`
   já tinha resolvido com um fallback (`|| pathname.endsWith("/occurrences/new")`)
   que eu não tinha copiado - corrigido aplicando o mesmo fallback.
2. **Exclusão de Encontro com responsável quebrava com erro 500.**
   `MeetingTeamParticipation.meetingId` é FK RESTRICT (mesmo padrão
   manual de cascade do resto do arquivo) - excluir um Encontro que já
   tinha um responsável vinculado falhava. Corrigido adicionando
   `meetingTeamParticipation.deleteMany` ao mesmo bloco de limpeza manual
   que já existe em `deleteActionOccurrence` (igual já é feito pra
   `meetingAttendance`/`actionOccurrenceTeamGroup`/
   `actionOccurrencePeopleGroup`) - só remove o vínculo pontual deste
   Encontro, não mexe no que já foi encadeado pra Atividade/Projeto.

**Testado de ponta a ponta via navegador real** (Playwright + Chromium,
login `admin@seed.local`, backend e frontend reais de pé, sem mock):
aba "Equipe" nova aparece no Projeto; aba "Encontros" da Atividade mostra
os botões "Novo"/"Agendar em lote" corretos; clicar "Novo" abre o Detail
em `/meetings/new?projectId=&actionId=` com só a aba "Detalhes" e
asterisco em Data/Início; preencher e salvar cria o Encontro (`POST
.../occurrences` → `201`) e navega pro Detail real
(`/meetings/{id}?...`), que agora mostra as 3 abas
Detalhes/Participantes/Responsáveis; aba "Responsáveis" lista
"Adicionar responsável", abre o picker (10 pessoas carregadas via
`listPeople`), selecionar "Bianca Torres" e confirmar devolve `201` e o
toast "Equipe atualizada ... equipe desta Atividade e equipe do Projeto";
**confirmado via API direta** (não só pelo toast) que "Bianca Torres"
passou a existir simultaneamente nas 3 tabelas
(`MeetingTeamParticipation`/`ProjectActionPeopleParticipation`/
`ProjectTeamParticipation`), todas com `role: FACILITADOR`. Dados de
teste (4 Encontros de teste, a participação em cadeia de Bianca Torres)
removidos via API ao final - `endProjectTeamParticipation`/
`endProjectActionPeopleParticipation` (soft-end) e `deleteMeeting` (hard
delete, sem soft-delete nesta fase - sinalizado acima); nenhum dado de
seed foi alterado.

## Item avulso — causa raiz do sticky quebrado: 2 containers de scroll + List Principal sem altura travada (2026-11-20)

Usuário testou a correção anterior (barra de seleção sticky em Encontros)
e reportou: Encontros ficou fixo mas com espaçamento estranho e visível
vazio; o List Principal de Atividades (visualmente mais correto) não
fixava **nada** (nem cabeçalho nem barra), tudo rolava junto. Pediu pra
deixar tudo igual ao List Principal, porém fixado - e mostrar os
arquivos ao final.

**Investigação levou a 2 causas raiz, não mais um ajuste pontual:**

1. **Dois contêineres de scroll aninhados.** `components/ui/table.tsx`
   tinha seu próprio `overflow-x-auto`, dentro do `overflow-auto` que
   `ListView.tsx` já tem um nível acima - `position: sticky` só
   funciona relativo ao contêiner de scroll **mais próximo**, que era o
   de dentro (só rola horizontal, nunca vertical) - por isso sticky
   vertical nunca tinha efeito em lugar nenhum, nem no List Principal.
   Corrigido removendo `overflow-x-auto` de `table.tsx` (confirmado por
   grep: só `ListView.tsx` importa de lá, zero efeito colateral).
2. **Nenhuma tela de List Principal tem altura de viewport travada em
   lugar nenhum do sistema** - só o Detail já tinha isso
   (`DetailShell.tsx`, via `lg:h-[calc(100vh-var(--app-shell-sticky-offset))]`).
   Sem uma altura **limitada**, o contêiner de scroll do `ListView`
   nunca precisa rolar de verdade (sempre do tamanho exato do
   conteúdo) - sticky relativo a ele nunca ativa, mesmo com overflow
   "correto". Perguntei ao usuário antes de mexer (isso muda o
   comportamento de scroll de **todas** as telas de lista do sistema,
   não só Atividades) - aprovado.

**Mudanças:**

- `components/ui/table.tsx`: removido `overflow-x-auto` do container da
  `Table` - único contêiner de scroll agora é o de `ListView.tsx`.
- `web-client/record/RecordListHost.tsx`: wrapper do List Principal
  ganhou `lg:h-[calc(100vh-var(--app-shell-sticky-offset,0px))]`
  (reaproveita a mesma variável que `DetailShell.tsx` já usa, medida
  globalmente por `AppShell.tsx`) + `{children}` movido pra dentro de um
  grid `lg:grid-rows-[minmax(0,1fr)_auto]` (lista rola, paginação fica
  sempre visível). Só em `lg:`, mobile continua igual.
- `web-client/views/ListView.tsx`: prop renomeada
  `stickyHeaderOffsetClassName` (string) → `stickyHeaderOffsetPx`
  (número) - precisava virar número pra `ListView` somar sozinho a
  altura da própria barra de Colunas/seleção (`BULK_BAR_HEIGHT_PX = 36`)
  ao offset recebido. Essa barra agora **sempre existe no DOM** (nunca
  monta/desmonta - só o conteúdo interno aparece/some) e, quando há
  offset (relation), também vira sticky automaticamente.
- `action-occurrences-section.tsx` (Encontros): removida a barra
  "Excluir selecionados" escrita à mão (`<div sticky ...>` que eu tinha
  adicionado na rodada anterior) - migrado pra usar `bulkActions` do
  `ListView`, **o mesmo mecanismo que o List Principal já usa** - elimina
  a implementação duplicada/divergente que causava o espaçamento
  estranho. `stickyHeaderOffsetPx={117}` (só abas+toolbar - a barra de
  seleção é somada automaticamente agora, não precisa mais somar 36 na
  mão).
- `action-participants-section.tsx`, `action-quality-section.tsx`,
  `action-team-section.tsx`: só renomeado `stickyHeaderOffsetClassName="top-[117px]"`
  → `stickyHeaderOffsetPx={117}`.

Checkpoint: `tsc --noEmit` exit 0 (frontend), `eslint` limpo em todos os
6 arquivos tocados (`ListView.tsx`, `table.tsx`, `RecordListHost.tsx` e
os 4 arquivos de relations de Atividades - sem nenhum problema novo).
Documentado em `docs/canonical-web-client-standard.md`: seção de sticky
reescrita do zero com o estado final + histórico das 2 tentativas
erradas, e uma lição nova na seção "Por que sticky às vezes não gruda"
(altura ilimitada quebra sticky tanto quanto overflow errado).
**Teste manual pendente** - servidores em dev com o usuário; vale
testar em pelo menos mais um módulo de List Principal (People ou
Projects) já que o mecanismo agora é compartilhado por todos.

## Item avulso — ordem checkbox/nome + salto de scroll ao excluir em Encontros (2026-11-20)

Usuário reportou 2 problemas depois de testar a exclusão em lote:

1. **Lista principal de Atividades:** a coluna "Atividade" (fixada à
   esquerda, `initialColumnPinning={{ left: ["title"] }}`) aparecia
   **antes** do checkbox de seleção, mesmo a seleção sendo sempre a
   primeira coluna declarada. Causa: o TanStack reordena colunas fixadas
   pra frente de todas as outras - a coluna principal fixada furava a
   fila na frente da seleção, que nunca era fixada por conta própria.
   Corrigido em `ListView.tsx`: ao montar o `columnPinning` inicial, se
   `enableRowSelection` + alguma coluna fixada à esquerda, `__select__` é
   prefixado automaticamente nessa lista - nenhum módulo precisa lembrar
   disso. `getCellStyle` também precisou tratar a coluna de seleção como
   "coluna líder" (solta o `background` inline da fixação, mas mantém a
   largura fixa de 32px - diferente da coluna principal, que também
   solta a largura).
2. **Aba Encontros: clicar "Excluir selecionados" fazia a tela "rolar"
   sozinha.** Causa: a barra da seleção (`action-occurrences-section.tsx`)
   só existia no DOM quando havia seleção (`? <div> : null`) - ao excluir
   e a seleção limpar, a barra desaparecia, a altura do que fica acima da
   tabela encolhia de repente, e o cabeçalho sticky (ancorado num offset
   fixo em px, `stickyHeaderOffsetClassName="top-[117px]"`) recalculava a
   posição na hora - pareceu scroll, mas era layout mudando embaixo do
   cabeçalho fixo.

**Primeira correção, rejeitada pelo usuário:** só reservar altura fixa
pra essa barra (`h-9`, sempre no DOM, só o conteúdo interno some), sem
fixá-la. Não funciona - a barra reservada não é sticky, então ao rolar
ela sai de tela normalmente (só ocupava espaço antes de rolar), mas o
cabeçalho (ancorado contando com essa altura) continua parado no offset -
abriu um vão sem nada cobrindo, com as linhas da tabela visíveis rolando
por trás do cabeçalho. **Correção certa (aplicada):** a própria barra
também é `sticky top-[117px] z-10`, com fundo opaco (`bg-table-header`) -
nunca sai de tela, só o conteúdo (texto + botão) aparece/some. Cabeçalho
da tabela continua em `top-[153px]` (117 + 36 da altura da barra).

Checkpoint: `tsc --noEmit` exit 0, `eslint` sem problema novo em
`ListView.tsx` (limpo) e `action-occurrences-section.tsx` (os 4 erros de
`react-hooks/set-state-in-effect` são pré-existentes, linhas não tocadas
por este diff). Documentado em `docs/canonical-web-client-standard.md`:
regra da coluna de seleção fixada automaticamente junto da principal, e
regra geral "nenhuma barra condicional dentro do contexto sticky - sempre
reservar altura fixa, nunca montar/desmontar".

## Item avulso — exclusão segura de Atividades: status INACTIVE + soft delete (2026-11-20)

Usuário notou que Atividades não tinha o checkbox de exclusão (que
ganhou na aba Encontros) na lista principal, e propôs a regra: só
permitir excluir com um status "Inativo", e a exclusão em si ser soft
delete - "assim mantemos com maior segurança o risco de perda de dados.
E com SoftDelete eu como desenvolvedor posso fazer limpezas periódicas
no banco." Pedido pra valer como padrão de todo o projeto (People,
Projects...), mas implementado só em Atividades nesta rodada (Projects/
People registrados no backlog).

Entrei em modo de planejamento (`EnterPlanMode`) dado o tamanho real:
migration de schema + mudança de regra de negócio + reconsulta de todo
lugar que lê Activity + UI. Investigação prévia (2 agentes Explore)
confirmou: `ActionStatus` já tinha `CANCELED` (decidido remover e usar
`INACTIVE` no lugar, já que nenhum registro de dev usava `CANCELED` -
troca seria segura); toda operação Prisma já é auditada automaticamente
(snapshot `before`/`after`, mesmo em hard delete); soft delete já é
padrão estabelecido no schema (`ProjectEnrollment`, `PeopleGroupParticipation`,
`ProjectActionPeopleParticipation` já tem `deletedAt` + o mesmo formato
de service method).

**Imprevisto real, resolvido sem perda de dado:** `prisma migrate dev`
recusou aplicar a migration porque um arquivo de migration **já
aplicada** (`20261116220000_add_meeting_people_group_n_n`) tinha sido
alterado depois de aplicada (efeito colateral do commit `829c9cb`,
rename "Grupo"→"Grupos" em massa, que acabou tocando um comentário SQL
dentro dela) - checksum não batia mais, e o Prisma só oferecia
`migrate reset` (apaga o banco de dev inteiro). Antes de aceitar isso,
verifiquei o diff exato: era só um comentário (`-- DataMigration: copia
o Grupos singular...`, sem efeito em dado/estrutura) - revertido esse
comentário de volta pro texto original, o descompasso desapareceu sem
precisar resetar nada. (Usuário confirmou a renomeação "Grupo de
Pessoas"→"Grupos" em si está correta e consistente no código - só
restava em docs/histórico e em registros de log antigos do próprio
`PLAN.md`, como esperado.)

**Mudanças:**

- `schema.prisma`: `ActionStatus` `CANCELED` → `INACTIVE`; `Activity.deletedAt
  DateTime?` novo. Migration escrita manualmente (`20261120120000_rename_action_status_to_inactive_and_soft_delete`,
  seguindo o padrão de "recriar enum" já usado em `20261113170301_remove_project_group`)
  e aplicada via `prisma migrate deploy` (o terminal não suporta o modo
  interativo de `migrate dev` aqui).
- `actions.service.ts`: `deleteProjectAction` agora é `update({ data:
  { deletedAt: new Date() } })` com `BadRequestException` se `status !==
  'INACTIVE'` - os 8 `deleteMany` em cascata que existiam (FKs RESTRICT)
  foram removidos, não fazem sentido mais (update nunca dispara RESTRICT).
  `deletedAt: null` adicionado em `buildProjectActionWhere`/
  `ensureProjectActionExists`; mesma coisa em `project-structure.service.ts`
  (contagem pra bloquear exclusão de Goal) e `dashboard.service.ts` (2
  agregações).
- Frontend: `ActionStatus`/`ACTION_STATUS_LABELS`/`ACTION_STATUS_OPTIONS`
  (`CANCELED`→`INACTIVE`, label "Inativa"), os 2 `switch` que tratavam o
  badge de status (`project-action-manage-dialog.tsx`,
  `actions-list-module-client-page.tsx`). Nova constante
  `ACTION_DELETABLE_STATUS`. Lista principal de Atividades
  (`actions-list-module-client-page.tsx`) ganhou `enableRowSelection` +
  `bulkActions` ("Excluir selecionados") - valida no cliente que toda
  linha selecionada está `INACTIVE` antes de confirmar (mensagem clara se
  não, sem exclusão parcial), `useConfirm` + `runInBatches` contra o
  mesmo endpoint de delete existente (sem endpoint de lote novo, mesma
  decisão já tomada pra Encontros).

**Checkpoint:** backend `npx tsc --noEmit -p tsconfig.build.json` exit 0.
`npx eslint` nos 3 arquivos de backend tocados - sem erro novo, exceto 2
ocorrências de `no-unsafe-member-access` em `deleteProjectAction`
(`existing.deletedAt`/`existing.status`), herdadas do retorno já sem
tipo próprio de `ensureProjectActionExists` (debt pré-existente, não uma
categoria nova). Frontend `npx tsc --noEmit` exit 0, `eslint` limpo (o
erro de `react-hooks/set-state-in-effect` que aparece em
`actions-list-module-client-page.tsx` é pré-existente - `git diff`
confirma que a linha em si não foi tocada).
**Documentado** em `docs/canonical-web-client-standard.md` (nova seção
"Exclusão é sempre soft delete, atrás de um status terminal do próprio
módulo") e `docs/backlog.md` (item pra estender o mesmo padrão a
Projects/People, com o porquê de cada um precisar de uma decisão própria
em vez de copiar `INACTIVE` igual).
**Teste manual:** pendente - servidores em modo dev ficaram com o
usuário pra validar (marcar uma Atividade como "Inativa", selecionar +
excluir, confirmar que some da lista e que a linha ainda existe no banco
com `deletedAt` preenchido).

## Item avulso — tabelas: largura de coluna, tooltip, zebra e padding (2026-11-20)

Usuário pediu 5 ajustes na tabela principal de Atividades, como referência
pra aplicar depois em todo `ListView` (confirmado antes de começar: o
componente é o mesmo em 27 telas — People, Projects, Programs, Tasks,
Pantry, Deposit, Occurrences, People-Groups, Admin e Atividades).

**O que mudou (tudo no componente compartilhado, propaga pras 27 telas):**

- `web-client/views/ListView.tsx`: nova `getColumnWidthStyle()` +
  `DEFAULT_COLUMN_MAX_WIDTH = 280` (export) — toda coluna sem `maxSize`
  próprio cresce com o conteúdo até 280px, depois trunca com "..." sem
  quebrar linha (classes já existiam em `table.tsx`, só faltava um
  `max-width` real pra elas funcionarem). Coluna com `maxSize: Infinity`
  no `ColumnDef` renderiza sem limite.
- Cabeçalho: `bg-muted/10` → `bg-muted/25` (mais perceptível).
- Zebra: linhas ímpares (`rowIndex % 2`, calculado localmente por bloco de
  linhas pra não contar linha de cabeçalho de grupo) ganham `bg-muted/5`.
- Padding lateral: `containerClassName` do `Table` ganhou `px-1` (4px) —
  a tabela não encosta mais na borda do cartão.
- Novo `web-client/ui/TruncatedTextCell.tsx`: célula de texto truncado +
  `Tooltip` (shadcn, já existia mas só era usado em `sidebar.tsx`) com o
  valor completo.
- `modules/actions/features/list/ui/actions-list-module-client-page.tsx`:
  coluna "Atividade" (title) ganhou `maxSize: Infinity` (coluna principal,
  renderiza completa); colunas "Projeto"/"Grupos"/"Participante" passaram
  a usar `TruncatedTextCell`.
- **Achado registrado em `docs/backlog.md`:** `Activity.title` não tem
  limite de tamanho no banco (coluna `TEXT` no Postgres, só
  `@MaxLength(160)` de validação de aplicação) — documentado, não
  corrigido agora (fora do pedido).

**Checkpoint rápido:** `cd frontend && npx tsc --noEmit` → sem erros (exit 0).
`npx eslint` nos arquivos tocados → 0 problemas novos (o erro de
`react-hooks/set-state-in-effect` que aparece em
`actions-list-module-client-page.tsx` é pré-existente, fora do diff desta
sessão).
**Documentado** em `docs/canonical-web-client-standard.md`, nova seção
"Tabela (`ListView`): largura de coluna, truncamento, tooltip, zebra e
padding", com referência cruzada na seção de relation.
**Teste manual:** usuário testou e reportou "não estou vendo as diferenças
de cores" (cabeçalho, coluna principal, zebra). Causa: `--muted` e
`--background` são quase idênticos em luminosidade neste tema — `bg-muted/10`
(original) e depois `bg-muted/25` (header) e `bg-muted/5` (zebra) ficaram
imperceptíveis na prática. **Recalibrado (mesmo commit, 2026-11-20):**

- Cabeçalho: `bg-muted/25` → `bg-toolbar` (token já validado em outras
  telas pra "isso é uma barra de ferramentas/cabeçalho").
- Zebra: `bg-muted/5` → `bg-muted/40` (menor valor que ficou visível nos
  testes, ainda mais fraco que hover `/50` e selecionado `100%`).
- Coluna principal: não tinha nenhum realce visual ainda (só não truncava)
  — item 2 do pedido do usuário não tinha sido implementado. Adicionado
  `isPrimaryColumn()` (mesmo sinal `maxSize: Infinity`) → `bg-primary/10`
  no cabeçalho da coluna, `bg-primary/5` nas células.
Checkpoint repetido: `tsc --noEmit` exit 0, `eslint` limpo nos arquivos
tocados. Documentado em `docs/canonical-web-client-standard.md` com uma
nota explícita ("Lição pra reaproveitar") sobre não assumir que
`bg-muted`/opacidade baixa tem contraste suficiente neste tema sem
conferir. Validação visual final ainda pendente com o usuário.

**Centralização pedida pelo usuário (mesmo item, 2026-11-20):** as 3 cores
acima (`bg-toolbar`, `bg-muted/40`, `bg-primary/10`+`bg-primary/5`) saíram
do `ListView.tsx` e foram pra 3 variáveis dedicadas em
`frontend/src/app/globals.css` - `--table-header`, `--table-row-zebra`,
`--table-column-primary`, uma versão em `:root` (claro) e uma em `.dark`
(escuro), mapeadas em `@theme inline` (mesmo mecanismo de `--toolbar`/
`bg-toolbar`). `ListView.tsx` agora só usa `bg-table-header`/
`bg-table-row-zebra`/`bg-table-column-primary` - toda calibração futura de
cor de tabela (claro ou escuro) é só nessas 6 linhas do `globals.css`, sem
tocar em componente. Checkpoint: `tsc --noEmit` exit 0, `eslint` limpo.

**Correção de mecanismo (mesmo item, 2026-11-20):** usuário reportou
`--table-column-primary` "não está sendo aplicada" mesmo depois de editar
o valor manualmente (inclusive pra uma cor sólida bem saturada) - e
esclareceu a intenção: a coluna principal deveria ser **sempre a primeira
coluna**, não uma config por `ColumnDef`. O mecanismo anterior detectava a
coluna principal por um sinal manual (`maxSize: Infinity` no `ColumnDef` de
cada módulo) - trocado por detecção automática e posicional
(`getPrimaryColumnId` em `ListView.tsx`: primeira coluna de dado visível,
pulando a de seleção). Atividades teve o `maxSize: Infinity` removido da
coluna "Atividade" (agora automático, não precisa mais declarar nada).
Checkpoint: `tsc --noEmit` exit 0, `eslint` limpo nos 3 arquivos tocados
(`ListView.tsx`, `TruncatedTextCell.tsx`, `actions-list-module-client-page.tsx`).
Documentado em `docs/canonical-web-client-standard.md` com o histórico do
porquê da troca de mecanismo.

**Causa raiz real + grupo completo de variáveis (mesmo item, 2026-11-20):**
o bug de "a cor não aplica" não era de contraste - era de especificidade.
Duas causas, as duas corrigidas:

1. `getPinnedStyles` (coluna fixada via `initialColumnPinning`, ex.: "title"
   em Atividades) define `background` **inline**, que sempre vence
   `className` - isso anulava `bg-table-column-primary` silenciosamente.
   Corrigido em `getCellStyle` (`ListView.tsx`): remove o `background`
   inline quando a coluna é a principal.
2. Ter uma classe de fundo "base" e outra "condicional" no **mesmo
   elemento** (ex.: `bg-table-header` sempre + `bg-table-column-primary`
   condicional, ambas no `<th>`) depende da ordem de geração do Tailwind
   pra decidir quem ganha - não confiável. Corrigido movendo o fundo "base"
   pro elemento **pai** (`bg-table-header` no `<thead>`, não em cada
   `<th>`; idem `bg-table-row`/`bg-table-row-zebra` - `ListView.tsx` sempre
   escolhe uma das duas por linha, nunca as duas).

Usuário pediu, junto, pra generalizar: expandi as 3 variáveis de cor pra
**9 variáveis** cobrindo tudo que apareceu no pedido (header, linha, zebra,
coluna principal, texto do cabeçalho, texto da linha, borda, padding
horizontal, padding vertical do corpo) - `--table-header`,
`--table-header-foreground`, `--table-row`, `--table-row-zebra`,
`--table-row-foreground`, `--table-column-primary`, `--table-border`,
`--table-cell-padding-x`, `--table-cell-padding-y` (+ `--table-header-padding-y`
só pro cabeçalho), todas em `frontend/src/app/globals.css` (`:root`+`.dark`),
mapeadas em `@theme inline`. **Altura da linha agora é controlada por
padding** (`--table-cell-padding-y`), não por uma classe de altura fixa
(`h-12`/`h-11` removidas de `ListView.tsx`/`table.tsx`) - pedido explícito
do usuário.
`components/ui/table.tsx` ficou com toda a estrutura de base (antes
duplicada/sobrescrita entre esse arquivo e `ListView.tsx`); `ListView.tsx`
só mantém o que é genuinamente dinâmico (zebra por índice, coluna principal
por posição, fixação de coluna, offset de header sticky em relation).
Checkpoint: `tsc --noEmit` exit 0, `eslint` limpo em `ListView.tsx` e
`table.tsx`. Documentado em `docs/canonical-web-client-standard.md` com
tabela das 9 variáveis + a regra de arquitetura (fundo base no pai, nunca
duas classes de fundo concorrendo no mesmo elemento) pra não repetir o bug.

**Último ajuste (mesmo item, 2026-11-20):** cor confirmada funcionando pelo
usuário, mas a largura da 1ª coluna continuava cortando o nome **só** no
List Principal de Atividades (igual nas relations, onde nenhuma coluna é
fixada). Causa: `getPinnedStyles` também define largura fixa
(`width`/`minWidth`/`maxWidth` = 150px) inline pra qualquer coluna fixada
(`initialColumnPinning`) - a mesma razão estrutural do bug de cor, só que
pra `width` em vez de `background`. `getCellStyle` agora, pra coluna
principal fixada, mantém só `position`/`left`/`right`/`zIndex` (o que a
fixação realmente precisa) e usa `getColumnWidthStyle` (sem limite) pra
largura - sem herdar o `width` fixo. Resultado: 1ª coluna igual, fixada ou
não. Checkpoint: `tsc --noEmit` exit 0, `eslint` limpo.

## Item avulso — tirar o segundo valor da coluna principal (2026-11-20)

Usuário percebeu a diferença real entre as tabelas: a coluna principal de
Atividades ("Atividade") e de Participantes/Qualidade ("Participante"/
"Pessoa") mostrava **dois valores empilhados** (nome + tipo da atividade;
nome + Grupos) - só Encontros ("Data") tinha um valor só. Pediu pra tirar
o segundo valor da coluna principal nas três e criar coluna própria pra
cada um.

**Atividades** (`actions-list-module-client-page.tsx`): tirado o tipo da
célula de "Atividade"; nova coluna "Tipo" (`resolveActivityTypeLabel`).
**Participantes** (`action-participants-section.tsx`): tirados os Grupos
da célula de "Participante"; nova coluna "Grupos" com `TruncatedTextCell`.
**Qualidade** (`action-operational-relations.tsx`): `renderParticipantIdentity`
(compartilhada com `project-action-attendances-card.tsx` de Projects, fora
do escopo desta rodada) ganhou a prop `showGroupsSubtitle` (default `true`,
preserva Projects sem nenhuma mudança) - `buildQualityColumns` passa
`false` e ganhou a nova coluna "Grupos" (label novo em
`action-relations.constants.ts`).

Checkpoint: `tsc --noEmit` exit 0, `eslint` sem problema novo nos 4
arquivos tocados. Documentado em `docs/canonical-web-client-standard.md`:
regra "coluna principal mostra um valor só, nunca duas linhas empilhadas -
informação secundária vira coluna própria" na seção Tabela.

## Item avulso — reativar borda nas relations + sincronizar padding claro/escuro (2026-11-20)

Usuário reportou dois pontos depois de testar a reestruturação de
variáveis de tabela: (1) `--table-border` não tinha efeito nenhum nas
relations de Atividades, e (2) o padding não estava "funcionando" -
pediu pra reativar a borda seguindo `--table-border` e revisar se algum
componente pai estava bloqueando o padding.

**Investigação do padding:** revisei `ListView.tsx`, `table.tsx`,
`RelationListHost.tsx`, `DetailRelationTablePanel.tsx`/`TableView.tsx` e
confirmei por grep que `components/ui/table.tsx` só é importado por
`ListView.tsx` - nenhum outro componente passa `className` conflitante
pra `TableCell`/`TableHead`. **Achado real:** `--table-cell-padding-y`/
`--table-header-padding-y` tinham sido editados pra `8px` só em `:root`
(claro) - o bloco `.dark` continuava em `12px` (valor original, nunca
tocado). Não é bug de componente - só os dois blocos de `globals.css`
desincronizados. Corrigido igualando os dois a `8px`.

**Borda nas relations:** confirmado que `bordered={false}` forçava
`border-bottom-width: 0` via `[&_tr]:border-b-0` (especificidade mais alta
que a borda padrão do `TableRow`) - a cor de `--table-border` não tinha
como aparecer, por design antigo (relation "sem linha divisória").
Reativado: `bordered` agora só controla a borda **externa** do cartão
(`ModuleSurface`); as linhas internas sempre seguem `--table-border`,
relation ou não. `className` do `UiTable` em `ListView.tsx` simplificada
(só o `[&_tbody_tr:last-child]:border-b-0` que já existia, pra não ter
divisória depois da última linha).

Checkpoint: `tsc --noEmit` exit 0, `eslint` limpo em `ListView.tsx`.
Documentado em `docs/canonical-web-client-standard.md`: a prop `bordered`
atualizada (só afeta a borda externa agora), e uma nota nova lembrando de
conferir os dois temas (`:root`/`.dark`) antes de concluir que uma
variável "não funciona".

## Item avulso — padrão de exclusão em lote elevado a padrão do projeto (2026-11-20)

Usuário aprovou o resultado da junção checkbox+coluna principal em
Encontros e pediu pra declarar isso como **padrão de todo o projeto**,
não só de Atividades: "sempre que tiver necessidade de exclusão será
dessa forma."

Como o mecanismo inteiro (`isLeadingColumn`, `SELECTION_CHECKBOX_CLASS_NAME`)
mora no componente compartilhado `ListView.tsx` (não em código por
módulo), isso **já vale automaticamente** pra qualquer tela que ligar
`enableRowSelection` - conferido por grep: `project-enrollments-card.tsx`,
`project-action-attendances-card.tsx` (Projects), `pantry-donors-module-client-page.tsx`,
`deposit-donors-module-client-page.tsx` (Pantry/Deposit) já usam
`enableRowSelection` e já herdam o visual novo sem precisar de nenhuma
mudança própria. Nenhum código adicional foi necessário - só a
documentação formal do padrão.

**Documentado** em `docs/canonical-web-client-standard.md` como nova
seção própria ("Exclusão em lote: seleção colada à coluna principal") -
promovida de um bullet dentro da seção de Tabela pra uma regra explícita
de projeto, com o critério de quando usar (precisa existir uma ação real
de exclusão em lote por trás - não adicionar o checkbox só por
padronização visual) e `action-occurrences-section.tsx` como referência
viva completa do fluxo (seleção, confirmação, exclusão em lote real).

## Item avulso — Atividades: padronizar visual das relations (Participantes/Encontros/Qualidade/Equipe) + coluna de seleção (2026-11-20)

Usuário notou que as relations do rodapé do Detail de Atividades
(Participantes, Encontros, Qualidade) não tinham todos os elementos
visuais iguais ao List Principal, e pediu pra aplicar o mesmo padrão
(largura/zebra/cabeçalho/coluna principal) em todas - só dentro do módulo
Atividades, documentando no backlog se existisse tabela fora desse escopo.

**Investigação:** `flushToolbar` (o mecanismo que exige `stickyHeaderOffsetClassName`
no `ListView` interno pra o cabeçalho colar certo) é usado **só** em
Atividades (Participantes/Encontros/Qualidade/Equipe) - nenhum outro
módulo usa, então nada pra registrar no backlog quanto a isso.

**Causa raiz do "visual diferente":** Participantes, Qualidade e Equipe
tinham a mesma barra fixa que Encontros, mas **só Encontros** tinha
`stickyHeaderOffsetClassName="top-[117px]"` no `ListView` - sem isso, o
cabeçalho da tabela não alinhava corretamente embaixo da barra. Corrigido
nas 3 (adicionado o mesmo offset de Encontros).

**Coluna de seleção, pedido explícito:** a ação de marcar checkbox +
"Excluir selecionados" (hoje só em Encontros) devia "ficar colada com o
nome, recebendo o mesmo visual, como coluna de ações" + checkbox mais
sutil. Implementado em `ListView.tsx` (vale pras 27+ telas que usam o
componente, não só Atividades):

- Nova `isLeadingColumn` (seleção OU coluna principal) - a coluna de
  seleção agora ganha o mesmo `bg-table-column-primary`, sem costura de
  cor com a coluna principal.
- `SELECTION_CHECKBOX_CLASS_NAME` (`border-muted-foreground/40 shadow-none`)
  nos dois checkboxes (cabeçalho "selecionar todos" + linha).

**Pergunta feita ao usuário:** Participantes e Qualidade não têm operação
de exclusão em lote por trás (resumo agregado / edição, não registro com
delete) - adicionar o checkbox ali seria um botão sem ação real. Usuário
confirmou: **não adicionar seleção** nessas duas, só nas que já têm ação
real (Encontros).

Checkpoint: `tsc --noEmit` exit 0; `eslint` nos 5 arquivos tocados sem
problema novo (os 4 erros de `react-hooks/set-state-in-effect` em
`action-occurrences-section.tsx` são pré-existentes - `git diff --stat`
confirma zero alteração nesse arquivo nesta rodada). Documentado em
`docs/canonical-web-client-standard.md`: regra "toda relation `flushToolbar`
precisa do offset", a coluna de seleção como "coluna de ação colada à
principal", e a regra de não adicionar seleção sem ação real por trás.

## Item avulso — Atividades: reaproveitar formulário create/edit + sinalização de campo obrigatório (2026-11-20)

Usuário notou que o formulário de criar Atividade ficou diferente do de
editar/ler, porque só o de edição (`ActivityDetailMain`) foi migrado na
padronização visual — criar continuava no formulário legado
(`ActionCreateFormSection`), violando a própria regra do padrão canônico
("new e edit usam o mesmo formulário"). Pediu duas correções: (1) sinais
visuais de campo obrigatório no formulário e (2) fazer `create` reaproveitar
o formulário de `edit` (o mais atual).

**O que mudou:**

- `web-client/detail/DetailFormSection.tsx`: `DetailSectionField` ganhou prop
  `required?: boolean` — asterisco vermelho (`text-destructive`) ao lado do
  label. Prop compartilhada, disponível pra qualquer módulo que queira o
  mesmo sinal (nenhum outro módulo foi tocado nesta rodada).
- `modules/actions/config/actions-detail-layout-contract.tsx`:
  `ActivityDetailMain` passou a receber `mode`/`projectId`/`onProjectIdChange`
  e agora é o único formulário usado tanto em `create` quanto em `edit`
  (`main` não tem mais `if (mode === "create")`). Campo Projeto: texto
  read-only em `edit` (como já era), `<Select>` editável + obrigatório só em
  `create` (porque `/actions/new` pode chegar sem `projectId` na URL).
  Título e Tipo marcados `required` sempre; Grupos marcado `required` só
  quando o Tipo selecionado usa Grupos (mesma regra que o backend já
  valida em `actions.service.ts`).
- `modules/actions/features/create/ui/action-create-engine-client-page.tsx`:
  reescrito — antes era uma casca estática (`readOnly: true`, todo
  `setDraft`/`onCommitField` no-op) que só existia pra renderizar o form
  legado; agora tem estado real (`draft`/`projectId`) e `handleCreate`
  (mesmo padrão já usado por Projects/People: valida o mínimo no cliente,
  deixa o backend validar regra de negócio como "Grupos obrigatório",
  chama `createActivity` e redireciona pra `/actions/:id`), ligado via
  `onSave` do `DetailShellEngine` (mesmo mecanismo que já renderiza o
  botão "Salvar" pra Projects/People em `create`).
- Removidos (ficaram sem nenhum importador depois da migração):
  `modules/actions/features/create/ui/action-create-form-section.tsx` e
  `modules/actions/features/create/config/action-create.constants.ts`.
- **Decisão explícita:** a seção "Equipe responsável" (Gestor/Educador) que
  existia só no formulário de criar foi removida, não migrada — ela já não
  funcionava de verdade ali (mostrava "Disponível após criar a atividade",
  porque depende de um `actionId` real) e duplicava o que a aba "Equipe" já
  faz depois que a atividade existe.

**Checkpoint rápido:** `cd frontend && npx tsc --noEmit` → sem erros (exit 0).
`npx eslint` nos 4 arquivos tocados → 0 problemas novos (os 8 erros de
`react-hooks/set-state-in-effect` que aparecem em
`action-detail-engine-client-page.tsx` são pré-existentes, fora do diff
desta sessão — mesma dívida já registrada em `docs/backlog.md`).
**Teste manual feito pelo usuário** (servidores em modo dev): aprovado,
só precisou ajustar o padding do formulário (`ACTION_DETAIL_SECTION_CLASS`
em `actions-detail-layout-contract.tsx`: `px-0` → `px-4`).

**Documentado como convenção formal em `docs/canonical-web-client-standard.md`**
(2026-11-20), pra todo módulo seguir daqui pra frente, não só Atividades:

- seção `detailSlot`: nota do mecanismo de "mesmo formulário" (prop `mode`,
  ramificação por campo, nunca componente separado por modo).
- nova seção "Create reaproveita o formulário de edit, nunca um componente
  paralelo" (mecanismo completo: `draft`/`onCommitField` nos dois modos,
  autosave desabilitado em `create`, botão único via `onSave` do
  `DetailShellEngine`, validação mínima no cliente + erro de negócio vindo
  do backend).
- nova seção "Campo obrigatório: asterisco via `DetailSectionField`"
  (prop `required`, estático vs. condicional por outro campo ou por `mode`,
  sempre espelhando a regra real do backend/DTO, nunca por "parece
  importante").

## Item avulso — Atividades: mais melhorias item por item (2026-11-18)

Usuário pediu pra continuar refinando o Detail da Atividade, mas resolver
"item por item" em vez de levantar tudo de uma vez — a cada item, descreve
o problema, eu confirmo o arquivo/trecho exato e só então implemento.

### Item 1 — tirar a barra de Status/Tipo/Período/Cadastro do header

Pedido do usuário: "Essa informação está sujando a tela e quebrando a
lógica visual... ter somente o Header e logo embaixo colado as abas."
Removido `header.slot` inteiro de `actionsDetailLayout`
(`actions-detail-layout-contract.tsx`) — a função que renderizava essa
barra (`resolveStatusBadge`/`formatPeriod`, e o import morto
`formatDateTimePtBR`) foi apagada, não só escondida. `DetailShell.tsx`
confirma que `headerInfoSlot` nulo não deixa nenhum espaço/margem —
header e abas ficam coladas sem precisar de CSS extra.

Essa barra existe nos outros módulos de conteúdo (Projects, Programs,
People-Groups) também — por ora a remoção é só na Atividade, decisão
deliberada de manter escopo pequeno. **Usuário confirmou gostar do
resultado** ("Ficou bom!") e pediu pra documentar como padrão — feito em
`docs/canonical-web-client-standard.md`, seção "Header colado nas abas".
Migração dos outros 3 módulos registrada em `docs/backlog.md`, sem data —
só quando esses módulos específicos forem revisados.

**Observação não bloqueante:** Status e Tipo continuam visíveis e
editáveis na aba Detalhes; Período continua na aba Planejamento e
Relatório. "Cadastro" (data de criação) não aparece mais em lugar nenhum
do Detail — ainda é possível achar a data de criação abrindo a Auditoria
(primeiro evento). Não perguntei se isso é aceitável porque o pedido foi
explícito ("só o header e as abas, nada no meio"); sinalizar se fizer
falta.

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint
actions-detail-layout-contract.tsx` → 0 problemas; `npm run build` → ok.
Testado ao vivo (Playwright, build de produção): screenshot confirma
título seguido direto pelas abas, sem nenhuma barra no meio; "Pronto"/
"Projeto Musica Manha" resolvem normalmente após o carregamento (um
primeiro screenshot tirado cedo demais mostrou "Salvando..."/"-", era só
timing do carregamento inicial, não regressão).

### Item 2 — Título na mesma linha dos campos de organização

Pedido do usuário: hoje o Título ocupa a primeira linha inteira sozinho;
ele queria Título + campos de organização numa única primeira linha, na
ordem **Título, Status, Tipo, relacionamento principal/dependente**
(nesta Atividade: Projeto) — propôs isso como convenção candidata pra
"todo módulo", já que teoricamente todo módulo tem esses 4 tipos de
campo.

Reescrito `ActivityDetailMain` (`actions-detail-layout-contract.tsx`): a
seção "Organização" (que tinha Projeto/Tipo/Status num grid próprio,
abaixo do Título) foi removida como bloco separado; os 4 campos agora
dividem um único `grid gap-6 md:grid-cols-[1.5fr_180px_200px_220px]`
(Título mais largo, os outros 3 compactos). O Título trocou o estilo
grande (`h-12 text-xl font-semibold`) pelo mesmo `lineInputClassName`
usado nos selects vizinhos — mesma largura de linha, sem destaque
desproporcional. "Direcionamento" (Grupos/Meta) e "Descrição"
continuam abaixo, sem mudança.

Achado ao olhar o código antes de implementar: esse exato padrão (título
e campos compactos numa única linha, sem heading "Organização") **já
existe** em Projects (`ProjectsDetailMain`, grid
`[1.3fr_220px_220px]` com Nome/Programa/Status) — não é um padrão novo,
é alinhar a Atividade a uma técnica que já tinha precedente, só com a
ordem de campos que o usuário pediu (Projects está em Nome/relacionamento/
Status, não na ordem Título/Status/Tipo/relacionamento proposta agora).

**Ainda não documentado como convenção formal** — implementado e testado
na Atividade, aguardando o usuário ver o resultado e confirmar antes de
escrever a regra em `docs/canonical-web-client-standard.md` (mesmo fluxo
do Item 1: implementar → confirmar → documentar).

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint
actions-detail-layout-contract.tsx` → só os 2 erros pré-existentes
(`react-hooks/set-state-in-effect`, longe do trecho editado); `npm run
build` → ok. Testado ao vivo (Playwright, build de produção): screenshot
confirma Título/Status/Tipo/Projeto na mesma linha, sem heading
"Organização"; editar o Título ainda dispara PATCH 200 e o cabeçalho
volta pra "Pronto" sozinho — autosave não quebrou com o reposicionamento
dos campos. Dado de teste restaurado ao final.

**Ajuste 2.1 — linha divisória acima do Título:** usuário confirmou o
resultado do Item 2 ("Ficou bom!") e pediu pra tirar uma linha que sobrou
logo acima do Título. Causa: `ACTION_DETAIL_SECTION_CLASS` tinha
`border-y` (topo + base) no container do formulário inteiro — trocado
pra `border-b` (só a de baixo, que separa o formulário do que vem
depois). `tsc`/`eslint`/`build` → ok; conferido ao vivo via screenshot.

**Ajuste 2.2 — Início/Fim/Plano pedagógico voltam pra Detalhes:** usuário
reconsiderou a divisão em abas feita no item avulso anterior — "aba
Planejamento e Relatório" não precisa separar esses 3 campos do resto do
formulário. Move a chamada de `ActivityPlanningSection` (componente não
mudou, só o lugar de onde é chamado) de dentro da aba "progress" pra
dentro de `ActivityDetailMain`, logo depois da Descrição. A aba volta a
se chamar "Progresso e Relatório" (nome de antes da divisão) já que só
sobrou `ActionProgressSection` (% atingido) e o preview de Relatório lá.
**Evidência:** `tsc`/`eslint` (mesmos 2 erros pré-existentes, nenhum
novo)/`build` → ok. Testado ao vivo: screenshot da aba Detalhes mostra
Planejamento (Início/Fim/Plano pedagógico) logo após Descrição; aba
"Progresso e Relatório" mostra só Progresso+Relatório; editar o Plano
pedagógico ainda dispara PATCH 200 e volta pra "Pronto" — autosave
preservado. Dado de teste restaurado ao final.

**Ajuste 2.3 — Descrição no mesmo visual linha dos outros campos:**
pedido do usuário, com Projects como referência explícita ("o visual que
está o campo descrição no detail de projetos"). `Textarea` da Descrição
ganhou `lineTextareaClassName` (novo, espelha
`PROJECT_DETAIL_TEXTAREA_CLASS`: só borda de baixo, transparente, sem
sombra, mesma altura compacta de antes). `tsc`/`eslint`/`build` → ok;
usuário confirmou ao vivo ("Sim apareceu e ficou bom!").

### Item 3 — padronizar a aba Encontros como referência de "relation"

Pedido do usuário: as abas de relação (Participantes/Encontros/Qualidade/
Equipe) estavam cada uma visualmente diferente; Encontros devia virar a
referência de padronização, replicando a "barra de busca completa" do
List Principal (TypeView) — seleção de colunas, filtros com
agrupamento, seletor de visualização com ícones — e tirando as bordas
"feias" da tabela.

Investiguei antes de desenhar (2 agentes `Explore` + leitura direta,
porque mexe em infra compartilhada) e achei que já existia um componente
pronto pra isso — `RelationListHost` + `DetailRelationTablePanel`
(`web-client/relation/`, `web-client/detail/DetailRelationTablePanel.tsx`)
— já usado por 7 painéis de relação de Pessoa, com `SearchPanelMenu` de
verdade e filtro via `Domain`/`matchesDomainRecord`. Reescrevi só a
"casca" de `ActionOccurrencesSection`
(`frontend/src/modules/actions/features/manage/ui/action-occurrences-section.tsx`)
pra usar `RelationListHost` direto (não `DetailRelationTablePanel`, que
é fixo em tabela — Encontros precisa alternar com `CalendarView`); nada
do diálogo de agendar recorrência, editar encontro ou presença inline
mudou.

Rodadas de ajuste ao vivo, depois de cada uma o usuário testou no
próprio servidor (pedido explícito dele: não derrubar os servidores que
ele estava usando — todo checkpoint desta seção é só `tsc`/`eslint`/
`build` estático, verificação visual ficou por conta dele):

1. **Filtro de data, agrupamento, colunas** — trocados o `Select` de mês
   e o toggle de texto Lista/Calendário por filtros de verdade (Status/
   Grupos/Data via `Domain`) e `RecordBrowserViewSwitcher` com ícones de
   `getStandardViewIcon`.
2. **Layout numa linha só + botão "Novo" padronizado** — seletor de view
   movido pra dentro do toolbar do `RelationListHost` via novo prop
   `viewSwitcherSlot`; botão de criar sempre "Novo", sempre
   `Button` sólido (azul), nunca mais um `addLabel` customizado por
   consumidor — prop removida do `RelationListHost`/
   `DetailRelationTablePanel` e dos 7 painéis de Pessoa que a usavam
   (texto diferente pra mesma ação "criar" dava impressão de ações
   diferentes).
3. **Botões no estilo real do TypeView** — Colunas/Filtros trocados de
   `variant="outline"` pra `variant="ghost" size="icon"`, igual
   `RecordListHost.tsx` (o List Principal de verdade) já usa; seletor de
   view perdeu a borda/fundo ao redor (`ToggleGroup` base tinha
   `border`/`bg-muted` incondicional — zerado só nesse componente).
4. **Checkbox do cabeçalho desalinhado** — bug real no `ListView.tsx`: o
   cabeçalho tinha um `<div>` de agrupamento extra (pro ícone de
   ordenação) que as células não tinham, então o checkbox "selecionar
   todos" não herdava a centralização das linhas. Corrigido só na coluna
   `__select__`, sem tocar no layout de nenhuma outra coluna — vale pra
   toda tabela selecionável do sistema, não só Encontros.
5. **Coluna de Ações removida + agrupamento ampliado + atalho de data
   nos Filtros** — "Excluir" por linha saiu (clicar na linha já edita,
   checkbox + "Excluir selecionados" já exclui); `ListView` ganhou
   `resolveGroupValue` (campo computado, não só leitura direta — "Grupos
   de pessoas" não é um campo plano) pra permitir agrupar por Status/
   Grupos/Data; `SearchPanelMenu` ganhou um atalho De/Até automático no
   painel de Filtros pra todo campo `type: "date"` declarado (escreve no
   mesmo `Domain` que o filtro personalizado usa — `upsertAndCondition`,
   novo em `web-client/domain/conditions.ts`).
6. **Contagem do Grupos pouco visível + De/Até fora do padrão visual** —
   contagem (`node.count`, já existia) movida pra uma pílula ao lado do
   rótulo do Grupos em vez de um número solto à direita; campos De/Até do
   atalho de data trocados pro estilo linha (só borda de baixo) e
   empilhados (De em cima, Até embaixo) em vez de lado a lado numa caixa.

**Evidência (cada rodada):** `npx tsc --noEmit` → 0 erros em todas; `npx
eslint` nos arquivos tocados → só os erros pré-existentes já confirmados
contra `develop` limpo antes de cada rodada (nenhum novo); `npm run
build` → ok em todas. Usuário confirmou ao vivo "Está ficando lindo!" /
"Agora ficou perfeito." no final da sequência.

**Mudou infraestrutura compartilhada, documentado explicitamente a cada
vez pro usuário:** `RelationListHost`/`ListView` são usados por 7 painéis
de relação de Pessoa — as props novas (`groupByOptions`, `columns`,
`viewSwitcherSlot`, `bordered`, `resolveGroupValue`) são todas opcionais
e preservam o comportamento atual quando omitidas, confirmado por leitura
de código já que não pude testar ao vivo sem derrubar os servidores do
usuário. O atalho de data em `SearchPanelMenu` é automático (olha
`type: "date"` nos campos) e aparece em praticamente toda tela de List
Principal do sistema que já declara campo de data — avisado ao usuário
antes de implementar.

**Padrão documentado em `docs/canonical-web-client-standard.md`**
("Relation no rodapé do Detail") como a referência pra Participantes/
Qualidade/Equipe da própria Atividade e qualquer relation futura —
registrado em `docs/backlog.md` com gatilho ("quando o usuário pedir pra
revisar uma dessas abas").

**Ajuste 3.1 — revisão de qualidade antes de fechar:** usuário perguntou
diretamente se `RelationListHost` estava "padronizado e reutilizável"
ou tinha "gambiarra no meio". Reli o código com olhar crítico (não só o
que mexi por último) e achei 2 pontos reais, nenhum bug, mas dois
riscos de manutenção:

1. Nomes de campo divergentes dentro do próprio Encontros — o filtro
   (`buildSearchRecord`) usava `status`/`Grupos`/`data` (sintéticos, em
   português) e o agrupamento (`resolveGroupValue`) usava `status`/
   `peopleGroups`/`scheduledDate` (nome real da propriedade). Corrigido:
   unificado em `status`/`peopleGroups`/`scheduledDate` (o nome real) nos
   dois mecanismos.
2. O estilo "linha" (só borda embaixo) estava copiado como string solta
   em 3 lugares — `lineInputClassName`/`lineTextareaClassName`
   (Atividade), `PROJECT_DETAIL_INPUT_CLASS`/`PROJECT_DETAIL_TEXTAREA_CLASS`
   (Projeto), inline no `QuickDateRangeFilter` — com a opacidade da
   borda já tendo divergido entre as duas primeiras (`/60` vs `/70`).
   Corrigido: extraído pra `DETAIL_LINE_INPUT_CLASS_NAME`/
   `DETAIL_LINE_TEXTAREA_CLASS_NAME`, exportado de
   `web-client/detail/DetailFormSection.tsx` (mesmo arquivo que já tinha
   `DETAIL_FIELD_LABEL_CLASS_NAME`), e os 3 lugares apontados pra lá.

Documentação reforçada em `docs/canonical-web-client-standard.md`
("Relation no rodapé do Detail" ganhou um resumo de template em bloco —
"PainelSearch [Colunas | Filtros] — TypeView — Novo, tabela embaixo sem
borda" — explicitamente marcado como regra sem exceção pra relation
nova, não sugestão; mais uma regra de "um só vocabulário de nome de
campo"; "Formulário principal" ganhou a regra de usar sempre
`DETAIL_LINE_INPUT_CLASS_NAME`/`DETAIL_LINE_TEXTAREA_CLASS_NAME`, nunca
reescrever a string).

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint` nos 5 arquivos
tocados → só os erros pré-existentes já confirmados (nenhum novo); `npm
run build` → ok.

### Item 4 — metadata/header do Detail + toolbar do typeview (2026-11-19)

Sequência de ajustes visuais pequenos, cada um confirmado ao vivo
(Playwright headless contra o dev server, login real `admin@seed.local`)
antes de ir pro próximo.

**4.1 — metadata (4 abas + SplitView) já batia com People.** Revisão
pedida pelo usuário: as 4 abas (Tags/Notas/Anexos/Auditoria,
`tabOrder={["tags","notes","attachments","activity"]}`) e o painel
lateral redimensionável já eram idênticos entre Activity e People —
nenhuma mudança de código, só documentação. A convenção das 4 abas já
estava escrita; o redimensionamento (`DetailShell.tsx`) não estava —
registrado em "Redimensionamento do painel lateral" em
`docs/canonical-web-client-standard.md`.

**4.2 — cor do botão de ação extra do header.** "Registrar ocorrência"
(`actions-detail-layout-contract.tsx`) já era ícone+tooltip sem label;
só a cor mudou de `variant: "outline"` pra `variant: "default"` (azul,
igual "Novo"). O equivalente em People (`family-tree`, `variant:
"action"`, laranja) ficou de fora por decisão do usuário — registrado em
`docs/backlog.md` com gatilho "quando People for revisado".

**4.3 — badge de autosave.** Trocado texto puro ("Pronto"/"Salvando...")
por ícone colorido (`CheckCircle2` verde / `Loader2` azul girando) dentro
de um `Badge` sem borda, com `translate-y-[9px]` pra compensar o
line-height do `h1` (o centro geométrico da caixa de texto não coincide
com o centro óptico do glifo). Botão X de fechar removido — já dá pra
voltar pelo breadcrumb. `onClose` continua na prop/plumbing de ~25
arquivos por decisão do usuário (limpeza registrada em
`docs/backlog.md`).

**4.4 — barra do typeview principal alinhada à da relation.** O list
principal (`ControlPanelShell.tsx`) tinha "Novo — Busca — typeview";
virou "Busca — typeview — Novo", igual ao padrão que `RelationListHost`
já usava (comentário no próprio código já dizia isso). Como
`ControlPanelShell` é compartilhado, a mudança vale pra todo list
principal, não só Atividades. Busca passou a ocupar toda a largura
restante (removido `max-w-[860px]`/`justify-center`; coluna esquerda só
existe no grid quando tem conteúdo real).

**4.5 — token `--toolbar` + contraste de hover/active.** Usuário pediu
uma cor de fundo pra diferenciar a barra de ferramentas do resto da
tela; testei 5 candidatos (neutro sutil, neutro médio, 2 tons de azul,
neutro mais escuro) direto na tela real antes de perguntar — usuário
escolheu neutro, intensidade média, como token formal. Criado
`--toolbar`/`--toolbar-foreground` em `globals.css` (light+dark, usuário
ajustou o valor final manualmente depois). Isso expôs um problema:
`hover:bg-accent` (botões `ghost`) e `hover:bg-muted/70` (abas) ficam
quase invisíveis contra `--toolbar` porque têm luminosidade parecida —
corrigido pra `hover:bg-background` nos dois lugares (mais claro que
`--toolbar`, "acende" visivelmente).

**4.6 — `bg-toolbar` espalhado pros outros 2 lugares que o usuário
pediu:** lista de abas principal do Detail (`DetailTabsRenderer`, sangra
borda a borda com `-mx-4 px-4`, mesma técnica do `headerBlock`) e a
barra de ferramentas da relation Encontros (`RelationListHost`, vira
`rounded-lg bg-toolbar px-3 py-2`, já que não está colada em nenhuma
borda externa). Confirmado com o painel lateral aberto que a faixa das
abas encosta exatamente na alça de redimensionamento, sem sobrepor.
Tudo documentado em `docs/canonical-web-client-standard.md` ("Fundo das
áreas de ferramentas" e "Contraste de hover/active sobre `bg-toolbar`").
Abas laterais (Tags/Notas/Anexos/Auditoria) ficaram de fora por enquanto
— não pedidas nesta rodada.

**Evidência:** `npx tsc --noEmit` → 0 erros em cada etapa; `npx eslint`
nos arquivos tocados → só os erros pré-existentes de sempre
(`react-hooks/set-state-in-effect`, confirmados via `git stash` como
já existentes antes de cada mudança, nenhum novo introduzido). Testado
ao vivo em todas as etapas (login real, screenshots antes/depois de
cada ajuste, inclusive hover/active/focus de cada elemento). Dev
servers não foram encerrados (usuário pediu pra manter rodando).

**4.7 — Header + Abas + Painel Relation virando um bloco único
(2026-11-19).** Usuário tentou ajustar manualmente os 3 pontos e não
conseguiu o resultado ("não ficou bom") — pediu os arquivos exatos, eu
apontei, e na sequência pediu pra eu aplicar direto. Problemas e correção:

1. **Header** (`DetailShell.tsx`) — o usuário já tinha trocado pra
   `bg-toolbar`, mas sem `-mx-4`/`px-4` current, então a cor ficava presa
   dentro do padding do container pai (margem nas laterais, não
   encostava na borda). Corrigido pra `-mx-4 px-4 pb-2 pt-2 bg-toolbar`
   — mesma técnica de sangria do `headerBlock` original.
2. **Abas** (`DetailLayoutSections.tsx`) — usuário já tinha adicionado
   borda direita azul (`border-r-3 border-blue-600`) e badge azul, mas
   não conseguia tirar o `rounded-md`/`gap-1.5` herdados de
   `MODULE_TAB_TRIGGER_CLASS_NAME`/`MODULE_TABS_LIST_CLASS_NAME`
   (constantes compartilhadas com as abas laterais). Resolvido com
   override local via `cn(...)` só no `TabsList`/`TabsTrigger` do
   `DetailTabsRenderer` (`gap-0`, `rounded-none`), sem tocar nas
   constantes — não afeta `DetailSideTabs.tsx`.
3. **Painel Relation (Encontros)** — pedido era sem margem com as abas,
   só padding, e sem margem lateral. Como `RelationListHost.tsx` é
   compartilhado com 7+ painéis de People (`DetailRelationTablePanel` —
   contatos, educação, saúde, medicações etc., todos com o visual de
   "cartão" `rounded-lg` que já estava certo pra eles), a mudança não
   podia ser incondicional. Criada prop opt-in `flushToolbar` (default
   `false` = cartão atual intacto; `true` = sangra com `-mx-4 px-4`, sem
   `rounded-lg`) — só a aba Encontros passa `flushToolbar`. Pra matar o
   `mt-4` que o `TabsContent` do `DetailTabsRenderer` sempre aplicava
   entre a barra de abas e o conteúdo (criava uma faixa sem cor mesmo com
   a sangria lateral certa — `overflow-hidden` no `TabsContent` impede
   truque de margem negativa pra "puxar" o conteúdo pra cima), criado
   `DetailTabTemplate.flushContent` (`web-client/registry/types.ts`):
   quando `true`, `TabsContent` usa `mt-0` em vez de `mt-4`. Só a aba
   Encontros (`actions-detail-layout-contract.tsx`) marca
   `flushContent: true`; as outras 5 abas da Atividade continuam com o
   respiro de `mt-4` padrão.

Resultado: Header, lista de abas e barra de Encontros formam um bloco
`bg-toolbar` único e contínuo, sem nenhuma emenda de cor visível, com o
painel lateral aberto ou fechado. Hover de uma aba inativa agora
preenche 100% da célula (sem sobra de canto arredondado nem gap vazio).
Documentado em `docs/canonical-web-client-standard.md` ("Fundo das áreas
de ferramentas" atualizada com os 2 props opt-in).

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint` nos 6 arquivos
tocados (`DetailShell.tsx`, `DetailLayoutSections.tsx`,
`registry/types.ts`, `RelationListHost.tsx`,
`action-occurrences-section.tsx`, `actions-detail-layout-contract.tsx`)
→ só os erros pré-existentes de sempre, confirmados via `git stash`
(inclusive os 4 já existentes em `action-occurrences-section.tsx`, que
eu ainda não tinha tocado antes desta sub-etapa). Testado ao vivo: aba
Detalhes (header+abas coladas), aba Encontros (as 3 áreas coladas), e
hover de uma aba inativa (preenchimento completo, sem gap/rounded).

**4.8 — 2 ajustes finos no bloco Header/Abas/Encontros (2026-11-19).**
Usuário aprovou o 4.7 mas achou 2 detalhes:

1. **Margem lateral direita ainda sobrava** nas Abas e no painel de
   Encontros (não no Header). Causa raiz: o wrapper do conteúdo principal
   em `DetailShell.tsx` tem `lg:pr-2` (reserva de 8px, provavelmente pra
   scroll) — o Header fica fora desse wrapper (não sofre), mas
   `DetailTabsRenderer`/`RelationListHost` ficam dentro, então o
   `-mx-4 px-4` (que só cancela o `px-4` do container maior) deixava 8px
   de sobra na direita em telas `lg:`. Corrigido com `lg:-mr-6` adicional
   nos dois lugares (soma com o `-mx-4` existente, só nessa breakpoint) —
   comentário no código explica a dependência com o `lg:pr-2`, caso
   mude no futuro.
2. **Divisor azul das abas ocupava 100% da altura** (`border-r-3`),
   parecendo um "risco" no meio da aba. Trocado por um pseudo-elemento
   (`after:...`) de 3px de largura e 50% da altura, centralizado
   verticalmente (`top-1/2 -translate-y-1/2 h-1/2`) — um traço curto em
   vez de uma borda inteira (CSS `border` não permite altura parcial).

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint` nos 2 arquivos
→ só o erro pré-existente de sempre em `DetailLayoutSections.tsx`
(linha 109, já confirmado antes). Testado ao vivo: bounding box das 3
faixas `bg-toolbar` medido via `getBoundingClientRect()` — as 3 chegam
exatamente em `right: 1440` (viewport inteiro, 0 sobra); screenshot
confirma o divisor como traço curto centralizado entre as abas.

**4.9 — margem residual + cabeçalho da tabela sobrepondo Abas/Painel
(2026-11-19).** Usuário reportou dois problemas: ~4-8px de margem
residual à direita no Painel (voltou porque o usuário removeu o
`lg:-mr-2` que eu tinha aplicado, enquanto investigava algo), e — ao
tentar o pedido anterior de deixar o painel "fixo" (sticky) — o
cabeçalho da tabela (linha com os nomes das colunas) passava por cima
do Painel/Abas ao rolar.

Como os servidores tinham caído (não fui eu que derrubei), e o usuário
pediu explicitamente pra eu subir um dev server só pra testes e não
soltar mais nada sem validar ao vivo, usei esse processo: a cada
hipótese, media via `getBoundingClientRect()`/`getComputedStyle()` real
no navegador antes de declarar resolvido, inclusive criando/apagando
dados de teste reais (90 encontros via "Agendar encontros") pra ter
linhas suficientes pra rolar.

Causa raiz, descoberta por eliminação (mapeando a cadeia de ancestrais
do `<thead>` até o scroll real): **3 wrappers diferentes** entre o
cabeçalho sticky da tabela e o contêiner de scroll real tinham
`overflow` != `visible` — cada um quebra `position: sticky` dos
descendentes (regra do CSS, não bug do React):

1. `TabsContent`/wrapper do conteúdo da aba (`overflow-hidden`/
   `lg:overflow-y-auto`) — já corrigido no item 4.7 (`flushContent`).
2. O wrapper interno do `ListView` (`overflow-auto`) e o container do
   componente base `Table` (`overflow-x-auto`, hardcoded, sem prop pra
   sobrescrever) — ambos novos, descobertos agora.
3. `ListView` embrulha tudo num `<ModuleSurface>`
   (`MODULE_SURFACE_CLASS_NAME` tem `overflow-hidden` fixo) — o
   `bordered={false}` já usado por Encontros sobrescrevia cor/borda/
   raio, mas nunca o `overflow`.

Corrigido com o mesmo padrão opt-in das rodadas anteriores (nada muda
por padrão em nenhum outro lugar que usa `ListView`/`Table`):

- `RelationListHost.tsx`: toolbar voltou a ter `lg:-mr-2` + ganhou
  `sticky top-11 z-10` (gruda logo abaixo das Abas, que já são
  `sticky top-0`).
- `components/ui/table.tsx`: nova prop `containerClassName` no `Table`
  base (sem uso = comportamento igual a sempre).
- `web-client/views/ListView.tsx`: nova prop
  `stickyHeaderOffsetClassName` - quando informada, sobrescreve o
  `top-0` do `<TableHeader>` E vira o sinal pra também soltar o
  `overflow-auto` do wrapper interno, o `overflow-x-auto` do `Table`
  (via `containerClassName`) e o `overflow-hidden` do `ModuleSurface`.
- `action-occurrences-section.tsx`: único uso real até agora -
  `stickyHeaderOffsetClassName="top-[117px]"` (44px das Abas + 73px da
  toolbar do Painel, `flushToolbar` com `py-4`).

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint` nos 6 arquivos
→ só os erros pré-existentes de sempre (confirmados antes desta rodada).
Testado ao vivo com dev server próprio (parado ao final): criei 90
encontros reais via UI, rolei o contêiner de scroll de verdade (não
simulado), medi `theadRect.top` depois do scroll - bateu exatamente
`226.39px`, igual a `toolbarBottom` (44+73=117px, a conta fechou),
confirmando que o cabeçalho gruda exatamente abaixo da toolbar, sem
sobrepor nada. Dados de teste apagados via "Excluir selecionados" ao
final (confirmado 0 linhas restantes).

**4.10 — padding de volta no conteúdo das abas não-flush (2026-11-19).**
Efeito colateral da remoção do `px-4` do container pai em
`DetailShell.tsx` (item 4 anterior, decisão do usuário): o formulário da
aba Detalhes (TÍTULO/STATUS/TIPO/PROJETO) e o conteúdo das abas
Participantes/Qualidade/Equipe/Progresso e Relatório ficaram sem respiro
nas bordas (texto colado na borda esquerda). Já tinha sinalizado isso
antes; usuário confirmou que precisava do padding de volta.
Corrigido com uma linha em `DetailTabsRenderer`
(`DetailLayoutSections.tsx`): `px-4` no `TabsContent`, só quando
`!tab.flushContent` — Encontros (único `flushContent: true` hoje)
continua colado nas bordas como antes, sem nenhuma mudança.

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint` → só o erro
pré-existente de sempre. Testado ao vivo (dev server próprio, encerrado
ao final): Detalhes e Participantes com padding correto nas bordas;
Encontros conferido sem nenhuma regressão (continua colado).

**4.11 — consolidação final em documentação (2026-11-19).** Usuário
pediu pra virar padrão oficial de todas as telas, não só Atividades.
Reescrevi `docs/canonical-web-client-standard.md` (seção "Visual do
List e do Detail", renomeada de "Visual do Detail" já que agora cobre
os dois): nova subseção "O que é automático vs o que é por módulo"
deixando explícito que a maior parte (fundo `bg-toolbar`, ordem
Busca→typeview→Novo, contraste de hover/active, abas sem gap/rounded)
já vale pra **todo** módulo canônico automaticamente, porque mora em
componentes compartilhados — não existe "módulo X ainda não migrou"
pra essas partes, é bug se não estiver assim. As exceções genuinamente
opt-in (`flushToolbar`/`flushContent`/`stickyHeaderOffsetClassName`,
pro padrão "relation é a aba inteira", referência Encontros) ficaram
marcadas à parte. Corrigi também valores que tinham ficado
desatualizados na doc (`lg:-mr-6`→`lg:-mr-2`, `py-2`→`py-4`, `-mx-4`
removido do header/abas — conferidos direto no código antes de
escrever) e documentei como lição reaproveitável a regra do CSS
("`position: sticky` quebra com qualquer ancestral `overflow` ≠
`visible` no caminho até o scroll real") e as novas props
(`stickyHeaderOffsetClassName`, `containerClassName`). Nova seção
"Ordem da barra do List Principal" também criada — não existia detalhe
técnico registrado sobre o reordenamento Busca→typeview→Novo antes
desta rodada.

**4.12 — Participantes/Qualidade/Equipe migradas pro padrão de Encontros,
cores do painel de Filtros restauradas (2026-11-19).** Pedido do
usuário pra "testar a convenção" migrando as 3 relations que ainda
usavam o mecanismo antigo (`DetailRelationConfig`/`DetailRelationSection`
em `DetailLayoutSections.tsx`). Investigação prévia (agente `Explore`)
mostrou que nenhuma das 3 tinha "cards" de linha — o que existia eram
blocos de estatística (Participantes/Filtrados, Com presença/Destaques/
Alterados) e um botão "Período" do mecanismo antigo, que o padrão novo
não tem (`RelationListHost` já mostra o total via `filteredCount`
textual). Criados 3 componentes novos, cada um um `RelationListHost`
direto + `ListView`, iguais a `ActionOccurrencesSection`:

- `action-participants-section.tsx` — Período (controle de servidor, não
  filtro cliente) foi pro `viewSwitcherSlot` via `DateRangeFilterButton`
  (já existia, só mudou de lugar). Sem "Novo" (não é um fluxo de
  criação).
- `action-quality-section.tsx` — Encontro/Grupos (ambos state externo,
  não filtro cliente do `RelationListHost`) + botão "Salvar" também no
  `viewSwitcherSlot`. `buildQualityColumns`/`QualityNotesDialog`
  reaproveitados sem mudança (edição inline de nota/destaque continua
  igual). Estatísticas (tracked/destaques/alterados) removidas por
  convenção — "Filtrados" já aparece via `filteredCount`.
- `action-team-section.tsx` — "Nova pessoa" virou "Novo" (via `onAdd`),
  seguindo a regra de rótulo único já documentada.

`actions-detail-layout-contract.tsx`: as 3 abas trocaram `relations:`
por `content:` + `flushContent: true` (mesmo padrão de Encontros).
Funções que só existiam pra essas 3 abas (`filterTeamRows`,
`filterAttendanceSummaryRows`, `buildAttendanceSummaryColumns`,
`teamParticipationColumns`) foram movidas pros componentes novos, não
duplicadas — removidas do contract file. `countAttendanceHighlights`
(só usado pela stat "Destaques" removida) ficou sem nenhum consumidor
— apagada de `action-operational-relations.tsx` em vez de deixada morta.

**Cores do painel de Filtros:** usuário reportou que "Filtros"/"Agrupar
por"/"Favoritos" estavam todos cinza (confirmado: `PanelSection` em
`SearchPanelMenu.tsx` tinha `text-muted-foreground` hardcoded pros 3,
sem diferenciação — nunca existiu um esquema colorido ali no código, ao
que tudo indica era assim desde a implementação original do painel).
Adicionado `tone` (`filters`→azul, `group`→verde, `favorites`→roxo) no
`PanelSection`, ícone novo (`Layers`) pra "Agrupar por" (não tinha
nenhum antes), e o ícone do botão-gatilho "Filtros" (nos dois hosts,
`RecordListHost.tsx`/`RelationListHost.tsx`) também ficou azul.

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint` nos 8 arquivos
→ só os erros pré-existentes de sempre (confirmados via `git stash`
antes desta rodada). Testado ao vivo (dev server próprio, iniciado e
encerrado nesta rodada — um dev server zumbi de uma rodada anterior
tinha ficado preso na porta 3000 servindo código desatualizado, achado e
encerrado antes do teste valer): as 3 abas migradas batem visualmente
com Encontros (mesma estrutura: busca → controles específicos → tabela,
sem cards); popover de Filtros confirmado com as 3 cores.

**4.13 — correção: as cores eram pro badge dentro do SearchBar, não pro
painel de Filtros (2026-11-19).** Usuário esclareceu que o item 4.12
resolveu o lugar errado — o pedido original era sobre os "chips" que
aparecem dentro da própria barra de busca quando um filtro ou
agrupamento está ativo (ex.: a pilula "Status" quando agrupado por
Status), não os títulos de seção dentro do popover (esse já estava
certo). Achado em `getFacetClasses`/`getFacetIconClasses`
(`SearchBar.tsx`): `tone: "group"` (badge de agrupamento, construído por
`buildQueryFacets` em `queryFacets.tsx`) estava cinza
(`bg-muted/50`/`text-foreground`) → virou verde
(`emerald-500`/`emerald-700`). O branch padrão/sem `tone` (badge de
filtro, condição de domínio) também estava cinza
(`bg-muted/35`/`text-muted-foreground`) → virou azul
(`blue-500`/`blue-700`). **Não mexido:** o sistema `tone: "analysis"`
(usado por Tasks/Programs/Projects/Deposit/Pantry/Admin pra breakdown
analítico, paleta própria sky/emerald/cyan/amber/primário) — é um
esquema separado, fora do escopo do pedido.

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint` → só os 2
erros pré-existentes de sempre em `SearchBar.tsx` (confirmados em
rodadas anteriores desta sessão). Testado ao vivo (dev server próprio,
encerrado ao final — achei outro dev server zumbi na porta 3000 de uma
rodada anterior e troquei por um limpo antes de testar): agrupamento por
Status mostra badge "Status" verde com ícone `Layers`; filtro de
Cadastro por período mostra badge azul — os dois lado a lado na mesma
barra, confirmados por screenshot.

**4.14 — badge de filtro/Grupos cortando texto + nomes de campo em
inglês vazando na aba Encontros (2026-11-19).** Dois bugs reais,
raiz em componentes compartilhados (`RelationListHost`/`queryFacets.tsx`/
`SearchBar.tsx`) — corrigidos uma vez só, valem pra qualquer módulo:

1. **Nomes em inglês** ("peopleGroup....", "date...." — cortados pelo
   `truncate`): o badge de agrupamento vinha de `queryFacets.tsx`
   (`groupByLabel`), que procura o label em `searchView.groupBy` — e
   `RelationListHost.tsx` nunca preenchia esse campo ao montar o
   `searchView`, então a busca sempre falhava e caía no nome bruto do
   campo (`peopleGroups`/`scheduledDate`). Corrigido preenchendo
   `groupBy: groupByOptions` automaticamente — `groupByOptions` já é
   passado com labels corretos (é o que alimenta o menu "Agrupar por"),
   só não chegava no cálculo do badge.
2. **Badge grande demais cortando o texto**: a data no badge de filtro
   de período vinha em ISO cru (`2026-01-01`) em vez de pt-BR, e o
   `max-w-[12rem]` do chip (`SearchBar.tsx`) era pequeno demais pro
   texto real de um filtro "entre" com duas datas. Corrigido:
   `describeValue` (`queryFacets.tsx`) agora usa `formatDateOnlyPtBR`;
   `max-w-[12rem]` → `max-w-[18rem]` nos dois chips (visível + o de
   medição, que precisam ficar em sincronia). O mecanismo de colapso
   pra "+N" já mede largura real, então alargar não quebra o layout em
   telas estreitas.

**Convenção formalizada** em `docs/canonical-web-client-standard.md`
("Textos visíveis ao usuário: idioma e tamanho"): o motivo de isso
escapar de revisão normal é que o badge/chip de um filtro/Grupos *já
aplicado* usa um caminho de código diferente do menu onde ele foi
configurado — o menu pode estar perfeito e o badge ainda assim errado.
Regra prática pra criar/revisar módulo novo: sempre aplicar o
filtro/agrupamento de verdade e olhar o badge resultante na barra, não
só abrir o menu e conferir as opções.

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint` → só os 2
erros pré-existentes de sempre em `SearchBar.tsx`. Testado ao vivo (dev
server próprio, encerrado ao final): agrupar Encontros por "Grupos de
pessoas" mostra o badge certo (antes: `peopleGroups`); filtro de Data
por período mostra "Data entre 01/01/2026 → 31/03/2026" completo, sem
cortar — confirmado por screenshot nos dois casos.

**4.15 — regressão: Encontros "descolou"/perdeu o sticky**
**(2026-11-19).** Usuário reportou que o painel de Encontros voltou a
ficar separado das abas e sem ficar fixo no scroll — algo que eu não
tinha tocado na rodada anterior. `git diff` em
`DetailLayoutSections.tsx` mostrou que o arquivo no disco já estava
diferente do que a sessão tinha deixado funcionando no item 4.9: o
`overflow-visible`/`px-4` do `TabsContent` (necessário pro `sticky`
funcionar — é exatamente a regra documentada em "Por que position:
sticky às vezes não gruda") tinha voltado pro `overflow-hidden` antigo,
e o `lg:overflow-visible` do wrapper de conteúdo também. Não é algo que
eu tenha editado nesta sessão entre o item 4.9 e agora — a causa exata
(edição externa, IDE, outra ferramenta) não dá pra confirmar, só
constatar pelo diff. Restaurado só a parte do `overflow`/`px-4`; a cor
do divisor das abas, que também tinha mudado (`blue-600`→`blue-300`),
foi deixada como estava por não ter sido reportada como problema.

**Nota operacional:** o primeiro teste deu falso-negativo porque a
porta 3000 já tinha um processo de dev server (provavelmente zumbi de
uma rodada anterior desta mesma sessão) servindo código desatualizado —
reiniciei com um limpo antes de confirmar.

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint` → só o erro
pré-existente de sempre. Testado ao vivo (dev server próprio, reiniciado
no meio por causa do falso-negativo, encerrado ao final):
`getBoundingClientRect()` confirma `tablistBottom === toolbarTop`
(0px de distância) tanto parado quanto após forçar 2000px de overflow e
rolar — a barra não se move.

**4.16 — Participantes/Qualidade/Equipe: faltava o template completo
(Colunas/Filtros/typeview/Novo) (2026-11-19).** As 3 abas já usavam
`RelationListHost`, mas só com busca — sem o botão Colunas, sem Filtros,
sem seletor de visualização (mesmo com só "Lista" como opção) e sem o
botão "Novo" (mesmo sem fluxo de criação real ainda). Usuário pediu
explicitamente pra bater com Encontros nos 4 elementos, mantendo "Novo"
como placeholder (`onAdd={() => undefined}`, comentado) onde ainda não
há fluxo de criação — Equipe já tinha um `onAdd` real e não mudou. Cada
seção ganhou `columns` (liga Colunas), `filterFields`+`domain`+
`buildSearchRecord` (liga Filtros) e `RecordBrowserViewSwitcher` com uma
única opção "Lista" no `viewSwitcherSlot`.

**Evidência:** `npx tsc --noEmit` → 0 erros; `npx eslint` → 0 erros nos 3
arquivos. Testado ao vivo (dev server próprio): as 3 abas mostram Busca +
Colunas + Filtros + typeview + Novo, idêntico a Encontros visualmente;
Colunas abre o menu de colunas visíveis e funciona; Filtros abre o painel
colorido (azul/verde/roxo) e funciona.

**4.17 — Período/Encontro/Grupos: de controle solto pra filtro/
agrupamento real dentro do painel (2026-11-19).** Usuário pediu pra
remover os controles soltos que ainda sobravam no `viewSwitcherSlot`
(Período em Participantes; Encontro + Grupos em Qualidade) e virar
filtro/agrupamento normal no painel de Filtros, do mesmo jeito que
Encontros já fazia com Status/Data/Grupos.

- **Participantes:** botão "Período" (`DateRangeFilterButton`, from/to)
  removido sem substituto — não existe campo de data por linha nesse
  resumo agregado pra virar filtro client-side, então a frequência/média
  passou a ser calculada no histórico completo (sem janela de período).
  Isso tornou `attendanceSummaryFrom`/`attendanceSummaryTo` e os
  callbacks associados mortos — removidos de
  `action-detail-engine-client-page.tsx`, `actions-detail-layout-contract.tsx`
  e `action-create-engine-client-page.tsx` (não só escondidos). Grupos de
  pessoas, que já era filtro, ganhou também `groupByOptions` (agrupamento
  real, com `resolveGroupValue`/`resolveGroupLabel` no `ListView`).
- **Qualidade:** selects soltos "Encontro" e "Grupos" removidos —
  perguntei antes ao usuário como tratar "Encontro" especificamente,
  porque ele não era um filtro client-side: controlava qual Encontro era
  buscado no backend (`occurrenceId` -> 1 fetch por vez). Usuário optou
  por virar filtro/agrupamento de verdade mesmo custando mais fetch.
  Mudança: a aba agora busca a presença de **todos os Encontros de uma
  vez** (`fetchAllQualityAttendances`, concorrência limitada a 4 fetches
  em paralelo, uma chamada por Encontro) e cada linha carrega
  `occurrenceId`+`scheduledDate` (novo tipo `QualityAttendanceRow` em
  `action-operational-relations.tsx`). Como o mesmo `enrollment.id`
  aparece agora uma vez por Encontro, `enrollment.id` sozinho deixou de
  ser chave única de linha — toda identidade de linha/rascunho
  (`qualityDrafts`, `getRowId` do `ListView`) passou a usar a chave
  composta `${occurrenceId}::${enrollmentId}`. Salvar
  (`saveQualityDrafts`) agrupa os itens alterados por Encontro antes de
  chamar `upsertMeetingAttendances` (1 chamada por Encontro, em
  paralelo), porque o endpoint ainda é por Encontro. Nova coluna
  "Encontro" na tabela pra identificar a linha quando várias datas
  aparecem juntas. "Grupos" virou filtro/agrupamento via `peopleGroups`,
  igual Participantes.
- **Efeito colateral necessário, fora do pedido original:** a aba
  Progresso e Relatório usava esse mesmo seletor "Encontro" (estado
  compartilhado `occurrenceId`) pra decidir qual Encontro reportar — era
  a única forma de trocar isso na tela inteira. Como a troca saiu de
  Qualidade, adicionei um seletor "Encontro" mínimo direto no card
  "Relatório" (reusando `occurrenceId`/`occurrenceOptions`/
  `onOccurrenceIdChange`, que já existiam no context) pra não perder essa
  capacidade silenciosamente — sem isso a aba ficaria travada sempre no
  Encontro padrão.
- **Bug pré-existente encontrado, não corrigido (fora de escopo):** a
  aba Progresso e Relatório mostra o banner de erro "Nenhum encontro
  agendado ainda" mesmo com o relatório carregado e um Encontro
  selecionado. Confirmado via `git stash` que o bug já existia antes
  desta sessão (mesmo comportamento sem nenhuma das mudanças de hoje) —
  registrado aqui, não corrigido, por não fazer parte do pedido.

**Evidência:** `npx tsc --noEmit` → 0 erros em todo o frontend; `npx
eslint` nos 7 arquivos tocados → mesma contagem de erros pré-existentes
de antes (8 `react-hooks/set-state-in-effect`, mesmo padrão já presente
no arquivo, nenhum novo). Testado ao vivo (dev server próprio): toolbar
de Participantes e Qualidade sem os controles soltos; painel "Agrupar
por" de Qualidade mostra "Encontro"/"Grupos de pessoas" com rótulo certo;
alternar o toggle "Destaque" + "Salvar" mostra toast "Qualidade salva" e
o estado persiste após recarregar as linhas; aba Progresso e Relatório
mantém o seletor de Encontro funcionando.

## Item avulso — Atividades: 2 bugs + 2 melhorias, escopo pequeno (2026-11-18)

Continuação direta do item anterior (abaixo). Usuário pediu pra manter o
escopo pequeno e fechar bem o módulo Atividades antes de generalizar
qualquer padrão novo pros outros módulos. Rodei 4 investigações (`Explore`)
em paralelo; 3 vieram com causa raiz confirmada, 1 (login) só com hipótese
que não se confirmou ao vivo.

**Bug 1 — login lento, precisa de F5: não reproduzido.** Testei em `next
dev` (reproduzi demora real, mas era compilação sob demanda de rota — o
usuário confirmou que o problema dele é em modo `start`, não `dev`) e em
`next build && next start` do zero e já aquecido (3 tentativas, todas
rápidas, sem travar). Não mexi em nenhum código de auth/dashboard — não ia
adivinhar um fix sem conseguir ver o bug acontecer. Detalhe completo e
candidato (service worker antigo de sessão `dev` anterior) em
`docs/backlog.md`.

**Bug 2 — Auditoria da Atividade vazia: corrigido.** Causa raiz:
`backend/prisma/schema.prisma` tem `model Activity { @@map("ProjectAction") }`
— o `@@map` só renomeia a tabela no banco, mas a extensão de auditoria
(`backend/src/core/prisma/prisma.service.ts`) grava `entity` com o nome do
model (`"Activity"`), não o mapeado. O frontend
(`actions-detail-layout-contract.tsx:1096`) consultava `entity:
"ProjectAction"` — nunca batia com nada. Fix: 1 linha, trocar a string pra
`"Activity"`.

**Melhoria 3 — filtro de data na aba Participantes: refeito dentro do
toolbar.** As duas datas "De"/"Até" eram `<Input type="date">` soltos,
acima da busca. Novo componente compartilhado
`web-client/ui/DateRangeFilterButton.tsx` (botão com ícone de calendário +
Popover com `Calendar` em modo `range`) plugado como novo `type:
"dateRange"` em `DetailRelationFilterConfig` (`web-client/registry/types.ts`),
renderizado por `DetailLayoutSections.tsx` no mesmo lugar que os filtros
`select` já existentes (aba Qualidade). Achado extra ao testar ao vivo:
`components/ui/calendar.tsx` nunca tinha sido usado de verdade no projeto —
suas `classNames` eram todas do react-day-picker v8 (`head_row`,
`day_selected`, etc.), mas o pacote instalado é v9 (chaves renomeadas pra
`weekdays`, `selected`, etc.); as chaves antigas eram ignoradas em
silêncio, sem erro — o calendário renderizava com o cabeçalho de dias da
semana todo espremido e em inglês. Corrigido junto (chaves certas da v9 +
`locale={ptBR}`), já que é o mesmo componente compartilhado que eu estava
exercitando pela primeira vez.

**Melhoria 4 — contagem nas abas: só precisou popular um campo que já
existia.** `DetailTabTemplate.badge?: (context) => ReactNode` já existe na
infra e já é usado pelo painel lateral (Tags/Notas/Anexos/Auditoria) desde
antes — só faltava popular nas 4 abas principais da Atividade
(Participantes/Encontros/Qualidade/Equipe), usando dados que o `context`
já carrega sem fetch novo (`attendanceSummaryRows`, `occurrences` — este só
precisou ser adicionado ao objeto `context`, o state já existia —,
`qualityRows`, `reportPeopleRows`).

**Evidência:**

```
# backend (nenhum arquivo de backend mudou)
npx tsc --noEmit -p tsconfig.build.json   → 0 erros
npm test                                  → 29 suites, 153 testes, todos passando
npm run build                             → ok

# frontend
npx tsc --noEmit    → 0 erros
npx eslint <6 arquivos tocados + 1 novo>  → só erros já existentes em
                      action-detail-engine-client-page.tsx e
                      actions-detail-layout-contract.tsx/DetailLayoutSections.tsx
                      (react-hooks/set-state-in-effect), confirmados
                      pre-existentes rodando eslint nos mesmos arquivos
                      em `develop` limpo antes de editar
npm run build       → ok, todas as rotas
```

Testado de ponta a ponta no navegador (Playwright + Chromium, login real
`admin@seed.local`, **build de produção** — `npm run build` + `npm run
start`, não `npm run dev`, porque o Bug 1 só se manifestaria lá):

- Editar o Título da Atividade → PATCH real, aba Auditoria mostra a
  entrada (antes mostrava "Nenhum evento de auditoria registrado." mesmo
  com PATCH 200 confirmado)
- Abas Participantes/Encontros/Qualidade mostram a contagem certa ao lado
  do rótulo ("Participantes 1", "Encontros 1", "Qualidade 1"); Equipe
  (vazia) e Detalhes (formulário) corretamente sem badge
- Aba Participantes: sem inputs de data soltos acima da busca; botão
  "Período" dentro do toolbar, abre popover com calendário em português,
  seleção de intervalo funciona e re-filtra a lista de verdade (testado:
  intervalo fora da data real do encontro → "Sem encontros no período"),
  "Limpar" volta ao estado vazio
- Dados de teste: título e descrição temporários usados no teste foram
  restaurados ao valor original do seed ao final; servidores de teste
  encerrados.

## Item avulso — fechar Atividades/Encontros (2026-11-18)

Pedido direto do usuário, fora da sequência de Partes 1-5 e fora do plano
de módulos Atendimento/Projetos: antes de continuar copiando o padrão de
Detail pros próximos módulos (Fase 6+), fechar de vez o módulo mais denso
que já existe (Atividades/Encontros), porque é ele que expõe os problemas
estruturais que os módulos mais simples escondem. 3 investigações
(agentes `Explore`) rodaram sobre os 10 módulos já implementados; usuário
decidiu escopo: só Atividades/Encontros + 2 bugs reais de autosave agora.
O resto dos achados (Tasks sem cabeçalhos de seção, Pantry/Deposit com
`canAudit` hardcoded, typos de gênero, "Doa??o" corrompido, Tasks com
feed de histórico próprio) foi pro `docs/backlog.md` com gatilho.

**Decisão nova de padrão, valendo pra frente (documentada em
`docs/canonical-web-client-standard.md`, seção `sideSlot`):** painel
lateral do Detail passa a ter só 4 abas — `Tags`/`Notas`/`Anexos`/
`Auditoria` — sem `Comentários`/`Histórico`/`Contexto`. `Notas` cobre a
necessidade de conversa/anotação que `Comentários` servia, via rich text
com menção `@` (`richText`/`mentionUsers`, mesmo mecanismo que People já
usava). Confirmado ao vivo que o dropdown de menção aparece com usuários
reais do tenant antes de tirar `Comentários` da Atividade.

**Bug 1 (confirmado e corrigido) — Atividade não tinha autosave no
formulário principal.** `actionsDetailLayout.main` renderizava
`ActionCreateFormSection` com estado 100% local, sem nenhuma chamada a
`onCommitField`; só persistia no clique manual em "Salvar". Reescrito como
`ActivityDetailMain` (novo componente em
`actions-detail-layout-contract.tsx`), ligado a `draft`/`onCommitField`
igual ao padrão de `ProjectsDetailMain`. Formulário principal encolhido
pra Título + Organização (Projeto/Tipo/Status) + Direcionamento (Grupos
de pessoas/Meta) + Descrição; Gestor/Educador saem (duplicavam a aba
Equipe), Planejamento (Início/Fim) vai pro `header.slot` novo (Atividade
era o único módulo de conteúdo sem header slot), Plano pedagógico vai
pra dentro da aba renomeada "Planejamento e Relatório".

**Bug 2 (achado pelos agentes, corrigido) — guarda de autosave travava
pra sempre se o upload de anexo fosse cancelado.**
`detail-media-autosave-guard.ts` é um singleton do módulo inteiro; a
retomada só acontecia no `onChange` do `<input type="file">` — cancelar o
seletor nativo sem escolher arquivo nunca disparava `change`, deixando
`suspended=true` pelo resto da sessão (bloqueando autosave do app
inteiro, não só do módulo). Corrigido com `input.oncancel = () =>
resumeDetailAutoSave()` nos 3 pontos que não tinham (People, Projects,
Activity) — mesmo padrão que Pantry/Deposit já usavam.

**Bug 3 (Projeto preso em "Salvando...") — não reproduzido.** Diagnóstico
ao vivo (PATCH real disparando num campo de Projeto real) voltou pra
"Pronto" em menos de 1 segundo; a cadeia de código está estruturalmente
igual à de People-Groups, que funciona. Pode ter sido algo pontual (ex.:
hot-reload do backend durante o relato original). Fica em aberto —
precisa de passos de reprodução mais específicos se persistir.

**Achado extra durante a reescrita (corrigido):** a própria Atividade
tinha o cabeçalho preso em "Salvando..." desde o primeiro carregamento,
antes de qualquer edição — causa raiz era `refreshReport()` chamando
`setQualitySaving(true)` sem nunca resetar (o `finally` da função só
resetava `reportLoading`). Removida a linha errada (não era pra existir:
`qualitySaving` só deveria ser gerido por `saveQualityDrafts`).

**Achado extra (corrigido):** campo "Projeto" no formulário mostrava "-"
porque `action.project` nunca é populado pelo backend (confirmado via
curl direto — a resposta real omite o campo, apesar do tipo TS declarar
opcional). Corrigido com um fetch dedicado (`getProject`) dentro de
`ActivityDetailMain`.

**Evidência:**

```
# backend (nenhum arquivo de backend mudou - rodado por seguranca)
npx tsc --noEmit -p tsconfig.build.json   → 0 erros
npm test                                  → 29 suites, 153 testes, todos passando
npm run build                             → ok

# frontend
npx tsc --noEmit    → 0 erros
npx eslint <5 arquivos tocados>  → só os erros ja existentes em
                      projects-detail-engine-client-page.tsx
                      (react-hooks/set-state-in-effect,
                      preserve-manual-memoization), confirmados
                      pre-existentes rodando eslint no mesmo arquivo
                      em `develop` limpo (sem meu diff) antes de editar
npm run build       → ok, todas as rotas
```

Testado de ponta a ponta no navegador (Playwright + Chromium, login real
`admin@seed.local`, backend e frontend de pé):

- Editar Título/Descrição da Atividade sem clicar em nada → PATCH real
  dispara, cabeçalho mostra "Salvando..." e volta pra "Pronto" sozinho
- Gestor/Educador só aparecem na aba Equipe; Início/Fim planejado no
  cabeçalho; Plano pedagógico na aba "Planejamento e Relatório"
- Painel lateral mostra só Tags/Notas/Anexos/Auditoria; digitar `@adm`
  nas Notas mostra o dropdown de menção com "Administrador"/
  `admin@seed.local` real
- Cancelar o seletor de arquivo de anexo (simulado via evento `cancel`
  nativo no `<input>`, já que o Chromium headless não abre diálogo de SO
  de verdade) e depois editar o Título ainda dispara PATCH 200 — guarda
  de autosave não trava mais
- Abas Participantes/Encontros/Qualidade sem regressão visual
- Dados de teste: edições feitas durante o teste (`description`/`title`
  temporários na Atividade seed "Encontro do segmento C2M") foram
  restauradas aos valores originais do seed ao final; servidores de
  teste encerrados.

## Item avulso — padronização visual do Detail (2026-11-17)

Pedido direto do usuário, fora da sequência de Partes 1-5 e fora do plano
de módulos Atendimento/Projetos: o visual das telas de Detail estava
"preto e branco" (abas sem cor perceptível no estado ativo, formulários
com título + parágrafo descritivo repetidos por seção). Decisão e opções
de estilo confirmadas com o usuário antes de mexer em código. Regra nova
documentada em `docs/canonical-web-client-standard.md` (seção "Visual do
Detail").

**Mudança:** `web-client/ui/ModulePrimitives.tsx` (aba ativa vira pílula
`bg-primary/10 text-primary`, hover nas inativas) — ponto único,
consumido por `DetailLayoutSections`/`DetailSideTabs`, então vale pra
toda tela de Detail de uma vez. Componente novo
`web-client/detail/DetailFormSection.tsx` (`DetailSectionHeading`/
`DetailSectionField`) substitui as várias cópias locais do mesmo label/
cabeçalho de seção (`SectionField`/`SectionHeading`/`fieldLabelClassName`
duplicados em Actions, People, Tasks, Admin) e remove os parágrafos
descritivos que existiam nos cabeçalhos de seção da Atividade. Aplicado
em Actions (piloto), People (+ aba lateral própria, que tinha estilo
hardcoded — ganhou a mesma pílula, variante âmbar preservada em
"Documentos sensíveis"), Projects, Programs, People-Groups, Tasks (2
arquivos), Pantry e Deposit (formulário de item), Admin.

**Evidência:** `tsc --noEmit` → 0 erros; `eslint` nos 13 arquivos tocados
→ 0 problemas novos (só os 3 já existentes e tolerados em
`action-create-form-section.tsx`, `react-hooks/set-state-in-effect`);
`npm run build` → ok, todas as rotas. Testado de ponta a ponta no
navegador (Playwright + Chromium, login real `admin@seed.local`, backend
e frontend de pé): tela de Atividade (lista, detalhe com troca de aba,
formulário de criação), Pessoa (detalhe com a aba lateral própria) e
Projeto (detalhe) — aba ativa com fundo azul, demais com hover, seções
com barra de acento colorida e sem texto descritivo, zero erro de
console. Dev servers e dados de teste: nenhum dado foi alterado (só
login e navegação); backend/frontend de teste encerrados ao final.

## Estado real (sincronizado em 2026-11-11)

Este documento tinha ficado parado em "Parte 1 em andamento" enquanto o
trabalho real, registrado item a item em `docs/auditoria-riscos.md`,
avançou até cobrir quase toda a Parte 2 e a Parte 3. Mapa atualizado,
Parte por Parte:

- **Parte 1 — Limpeza:** fechada na prática (checklist abaixo). Único
  item sem evidência de ponta a ponta: clicar nos 9 módulos pela UI
  (só API/backend foram exercitados via curl/testes automatizados nas
  sessões seguintes). Não bloqueou o trabalho das Partes 2/3, que já
  começou.
- **Parte 2 — Pequenas correções:** critério de saída do plano
  principal atingido em 2026-11-11 ("CI verde na main, testes do
  backend passando, proxy.ts comprovadamente ativo e app recusando
  subir sem as variáveis obrigatórias"). Checkpoint completo rodado
  nesta sessão: backend `tsc` (0 erros) + `npm test` (22 suítes, 91
  testes) + `npm run build` (ok); frontend `tsc` (0 erros) + `npm run
  build` (ok, com `proxy.ts` confirmado ativo). Único item que
  continua aberto é intencional (dívida de lint, ver abaixo).
  - [x] helmet (auditoria #8) · [x] validação de env vars no boot
    (auditoria #9) · [x] `GET /health` (auditoria #10) · [x]
    dependências patch/minor + `npm audit` (auditoria #15) · [x] 22
    suítes/91 testes do backend passando
  - [x] **CI no GitHub Actions** — feito em 2026-11-11, branch
    `develop`. `.github/workflows/ci.yml`: job `backend` (`npm ci` →
    `tsc --noEmit -p tsconfig.build.json` → `npm test` → `npm run build`
    → `npm run build:seed` + `git diff --exit-code` nos artefatos do
    seed, que também fecha o item 14 da auditoria) e job `frontend`
    (`npm ci` → `tsc --noEmit` → `npm run build`), ambos em Node 22 (a
    faixa declarada em `engines`). Confirmado manualmente antes de
    subir: os dois builds e o `npm test` do backend passam com
    `env -i` (sem nenhuma variável de ambiente) — nenhum segredo de CI
    é necessário para `tsc`/`test`/`build`; `test:e2e` (precisa de
    Postgres real) fica de fora, como já previsto na auditoria.
  - [x] **`frontend/middleware.ts` → `frontend/src/proxy.ts`** — feito
    em 2026-11-11, branch `develop`. Confirmado na doc do Next 16
    embutida no próprio pacote (`node_modules/next/dist/docs/.../
    proxy.md`): desde a v16, `middleware` está deprecated; o arquivo
    precisa se chamar `proxy.ts`, ficar no mesmo nível de `app/`
    (então `src/proxy.ts`, já que o app está em `src/app`), e a
    função exportada precisa se chamar `proxy`, não `middleware`.
    `npx next build` mostra `ƒ Proxy (Middleware)` sem erro. Teste
    manual real com o dev server: `/t/acme` → 307 para `/acme/
    dashboard`; `/acme` (slug nu) → 307 para `/acme/dashboard`;
    `/dashboard` com cookie `terceirogestor_tenant=acme` → 307 para
    `/acme/dashboard`; `/dashboard` sem cookie → 200 (sem redirect,
    como esperado). O log do próprio Next confirma a execução:
    `GET /dashboard 200 in 4.3s (next.js: 3.6s, proxy.ts: 349ms,
    application-code: 356ms)`.
  - [x] **Separar `lint`/`lint:fix`** — feito em 2026-11-11, branch
    `develop`. `backend/package.json`: `lint` não aplica mais `--fix`;
    `lint:fix` novo, idêntico ao `lint` antigo. `AGENTS.md` atualizado
    (o aviso "não use `npm run lint`" não vale mais). Ao rodar sem
    `--fix`, apareceu um problema pré-existente e sem relação com esta
    mudança: `test/**/*.ts` não está em nenhum tsconfig, então o
    ESLint (`projectService: true`) falha com parsing error nos 2
    specs e2e — registrado em `docs/backlog.md`, não corrigido aqui
    (fora do escopo deste item).
  - [ ] Lint do backend medido (469 problemas, só em `src/`) mas não
    reduzido — meta é não aumentar, registrado em `docs/backlog.md`
- **Parte 3 — Correções severas:** fechada, exceto uma ação
  operacional do usuário (3.5, abaixo). Feita via
  `docs/auditoria-riscos.md` (itens 1–2 → 3.2/3.5, item 3 → 3.1, itens
  4 → 3.4, 5–6 → 3.3, 7 → 3.4) mais os itens do checklist original que
  tinham ficado de fora do critério de aceite da auditoria, fechados
  em 2026-11-11:
  - [x] **3.1 — separar seed de produção (permissões/papéis) do seed
    de dados fictícios** — feito em 2026-11-11, branch `develop`. Não
    existia uma separação de infraestrutura pra fazer: a produção já
    não chama o seed de dados fictícios (`docker-entrypoint.sh` só
    roda migration + start, nunca `seed.js`) — quem cria papéis/
    permissões num tenant real é o fluxo de registro
    (`registration.service.ts`), e o catálogo "oficial" já vivia em
    `backend/src/modules/permissions/core-permissions.ts`
    (`CORE_PERMISSIONS`/`DEFAULT_ROLE_DEFINITIONS`), reexportado por
    `registration.constants.ts`. O problema real: `prisma/seed.ts`
    (dados fictícios) tinha sua **própria cópia hardcoded** dessa
    mesma lista (permissões + papéis Gestor/Atendimento), sem nada
    forçando as duas a ficarem iguais — risco de o tenant de
    demonstração ficar com permissões diferentes do que um tenant real
    ganha no cadastro. `prisma/seed.ts` agora importa o catálogo
    (`CORE_PERMISSIONS`/`CORE_PERMISSION_KEYS`/
    `DEFAULT_ROLE_DEFINITIONS`) via um loader novo e compartilhado
    (`backend/scripts/load-core-permissions.js`, extraído do que já
    existia dentro de `backfill-core-permissions.js` — que passou a
    usar o mesmo loader) em vez de manter sua própria lista. O nome do
    papel "Administrador" foi mantido (é um alias já conhecido de
    "Admin" em `CORE_ROLE_PERMISSION_TEMPLATES`, coberto por
    `core-permissions.spec.ts`).
  - **Critério de aceite:** confirmado — diff do catálogo antigo
    (hardcoded) contra `CORE_PERMISSION_KEYS` é vazio (as 48 chaves já
    coincidiam hoje; o ganho é não poder mais divergir em silêncio).
    `npm run db:seed` real contra o Postgres local: `Seed executado
    com sucesso`; query direta no banco confirma `Administrador`
    com 48 permissões (= todo o catálogo), `Gestor` com 31, `Atendimento`
    com 9 — e o próprio Nest loga `Synced 48 required permissions` ao
    subir. Teste manual real: login de `admin@seed.local` → `201` com
    `accessToken`; `GET /people` com esse token → `200` com dados.
    `npm run permissions:backfill` também testado, continua funcionando
    com o loader compartilhado (`permissionsSynced=48`). `tsc --noEmit`:
    0 erros. `npm test`: 22 suítes, 91 testes.
  - [x] **3.2 — reorganizar a chave física do arquivo para
    `categoria/tenantId/uuid.ext`** — feito em 2026-11-11, branch
    `develop`. Tinha ficado de fora de propósito no item 1/12 da
    auditoria ("pra não arriscar URL já salva no banco sem uma
    migração pronta"); decisão do usuário foi fazer agora, com
    migração. **O que mudou:**
    - `StorageService.put`/`delete`/`getSignedUrl` (`storage.service.ts`)
      e o driver local passaram a receber `tenantId`; a URL assinada
      virou `/uploads/<categoria>/<tenantId>/<arquivo>?sig=...`.
    - `UPLOAD_PATH_PATTERN` (`upload-paths.ts`) passou de 2 pra 3
      Grupos; `SignUploadsInterceptor` (que assina qualquer
      `/uploads/<categoria>/<tenantId>/<arquivo>` cru numa resposta)
      agora também confere que o `tenantId` embutido no caminho bate
      com o do usuário autenticado antes de assinar — nunca deveria
      bater diferente (os dados já vêm de query filtrada por tenant),
      mas falha fechado (não assina) em vez de confiar.
    - `UploadsController.download` (`uploads.controller.ts`) ganhou o
      parâmetro de rota `:tenantId`. Para categoria protegida, quem
      decide o caminho físico é o `tenantId` **do `sig` já verificado**
      (não o da URL) — então adulterar só o segmento da URL não
      redireciona pra pasta de outro tenant; a rota ainda exige os dois
      iguais, senão `404`. A categoria pública (`tenants`, logo) não
      tem `sig`, então usa o `tenantId` da URL direto (dado não
      sensível, já exposto sem login).
    - Os 10 endpoints de `files.controller.ts` ganharam
      `@CurrentUser()` e um `getTenantId()` (mesmo padrão de
      `people.controller.ts`/`tasks.controller.ts`) pra montar o
      caminho com o tenant de quem fez upload.
    - **Migração dos dados existentes:** novo
      `backend/scripts/migrate-upload-keys-to-tenant-scoped.js`
      (`npm run migrate:upload-keys`) — percorre os 21 campos
      `*Url`/`*Path` do schema que guardam caminho de upload (mapeados
      um a um em `FIELD_MIGRATIONS`) mais `ProjectAction.photoPaths`
      (array JSON, tratado separado), move o arquivo físico de
      `categoria/arquivo` pra `categoria/tenantId/arquivo` e atualiza o
      valor no banco. Idempotente (um valor já no formato novo tem `/`
      no que sobra do prefixo e é ignorado); arquivo referenciado no
      banco mas ausente em disco só avisa e segue (atualiza o caminho
      mesmo assim, não bloqueia); arquivo órfão (sem nenhuma linha que
      o referencie) fica onde está — ninguém vai servi-lo em nenhum
      dos dois formatos, mesma situação de antes. Não toca em
      `AuditLog.before`/`after` (são snapshots históricos, não é o
      storage ativo).
    - **Critério de aceite:** confirmado — 19 testes atualizados/novos
      nas 4 suítes afetadas (`storage.service.spec.ts`,
      `uploads.controller.spec.ts` — incluindo o caso novo "sig válido
      mas segmento de `tenantId` da URL não bate" e "segmento de
      `tenantId` com path traversal" —, `sign-uploads.interceptor.spec.ts`,
      `files.controller.spec.ts` — incluindo "token sem `tenantId`
      rejeita"). Teste manual real, backend de pé: login de verdade →
      `POST /files/avatars` devolveu
      `/uploads/avatars/<tenantId>/<uuid>.jpg?sig=...` → baixar com essa
      URL exata → `200`; a mesma URL com o segmento `tenantId` trocado
      por outro → `404` (a assinatura não cobre mais, resolve pelo
      `tenantId` do `sig`, não da URL); rota antiga de 2 segmentos
      (`/uploads/avatars/<arquivo>`) → `404` (não casa com a rota nova);
      logo de tenant (categoria pública, sem `sig`) em
      `/uploads/tenants/<tenantId>/<arquivo>` → `200` sem token nenhum.
      **Migração testada com um arquivo órfão real** (sobra de upload
      de uma sessão anterior, sem nenhuma linha do banco apontando pra
      ele): apontei o `avatarUrl` de um usuário do seed pra esse
      arquivo no formato antigo, roda `npm run migrate:upload-keys` →
      arquivo moveu de `uploads/avatars/<uuid>.jpg` pra
      `uploads/avatars/<tenantId>/<uuid>.jpg`, `avatarUrl` no banco
      virou o caminho novo; rodei a migração de novo → `migrated=0`
      (idempotente); testei também o caso de um valor antigo no banco
      sem o arquivo físico correspondente → avisa (`missingOnDisk=1`) e
      atualiza o caminho mesmo assim, sem travar. Banco local
      restaurado com `npm run db:seed` depois do teste. `tsc --noEmit`:
      0 erros. `npm test`: 23 suítes, 110 testes. `npm run test:e2e`: 3
      suítes, 14 testes (sem regressão de isolamento entre tenants).

  - [x] **3.2 — validar o tipo real do arquivo pelos bytes** — feito em
    2026-11-11, branch `develop`. **Onde estava:** os 10 endpoints de
    upload (`backend/src/core/files/files.controller.ts`) só filtravam
    por `mimetype` declarado (`imageOnlyFilter`/filtro inline de
    `health-documents`) ou por extensão do nome do arquivo
    (`extensionAllowlistFilter`) — os dois são controlados pelo
    cliente, nenhum inspeciona o conteúdo real. Um `.exe` renomeado
    para `.jpg` com `Content-Type: image/jpeg` passava direto.
    **O que foi feito:** novo `file-signature.ts` com
    `matchesFileSignature(extensao, buffer)`, checando os bytes mágicos
    reais (JPEG `FF D8 FF`, PNG, GIF, WEBP via `RIFF`/`WEBP`, PDF
    `%PDF-`, ZIP `PK\x03\x04` — cobre `.zip`/`.docx`/`.xlsx`/`.pptx`
    como família única, já que distinguir cada um exigiria abrir o
    ZIP — e OLE Compound File — cobre `.doc`/`.xls`/`.ppt` do mesmo
    jeito). `.txt`/`.csv` não têm assinatura binária confiável e
    continuam validados só por extensão, como antes. Um novo
    `assertFileContentMatchesExtension` roda nos 10 handlers (depois
    do multer já ter bufferizado o arquivo em memória — só aí o buffer
    completo existe; o `fileFilter` do multer roda antes disso, por
    isso a checagem não podia ficar lá) e rejeita com `400` se a
    extensão não estiver na allowlist **ou** se o conteúdo não bater
    com a assinatura esperada.
  - **Critério de aceite:** confirmado por 15 testes novos
    (`file-signature.spec.ts`: cada família de assinatura, extensão
    sem assinatura, buffer curto demais; `files.controller.spec.ts`:
    conteúdo que não bate com a extensão declarada rejeita, extensão
    fora da allowlist rejeita mesmo com bytes "válidos" de nenhuma
    família conhecida, `.txt` continua aceito) e por teste manual real
    — login de verdade, `POST /files/avatars` com um arquivo de texto
    puro nomeado `fake.jpg`/`Content-Type: image/jpeg` → `400 "O
    conteudo do arquivo nao corresponde ao tipo esperado."`; o mesmo
    endpoint com bytes JPEG reais (`FF D8 FF E0 ...`) → sucesso, com a
    URL assinada de volta. `tsc --noEmit`: 0 erros. `npm test`: 23
    suítes, 106 testes.
  - [x] **3.4 — confirmar rate limit e expiração do token de reset nos
    4 fluxos** — feito em 2026-11-11, branch `develop`. Os 4 decorators
    (`auth.controller.ts`: `login` 20/10min, `forgot-password` 10/h,
    `reset-password` 20/h; `registration.controller.ts`:
    `tenant/request` 10/h) já existiam, mas nem `RateLimitGuard` nem
    `RateLimitService` (`core/rate-limit/`) tinham teste próprio, e a
    expiração do token de reset (`auth.service.ts#resetPassword`,
    30 min) também não. Ao escrever os testes achei e corrigi um bug
    real: `RateLimitService.consume()` liberava incondicionalmente a
    **primeira** chamada de uma chave nova, mesmo com `max: 0` (o
    branch de "bucket novo" nunca checava `max`) — não afeta nenhum
    endpoint hoje (nenhum usa `max: 0`), mas é o tipo de bug que um
    `max` configurado errado no futuro deixaria passar batido.
    Corrigido: bucket novo com `max <= 0` já nasce bloqueado.
  - **Critério de aceite:** confirmado por 13 testes unitários novos
    (`rate-limit.service.spec.ts`: limite, reset de janela, chaves
    independentes, o caso `max: 0` corrigido; `rate-limit.guard.spec.ts`:
    sem metadata deixa passar, `429` com `retryAfterSeconds` ao
    exceder, mensagem customizada, cada `keyPart` — `ip`/`tenantId`/
    `bodyField` normalizado — gera buckets separados) e por um novo
    `test/password-reset-and-rate-limit.e2e-spec.ts` (Postgres real, 9
    testes): token de reset expirado/revogado/consumido → `400`;
    token válido → `201` e troca a senha de verdade (login com a senha
    nova confirmado); reusar o mesmo token depois → `400`; pedir um
    novo reset revoga o token anterior ainda válido do mesmo usuário
    (conferido direto no banco). Os 4 endpoints testados batendo
    repetidamente até o limite configurado: `/auth/login` (20),
    `/auth/forgot-password` (10), `/auth/reset-password` (20),
    `/registration/tenant/request` (10) — todos liberam até o limite e
    devolvem `429` exatamente na chamada seguinte. `tsc --noEmit`: 0
    erros. `npm test`: 25 suítes, 123 testes. `npm run test:e2e`: 4
    suítes, 23 testes.
  - [ ] 3.5 — mover `PII_MASTER_KEY`/`TOTP_ENCRYPTION_KEY` para um
    gerenciador de senhas fora do Railway — **ação sua, não é código**:
    eu não tenho acesso aos valores reais das chaves nem ao seu
    gerenciador de senhas. A rotação dessas chaves já está registrada
    em `docs/backlog.md` com gatilho ("primeiro incidente ou 12 meses
    em produção").
- **Parte 4 — Produção:** só preparação, nada do Railway/Cloudflare/R2
  real existe ainda. `GET /health` (pré-requisito 4.1) e a interface do
  `StorageService` (pré-requisito 4.2) já estão prontos; o resto depende
  do projeto Railway e do bucket R2 existirem.
  - **Perguntas em aberto respondidas em 2026-11-13** (ver
    "Perguntas em aberto" no plano completo): nenhuma instituição com
    dado real em banco ainda (só dev); domínio de produção
    `terceirogestor.com.br` (`app.`/`api.`); e-mail transacional via
    Resend; login Google/Microsoft fica fora do MVP (tirar por
    enquanto, revisitar pós go-live).
  - [x] **Remover login/cadastro via OAuth Google e Microsoft** — feito
    em 2026-11-13, branch `develop`, decorrente da decisão acima
    ("ordem é remover código não usado", registrada pelo usuário). Era
    usado só no cadastro de tenant (atalho que pré-preenchia nome/email
    via perfil OAuth), nunca no login de usuário existente (`auth`
    module, 100% email+senha+MFA, intacto). Removido: 4 rotas e os 7
    métodos de OAuth em `registration.controller.ts`/`registration.service.ts`;
    `GOOGLE`/`MICROSOFT` do enum `TenantRegistrationMethod` e
    `PENDING_OAUTH` do enum `TenantRegistrationStatus`; campos
    `oauthProviderSub`/`oauthStateHash` de `TenantRegistration`
    (migration `20261113114835_remove_tenant_registration_oauth`,
    aplicada local — sem dado real em produção, então migration única,
    sem precisar do padrão expandir/contrair); os 2 botões e as 2
    funções `build*RegistrationUrl` em
    `register-client-page.tsx`/`registration.ts` (frontend); as 4
    variáveis `GOOGLE_OAUTH_*`/`MICROSOFT_OAUTH_*` de `.env`,
    `.env.example`, `backend/.env.example`, `.env.production.example`;
    o item 4.3 do plano completo (URLs de redirect OAuth) marcado como
    não aplicável. Confirmado por `SELECT` direto no Postgres local:
    zero linhas em `TenantRegistration` usando `GOOGLE`/`MICROSOFT`/
    `PENDING_OAUTH` antes da migration (nada para perder).
    **Evidência:** backend `tsc --noEmit -p tsconfig.build.json` → 0
    erros; `npm test` → 27 suítes, 136 testes, ok; `npx eslint` nos
    arquivos tocados → 4 problemas (pré-existentes, nada novo — baseline
    media via `git stash` era 60, incluindo os `no-unsafe-*` do código
    OAuth agora removido); frontend `tsc --noEmit` → 0 erros; `npx
    eslint` nos arquivos tocados → 0 problemas; `npm run build` → ok.
  - [x] **Trocar provedor de e-mail para Resend** — feito em 2026-11-13,
    branch `develop` (decisão do usuário, ver "Perguntas em aberto"
    acima). `EmailService` reescrito: SMTP genérico (`nodemailer`) →
    SDK oficial `resend` (`npm install resend`, `npm uninstall
    nodemailer` — sem uso restante no projeto). Variáveis
    `SMTP_HOST/PORT/USER/PASS/FROM` → `RESEND_API_KEY`/`EMAIL_FROM` em
    `.env`, `.env.example`, `backend/.env.example`,
    `.env.production.example`. Sem `RESEND_API_KEY` configurada, o
    serviço imprime no console (mesmo comportamento de fallback de
    antes, só troca a variável que o aciona) — os 3 fluxos que mandam
    e-mail (reset de senha, código de registro, confirmação) continuam
    chamando a mesma interface `EmailService.send()`, não precisaram
    mudar. Resolve também o item de `npm audit` pendente sobre
    `nodemailer` (alta severidade) — por remoção, não upgrade.
    **Ainda falta:** testar o envio real, que exige a
    `RESEND_API_KEY` de uma conta Resend (ação do usuário).
    **Evidência:** 3 testes novos em `email.service.spec.ts` (fallback
    console sem chave, envio ok mockando o SDK, erro do Resend vira
    `BadRequestException`); backend `tsc --noEmit -p tsconfig.build.json`
    → 0 erros; `npm test` → 28 suítes, 139 testes, ok; `npx eslint` nos
    arquivos tocados → 0 problemas.
  - [x] **Driver `r2` do `StorageService`** — feito em 2026-11-13, branch
    `develop` (pré-requisito 4.2; decisão de arquitetura tomada junto
    com o usuário antes de codificar — ver pergunta "Arquitetura de
    download" respondida nesta sessão: **URL assinada nativa do R2**,
    não proxy pelo backend). `npm install @aws-sdk/client-s3
    @aws-sdk/s3-request-presigner`. Achado ao investigar: o download
    (`UploadsController.download`) lia o arquivo direto do disco local,
    ignorando por completo a abstração `StorageDriver` — um driver `r2`
    só com `put`/`delete` deixaria os downloads quebrados (upload vai
    pro R2, download nunca acha o arquivo). Corrigido junto:
    `getSignedUrl` virou parte da interface `StorageDriver` (antes era
    só HMAC fixo em `StorageService`) — `local` mantém a URL assinada
    própria de hoje (`/uploads/...?sig=`, verificada por
    `UploadsController`); `r2` presigna um `GetObjectCommand` nativo
    (`@aws-sdk/s3-request-presigner`), e o navegador passa a baixar
    direto do bucket, nunca pela API. Consequência assumida: o log de
    acesso sensível (`PersonSensitiveAccessLog`, item 2 de
    `docs/auditoria-riscos.md`) não pode mais depender do download
    passar pela API (não passa, com `r2`) — moveu de
    `UploadsController.download` para `SignUploadsInterceptor`, no
    momento em que a URL é emitida (mesmo princípio para os dois
    drivers agora, não só pra `r2`): uma falha ao gravar o log não
    derruba a resposta (`try/catch` + aviso, mesmo padrão defensivo de
    `PrismaService#safeAuditLog`). `getSignedUrl` ficou `async` (e
    `SignUploadsInterceptor` também, via `switchMap`/`Promise.all`, já
    que presignar no R2 é uma chamada assíncrona do SDK). Variáveis
    novas: `STORAGE_DRIVER` (default `local`), `R2_ACCOUNT_ID`,
    `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` nos 4
    arquivos de env (`.env.production.example` já com
    `STORAGE_DRIVER=r2`). **Ainda falta:** testar contra um bucket R2
    de verdade — exige a conta/credenciais (ação do usuário); migração
    dos arquivos que já existem localmente fica para quando isso
    acontecer (script idempotente, como o plano já previa).
    **Evidência:** `storage.service.spec.ts` reescrito (14 testes:
    local inalterado + 4 novos de `r2` mockando `@aws-sdk/client-s3`/
    `s3-request-presigner` + rejeição de driver desconhecido/env
    incompleta); `sign-uploads.interceptor.spec.ts` com 2 testes novos
    (log não dispara sem `personId` em nenhum nível, falha no log não
    derruba a resposta); `uploads.controller.spec.ts` simplificado (sem
    `PrismaService`/`RequestContextService`, que saíram do construtor).
    backend `tsc --noEmit -p tsconfig.build.json` → 0 erros; `npm test`
    → 28 suítes, 143 testes, ok; `npx eslint` nos arquivos tocados → 0
    problemas.
  - [x] **Sentry no backend e no frontend** — feito em 2026-11-13, pré-
    requisito 4.5 ("saber do erro antes da instituição ligar"),
    incluindo falha de auditoria. `npm install @sentry/nestjs`
    (backend) e `@sentry/nextjs` (frontend). **Backend:**
    `src/instrument.ts` (novo, `Sentry.init` só se `SENTRY_DSN` estiver
    setada — sem DSN, zero mudança de comportamento), importado como
    primeira linha de `main.ts`; `SentryModule.forRoot()` como primeiro
    item de `imports` em `app.module.ts`; `SentryGlobalFilter` como
    filtro global (`app.useGlobalFilters`) — não existia nenhum filtro
    global antes, sem conflito. `Sentry.captureException(error)`
    adicionado nos 2 pontos que hoje só fazem `console.warn` e engolem
    o erro (`PrismaService#safeAuditLog`,
    `SignUploadsInterceptor#logSensitiveAccess`) — a falha de auditoria
    agora também vira alerta, não só log local. **Frontend (Next 16,
    App Router):** `src/instrumentation.ts` (`register()` +
    `onRequestError: Sentry.captureRequestError`, API estável desde o
    Next 15, confirmada na doc embutida no pacote `next`),
    `src/instrumentation-client.ts` (convenção atual — `sentry.client.
    config.ts` foi descontinuado a partir do Next 15.3), `src/app/
    global-error.tsx` novo (não existia nenhum error boundary ainda).
    `next.config.ts` envolvido com `withSentryConfig` de
    `@sentry/nextjs/config` (não é mais exportado do pacote principal
    nesta versão) — `org`/`project`/`authToken` ficam de fora até
    existir um projeto Sentry real; sem eles o plugin só pula o upload
    de sourcemaps (confirmado: `npm run build` roda limpo, sem nenhum
    aviso do Sentry). Variáveis novas: `SENTRY_DSN`/`SENTRY_ENVIRONMENT`
    (server) e `NEXT_PUBLIC_SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_ENVIRONMENT`
    (client, mesma DSN normalmente) nos 4 arquivos de env.
    **Ainda falta:** DSN de um projeto Sentry real (ação do usuário) —
    sem ela nenhum dos dois apps reporta nada, intencionalmente.
    **Evidência:** backend `tsc` → 0 erros; `npm test` → 28 suítes, 143
    testes, ok (inalterado - nenhum spec monta o `AppModule` completo);
    `npx eslint` nos arquivos tocados → 0 problemas novos (`main.ts`/
    `prisma.service.ts` mantiveram a mesma contagem de antes, 137
    problemas, confirmado via `git stash`). Teste manual real: subi o
    backend (`npm run start:dev`) e confirmei no log — `SentryModule
    dependencies initialized` e `Nest application successfully
    started` antes de qualquer outra coisa, provando que o módulo e o
    filtro global inicializam sem erro (o bind da porta 3001 falhou só
    porque já havia outro processo `node dist/main` alheio a esta
    sessão ocupando a porta — não é regressão do Sentry). Frontend:
    `tsc` → 0 erros; `npx eslint` nos arquivos tocados → 0 problemas;
    `npm run build` → ok, sem nenhum aviso/erro do Sentry no output.
- **Achados novos da auditoria:** [x] 13 (`.gitignore` sem barra,
  2026-11-11), [x] 14 (seed sem build automatizado, 2026-11-11, ver CI
  acima) e [x] 16 (versão de Node, 2026-11-13 — Dockerfile/CI/`.nvmrc`
  dos dois apps já em 22.x, nenhuma mudança necessária; ambiente de dev
  local fica em v26.1.0 por decisão do usuário, ver `docs/backlog.md`)
  feitos.

## Parte atual: Partes 2 e 3 fechadas (exceto itens intencionalmente adiados), pronta para a Parte 4

Fica aberto só o que foi adiado de propósito: a dívida de lint medida
(não reduzida) e o item 3.5 (mover `PII_MASTER_KEY`/`TOTP_ENCRYPTION_KEY`
para um gerenciador de senhas — ação operacional do usuário, não é
código). Parte 4 (Railway/Cloudflare/R2) só começa quando o projeto
Railway existir.

**Desvio em andamento, a pedido explícito do usuário em 2026-11-13:**
Fases 1, 2 e 3 do plano SCFV (então em `docs/plano-implementacao-scfv.md`,
hoje `docs/historico/plano-implementacao-scfv.md` — ver nota de
2026-11-15 abaixo) foram iniciadas antes da Parte 4/5. Fase 1: model `ActionOccurrence` (Encontro)

- endpoints (CRUD, geração em lote por recorrência semanal, cancelamento
em série). Fase 2: aba "Encontros" no detalhe da Atividade (lista/
calendário, agendamento em lote, edição/cancelamento) — testada de ponta
a ponta com navegador real. Fase 3: presença/qualidade migraram de
"por Atividade" para "por Encontro" (migration em 2 passos + backfill
- seletor de Encontro no frontend, reaproveitando as abas existentes).
Todas implementadas e testadas (ver evidência nas seções "Fase 1"/
"Fase 2"/"Fase 3" desse plano). Não bloqueia a Parte 4; é trabalho
adicional em paralelo.

**Novo desvio, a pedido explícito do usuário em 2026-11-13:**
redesenho de Programa→Projeto→Atividade→Encontro (consolidar
`ProjectGroup`/`PeopleGroup`, matrícula por Grupos, Encontro com Grupos de
equipe, rename Ação→Atividade no código via `@@map`, relatórios em
cascata) — plano completo em
`docs/historico/plano-redesenho-Grupos-matricula-atividades.md` (movido
para `historico` em 2026-11-15, ver nota abaixo), em fases R1-R5.

Fase R1 (eliminar `ProjectGroup`, consolidar em `PeopleGroup`) concluída:
migration de remoção (`20261113170301_remove_project_group`, sem dado de
produção a preservar), backend limpo (CRUD de `ProjectGroup` e branch
`PROJECT_GROUP` removidos de `project-structure.*` e `actions.service.ts`;
`tsc` 0 erros, `npm test` 28 suítes/143 testes sem regressão) e frontend
limpo (módulo standalone + 4 window actions + search view removidos via
`git rm`; `tsc` 0 erros; `eslint` 211 problemas vs. baseline 217 via `git
stash`, net -6, nenhuma categoria nova; `npm run build` sucesso). Detalhe
completo na seção "Status" da Fase R1 em
`docs/historico/plano-redesenho-Grupos-matricula-atividades.md`.

Correção do seletor de colunas/Painel Search (fora da numeração R1-R5,
mas no mesmo desvio): causa raiz era estrutural
(`PageControlPanel`/`ControlPanelContext` relocam o botão da busca pra
fora do `ColumnVisibilityProvider` local) — corrigido elevando o estado
pro `RecordListHost`; Relations (abas de relação + diálogos de vínculo)
passam a nunca mostrar o seletor. Verificado com browser real (Chrome já
instalado + Playwright, sem baixar nada). Detalhe completo já registrado
nesta seção anteriormente.

Fase R2 (matrícula por Grupos) concluída: sem migration — a revisão é
computada em cima de `PeopleGroupParticipation`/`ProjectEnrollment`
existentes (ver "Status" da Fase R2 no plano). Backend:
`syncPeopleGroupEnrollments` + rota `POST .../sync-enrollments`; `tsc` 0
erros, `npm test` 28/143 sem regressão, `eslint` igual à baseline (3
diffs de quebra de linha corrigidos com `--fix`). Frontend: botão
"Matricular/revisar membros" na tab Grupos do Projeto; `tsc` 0
erros, `eslint` igual à baseline, `npm run build` sucesso. Testado com
dado real via API direta no projeto "Projeto Alvorada"/Grupos "C1M":
removida 1 participação ativa + adicionada 1 pessoa nova → resultado
exato `enrolled: [Bianca Torres], ended: [Sabrina Melo]`; testado
também no browser (botão aparece só nos Grupos PARTICIPANT, diálogo de
confirmação, toast de resumo). Banco resetado via `npm run db:seed`
depois do teste. Seguindo para a Fase R3 (Encontro ganha planejamento/
relatório/fotos + Grupos de equipe — escopo ampliado nesta sessão, ver o
plano).

Fase R3 (Encontro ganha planejamento/relatório/fotos + Grupos de equipe)
concluída: migration `20261114013300_move_plan_report_to_occurrence_add_team_group`
move `planHtml`/`executedHtml`/`conclusionHtml`/`photoPaths` de
`ProjectAction` pra `ActionOccurrence` (mantém `completionPercent` na
Atividade) e cria `ActionOccurrenceTeamGroup`; `seed.ts` migrado junto.
Backend: `actions.service.ts` valida e persiste os 4 campos +
`teamPeopleGroupIds` em create/update/bulk de `ActionOccurrence`
(diff via `$transaction` no update); `createProjectAction`/
`updateProjectAction` não lidam mais com esses campos. `tsc` 0 erros,
`npm test` 28/143 sem regressão, `eslint` em `actions/**/*.ts` → 139
problemas vs. 137 na baseline (+2 do mesmo
`@typescript-eslint/no-unsafe-assignment` já existente, nenhuma
categoria nova); DTOs tocados → 0 problemas. Frontend: diálogo de
edição do Encontro ganha seletor de Grupos de equipe, 3 campos
`<RichText>` e editor de fotos próprio; aba da Atividade troca
executado/conclusão/fotos por uma aba "Progresso" só com
`completionPercent`; "Relatório" passa a ler do Encontro selecionado.
`tsc` 0 erros, `eslint` nos 8 arquivos tocados → 11 problemas vs. 12 na
baseline (mesma categoria, contagem menor), `npm run build` sucesso.
Testado no browser com dado de seed (Encontro "Acolhimento de abertura"
do "Projeto Música Manhã"): diálogo já chega com Grupos de equipe
marcados e conteúdo migrado preenchido; upload de foto ao vivo
funcionou (1/5 fotos) e salvou (toast "Encontro atualizado"); aba
Relatório confirma o mesmo conteúdo vindo do Encontro, não mais da
Atividade. Detalhe completo na seção "Status" da Fase R3 em
`docs/historico/plano-redesenho-Grupos-matricula-atividades.md`. Fases R4
(rename Ação→Atividade via `@@map`) e R5 (relatórios em cascata) ainda
não retomadas — absorvidas em 2026-11-15 pelo novo plano mestre (ver nota
abaixo), como "Fase 1.0" e "Fase 9" respectivamente.

**Revisão de documentação em 2026-11-15, a pedido explícito do usuário:**
o usuário escreveu
`docs/terceiro-gestor-plano-de-desenvolvimento-modulos-atendimento-e-projetos.md`
(Fases 0-9 dos módulos Atendimento e Gestão de Projetos) e pediu revisão
de toda a documentação de planejamento para eliminar divergência. Decisão
do usuário: esse documento novo é **o plano mestre** para esses dois
módulos daqui pra frente, substituindo
`docs/plano-implementacao-scfv.md`,
`docs/especificacao-completa-saas-para-ongs-de-scfv.md` e as Fases R4/R5
de `docs/plano-redesenho-Grupos-matricula-atividades.md` (os três movidos
para `docs/historico/`, mantidos como registro histórico — Fases 1-3/R1-R3
já implementadas continuam com evidência preservada lá). A nomenclatura do
documento novo (`Meeting`/`Attendance`/`Benefit`/`Referral`/`Occurrence`/
`Case`/etc.) é a referência oficial para o trabalho ainda não
implementado; o próprio documento traz uma tabela de mapeamento para o
que já existe no banco sob outros nomes (`ActionOccurrence` = `Meeting`,
`ProjectActionAttendance` = `MeetingAttendance` etc.) — nenhuma tabela já
criada foi renomeada só para bater com o texto. Também arquivados nesta
revisão, por estarem obsoletos/órfãos: `docs/canonical-business-structure.md`
(descrevia `ProjectGroup` como conceito ativo — eliminado na Fase R1) e
`docs/module-canonical-checklist.md` (checklist do "Marco Zero 1.0", já
fechado, sem nenhuma referência viva). `docs/pesquisa-de-mercado-modulo-scfv.md`
continua ativo (é pesquisa regulatória, não plano). Nenhuma linha de
código mudou nesta revisão — é só documentação.

**Fase 1.0 do plano mestre (rename no código) concluída em 2026-11-15,**
a pedido explícito do usuário. Escopo: só os 5 models que o plano
mestre lista — `ProjectAction`→`Activity`, `ActionType`→`ActivityType`,
`ActionOccurrence`→`Meeting`, `ProjectActionAttendance`→`MeetingAttendance`,
`ActionPeopleGroup`→`ActivityPeopleGroup` —, via `@@map`/`@map` do Prisma
(tabela física inalterada, nenhuma migration gerada). Deliberadamente
fora do escopo (nomes de modelo que não mudam, mesmo decisão já tomada na
Fase R4 original): `ProjectActionComment`, `ProjectActionAttachment`,
`ProjectActionPeopleParticipation`, `ActionOccurrenceTeamGroup`, e os 3
enums (`ActionStatus`, `ActionTarget`, `ActionPeopleParticipationRole`).
**Backend:** schema editado model a model (9 edições em
`schema.prisma`, confirmado `npx prisma validate` + `npx prisma generate`
sem erro); find-and-replace disciplinado de `prisma.<accessor>` e
`Prisma.<Tipo>` (ordem cuidando de colisão de prefixo, ex.:
`prisma.projectActionAttendance` antes de `prisma.projectAction`) em
`actions.service.ts`, `dashboard.service.ts`, `people-groups.service.ts`,
`project-structure.service.ts`, `prisma/seed.ts` (+ `seed.js`/`seed.js.map`
recompilados via `npm run build:seed`), `scripts/backfill-action-occurrences.js`,
`scripts/migrate-upload-keys-to-tenant-scoped.js`,
`test/tenant-isolation.e2e-spec.ts`, `test/support/tenant-isolation.setup.ts`.
2 comentários desatualizados corrigidos de propósito (`actions.service.ts`,
`sign-uploads.interceptor.spec.ts`). **Frontend:** 37 identificadores
renomeados (tipos `Api*`/`*Input`/`*Response`/`*ListItem` + funções do
cliente de API) em 20 arquivos de `modules/actions`, `modules/projects` e
`web-client/data-provider/rest/actions.ts` — nomes de componente React,
arquivos e rotas **não** foram tocados (fora do escopo: só "tipos e código
interno"). **Correção em 2026-11-15, achada durante teste de navegador da
Fase 1:** a afirmação original aqui ("a UI/labels já diziam 'Atividade'
desde a Fase 4 do plano SCFV") estava **errada** — nunca foi verificada.
O rótulo visível continua "Ação"/"Ações" em todo lugar (manifest do
módulo, sidebar, breadcrumbs, botão "Nova ação", `actions-module-contract.tsx`
`entity: { singular: "Ação", plural: "Ações" }`). O relabel textual
(Fase 4 do plano SCFV antigo) nunca foi de fato executado — registrado
como pendente em `docs/backlog.md`.
**Evidência:** backend `npx tsc --noEmit -p tsconfig.build.json` → 0
erros; `npm test` → 28 suítes/143 testes sem regressão; `npm run build` →
ok; `npx eslint` nos 4 arquivos de serviço tocados → 141 problemas vs. 146
na baseline (medida via `git stash` + `prisma generate` pro schema antigo,
pra não contaminar a comparação) — net -5, nenhuma categoria nova (1
`prettier/prettier` cosmético corrigido com `--fix`). Frontend `npx tsc
--noEmit` → 0 erros; `npm run build` → ok; `npx eslint` nas áreas tocadas →
mesma dívida já documentada (`react-hooks/set-state-in-effect`,
`react-hooks/preserve-manual-memoization`), nenhuma categoria nova.
Confirmado por grep (`\b(ProjectAction|ActionType|ActionOccurrence|
ProjectActionAttendance|ActionPeopleGroup)\b`, case-insensitive) em todo o
repositório: zero referência sobrando fora de `docs/historico/`, das
migrations (SQL histórico, não muda — `@@map` preserva a tabela física) e
de 3 pontos pré-existentes deixados intocados de propósito (`entity:
"ProjectAction"` em `prisma/seed.ts`, `ENTITY_LABELS` do dashboard e o
filtro da aba Auditoria em `actions-detail-layout-contract.tsx`/
`projects-detail-layout-contract.tsx` — nenhum corresponde a uma gravação
real de audit log hoje, confirmado por grep em `backend/src` por
`entity: 'ProjectAction'`/`entity: 'Project'`: só `DepositItem`/
`PantryItem`/`TaskOrganizerTask`/etc. são gravados de verdade; não são
identificadores de código, são valores de string livres). Sem Postgres
disponível neste ambiente para `prisma migrate status` — não é um
problema: `@@map` não gera migration (confirmado pelo schema validar e o
client gerar sem diff de migration).
**Achado incidental, registrado em `docs/backlog.md`:**
`migrate-upload-keys-to-tenant-scoped.js#migrateProjectActionPhotoPaths`
já estava quebrado desde a Fase R3 (2026-11-14, moveu `photoPaths` de
`ProjectAction` pra `ActionOccurrence`) — não corrigido aqui, fora do
escopo desta fase.

**Fase 1 do plano mestre (Estrutura básica de Projetos) concluída em
2026-11-15,** a pedido explícito do usuário. Dos 5 itens da fase,
`Program`/`Activity`/`Meeting` manual/turma vinculada já existiam; os 2
gaps reais, resolvidos agora:

- **Decisão do usuário sobre `funding_source`:** não é campo único no
  `Project` — a dor de "financiamento misto" (seção 1.2 do plano mestre)
  é real, então criei `ProjectFundingSource` (N por projeto: `source`
  `MUNICIPAL/ESTADUAL/FEDERAL/TERCEIRO` + `name`/`notes` livres).
  Pedido explícito do usuário: registrar no backlog uma fase futura para
  revisar essa estrutura visando boa gestão dos recursos do projeto
  (valores, prazos, templates por fonte) — feito em `docs/backlog.md`.
- `Goal`/`Objective` modelado como **uma única entidade** `Goal`
  (`title`/`description`, por `Project`) — decisão própria registrada
  explicitamente no plano mestre (seção da Fase 1) para confirmação do
  usuário, já que o documento original usava os dois nomes de forma
  ambígua.
**Schema:** migration `20261115120000_add_goal_and_project_funding_source`
(enum `FundingSourceType`; tabelas `ProjectFundingSource`/`Goal`; coluna
`goalId` em `ProjectAction`) — **escrita à mão**, replicando exatamente o
estilo das migrations já existentes (`CreateEnum`/`AlterTable`/
`CreateTable`/`CreateIndex`/`AddForeignKey`, mesma convenção de nomes de
constraint), porque este ambiente não tem Postgres acessível para
`prisma migrate dev` gerar automaticamente (`P1001`, confirmado também
que não há nada escutando a porta 5432 nem serviço de Postgres instalado
aqui). **Ação pendente do usuário:** rodar `npx prisma migrate dev` (ou
`migrate status`) numa máquina com Postgres antes de aplicar essa
migration em qualquer ambiente, para confirmar que o SQL bate com o
schema sem drift — isso não foi verificado nesta sessão.
**Backend:** CRUD completo de `funding-sources` e `goals` em
`project-structure.service.ts`/`.controller.ts` (rotas
`/projects/:projectId/funding-sources` e `/goals`, reaproveitando as
permissões `project-structure.*` já existentes, sem chave nova);
`actions.service.ts` valida `goalId` contra o projeto
(`ensureGoalBelongsToProject`) em create/update da Atividade e inclui
`goal: { id, title }` no retorno. `prisma/seed.ts` ganhou 1 meta + 2
fontes de financiamento de exemplo (Projeto Música Manhã), com a
atividade "Ensaio dos meninos da percussão" já vinculada à meta.
**Evidência:** `npx prisma validate` + `npx prisma generate` → ok; `tsc
--noEmit -p tsconfig.build.json` → 0 erros; `npm test` → 28 suítes/143
testes sem regressão; `npm run build` → ok; `npm run build:seed` → ok
(seed.ts compila e `seed.js`/`seed.js.map` foram recompilados); `npx
eslint` nos 9 arquivos novos/tocados do backend → 0 problemas novos (as 4
service files mantiveram os mesmos 141 problemas já medidos na Fase 1.0).
**Frontend:** tipos `ApiGoal`/`ApiProjectFundingSource` +
`GoalInput`/`ProjectFundingSourceInput` (`modules/projects/api/types/
structure.ts`) + funções de API (`project-structure.ts`); duas seções
novas autocontidas — `ProjectGoalsSection`/`ProjectFundingSourcesSection`
(mesmo padrão de `ActionOccurrencesSection`: fetch próprio via
`useAuth()`, sem acoplar ao engine) — plugadas como abas "Metas" e
"Financiamento" no detalhe do Projeto (`projects-detail-layout-contract.tsx`,
usando a chave genérica `content:` do `tabTemplates`, já suportada pelo
engine mas não usada antes neste arquivo); seletor de Meta opcional no
formulário de Atividade (`action-create-form-section.tsx`, compartilhado
por create/edit). **Evidência:** `tsc --noEmit` → 0 erros; `npm run
build` → ok; `npx eslint` nos arquivos novos → 4 problemas, todos
`react-hooks/set-state-in-effect` (dívida já tolerada em todo o projeto,
nenhuma categoria nova).
**Testado manualmente em 2026-11-15** — usuário religou o WSL, Postgres
local ficou acessível. `npx prisma migrate dev` aplicou a migration
escrita à mão **sem detectar drift** (confirma que o SQL batia com o
schema). `npm run db:seed` ok. Backend (`npm run start:dev`) e frontend
(`npm run dev`) subiram sem erro. Teste real de navegador (Playwright,
Chromium já em cache local, login real `admin@seed.local`): aba "Metas"
do Projeto mostra a meta do seed + cria uma nova via diálogo; aba
"Financiamento" mostra as 2 fontes do seed com badge Municipal/Terceiro
corretos; seletor "Meta (Plano de Trabalho)" no formulário de Atividade
popula corretamente ao escolher o Projeto; zero erro de console nas 8
telas visitadas. Achado no caminho, nada a ver com código quebrado: o
formulário de login realmente perde o que foi digitado se preenchido
antes do nome da instituição carregar (bug já conhecido, registrado em
`docs/backlog.md` desde 2026-11-13) — contornado no script de teste
esperando o nome carregar antes de preencher. Dados de teste (3 metas
fictícias, geradas ao reexecutar o script durante o ajuste dos
seletores) removidos via API; banco restaurado com `npm run db:seed`.
**Achado e corrigido na documentação:** a Fase 1.0 afirmava que o rótulo
de UI já dizia "Atividade" — nunca tinha sido verificado e estava
**errado** (confirmado nas telas reais: ainda era "Ação"/"Ações" em todo
lugar — manifest do módulo, breadcrumbs, botão "Nova ação"). Corrigido
na seção da Fase 1.0 acima.

**Relabel "Ação"→"Atividade" feito em 2026-11-15,** a pedido explícito
do usuário ("se ficou pendência na Fase 1, finalize"). Find-and-replace
disciplinado (regex com `\b`, preservando "ação"/"ações" genéricas que
não são sobre esta entidade — ex.: "Esta ação não pode ser desfeita" em
diálogos de confirmação, "Ação" como coluna de log de auditoria em
admin/access-log, "Ações" como menu de linha em `project-enrollments-card.tsx`
— nenhum desses foi tocado, são sobre o verbo genérico, não a entidade)
em 17 arquivos: `modules/actions/manifest.ts` (título do menu),
`actions-module-contract.tsx` (entity singular/plural, fallbackTitle,
field label, createActionLabel, downloadFileName), `actions-detail-layout-contract.tsx`
(label da fonte de auditoria), `action-create.constants.ts`/
`action-create-engine-client-page.tsx` (breadcrumbs, títulos), `actions-list.constants.ts`/
`actions-list-module-client-page.tsx` (breadcrumbs, botão, coluna),
`action-manage.constants.ts`/`action-quality.constants.ts`/
`action-relations.constants.ts`/`action-detail-engine-client-page.tsx`/
`action-report-preview.tsx` (todos os textos da tela de detalhe/gestão),
`project-action-manage-dialog.tsx`/`projects-detail-layout-contract.tsx`
(aba/coluna/label dentro do Projeto), `web-client/registry/actions/
actions.tsx`/`project-structure.tsx` (breadcrumbs, título da janela),
`web-client/registry/searchViews/actions.ts` (placeholder de busca —
achado só depois, porque estava sem acento: "Pesquisar acoes por..." não
batia com o regex acentuado), `core-dashboard-client-page.tsx` (ação
rápida do Dashboard + título do gráfico + nome do arquivo baixado).
**Evidência:** `npx tsc --noEmit` → 0 erros; `npm run build` → ok; `npx
eslint` nas áreas tocadas → mesma dívida já tolerada
(`react-hooks/set-state-in-effect`/`react-hooks/preserve-manual-memoization`),
nenhuma categoria nova. Teste real de navegador (mesmo Chromium em cache,
login real): sidebar mostra "Atividades"; ação rápida do Dashboard
mostra "Registrar atividade"; lista mostra breadcrumb "Atividades",
coluna "ATIVIDADE" e placeholder de busca "Pesquisar atividades por
titulo ou tipo"; formulário de criação mostra breadcrumb "Atividades >
Nova atividade", título "Nova atividade" e botão "Criar atividade" —
confirmado por screenshot real, zero "Ação"/"Ações" sobrando nessas
telas. Nenhum dado de teste criado (só navegação, não cheguei a
submeter o formulário). Servidores de dev encerrados ao final.
**Dívida reconhecida, não bloqueante:** o ambiente de dev ficou visivelmente
sobrecarregado durante os testes repetidos desta sessão (respostas de
10-20s+ em rotas já compiladas, 1 `ECONNRESET` de fetch) — não é
regressão de código (confirmado: a mesma rota funcionou assim que o
servidor teve um instante para respirar), é só o custo de rodar 3
sessões de Playwright + 2 reinícios de servidor seguidos neste sandbox.

**Fase 3 do plano mestre (Presença Diária derivada) concluída em
2026-11-15,** a pedido explícito do usuário ("implemente a fase 3, os
testes vou fazer depois" — mesmo assim, testada de ponta a ponta contra
Postgres real nesta sessão, ver abaixo). **Decisão própria de escopo,
registrada para confirmação futura:** `DailyAttendance` é por
pessoa/dia (`tenantId`+`personId`+`date`), não por projeto — o texto da
fase só diz "por pessoa/data"; se um dia precisar de presença diária
*dentro de um projeto específico*, é migração aditiva simples
(`projectId` a mais na tabela).
**Schema:** migration `20261115172019_add_daily_attendance` — desta vez
gerada e aplicada de verdade via `npx prisma migrate dev` (Postgres
local acessível nesta sessão, depois que o usuário religou o WSL), sem
precisar escrever SQL à mão como na Fase 1.
**Backend:** `syncDailyAttendanceForPersonDate` reavalia do zero a cada
chamada (conta quantos `MeetingAttendance` `PRESENT` existem pra
pessoa+data, em qualquer encontro/atividade, e faz upsert ou remove) —
decisão deliberada de não incrementar/decrementar contador, porque isso
trata corretamente o caso de corrigir uma presença já lançada (de
`PRESENT` pra `ABSENT`): se não sobra nenhuma outra presença no dia, o
registro some, não fica errado. Conectado em `actions.service.ts` nos 3
pontos que escrevem ou apagam `MeetingAttendance`:
`upsertProjectActionAttendances` (fluxo principal de marcar presença),
`deleteActionOccurrence` e `deleteProjectAction` (evita presença diária
órfã quando um encontro ou uma atividade inteira some). Relatório
simples novo: `GET /actions/attendance-summary/:personId?month=AAAA-MM`
→ `{ activityAttendances, dailyAttendances }`, reaproveitando a
permissão `actions.read` já existente (sem chave nova).
**Evidência:** `npx prisma migrate dev` → aplicou sem nenhum drift
detectado (prova que o design do schema está consistente);
`tsc --noEmit -p tsconfig.build.json` → 0 erros; `npm test` → 28
suítes/143 testes sem regressão; `npm run build` → ok; `eslint` em
`actions.service.ts`/`actions-list.controller.ts` → 131 problemas vs.
132 na baseline (medida via `git stash`, descontaminada regenerando o
Prisma Client pro schema antigo antes de medir) — net -1, nenhuma
categoria nova; DTO novo (`person-attendance-summary-query.dto.ts`) → 0
problemas.
**Testado de ponta a ponta contra Postgres real** (não só unitário, já
que o ambiente tinha banco disponível desta vez): backend de pé, dados
do seed, autenticação real. Criados 3 encontros em 3 atividades
diferentes do "Projeto Música Manhã" na mesma data (2026-04-01); marcada
presença `PRESENT` da mesma matrícula (pessoa `...113004`) nos 3 →
`GET /actions/attendance-summary/...113004?month=2026-04` devolveu
`{"activityAttendances":3,"dailyAttendances":1}` — bate exatamente com o
critério de teste da fase ("3 registros de presença por atividade, mas
1 único registro de presença diária"). Corrigida 1 das 3 presenças para
`ABSENT` → `dailyAttendances` continuou `1` (ainda sobravam 2
`PRESENT`, prova que a reavaliação funciona, não é só "criar e nunca
apagar"). Corrigidas as 2 restantes para `ABSENT` → `dailyAttendances`
caiu pra `0`. Marcada `PRESENT` de novo numa delas e excluído o próprio
encontro (única presença do dia) → `dailyAttendances` voltou a `0`,
confirmando que `deleteActionOccurrence` também dispara a reavaliação.
Os 3 encontros de teste foram excluídos via API ao final; banco
restaurado com `npm run db:seed`. Seed também ganhou 4
`DailyAttendance` de exemplo, coerentes com as presenças `PRESENT` já
existentes no seed — confirmado por `GET /actions/attendance-summary`
real contra o seed limpo antes de começar o teste
(`{"activityAttendances":1,"dailyAttendances":1}` para a pessoa
`...113001` em fevereiro/2026, batendo com o único `PRESENT` do seed
pra ela naquele mês).
**Fora do escopo desta fase, de propósito:** nenhuma tela de frontend
para o relatório — o critério de teste é inteiramente sobre
comportamento de dados (testável por API), e "relatório simples" no
texto da fase não especifica onde expor na UI. A API já existe; criar a
tela é um próximo passo separado e pequeno, se/quando quiser.

**Fase 4 do plano mestre (Recorrência e geração automática de agenda)
concluída em 2026-11-16,** a pedido explícito do usuário
("Implemente a Fase 4 de acordo com o
`docs/terceiro-gestor-plano-de-desenvolvimento-modulos-atendimento-e-projetos.md`").
Investigação prévia (antes de codificar) confirmou que geração em lote
por recorrência e edição/cancelamento pontual via `recurrenceBatchId` já
existiam desde as Fases 1-2 do plano SCFV anterior; os 2 gaps reais
eram exatamente os que o índice do plano mestre já apontava: preview
antes de confirmar, e exceções/feriados.
**Decisão de design:** em vez de um calendário de feriados à parte,
feriados/pontos facultativos são tratados como qualquer outra data que
o usuário queira excluir manualmente na tela de preview — sem cadastro
novo, sem reuso entre atividades. Registrado no plano mestre para
confirmação futura do usuário.
**Backend:** novo endpoint `POST .../occurrences/bulk/preview`
(`PreviewActionOccurrencesDto`: `startDate`/`endDate`/`daysOfWeek`) que
roda a mesma `generateOccurrenceDates` e as mesmas validações de
período/limite (200) do bulk-create, mas só retorna as datas, sem
persistir; `BulkCreateActionOccurrencesDto` ganhou `excludedDates?:
string[]`, filtrado antes da criação (excluir todas as datas geradas
vira `400` explícito, não um lote vazio). Mesma permissão
`actions.create`, sem chave nova. `tsc --noEmit -p tsconfig.build.json`
→ 0 erros; `npm test` → 28 suítes/143 testes sem regressão; `eslint` nos
3 arquivos tocados → 138 problemas, idêntico à baseline (`git stash`),
nenhum problema novo.
**Frontend:** `BulkScheduleOccurrencesDialog`
(`action-occurrences-section.tsx`) ganhou um segundo passo de preview —
lista de datas com checkbox (dia da semana ao lado), contador "N de M
selecionada(s)" ao vivo, "Voltar"/"Confirmar e agendar (N)"; novo
`previewBulkMeetings` em `occurrences.ts`. `tsc --noEmit` → 0 erros;
`npm run build` → ok; `eslint` no arquivo tocado → 3 problemas,
idêntico à baseline (`git stash`, mesma categoria já tolerada em todo o
projeto, `react-hooks/set-state-in-effect`).
**Testado de ponta a ponta contra Postgres real**, via API direta e via
navegador real (Playwright + Chromium em cache, backend e frontend de
pé, login real `admin@seed.local`): preview de uma atividade semanal
(segunda-feira) de 2027-01-01 a 2027-12-31 devolveu exatamente 52
datas; excluídas 3 e confirmado → `created: 49` (bate com o critério de
teste da fase: "~48 encontros, remover 3 feriados, confirmar"); nenhuma
das 3 datas excluídas presente no resultado. Casos de erro confirmados:
período invertido → `400`; excluir todas as datas geradas → `400` com
mensagem específica. No navegador (fluxo completo Projetos → Projeto
Música Manhã → aba Atividades → "Ensaio dos meninos da percussão" → aba
Encontros → "Agendar encontros"): tela de preview mostrou "52 de 52
data(s) selecionada(s)"; desmarcar 3 datas atualizou o contador ao vivo
para "49 de 52" e o botão para "Confirmar e agendar (49)"; após
confirmar, a lista de Encontros mostrou o primeiro encontro em
25/01/2027 (a 4ª segunda-feira, já que as 3 primeiras foram excluídas) e
o toast "49 encontro(s) criado(s)"; zero erro no console em todas as
telas visitadas. Edição pontual sem afetar a série não foi re-testada
nesta sessão (mecanismo inalterado, evidência própria já existe nas
Fases 1-2 do plano SCFV anterior). Todos os 98 encontros de teste criados
nesta sessão (49 via API + 49 via navegador) foram excluídos via API ao
final; `GET .../occurrences` da atividade de teste confirmou `total: 0`
depois da limpeza; dados do seed confirmados intactos (`Projeto Música
Manhã` com `startsAt`/`endsAt`/`updatedAt` idênticos ao estado
pré-teste — um bug do próprio script de teste preencheu por engano um
campo de data do Projeto que estava atrás do diálogo antes de eu
restringir os seletores ao diálogo; confirmado que esse preenchimento
nunca foi salvo, então nada precisou ser revertido).
**Índice do plano mestre** (`docs/terceiro-gestor-plano-de-desenvolvimento-modulos-atendimento-e-projetos.md`)
atualizado: Fase 4 marcada `[x]`, evidência completa na seção da Fase 4
do próprio documento.

**Ajustes pós-teste manual da Fase 4, Grupos A concluído em 2026-11-16.**
Usuário testou manualmente os passos sugeridos e reportou 6 pontos; 3
deles (baixo risco, padrão já existente no projeto) corrigidos nesta
mesma sessão:

- **"Notas" não quebrava linha** (achado 2.8) — `TableCell` genérico
  (`components/ui/table.tsx`) força `whitespace-nowrap` em toda célula de
  toda tabela do sistema; a coluna "Notas" só tinha `line-clamp-1`, que
  não sobrepõe isso. Corrigido só nessa célula (`action-occurrences-
  section.tsx`, coluna `notes`): `<span>` com `max-w-[280px]
  whitespace-normal break-words` — não mexi no `TableCell` genérico pra
  não afetar nenhuma outra tela do sistema.
- **`window.confirm`/`alert` cru** (achado 2.9, parte 1) — o projeto já
  tem um padrão pronto pra isso (`useConfirm()` + `ConfirmActionDialog`,
  montado globalmente em `AppProviders.tsx`, já usado em `project-goals-
  section.tsx` etc.), só não estava sendo usado neste arquivo. Trocados
  os 2 usos (`handleDelete` do Encontro individual, `handleCancelSeries`
  da série) por `confirm({...})`.
- **Mensagem de erro/botão fora da tela sem scroll** (achados 1.4 e
  3.10 — provavelmente o mesmo bug: o formulário de "Agendar encontros"
  era alto o suficiente pra precisar rolar, e a mensagem de erro ficava
  no topo da área rolável enquanto o botão ficava no fim — se o usuário
  já tinha rolado pra ver o botão, a mensagem de validação (ex.: campo
  vazio) ficava fora da tela visível, parecendo que "nada aconteceu").
  **Correção estrutural, não só neste diálogo:** `SectionDialog`
  (`components/section-dialog.tsx`) ganhou um `footer` opcional, fixo
  (sticky, mesmo princípio do header que já era sticky) — comentário no
  próprio componente documenta a convenção pra diálogos futuros não
  repetirem o problema. `BulkScheduleOccurrencesDialog` migrado pra usar
  isso (mensagem de erro + botões sempre visíveis) e reorganizado em 2
  colunas (Grupos/Equipe, além de De/Até e Início/Término que já eram)
  pra reduzir a altura total.
**Evidência:** `tsc --noEmit` → 0 erros; `npm run build` → ok; `eslint`
nos 2 arquivos tocados → 3 problemas, idêntico à baseline (mesma
categoria já tolerada, `react-hooks/set-state-in-effect`, nenhum
problema novo). Testado com navegador real (Playwright, backend e
frontend de pé, login real): nota longa agora quebra em 3 linhas dentro
da célula, sem empurrar a tabela pro lado; excluir um Encontro abre o
diálogo estilizado "Excluir encontro" (confirmado: zero disparo de
`window.confirm` nativo durante o teste); período invertido (Até antes
de De) mostra a mensagem de erro já dentro do rodapé fixo, junto do
botão, sem precisar rolar a tela. Re-testado também o fluxo de preview
inteiro (13 datas geradas pra um trimestre, contador ao vivo "13 de
13" → "12 de 13" ao desmarcar uma) pra confirmar que a reorganização em
colunas não quebrou nada da Fase 4 original. **Achado durante o teste:**
52 encontros de teste (sem nenhuma data excluída) foram encontrados na
atividade — resíduo do teste manual do usuário no ponto 1.4, quando as
checkboxes não apareciam pra ele; removidos via API antes de reiniciar o
teste, `GET .../occurrences` confirmou `total: 0` depois da limpeza.
**Grupos B concluído em 2026-11-16**, a partir das 3 decisões dadas pelo
usuário (exclusão em massa deve excluir de verdade; Grupos N:N só na
Atividade por enquanto, Encontro continua com 1 Grupos por vez; migration
única sem expandir/contrair caso precisasse de schema novo):

**4.14 — Atividade com múltiplos Grupos-alvo.** Investigação encontrou a
causa raiz exata: `ActivityPeopleGroup` já era N:N no schema, mas
`syncParticipantPeopleGroupScope` (`actions.service.ts`) apagava todos os
vínculos `PARTICIPANT` e recriava só 1 a cada criação/edição — regra de
negócio deliberada, não lacuna de UI. **Sem migration nenhuma** (a tabela
de junção já suportava N linhas; só a lógica de serviço/DTO/formulário
impedia). `resolveScopeFromTarget`/`syncParticipantPeopleGroupScope`
passaram a trabalhar com `peopleGroupIds: string[]` (valida cada id antes
de escrever, evitando Atividade órfã se um id for inválido);
`CreateProjectActionDto`/`UpdateProjectActionDto` trocaram
`peopleGroupId?` por `peopleGroupIds?: string[]`; `serializeProjectAction`
passou a expor `peopleGroupIds`/`peopleGroups` (lista completa) mantendo
`peopleGroupId`/`peopleGroup` (primeiro Grupos) para os 4 pontos do
frontend que só exibem 1 nome (breadcrumb, coluna de lista, relatório) —
nenhum deles precisou mudar. `listEligibleProjectActionPeople` (lista de
elegíveis pra Encontro/presença) já agregava por `distinct peopleGroupId`
— passa a refletir todos os Grupos automaticamente, sem mudança própria.
Frontend: `action-create-form-section.tsx` trocou o `<Select>` único de
"Grupos de Pessoas" por uma lista de checkboxes (mesmo padrão do
`TeamPeopleGroupPicker` já usado em Encontros).
**Evidência:** backend `tsc --noEmit -p tsconfig.build.json` → 0 erros;
`npm test` → 28 suítes/143 testes sem regressão; `eslint` nos 3 arquivos
tocados → 139 problemas vs. 138 medidos na Fase 4 (net +1, mesma
categoria já tolerada `@typescript-eslint/no-unsafe-*`, nenhuma categoria
nova). Frontend `tsc --noEmit` → 0 erros; `npm run build` → ok. Testado
de ponta a ponta com navegador real + Postgres real: criada a atividade
"Teste multi-Grupos" marcando C1M e C2M → os dois salvos; reaberta a tela
de edição → os dois continuam marcados (confirma persistência e
re-hidratação corretas); atividade de teste excluída via API ao final,
contagem de atividades do projeto confirmada de volta a 3 (baseline do
seed).

**2.9 (parte 2) — exclusão em massa de Encontros.** `ListView` já tinha
`enableRowSelection`/`onSelectionChange`/checkbox "selecionar todos"
prontos (mesmo padrão de `project-enrollments-card.tsx`) — não precisou
de componente novo, só reusar. Adicionados: barra de busca
(`SearchBar`, mesmo componente das outras Relations) filtrando por
data/status/Grupos/notas, um `<Select>` de mês (calculado a partir das
datas já carregadas) e um botão "Selecionar" que liga/desliga o modo de
seleção (troca o clique de linha de "abrir encontro" para "marcar
checkbox"); com 1+ selecionados aparece "Excluir selecionados", que
confirma via `useConfirm()` e exclui um por um em lotes de 6
(`Promise.allSettled`, mesmo helper `runInBatches` já duplicado em
`project-enrollments-card.tsx`/`bulk-enrollment-dialog.tsx` — não criei
endpoint de delete em lote no backend, o DELETE por id já existente
basta). **Bug real achado e corrigido no caminho:** passar o `setState`
bruto pra `onSelectionChange` entra em loop infinito ("Maximum update
depth exceeded") — o efeito interno do `ListView` recalcula a seleção
com `.map()` a cada render, sem memoização, e qualquer alteração de
referência (mesmo com conteúdo igual) re-dispara o efeito indefinidamente.
Contornado com um updater funcional que só troca a referência quando o
conteúdo realmente muda; `ListView.tsx` em si não foi tocado (usado por
mais 5 outras telas) — landmine registrada em `docs/backlog.md` pra
quem for mexer nele de novo.
**Evidência:** frontend `tsc --noEmit` → 0 erros; `npm run build` → ok;
`eslint` no arquivo tocado → 3 problemas, idêntico à baseline (mesma
categoria já tolerada). Testado com navegador real + Postgres real:
lote de 13 encontros (jan-mar/2027) criado via API; filtro "Fevereiro de
2027" reduziu a lista a 4; "Selecionar" → checkbox "selecionar todos" →
"Selecionados: 4" → "Excluir selecionados" → diálogo estilizado (não
`alert()`) → confirmar → toast "Exclusão em massa concluída — Excluídos:
4" → lista (ainda filtrada por fevereiro) mostrou "Nenhum encontro
encontrado para esse filtro", confirmando que os 4 saíram de verdade, não
só mudaram de status; zero erro de loop infinito ou de console depois do
fix. Os 9 encontros de teste restantes (janeiro/março) excluídos via API
ao final; `GET .../occurrences` confirmou `total: 0`.

**Fase 4, Ciclo 2 de ajustes — itens #3 e #1 concluídos em 2026-11-16**
(plano completo com os 10 pontos e as 4 decisões do usuário em
`docs/terceiro-gestor-plano-de-desenvolvimento-modulos-atendimento-e-projetos.md`,
seção "Fase 4 — Ciclo 2 de ajustes").

**#3 — `MultiSelectBadges` (componente novo, reutilizável).** Não existia
no projeto nenhum combobox-com-busca-e-badge-removível (confirmado por
investigação — o mais próximo, `CompactMultiSelect`, não tem busca nem
remove pelo badge). Criado `frontend/src/web-client/ui/MultiSelectBadges.tsx`
sobre um novo primitivo `frontend/src/components/ui/popover.tsx`
(`radix-ui` já tinha `Popover` disponível, só faltava o wrapper no padrão
shadcn já usado pelos outros componentes de `components/ui/`). API:
`options`/`selectedValues`/`onChange`, mais rótulos customizáveis. Aplicado
em 2 lugares: seletor "Grupos" do formulário de Atividade
(substituindo a lista de checkbox do ciclo 1, que o usuário achou
"visualmente suja") e seletor "Grupos" do diálogo de Encontro (item novo

# 1 abaixo). **Evidência:** `tsc --noEmit` → 0 erros; `npm run build` → ok

`eslint` nos arquivos novos → 0 problemas; testado com navegador real
(popover abre, busca filtra, item vira badge, popover continua aberto pra
adicionar mais um, "x" no badge remove direto sem reabrir o popover) nos
dois formulários.

**#1 — `Meeting` N:N `PeopleGroup`.** Regra do usuário: um Encontro
"amplo" pode atender vários Grupos ao mesmo tempo (evento que junta todas
as turmas), não só 1. Schema: nova tabela `ActionOccurrencePeopleGroup`
(mesmo padrão de `ActionOccurrenceTeamGroup`, já existente pra Grupos de
equipe do Encontro), migration `20261116220000_add_meeting_people_group_n_n`
— `Meeting.peopleGroupId` (FK singular nullable) removido, com os dados
existentes migrados pra tabela nova no mesmo passo (migration única, sem
expandir/contrair, decisão já tomada no ciclo 1 pra esse tipo de mudança).
**Achado ao gerar a migration:** havia 51 linhas reais com
`peopleGroupId` preenchido em `ActionOccurrence` — resíduo de teste desta
mesma sessão (não dado de produção) na atividade "Ensaio dos meninos da
percussão"; migrados corretamente pra tabela nova e depois removidos via
limpeza (confirmado `count: 51` migrado, depois `0` após a limpeza).
**Bug pré-existente achado e corrigido no caminho:** `deleteActionOccurrence`
e `deleteProjectAction` excluíam o(s) Encontro(s) sem antes limpar
`ActionOccurrenceTeamGroup` — como essa FK já era `RESTRICT` (mesmo
padrão manual de "cascade" do resto do projeto), excluir um Encontro ou
uma Atividade com Grupos de equipe vinculado já falhava com erro de FK
*antes* desta sessão, só que nunca tinha sido exercitado por um teste
real. Corrigido nos dois métodos (limpa `ActionOccurrenceTeamGroup` e o
`ActionOccurrencePeopleGroup` novo antes de excluir o(s) Encontro(s)).
Backend: `CreateActionOccurrenceDto`/`UpdateActionOccurrenceDto`/
`BulkCreateActionOccurrencesDto` trocaram `peopleGroupId?` por
`peopleGroupIds?: string[]`; `createActionOccurrence`/
`bulkCreateActionOccurrences`/`updateActionOccurrence` passaram a validar
e persistir a lista (mesmo padrão de `teamPeopleGroupIds`, incluindo o
diff add/remove no update); `listProjectActionAttendances` (lista de
presença de um Encontro específico) agora agrega participantes de todos
os Grupos do Encontro (ou os da Atividade, se o Encontro não tiver Grupos
próprio) em vez de só 1; resposta de Encontro ganhou `peopleGroupIds`
(lista completa) mantendo `peopleGroupId`/`peopleGroup` (primeiro Grupos)
pros 1 ponto do frontend que só precisa de um nome pra rótulo compacto.
**Evidência:** `npx prisma migrate deploy` → aplicada sem erro;
`tsc --noEmit -p tsconfig.build.json` → 0 erros; `npm test` → 28
suítes/143 testes sem regressão; `npm run build` + `npm run build:seed` →
ok; `eslint` nos 5 arquivos tocados → 143 problemas vs. 139 medidos antes
deste item nesta mesma sessão (net +4, mesmas categorias já toleradas
`@typescript-eslint/no-unsafe-*`, nenhuma categoria nova — os 2
`no-unused-vars` do relatório são imports não tocados por este diff,
confirmado). Frontend: `ApiMeeting` ganhou `peopleGroupIds`/`peopleGroups`;
os 2 diálogos de Encontro (agendar em lote, editar 1) trocaram o
`<Select>` único por `MultiSelectBadges`; coluna "Grupos" da lista, card do
calendário e filtro de busca passaram a mostrar todos os Grupos (não só
o primeiro). `tsc --noEmit` → 0 erros; `npm run build` → ok; `eslint` → 3
problemas, idêntico à baseline (mesma categoria já tolerada). **Testado
de ponta a ponta contra Postgres real + navegador real:** criado 1
Encontro via API com 2 Grupos (C1M + C2M) → resposta confirmou os 2 em
`peopleGroupIds`; `GET .../attendances` desse Encontro devolveu 3 pessoas
— confirmado que vêm dos 2 Grupos (Renata Vieira é só de C2M; Ricardo
Nunes e Sabrina Melo são de C1M), provando a agregação N:N de verdade, não
só o primeiro Grupos. No navegador: diálogo "Agendar encontros" mostra
"+ Adicionar Grupos" → popover com busca → clicar em C1M vira badge e o
popover continua aberto mostrando só C2M/C3M (sem C1M, já selecionado) →
zero erro de console. Encontro de teste excluído via API ao final;
`GET .../occurrences` confirmou `total: 0` na atividade de teste.

**#2 — checkbox sempre visível na lista de Encontros, sem o toggle
"Selecionar".** Achado ao investigar: o `ListView` genérico já ignora
clique em checkbox/botão pra fins de "abrir a linha" (`shouldIgnoreRowClick`,
via seletor `button,a,input,...`) — ou seja, dava pra manter
`enableRowSelection` e `onRowClick` ligados ao mesmo tempo sem conflito,
sem precisar investigar/mexer no motor compartilhado. Removido o state
`selectionMode` e o botão "Selecionar"/"Cancelar seleção"; `enableRowSelection={!readOnly}`
fica sempre ativo (some de vez quando o usuário só pode ler) e a barra
"Selecionados: N — Excluir selecionados" aparece sozinha quando
`selectedRows.length > 0`, sem precisar de um modo dedicado.
**Evidência:** `tsc --noEmit` → 0 erros; `npm run build` → ok; `eslint` →
3 problemas, idêntico à baseline.

**#10 — ação "Registrar ocorrência" (placeholder) no header da
Atividade.** Achado ao investigar: o mecanismo genérico já existia
(`DetailLayoutConfig.header.actions`, tipo `DetailHeaderActionConfig[]`)
— é o mesmo que o People já usa pros botões "Ver ficha completa"/"Árvore
genealógica" no topo do detalhe da pessoa. Adicionado
`ACTIVITY_DETAIL_HEADER_ACTIONS` em `actions-detail-layout-contract.tsx`
com 1 entrada (`disabled: () => true`, tooltip "Em breve — Fase 5") — a
Fase 5 de verdade (modelo de dados, ciclo registrada→desfecho) continua
sendo trabalho à parte, ainda não desenhado; isso só reserva o lugar no
header pra validar a navegação. **Evidência:** `tsc --noEmit` → 0 erros;
`npm run build` → ok; `eslint` → 1 problema pré-existente e não
relacionado (efeito de `ActionProgressSection`, confirmado por linha/
contexto, nada a ver com este diff). Testado com navegador real: botão
aparece no canto superior direito do detalhe da Atividade, ao lado do
botão de recolher a barra lateral, visivelmente desabilitado, com
`title="Em breve — Fase 5"` já no DOM (confirmado via HTML capturado
pelo Playwright).

**#5 — Gestor/Educador reaproveitando papéis existentes + Plano
pedagógico + remoção de Participante/Direcionamento.** Decisão do
usuário: reaproveitar `ProjectActionPeopleParticipation` em vez de criar
schema novo — Gestor = atalho de 1 pessoa com papel `RESPONSAVEL_TECNICO`,
Educador/Executor = atalho de 1 pessoa com papel `FACILITADOR` (pra mais
de 1 pessoa por função, a aba "Equipe" continua existindo). Novo
componente `ActivityRolePicker` em `action-create-form-section.tsx` lê
via `listProjectActionPeopleParticipations` e grava via
`createProjectActionPeopleParticipation`/`endProjectActionPeopleParticipation`
(encerra a participação ativa anterior antes de criar a nova, pra manter
só 1 pessoa ativa por papel). Campo `description` (já existia) mantido;
campo novo `pedagogicalPlanHtml` (rich text) adicionado — schema
(`ProjectAction.pedagogicalPlanHtml String? @db.Text`), migration
`20261117140000_add_activity_pedagogical_plan`, DTOs
`CreateProjectActionDto`/`UpdateProjectActionDto`, serviço
(`normalizeHtml()`, mesmo padrão dos outros campos rich text do módulo).
Campos "Participante"/"Direcionamento" (ligados a
`targetEnrollmentId`/`ActionTarget.ENROLLMENT`) removidos do formulário
principal — tinham zero uso no seed e propósito não documentado; o tipo
`ENROLLMENT` como `ActionTarget` continua existindo no schema (só não é
mais editável por este formulário, nenhum dado existente foi afetado).
**Evidência:** `npx prisma migrate deploy` → aplicada sem erro; backend
`tsc --noEmit -p tsconfig.build.json` → 0 erros; frontend `tsc --noEmit` →
0 erros; `npm run build` → ok.

**#4/#6 — Formulário da Atividade reorganizado em seções + metadata
reordenada.** Título movido pro topo, campo único em destaque (texto
grande, borda inferior só, mesmo padrão visual já usado no formulário do
People). Resto do formulário dividido em seções com `SectionHeading`
(título + descrição opcional) e grid responsivo: "Organização" (projeto/
tipo/status), "Direcionamento" (Grupos de pessoas via `MultiSelectBadges`
e meta do Plano de Trabalho), "Equipe responsável" (Gestor/Educador, #5
acima), "Planejamento" (datas), "Descrição e plano pedagógico" (textarea
e rich text). `StandardDetailMetadataSide` da Atividade ganhou
`tabOrder={["tags","notes","attachments","comments","activity","history","context"]}`
— mesma ordem conceitual do People (tags/notas/anexos primeiro), mantendo
Comentários (decisão própria registrada no plano: é feature em uso, não
metadado estático como tags/notas, não faz sentido esconder). **Evidência:**
frontend `tsc --noEmit` → 0 erros; `npm run build` → ok; `eslint` nos 2
arquivos tocados (`action-create-form-section.tsx` +
`actions-detail-layout-contract.tsx`) → 4 problemas vs. 3 na baseline
(`git show HEAD:<arquivo>`), net +1 — o novo efeito de carregamento do
`ActivityRolePicker` (mesma categoria `react-hooks/set-state-in-effect`
já tolerada 3x nestes mesmos arquivos antes desta sessão, nenhuma
categoria nova). Testado com navegador real (Postgres real, atividade
"Encontro do segmento C2M"): Título em destaque no topo, seções visíveis
na ordem acima, "Plano pedagógico" renderiza o editor rich text vazio
(sem valor no seed, como esperado), zero erro de console/página.

**#7/#8.2 — Motor genérico de abas estendido (`mainTab`) + Progresso e
Relatório unificados.** `DetailLayoutConfig` ganhou `mainTab?: boolean |
{key,label}`; quando ligado, o `main` (formulário) deixa de ficar sempre
visível acima das `tabTemplates` e vira a primeira aba entre elas — mesmo
efeito visual do shell próprio do People (`Detalhes` como 1ª aba), sem
duplicar esse shell pela 3ª vez (`DetailShellEngine.tsx`: novo memo
`resolvedMainTab`, `tabsSlot`/`composedMainSlot` ajustados pra decidir
entre os 2 modos; mudança puramente aditiva — nenhum outro módulo seta
`mainTab`, então nenhum outro consumidor do motor é afetado). Atividade
ganhou `mainTab: true` com label "Detalhes". Abas "Progresso" (só
`completionPercent`) e "Relatório" (relatório de 1 Encontro selecionado)
unificadas numa aba só, "Progresso e Relatório" (mesmo componente, só
renderizado na mesma `tabTemplates` entry). **Evidência:** `tsc --noEmit`
→ 0 erros; `npm run build` → ok; `eslint` em `DetailShellEngine.tsx`/
`registry/types.ts` → 0 problemas. Testado com navegador real: abas da
Atividade na ordem exata esperada — `["Detalhes","Participantes",
"Encontros","Qualidade","Equipe","Progresso e Relatório"]` (capturado via
Playwright, `getByRole('tab').allTextContents()`), "Detalhes" já vem
selecionada por padrão, zero erro de console/página. **Observação:** o
motor genérico não foi exercitado só por esta mudança — a sessão também
confirmou (mesmo teste de navegador, módulo People) que as abas de People
continuam intactas: `["Detalhes","Participantes","Encontros","Qualidade",
"Equipe","Progresso e Relatório"]` é da Atividade; People tem seu próprio
shell (`PeopleDetailMain`) e não seta `mainTab`, então não foi tocado por
esta mudança — confirmado também por `tsc`/`build` completos do frontend
sem erro.

**#9 (parte A) — Presença inline na aba "Presença" do diálogo de
Encontro.** Decisão do usuário: dentro do diálogo de Encontro, uma aba
"Presença" com 1 linha por participante — presença, justificativa (só
relevante se faltou), observação e avaliação (nota de participação) —
tudo editável junto, salvo com 1 clique. Reaproveitados os 2 endpoints
que já existiam desde antes desta sessão (`GET`/`PUT .../attendances`,
usados até agora só pelas antigas abas "Participantes"/"Qualidade" da
Atividade) — nenhuma mudança de backend. Frontend: `EditOccurrenceDialog`
reestruturado com `Tabs` ("Detalhes"/"Presença"), erro + botões de ação
movidos pro `footer` fixo do `SectionDialog` (mesma convenção já
documentada no componente, usada por outros diálogos desta sessão).
Novo componente `MeetingAttendanceInlineTable`: carrega via
`listMeetingAttendances`, mantém um rascunho por `enrollmentId`
(`Record<string, AttendanceDraftRow>`) e só envia ao `upsertMeetingAttendances`
as linhas realmente alteradas (indicador visual de "não salvo" por
linha). **Evidência:** `tsc --noEmit` → 0 erros (backend e frontend);
`npm run build` (frontend) → ok; `eslint` no arquivo tocado → 4
problemas, mesma categoria (`react-hooks/set-state-in-effect`) já
presente 3x no arquivo antes desta mudança (confirmado rodando eslint na
versão do `HEAD` antes desta sessão) — nenhuma categoria nova; o único
aviso novo (`ATTENDANCE_STATUS_LABELS` importado sem uso) foi removido.
**Testado de ponta a ponta contra Postgres real + navegador real:**
login → Projeto Musica Manha → aba Atividades → 1ª atividade → aba
Encontros → 1º encontro → aba "Presença" → tabela mostrou o registro real
do seed (Renata Vieira, Presente, nota 5, observação do seed) → editada a
observação → "Salvar presença" → toast "Presença salva — 1 registro(s)
atualizado(s)" → valor persistiu após reload. **Dado de teste revertido
ao original do seed ao final** (mesmo cuidado do incidente de poluição de
dados registrado abaixo: a observação foi restaurada para
`"Participacao ativa no encontro do segmento."`, texto exato de
`prisma/seed.ts:1200`, confirmado via novo load mostrando o valor restaurado).

**#9 (parte B) — resumo agregado na aba "Participantes" da Atividade.**
A aba deixou de ser a tabela editável de presença por Encontro (essa
edição já vive na aba "Presença" do diálogo, parte A acima) e virou um
resumo só leitura, somando todos os Encontros da Atividade: frequência
(%), média de avaliação e contagem de ocorrências (placeholder fixo em 0
— só existe de verdade quando a Fase 5/Ocorrência for implementada), com
busca por nome/Grupos e filtro de período (De/Até). **Backend:** novo
endpoint `GET /projects/:projectId/actions/:actionId/attendances-summary`
(`ActionsController` → `ActionsService.listProjectActionAttendanceSummary`,
DTO `ListProjectActionAttendanceSummaryQueryDto` com `q`/`from`/`to`/
`page`/`limit`). Escopo de participantes elegíveis = mesma regra já usada
pelo resto do módulo (`action.peopleGroupIds`/`targetEnrollmentId`, sem
Grupos → todo mundo do projeto). Para cada participante: busca todos os
`Meeting` da Atividade dentro do período (exclui `CANCELED`), cruza com
`PeopleGroupParticipation` pra saber se a pessoa pertencia ao(s) Grupos(s)
daquele Encontro especificamente (um Encontro sem Grupos próprio conta pra
todo mundo), soma presenças/notas só dos Encontros em que a pessoa
contava como elegível. Tudo em memória (2-3 queries, sem agregação SQL) —
decisão deliberada dado o tamanho de dado esperado (uma Atividade não
passa de dezenas de participantes/Encontros); documentado aqui para não
ser confundido com descuido caso o volume cresça. **Frontend:** nova
função `listActionAttendanceSummary` + tipos `ActionAttendanceSummaryItem`/
`ActionAttendanceSummaryResponse`; aba "Participantes" reescrita em
`actions-detail-layout-contract.tsx` (`buildAttendanceSummaryColumns`/
`filterAttendanceSummaryRows` novos, variant `informational` em vez de
`operational` — sem seleção/ações em massa/botão salvar, é só leitura) +
2 `<Input type="date">` De/Até no `content` do tab. **Limpeza de código
morto no caminho** (TerceiroGestor já tem registrado em memória: não
deixar código sinalizado como "não usa mais", remover de verdade):
confirmado por grep em todo o frontend que `attendanceGroupId`/
`attendanceStatusFilter`/`attendanceDrafts`/`attendanceSaving`/
`attendanceNotesDialog`/`participantRows`/`getAttendanceEffective`/
`setAttendanceRowDraft`/`applyAttendanceStatusToRows`/`saveAttendanceDrafts`/
`applyAttendanceNotesDialog` (e seus `on*Change` correspondentes) só eram
consumidos pela extinta aba editável — removidos do tipo
`ActionsDetailLayoutContext`, do client page de edição e do stub do client
page de criação. **Confirmado que NÃO eram dead code os irmãos usados por
`project-action-attendances-card.tsx`** (`buildParticipantsColumns`,
`countDistinctAttendanceGroups`, `AttendanceNotesDialog`, etc. em
`action-operational-relations.tsx`) — card de nível de Projeto, consumidor
totalmente separado; nada ali foi tocado. **Bug real achado e corrigido
pelo próprio teste de navegador:** a 1ª versão do `loadAttendanceSummary`
não tinha proteção contra respostas fora de ordem — digitar "De" e depois
"Até" rapidamente dispara 2 requisições, e se a 1ª (só "De", sem "Até")
responder depois da 2ª (com os dois), ela sobrescrevia o resultado correto
com um intermediário errado (reproduzido de verdade: filtrar pra
janeiro/2026 mostrava "100% / 1 de 1 encontros" em vez de "— / Sem
encontros no período"). Corrigido com um `requestIdRef` que descarta
qualquer resposta que não seja mais a última disparada. **Evidência:**
backend `npx tsc --noEmit -p tsconfig.build.json` → 0 erros; `npm test` →
28 suítes/143 testes sem regressão; `eslint` no módulo `actions` inteiro
→ 161 problemas vs. 141 na baseline pré-sessão (`git show HEAD:<arquivo>`,
medida com todo o trabalho desta sessão revertido) — net +20, mesmas
categorias já toleradas (`no-unsafe-*`, estilo `any`-heavy do Prisma já
pervasivo no arquivo), nenhuma categoria nova. Frontend: `tsc --noEmit` →
0 erros; `npm run build` → ok; `eslint` nos 3 arquivos de client
page/contrato tocados → 7 problemas vs. 6 na baseline pré-sessão, net +1
(o novo efeito de `loadAttendanceSummary`, mesma categoria
`react-hooks/set-state-in-effect` já presente 5x nesses mesmos arquivos).
**Testado de ponta a ponta contra Postgres real + navegador real:** aba
"Participantes" da Atividade "Encontro do segmento C2M" mostrou Renata
Vieira com "100% / 1/1 encontros" e nota "5.0" (bate com o 1 Encontro e a
`MeetingAttendance` reais do seed); busca por "Renata" manteve a linha,
busca por texto inexistente zerou a lista (sem erro de console); filtro
"De 01/01/2026 Até 31/01/2026" (fora do mês do único Encontro, que é
março) mudou corretamente pra "— / Sem encontros no período" depois do
fix do race condition. Conferido que as abas "Qualidade"/"Equipe"/
"Progresso e Relatório" (que compartilham bastante estado com a antiga
aba "Participantes" removida) continuam funcionando sem erro de console
depois de toda a limpeza — "Qualidade" mostrou a mesma Renata Vieira com
nota 5, campo de observação, filtro de Grupos intacto.

**Achado e corrigido durante os testes destes 2 itens:** 2 das 3
atividades do seed ("Ensaio dos meninos da percussão" e "Acolhimento de
abertura") ficaram com Grupos extras (C2M/C3M) que não são do seed —
resíduo de testes anteriores desta mesma sessão que, via auto-save do
formulário (`editing: AUTO_SAVE_EDITING`, grava a cada campo sem precisar
de botão "Salvar"), gravaram cliques exploratórios de verdade no banco.
Achado ao comparar o HTML que o navegador mostrou contra o que
`prisma/seed.ts` realmente insere pra essas 2 atividades. Restaurado via
API ("Ensaio...", cujo tipo é `PEOPLE_GROUP` — `PATCH` com os
`peopleGroupIds` corretos funcionou normal) e via escrita direta no banco
pra "Acolhimento..." (cujo tipo é `PROJECT` — a API corretamente recusa
`peopleGroupIds` pra esse tipo, então a única forma de restaurar sem
contornar a regra de negócio foi recriar os 2 registros originais do seed
com os mesmos ids, do mesmo jeito que `prisma/seed.ts` já faz). Terceira
atividade do projeto ("Encontro do segmento C2M") e a atividade do outro
projeto ("Roda de conversa com famílias") conferidas e confirmadas
intocadas (datas de atualização batendo com o seed original). **Acolhimento
de abertura ter `ActivityPeopleGroup` apesar do tipo ser `PROJECT`** é uma
inconsistência que já existia no `prisma/seed.ts` antes desta sessão —
não é algo que esta sessão criou nem corrigiu (fora de escopo), só
restaurado ao estado em que já estava.

**Convenção de UI fixada em 2026-11-13, a pedido explícito do usuário —
seletor de colunas ("Colunas") por tipo de tela:**

- **ListView** (tela principal de um módulo — Pessoas, Grupos,
  Programas, Projetos, Ações, Tarefas, Admin, Pantry/Despensa): o botão
  "Colunas" fica **dentro do Painel Search**, na barra de busca, ao lado
  do botão de Filtros — nunca solto acima da tabela.
- **RelationView** (tabela de relação embutida numa aba de Detail — ex.:
  "Grupos"/"Participantes"/"Ações" dentro do Projeto — e
  diálogos de vínculo/picker como `ProjectPeopleGroupPickerDialog`/
  `BulkEnrollmentDialog`): o Painel Search é a **versão mínima** — só a
  barra de busca, pesquisando em qualquer coluna/valor (nome, número,
  o que for). **Sem seletor de colunas em nenhum lugar.**

Bug corrigido: o botão "Colunas" não aparecia em nenhum lugar em Pessoas/
Grupos, e aparecia solto acima da tabela (fora do Painel
Search) em Programas/Projetos/Ações — e o mesmo acontecia nas tabelas de
Relation, violando a regra acima. Causa raiz dupla: (1) `PageControlPanel`
não renderiza seus slots localmente — só registra as props num
`ControlPanelContext` que o `ControlPanelShell` (montado em outro ponto
do layout) lê e renderiza, então nenhum `ColumnVisibilityProvider` local
alcançava o botão da busca (afetava todo mundo); (2) `projects`/
`programs`/`actions` nunca passavam `columns` pro `EntityModuleShell`,
então o `ColumnVisibilityProvider` nem chegava a envolver a tela (o
`ListView` caía no botão flutuante próprio). Corrigido elevando o estado
de visibilidade pra dentro do `RecordListHost` (passado explícito pro
botão da busca, e como Provider controlado pro resto da árvore) e
adicionando `columns` nos ~6 módulos que não passavam; nas Relations e
diálogos de picker, `showColumnVisibilityButton={false}` explícito no
`ListView`/`TableView` em vez de deixar cair no padrão. Verificado com
browser real (Playwright + Chrome já instalado, sem baixar nada): botão
aparece dentro da busca nas 6 telas principais testadas (Pessoas, Grupos
de Pessoas, Programas, Projetos, Ações, Tarefas) e funciona (abre o menu,
esconde/mostra coluna, persiste); zero botão de coluna nas Relations e
diálogos testados (aba "Grupos" do Projeto, diálogo de
vincular Grupos, aba "Participantes"). `tsc` 0 erros; `eslint` 210
problemas vs. baseline 212, net -2 (apagado `person-picker-dialog.tsx`,
não usado em lugar nenhum); `npm run build` sucesso.

Branch: `develop` (mesclada em `main` em 2026-11-06 — ver AGENTS.md para o
fluxo atual de branches). Ponto de retorno: tag `v0-baseline` (commit
`962b91c`).

## Parte 1 — Limpeza (histórico, fechada na prática)

### Checklist

- [x] Tag `v0-baseline` criada e enviada para `origin`
- [x] Linha de base medida (evidência abaixo)
- [x] Teste manual de login (sem Docker, Postgres próprio do usuário) —
      feito em 2026-11-05. No caminho, achamos e corrigimos 2 bugs reais
      que bloqueavam qualquer subida local (ver commits `da39dee` e
      `0409986`):
      1. `prisma.config.ts` lia `backend/.env` em vez da raiz (só ele,
         diferente de todo o resto do projeto) — corrigido para seguir a
         mesma convenção.
      2. `prisma/seed.ts` tentava limpar o banco com uma lista de
         `deleteMany` manual que cobria só ~30 dos ~94 models; qualquer
         dado de Household/PeopleGroup criado pelo uso manual do app
         quebrava o reseed com erro de FK, silenciosamente (`node
         prisma/seed.js` saía com `exit 0` sem imprimir nada). Troquei
         por `TRUNCATE ... CASCADE` em todas as tabelas. `prisma/seed.js`
         também estava desatualizado (emails antigos) — recompilado.
      Login confirmado via `curl` em `/t/instituicao-exemplo/auth/login`
      com `admin@seed.local` → `201` com `accessToken`.
      **Falta:** clicar nos 9 módulos pela UI (só a API foi testada aqui,
      sem browser disponível neste ambiente)
- [x] Removidos `backend-start.err.log`, `backend-start.out.log`,
      `docker/test.txt`; `*.log` agora ignorado em qualquer profundidade
- [x] `START.ps1` movido para `scripts/windows/` (não era referenciado em
      nenhum doc). `docker.ps1` ficou no lugar — é citado em `README.md` e
      `DOCKER_README.md`, mover exigiria reescrever a documentação sem
      ganho real para o MVP
- [x] `.env.production` renomeado para `.env.production.example` (só tinha
      placeholders `${...}`)
- [x] `docs/gcp/` e os 4 `docs/marco-zero-1.0*` movidos para
      `docs/historico/` (sem referências externas quebradas, confirmado por
      grep)
- [x] Removidas as 11 pastas sem uso de `frontend/src/features` (activities,
      addresses, assessments, attendances, diaries, formations, groups,
      incomes, occurrences, presences, school-histories) — 0 imports
      externos confirmados antes da remoção; `tsc` e `build` passam igual
- [x] `npm run format` no backend num commit isolado (1143 erros de
      prettier resolvidos, lógica inalterada: tsc + 15 suítes continuam
      verdes antes e depois)
- [x] `tsconfig.build.json` do backend **já excluía `test/`** (linha
      `"exclude": [..., "test", ...]`) — o erro TS6059 do plano não se
      reproduziu. Nenhuma mudança necessária
- [x] Criado `docs/backlog.md`
- [x] `CLAUDE.md`/`AGENTS.md` criados com as regras do projeto
- [x] `README.md` reescrito só com o necessário para rodar localmente
      (a versão anterior descrevia MySQL e scripts `.ps1` que não existem
      mais no repositório)

### Checkpoint completo (2026-11-05, fim da sessão)

```bash
backend: tsc --noEmit -p tsconfig.build.json → 0 erros
backend: npm test                            → 15 suites, 18 testes, ok
frontend: tsc --noEmit                       → 0 erros
frontend: npm run build                      → ok
```

**Único item aberto da Parte 1:** o teste manual de login + 9 módulos.
Não deu para rodar nesta sessão (sem Docker no PATH deste ambiente e sem
`.env` configurado, logo sem Postgres acessível). Rode na sua máquina:

```powershell
Copy-Item .env.example .env
# editar POSTGRES_PASSWORD, JWT_SECRET, PII_MASTER_KEY, TOTP_ENCRYPTION_KEY
.\docker.ps1 up -Environment dev
cd backend; npm run start:dev
cd ..\frontend; npm run dev
```

Depois de confirmar login e os 9 módulos (people, deposit, pantry,
actions, tasks, projects, programs, people-segments, people-groups) sem
quebrar nada, marque o item acima e crie a tag `v0.1-limpo` em `develop`.
`main` já recebeu todo o trabalho da Parte 1 e dos itens 1-3 da auditoria
de riscos num merge único em 2026-11-06 — o fluxo normal daqui pra frente
é `develop` → `main`, sem branch por item (ver AGENTS.md).

### Linha de base (medida em 2026-11-05, Windows, node v26.1.0 — fora da

faixa `>=22 <23` dos dois `package.json`, ver `docs/backlog.md`)

**Backend**

```
npm ci                                    → ok (832 pkgs, 41 vulnerabilidades: 3 low/22 moderate/14 high/2 critical)
npx prisma generate                       → ok (client v7.7.0)
npx tsc --noEmit -p tsconfig.build.json   → 0 erros
npm test                                  → 15 suites, 18 testes, todos passando
npx eslint "src/**/*.ts" (sem --fix)      → 1614 problemas antes do format (1145 prettier,
                                             170 no-unsafe-assignment, 133 no-unsafe-member-access,
                                             80 no-unsafe-return, 20 no-unsafe-call, 17 no-empty-object-type,
                                             15 no-unnecessary-type-assertion, 14 no-unsafe-argument,
                                             11 no-unused-vars, 7 no-base-to-string, 2 outros)
                                             → 469 problemas (454 erros, 15 avisos) depois do
                                             commit de formatação. Resto vai para a Parte 2
```

**Frontend**

```
npm ci              → ok (561 pkgs, 27 vulnerabilidades: 1 low/10 moderate/15 high/1 critical;
                      aviso EBADENGINE: node v26 vs engines >=22 <23)
npx tsc --noEmit    → 0 erros
npx eslint src      → 0 problemas
npm run build       → ok, inclui `ƒ Proxy (Middleware)` nas rotas — indício de que
                      `middleware.ts` na raiz **é** compilado/incluído mesmo com o app em
                      `src/app`. Não prova execução em runtime: confirmar com log na Parte 2
                      (achado #8 do plano)
```

**Observação sobre o achado #10 do plano:** a medição original de 8.083
problemas de lint no backend foi feita sem o client do Prisma gerado (tudo
virava `any`, cascata de `no-unsafe-*`). Com o client gerado, a linha de
base real é 1614 (1145 de prettier). Depois do commit de formatação: 469.

## Tags desta parte

- `v0-baseline` — ponto de partida, antes de qualquer mudança
- `v0.1-limpo` — ainda não criada. Falta só o teste manual de login + 9
  módulos pela UI (ver "Estado real" no topo) — na prática o trabalho já
  avançou para a Parte 2/3 sem essa tag, registrado aqui como desvio do
  processo, não como pendência bloqueante.

## Próxima parte

Partes 2 e 3 fechadas em 2026-11-11 (ver "Estado real" no topo) — só
restam itens adiados de propósito (dívida de lint, 3.5 operacional).
Ainda faltam criar as tags `v0.2-verde` e `v0.3-seguro` (não criadas
nesta sessão — tag é uma decisão do usuário). Parte 4 (Railway/
Cloudflare/R2) é a próxima, e só começa quando o projeto Railway
existir. Detalhe item a item da Parte 3: `docs/auditoria-riscos.md`.
Itens adiados com gatilho: `docs/backlog.md`.
