# Plano Operacional de Migracao Piloto

## Escopo

Executar a centralizacao de:

- `projects`
- `programs`
- `actions`

Objetivo:

Transformar esses tres modulos no template canonical de como um modulo deve funcionar dentro do `web-client`.

## Diagnostico atual

Os tres modulos ja estao parcialmente preparados para o motor central:

- possuem `module-contract`
- usam `RecordListHost` e `DetailShellEngine`
- usam `createStandardListView` e `createStandardDetailView`
- possuem `searchViews`

Arquivos centrais:

- `frontend/src/modules/projects/config/projects-module-contract.tsx`
- `frontend/src/modules/programs/config/programs-module-contract.tsx`
- `frontend/src/modules/actions/config/actions-module-contract.tsx`

Mas ainda nao estao totalmente centralizados porque:

- rotas ainda chamam `ModuleClientPage` diretamente
- nao estao registrados no `frontend/src/web-client/registry/index.ts`
- nao possuem arquivo oficial de `window actions` no mesmo padrao de `tasks`, `people` e `pantry`

## Resultado esperado do piloto

Ao final do piloto:

- listagem, detalhe e criacao dos tres modulos entram por `ScreenHost`
- os tres modulos passam a existir no `registry`
- acoes e search views passam a ser resolvidas pelo fluxo central
- as rotas antigas deixam de ser ponto de entrada principal
- a rota principal abre em `table-view`
- o `detail` possui formulario completo
- o `detail` possui side com auditoria e anotacoes quando aplicavel
- as relacoes aparecem em tabs ou footer padronizado
- o search principal usa icone de lupa e placeholder `Pesquisar`
- os formularios canonicals mostram labels visiveis e mantem valores de data carregados
- relacoes usam apenas toolbar compacta com search `Pesquisar` e botao de adicionar
- o search das relacoes mostra o total filtrado inline
- relacoes possuem `actionRow` para abrir `detail` relacionado
- relacoes possuem acao para criar novo relacionamento via `detail`

No piloto, o tratamento de relacoes tambem deve seguir os modos canonicos:

- `child relation`: `projects > ciclos` e `projects > grupos`
- `association relation`: `projects > participantes`
- `scoped relation`: `ciclo > participantes` e `grupo > participantes`

Detalhe operacional obrigatorio para o piloto:

- `projects > participantes`: `Add` abre dialog com `people` em `table-view`, search canonical e `actionRow` para adicionar imediatamente
- `projects > ciclos` e `projects > grupos`: `Add` abre o `detail` da entidade filha
- `ciclo > participantes` e `grupo > participantes`: `Add` abre dialog com os participantes ja matriculados no projeto, com `actionRow` para associar imediatamente ao escopo atual
- `ciclo` e `grupo` tambem precisam renderizar side padronizado no proprio detail

Regra adicional obrigatoria:

- remocoes de matriculas e memberships nao podem apagar historico; devem usar encerramento logico como `deletedAt`, `endedAt` ou equivalente

## Ordem recomendada

### 1. Programs

Razao:

- menor complexidade estrutural
- lista e detalhe mais lineares
- bom modulo para validar padrao com baixo risco

### 2. Projects

Razao:

- semelhante a `programs`
- ja usa `DetailShellEngine`
- introduz relacoes e cards mais ricos, mas ainda com controle viavel

### 3. Actions

Razao:

- modulo mais sensivel entre os tres
- lista tem filtros extras (`projectId`, `onlyMine`, `groupId`, `cycleId`)
- create/detail tem maior chance de regras mais especificas

## Plano por modulo

### Programs

#### Estado atual

Rotas:

- `frontend/src/app/[tenant]/(modules)/programs/page.tsx`
- `frontend/src/app/[tenant]/(modules)/programs/new/page.tsx`
- `frontend/src/app/[tenant]/(modules)/programs/[id]/page.tsx`

Hoje:

- list chama `ProgramsListModuleClientPage` diretamente
- create/detail chamam `ProgramsDetailEngineClientPage` diretamente

#### Migracao alvo

Criar `window actions`:

- `programs.list`
- `programs.create`
- `programs.detail`

Criar arquivo:

- `frontend/src/web-client/registry/actions/programs.tsx`

Registrar no:

- `frontend/src/web-client/registry/index.ts`

Trocar rotas para:

