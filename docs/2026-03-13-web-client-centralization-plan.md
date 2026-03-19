# Plano de Reestruturacao para Centralizacao no Web Client

## Objetivo

Centralizar o frontend em um unico motor de execucao, o `web-client`, para reduzir divergencias entre modulos, diminuir retrabalho e criar uma padronizacao mais forte para:

- controle de acesso e permissao em tela
- listagens e detalhes padronizados
- relacoes e subdetalhes
- filtros, views e navegacao
- audit trail e acoes padronizadas
- futura evolucao para relatorios e configuracao mais declarativa

## Resumo executivo

O projeto ja possui um motor com base boa para isso:

- `ScreenHost` como ponto de entrada de acoes
- `registry` como catalogo central de window actions e search views
- `RecordModuleDefinition` como contrato declarativo de modulo
- `RecordListHost` e `DetailShellEngine` como shells principais
- `starter` com validacoes e padroes de construcao

Hoje, porem, a aplicacao ainda esta em estado hibrido:

- parte das rotas passa pelo `ScreenHost`
- parte das rotas chama `ModuleClientPage` diretamente
- parte dos fluxos usa o shell do `web-client`, mas fora do `registry`
- componentes globais como `DataTable` e `FormEngine` continuam sendo usados de forma descentralizada

Conclusao: o problema principal nao e ausencia de motor central. O problema e que o motor central ainda nao virou regra arquitetural obrigatoria.

## Base atual do motor central

Os principais blocos existentes sao:

- `frontend/src/web-client/screen/ScreenHost.tsx`
- `frontend/src/web-client/registry/index.ts`
- `frontend/src/web-client/registry/types.ts`
- `frontend/src/web-client/record/RecordListHost.tsx`
- `frontend/src/web-client/detail/DetailShellEngine.tsx`
- `frontend/src/web-client/starter/record-module-starter.tsx`

O contrato de modulo em `registry/types.ts` ja suporta:

- permissoes
- acoes
- views
- query adapters
- search config
- detail layout
- fontes de auditoria
- fontes relacionadas

Isso significa que a arquitetura desejada ja existe em boa parte. A reestruturacao deve focar em consolidacao e enforcement, nao em trocar tudo novamente.

## Diagnostico da descentralizacao atual

### 1. Roteamento centralizado incompleto

As rotas ligadas ao `ScreenHost` hoje cobrem apenas uma parte dos modulos, especialmente:

- `tasks`
- `person`
- `pantry` em varias rotas
- `admin`

Exemplos:

- `frontend/src/app/[tenant]/(modules)/tasks/page.tsx`
- `frontend/src/app/[tenant]/(modules)/person/page.tsx`
- `frontend/src/app/[tenant]/(modules)/pantry/stock/page.tsx`
- `frontend/src/app/[tenant]/(modules)/admin/users/page.tsx`

Mas ainda existem rotas importantes fora do `ScreenHost`, por exemplo:

- `frontend/src/app/[tenant]/(modules)/projects/page.tsx`
- `frontend/src/app/[tenant]/(modules)/programs/page.tsx`
- `frontend/src/app/[tenant]/(modules)/actions/page.tsx`

Nesses casos a rota ainda chama diretamente pages modulares especificas.

### 2. Uso parcial do `registry`

O `registry` atual concentra acoes para:

- admin
- pantry
- people
- tasks

Mas nao concentra ainda todo o sistema. Modulos importantes como:

- projects
- programs
- actions

ja possuem `module-contract`, mas ainda nao aparecem totalmente integrados ao `registry` central.

Isso cria um estado inconsistente:

- modulos seguem o contrato do `web-client`
- mas ainda nao sao executados pelo fluxo central de window actions

### 3. Duplicacao de estado e logica de lista

Arquivos como:

- `frontend/src/modules/projects/features/list/ui/projects-list-module-client-page.tsx`
- `frontend/src/modules/programs/features/list/ui/programs-list-module-client-page.tsx`
- `frontend/src/modules/actions/features/list/ui/actions-list-module-client-page.tsx`

