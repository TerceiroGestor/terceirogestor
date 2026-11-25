# Frontend — infraestrutura de UI reutilizável (`frontend/src/web-client/`)

*Última revisão: 2026-11-25. Escopo: `frontend/src/web-client/` +
`frontend/src/components/` (camada abaixo). Pré-requisito: skim de
`docs/canonical-web-client-standard.md` — este documento usa o mesmo
vocabulário (List Principal, Detail, `headSlot`/`detailSlot`/`sideSlot`/
`relationSlot`, typeviews, `mainTab`/`tabTemplates`).*

`web-client/` é a infraestrutura genérica de tela — **não conhece nenhum
módulo de negócio** (regra do `AGENTS.md`). Se o bug está num mecanismo
compartilhado (lista não atualiza, Detail trava em "Salvando...",
seleção em loop infinito, filtro não aparece), o arquivo culpado quase
certo está aqui, não dentro do módulo.

## A regra "não importa de modules/" tem uma exceção documentada e contida

As pastas de **mecanismo** (`control-panel/`, `detail/` — exceto o
renderizador legado —, `domain/`, `filtering/`, `forms/`, `record/`,
`relation/`, `screen/`, `search/`, `ui/`, `views/`, e as partes
genéricas de `starter/`/`registry/`) têm zero import de `@/modules/*`
(confirmado por grep).

A exceção é exatamente a **costura de composição**, por design:
- `registry/actions/*.tsx` e `registry/searchViews/*.tsx` — importam as
  páginas/contratos/constantes de cada módulo pra registrá-las como
  `WindowAction`/`SearchViewDefinition`.
- `data-provider/rest/*.ts` — importam as funções REST de `api/` de
  cada módulo pra plugá-las no switch genérico do `DataProvider`.
- `starter/module-standard-smoke.ts` — importa contratos de todos os
  módulos pra uma checagem estrutural cross-module.

Isso é a forma intencional (módulos se registram no registry/
data-provider de `web-client`, nada na camada genérica de renderização
volta pra dentro de `modules/`) — não é violação da regra, não "arrumar"
esses imports achando que são bug.

## `control-panel/` — barra de ferramentas da List Principal

Renderiza a barra única compartilhada por toda tela de lista
(`ControlPanelShell`) e o vocabulário de busca/filtro (`SearchBar`,
`SearchPanelMenu`, `AdvancedFilterBuilder`), também usado dentro de
`RelationListHost`.

- `ControlPanelShell.tsx` — grid de 3 colunas (busca→typeview→Novo)
  sobre `bg-toolbar`; lê tudo de `ControlPanelContext`.
- `ControlPanelContext.tsx` — contexto onde a tela de lista escreve
  seus slots (`searchSlot`, `filterSlot`, `primaryAction` etc.).
- `SearchBar.tsx` — input de busca + chips de filtro/agrupamento.
- `SearchPanelMenu.tsx` — menu Colunas/Filtros/Agrupar, construído sobre
  `AdvancedFilterBuilder.tsx` e `Domain` (de `domain/`).
- `queryFacets.tsx` — transforma `Domain`/`groupBy` ativo em labels de
  chip exibidos na `SearchBar`.
- `favorites-storage.ts` / `FavoritesMenu.tsx` — snapshots de busca
  salva.
- `ViewSwitcher.tsx` — wrapper fino de
  `components/record-browser/RecordBrowserViewSwitcher.tsx` (seletor de
  typeview: Tabela/Kanban/Timeline/Calendário/Gantt/Gráfico).

**Código aparentemente morto** (zero importador em todo `src/`, grep
confirmado — vale confirmar e mover pro `docs/backlog.md`):
`FilterMenu.tsx`, `CreateDropdown.tsx`; `FavoritesMenu.tsx` também sem
referência fora do próprio arquivo.

**Como um módulo se conecta:** uma `*-list-module-client-page.tsx`
escreve seu estado de busca/filtro/grupo no `ControlPanelContext` e
renderiza `RecordListHost` (ver `record/`) — nunca monta sua própria
barra.