- `return <ScreenHost actionId="programs.list" />`
- `return <ScreenHost actionId="programs.create" />`
- `return <ScreenHost actionId="programs.detail" />`

#### Checklist tecnico

- importar `ProgramsListModuleClientPage`
- importar `ProgramsDetailEngineClientPage`
- importar `programsListModuleDefinition`
- importar `programsDetailModuleDefinition`
- usar `PROGRAMS_ROUTES`
- alinhar breadcrumbs e `moduleActionKey`

#### Criterio de aceite

- navegacao de list para detail continua funcionando
- permissao centralizada pelo `ScreenHost`
- breadcrumbs deixam de depender da page
- list abre em `table-view`
- `detail` possui formulario completo
- `detail` possui side padronizado
- relacoes do modulo aparecem no footer/tab padronizado

### Projects

#### Estado atual

Rotas:

- `frontend/src/app/[tenant]/(modules)/projects/page.tsx`
- `frontend/src/app/[tenant]/(modules)/projects/new/page.tsx`
- `frontend/src/app/[tenant]/(modules)/projects/[id]/page.tsx`

Hoje:

- list chama `ProjectsListModuleClientPage`
- create/detail chamam `ProjectsDetailEngineClientPage`

#### Migracao alvo

Criar `window actions`:

- `projects.list`
- `projects.create`
- `projects.detail`

Criar arquivo:

- `frontend/src/web-client/registry/actions/projects.tsx`

Registrar no:

- `frontend/src/web-client/registry/index.ts`

Trocar rotas para `ScreenHost`.

#### Observacoes

O detalhe de projetos ja esta no `DetailShellEngine`, mas o piloto so sera considerado concluido quando o fluxo completo estiver entregue, sem fallback transitorio.

#### Criterio de aceite

- a pagina de listagem entra por `ScreenHost`
- create/detail entram por `ScreenHost`
- nenhuma regra de permissao fica dependente da page do App Router
- list abre em `table-view`
- `detail` tem form completo
- `detail` tem side padronizado
- relacoes de projetos abrem e criam detalhes relacionados

### Actions

#### Estado atual

Rotas:

- `frontend/src/app/[tenant]/(modules)/actions/page.tsx`
- `frontend/src/app/[tenant]/(modules)/actions/new/page.tsx`
- `frontend/src/app/[tenant]/(modules)/actions/[id]/page.tsx`

Hoje:

- list chama `ActionsListModuleClientPage`
- create chama `ActionCreateRouteClientPage`
- detail chama `ActionDetailEngineClientPage`

#### Migracao alvo

Criar `window actions`:

- `actions.list`
- `actions.create`
- `actions.detail`

Criar arquivo:

- `frontend/src/web-client/registry/actions/actions.tsx`

Registrar no:

- `frontend/src/web-client/registry/index.ts`

Trocar rotas para `ScreenHost`.

#### Observacoes

`actions` merece entrar por ultimo porque a listagem tem estado mais rico e maior chance de acoplamento com query string e filtros de negocio.

#### Criterio de aceite

- filtros extras continuam funcionando
- create/detail seguem fluxo canonical
- busca principal cobre todas as colunas visiveis da tabela canonical
- `returnTo` e navegacao de volta continuam preservados
- list abre em `table-view`
- `detail` tem form completo
- `detail` tem side padronizado
- relacoes abrem e criam detalhes relacionados

## Passos tecnicos comuns

### Etapa A. Criar `window actions`

Seguir o padrao de:

- `frontend/src/web-client/registry/actions/tasks.tsx`
- `frontend/src/web-client/registry/actions/people.tsx`

Para cada modulo:

- exportar ids
- criar action de list
- criar action de detail
- criar action de create

Padrao esperado:

- `createModuleWindowAction`
- `moduleDefinition`
- `moduleActionKey` quando aplicavel
- `titleVariant`
- `breadcrumbs`
- `hideBreadcrumb` para detail/create quando fizer sentido

### Etapa B. Registrar no `registry`

Atualizar:

- `frontend/src/web-client/registry/index.ts`

Adicionar:

- imports das actions
- inclusao no `WINDOW_ACTIONS`
- garantir que `SEARCH_VIEWS` ja contempla o modulo

Observacao:

Os search views de `projects`, `programs` e `actions` ja existem no codigo, mas precisam ser tratados como parte do fluxo oficial do registro central.

