# Padrão Universal de Módulos (Frontend)

## Objetivo

Definir um contrato único e escalável para módulos do web-client (Pantry, People, Project, Program, Users, Audit, etc.), garantindo padronização entre listagem, detalhe, relacionamento, ações, auditoria, busca e persistência de estado.

## 1) Contratos base no web-client

Todo módulo deve implementar os contratos abaixo para compor uma base consistente entre módulos atuais e futuros.

### 1.1 `RecordModuleDefinition`

Contrato central de configuração do módulo.

- **Identificação e navegação**
  - `moduleId`: identificador estável do módulo.
  - `basePath`: rota base do módulo.
  - `featureFlags`: habilitações por módulo/ambiente.
- **Permissões**
  - `permissions`: mapa de ações (`canCreate`, `canEdit`, `canDelete`, `canShare`, `canAudit`, `canExport` etc.).
  - `actionKey`: chave de ação padrão para salvar preferências/estado.
  - `favoriteKey`: chave usada por favoritos.
- **Fontes de dados**
  - `queryAdapters` (REST/GraphQL/SDK), separadas por domínio:
    - `listDataProvider`
    - `detailDataProvider`
    - `notesDataProvider` (opcional)
    - `auditDataProvider` (opcional)
- **Views permitidas**
  - `views`: lista de `ViewConfig`.
  - `defaultView`: view inicial.
- **Escopo de detalhe**
  - `detailLayout`: `DetailLayoutConfig`.
- **Estado inicial**
  - `defaultQueryState`: valores padrão de query (buscar, filtros, paginação, ordenação, agrupamento).

### 1.2 `DetailLayoutConfig`

Define o layout base do detalhe de forma declarativa:

- `headerSlot`: área de breadcrumb, título, status e ações.
- `mainSlot`: formulário principal (create/edit/view).
- `tabs`: conjunto de abas de contexto e suas configurações.
- `bottom`: áreas de relacionamento, tabelas e blocos de apoio.
- `side`: painéis laterais (anotações, comentários, timeline, avisos).
- `viewControls`: controles auxiliares por view.
- `auditSources`: configuração de alimentação de auditoria (padrão abaixo em `AuditFeedConfig`).

### 1.3 `ViewConfig`

Define as visualizações disponíveis por módulo:

- `id`: `list | grouped | calendar | timeline | kanban | graph | detail`
- `title`: rótulo visível
- `icon`: ícone padrão
- `isDefault`: se é a view padrão
- `permissions`: permissões específicas da view
- `params`: props de integração (ex.: campos de data, modo de agrupamento, limites, etc.)
- `supports`: flags de suporte (`supportsCreate`, `supportsQuickCreate`, `supportsSelection`, etc.)

#### Regras obrigatórias por tipo

- `List`: suporta paginação, pesquisa e sort.
- `Grouped`: exige `groupByFields`.
- `Calendar`/`Timeline`: exige mapeamento de datas (`startDate`, `endDate`, opcional `title`).
- `Kanban`: exige campos de coluna/estado.
- `Graph`: exige nós/arestas ou estrutura equivalente.
- `Detail`: representa tela de detalhe único e deve usar `DetailShell`.

### 1.4 `AuditFeedConfig`

Contrato de alimentação da auditoria:

- `primaryEntity`: entidade principal (ex.: `Pantry`).
- `relatedEntities`: lista opcional de entidades relacionadas (`[{ key, source, label, joinKey }]`).
- `sort`: `[{ field, direction }]`, padrão por data/hora desc.
- `filters`: filtros de linha (ex.: tipo de evento, usuário, período).
- `pagination`: padrão de paginação de timeline.
- `transform`: função de normalização para unificar shape do evento.

## 2) Padronização de DataProvider / QueryState

Todo módulo de listagem e detalhe deve usar um estado unificado:

- filtros estruturados em objeto único;
- busca global (`searchText`);
- `groupBy`;
- paginação;
- ordenação;
- `selectedIds` e estado de seleção;
- persistência de estado de tela completa.

### 2.1 Persistência

- Estado salvo por `actionKey`:
  - URL (fonte de verdade para navegação e compartilhamento);
  - `localStorage` (fallback de experiência e retorno de sessão).
- Mudanças de estado devem ser idempotentes e reversíveis (clear/remove mantém defaults previsíveis).

## 3) Padronização de `SearchPanelMenu` por módulo

`SearchPanelMenu` deve ser obrigatório e reutilizável por configuração:

- Filtros dinâmicos por tipo de campo:
  - texto, número, data, select, boolean, multi-select;
- Favoritos por módulo.
- Agrupamento por múltiplos campos.
- Ações de limpeza:
  - `clear all`;
  - `remove` por filtro/grupo/ordenação;
