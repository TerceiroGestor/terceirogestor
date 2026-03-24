# Modulo Deposit Canonico

## Objetivo

Criar um novo modulo chamado `Deposit` para controlar objetos em geral, seguindo exatamente o padrao canonico do projeto:

- rota principal `/Deposit`
- botao `Novo`
- `Detail` como centro de cadastro e gestao do item
- `sideSlot` padrao com metadata
- `footer relations` com listas relacionais que abrem detail

O modulo cobre objetos nao alimentares, como:

- material escolar
- brinquedo
- roupa
- material de oficina
- mobiliario leve
- utensilios
- equipamentos simples
- itens diversos

## Decisao de nomenclatura

Minha recomendacao para evitar retrabalho futuro:

- nome publico e rota: `Deposit`
- nome tecnico no backend/frontend: `storage`
- nome de permissao: `storage.read`, `storage.create`, `storage.update`, `storage.delete`

Motivo:

- o usuario entende `Deposit`
- o codigo fica pronto para crescer sem acoplar a uma categoria especifica
- permite evoluir depois para Deposits diferentes sem quebrar o dominio

Exemplos futuros:

- Deposit pedagogico
- Deposit patrimonial
- Deposit institucional
- Deposit de oficinas

## Visao de produto

O `Deposit` e conceitualmente o parente direto do `pantry`, mas com regras de dominio mais amplas.

Enquanto `pantry` trabalha com alimentos e validade, `Deposit` trabalha com objetos fisicos em geral e precisa responder:

- o que entrou
- em qual setor foi armazenado
- quanto ainda existe
- o que saiu
- para onde foi
- se a saida precisa retornar
- quais lotes foram consumidos

O modulo precisa permitir:

- registrar um novo objeto
- registrar entradas com quantidade e setor/local armazenado
- registrar saidas com destino
- distinguir saida temporaria (`emprestimo`) de saida definitiva (`remocao final`)
- permitir retorno ao lote/origem, como hoje ja acontece no `pantry`
- manter rastreabilidade operacional e auditoria funcional

## Escopo funcional

### O que entra na primeira versao

- cadastro de objeto
- cadastro de setores
- entrada de lote
- saida com destino
- saida do tipo emprestimo
- retorno de emprestimo
- estorno de entrada
- estorno de saida
- comentarios
- anexos
- tags
- notas internas
- auditoria
- historico

### O que fica fora da primeira versao

- controle patrimonial com tombamento formal
- manutencao preventiva
- serializacao obrigatoria por unidade
- reserva futura
- workflow de aprovacao
- assinatura de recebimento
- multi-Deposit

Esses pontos podem vir depois sem quebrar a base proposta aqui.

## Modelo conceitual

### 1. Item

Representa o objeto catalogado no Deposit.

Campos base recomendados:

- `id`
- `tenantId`
- `name`
- `category`
- `subtype`
- `defaultSectorId`
- `unit`
- `minStock`
- `description`
- `tags`
- `internalNotes`
- `createdAt`
- `updatedAt`

Campos derivados:

- `stock`
- `entriesTotal`
- `exitsTotal`
- `lastEntryDate`
- `lastExitDate`
- `lastMovementDate`
- `isBelowMin`
- `status`

### 2. Sector

Representa o local de armazenamento.

Campos:

- `id`
- `tenantId`
- `name`
- `description`
- `isActive`
- `createdAt`
- `updatedAt`

### 3. Entry

Representa entrada de um lote no Deposit.

Campos:

- `id`
- `tenantId`
- `itemId`
- `sourceType`
- `sourceName`
- `sectorId`
- `quantity`
- `unit`
- `entryDate`
- `notes`
- `tags`
- `internalNotes`
- `reversalOfExitId`
- `createdAt`
- `updatedAt`

Observacoes:

- diferente de `pantry`, validade nao e obrigatoria
- se houver necessidade futura, pode existir `conditionStatus`
- se houver necessidade futura, pode existir `serialBatch`

### 4. Exit

Representa saida do Deposit.

Campos:

- `id`
- `tenantId`
- `itemId`
- `sectorId`
- `quantity`
- `unit`
- `exitDate`
- `type`
- `destinationType`
- `destinationName`
- `expectedReturnDate`
- `returnedAt`
- `notes`
- `tags`
- `internalNotes`
- `reversalOfEntryId`
- `createdAt`
- `updatedAt`