## `data-provider/` (+ `rest/`) — o único portão REST

Interface genérica `DataProvider` (`search`/`read`/`create`/`update`/
`delete`) que toda tela de lista/detail chama por um `model` string,
desacoplando `ListView`/`DetailShellEngine` de qualquer formato
específico de endpoint.

- `types.ts` — contrato `DataProvider`/`SearchArgs`/`SearchResult`.
  `SearchArgs.all?: boolean` é a flag por trás da regra "Dados completos
  para análise" do documento canônico (buscar tudo pra Gráfico/Kanban/
  Timeline/Calendário/Gantt/`groupBy`, paginar só a Tabela no cliente).
- `rest/provider.ts` — o `switch (model)` grande que roteia
  `"people.list"`, `"projects.detail"`, `"pantry.items.audit"` etc. pra
  função por módulo. **Este arquivo (e os irmãos em `rest/`) é o lugar
  legítimo onde `web-client` importa `@/modules/*/api`** — ver exceção
  acima.
- `rest/{people,projects,programs,occurrences,attendances,people-groups,
  tasks,actions}.ts` — um adaptador por módulo, traduz `SearchArgs`/
  `Domain` pra assinatura REST daquele módulo.
- `filtering/advanced-filters.ts` — tipo `AdvancedFilter`, formato de
  fio que esses adaptadores (e vários `modules/*/api/*.ts` direto)
  serializam a partir de condições `Domain` antes de chamar o backend.

**Fluxo:** `ListView`/`DetailShellEngine` → `*-list-module-client-page.tsx`/
`*-detail-engine-client-page.tsx` do módulo → `DataProvider.search/read/
create/update/delete(model, args)` → switch de `rest/provider.ts` →
adaptador `rest/*.ts` do módulo → chamada REST do `api/` do módulo →
backend. Os adaptadores também traduzem o DTO de volta pro formato que
`ListView`/`DetailShellEngine` esperam.

## `detail/` — motor da tela de Detail, autosave, auditoria, relation legada

Tudo que compõe a tela de Detail de um módulo (`headSlot`/`detailSlot`/
`sideSlot`/`relationSlot`) sobre o shell visual real
(`frontend/src/components/layout/DetailShell.tsx`).

- `DetailShellEngine.tsx` — lê o `DetailLayoutConfig` do módulo
  (`registry/types.ts`) e resolve `headerSlot`/`mainSlot`/`sideSlot`/
  `bottomSlot`/`tabsSlot`, entregando a `components/layout/DetailShell.tsx`.
  É aqui que `mainTab` é interpretado: `layout.mainTab` (booleano ou
  `{key,label,icon}`) faz o formulário (`mainSlot`) virar a primeira
  entrada de `tabTemplates` em vez de conteúdo sempre-visível acima das
  abas.
- `DetailLayoutSections.tsx` — `DetailTabsRenderer` (renderiza
  `tabTemplates`, aplica o estilo `gap-0`/`rounded-none`/divisor azul/
  `bg-toolbar` do padrão canônico) e `DetailHeaderActionsRenderer`.
  Contém também o caminho **legado** de relation:
  `DetailRelationsRenderer`/`DetailRelationSection`, dirigido por
  `DetailRelationConfig` (`tabTemplates[].relations`/`bottomRelations`)
  — mecanismo pré-`RelationListHost`, ainda em uso por Occurrences
  ("Envolvidos") e Attendances ("Pessoas") (ver `docs/backlog.md`).
