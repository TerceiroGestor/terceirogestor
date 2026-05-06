# Marco Zero 1.0

Este documento define o contrato oficial de padronizacao para fechar o projeto na versao `1.0`.

Objetivo do marco zero:

- transformar padrao canonico em contrato tecnico auditavel
- eliminar variacoes entre telas, fluxos e relacoes
- bloquear regressao com gates de qualidade no build
- finalizar pendencias atuais com criterio objetivo de aceite

## Bases oficiais

Este contrato se apoia em:

- `docs/shared/conventions.md`
- `docs/shared/decisions.md`
- `docs/shared/marco-zero-1.0-audit-matrix.csv`

O `Marco Zero 1.0` prevalece em caso de ambiguidade operacional e detalha como executar e validar o fechamento.

## Diagnostico consolidado

O projeto ja possui os blocos centrais corretos (`RecordListHost`, `DetailShellEngine`, `StandardDetailMetadataSide`, contratos de modulo e smoke), mas ainda sem blindagem suficiente de consistencia comportamental.

Risco principal:

- o smoke atual valida estrutura minima, mas nao garante padrao visual e operacional completo
- existem divergencias entre regra de negocio e implementacao quando residuos legados permanecem no fluxo ativo

Decisao de marco zero:

- padrao canonico vira contrato obrigatorio para qualquer tela
- toda divergencia vira item de auditoria com destino explicito: corrigir, remover, ou isolar fora do escopo 1.0

## Definicao de 100% canonico

Um modulo e considerado 100% canonico quando:

- list usa host padrao com mesmas acoes-base, mesma logica de busca, filtro e agrupamento
- detail usa shell padrao com mesma estrutura de `main`, `side` e `relations`
- `new` e `edit` usam o mesmo fluxo estrutural
- relacoes seguem matriz canonica de cardinalidade
- nao existem componentes paralelos quando ha capability canonica
- nao existe uso ativo de `grade tabular legada`, `renderizador legado de formularios` ou modulo removido no fluxo canonico
- modulo entra no sistema com contrato, smoke, checklist de aceite e validacao final

## Contrato de interface canonica

### List

- usa `RecordListHost`
- possui acao principal `Novo` (quando permitido)
- usa `SearchPanel` padrao, sem barras paralelas
- `Filter` e `Group` no `SearchPanelMenu`
- usa typeviews canonicos quando o dominio suportar (`Tabela`, `Kanban`, `Timeline`, `Calendario`, `Gantt`, `Grafico`)
- colunas base com `Tags`, `Cadastro` e `Status` quando aplicavel

### Detail

- usa `DetailShellEngine`
- `new` e `edit` compartilham mesmo layout e mesmo formulario principal
- detail nao exibe acao `Novo`
- `Excluir` aparece somente quando permitido
- campos principais no `main`; `Tags` apenas no `side`
- relation ja contabilizada em `relationSlot` nao deve ser resumida novamente em card no corpo principal

### Side

- usa `StandardDetailMetadataSide`
- nenhuma aba visivel pode existir sem operacao funcional real
- `Comentarios`, `Notas internas`, `Tags` e `Anexos` so podem aparecer quando houver suporte completo em UI, API e persistencia
- `Auditoria`, `Historico` e `Contexto` seguem comportamento canonico
- textos de orientacao nao ficam na tela; devem ir para o painel `Como usar`

### Relations

- relations no rodape (`relationSlot`/`bottomRelations`) ou em aba canonica
- relations com comportamento de list padrao
- clique em linha abre detail do registro relacionado
- acao de criar relacao usa fluxo relacional canonico
- sem dependencia de tela legada para operacao principal

### Relation operacional

Quando a relation tambem executar operacao de negocio, ela passa a seguir o subtipo `relation operacional`.

Obrigatorio:

- continuar dentro do `DetailShellEngine`
- usar `ListView` como corpo da relation
- concentrar filtros, busca, selecao e acoes no topo do proprio slot relacional
- usar acoes por linha nas colunas da lista
- usar selecao nativa do `ListView` para operacao em lote
- usar salvamento explicito quando houver mutacao em lote
- manter metricas compactas, sem cards redundantes de resumo

Proibido:

- `grade tabular legada` no `relationSlot`
- page paralela de gestao quando o fluxo puder viver na aba atual
- textos explicativos no corpo da relation
- card informativo repetindo contagem ja exibida na relation