mostram um padrao recorrente:

- parse manual de query string
- serialize manual de query string
- wiring manual de `EntityModuleShell`
- regras locais de permissao e navegacao

Mesmo usando o `web-client`, a composicao ainda esta repetida por modulo. Isso enfraquece a ideia de motor unico.

### 4. Detail shell central, mas com fallbacks e transicoes abertas

Alguns detalhes ja usam `DetailShellEngine`, como projetos e programas, mas ainda com mensagens de transicao e fallback manual.

Exemplo:

- `frontend/src/modules/projects/features/detail/ui/projects-detail-engine-client-page.tsx`

Isso indica que a direcao esta correta, mas a migracao ainda nao foi concluida.

### 5. Componentes globais usados sem governanca unica

Hoje:

- `DataTable` esta em uso real em varios modulos e cards
- `FormEngine` esta em uso real em autenticacao, formularios e dialogs
- `FilterEngine` tambem esta ativo

O problema nao e o uso desses componentes. O problema e que eles nao estao sempre subordinados ao contrato do `web-client`.

Resultado:

- cada modulo decide como compor tela, query state, filtros e navegacao
- o design system fica compartilhado
- mas o comportamento do produto continua descentralizado

## Avaliacao arquitetural

### O que deve ser mantido

- `web-client` como motor central
- `RecordModuleDefinition` como contrato oficial
- `ScreenHost` como ponto unico de entrada para telas de modulo
- `registry` como catalogo central de acoes e search views
- `DetailShellEngine` como shell unico de detalhe
- `RecordListHost` como shell unico de listagem
- `DataTable`, `FormEngine` e `FilterEngine` como primitives internas do motor

### O que deve mudar

- parar de permitir rotas de modulo fora do `ScreenHost`, salvo excecoes claras
- parar de tratar `DataTable` e `FormEngine` como camada paralela ao motor
- reduzir parse/serialize manual de state por modulo
- consolidar um unico fluxo de navegacao, permissao, breadcrumb, favoritos e actions
- transformar contratos de modulo em obrigatorios para todos os modulos de negocio

## Diretriz principal da reestruturacao

Regra alvo:

> Toda tela de modulo deve ser executada pelo `web-client`, descrita por contrato declarativo e acessada por `ScreenHost`.

Regra complementar obrigatoria:

> Um modulo so esta concluido quando o fluxo canonical completo estiver entregue, e nao apenas quando a rota principal estiver ligada ao motor.

Consequencias praticas:

- `src/app/**` deve virar apenas wiring para `ScreenHost`, redirects ou fluxos autenticos fora do dominio modular
- `src/modules/**` deve expor contrato, definicao e implementacoes plugadas no motor
- `components/**` deve fornecer primitives, nao fluxos paralelos

## Modelo alvo

### 1. Rotas

Toda rota de modulo deve ser uma destas categorias:

- `ScreenHost` com `actionId`
- redirect para rota canonical do `ScreenHost`
- excecao documentada fora do motor

### 2. Contrato unico por modulo

Cada modulo deve ter:

- `module-contract`
- `detail-layout-contract` quando houver detalhe
- registro de window actions
- registro de search view
- smoke validation no starter

### 3. Shells oficiais

Lista:

- `RecordListHost` para listagens
- `DetailShellEngine` para detalhes
- `DetailRelationTablePanel` para relacoes
- views do `web-client` para lista, calendar, graph, timeline, kanban, gantt

### 3.1. Fluxo canonical obrigatorio por modulo

Todo modulo deve seguir o seguinte fluxo como padrao:

- rota principal abre em `table-view`
- `searchText` principal pesquisa os valores de todas as colunas visiveis da listagem canonical
- o search canonical principal usa icone de lupa e placeholder `Pesquisar`
- listagem oferece as demais views padrao quando fizer sentido para o modulo
- `actionRow` da listagem leva para `detail`
- `detail` contem o formulario completo
- o formulario canonical renderiza labels visiveis nos campos editaveis
- campos de data do canonical normalizam os valores vindos da API para manter os dados carregados no input
- lado direito do `detail` contem auditoria e anotacoes quando aplicavel
- quando uma entidade filha vira modulo de primeira classe, o detail deve usar rota propria do modulo, como `/group/[id]`, para manter navegacao e selecao do sidebar consistentes
- nesses casos, o breadcrumb do detail deve partir do modulo dono da rota, e nao do pai operacional anterior
- side tabs com muito volume em `historico` ou `auditoria` devem expor `Pesquisar` com `SearchPanelMenu`
- quando existirem todas as abas, a ordem canonical do side deve ser `Anotacoes`, `Contexto`, `Historico`, `Auditoria`
- quando houver side panel, o toggle do side deve ficar sempre na extrema direita do header do detail; botoes de acao do registro ficam imediatamente a esquerda desse toggle
- no mobile, o side panel canonical deve abrir como overlay lateral estreito, sem ocupar a largura inteira da viewport, para manter o controle de fechamento visivel
- o layout canonical de detalhe deve manter headers fixos nas tres areas principais: header do detail, header do side e header da area de tabs/relations
- o detail nao deve reservar uma faixa vazia de control panel abaixo do navbar quando a tela nao tiver acoes, filtros, busca ou views
- o scroll deve preservar os headers visiveis, mas nao pode prender ou esconder o conteudo das tabs/relations; quando necessario, o corpo principal do detalhe pode manter scroll de pagina em vez de um scroller interno fixo
- o header principal do detail nao deve manter espacamento extra abaixo do navbar
- a busca local de `historico` e `auditoria` deve pesquisar qualquer valor visivel do item atual
- relacoes aparecem em tabs ou area padronizada no footer do detalhe
- cada area de relacao usa apenas uma toolbar compacta com `Search` e acao de adicionar
- a busca da relacao pesquisa todas as colunas visiveis da tabela relacionada
- o search da relacao usa icone de lupa e placeholder `Pesquisar`
- o search da relacao mostra o total filtrado inline na mesma faixa compacta
- cada relacao tem `actionRow` que leva para o `detail` relacionado
- cada relacao tem acao para criar novo relacionamento, tambem levando para `detail`

### 3.2. Tipos canonicos de relacao

Nem toda relacao deve seguir exatamente o mesmo fluxo de criacao. O canonical passa a reconhecer tres tipos oficiais:

- `child relation`: a entidade relacionada pertence ao pai atual
- `association relation`: a relacao e N:N e representa um vinculo entre entidades
- `scoped relation`: a relacao opera sobre registros ja vinculados ao pai raiz e apenas os associa ao escopo atual, como ciclo ou grupo

Regras por tipo:

- `child relation`: `Add` abre o detail de criacao da entidade filha e a linha abre o detail dessa entidade
- `association relation`: `Add` abre fluxo de vinculacao, inclusive em massa quando fizer sentido; a linha abre o detail da entidade principal relacionada; a edicao do vinculo fica em fluxo proprio de associacao
- `scoped relation`: `Add` abre fluxo para selecionar registros ja vinculados ao pai raiz e associa-los ao escopo atual; a linha abre o detail da entidade principal relacionada
- `association relation`: quando o fluxo for "escolher de outro modulo", o canonical deve preferir dialog com a listagem em `table-view`, search canonical e `actionRow` de adicionar imediatamente
- `scoped relation`: no detail de entidades filhas como `grupo` e `ciclo`, o canonical deve preferir dialog com a lista de registros ja matriculados no pai raiz e `actionRow` de adicionar imediatamente ao escopo atual
- details de entidades filhas como `grupo` e `ciclo` continuam obrigados a renderizar side padronizado, mesmo que inicialmente so exibam contexto

Exemplo canonical para `projects`:

- `participantes`: `association relation`
- `ciclos`: `child relation`
- `grupos`: `child relation`
- `participantes` dentro de `ciclo` e `grupo`: `scoped relation`

### 3.3. Historico obrigatorio de vinculos