Tipos de saida recomendados:

- `LOAN`
- `FINAL_REMOVAL`
- `DONATION`
- `TRANSFER`
- `LOSS`
- `CORRECTION`

### 5. Exit Allocation

Mesma ideia do `pantry`: controla quais lotes foram consumidos por uma saida.

Campos:

- `id`
- `tenantId`
- `exitId`
- `entryId`
- `quantity`
- `createdAt`

Isso e importante para:

- retorno de emprestimo
- estorno
- rastreabilidade
- visualizacao de saldo real por lote

### 6. Metadata transversal

Cada entidade principal deve suportar:

- comentarios
- anexos
- tags
- notas internas
- auditoria
- historico

Entidades alvo:

- `StorageItem`
- `StorageEntry`
- `StorageExit`

## Taxonomia recomendada

### Categorias iniciais

Sugestao inicial controlada:

- `SCHOOL_SUPPLY`
- `TOY`
- `CLOTHING`
- `WORKSHOP_MATERIAL`
- `FURNITURE`
- `UTENSIL`
- `HYGIENE_ITEM`
- `ELECTRONIC`
- `OTHER`

### Tipos de destino

Sugestao inicial:

- `PERSON`
- `GROUP`
- `PROJECT`
- `WORKSHOP`
- `SECTOR`
- `DONATION`
- `DISPOSAL`
- `OTHER`

### Tipos de origem

Sugestao inicial:

- `PURCHASE`
- `DONATION`
- `TRANSFER`
- `RETURN`
- `CORRECTION`
- `OTHER`

## UX canonica do modulo

### Rota principal

`/Deposit`

Funcao:

- listar itens do Deposit
- buscar
- agrupar
- filtrar
- abrir detail do item
- criar novo item

Colunas base obrigatorias:

- `Objeto`
- `Tags`
- `Cadastro`
- `Status`

Colunas de dominio recomendadas:

- `Categoria`
- `Setor`
- `Saldo`
- `Unidade`
- `Minimo`
- `Ultimo movimento`

Views recomendadas:

- `list`
- `timeline`
- `calendar`
- `graph`

Se a Gantt nao trouxer valor real para item de Deposit, nao precisa existir na primeira versao.

### Detail do item

`/Deposit/items/[id]`

Funcao:

- editar cadastro do objeto
- ver entradas
- ver saidas
- ver historico operacional
- criar entrada
- criar saida

SideSlot obrigatorio:

- `Auditoria`
- `Comentarios`
- `Notas internas`
- `Tags`
- `Anexos`
- `Historico`
- `Contexto`

Footer relations:

- `Entradas`
- `Saidas`
- `Historico`

### Detail de entrada

`/Deposit/entries/[id]`

Funcao:

- editar dados da entrada
- ver saidas vinculadas
- criar nova saida relacionada

Footer relation:

- `Saidas vinculadas`

### Detail de saida

`/Deposit/exits/[id]`

Funcao:

- editar dados da saida
- ver lotes vinculados
- controlar retorno

Footer relation:

- `Lotes vinculados`

## Regras de negocio

### Regra 1. Saida por emprestimo

- exige `destinationType`
- exige `destinationName`
- pode exigir `expectedReturnDate`
- pode ser devolvida depois
- devolucao cria `Entry` de retorno referenciando a `Exit`

### Regra 2. Saida definitiva

- exige destino
- nao gera expectativa de retorno

### Regra 3. Retorno

- cria entrada de retorno
- referencia `reversalOfExitId`
- deve preservar setor/origem quando fizer sentido
- deve registrar no historico que houve retorno do emprestimo

### Regra 4. Estorno

- igual ao `pantry`
- `Entry` pode ser revertida criando `Exit` de correcao
- `Exit` pode ser revertida criando `Entry` de correcao

### Regra 5. Saldo

- saldo do item e soma das entradas menos soma das saidas efetivas
- emprestimo reduz saldo enquanto o item estiver fora
- retorno recompÃµe o saldo

### Regra 6. Destino e obrigatoriedade

