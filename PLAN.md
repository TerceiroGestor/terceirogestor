# PLAN.md — Terceiro Gestor

Só o que está em andamento. Plano completo: `docs/Terceiro Gestor — Plano de
Revisão e Produção.md`. Regras do projeto: `AGENTS.md`. Auditoria de riscos
(Parte 3 detalhada, tarefa por tarefa): `docs/auditoria-riscos.md`.

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