- **`useDetailAutoSaveController.ts` — o motor de autosave, e o footgun
  documentado localizado com precisão:** `commitField` (linhas ~187-202)
  monta `nextDraft` espalhando o **draft atual inteiro**
  (`{ ...currentDraft, [field]: nextValue }`) e passa esse objeto
  completo pra `commitDraft` → `commitDraftAsync` → `onSave(normalizedDraft)`
  (linha ~131). **Toda edição de um único campo reenvia o rascunho
  inteiro, não um diff por campo** — a responsabilidade de diff é
  inteiramente de quem implementa `onSave` no módulo. É a mesma causa
  raiz do item "Projects preso em Salvando..." do `docs/backlog.md`, que
  aponta pra este hook + a cadeia `ProjectsDetailMain`/
  `projects-detail-engine-client-page.tsx`. Há também uma fila de
  requisição (`queuedDraftRef`, `savingRef`) que reenvia o **último**
  draft em fila (ainda o objeto completo) quando um save ou uma
  suspensão de autosave de mídia (`detail-media-autosave-guard.ts`)
  libera.
- `StandardDetailMetadataSide.tsx` — o `sideSlot` de 4 abas (Tags/Notas/
  Anexos/Auditoria), com o fallback documentado pras abas legadas
  (Histórico/Contexto) quando `tags`/`notes`/`attachments` não são
  passados.
- `DetailSideTabs.tsx` — renderiza essas abas laterais (**não** recebe
  os 3 reforços visuais extras que as abas principais de
  `DetailTabsRenderer` recebem, conforme o documento canônico).
- `DetailRelationTablePanel.tsx` — o painel canônico "sem view
  alternativa": mantém seu próprio estado de `query`/`domain`/`groupBy`,
  filtra `data` no cliente e renderiza `RelationListHost flushToolbar`
  envolvendo um `ListView` com `stickyHeaderOffsetPx={117}`,
  `bordered={false}`.
- `useDetailAuditFeed.ts` / `DetailAuditFeed.tsx` / `audit-feed-utils.ts`
  / `audit-types.ts` — dados e renderização da aba Auditoria.
- `DetailCommentsPanel.tsx`, `DetailNotesPanel.tsx`, `DetailTagsField.tsx`,
  `DetailIdentityMediaField.tsx`, `DetailFormSection.tsx`,
  `DetailFormSteps.tsx`, `DetailRelationItemDialog.tsx`,
  `DetailRelationRecordView.tsx` — blocos menores usados pelo painel
  lateral / renderizador legado de relation / formulários.
- `detail-media-autosave-guard.ts` — flag global de suspensão + evento
  de `window` (`detail:media-autosave-suspension-change`) pra um upload
  de mídia pausar o autosave no meio de uma edição sem o hook precisar
  saber de upload.

**Como um módulo se conecta:** uma `*-detail-layout-contract.tsx`
exporta um `DetailLayoutConfig<TContext>` (header/main/side/
tabTemplates/mainTab/auditSources/metadata), consumido por
`DetailShellEngine` via `moduleDefinition.detailLayout` (declarado no
`RecordModuleDefinition` de `registry/types.ts`). `defineRecordModule`
lança erro se um módulo declarar view `"detail"` sem `detailLayout` —
exatamente o bug que `relation-module-starter.tsx` precisou contornar
(ver `starter/` abaixo).

## `domain/` — a AST de filtro `Domain`

Representação serializável em árvore booleana (`DomainCondition`/
`DomainGroup`/`DomainNot`) que `SearchPanelMenu`, `AdvancedFilterBuilder`,
`RelationListHost` e `DetailRelationTablePanel` compartilham como estado
de filtro.

- `types.ts` — tipos `Domain`/`DomainNode`/`DomainOperator`.
- `conditions.ts` — helpers como `removeConditionAtIndex` (usado pelo
  "x" do chip de filtro do `RelationListHost`).
- `evaluate.ts` — `matchesDomainRecord`, avaliador client-side que
  `DetailRelationTablePanel` usa pra filtrar linhas de relation em
  memória contra o `Domain` ativo.
- `serialize.ts` — Domain ⇄ formato de fio.

Pura lógica de filtro, sem conhecimento de módulo nenhum.

## `filtering/` — ponte de formato de fio pro backend