- Operadores por tipo de campo expostos no contrato.
- Deve integrar com o estado único de query (do item 2).

Padrão de composição:

- `SearchPanelMenu` no `SearchBar.rightSlot`.
- Controles de busca e total no `SearchBar`.
- Mudanças no painel refletidas instantaneamente no estado do módulo.

## 4) `EntityModuleShell`

Componente padrão de listagem:

- Encapsula:
  - `PageControlPanel`;
  - `ViewSwitcher`;
  - `SearchBar`;
  - `SearchPanelMenu`;
- Renderiza:
  - cabeçalho padrão;
  - barra de controle por view;
  - estado vazio/erro/carregando;
- Recebe `RecordModuleDefinition` + `QueryState` + `ViewConfig`.

## 5) `DetailShell` como engine de detalhe

Detalhe deve ser genérico, não acoplado a um domínio:

- Entrada de dados:
  - `entity`;
  - `metadata`;
  - `relations`;
  - `tabs`;
  - `auditFeed`;
  - `actions`;
- O layout é controlado por `DetailLayoutConfig`.
- Regras:
  - `main` concentra formulário principal;
  - `tabs` só para cenários de leitura/escrita por contexto;
  - `side` recebe timeline de auditoria, notas e comentários;
  - `bottom` recebe relações tabulares/listas;
  - todo relacionamento de alta complexidade abre/entra em contexto de detalhe (`returnTo` obrigatório).

## 6) Auditoria robusta

- A auditoria deve suportar múltiplas entidades no mesmo feed:
  - entidade principal + relacionamentos;
  - ordenação comum e única;
  - fonte uniforme para timeline e detalhamento.
- Cada registro auditado deve informar origem explícita (`source`) para interpretação correta.

## 7) Padronização de relação de dados por domínio

Cada domínio deve possuir adaptador de interface para:

- mapeamento de campos (labels, tipos, máscaras);
- validações;
- ações permitidas;
- títulos e placeholders;
- fallback de exibição.

Domínios alvo de padronização:

- pantry
- person
- project
- program
- users
- audit

Os adaptadores devem ser reutilizados no `EntityModuleShell` e no `DetailShell`, evitando lógica ad-hoc por módulo.

## 8) Ações comuns padronizadas

- create/edit/view/delete;
- quick actions;
- relacionamento em tabela/tab;
- ações contextuais com regras de permissão;
- retorno padrão com `returnTo`.

Requisito:

- um mapa único de ações por módulo, com rótulos, ícones e permissões.

## 9) Templates de relacionamento

Relacionamentos devem ser configuráveis por configuração:

- "tabs de features" (abas de recursos por contexto);
- "bottom relations" (relações no rodapé por seção/tab);
- composição por slot sem lógica inline específica de módulo.

Exigir:

- definição de título, tipo de visualização, datasource e ação de abertura por relacionamento;
- consistência de comportamento entre módulos.

## 10) Padrão de estilos e densidade

- Formulários principais com `input` padrão de borda inferior;
- chips e ícones consistentes por função global;
- contagem total exibida no `SearchBar`;
- tokens de estilo definidos por tema e aplicados por contrato visual do módulo;
- densidade clara (compacta/média) configurável sem ruptura de layout.

## 11) Estrutura de módulo recomendada

Estrutura sugerida para novos módulos:

```
frontend/src/modules/<module>/
  manifest.ts
  index.ts
  config/
  shared/
  api/
  features/
    <feature>/
      ui/
      domain/
      config/
```

## 12) Checklist de aceitação (módulo aderente ao padrão)

- [ ] Implementa `RecordModuleDefinition` completo.
- [ ] `EntityModuleShell` é usado em listagens.
- [ ] Estado único de query unifica search/filtros/groupBy/paginação/ordenação e é persistido em URL + `localStorage`.
- [ ] `SearchPanelMenu` é padronizado por contrato (operadores por tipo, favoritos, clear/remove, agrupamento).
- [ ] Detalhes renderizam via `DetailShell` usando `DetailLayoutConfig` e `AuditFeedConfig`.
- [ ] Auditoria suporta múltiplas entidades com ordenação comum.
- [ ] Relacionamentos usam adaptadores de domínio e templates padrão (`tabs` + `bottom relations`).
- [ ] Ações comuns são centralizadas e respeitam permissões.
- [ ] UI de formulário/slots segue padrão de densidade e contagem no `SearchBar`.
- [ ] `returnTo` e navegação contextual funcionam de forma consistente.

## 13) Plano de evolução

1. Consolidar contratos em `web-client` base.
2. Migrar Pantry como piloto para os contratos de validação.
3. Aplicar em ordem: `person`, `project`, `program`, `users`.
4. Remover casos ad-hoc após cobertura por contratos.
5. Documentar exceções explícitas com justificativa técnica e owner.