### Etapa C. Migrar rotas para `ScreenHost`

Substituir o corpo das pages por:

- `return <ScreenHost actionId="..." />`

Arquivos alvo:

- `frontend/src/app/[tenant]/(modules)/projects/page.tsx`
- `frontend/src/app/[tenant]/(modules)/projects/new/page.tsx`
- `frontend/src/app/[tenant]/(modules)/projects/[id]/page.tsx`
- `frontend/src/app/[tenant]/(modules)/programs/page.tsx`
- `frontend/src/app/[tenant]/(modules)/programs/new/page.tsx`
- `frontend/src/app/[tenant]/(modules)/programs/[id]/page.tsx`
- `frontend/src/app/[tenant]/(modules)/actions/page.tsx`
- `frontend/src/app/[tenant]/(modules)/actions/new/page.tsx`
- `frontend/src/app/[tenant]/(modules)/actions/[id]/page.tsx`

### Etapa D. Validar integracao

Validar:

- `npm run build`
- rota principal abre em `table-view`
- navegacao de list para detail
- navegacao de create
- formulario completo no detalhe
- side com auditoria e anotacoes
- relacoes no footer/tab padronizado
- `actionRow` das relacoes abrindo `detail`
- botao de criar relacao abrindo `detail`
- permissao sem regressao
- breadcrumbs
- actionSlot, se existir

## Arquivos que provavelmente precisarao ser alterados

### Novos arquivos

- `frontend/src/web-client/registry/actions/programs.tsx`
- `frontend/src/web-client/registry/actions/projects.tsx`
- `frontend/src/web-client/registry/actions/actions.tsx`

### Arquivos existentes

- `frontend/src/web-client/registry/index.ts`
- `frontend/src/app/[tenant]/(modules)/projects/page.tsx`
- `frontend/src/app/[tenant]/(modules)/projects/new/page.tsx`
- `frontend/src/app/[tenant]/(modules)/projects/[id]/page.tsx`
- `frontend/src/app/[tenant]/(modules)/programs/page.tsx`
- `frontend/src/app/[tenant]/(modules)/programs/new/page.tsx`
- `frontend/src/app/[tenant]/(modules)/programs/[id]/page.tsx`
- `frontend/src/app/[tenant]/(modules)/actions/page.tsx`
- `frontend/src/app/[tenant]/(modules)/actions/new/page.tsx`
- `frontend/src/app/[tenant]/(modules)/actions/[id]/page.tsx`

## Riscos e cuidados

### 1. Centralizar a entrada sem centralizar o comportamento

Risco:

As rotas passarem por `ScreenHost`, mas cada modulo continuar com muito wiring proprio.

Tratamento:

- isso nao sera mais aceito como modulo concluido
- a migracao so fecha quando list/detail/side/relacoes estiverem completos

### 2. Breadcrumb ou permissao divergente

Risco:

A page antiga carregar labels ou checks implicitos nao refletidos nas window actions.

Tratamento:

- validar visualmente list/create/detail de cada modulo

### 3. Modulo `actions` perder estado de filtros

Risco:

Como `actions` tem query state mais rico, pode haver regressao de URL state.

Tratamento:

- migrar `actions` por ultimo
- validar filtros por projeto, grupo, ciclo e "somente minhas"

## Definicao de pronto do piloto

O piloto estara concluido quando:

- `projects`, `programs` e `actions` estiverem registrados no `registry`
- suas rotas principais usarem `ScreenHost`
- list/create/detail desses modulos forem acessados por `actionId`
- a rota principal abrir em `table-view`
- o `detail` estiver completo
- side e relacoes seguirem o padrao canonical
- `searchText` principal de cada modulo refletir o contrato canonical de busca ampla
- relations/tabs usam apenas toolbar compacta com busca ampla, icone de lupa, placeholder `Pesquisar` e botao de adicionar
- relations/tabs mostram o total filtrado inline no search compacto
- formularios do detail exibem labels e preservam datas carregadas
- relacoes do piloto declaram o modo canonical correto
- remocoes de vinculos do piloto preservam historico
- build passar sem regressao

## Proximo passo apos o piloto

Depois do piloto, iniciar segunda fase:

- reduzir wiring repetido em `*-list-module-client-page.tsx`
- consolidar helpers de query state
- revisar componentes fora do fluxo canonical
- transformar esse padrao em regra obrigatoria para os demais modulos