Relacoes associativas e de escopo com relevancia historica nao devem ser removidas fisicamente.

Regra oficial:

- remocoes de vinculos em `projects`, `cycles` e `groups` devem preservar historico
- o modelo deve usar `deletedAt`, `endedAt`, `isActive`, ou campo equivalente de ciclo de vida
- a UX deve tratar a remocao como encerramento ou desativacao do vinculo, nunca como exclusao definitiva silenciosa
- auditoria e relatorios devem continuar conseguindo mostrar que a pessoa esteve no projeto e passou por ciclos e grupos

Implicacao:

- ligacao parcial ao `ScreenHost` nao conta como migracao completa
- placeholder, fallback transitorio ou shell vazio nao contam como definicao de pronto

### 4. Components como primitives do motor

`DataTable`, `FormEngine`, `FilterEngine` e similares continuam existindo, mas com novo papel:

- nao definem o fluxo de modulo
- servem ao `web-client`
- quando usados fora dele, precisam de justificativa explicita

## Plano de reestruturacao

### Fase 1. Congelamento arquitetural

Objetivo:

Parar de aumentar a descentralizacao.

Acoes:

- definir uma regra oficial: novos modulos so entram via `web-client`
- impedir novas pages de modulo chamando client pages diretamente
- exigir `module-contract` e registro no `registry` para qualquer nova tela modular
- documentar excecoes permitidas

Entregavel:

- guideline arquitetural publicada
- checklist de PR para modulos

### Fase 2. Canonicalizacao de rotas

Objetivo:

Fazer o App Router virar uma casca fina do motor.

Acoes:

- migrar rotas de `projects`, `programs` e `actions` para `ScreenHost`
- manter rotas antigas apenas como redirect temporario quando necessario
- padronizar nomes de actionId, breadcrumbs e rotas canonicas

Prioridade inicial:

- `projects`
- `programs`
- `actions`

Resultado esperado:

- toda navegacao principal de modulos passa por `ScreenHost`
- permissao e breadcrumb passam a ter o mesmo ponto de controle

### Fase 3. Consolidacao do `registry`

Objetivo:

Tornar o `registry` a fonte unica de verdade para execucao de modulos.

Acoes:

- registrar todos os modulos de negocio no `frontend/src/web-client/registry/index.ts`
- cobrir list, detail e create de todos os modulos suportados
- unificar search views e actions por modulo
- revisar nomenclatura e taxonomia de action ids

Resultado esperado:

- nenhuma tela modular relevante fica invisivel ao motor central

### Fase 4. Reducao de wiring manual nos list pages

Objetivo:

Diminuir repeticao estrutural entre modulos.

Acoes:

- extrair helpers comuns para parse/serialize de query state
- consolidar patterns de favorites, filters e navigation no motor
- reduzir codigo repetido em `*-list-module-client-page.tsx`
- avaliar uma `ModuleListScreenFactory` ou hook central para wiring padrao

Resultado esperado:

- modulos passam a descrever comportamento, nao reimplementar infraestrutura

### Fase 5. Reducao de wiring manual nos detail pages

Objetivo:

Concluir a migracao para o `DetailShellEngine`.

Acoes:

- eliminar fallbacks temporarios de detalhe
- mover formularios e cards que ainda vivem fora do shell para contratos de layout
- padronizar tabs, relacoes, audit feed e side panels
- revisar fluxos de create/edit para usar a mesma estrutura central

Resultado esperado:

- detalhe vira uma experiencia uniforme em todos os modulos
- todo modulo entregue possui form completo, side padronizado e relacoes acionaveis

### Fase 6. Reposicionamento de `DataTable` e `FormEngine`

Objetivo:

Transformar os componentes compartilhados em primitives do motor central.

Acoes:

- documentar `DataTable` como tabela oficial do `web-client`
- documentar `FormEngine` como formulario oficial do `web-client`
- mapear usos soltos e classificar:
  - uso dentro do motor
  - uso aceitavel fora do motor
  - uso que deve ser migrado
