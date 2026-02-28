# Guia de Desenvolvimento — `pantry`

Este módulo é a implementação de referência do padrão “Web Client estilo Odoo”: **Search + Filter + Group + Favorites** dentro do SearchBar, **ViewSwitcher** por Action, e **DataProvider** como camada única de consulta.

## Objetivo
- **Estoque**: listar itens disponíveis (com saldo/validades) e navegar para o detalhe do item.
- **Item Detail**: tela única de **create/edit/view** + registrar **Entradas/Saídas** + visualizar **Histórico** do item.
- **Histórico**: explorar todos os movimentos do estoque (views: lista/timeline/calendário/gráfico).

Fora do escopo:
- Telas separadas de “Entradas”, “Saídas”, “Doadores”, “Painel/Overview” (rotas antigas redirecionam para Estoque).

## Rotas e Actions
Rotas ativas (Next.js):
- `/pantry` → abre Estoque
- `/pantry/stock` → `actionId="pantry.stock"`
- `/pantry/donors` → `actionId="pantry.donors"`
- `/pantry/history` → `actionId="pantry.history"`
- `/pantry/items/new` → `actionId="pantry.items.new"`
- `/pantry/items/[id]` → `actionId="pantry.items.detail"`

Actions (registry):
- `frontend/src/web-client/registry/actions/pantry.tsx`
- Registra em `frontend/src/web-client/registry/index.ts`

## Contrato de tela (Search/Filter/Group/Favorites)
Todas as telas de listagem (ex.: Estoque, Histórico) seguem o mesmo contrato:

1) **Fonte única do estado da query**
- Persistido via URL + storage usando `usePersistedUrlState`.
- Chaves padrão do módulo:
  - `q`: texto de busca
  - `d`: domain (filtros)
  - `g`: groupBy (múltiplos)
  - `view`: viewType da Action (quando aplicável)
  - paginação: `page`, `limit`

2) **SearchBar é obrigatório**
- Sempre renderizar `SearchBar`.
- Facets (chips dentro do input) são geradas por `buildQueryFacets`.
- Remoções devem usar:
  - `removeConditionAtIndex(domain, index)` para remover filtros (inclui `domain` com 1 condição).

3) **Tudo do Filter/Group/Favorites fica dentro do Search**
- `SearchPanelMenu` é o dropdown único (compacto) contendo:
  - Filtros (Domain)
  - Agrupar por (GroupBy)
  - Favoritos (Saved searches)

4) **A view ativa usa a mesma query**
- `ViewSwitcher` troca apenas apresentação.
- A troca de view não deve “resetar” domain/busca/grupos (a menos que o favorito carregado defina isso explicitamente).

## Contrato de dados (DataProvider)
Consulta:
- Usar `createRestDataProvider({ token })` e `dataProvider.search(model, args)` para telas de listagem.
- Models usados no módulo:
  - `pantry.stock` (Estoque)
  - `pantry.donors` (Doadores)
  - `pantry.history` (Histórico)

CRUD do item:
- `dataProvider.read/create/update` para `pantry.items` no Item Detail.

Operações de movimento (Entradas/Saídas) no Item Detail:
- Usar as APIs do módulo (não DataProvider) enquanto não houver um contrato único de `create/update` para movimentos:
  - `createPantryEntry`, `createPantryExit`
  - `listPantryEntries`, `listPantryExits`, `listPantryHistory`
  - `listPantryItemAuditLogs`

## Views
List (tabelado):
- Componente: `frontend/src/web-client/views/ListView.tsx`
- Responsabilidades:
  - Agrupamento com collapse via `groupByFields`
  - Ferramentas de coluna: ordenar/ocultar/fixar (pin left/right)

Graph/Timeline/Calendar:
- Usar views do `web-client/views/*` e manter os controles específicos da view no “terceiro nível” do Control Panel (quando aplicável).

## Auditoria (Atividade)
- Auditoria do item vem de `GET /pantry/items/:id/audit`.
- O backend inclui `user.avatarUrl` no payload para renderizar o avatar:
  - `backend/src/modules/pantry/pantry.service.ts` → `include.user.select.avatarUrl`

## Onde mexer ao criar uma nova tela no pantry
- Criar rota em `frontend/src/app/[tenant]/(modules)/pantry/<route>/page.tsx`
- Registrar Action em `frontend/src/web-client/registry/actions/pantry.tsx`
- (Se for listagem) definir SearchView em `frontend/src/web-client/registry/searchViews/pantry.ts`
- Implementar UI em `frontend/src/modules/pantry/features/<feature>/ui/*`
