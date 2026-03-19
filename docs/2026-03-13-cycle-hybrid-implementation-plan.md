# Plano Tecnico de Implementacao: Cycle Global + ProjectCycle + Group Interno

> Documento superado como direcao principal pelo plano em [2026-03-13-people-unified-participation-implementation-plan.md](/c:/server/system_development/docs/2026-03-13-people-unified-participation-implementation-plan.md).

## Objetivo

Transformar a proposta de modelagem hibrida em um plano executavel sobre o schema e o frontend atuais, sem quebrar:

- o `web-client` como motor central
- os padroes canonicals definidos para lista, detail, relations e pickers
- os fluxos que ja foram centralizados em `projects`, `group` e `cycle`

Este plano parte da estrutura atual do repositorio.

## Estado atual do schema

Hoje o schema esta assim em `backend/prisma/schema.prisma`:

- `Project` possui relacoes diretas com `groups`, `cycles`, `enrollments` e `actions`
- `ProjectGroup` pertence diretamente ao `Project`
- `ProjectCycle` tambem pertence diretamente ao `Project`
- `ProjectEnrollmentCycleParticipation` aponta para `ProjectCycle` por `cycleId`
- `ProjectAction` e os servicos de `actions` trabalham com `groupId` e `cycleId` diretamente no contexto do projeto

Trecho relevante do estado atual:

- `Project`: model atual em `backend/prisma/schema.prisma`
- `ProjectGroup`: model atual em `backend/prisma/schema.prisma`
- `ProjectCycle`: model atual em `backend/prisma/schema.prisma`
- `ProjectEnrollment`: model atual em `backend/prisma/schema.prisma`
- `ProjectEnrollmentCycleParticipation`: model atual em `backend/prisma/schema.prisma`

Conclusao:

- `group` ja esta no lugar certo conceitualmente
- `cycle` ainda esta modelado como filho direto do projeto
- a migracao real precisa separar o conceito institucional de `Cycle` do uso operacional `ProjectCycle`

## Estado atual do backend

Os acoplamentos principais hoje estao em:

- `backend/src/modules/project-structure/project-structure.service.ts`
- `backend/src/modules/project-structure/project-structure.controller.ts`
- `backend/src/modules/project-structure/project-structure-catalog.controller.ts`
- `backend/src/modules/actions/actions.service.ts`

Hoje esses arquivos assumem que:

- criar ciclo = criar um `ProjectCycle` filho do projeto
- editar ciclo = editar esse registro filho
- associar matricula a ciclo = usar `setEnrollmentCycle(..., cycleId)`
- acao segmentada por ciclo = usar `projectAction.cycleId` apontando para o ciclo do projeto

## Estado atual do frontend

Os pontos mais afetados hoje sao:

- `frontend/src/modules/projects/api/project-structure.ts`
- `frontend/src/modules/projects/api/types/structure.ts`
- `frontend/src/modules/projects/config/projects-detail-layout-contract.tsx`
- `frontend/src/modules/projects/config/project-cycles-module-contract.tsx`
- `frontend/src/modules/projects/config/project-groups-module-contract.tsx`
- `frontend/src/modules/projects/features/detail/ui/projects-detail-engine-client-page.tsx`
- `frontend/src/modules/projects/features/detail/ui/project-cycles-manage-route-client-page.tsx`
- `frontend/src/modules/projects/features/detail/ui/project-groups-manage-route-client-page.tsx`
- `frontend/src/modules/projects/features/detail/ui/person-picker-dialog.tsx`
- `frontend/src/modules/projects/features/detail/ui/project-enrollment-picker-dialog.tsx`
- `frontend/src/modules/projects/features/list/ui/project-cycles-list-module-client-page.tsx`
- `frontend/src/modules/projects/features/list/ui/project-groups-list-module-client-page.tsx`
- `frontend/src/modules/projects/manifest.ts`
- `frontend/src/modules/actions/config/actions-module-contract.tsx`

