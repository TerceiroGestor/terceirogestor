# shared/conventions.md

## Objetivo

Definir convencoes obrigatorias para implementacao, operacao e documentacao do projeto.

---

## Convencoes de documentacao

- `docs/shared` e a fonte de verdade para convencoes e decisoes.
- Documentacao de modulo deve ser orientada por feature, com nomes em `kebab-case`.
- Evitar duplicacao: regra global fica em `shared`; modulo referencia, nao replica.
- Mudanca de comportamento em codigo deve atualizar `shared` no mesmo fluxo.

---

## Convencoes de arquitetura web-client

- Listas de modulo devem usar `RecordListHost`.
- Detail deve usar `DetailShellEngine`.
- Side de metadados deve usar `StandardDetailMetadataSide`.
- Relacoes devem usar host relacional compartilhado (`RelationListHost` ou equivalente canonico).
- Views devem ser declaradas no contrato de modulo (`views[]` com `viewType`).

---

## Convencoes de comportamento de UI

- `new` e `edit` compartilham mesma estrutura de detail.
- Criacao usa salvamento explicito.
- Atualizacao usa autosave apenas para registro persistido.
- Exclusao exige confirmacao.
- Campos duplicados entre formulario e side devem ser eliminados.

---

## Convencoes de acesso e seguranca

- Backend deve proteger rotas com `JwtAuthGuard` + `PermissionsGuard` quando aplicavel.
- Permissao de rota deve ser declarada por `@Permissions(...)`.
- Frontend deve avaliar permissao por contrato de modulo (`permissions` e `actions`).
- Fluxos sensiveis devem controlar visibilidade e operacao.

---

## Convencoes de tenancy

- Rotas multi-tenant devem resolver tenant por slug (`/t/{slug}`).
- `tenantId` deve ser propagado via request context durante toda a requisicao.
- Operacoes de modulo devem sempre estar escopadas por `tenantId`.

---

## Convencoes de banco e persistencia

- Prisma e a camada padrao de acesso a dados.
- Modelos de dominio multi-tenant devem incluir `tenantId` com indexacao adequada.
- Queries de leitura/escrita devem usar filtro por `tenantId` no service.
- Auditoria de mudanca de dados deve permanecer ativa na camada Prisma.

---

## Convencoes por modulo

- Modulos frontend oficiais estao em `frontend/src/modules`.
- Modulos backend oficiais estao em `backend/src/modules`.
- Divergencias entre nomes/escopo frontend-backend devem ser registradas em `docs/shared/decisions.md`.

### Convencoes de arquitetura backend por modulo

- Nome interno do dominio backend deve ser singular e explicito.
- Modulo backend deve separar responsabilidades entre `presentation`, `application`, `domain` e `infrastructure` quando o dominio tiver complexidade suficiente.
- `presentation` nao deve acessar Prisma diretamente.
- `domain` nao deve depender de HTTP, controller ou request.
- `application` concentra orquestracao, mapeamento e queries de listagem.
- `infrastructure` concentra detalhes tecnicos de persistencia, storage e integracoes.
- Compatibilidades legadas devem ficar centralizadas em poucos arquivos e documentadas no mesmo fluxo.
- Blueprint oficial de referencia para backend fica em `docs/shared/backend-module-blueprint.md`.

---

## Contrato canonico de interface

### Estrutura obrigatoria

Cada modulo canonico deve ter:

1. rota principal `/module`
1. detail em `/module/new` e `/module/[id]`
1. list principal com `RecordListHost`
1. detail com `DetailShellEngine`
1. side padrao com `StandardDetailMetadataSide`

### List principal

- botao principal `Novo` quando permitido
- `SearchPanel` unico do sistema
- `Filter` e `Group` no menu do painel
- typeviews no mesmo conjunto canonico
- colunas base comuns (`Tags`, `Cadastro`, `Status`) quando aplicavel

### Detail principal

- `headSlot`, `detailSlot`, `sideSlot` e `relationSlot` seguem estrutura padrao
- `new` e `edit` usam o mesmo formulario principal
- `detail` nao exibe acao `Novo`
- a acao destrutiva principal e `Excluir`, quando permitida
- o modulo nao deve depender de `renderizador legado de formularios`

### Side padrao

Abas canonicas:

- `Auditoria`
- `Comentarios`
- `Notas internas`
- `Tags`
- `Anexos`
- `Historico`
- `Contexto`

Regras:

- `Tags` ficam somente no `sideSlot`
- nao duplicar `Tags` no corpo principal
- textos de orientacao nao ficam na tela operacional

### Relations

Tipos canonicos:

- `relation informacional`
- `relation operacional`

Regras:

- relation usa host/list padrao e abre detail relacionado ao clicar na linha
- relation operacional usa `ListView` como corpo
- filtros, busca, selecao e acoes ficam no proprio slot relacional
- salvamento explicito em mutacoes em lote
- proibido `grade tabular legada` no fluxo canonico ativo
- proibida page paralela quando o fluxo puder viver no shell atual

---

## Estrutura de negocio canonica

### PeopleGroup

`PeopleGroup` e o agrupamento institucional de pessoas.

Finalidades:

- `PUBLICO`
- `EQUIPE`

### Project

O projeto define:

- quais `Grupos de Pessoas` atende
- quais `Grupos de Equipe` participam do projeto
- quais participantes estao matriculados
- quais `Grupos de Participantes` existem dentro do projeto

### ProjectGroup

`ProjectGroup` e o agrupamento interno do projeto.

Nome visivel:

- `Grupo de Participantes`

### Action

A acao pertence a um projeto e pode ter alvo explicito:

- `PROJECT`
- `PEOPLE_GROUP`
- `PROJECT_GROUP`
- `ENROLLMENT`

Participantes da acao devem suportar no mesmo fluxo:

- presenca
- nota
- destaque
- observacao

Equipe da acao:

- nasce da equipe institucional vinculada ao projeto

Fotos e relatorio:

- devem permanecer dentro do shell canonico como relation/aba canonica

Ocorrencias:

- nao fazem parte da modelagem ativa de `Action`

### Ordem de canonizacao institucional

1. `PeopleGroup`
1. `Project`
1. `ProjectGroup`
1. `Action`
