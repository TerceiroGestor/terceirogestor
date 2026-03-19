# Plano de Implementacao em Fases: People Unificado

> Superado conceitualmente em 13/03/2026 pela direcao baseada em `PeopleGroup`.
> Referencia atual: [2026-03-13-people-group-implementation-plan.md](/c:/server/system_development/docs/2026-03-13-people-group-implementation-plan.md)

## Objetivo

Implementar a nova estrutura de `people` unificado de forma segura, sem quebrar:

- o que ja funciona em `people`
- o motor canonical do `web-client`
- os modulos de `projects`, `actions` e `groups`
- o historico dos dados existentes

## Premissas

1. O dominio novo passa a usar `people` como vocabulário principal.
2. O termo `cycle` deixa de ser a direcao futura principal.
3. O agrupamento institucional global passa a evoluir para `people segment`.
4. O model tecnico `Person` pode continuar temporariamente no schema legado.
5. Rename massivo e remodelagem profunda nao devem acontecer na mesma fase.

## Estrategia geral

O caminho seguro nao e renomear tudo de uma vez.

O caminho seguro e:

1. estabilizar o novo dominio
2. introduzir as novas entidades em paralelo
3. adaptar a UX para o novo fluxo
4. migrar os dados
5. descontinuar a estrutura antiga
6. so depois fazer rename tecnico amplo, se ainda fizer sentido

## Estado atual

Hoje o sistema tem:

- `Person` como cadastro principal
- `ProjectEnrollment` como matricula no projeto
- `Cycle` e `ProjectCycle` ja parcialmente introduzidos
- `ProjectGroup` como grupo operacional
- `ProjectAction` com segmentacao por grupo e ciclo

O problema do estado atual e que:

- `cycle` ainda esta carregando semanticas demais
- nao existe uma camada clara de segmento institucional global de people
- `actions` ainda nao separa bem participante de executor
- o dominio ainda mistura classificacao de publico, matricula e agrupamento operacional

## Modelo alvo

### Entidades alvo

1. `People`
- dominio funcional para o cadastro unico

2. `PeopleSegment`
- agrupamento institucional global

3. `PeopleSegmentMembership`
- historico de pertencimento da pessoa a segmentos

4. `ProjectPeopleParticipation`
- vinculo da pessoa com o projeto

5. `ProjectGroup`
- grupo operacional do projeto

6. `ProjectGroupParticipation`
- vinculo da participacao do projeto com o grupo

7. `ActionPeopleParticipation`
- vinculo da pessoa com a acao

## Regras alvo

- qualquer pessoa pode existir no cadastro unico
- qualquer pessoa pode pertencer a um ou mais segmentos
- projeto aceita um ou mais segmentos
- somente people elegiveis aparecem para participacao no projeto
- acao pode ter participant roles e execution roles
- grupo continua interno ao projeto

## Fases recomendadas

### Fase 0. Congelar a semantica nova

Entregas:

- documentar o novo dominio oficial
- declarar `people` como termo padrao
- declarar `cycle` como conceito em transicao
- declarar `group` como conceito estritamente operacional

Risco:

- baixo

Observacao:

- esta fase e de alinhamento e governanca

### Fase 1. Adotar `people` como linguagem oficial de produto e docs

Entregas:

- docs novos passam a usar `people`
- labels novas de frontend passam a usar `people`
- telas novas deixam de usar `person` como termo funcional
- manter compatibilidade tecnica com modelos e endpoints legados

Status em 13/03/2026:

- concluida no frontend principal
- `/people`, `/people/new`, `/people/[id]` e `/people/[id]/tree` viraram entradas canonicas reais
- menu principal e contratos de modulo passaram a apontar para `/people`
- links de detail/tree e fluxos principais de `projects` passaram a abrir `/people`
- rotas profundas em `/person/*` permanecem temporariamente como legado de compatibilidade

Risco:

- baixo

Importante:

- nesta fase, nao renomear ainda tabelas centrais do banco
- foco em UX, docs, contratos de modulo e naming de dominio

### Fase 2. Introduzir `PeopleSegment` e `PeopleSegmentMembership`

Entregas:

- nova model institucional global
- modulo canonical novo para `people segments`
- relacao entre `people` e segmentos com historico
- list/detail canonical
- side com auditoria e anotacoes
- relation/tab com participantes do segmento

Backend principal:

- `backend/prisma/schema.prisma`
- novo modulo backend dedicado
- migration aditiva

Frontend principal:

- novo modulo `frontend/src/modules/people-segments/*`
- rotas canonical
- registry
- data-provider

Risco:

- medio

Status em 13/03/2026:

- concluida
- `PeopleSegment` entrou como model aditiva no Prisma
- `PeopleSegmentMembership` entrou com historico e encerramento logico
- backend novo em `people-segments` com CRUD e endpoints de memberships
- frontend canonical novo com `/people-segments`, list, detail, side, auditoria e tab de people
- dialog de associacao usa `table-view` com `Pesquisar`, lupa e total inline
- `cycle` permanece em paralelo nesta fase, sem ruptura funcional

