# Changelog - UI Framework (padrao Odoo)

Este documento define o **changelog/roadmap oficial** para implementar um "Web Client" inspirado no Odoo, com foco em **componentizacao**, **responsividade total** e **arquitetura metadata-driven**.

## Stack atual (base para as decisoes)
- Frontend: Next.js (App Router) + React + TypeScript + Tailwind.
- Backend: NestJS + Prisma + REST.

## Regras definitivas (nao negociaveis)
1. **Menu -> Action -> Screen**: toda navegacao de modulo abre uma *Action* (Window Action).
2. **View nao muda dataset**: trocar List/Kanban/Timeline/Graph etc muda apenas apresentacao (mesma query state).
3. **Search/Filters/GroupBy/Favorites** funcionam em todas as views do *mesmo Action*.
4. Estado de tela sempre persistido em **URL + storage** (quando fizer sentido): view, domain, grouping, sort, pagination.
5. Nenhuma pagina ad-hoc nova dentro de modulo: paginas devem ser compostas via `Screen` + `Action` + `ViewRenderer`.

## Contratos obrigatorios (glossario tecnico)
- **Menu**: navegacao do modulo; item aponta para `actionId`.
- **Action (Window Action)**: define `model`, views disponiveis, view default, permissoes e contexto.
- **Model**: definicao de entidade (campos/tipos) usada por DataProvider e views.
- **View**: definicao de representacao (List/Kanban/Form/Graph/Calendar...).
- **Search View**: define o que pode ser buscado/filtrado/agrupado para um Model.
- **Domain / Query AST**: formato unificado de filtros (AND/OR/NOT, operadores etc.).
- **Context**: objeto propagado na navegacao (tenant, usuario, defaults, preferencias, favoritos).

## Estado e eventos (interface padrao)
### ScreenState (minimo)
- `actionId`
- `modelName`
- `activeViewType`
- `domain`
- `searchText`
- `groupBy[]`
- `sort[]`
- `pagination`
- `selection`
- `context`

### Eventos (minimo)
- `onCreate()`
- `onSearchTextChange(text)`
- `onApplyDomain(domain)`
- `onChangeGroupBy(groupBy[])`
- `onSaveFavorite(favorite)`
- `onLoadFavorite(favoriteId)`
- `onChangeView(viewType)`
- `onOpenRecord(id)`
- `onBulkAction(actionKey, selection)`

## Entregaveis (macro-fases)

### v0.1 - Shell + Control Panel (MVP)
- [x] Criar `WebClientShell` (Top Navbar + Module Menu + Content Area).
- [x] Criar `ControlPanelShell` (Create, Breadcrumb, Search, Filter, GroupBy, Favorites, ViewSwitcher).
- [ ] Definir responsividade minima (desktop/tablet/mobile) com "densidade adaptativa".
- [ ] Definir tokens visuais (cores, espacamento, tipografia, bordas) como fonte unica.
- [ ] Definir biblioteca unica de icones (padrao: Lucide) e regras de uso (tooltip, icon-only no mobile).

**Criterios de aceite**
- Control Panel aparece sempre no mesmo lugar em qualquer tela de modulo.
- Mobile: sidebar vira drawer; control panel quebra em 2 linhas ou bottom-sheet.

**Design System (escopo minimo)**
- Tokens: cores, tipografia, espacamento, raios/bordas, alturas (32/36/40/48px).
- Densidade adaptativa:
  - `compact` (desktop) e `comfort` (mobile/tablet) por breakpoint.
  - tabelas densas no desktop; modo cards/colunas prioritarias no mobile.

### v0.2 - Registry: Menu/Action/Screen/View
- [ ] Criar registry central de `modules` (metadados) com:
  - `menus[]`
  - `actions[]` (MVP entregue: actions + searchViews iniciais)
  - `models[]`
  - `views[]`
  - `searchViews[]` (MVP entregue)
- [x] Criar `ScreenHost` (resolve actionId -> monta Screen).
- [ ] `ViewRenderer` (host que monta a view ativa a partir de metadata).