Arquivo único (`advanced-filters.ts`, tipo `AdvancedFilter`) que tanto
os adaptadores `data-provider/rest/*` quanto vários `modules/*/api/*.ts`
usam pra traduzir uma condição `Domain` no formato `{columnId, operator,
value}` que o parâmetro de filtro REST do backend espera.

## `forms/` — "mesmo formulário pra criar e editar"

`RecordForm` é o renderizador genérico de formulário guiado por campo,
referenciado pelo documento canônico quando diz "novo e edição usam o
mesmo formulário, só ramifica o que é genuinamente diferente via
`mode`".

- `RecordForm.tsx` — componente de topo; itera `FormField[]` e renderiza
  via `FieldRenderer`.
- `field-renderers.tsx` — widget por tipo de campo (texto, booleano,
  multiselect, tags, intervalo de data, intervalo numérico, arquivo/
  imagem etc.) — "a capacidade genérica" que o documento canônico pede
  pra preferir sobre um renderizador de formulário próprio/legado.
- `types.ts` — contratos `FormField<TValues>`/`RecordFormProps`.

## `record/` — host da List Principal

`RecordListHost` é o componente único que toda tela de lista de módulo
renderiza — dono do wrapper de altura de viewport (que faz o cabeçalho
sticky da tabela funcionar de fato), conecta `ControlPanelContext`, o
seletor de view e `ColumnVisibilityProvider`/`ColumnVisibilityMenu` (de
`views/ListView.tsx`).

**Como um módulo se conecta:** uma `*-list-module-client-page.tsx`
mantém o estado de query (`searchText`/`domain`/`groupBy`/paginação),
chama o `DataProvider` com `all: true` quando qualquer typeview
analítica ou `groupBy` está ativo (regra de 2026-11-24 do documento
canônico — referência:
`frontend/src/modules/projects/features/list/ui/projects-list-module-client-page.tsx`),
corta só a página da Tabela no cliente, e renderiza `RecordListHost` com
a typeview atual como `children`.

## `registry/` (+ `actions/`, `searchViews/`) — contratos de registro de módulo

O sistema de tipos genérico que todo contrato de módulo de domínio
segue, mais a raiz de composição que transforma a config de cada módulo
em `WindowAction`s/`SearchViewDefinition`s roteáveis. É o único lugar
onde `web-client` tem permissão de conhecer `modules/` (ver exceção
acima).

- `types.ts` (grande, ~30KB) — define `RecordModuleDefinition`,
  `DetailLayoutConfig`, `DetailTabTemplate` (incl. `flushContent`),
  `DetailRelationConfig`/`DetailOperationalRelationConfig` (forma legada
  de config de relation), `ViewConfig`, `ModuleFeatureFlagMap`,
  `ModulePermissionMap` etc., e `defineRecordModule()` — a factory que
  todo contrato de módulo chama, que lança erro se `views` incluir
  `"detail"` sem `detailLayout` (~linha 1028-1031).
- `module-utils.ts` — helpers de checagem de permissão
  (`hasModulePermission`, `hasPermissionRequirement`) e getters de
  label/texto usados por `RecordListHost`/`DetailShellEngine`.
- `index.ts` — arrays `WINDOW_ACTIONS`/`SEARCH_VIEWS` montados a partir
  de cada `registry/actions/*.tsx` + `registry/searchViews/*.ts`; expõe
  `getWindowAction(actionId)`/`getSearchView(id)` — é isso que
  `screen/ScreenHost.tsx` resolve contra o `actionId` de uma rota.
- `actions/*.tsx` — um arquivo por módulo (`people.tsx`, `projects.tsx`,
  `pantry.tsx`, `deposit.tsx`, `meetings.tsx`, `admin.tsx`...), cada um
  importando os componentes concretos de lista/detail/criação daquele
  módulo e envolvendo-os como `WindowAction`s (às vezes mais granular —
  ex.: `pantry.tsx` tem actions separadas pra stock/donor/entry/exit).