Conclusao:

- `group` e `cycle` ja existem como modulos/telas canonicals
- a migracao deve preservar essa entrada pelo `web-client`
- o que muda e o significado do modulo `cycle` e da tab `projects > ciclos`

## Modelo alvo no schema

### Entidades finais

1. `Cycle`
- novo catalogo institucional global por tenant

2. `ProjectCycle`
- deixa de ser o ciclo em si
- passa a ser o vinculo entre `Project` e `Cycle`

3. `ProjectGroup`
- continua como entidade filha do projeto

4. `ProjectEnrollmentCycleParticipation`
- deixa de apontar para o ciclo operacional antigo
- passa a apontar para o vinculo `ProjectCycle`

5. `ProjectAction`
- continua podendo apontar para `groupId`
- para ciclo, deve apontar para o contexto do projeto, nao para o catalogo global puro

## Mudancas de schema recomendadas

### 1. Criar `Cycle`

Adicionar nova model institucional em `backend/prisma/schema.prisma`.

Campos recomendados:

- `id`
- `tenantId`
- `name`
- `description`
- `audienceType`
- `ageMin`
- `ageMax`
- `isActive`
- `internalNotes`
- `createdAt`
- `updatedAt`

Relacoes:

- `projectCycles ProjectCycle[]`

### 2. Remodelar `ProjectCycle`

Hoje `ProjectCycle` possui:

- `projectId`
- `name`
- `startsAt`
- `endsAt`
- `internalNotes`

Proposta:

- manter `projectId`
- remover o papel de catalogo local por `name`
- adicionar `cycleId` apontando para `Cycle`
- manter `startsAt`, `endsAt`, `status`, `capacity`, `internalNotes` como dados do vinculo
- adicionar `deletedAt` para encerramento logico do vinculo quando necessario

Resultado esperado:

- `ProjectCycle` deixa de representar "o ciclo criado no projeto"
- passa a representar "o uso de um ciclo institucional dentro do projeto"

### 3. Atualizar `ProjectEnrollmentCycleParticipation`

Hoje a model ja aponta para `ProjectCycle`, mas semanticamente esse `ProjectCycle` ainda e o ciclo local do projeto.

Com a nova modelagem:

- manter a FK, mas reinterpretar o alvo como vinculo `project + cycle`
- renomear o campo de relacao internamente so se isso trouxer clareza real; nao e obrigatorio na primeira etapa

Recomendacao pragmatica:

- manter o model `ProjectEnrollmentCycleParticipation`
- manter a FK em `projectCycleId` numa migracao de segunda fase
- fazer backfill dos ids

### 4. Revisar `ProjectAction`

Hoje o backend de `actions` usa:

- `groupId`
- `cycleId`

Com a nova modelagem:

- `groupId` continua apontando para `ProjectGroup`
- `cycleId` deve continuar significando "ciclo no contexto do projeto"
- isso pode ser mantido como FK para `ProjectCycle`, desde que o significado fique claro no codigo

Recomendacao:

- manter a ideia de acao vinculada ao ciclo no contexto do projeto
- se necessario, em fase posterior renomear semanticamente esse campo no dominio de frontend e backend

## Mudancas de backend por modulo

## Etapa A. Novo modulo institucional de `Cycle`

### Arquivos novos ou alterados

- `backend/prisma/schema.prisma`
- nova migration Prisma
- novo modulo backend dedicado, recomendado:
  - `backend/src/modules/cycles/cycles.module.ts`
  - `backend/src/modules/cycles/cycles.controller.ts`
  - `backend/src/modules/cycles/cycles.service.ts`
  - `backend/src/modules/cycles/dto/*`

### Responsabilidades

- CRUD do catalogo global de ciclos
- listagem com busca por nome, publico e faixa etaria
- detail canonical com auditoria e notas

### Motivo para modulo separado

