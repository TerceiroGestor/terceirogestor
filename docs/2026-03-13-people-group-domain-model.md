# Modelo de Dominio: PeopleGroup

## Objetivo

Consolidar a estrutura de dominio para agrupar pessoas de forma reutilizavel, clara e aderente ao contexto real da instituicao.

Esta proposta substitui conceitualmente a direcao anterior centrada em `people segment` como conceito principal.

## Decisao principal

O conceito central de agrupamento global passa a ser:

- `PeopleGroup`

Os vinculos e relacoes passam a usar:

- `PeopleGroupParticipation`
- `ProjectPeopleGroup`
- `ActionPeopleGroup`

## Motivacao

O produto precisa suportar ao mesmo tempo:

- ciclos cronologicos e por faixa etaria
- familiares
- doadores
- voluntarios
- parceiros
- funcionarios
- oficineiros
- outros publicos institucionais

Os termos `cycle` e `segment` passaram a competir entre si. Em vez disso, o sistema precisa de um conceito maior que englobe ambos sem confundir usuario e time tecnico.

`PeopleGroup` resolve isso melhor.

## Estrutura conceitual

### 1. `People`

Cadastro unico da pessoa.

Responsabilidades:

- identidade
- dados cadastrais
- relacoes pessoais
- historico base

Regra:

- manter `personType` em `People`

Exemplos de `personType`:

- `Atendido`
- `Familiar`
- `Funcionario`
- `Voluntario`
- `Oficineiro`
- `Parceiro`
- `Doador`

Importante:

- `personType` ajuda na triagem inicial
- `personType` nao substitui `PeopleGroup`
- `personType` nao substitui o papel da pessoa em projeto ou acao

### 2. `PeopleGroup`

Agrupamento global de pessoas.

Exemplos:

- `C1M`
- `C2M`
- `C3M`
- `Familiares`
- `Doadores`
- `Voluntarios`
- `Parceiros`
- `Equipe tecnica`

Campos recomendados:

- `id`
- `tenantId`
- `name`
- `groupType`
- `description`
- `internalNotes`
- `isActive`
- `createdAt`
- `updatedAt`

### 3. `PeopleGroupParticipation`

Vinculo da pessoa com um `PeopleGroup`.

Responsabilidades:

- registrar pertencimento global
- manter historico
- permitir encerramento logico

Campos recomendados:

- `id`
- `tenantId`
- `peopleGroupId`
- `personId`
- `startsAt`
- `endsAt`
- `deletedAt`
- `isActive`
- `internalNotes`
- `createdAt`
- `updatedAt`

## Tipos de PeopleGroup

`PeopleGroup` deve ter um campo de classificacao para permitir leituras distintas sem criar modelos concorrentes.

Sugestao inicial:

- `CYCLE`
- `SEGMENT`
- `TEAM_POOL`
- `NETWORK`
- `OTHER`

Leitura pratica:

- `C1M` = `PeopleGroup` do tipo `CYCLE`
- `Doadores` = `PeopleGroup` do tipo `SEGMENT`
- `Voluntarios` = `PeopleGroup` do tipo `SEGMENT`
- `Equipe tecnica institucional` = `PeopleGroup` do tipo `TEAM_POOL`

## Projeto

Projeto nao deve cadastrar publico do zero.

Projeto deve selecionar `PeopleGroup` previamente criados.

### `ProjectPeopleGroup`

Relacao entre projeto e `PeopleGroup`.

Responsabilidade:

- informar quais grupos de pessoas fazem parte do contexto do projeto

Campos recomendados:

- `id`
- `tenantId`
- `projectId`
- `peopleGroupId`
- `participationKind`
- `createdAt`
- `updatedAt`

`participationKind` recomendado:

- `PARTICIPANT`
- `TEAM`

Exemplos:

- projeto vincula `C1M`, `C2M`, `C3M` com `PARTICIPANT`
- projeto vincula `Voluntarios` com `TEAM`
- projeto vincula `Parceiros institucionais` com `TEAM`

### `ProjectParticipation`