### Fase 3. Descontinuar `cycle` como direcao oficial e migrar para `people segment`

Entregas:

- `people segment` passa a ser o vocabulario e fluxo principal
- `cycle` deixa de ser conceito recomendado de produto
- backfill direto:
  - `Cycle` -> `PeopleSegment`
  - usos ativos e dados necessarios -> memberships e vinculos novos
- telas, pickers e fluxos novos deixam de depender de `cycle`
- legado de `cycle` fica apenas como compatibilidade temporaria para o que ainda nao for migrado no mesmo passo

Nova premissa desta fase:

- como o projeto ainda esta em desenvolvimento, esta fase pode fazer substituicao mais direta
- nao precisamos preservar a arquitetura conceitual anterior de `cycle` se ela atrapalhar o dominio novo
- o foco passa a ser clareza de negocio, mesmo que isso exija desmontar parte da modelagem intermediaria criada antes

Direcao recomendada:

1. parar de expandir `cycle`
2. promover `people segment` a estrutura oficial
3. tratar `cycle` como legado tecnico em desativacao
4. migrar o frontend principal para `people segment`
5. remover dependencias conceituais de `cycle` assim que os fluxos equivalentes estiverem prontos

Risco:

- medio

Status de estrategia em 13/03/2026:

- autorizado seguir com substituicao mais livre
- nao e mais necessario otimizar demais para conviver por muito tempo com `cycle`

Status de execucao em 13/03/2026:

- `people segment` ja virou a fonte principal para novos vinculos em `projects`
- `actions` ja prefere `segment` com fallback legado para `catalogCycle`
- o registry canonical do `web-client` ja nao usa mais `cycles`
- as rotas `/cycle`, `/cycle/new` e `/cycle/[id]` passaram a redirecionar para `people-segments`
- `cycle` permanece apenas como legado tecnico temporario no backend e em partes isoladas do frontend

### Fase 4. Permitir que `Project` selecione segmentos aceitos

Entregas:

- nova relacao `ProjectAllowedSegment`
- tab canonical em `projects`
- picker canonical de segmentos em dialog com `table-view`
- search em todas as colunas visiveis
- detail do vinculo se necessario, ou relacao simples se for apenas elegibilidade

Regra:

- projeto nao matricula automaticamente
- projeto apenas define segmentos aceitos

Risco:

- medio

Status em 13/03/2026:

- concluida
- `projects` passou a vincular `people segments` como criterio institucional aceito
- o picker de segmentos usa dialog canonical com `table-view`
- a tab principal de `projects` foi reposicionada para `Segmentos`
- a estrutura antiga de `cycle` saiu do fluxo principal e ficou apenas como legado tecnico isolado

### Fase 5. Evoluir `ProjectEnrollment` para `ProjectPeopleParticipation`

Entregas:

- manter compatibilidade com `ProjectEnrollment`
- introduzir papel no projeto
- permitir papeis como:
  - `PUBLICO_ATENDIDO`
  - `FAMILIAR`
  - `VOLUNTARIO`
  - `EQUIPE_TECNICA`
  - `PARCEIRO`
  - `PATROCINADOR`
- filtros e relatorios por papel

Estrategia segura:

- primeiro adicionar `role` e semantica nova ao modelo atual
- depois renomear tecnicamente apenas se ainda fizer sentido

Risco:

- medio/alto

Status em 13/03/2026:

- concluida de forma aditiva
- `ProjectEnrollment` recebeu o campo `role`
- o papel padrao atual e `PUBLICO_ATENDIDO`
- backend ja aceita criar e atualizar participacao com papel
- frontend principal de `projects` ja exibe `Papel` na listagem e no formulario de edicao da participacao
- criacao rapida e bulk no detail do projeto ja enviam `PUBLICO_ATENDIDO` explicitamente

### Fase 6. Mudar o fluxo de participacao no projeto

Entregas:

- `Adicionar people` no projeto passa a mostrar apenas:
  - pessoas dos segmentos aceitos
  - pessoas ainda nao vinculadas ao projeto
- possibilidade de filtrar por segmento
- a row continua adicionando em massa sem fechar o dialog
- detail do projeto passa a mostrar participacoes por papel

Canonical a preservar:

- dialog com `table-view`
- placeholder `Pesquisar`
- icone de lupa

Status em 13/03/2026:

- concluida
- backend ganhou o endpoint de people elegiveis por projeto
- a elegibilidade atual considera:
  - people em segmentos vinculados ao projeto
  - people ainda sem participacao ativa no projeto
- o picker principal de participantes do detail do projeto ja usa essa lista elegivel
- o dialog de adicao em massa tambem ja usa a mesma regra centralizada
- o dialog bulk foi migrado do `DataTable` para `table-view`
- os dois dialogs agora usam placeholder `Pesquisar`, lupa, total inline e filtro por segmento
- o fluxo de adicao em massa nao fecha automaticamente ao concluir, preservando o processo de varias adicoes seguidas
- total filtrado inline
- row action
- sem `DataTable`

