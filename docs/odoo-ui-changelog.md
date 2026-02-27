# Estrategia Definitiva - Web Client estilo Odoo (v2)

Este documento troca a estrategia de "parecer com o Odoo" por uma estrategia de **ferramentas definitivas**: um conjunto pequeno de componentes + contratos que funcionam igual em qualquer modulo.

## Objetivo
- 1 padrao de tela para navegacao de registros (Kanban/List/Table/Timeline/Graph/Calendar...).
- 1 estado de query por *Action* que dirige a view ativa.
- Control Panel sempre no mesmo lugar, compacto, e com as mesmas interacoes.

## Padrao unico de tela (nao negociavel)
1. **Menu -> Action -> Screen**: toda navegacao abre uma `WindowAction`.
2. **Trocar ViewType nao muda o dataset**: muda so a apresentacao (mesma query state).
3. **Search existe em todas as telas de listagem** e, dentro do Search, ficam:
   - Filtros (Domain)
   - GroupBy (organizador/coluna do Kanban)
   - Favoritos (Saved Searches)
4. **ViewType existe em todas as telas de listagem** (quando a action tiver mais de uma view).
5. **Uma unica fonte de verdade de paginacao**, sem resets no mount.

## Ferramentas definitivas (o que TODO modulo deve reutilizar)
- `ControlPanelShell`: layout fixo no topo (acao primaria, search, view switcher).
- `PageControlPanel`: injeta os slots do Control Panel por pagina/action.
- `SearchBar`: input compacto.
- `SearchPanelMenu`: dropdown compacto com **Filtros + GroupBy + Favoritos**.
- `ViewSwitcher`: troca de ViewType.
- `PaginationBar`: paginacao para views nao-table (ex.: Kanban, Timeline).
- `usePersistedUrlState`: estado persistido (URL + localStorage) com migracao segura.

## Contrato de estado (ActionQueryState)
Minimo (por action):
- `view` (ViewType)
- `searchText`
- `domain` (Domain AST)
- `groupBy[]` (organizador; no Kanban, 1 campo ativo)
- `pagination`: `pageIndex` (0-based) + `pageSize`

Eventos minimos:
- `onSearchTextChange(text)`
- `onDomainChange(domain)`
- `onGroupByChange(groupBy[])`
- `onChangeView(view)`
- `onPaginationChange(pageIndex/pageSize)`
- `onSaveFavorite(state)` / `onApplyFavorite(state)`

## Regras de Search (compacto e sempre igual)
- O Control Panel mostra **1 linha**: `SearchBar` + 1 botao (menu) para abrir `SearchPanelMenu`.
- O `SearchPanelMenu` e a casa de **tudo** que muda a query state: filtros, groupBy, favoritos.
- Qualquer mudanca em `searchText`/`domain` deve levar a `pageIndex = 0` (mas nunca no mount).

## Regras de ViewType (sempre presente)
- Toda listagem precisa expor `ViewSwitcher`.
- Para Kanban, o `groupBy[0]` define a coluna organizadora (o "organizer" da view).
- Cada action precisa de um default claro (ex.: Entradas -> `sector`, Saidas -> `type`, History -> `kind`).

## Paginacao (fix definitivo)
- Fonte unica: `pagination.pageIndex/pageSize` pertence ao ActionQueryState.
- Reset de pagina so quando **Search/Domain** muda (e nao no mount).
- Quando `pageCount` diminuir, clamp/ajustar `pageIndex` (evita ficar preso em pagina invalida).

## Status real (2026-02-26)
Implementado no repo (base do padrao):
- `SearchPanelMenu` com GroupBy ativo (organizador) + Favoritos.
- Search consolidado: `SearchBar` + `SearchPanelMenu` no mesmo slot (compacto).
- Kanban real no `pantry.history` (antes era "cards" rotulado como Kanban).
- Persistencia mais segura: `usePersistedUrlState` migra localStorage mesclando defaults do parser.
- Reset de paginacao corrigido (nao reseta no mount; so quando `searchText/domain` muda de verdade).

Proximos passos (para fechar o padrao Odoo):
- Extrair um `ActionScreen` generico (Action -> QueryState -> DataProvider.search -> ViewRenderer).
- Padronizar `SearchViewDefinition` por model (incluindo `groupBy` suportado por cada view).
- Unificar views restantes (Calendar/Graph/Timeline) sob `ViewRenderer` com o mesmo estado.