- `searchViews/*.ts` — um arquivo por módulo, exportando a(s)
  `SearchViewDefinition`(s) (campos, operadores, opções de `groupBy`)
  que dirigem o `SearchPanelMenu` daquele módulo.
- `view-icons.tsx` — lookup de ícone pra `ViewConfig.icon`.
- `window-actions.tsx` — helpers `createModuleWindowAction`,
  `resolveModuleWindowActionTitle`, `resolveWindowActionPermissionRequirement`
  usados por todo `registry/actions/*.tsx`.

**Como um módulo se conecta:** um `*-module-contract.tsx` constrói um
`RecordModuleDefinition` via `defineRecordModule`/helpers de `starter/`,
fornecendo `queryAdapters` (quais `model` strings chamar no
`DataProvider`), `searchConfig`, `views`, `detailLayout`, `actions`,
`permissions`. `registry/actions/<modulo>.tsx` então importa esse
contrato + os componentes de página do módulo e os registra como
`WindowAction`s.

## `relation/` — a relation canônica

`RelationListHost` é o componente único por trás de toda aba de relation
no rodapé de um Detail (e, via `DetailRelationTablePanel`, as relations
"só tabela" mais simples). Renderiza busca + Colunas/Filtros + Novo, na
ordem documentada (busca → slot de typeview → Novo), com a variante
`flushToolbar` usada só quando a relation é o conteúdo inteiro da aba
(referência: Encontros da Atividade).