- toda saida deve informar um destino
- `destinationType` e obrigatorio
- `destinationName` pode ser derivado do relacionamento quando o destino for relacional

## Permissoes recomendadas

### Permissoes minimas

- `storage.read`
- `storage.create`
- `storage.update`
- `storage.delete`

### Permissoes de metadata

- `storage.comments.read`
- `storage.comments.write`
- `storage.tags.read`
- `storage.tags.write`
- `storage.attachments.read`
- `storage.attachments.write`
- `storage.notes.read`
- `storage.notes.write`
- `storage.audit.read.own`
- `storage.audit.read.all`

### Estrategia segura para primeira entrega

Se quiser manter o mesmo padrao dos modulos atuais e reduzir custo inicial:

- usar so `storage.read/create/update/delete`
- controlar metadata e auditoria com `storage.read` e `storage.update`
- deixar a malha fina de permissao para segunda etapa

## Estrutura tecnica recomendada

### Backend

Criar modulo `storage`.

Estrutura sugerida:

```text
backend/src/modules/storage/
  storage.module.ts
  storage.controller.ts
  storage.service.ts
  dto/
    create-storage-item.dto.ts
    update-storage-item.dto.ts
    create-storage-entry.dto.ts
    update-storage-entry.dto.ts
    create-storage-exit.dto.ts
    update-storage-exit.dto.ts
    reverse-storage-movement.dto.ts
    list-storage-items-query.dto.ts
```

Entidades Prisma:

- `StorageItem`
- `StorageSector`
- `StorageEntry`
- `StorageExit`
- `StorageExitAllocation`
- `StorageItemComment`
- `StorageItemAttachment`
- `StorageEntryComment`
- `StorageEntryAttachment`
- `StorageExitComment`
- `StorageExitAttachment`

Endpoints recomendados:

- `GET /storage/items`
- `POST /storage/items`
- `GET /storage/items/:id`
- `PATCH /storage/items/:id`
- `DELETE /storage/items/:id`
- `GET /storage/items/:id/audit`
- `POST /storage/items/:id/comments`
- `DELETE /storage/items/:id/comments/:commentId`
- `POST /storage/items/:id/attachments`
- `DELETE /storage/items/:id/attachments/:attachmentId`

- `GET /storage/entries`
- `POST /storage/entries`
- `GET /storage/entries/:id`
- `PATCH /storage/entries/:id`
- `DELETE /storage/entries/:id`
- `GET /storage/entries/:id/audit`
- `POST /storage/entries/:id/comments`
- `DELETE /storage/entries/:id/comments/:commentId`
- `POST /storage/entries/:id/attachments`
- `DELETE /storage/entries/:id/attachments/:attachmentId`
- `POST /storage/entries/:id/reverse`

- `GET /storage/exits`
- `POST /storage/exits`
- `GET /storage/exits/:id`
- `PATCH /storage/exits/:id`
- `DELETE /storage/exits/:id`
- `GET /storage/exits/:id/audit`
- `POST /storage/exits/:id/comments`
- `DELETE /storage/exits/:id/comments/:commentId`
- `POST /storage/exits/:id/attachments`
- `DELETE /storage/exits/:id/attachments/:attachmentId`
- `POST /storage/exits/:id/reverse`

- `GET /storage/sectors`
- `POST /storage/sectors`
- `PATCH /storage/sectors/:id`
- `GET /storage/history`
- `GET /storage/summary`

### Frontend

Seguir a mesma arquitetura de `pantry`, sem voltar para formas legadas:

- contracts em `modules/storage/config`
- APIs em `modules/storage/api`
- `ScreenHost` no app router
- `DetailShellEngine`
- `StandardDetailMetadataSide`
- `RelationListHost` nas relations do footer
- `RecordListHost` na rota principal

Estrutura sugerida:

```text
frontend/src/modules/storage/
  manifest.ts
  api/
  config/
  features/
    list/
    detail/
    items/
    entries/
    exits/
  shared/
```

Rotas:

- `/Deposit`
- `/Deposit/items/new`
- `/Deposit/items/[id]`
- `/Deposit/entries/new`
- `/Deposit/entries/[id]`
- `/Deposit/exits/new`
- `/Deposit/exits/[id]`
- `/Deposit/history`