Risco:

- medio

### Fase 7. Reposicionar `ProjectGroup` como grupo operacional puro

Entregas:

- revisar labels e docs de `group`
- impedir que grupo seja usado como substituto de segmento institucional
- manter grupos apenas para recortes internos do projeto

Risco:

- baixo/medio

Status em 13/03/2026:

- concluida
- labels e textos principais de `group` foram reposicionados para `grupo operacional`
- `projects` e o detail de `group` reforcam semanticamente que grupo e recorte interno do projeto
- `group` deixou de competir visualmente com `segmento institucional`

### Fase 8. Introduzir `ActionPeopleParticipation`

Entregas:

- separar publico participante de equipe executora
- permitir papeis por acao
- exemplos:
  - `PARTICIPANTE`
  - `FACILITADOR`
  - `APOIO`
  - `VOLUNTARIO`
  - `RESPONSAVEL_TECNICO`
- acoes passam a poder registrar:
  - quem participou
  - quem executou
  - quem apoiou

Risco:

- alto

Observacao:

- esta e uma das fases mais sensiveis de negocio

Status em 13/03/2026:

- concluida
- backend ganhou `ProjectActionPeopleParticipation` com papel, historico e encerramento logico
- `actions` passou a ter uma camada separada para equipe, apoio, voluntariado e outros papeis
- a aba `Participantes` continua dedicada a presenca do publico
- nova aba `Equipe` registra people da acao com papel proprio
- o dialog de associacao da equipe segue o canonical com `table-view`, `Pesquisar`, lupa e total inline

### Fase 9. Revisar relatorios, auditoria e dashboard

Entregas:

- relatorios por segmento institucional
- relatorios por papel no projeto
- relatorios por papel na acao
- dashboards mais proximos da realidade operacional

Risco:

- medio

Status em 13/03/2026:

- concluida no escopo atual da migracao
- o relatorio de `actions` passou a incluir a secao `Equipe e apoio`
- o dominio novo de segmento e papeis passou a aparecer em relatorios operacionais centrais
- a camada de dashboard institucional mais ampla continua como evolucao futura, mas a base de dados e de UX ficou pronta para isso

### Fase 10. Finalizar limpeza de legado e decidir o rename tecnico final

Entregas:

- remover telas e labels legadas de `cycle`
- remover dependencias conceituais antigas
- decidir se vale fazer rename tecnico de:
  - `Person` -> `People`
  - `ProjectEnrollment` -> `ProjectPeopleParticipation`
  - `Cycle` -> `PeopleSegment`

Recomendacao:

- so fazer rename tecnico final depois da estabilizacao funcional

Risco:

- alto se antecipado
- medio se feito por ultimo

Status em 13/03/2026:

- concluida como decisao de governanca
- `cycle` saiu do fluxo principal de produto e hoje existe apenas como legado tecnico isolado
- o rename tecnico massivo de `Person` e `ProjectEnrollment` foi deliberadamente adiado
- a direcao oficial ficou:
  - UX e docs em `people`
  - segmentos institucionais em `people segment`
  - participacao no projeto e na acao por papel
- a limpeza futura deve ser incremental e so acontecer quando o legado restante nao estiver mais sendo usado

## Plano de rename seguro para `person` -> `people`

### Recomendacao

Nao fazer rename profundo logo no inicio.

### Caminho seguro

1. dominio e UX usam `people`
2. novos modulos usam `people`
3. adapters mapeiam legado `Person` para dominio `people`
4. avaliar rename tecnico so depois

### Por que isso importa

Porque hoje `Person` aparece em:

- schema Prisma
- controllers
- DTOs
- services
- frontend de `people`
- relacoes familiares
- financeiros
- beneficios
- saude
- arvore familiar

Renomear tudo agora aumentaria muito o risco.

## Ordem tecnica recomendada

1. criar docs novos e alinhar naming
2. introduzir `PeopleSegment`
3. fazer modulo canonical de segmentos
4. ligar projetos a segmentos aceitos
5. mudar picker de participacao do projeto
6. adicionar papeis em participacao de projeto
7. adaptar `actions`
8. adaptar relatorios
9. descontinuar `cycle`
10. avaliar rename tecnico amplo

## Regras canonicals que devem permanecer

- modulo principal em `table-view`
- search em todas as colunas visiveis
- placeholder `Pesquisar`
- icone de lupa
- toolbar compacta em relations
- total filtrado inline
- dialogs de associacao com `table-view`
- sem `DataTable` para o fluxo canonical
- detail com formulario completo
- side com auditoria e anotacoes
- row abrindo detail
- memberships com encerramento logico

## Recomendacao final

O caminho mais seguro e:

- assumir `people` como dominio central
- introduzir `people segments` como classificacao institucional
- tratar participacao em projeto e acao como entidades proprias com papel
- manter `groups` apenas como organizacao operacional
- adiar o rename tecnico massivo de `Person` para depois da estabilizacao

Assim o produto fica mais realista, mais flexivel e muito mais preparado para cenarios de ONG sem perder controle.
