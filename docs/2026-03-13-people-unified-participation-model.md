# Modelo Unificado de People, Segments e Participations

> Superado conceitualmente em 13/03/2026 pela direcao baseada em `PeopleGroup`.
> Referencia atual: [2026-03-13-people-group-domain-model.md](/c:/server/system_development/docs/2026-03-13-people-group-domain-model.md)

## Objetivo

Definir um modelo mais aderente a realidade de instituicoes sociais onde:

- toda pessoa existe uma unica vez no sistema
- a mesma pessoa pode atuar em varios papeis
- projetos e acoes podem envolver publicos diferentes
- segmentos institucionais e grupos operacionais deixam de competir entre si
- o vocabulario de dominio passa a usar `people` como termo padrao

Este documento substitui conceitualmente a leitura anterior centrada em `cycle` como estrutura principal do projeto.

## Estado de transicao

Em 13/03/2026, a direcao oficial do produto passou a ser:

- `people`
- `people segment`
- participacoes com papel
- `project group` como estrutura operacional

O conceito de `cycle` deixou de ser direcao funcional principal e passou a ser apenas legado tecnico temporario.

No estado atual implementado:

- `people segment` ja e o fluxo institucional principal
- `projects` ja usa elegibilidade por segmento
- `project enrollment` ja expone papel no projeto
- `actions` ja separa presenca do publico de people vinculadas por papel em `Equipe`
- `group` esta reposicionado como agrupamento operacional interno

## Nova leitura de negocio

No contexto real da ONG:

- atendidos, familiares, voluntarios, funcionarios, parceiros e doadores convivem no mesmo ecossistema
- uma mesma pessoa pode participar de mais de um processo
- uma mesma pessoa pode assumir papeis diferentes em projeto e acao
- os publicos precisam ser reaproveitaveis entre varios projetos

Por isso, o sistema deve separar claramente:

1. cadastro unico de pessoas
2. segmentos institucionais de people
3. participacao em projetos
4. participacao em acoes
5. grupos operacionais internos

## Decisao recomendada

Adotar o seguinte modelo conceitual:

- `People`
  - cadastro unico de qualquer pessoa envolvida com a instituicao
- `PeopleSegment`
  - agrupamento institucional global e reutilizavel
- `ProjectPeopleParticipation`
  - vinculo da pessoa com o projeto e seu papel no projeto
- `ActionPeopleParticipation`
  - vinculo da pessoa com a acao e seu papel na acao
- `ProjectGroup`
  - grupo operacional interno do projeto

Resumo:

- `people` = pessoa cadastrada uma unica vez
- `people segment` = publico institucional reutilizavel
- `project participation` = presenca da pessoa no projeto com papel
- `action participation` = presenca da pessoa na acao com papel
- `project group` = agrupamento operacional e contextual

## Terminologia recomendada

### Vocabulário funcional

A partir de agora, o termo recomendado no dominio, nos docs, nas telas novas e nos modulos novos e:

- `people`
- `people segment`
- `project people participation`
- `action people participation`
- `project group`

### Observacao importante de migracao

Para seguranca tecnica, o model atual `Person` pode continuar existindo temporariamente no schema e no codigo legado.

Regra recomendada:

- dominio novo, UX nova e docs novos usam `people`
- rename tecnico de `Person` para `People` ou equivalente so deve acontecer em fase propria
- nao misturar rename massivo com remodelagem de participacao na mesma etapa

## O que muda em relacao ao modelo anterior

Antes:

- `cycle` estava carregando parte da responsabilidade de publico institucional
- `projectCycle` virava quase uma segunda camada de organizacao de pessoas
- `group` ficava perto demais de `cycle`

Agora:

- `people segment` passa a ser o publico institucional global
- `project` seleciona quais segmentos atende
- a matricula no projeto mostra apenas people pertencentes aos segmentos aceitos
- `project group` fica reservado para recortes operacionais internos

## Entidades conceituais

### 1. `People`

Cadastro unico de qualquer pessoa.

Exemplos:

- atendido
- familiar
- voluntario
- funcionario
- parceiro
- doador
- patrocinador

Responsabilidade:

- identidade da pessoa
- dados cadastrais
- historico geral
- relacoes familiares e sociais

## 2. `PeopleSegment`

Agrupamento institucional global.

Exemplos:

- `C1M`
- `C2M`
- `C3M`
- `Familiares`
- `Funcionarios`
- `Voluntarios`
- `Doadores`
- `Parceiros`

Responsabilidade:

- classificar publico institucional
- permitir reaproveitamento entre projetos
- servir de filtro de elegibilidade

Importante:

- um segmento nao e grupo operacional
- um segmento nao e papel
- uma pessoa pode pertencer a varios segmentos
- o sistema deve preservar historico de entrada e saida nos segmentos