Nao recomendamos misturar o catalogo institucional de ciclos dentro de `project-structure`, porque:

- `project-structure` hoje trata estrutura operacional do projeto
- o catalogo global e uma responsabilidade diferente

## Etapa B. Evoluir `project-structure` para trabalhar com `ProjectCycle` como vinculo

### Arquivos principais

- `backend/src/modules/project-structure/project-structure.service.ts`
- `backend/src/modules/project-structure/project-structure.controller.ts`
- `backend/src/modules/project-structure/project-structure-catalog.controller.ts`
- `backend/src/modules/project-structure/dto/create-project-cycle.dto.ts`
- `backend/src/modules/project-structure/dto/update-project-cycle.dto.ts`
- `backend/src/modules/project-structure/dto/set-enrollment-cycle.dto.ts`

### Mudancas recomendadas

1. `createCycle`
- deixa de criar um ciclo digitando `name`
- passa a criar um `ProjectCycle` a partir de `cycleId`

2. `listProjectCycles`
- deve retornar dados combinados:
  - dados do vinculo `ProjectCycle`
  - dados do catalogo `Cycle`

3. `updateCycle`
- passa a editar apenas campos do vinculo
- nao deve editar o ciclo institucional global

4. `deleteCycle`
- deve preferir encerramento logico do vinculo, quando fizer sentido historico

5. `setEnrollmentCycle`
- continua existindo, mas agora valida contra o `ProjectCycle` vinculado ao projeto

## Etapa C. Adaptar `actions`

### Arquivos principais

- `backend/src/modules/actions/actions.service.ts`
- `backend/src/modules/actions/dto/create-project-action.dto.ts`
- `backend/src/modules/actions/dto/update-project-action.dto.ts`
- `backend/src/modules/actions/dto/list-project-actions-query.dto.ts`

### Mudancas recomendadas

1. Validacoes
- `ensureCycleBelongsToProject` deve validar o vinculo `ProjectCycle`

2. Filtros de listagem
- filtros por ciclo continuam existindo
- semanticamente passam a ser filtros por ciclo habilitado no projeto

3. Segmentacao de publico
- ao buscar participantes de uma acao, a verificacao de participacao por ciclo deve continuar usando a participacao ativa no `ProjectCycle`

### Impacto importante

`actions` ja esta perto do desenho alvo.
O maior trabalho nao esta no modulo de acoes em si, mas em garantir que o `cycleId` usado nele continue representando o contexto correto.

## Mudancas de frontend por modulo

## Etapa 1. Consolidar `/cycle` como modulo institucional

### Arquivos principais

- `frontend/src/modules/projects/config/project-cycles-module-contract.tsx`
- `frontend/src/modules/projects/features/list/ui/project-cycles-list-module-client-page.tsx`
- `frontend/src/app/[tenant]/(modules)/cycle/page.tsx`
- `frontend/src/modules/projects/manifest.ts`

### Direcao recomendada

O ideal e desatrelar esse modulo da semantica de "ciclos do projeto".

Opcoes:

1. Curto prazo:
- reaproveitar esses arquivos e mudar a semantica do modulo para catalogo global

2. Melhor medio prazo:
- criar um modulo proprio `frontend/src/modules/cycles/*`
- deixar `projects/*` apenas com o que e contextual ao projeto

Minha recomendacao:

- criar um modulo novo `cycles`
- evitar manter o catalogo global dentro de `modules/projects`

## Etapa 2. Mudar `projects > ciclos` para vinculo, nao catalogo local

### Arquivos principais

- `frontend/src/modules/projects/config/projects-detail-layout-contract.tsx`
- `frontend/src/modules/projects/features/detail/ui/projects-detail-engine-client-page.tsx`
- `frontend/src/modules/projects/features/detail/ui/project-cycles-manage-route-client-page.tsx`
- `frontend/src/modules/projects/api/project-structure.ts`
- `frontend/src/modules/projects/api/types/structure.ts`