## Matriz canonica de relacionamentos

Toda modelagem nova ou refatorada deve declarar cardinalidade explicitamente e seguir a matriz abaixo.

### 1:1

Banco:

- FK unica no lado dependente (`@unique`)
- `onDelete` definido conforme regra de negocio

UI:

- editar no formulario principal do detail (ou aba dedicada quando pesado)
- evitar relation list para 1:1

API:

- fluxo de `upsert` (criar/editar no mesmo endpoint ou mesma acao)

### 1:N

Banco:

- FK no lado `N` com indice

UI:

- pai exibe filhos em relation list canonica
- `Novo` cria filho ja vinculado ao pai
- linha abre detail do filho

API:

- criacao no lado filho com `parentId`
- listagem filtrada por `parentId`

### N:1

Banco:

- mesma estrutura de 1:N, vista pelo lado filho

UI:

- filho escolhe pai por campo de selecao no formulario principal
- link para abrir detail do pai
- nao duplicar relation list de pais no filho

API:

- atualizacao de `parentId` com validacao de permissao e integridade

### N:N

Banco:

- sempre usar entidade associativa explicita
- obrigatorio `@@unique([aId, bId])`
- indices por FK
- campos de negocio na associacao quando necessario (`status`, `role`, `startedAt`, `endedAt`, etc.)

UI:

- detail mostra lista de vinculos (nao apenas lista de entidades)
- adicionar via picker canonico
- remover/encerrar vinculo por acao explicita

API:

- endpoints de `attach`/`detach` ou `create`/`end` da associacao
- operacao de attach idempotente (nao cria duplicidade de vinculo)

## Regras de modelagem futura

Obrigatorio em qualquer novo modulo:

- declarar cardinalidade de cada relacao no contrato do modulo
- declarar ownership da relacao (quem cria, quem encerra, quem consulta)
- definir semantica de exclusao (`cascade`, `restrict`, `setNull`)
- definir auditoria minima de vinculo para relacoes sensiveis
- centralizar labels e textos reutilizaveis em constantes de modulo quando aplicavel
- corrigir acentuacao e bloquear texto corrompido na UI

Proibido:

- N:N implicito sem entidade associativa quando houver estado de negocio
- 1:1 modelado como lista sem necessidade real
- fluxo relacional em tela paralela fora do shell canonico
- aba lateral com comentarios/tags/anexos/notas sem backend ou persistencia real
- texto explicativo espalhado em `main`, `side` ou `relations`
- `grade tabular legada` no fluxo canonico ativo de modulos
- `renderizador legado de formularios` no fluxo canonico ativo de modulos
- modulo removido em navegacao, filtro, seletor, relation ou regra ativa de modulo canonico

## Legados obrigatorios a eliminar

Para liberar o `Marco Zero 1.0`, estes residuos precisam sair do fluxo canonico ativo:

- `grade tabular legada`: substituir por `ListView` em list, detail e relation
- `renderizador legado de formularios`: substituir por formulario principal canonico dentro de `DetailShellEngine`
- modulo removido: excluir do fluxo institucional ativo sem compatibilidade permanente

## Plano operacional de fechamento (5 dias)

### Dia 1: contrato fechado

- publicar contrato `Marco Zero 1.0`
- expandir checklist para aceite auditavel (`passa/falha`, dono, evidencia)
- fechar regras sem ambiguidade para list, detail, side, relations e cardinalidade

### Dia 2: inventario total

- auditar 100% das telas por modulo
- classificar: aderente, aderente com ajuste, fora do padrao, legado a remover
- gerar backlog ordenado por severidade

### Dia 3: endurecimento da plataforma

- reforcar validadores de contrato e smoke
- bloquear novos desvios estruturais
- consolidar starter canonico para novos modulos

### Dia 4: canonizacao dos modulos prioritarios

- executar refatoracao na ordem institucional:
  1. `PeopleGroup`
  2. `Project`
  3. `ProjectGroup`
  4. `Action`
- alinhar modulos operacionais restantes ao mesmo shell e matriz relacional

### Dia 5: fechamento 1.0

- revisao final por checklist
- execucao de smoke, lint, build frontend e backend
- validacao manual guiada das telas principais
- destino explicito para qualquer item remanescente

## Status de liberacao em 2026-04-07

