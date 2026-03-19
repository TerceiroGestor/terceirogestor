# Plano em Fases: PeopleGroup

Status em 13/03/2026:

- Fases estruturais executadas no backend
- rotas publicas do frontend expostas em `/people-groups`
- seed refeito com `PeopleGroup`, `ProjectPeopleGroup` e `ActionPeopleGroup`
- legado de `people-segments` mantido apenas como compatibilidade temporaria

## Objetivo

Migrar do estado atual para o modelo baseado em `PeopleGroup`, minimizando retrabalho e preservando o que ja funciona no frontend canonical e na regra de negocio.

## Direcao oficial

A partir desta definicao, a arquitetura alvo passa a usar:

- `People`
- `PeopleGroup`
- `PeopleGroupParticipation`
- `ProjectPeopleGroup`
- `ActionPeopleGroup`

E manter:

- `personType` em `People`
- `participationKind` e `role` para reduzir tabelas de participacao

## O que pode ser reaproveitado do estado atual

- cadastro unico de `People`
- `personType`
- participacoes com `role` em projeto
- participacoes com `role` em acao
- separacao de `group` como estrutura operacional
- motor canonical do `web-client`
- dialogs com `table-view`

## O que muda de verdade

- `PeopleSegment` deixa de ser a direcao principal
- `cycle` deixa de ser conceito especial
- ambos passam a ser absorvidos por `PeopleGroup`
- projeto e acao passam a selecionar `PeopleGroup`

## Fases recomendadas

### Fase 0. Congelar o vocabulÃ¡rio

Entregas:

- declarar `PeopleGroup` como conceito oficial
- declarar `PeopleGroupParticipation` como membership global
- declarar `ProjectPeopleGroup` e `ActionPeopleGroup` como relacoes de contexto
- declarar `ProjectParticipation` e `ActionParticipation` como participacoes reais

Risco:

- baixo

### Fase 1. Introduzir `PeopleGroup` no backend

Entregas:

- nova model `PeopleGroup`
- nova model `PeopleGroupParticipation`
- enums de `groupType` e `participationKind` se necessario
- migrations aditivas

Regras:

- `personType` permanece em `People`
- memberships de `PeopleGroup` devem usar encerramento logico

Risco:

- medio

### Fase 2. Criar o modulo canonical de `PeopleGroup`

Entregas:

- rotas principais
- `table-view` como rota principal
- detail canonical completo
- side com auditoria e anotacoes
- relation/tab de participacoes do grupo
- dialog para adicionar people usando `table-view`

PadrÃµes canonicals obrigatorios:

- `Pesquisar`
- lupa
- busca em todas as colunas visiveis
- total filtrado inline
- sem `DataTable`

Risco:

- medio

### Fase 3. Fazer backfill de `PeopleSegment` e `Cycle`

Entregas:

- mapear `PeopleSegment` existente para `PeopleGroup`
- mapear `Cycle` existente para `PeopleGroup` com `groupType = CYCLE`
- mapear memberships existentes para `PeopleGroupParticipation`

Estrategia:

- migracao aditiva primeiro
- nao apagar legado imediatamente
- criar scripts de backfill deterministico

Risco:

- medio/alto

### Fase 4. Introduzir `ProjectPeopleGroup`

Entregas:

- projeto passa a vincular `PeopleGroup`
- relacao precisa carregar `participationKind`
- tabs separadas no projeto:
  - `Participantes`
  - `Equipe`

Uso recomendado:

- `Participantes` vincula `PeopleGroup` com `participationKind = PARTICIPANT`
- `Equipe` vincula `PeopleGroup` com `participationKind = TEAM`

Risco:

- medio

### Fase 5. Reposicionar a participacao real no projeto

Entregas:

- manter ou evoluir o model atual de participacao no projeto
- usar:
  - `participationKind`
  - `role`
- suportar:
  - adicao individual
  - adicao em massa
  - encerramento logico

Fluxo alvo:

1. projeto seleciona `PeopleGroup`
2. projeto herda people elegiveis
3. usuario confirma quem entra no projeto
4. define o `role` no projeto

Risco:

- medio

### Fase 6. Introduzir `ActionPeopleGroup`

Entregas:

- acao passa a vincular `PeopleGroup`
- com `participationKind` separado entre publico e equipe

Fluxo alvo:

- acao pode herdar publico do projeto
- acao pode ter grupos especificos adicionais
- acao pode ter equipe propria

Risco:

- medio

### Fase 7. Reposicionar a participacao real na acao

Entregas:

- `ActionParticipation` com:
  - `participationKind`
  - `role`
- separar no frontend:
  - `Participantes`
  - `Equipe`

Risco:

- medio/alto

### Fase 8. Limpar legado conceitual

Entregas:

- parar de evoluir `PeopleSegment`
- parar de evoluir `cycle` como conceito de produto
- substituir labels e fluxos principais por `PeopleGroup`
- manter compatibilidade tecnica apenas onde for necessario por mais tempo

Risco:

- medio

### Fase 9. Revisar relatorios, dashboard e auditoria

Entregas:

- relatorios por `PeopleGroup`
- relatorios por `participationKind`
- relatorios por `role`
- dashboards com leitura separada entre publico e equipe

Risco:

- medio

## Regras de UX obrigatorias

### Projeto

Projeto deve mostrar claramente:

- `Participantes`
- `Equipe`

Nao misturar tudo em uma unica aba.

### Acao

Acao deve mostrar claramente:

- `Participantes`
- `Equipe`

### Dialogs de vinculacao

Todos os dialogs principais devem:

- usar `table-view`
- permitir filtro por `PeopleGroup`
- permitir definir `role`
- permitir acao em massa
- permitir selecionar pagina
- permitir selecionar todos os filtrados quando fizer sentido

## Decisao de modelagem

Para minimizar tabelas, a recomendacao e:

- usar `participationKind`
- usar `role`

Mas sem colapsar contextos diferentes.

Portanto:

- `PeopleGroupParticipation` = pertencimento global
- `ProjectParticipation` = contexto do projeto
- `ActionParticipation` = contexto da acao

## Recomendacao final

O menor caminho seguro agora e:

1. oficializar `PeopleGroup`
2. criar os novos modelos
3. mapear `PeopleSegment` e `Cycle` para `PeopleGroup`
4. migrar projeto para `ProjectPeopleGroup`
5. migrar acao para `ActionPeopleGroup`
6. estabilizar a separacao entre `Participantes` e `Equipe`

Essa estrategia preserva boa parte do que ja foi construido e corrige o dominio sem exigir uma reescrita total.