Participacao real da pessoa no projeto.

Essa tabela continua necessaria porque:

- projeto precisa preservar historico real de quem participou
- a pessoa pode ser elegivel por grupo, mas ainda nao estar efetivamente ativa no projeto
- o papel no projeto precisa ficar explicito

Campos recomendados:

- `id`
- `tenantId`
- `projectId`
- `personId`
- `participationKind`
- `role`
- `startsAt`
- `endsAt`
- `deletedAt`
- `isActive`
- `internalNotes`
- `createdAt`
- `updatedAt`

Regra:

- usar `participationKind` e `role` para reduzir tabelas

`participationKind`:

- `PARTICIPANT`
- `TEAM`

`role` pode conter:

- `PUBLICO_ATENDIDO`
- `FAMILIAR`
- `VOLUNTARIO`
- `FUNCIONARIO`
- `OFICINEIRO`
- `EQUIPE_TECNICA`
- `PARCEIRO`
- `DOADOR`
- `PATROCINADOR`

## Acao

Acao tambem deve seguir `PeopleGroup` como contexto principal.

### `ActionPeopleGroup`

Relacao entre acao e `PeopleGroup`.

Responsabilidade:

- definir quais grupos de pessoas sao publico ou equipe elegivel da acao

Campos recomendados:

- `id`
- `tenantId`
- `actionId`
- `peopleGroupId`
- `participationKind`
- `createdAt`
- `updatedAt`

`participationKind`:

- `PARTICIPANT`
- `TEAM`

### `ActionParticipation`

Participacao real da pessoa na acao.

Campos recomendados:

- `id`
- `tenantId`
- `actionId`
- `personId`
- `projectParticipationId` opcional
- `participationKind`
- `role`
- `startsAt`
- `endsAt`
- `deletedAt`
- `isActive`
- `internalNotes`
- `createdAt`
- `updatedAt`

## Fluxo recomendado

### People

1. cadastrar a pessoa em `People`
2. informar `personType`
3. adicionar a um ou mais `PeopleGroup`

### Projeto

1. criar projeto
2. vincular `PeopleGroup` de publico-alvo com `participationKind = PARTICIPANT`
3. vincular `PeopleGroup` de equipe com `participationKind = TEAM`
4. listar pessoas elegiveis herdadas desses grupos
5. confirmar as participacoes reais no projeto com `participationKind` e `role`

### Acao

1. criar acao
2. vincular `PeopleGroup` de publico e/ou equipe
3. herdar pessoas elegiveis desses grupos
4. confirmar as participacoes reais da acao

## Separacao obrigatoria entre participante e equipe

Essa separacao deve existir sempre:

- `PARTICIPANT` = publico beneficiario
- `TEAM` = executores, apoio, voluntariado, equipe tecnica, parceiros operacionais

Essa diferenca deve aparecer:

- no banco
- na API
- no frontend
- nos relatorios

## O que muda em relacao ao caminho anterior

Antes:

- `people segment` estava ocupando o espaco de agrupador principal
- `cycle` e `segment` competiam
- havia risco de misturar publico e papel

Agora:

- `PeopleGroup` vira o conceito central
- `cycle` pode ser rebaixado para um `PeopleGroup` do tipo `CYCLE`
- `segment` pode ser rebaixado para um `PeopleGroup` do tipo `SEGMENT`
- projeto e acao passam a consumir `PeopleGroup` de forma uniforme

## Beneficios

- melhora a compreensao funcional
- suporta diferentes tipos de publico-alvo
- evita duplicar conceitos
- melhora reaproveitamento entre projeto e acao
- preserva o uso de `personType` para triagem inicial
- reduz tabelas por meio de `participationKind` e `role`

## Recomendacao final

Seguir com:

- `People`
- `PeopleGroup`
- `PeopleGroupParticipation`
- `ProjectPeopleGroup`
- `ActionPeopleGroup`
- participacoes reais em projeto e acao usando `participationKind` e `role`

Essa estrutura e a mais clara para representar:

- publico-alvo
- equipe executora
- grupos globais
- historico real de participacao