- decisao: `APROVADO_COM_RISCO_DOCUMENTADO`
- frontend validado com `npm run lint` e `npm run build`
- backend validado com `npm run build`
- banco validado com `npm run db:migrate:status` e `SHADOW_DATABASE_URL` configurado
- busca no repositorio sem ocorrencias nominais dos componentes legados removidos
- backlog global de `lint` backend ficou registrado como debito transversal `pos_1_0`, sem bloquear o contrato canonico 1.0

## Gates obrigatorios de qualidade

Para liberar marco zero 1.0:

- checklist canonico sem falhas criticas
- matriz de aderencia atualizada e assinada
- smoke de contratos aprovado
- `lint` e `build` de frontend aprovados
- `build` backend aprovado
- banco validado com schema e migracoes atualizados
- `lint` backend do escopo impactado aprovado ou backlog transversal `pos_1_0` documentado sem impacto no contrato canonico
- sem residuos legados no fluxo ativo canonico
- sem `grade tabular legada`, `renderizador legado de formularios` ou modulo removido visiveis no fluxo canonico ativo

## Criterio de pronto do Marco Zero 1.0

Marco zero so e considerado concluido quando:

- padrao canonico esta fechado e reutilizavel em qualquer modulo
- matriz de relacionamento esta aplicada nas relacoes ativas
- modulo novo consegue nascer sem inventar estrutura paralela
- variacoes visuais/comportamentais estao eliminadas ou formalmente removidas
- a versao resultante esta apta a ser base oficial de evolucao do produto

## Checklist oficial de aceite por modulo

Regra:

- cada item deve ser marcado como `PASSA` ou `FALHA`
- cada falha deve ter dono e prazo
- cada item deve ter evidencia objetiva (arquivo, rota, print, log de build)

### Cabecalho de auditoria

- Modulo:
- Responsavel:
- Data:
- Versao alvo:
- Status geral: `PASSA` ou `FALHA`

### 1. Estrutura de list

- [ ] `PASSA` usa `RecordListHost`
- [ ] `PASSA` possui acao `Novo` quando permitido
- [ ] `PASSA` usa `SearchPanel` padrao (sem barra paralela)
- [ ] `PASSA` `Filter` e `Group` operacionais
- [ ] `PASSA` typeviews no conjunto canonico quando aplicavel
- [ ] `PASSA` colunas base (`Tags`, `Cadastro`, `Status`) quando aplicavel

### 2. Estrutura de detail

- [ ] `PASSA` usa `DetailShellEngine`
- [ ] `PASSA` `new` e `edit` usam o mesmo formulario principal
- [ ] `PASSA` nao usa `renderizador legado de formularios` no fluxo `new/edit/detail`
- [ ] `PASSA` detail nao exibe botao `Novo`
- [ ] `PASSA` acao `Excluir` apenas quando permitida
- [ ] `PASSA` `Tags` nao sao duplicadas no corpo principal
- [ ] `PASSA` relations nao duplicam card de contagem/resumo no corpo principal

### 3. Side padrao

- [ ] `PASSA` usa `StandardDetailMetadataSide`
- [ ] `PASSA` nenhuma aba visivel fica sem operacao real
- [ ] `PASSA` `Comentarios`, `Notas internas`, `Tags` e `Anexos` so aparecem quando houver suporte funcional completo
- [ ] `PASSA` `Auditoria`, `Historico` e `Contexto` seguem comportamento canonico
- [ ] `PASSA` side nao usa texto explicativo de ajuda dentro da tela

### 4. Relations canonicas

- [ ] `PASSA` relations no rodape do detail ou aba canonica
- [ ] `PASSA` relation usa host/list padrao
- [ ] `PASSA` relation operacional usa `ListView`, nunca `grade tabular legada`
- [ ] `PASSA` filtros, selecao e acoes da relation operacional ficam no proprio slot relacional
- [ ] `PASSA` clique abre detail relacionado
- [ ] `PASSA` criar relacao usa fluxo relacional canonico
- [ ] `PASSA` nao depende de tela legada
- [ ] `PASSA` relation nao usa texto explicativo ou card de resumo duplicado

### 5. Matriz de cardinalidade