## Espelhamento recomendado a partir de pantry

O caminho mais rapido e seguro e clonar a espinha dorsal de `pantry` e adaptar o dominio.

### O que reaproveitar quase 1:1

- setor
- item
- entry
- exit
- allocation
- estorno
- metadata do sideSlot
- comments com mencao por `@`
- anexos com autosave guard
- historico
- search views
- registry
- smoke pattern

### O que precisa mudar de verdade

- remover semantica de alimento
- remover validade obrigatoria
- trocar doador por origem
- adicionar destino nas saidas
- adicionar tipo da saida
- adicionar retorno de emprestimo
- trocar nomes publicos para Deposit/objeto/entrada/saida

## Ordem de implementacao sem parar

### Etapa 1. Definir o dominio

1. Confirmar nome tecnico `storage` e nome publico `Deposit`.
2. Confirmar categorias iniciais.
3. Confirmar tipos de saida.
4. Confirmar tipos de destino.
5. Confirmar se a primeira versao tera cadastro proprio de origem.

Decisao recomendada:

- sem cadastro proprio de origem na V1
- usar `sourceType` + `sourceName`

### Etapa 2. Criar fundacao de banco

1. Adicionar models no `schema.prisma`.
2. Adicionar relacoes em `Tenant` e `User`.
3. Criar indices por `tenantId`, `itemId`, `sectorId`, datas e status.
4. Gerar migration.
5. Revisar SQL manualmente.

### Etapa 3. Criar permissoes

1. Registrar `storage.read/create/update/delete`.
2. Adicionar no seed.
3. Garantir que Admin recebe essas permissoes.

### Etapa 4. Criar modulo backend

1. Criar `storage.module.ts`.
2. Criar DTOs.
3. Criar `storage.service.ts`.
4. Criar `storage.controller.ts`.
5. Proteger endpoints com guard e `@Permissions(...)`.
6. Reaproveitar padrao de auditoria automatica ja existente.

### Etapa 5. Implementar item

1. `listItems`
2. `getItem`
3. `createItem`
4. `updateItem`
5. `deleteItem`
6. `listItemAudit`
7. `comments`
8. `attachments`

### Etapa 6. Implementar setores

1. `listSectors`
2. `upsertSector`
3. manter simples e leve

### Etapa 7. Implementar entrada

1. `listEntries`
2. `getEntry`
3. `createEntry`
4. `updateEntry`
5. `deleteEntry`
6. `reverseEntry`
7. `comments`
8. `attachments`

### Etapa 8. Implementar saida

1. `listExits`
2. `getExit`
3. `createExit`
4. `updateExit`
5. `deleteExit`
6. `reverseExit`
7. `comments`
8. `attachments`

Regras obrigatorias nesta etapa:

- selecionar lote especifico ou alocacao automatica
- exigir destino
- permitir `LOAN`
- permitir retorno

### Etapa 9. Uploads

1. Criar endpoint `POST /files/storage-attachments`
2. reaproveitar o mesmo padrao de `pantry`
3. garantir retorno com metadados completos do arquivo

### Etapa 10. API frontend

1. Criar tipos em `frontend/src/modules/storage/api/types/*`
2. Criar requests de items
3. Criar requests de entries
4. Criar requests de exits
5. Criar requests de sectors
6. Criar upload helper

### Etapa 11. Registro do modulo no frontend

1. Criar `manifest.ts`
2. Criar `storage-module-contract.tsx`
3. Criar `searchViews/storage.ts`
4. Registrar actions no `registry`
5. Registrar search views no `registry`
6. Registrar modulo no catalogo lateral

### Etapa 12. List principal canonico

1. Criar `/Deposit` com `RecordListHost`
2. colunas base obrigatorias:
   - `Objeto`
   - `Tags`
   - `Cadastro`
   - `Status`
3. adicionar colunas de dominio
4. ligar agrupamento
5. ligar filtros
6. ligar views analiticas que fizerem sentido

### Etapa 13. Detail do item canonico

1. criar `/Deposit/items/new`
2. criar `/Deposit/items/[id]`
3. garantir que `Novo` abre o detail
4. remover qualquer `FormEngine` legado
5. usar `StandardDetailMetadataSide`
6. montar footer relations