**Criterios de aceite**
- Novo modulo nasce registrando Menu + Action + Views (sem pagina custom).

### v0.3 - Domain AST + AdvancedFilterBuilder
- [x] Definir formato de Domain AST (serializavel em URL e storage).
- [x] Implementar `AdvancedFilterBuilder` (UI) para construir Domain.
- [x] `FilterMenu` e `SearchBar` passam a gerar Domain/SearchText unificados.

**Criterios de aceite**
- Domain suporta AND/OR/NOT e operadores essenciais (=, !=, >, <, in, contains/ilike, between).
- Aplica igual em List/Kanban/Graph.

### v0.4 - DataProvider unificado
- [ ] Criar `DataProvider` com contratos:
  - `search(model, params)`
  - `read(model, id)`
  - `create(model, payload)`
  - `update(model, id, payload)`
  - `delete(model, id)`
- [ ] Padronizar retorno: `data[]`, `pagination`, `meta` (agregacoes/facets quando necessario).

**Criterios de aceite**
- ListView e GraphView consomem o mesmo `search()` (mudando apenas parametros).

### v0.5 - Views MVP (List + Form)
- [ ] `ListView` (grid) com sort, selection, columns, bulk actions e modo cards no mobile.
- [ ] `FormView` (layout grid -> stack no mobile) com estados e validacoes.

### v0.6 - Views avancadas (Kanban + Graph + Calendar)
- [ ] `KanbanView` com colunas configuraveis por Action (groupBy).
- [ ] `GraphView` com agregacoes do DataProvider (evitar `all=true` quando dataset crescer).
- [ ] `CalendarView` (eventos por campo de data) com filtros e search.

### v0.7 - Favorites (Saved Filters) + Persistencia completa
- [ ] `FavoritesMenu` para salvar/restaurar combinacoes:
  - Domain + GroupBy + Sort + Colunas (quando aplicavel)
- [ ] Persistir state em URL + storage (por Action).

### v1.0 - DoD (padrao definitivo)
- [ ] Criar modulo exemplo "Clientes" (Menu + Action + Views) como validacao final.
- [ ] Garantir acessibilidade minima (teclado/toque) nos menus e filtros.
- [ ] Consolidar documentacao e padroes para todos os modulos.

## Estrutura de pastas sugerida (migracao sem big-bang)
- `frontend/src/web-client/`:
  - `registry/` (menus/actions/models/views/searchViews)
  - `screen/` (`ScreenHost`, `ScreenState`, `context`)
  - `control-panel/` (shell + subcomponentes plugaveis)
  - `views/` (List/Kanban/Form/Graph/Calendar)
  - `domain/` (Domain AST + serializers + utils)
  - `data-provider/` (contratos + adaptadores REST)
- Componentes existentes podem virar adaptadores internos:
  - `DataTable` -> `ListView` (adapter)
  - `DataTableFilterSheet` -> `AdvancedFilterBuilder` (adapter incremental)
  - `PageBreadcrumb`/`AppHeader` -> `ControlPanelShell`/`Breadcrumb` (bridge temporaria)

## Versionamento (quando extrair para pacotes)
- Evoluir para `packages/ui/*` (ou `@ui/*`) quando o nucleo (v0.2/v0.3) estiver estavel.
- Semver:
  - `minor`: novos componentes/features sem breaking.
  - `major`: mudancas em contratos (`ScreenState`, Domain AST, DataProvider).

## Historico real (o que ja existe no repo)

### 2026-02-26 - Primeiras pecas (prototype)
- Entregue (backend): endpoint `GET /pantry/history` com filtros/paginacao e `all=true` para Graph.
- Entregue (frontend): base de "record browser" (toolbar + view switcher) e sync de estado via URL.
- Entregue (pantry): pagina `pantry/history` com views (cards/tabela/timeline/grafico) usando a mesma query.

**Notas**
- O `record-browser/*` atual e um *prototype*; sera evoluido/renomeado para os componentes finais do `ControlPanelShell` e do `ViewRenderer` assim que o registry (v0.2) estiver pronto.
