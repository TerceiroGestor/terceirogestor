# Web Client Standard Metadata

## Objetivo

Padronizar capacidades transversais de detalhe para qualquer modulo do sistema, evitando que cada dominio implemente sua propria variacao de:

- auditoria
- notas internas
- comentarios
- tags
- anexos
- media
- contexto
- historico relacional

## Separacao recomendada

### Metadata transversal

Esses recursos devem ser reutilizaveis por qualquer entidade baseada em `entityType + entityId`:

- `audit`
- `internal_notes`
- `comments`
- `tags`
- `attachments`
- `media`

### Apresentacao transversal

Esses recursos nao precisam ser uma entidade separada, mas devem ter contrato comum no `web-client`:

- `context summary`
- `summary metrics`
- `related history`

### Dominio especifico

Esses recursos continuam pertencendo ao modulo:

- checklist, subtarefas e dependencias
- matriculas, participantes, grupos, ciclos e acoes
- movimentacoes de estoque
- relacoes familiares, saude, financeiro, escolaridade

## Contrato introduzido

Os tipos centrais foram preparados em `frontend/src/web-client/registry/types.ts`:

- `DetailCommentUser`
- `DetailCommentItem`
- `DetailCommentDraft`
- `DetailContextItem`
- `DetailSummaryMetric`
- `DetailHistoryItem`
- `DetailAttachmentItem`
- `DetailMetadataPermissions`
- `StandardDetailMetadataConfig`

Tambem foram adicionados:

- feature flags: `comments`, `tags`, `attachments`, `media`, `history`, `context`
- query adapters opcionais: `commentsDataProvider`, `tagsDataProvider`, `attachmentsDataProvider`, `historyDataProvider`

## Componente base

Foi criado `frontend/src/web-client/detail/StandardDetailMetadataSide.tsx`.

Ele organiza o side slot em abas padrao:

- `Atividades`
- `Comentarios`
- `Notas internas`
- `Tags`
- `Anexos`
- `Historico`
- `Contexto`

Esse componente nao substitui os modulos automaticamente ainda. Ele serve como camada de convergencia para migracao gradual.

## Ordem recomendada de implementacao

1. Migrar `tasks` para usar `StandardDetailMetadataSide` como modulo piloto.
2. Extrair backend generico para `comments`, `notes`, `tags` e `attachments`.
3. Definir permissoes padrao por modulo:
   - `module.audit.read.own`
   - `module.audit.read.all`
   - `module.notes.read`
   - `module.notes.write`
   - `module.comments.read`
   - `module.comments.write`
   - `module.tags.read`
   - `module.tags.write`
   - `module.attachments.read`
   - `module.attachments.write`
4. Migrar `people`, `projects`, `programs`, `cycles`, `people-segments` e `pantry`.

## Observacoes importantes

- `Auditoria` e `Historico` nao sao a mesma coisa.
- `Notas internas` nao devem ser tratadas como campo publico comum.
- `Comentarios` devem ter controle de acesso por contexto de trabalho.
- `Tags` devem ser compartilhadas para busca e organizacao, mas com permissao de escrita separada.
- `Anexos` e `Media` podem compartilhar infraestrutura, mas precisam de politicas diferentes de visibilidade.