- `RelationListHost.tsx` — props notáveis: `columns` (habilita o botão
  Colunas + sincronia `ColumnVisibilityProvider`/`ColumnVisibilityMenu`
  de `views/ListView.tsx`), `filterFields`/`buildSearchRecord` (habilita
  o menu Filtros via `SearchViewDefinition` sintetizada), `flushToolbar`
  (sticky, sangra até a borda, sem `rounded-lg`), `addHref`/`onAdd`
  (único botão "Novo" — criação via diálogo, regra "criar dentro de uma
  relation" do documento canônico).

Relação com `detail/DetailRelationTablePanel.tsx`: esse componente é um
wrapper fino e autocontido de `RelationListHost` + `ListView` pra
relations que não precisam de view alternativa (calendário/kanban etc.)
— um módulo só deve usar `RelationListHost` direto quando precisar de
algo que `DetailRelationTablePanel` não dá de graça (ex.: calendário dos
Encontros).

Contraparte legada: `DetailRelationConfig`/`DetailRelationsRenderer`
(ver `detail/DetailLayoutSections.tsx` acima) — ainda usado por
Occurrences/Attendances (`docs/backlog.md`); sendo migrado módulo a
módulo, não usar pra relation nova.

## `screen/` — dispatcher de rota pro registry + estado de URL

- `ScreenHost.tsx` — dado um `actionId`, resolve via
  `registry/index.ts#getWindowAction`, checa auth (`useRequireAuth`) e
  permissão, renderiza o breadcrumb
  (`components/layout/PageBreadcrumb.tsx`) a menos que
  `action.hideBreadcrumb` ou a view padrão da action seja `"detail"`,
  depois chama `action.render()`. Toda `page.tsx` de rota de módulo é um
  wrapper fino que chama `<ScreenHost actionId="..."/>`.
- `usePersistedUrlState.tsx` / `useModuleQueryState.tsx` — sincronizam o
  estado de query de lista de um módulo (`searchText`/`domain`/
  `groupBy`/paginação/view) com a URL e `localStorage`, pra filtro/
  typeview sobreviver a navegação/reload.

## `search/` — contrato de search view

Tipo único (`types.ts`: `SearchFieldDefinition`/`SearchViewDefinition`/
`SearchViewFeatureConfig`) — a forma que todo `registry/searchViews/*.ts`
e toda config de filtro ad hoc de `RelationListHost`/
`DetailRelationTablePanel` segue. Sem lógica, só contrato.

## `starter/` — factories de definição de módulo

- `record-module-starter.tsx` — `createStandardListQueryState`/
  `createStandardDetailQueryState`, `createStandardListView`/
  `createStandardDetailView`, `createStandardFeatureFlags`,
  `STANDARD_LIST_SUPPORT`/`STANDARD_DETAIL_SUPPORT` — padrões de um
  módulo canônico.
- **`relation-module-starter.tsx`** — `defineRelationDetailModule`,
  usado por sub-entidades simples que só precisam de um Detail (ex.: um
  Encontro, um Benefício). **Contém o workaround documentado
  `detailLayout: {}`** (comentário explica): a validação de
  `defineRecordModule` lança erro quando uma view `"detail"` é
  declarada sem `detailLayout`, então esta factory passa um objeto
  vazio já que o render sempre cai em `fallbackMainSlot`/
  `fallbackSideSlot`. Esse bug quebrava
  `/people/[id]/education/new` e as sub-telas de Evolução/Benefício do
  Atendimento até essa correção (ver `docs/backlog.md`).
- `module-standard-smoke.ts` — importa o contrato de todo módulo
  canônico e roda uma checagem estrutural cruzada (um dos poucos
  imports diretos legítimos de `@/modules/*`).
- `index.ts` — barrel das duas factories.

## `ui/` — primitivas pequenas compartilhadas

- `ModulePrimitives.tsx` — `ModuleSurface`, `ModuleSectionHeader`,
  `ModuleEmptyState`, e as constantes de estilo de aba referenciadas no
  documento canônico: `MODULE_TABS_LIST_CLASS_NAME`/
  `MODULE_TAB_TRIGGER_CLASS_NAME` (toda aba de Detail, principal ou
  lateral, deve usar essas classes).
- `PaginationBar.tsx` — paginador client-side da typeview Tabela.
- `ModuleMetricsStrip.tsx`, `CompactMultiSelect.tsx`,
  `DateRangeFilterButton.tsx`, `MultiSelectBadges.tsx`,
  `TruncatedTextCell.tsx` — widgets compostos menores (inputs de
  filtro, célula de tabela truncada, tiras de métrica).

## `views/` (+ `GraphView/`) — renderizadores de typeview

O conjunto fixo de typeviews que o documento canônico permite (Tabela/
Kanban/Timeline/Calendário/Gantt/Gráfico) mais o motor de tabela
compartilhado.

- **`ListView.tsx`** (maior arquivo, ~47KB) — motor baseado em
  TanStack Table por trás tanto da Tabela da List Principal quanto do
  corpo de tabela de todo `RelationListHost`/`DetailRelationTablePanel`.
  Expõe `ColumnVisibilityProvider`/`ColumnVisibilityMenu`,
  `readStoredColumnVisibility`/`writeStoredColumnVisibility`, fixação de
  coluna, `bordered`, `stickyHeaderOffsetPx`.
  **Bug de seleção em loop, localizado com precisão** (linhas ~851-856):
  ```
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  React.useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(selectedRows);
  }, [onSelectionChange, selectedRows]);
  ```
  `selectedRows` é um array novo (referência nova) em todo render
  (`.map()`, sem memoização) — então o efeito dispara em qualquer
  re-render do componente; se um consumidor passar
  `onSelectionChange={setSelectedRows}` direto, isso vira "Maximum
  update depth exceeded". Ainda não corrigido no `ListView.tsx` em si
  (compartilhado por 6+ consumidores) — `action-occurrences-section.tsx`
  contorna com um updater funcional que compara conteúdo antes de
  trocar a referência. Outros consumidores que precisam se proteger
  igual: `project-enrollments-card.tsx`, `pantry-donors-module-client-page.tsx`,
  entre outros (ver `docs/backlog.md`).
- `TableView.tsx` — wrapper fino de Tabela sobre `ListView`.
- `KanbanView.tsx`, `CalendarView.tsx`, `TimelineView.tsx`,
  `GanttView.tsx` (maior depois de ListView, ~44KB),
  `GroupedListView.tsx`, `FormView.tsx` — as outras typeviews canônicas;
  todas consomem o dataset filtrado **completo** (nunca a página
  paginada), conforme a regra "Dados completos para análise".
- `GraphView/GraphView.tsx`, `GraphBuilderControls.tsx`,
  `graph-builder.ts`, `types.ts`, `charts/` — a typeview Gráfico, com
  estado próprio de builder (campos de agrupamento, tipo de gráfico)
  serializado de/para parâmetros de URL.

## `frontend/src/components/` — camada abaixo: primitivas shadcn + shell do app

**Complementar, não concorrente** a `web-client/` — uma camada abaixo:

- `components/ui/` — primitivas shadcn cruas (`button.tsx`, `dialog.tsx`,
  `table.tsx`, `tabs.tsx`...) que os componentes de mais alto nível de
  `web-client/` (`ListView`, `RelationListHost`, `DetailShellEngine`)
  compõem. Nota do documento canônico: o `overflow-x-auto` próprio de
  `components/ui/table.tsx` foi a causa raiz do bug de cabeçalho sticky
  corrigido em 2026-11-20 — removido porque `table.tsx` só é usado via
  `ListView.tsx`.
- **`components/layout/`** — o chrome real do app: `AppShell.tsx`,
  `AppHeader.tsx`, `AppProviders.tsx`, `BreadcrumbContext.tsx`,
  `PageBreadcrumb.tsx`, `PageHeader.tsx`, e **`DetailShell.tsx`** — o
  host visual real que `web-client/detail/DetailShellEngine.tsx`
  renderiza (slots header/main/side/bottom, o `SplitView` redimensionável
  do `sideSlot`, o cabeçalho sticky sobre `bg-toolbar`). Carrega peso
  real pra todo módulo.
- `components/Sidebar/` — shell de navegação global (`AppSidebar.tsx` +
  `nav/`), carrega peso pra todo o app, independente de módulo.
- `components/record-browser/` — `RecordBrowserViewSwitcher.tsx` (a UI
  real do seletor de typeview) e `RecordBrowserToolbar.tsx`, consumidos
  por `web-client/control-panel/ViewSwitcher.tsx`,
  `web-client/record/RecordListHost.tsx` e
  `web-client/relation/RelationListHost.tsx`.
- `components/FilterEngine/` (`FilterEngine.tsx`, `FilterDrawer.tsx`,
  `FilterPanel.tsx`) — UI de filtro **mais antiga/separada**, ainda
  usada por `lib/filters/use-filter-engine.ts` e
  `modules/core/features/audit/ui/audit-timeline-page.tsx`, mas **não**
  é o que a List Principal/relations usam hoje (isso é
  `web-client/control-panel/AdvancedFilterBuilder.tsx` +
  `SearchPanelMenu.tsx`, sobre `domain/Domain`). Tratar como mecanismo
  distinto e mais estreito (timeline de auditoria especificamente), não
  como implementação alternativa do menu de filtro canônico.
- `components/confirm/` — `use-confirm.tsx`, hook de diálogo de
  confirmação compartilhado (ex.: ação "Excluir" canônica do header).
- `components/UsageDocumentation/` — sistema de ajuda/tooltip contextual
  in-app, agnóstico de módulo.
- `components/pwa/PwaServiceWorker.tsx` — registro de service worker;
  marcado em `docs/backlog.md` como candidato (não confirmado) à causa
  do relato "preso em Carregando dashboard após login", já que um SW
  antigo de uma sessão `next dev` pode interceptar fetches de navegação
  RSC sob `next start`.

**Duas exceções que carregam peso real** e valem lembrar ao investigar
um bug: `components/layout/DetailShell.tsx` (o shell visual real sob
`DetailShellEngine`) e `components/record-browser/RecordBrowserViewSwitcher.tsx`
(o seletor de typeview real sob `ControlPanelShell`/`RelationListHost`)
— um relato de "seletor de typeview não mostra Gantt" ou "painel lateral
não redimensiona" vai levar pra `components/`, não pra `web-client/`.