- [ ] `PASSA` cada relacao declara cardinalidade (`1:1`, `1:N`, `N:1`, `N:N`)
- [ ] `PASSA` `1:1` com FK unica (`@unique`) no lado dependente
- [ ] `PASSA` `1:N` e `N:1` com FK indexada
- [ ] `PASSA` `N:N` com entidade associativa explicita e `@@unique` composto
- [ ] `PASSA` sem N:N implicito quando ha estado de negocio

### 6. Consistencia funcional

- [ ] `PASSA` labels visiveis em portugues
- [ ] `PASSA` sem erro de acentuacao ou texto corrompido
- [ ] `PASSA` sem texto tecnico para usuario final
- [ ] `PASSA` textos de orientacao migrados para `Como usar` quando necessario
- [ ] `PASSA` sem componente legado fora do shell canonico
- [ ] `PASSA` sem `grade tabular legada` no fluxo canonico ativo do modulo
- [ ] `PASSA` sem `renderizador legado de formularios` no fluxo canonico ativo do modulo
- [ ] `PASSA` sem modulo removido ou rota legada no fluxo canonico ativo

### 7. Gates tecnicos

- [ ] `PASSA` smoke de contrato de modulo
- [ ] `PASSA` lint frontend
- [ ] `PASSA` build frontend
- [ ] `PASSA` lint backend do escopo impactado ou backlog transversal `pos_1_0` documentado
- [ ] `PASSA` build backend

### Fechamento

- Pendencias abertas:
- Dono de cada pendencia:
- Prazo final:
- Decisao de liberacao 1.0: `APROVADO`, `APROVADO_COM_RISCO_DOCUMENTADO` ou `BLOQUEADO`

## Operacao da matriz de auditoria

Arquivo operacional:

- `docs/shared/marco-zero-1.0-audit-matrix.csv`

Escopos oficiais da matriz:

- `frontend_screen`
- `backend_module`
- `database_domain`

Campos obrigatorios:

- `scope`, `wave`, `module`, `feature`, `item_id`, `route_or_target`, `canonical_area`
- `status`, `severity`, `owner`, `due_date`, `evidence`, `notes`, `decision`

Regras de preenchimento:

1. `status` deve ser `PASSA`, `FALHA` ou `NA`.
1. Toda `FALHA` deve ter `severity`, `owner` e `due_date`.
1. `evidence` deve apontar evidencia objetiva (arquivo/rota/comando/PR).
1. `decision` deve ser: `corrigir_1_0`, `remover_1_0`, `isolar_legado` ou `pos_1_0`.
1. Uso ativo de `grade tabular legada`, `renderizador legado de formularios` ou modulo removido implica `FALHA`.
1. `relation operacional` fora de `ListView` implica `FALHA`.

Politica de bloqueio:

- qualquer `FALHA` critica bloqueia liberacao
- item sem `owner`, `due_date` ou `decision` bloqueia liberacao
- modulo sem checklist final bloqueia liberacao

## Plano detalhado de implementacao

### Escopo total

Frontend (modulos):

- `actions`, `core`, `deposit`, `nav`, `organization`, `pantry`, `people`, `people-groups`, `people-segments`, `person`, `programs`, `projects`, `tasks`

Backend (modulos):

- `actions`, `dashboard`, `deposit`, `pantry`, `people`, `people-groups`, `people-segments`, `permissions`, `programs`, `project-structure`, `projects`, `registration`, `roles`, `tasks`, `tenants`, `users`

### Fases de execucao

- Fase 0: baseline e governanca
- Fase 1: auditoria tecnica 100%
- Fase 2: endurecimento da plataforma canonica
- Fase 3: canonizacao por ondas

### Ondas oficiais

- `Onda A` (fundacao simples): `core`, `users`, `roles`, `permissions`, `tenants`, `registration`, `dashboard`, `tasks`
- `Onda B` (fluxo intermediario): `people-segments`, `pantry`, `deposit`, `programs`
- `Onda C` (fluxo institucional): `people`, `people-groups`, `projects`, `project-structure`, `actions`
- `Onda D` (legados e consolidacao): `person`, `organization`, `nav`
- `Onda E`: relation operacional e padrao de `actions`
- `Onda F`: residuos ativos de list/detail legados
- `Onda G`: fluxos publicos/core e features historicas
- `Onda H`: gates finais de qualidade e liberacao

Status consolidado:

- `A`, `B`, `C`, `D`, `E` fechadas em `2026-03-27`
- `F`, `G`, `H` fechadas em `2026-04-07`