## 3. `ProjectPeopleParticipation`

Vinculo da pessoa com o projeto.

Responsabilidade:

- registrar que aquela pessoa fez parte do projeto
- definir o papel da pessoa no projeto
- guardar periodo e historico

Exemplos de papel:

- `PUBLICO_ATENDIDO`
- `FAMILIAR`
- `VOLUNTARIO`
- `EQUIPE_TECNICA`
- `PARCEIRO`
- `PATROCINADOR`

## 4. `ActionPeopleParticipation`

Vinculo da pessoa com a acao.

Responsabilidade:

- registrar presenca da pessoa na acao
- definir o papel exercido naquela acao
- manter evidencias e historico

Exemplos de papel:

- `PARTICIPANTE`
- `FACILITADOR`
- `APOIO`
- `VOLUNTARIO`
- `CONVIDADO`
- `RESPONSAVEL_TECNICO`

## 5. `ProjectGroup`

Grupo interno do projeto.

Responsabilidade:

- separar subconjuntos operacionais
- montar recortes temporarios
- viabilizar acoes especificas

Exemplos:

- grupo de meninos
- turma da oficina de musica
- equipe da apresentacao
- subgrupo de reforco

## Regras de negocio recomendadas

### 1. Toda pessoa deve nascer em `people`

Nao criar cadastros separados para:

- atendidos
- familiares
- funcionarios
- voluntarios
- doadores

Tudo deve partir de um cadastro unico.

### 2. Segmento nao substitui participacao

Pertencer a um `people segment` nao significa participar automaticamente de um projeto.

Segmento deve indicar:

- classificacao institucional
- elegibilidade
- contexto base

Participacao em projeto continua sendo acao explicita.

### 3. Projeto seleciona segmentos aceitos

Um projeto deve poder informar quais `people segments` atende.

Exemplo:

- projeto atende `C1M`, `C2M` e `C3M`

Na matricula do projeto:

- aparecem apenas people desses segmentos
- somem da lista os que ja estao vinculados ao projeto

### 4. Grupo continua sendo operacional

`ProjectGroup` deve existir apenas para recortes internos do projeto.

Ele nao deve substituir:

- segmento institucional
- papel da pessoa no projeto
- papel da pessoa na acao

### 5. Participacoes precisam ter papeis

Nao basta dizer que a pessoa participou.

O sistema precisa saber:

- em qual projeto
- em qual acao
- em qual papel
- em que periodo

### 6. Encerramentos devem preservar historico

Para segmentos e participacoes:

- nada de hard delete em vinculos relevantes
- usar `deletedAt`, `endedAt`, `isActive` ou equivalente

## Fluxo operacional recomendado

### People

1. cadastrar a pessoa em `people`
2. associar a um ou mais `people segments`
3. manter historico de segmentacao

### Projeto

1. criar projeto
2. selecionar segmentos aceitos
3. matricular people elegiveis no projeto
4. se necessario, atribuir `project groups`

### Acao

1. criar acao no projeto
2. definir publico participante
3. definir executores, apoio e voluntarios
4. registrar presenca e qualidade por `action people participation`

## Impacto direto em modulos

### `people`

Passa a ser o modulo central de identidade.

### `cycle`

Deixa de ser a direcao oficial do produto.

Recomendacao:

- substituir diretamente por `people segment` sempre que o fluxo novo equivalente estiver pronto
- evitar criar novas regras ou novas telas baseadas em `cycle`
- tratar `cycle` apenas como legado tecnico temporario durante a migracao

### `projects`

Passa a usar segmentos como criterio de elegibilidade e filtragem de matricula.

### `groups`

Permanece, mas com escopo estritamente operacional.

### `actions`

Passa a trabalhar com:

- publico participante
- equipe executora
- voluntarios
- apoio

Tudo isso usando participacoes com papeis.

## Beneficios

- muito mais aderente a realidade da ONG
- elimina duplicacao de cadastro
- suporta multiplos papeis por pessoa
- melhora rastreabilidade
- melhora relatorios de impacto
- amplia o produto para varios tipos de instituicao

## Riscos

- aumento de complexidade conceitual
- necessidade de regras fortes de permissao e historico
- maior cuidado na UX para nao expor complexidade demais
- migracao exige faseamento bem disciplinado

## Recomendacao final

Seguir com:

- `people` como cadastro unico
- `people segment` como publico institucional global
- `project participation` como vinculo real da pessoa com o projeto
- `action participation` como vinculo real da pessoa com a acao
- `project group` como agrupamento operacional

Essa estrutura e mais forte, mais realista e mais preparada para escalar sem criar distorcoes no dominio.