### Mudanca de UX

Hoje:

- `Adicionar ciclo` cria um ciclo local do projeto

Alvo:

- `Adicionar ciclo` abre dialog com modulo `cycle` em `table-view`
- cada row adiciona um ciclo institucional ao projeto
- o dialog nao fecha automaticamente
- a tab lista `ProjectCycle`
- a row abre o `detail` do vinculo `ProjectCycle`

### Canonical que precisa ser preservado

- tab de relacao com toolbar compacta
- search com lupa e `Pesquisar`
- search filtrando todas as colunas visiveis
- picker em `table-view`, nunca `DataTable`
- `detail` do `ProjectCycle` com side, auditoria, anotacoes e relation/tab de participantes

## Etapa 3. Manter `group` como esta, com pequenos ajustes semanticos

### Arquivos principais

- `frontend/src/modules/projects/config/project-groups-module-contract.tsx`
- `frontend/src/modules/projects/features/detail/ui/project-groups-manage-route-client-page.tsx`
- `frontend/src/modules/projects/features/list/ui/project-groups-list-module-client-page.tsx`

### Direcao

`group` esta conceitualmente correto.
O foco aqui e apenas garantir compatibilidade com o novo `ProjectCycle`, especialmente quando `actions` ou filtros cruzarem grupo e ciclo.

## Etapa 4. Ajustar `actions` no frontend

### Arquivos principais

- `frontend/src/modules/actions/config/actions-module-contract.tsx`
- `frontend/src/modules/actions/api/*`
- telas de create/detail/list de `actions`

### Mudancas recomendadas

- labels e filtros devem deixar claro que o ciclo e do contexto do projeto
- selects de ciclo devem listar os `ProjectCycle` do projeto
- se fizer sentido, exibir tambem o nome do ciclo institucional junto do contexto do projeto

Exemplo:

- `C1 Manha`
- `Familiares`

ou

- `C1 Manha - Projeto Esperanca`

dependendo da necessidade visual

## Ordem segura de migracao no schema e no codigo

### Fase 1. Introduzir `Cycle` global sem quebrar o atual

Entregas:

- nova model `Cycle`
- novo modulo backend `cycles`
- novo modulo frontend `/cycle` canonical
- sem desligar ainda a criacao atual de `ProjectCycle`

Risco:

- baixo

### Fase 2. Permitir `ProjectCycle` vinculado a `Cycle`

Entregas:

- adicionar `cycleId` em `ProjectCycle`
- adaptar DTOs e servico de `project-structure`
- permitir adicionar ciclo ao projeto por selecao

Risco:

- medio

### Fase 3. Backfill dos ciclos existentes

Entregas:

- script de migracao criando `Cycle` globais a partir dos `ProjectCycle` atuais
- criar os vinculos corretos
- evitar duplicacao por `tenantId + normalizedName`

Risco:

- medio, porque precisa de regra de deduplicacao

Status em 13/03/2026:

- concluida
- script criado em `backend/scripts/backfill-project-cycle-catalog.js`
- comando do projeto disponivel em `backend/package.json` como `npm run project-cycles:backfill-catalog`
- regra aplicada:
  - normalizar nome por `tenantId`
  - remover acentos
  - comparar em lowercase
  - colapsar espacos
- resultado validado no ambiente atual:
  - `1` `ProjectCycle` legado sem catalogo
  - `1` `Cycle` global criado
  - `1` `ProjectCycle` vinculado
  - reexecucao em `--dry-run` retornando `0` pendencias

### Fase 4. Migrar o frontend de `projects > ciclos`

Entregas:

- picker canonical com o modulo `cycle`
- detail canonical do vinculo `ProjectCycle`
- tab de participantes do ciclo preservada

Risco:

- medio

Status em 13/03/2026:

- concluida
- `projects > ciclos` usa picker canonical com `table-view` do catalogo global
- o dialog nao fecha automaticamente ao adicionar
- a row da tab abre o `detail` do vinculo `ProjectCycle`
- o `detail` do vinculo passou a explicitar:
  - ciclo institucional
  - publico
  - faixa etaria
  - participantes do ciclo no contexto do projeto
- a rota analitica `/project-cycle` foi alinhada para listar vinculos de ciclo, nao ciclos locais do projeto

### Fase 5. Migrar `actions`

Entregas:

- filtros e forms usando o novo significado de ciclo
- validacoes do backend revisadas

Risco:

- medio/alto, porque impacta regra de segmentacao

Status em 13/03/2026:

- concluida
- backend de `actions` continua validando `cycleId` contra `ProjectCycle`
- respostas de `actions` agora retornam o ciclo com dados do catalogo institucional quando existirem
- busca textual de `actions` passou a considerar tambem:
  - nome do ciclo institucional
  - publico do ciclo institucional
- frontend de `actions` foi alinhado para exibir:
  - ciclo institucional como nome principal
  - vinculo do ciclo no projeto como contexto secundario
  - selects e filtros usando o ciclo no contexto do projeto

### Fase 6. Remover o modelo legado de ciclo local digitado no projeto

Entregas:

- encerrar endpoints e DTOs legados
- remover campos e comportamentos que tratavam `ProjectCycle` como catalogo local

Risco:

- so deve acontecer depois de validacao funcional

## Script e estrategia de dados

### Backfill recomendado

Para cada `ProjectCycle` atual:

1. normalizar `name`
2. procurar `Cycle` global do mesmo tenant com nome equivalente
3. se nao existir, criar
4. vincular o `ProjectCycle` existente a esse `Cycle`
5. manter participacoes e actions apontando para o mesmo `ProjectCycle`

Vantagem:

- evita migracao agressiva de participacoes numa primeira etapa
- preserva ids operacionais do contexto do projeto

## Decisoes de UX ja fixadas que devem ser preservadas

Durante toda a migracao, o frontend deve seguir o canonical atual:

- rota principal de modulo em `table-view`
- search principal cobrindo todas as colunas visiveis
- placeholder `Pesquisar`
- icone de lupa
- relation toolbar compacta
- relation search com total filtrado inline
- row action para `detail`
- `detail` com formulario completo
- labels visiveis nos campos
- side com auditoria e anotacoes quando aplicavel
- pickers de associacao em dialog com `table-view`
- dialogs de associacao nao fecham automaticamente quando o fluxo natural for adicionar varios itens
- memberships com encerramento logico e preservacao de historico

## Primeiros arquivos a mudar

Se formos executar essa migracao agora, a ordem tecnica recomendada de trabalho e:

1. `backend/prisma/schema.prisma`
2. novo modulo backend `backend/src/modules/cycles/*`
3. `backend/src/modules/project-structure/project-structure.service.ts`
4. `backend/src/modules/actions/actions.service.ts`
5. `frontend/src/modules/projects/api/project-structure.ts`
6. `frontend/src/modules/projects/api/types/structure.ts`
7. novo modulo frontend `frontend/src/modules/cycles/*`
8. `frontend/src/modules/projects/config/projects-detail-layout-contract.tsx`
9. `frontend/src/modules/projects/features/detail/ui/project-cycles-manage-route-client-page.tsx`
10. `frontend/src/modules/actions/config/actions-module-contract.tsx`

## Recomendacao final

O melhor caminho para o repositorio atual e:

- criar `Cycle` global como novo catalogo institucional
- reinterpretar `ProjectCycle` como vinculo entre projeto e ciclo
- manter `Group` interno ao projeto
- preservar `ProjectEnrollment` como matricula explicita
- adaptar `actions` para continuar trabalhando com ciclo no contexto do projeto

Esse caminho aproveita bem a estrutura atual, minimiza reescrita desnecessaria e continua compativel com o motor canonical do frontend que estamos consolidando no `web-client`.