- criar adapters ou wrappers oficiais quando necessario

Resultado esperado:

- os componentes deixam de competir com o motor e passam a servi-lo

### Fase 7. Enforcement tecnico

Objetivo:

Evitar regressao para o modelo descentralizado.

Acoes:

- criar validacao automatica para modulos registrados
- ampliar `module-standard-smoke.ts`
- adicionar lint rule ou script para detectar rotas modulares fora do `ScreenHost`
- adicionar checklist de contrato minimo por modulo

Resultado esperado:

- padronizacao deixa de depender so de disciplina manual

## Priorizacao recomendada

### Prioridade alta

- migrar `projects`, `programs` e `actions` para `ScreenHost`
- consolidar registro central desses modulos
- congelar criacao de novas rotas fora do motor

### Prioridade media

- remover repeticao de parse/serialize de query state
- consolidar detalhe padrao
- revisar usos de `DataTable` e `FormEngine` fora do fluxo central

### Prioridade futura

- metamodelo mais declarativo de campos, relacoes e views
- camada de relatorios dinamicos em cima do contrato de modulo
- configuracao ainda mais low-code

## Riscos

### Risco 1. Migracao superficial

Se apenas trocar a rota para `ScreenHost`, mas mantiver toda logica distribuida, a centralizacao sera cosmetica.

Mitigacao:

- migrar tambem contracts, actions e layouts

### Risco 2. Excesso de excecoes

Se cada modulo ganhar uma justificativa para fugir do motor, o plano perde forca.

Mitigacao:

- lista curta de excecoes permitidas
- toda excecao precisa ser documentada

### Risco 3. Motor central virar monolito dificil de evoluir

Centralizar nao pode significar acoplamento confuso.

Mitigacao:

- manter separacao entre:
  - contrato
  - shell
  - primitives
  - regras do modulo

## Criterios de sucesso

O plano pode ser considerado bem-sucedido quando:

- toda rota principal de modulo passa por `ScreenHost`
- todo modulo de negocio relevante possui `module-contract` registrado
- list/detail/create usam shells oficiais
- a rota principal abre em `table-view`
- o `searchText` principal retorna resultados a partir de qualquer coluna visivel da tabela canonical
- o search canonical principal usa apenas o placeholder `Pesquisar` com icone de lupa
- `detail` nao depende de fallback temporario
- `detail` possui formulario completo
- o formulario canonical mostra labels nos campos e preserva datas carregadas
- `detail` possui side de auditoria e anotacoes quando aplicavel
- relacoes usam tabs e acoes canonicas para abrir e criar detalhes relacionados
- cada relacao declara explicitamente se e `child`, `association` ou `scoped`
- relacoes nao exibem blocos de texto explicativo redundantes quando o contexto ja esta no tab
- relacoes usam search compacto com icone de lupa e placeholder `Pesquisar`
- relacoes mostram o total filtrado inline no search compacto
- remocoes de vinculos preservam historico via desativacao logica
- breadcrumbs, actions e permissions deixam de ser resolvidos localmente em cada rota
- `DataTable` e `FormEngine` passam a ser descritos como primitives do motor, nao alternativas
- criar um novo modulo exige menos wiring manual do que hoje

## Recomendacao final

Sim, faz sentido reestruturar o projeto para centralizar tudo no `web-client`.

Essa decisao e coerente com a necessidade de:

- padronizacao mais forte
- menor custo de manutencao
- menos divergencia de UX e comportamento
- base mais preparada para auditoria, relacoes e relatorios

Mas a centralizacao precisa ser tratada como decisao arquitetural oficial, com enforcement tecnico e migracao por fases. Se continuar apenas como direcao informal, a descentralizacao vai continuar reaparecendo.

## Proximo passo sugerido

Executar uma migracao piloto completa de `projects`, `programs` e `actions` para o fluxo canonical:

- rota via `ScreenHost`
- window actions registradas
- views e detail ligados ao `registry`
- remocao de wiring duplicado

Essa fase piloto deve servir como template definitivo para os proximos modulos.