### Etapa 14. Detail de entrada canonico

1. criar `/Deposit/entries/new`
2. criar `/Deposit/entries/[id]`
3. sideSlot completo
4. relation list de saidas vinculadas

### Etapa 15. Detail de saida canonico

1. criar `/Deposit/exits/new`
2. criar `/Deposit/exits/[id]`
3. sideSlot completo
4. relation list de lotes vinculados
5. fluxo de retorno

### Etapa 16. Historico e summary

1. criar view de historico operacional
2. unificar historico e auditoria do modulo
3. criar contexto resumido no side

### Etapa 17. Canonizacao final

1. remover qualquer `create` do escopo `detail`
2. garantir botao `Novo` no list
3. garantir colunas base
4. garantir `sideSlot` padrao
5. garantir `footer relation -> detail`
6. garantir rotas somente com `ScreenHost`
7. adicionar no smoke de padronizacao

## Estrategia de execucao sem retrabalho

Como teste real da arquitetura, o melhor caminho e:

1. clonar a espinha dorsal de `pantry`
2. renomear para `storage`
3. trocar regras de dominio
4. manter o mesmo padrao canonico do `web-client`
5. revisar e reduzir o que for especifico de alimento

Isso acelera muito e ainda testa se o nosso padrao realmente esta reutilizavel.

## Arquivos que precisarao existir

### Backend

- `backend/src/modules/storage/storage.module.ts`
- `backend/src/modules/storage/storage.controller.ts`
- `backend/src/modules/storage/storage.service.ts`
- `backend/src/modules/storage/dto/*`
- `backend/prisma/migrations/<timestamp>_storage/*`

### Frontend

- `frontend/src/modules/storage/manifest.ts`
- `frontend/src/modules/storage/config/storage-module-contract.tsx`
- `frontend/src/modules/storage/config/storage-detail-layout-contract.tsx`
- `frontend/src/modules/storage/api/*`
- `frontend/src/modules/storage/features/list/ui/storage-list-module-client-page.tsx`
- `frontend/src/modules/storage/features/detail/ui/storage-item-detail-engine-client-page.tsx`
- `frontend/src/modules/storage/features/entries/ui/storage-entry-detail-engine-client-page.tsx`
- `frontend/src/modules/storage/features/exits/ui/storage-exit-detail-engine-client-page.tsx`
- `frontend/src/web-client/registry/actions/storage.tsx`
- `frontend/src/web-client/registry/searchViews/storage.ts`
- `frontend/src/app/[tenant]/(modules)/Deposit/**/page.tsx`

## Checklist de aceite

- [ ] `/Deposit` lista objetos com colunas base canonicas
- [ ] botao `Novo` abre detail do item
- [ ] detail do item centraliza o cadastro
- [ ] sideSlot completo existe no item, entrada e saida
- [ ] comments funcionam com mencao por `@`
- [ ] anexos funcionam sem refresh
- [ ] tags e notas internas persistem
- [ ] footer relations funcionam como list e abrem detail
- [ ] entrada registra lote e setor
- [ ] saida registra destino
- [ ] emprestimo permite retorno
- [ ] historico mostra operacao e entidade relacionada
- [ ] build do backend passa
- [ ] build do frontend passa
- [ ] migration aplica sem ajuste manual

## Definicao de pronto

O modulo `Deposit` estara pronto quando:

- um usuario cria um objeto em `/Deposit`
- registra entradas e saidas pelo detail
- consegue marcar emprestimo e retorno
- consegue ver auditoria, comentarios, notas internas, tags, anexos, historico e contexto
- todas as relations abrem detail
- build do backend e frontend passam
- migration aplica sem ajuste manual

## Proximo passo

Se quisermos transformar esse plano em teste real da plataforma, o melhor proximo passo e:

1. criar o modulo `storage` no backend
2. criar o modulo `Deposit` no frontend
3. subir primeiro `items -> entries -> exits`
4. fechar a canonizacao no final, igual fizemos em `pantry`

Minha recomendacao pratica:

- usar `pantry` como espinha dorsal
- nao tentar inovar na primeira passada
- fazer o primeiro corte completo e canonicamente consistente
- depois refinar o dominio de Deposit
