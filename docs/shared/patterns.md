## Pattern: Service de Subdomínio Dedicado

**Problema:**
Crescimento do service raiz com múltiplas responsabilidades, dificultando manutenção e evolução incremental.

**Solução:**
Extrair blocos de domínio (ex: patrimônio, metadata, benefícios, saúde) para services dedicados, mantendo o service raiz como fachada de delegação.

**Onde aparece no código:**
- backend/src/modules/person/application/services/person-asset-household.service.ts
- backend/src/modules/person/application/services/person-record-metadata.service.ts
- backend/src/modules/person/application/services/person-benefit-detention.service.ts
# shared/patterns.md

## Objetivo

Documentar padroes reutilizaveis identificados no codigo do projeto (frontend e backend).

---

## Pattern: DataProvider por modelo

**Problema:**

Padronizar acesso a dados para modulos diferentes sem acoplamento direto de tela para endpoint.

**Solucao:**

Usar interface unica `DataProvider` com operacoes `search`, `read`, `create`, `update` e `delete`, roteadas por chave de `model`.

**Exemplo:**

```text
createRestDataProvider({ token })
  -> switch(model)
  -> chama adapter REST do modulo
```

**Onde aparece no codigo:**

- frontend/src/web-client/data-provider/types.ts
- frontend/src/web-client/data-provider/rest/provider.ts
- frontend/src/modules/tasks/features/list/ui/tasks-list-module-client-page.tsx

---

## Pattern: TypeView orientado por contrato

**Problema:**

Cada modulo precisa alternar entre visualizacoes (List, Calendar, Graph etc.) sem reimplementar infraestrutura.

**Solucao:**

Definir views no contrato do modulo (`views[]` com `viewType`) e renderizar comportamento por estado comum de query.

**Exemplo:**

```text
moduleDefinition.views = [list, kanban, timeline, calendar, gantt, graph]
RecordListHost controla troca de view e estado compartilhado
```

**Onde aparece no codigo:**

- frontend/src/web-client/registry/types.ts
- frontend/src/web-client/record/RecordListHost.tsx
- frontend/src/modules/tasks/config/tasks-module-contract.tsx
- frontend/src/web-client/views/CalendarView.tsx
- frontend/src/web-client/views/GraphView/GraphView.tsx

---

## Pattern: DetailShell Engine (layout por slots)

**Problema:**

Telas de detalhe com estrutura repetida (header, main, tabs, side, bottom, auditoria).

**Solucao:**

Centralizar em `DetailShellEngine`, que compoe layout via contrato (`detailLayout`) e injeta `detailAudit` no contexto.

**Exemplo:**

```text
DetailShellEngine
  -> resolve slots do detailLayout
  -> integra useDetailAuditFeed
  -> renderiza DetailShell base
```

**Onde aparece no codigo:**

- frontend/src/web-client/detail/DetailShellEngine.tsx
- frontend/src/modules/tasks/features/detail/ui/tasks-detail-engine-client-page.tsx
- frontend/src/modules/tasks/features/create/ui/tasks-create-page.tsx

---

## Pattern: SideShell tabulado de metadados

**Problema:**

Metadados de detalhe (tags, notas, anexos, auditoria/comentarios) dispersos e com alto risco de duplicacao.

**Solucao:**

Usar `StandardDetailMetadataSide` como composicao de abas, com blocos padrao e comportamento configuravel por modulo.

**Exemplo:**

```text
StandardDetailMetadataSide
  tabs: tags | notes | attachments | activity | comments
```

**Onde aparece no codigo:**

- frontend/src/web-client/detail/StandardDetailMetadataSide.tsx
- frontend/src/modules/people/shared/ui/people-relation-detail-shell.tsx

---

## Pattern: Relationship Detail Module

**Problema:**

Entidades relacionais precisam de ciclo padrao de detalhe/listagem sem duplicar infraestrutura de modulo.

**Solucao:**

Gerar modulo de relacao com `defineRelationDetailModule`, usar `RelationListHost` para busca/acoes e `DetailShellEngine` para edicao.

**Exemplo:**

```text
defineRelationDetailModule(...)
  + RelationListHost
  + DetailShellEngine
```

**Onde aparece no codigo:**

- frontend/src/web-client/starter/relation-module-starter.tsx
- frontend/src/web-client/relation/RelationListHost.tsx
- frontend/src/modules/people/shared/ui/people-relation-detail-shell.tsx
- frontend/src/modules/people/shared/ui/use-people-relation-form-autosave.ts

---

## Pattern: Auditoria em duas camadas (DB + UI)

**Problema:**

Rastrear alteracoes de dados de forma consistente sem depender de implementacao manual em cada service.

**Solucao:**

Backend: auditoria automatica no `PrismaService` via extensao de operacoes (`create/update/delete/...`).
Frontend: feed de auditoria via `auditDataProvider` e componentes de detalhe.

**Exemplo:**

```text
PrismaService.$allOperations -> safeAuditLog
UI detail -> useDetailAuditFeed -> DetailAuditFeed
```

**Onde aparece no codigo:**

- backend/src/core/prisma/prisma.service.ts
- backend/src/core/audit/audit.service.ts
- backend/src/core/audit/audit.controller.ts
- frontend/src/web-client/detail/useDetailAuditFeed.ts
- frontend/src/web-client/detail/DetailAuditFeed.tsx

---

## Pattern: Controle de acesso por permissao declarativa

**Problema:**

Garantir autorizacao coerente em frontend e backend para leitura/acao por modulo.

**Solucao:**

Frontend: contrato de modulo com `permissions`/`actions` e validacao por `hasModulePermission` e `canUseModuleAction`.
Backend: decorator `@Permissions(...)` + `PermissionsGuard` consultando papeis/permissoes no banco por tenant.

**Exemplo:**

```text
Controller: @UseGuards(JwtAuthGuard, PermissionsGuard) + @Permissions("tasks.read")
Frontend: moduleDefinition.permissions + module-utils
```

**Onde aparece no codigo:**

- frontend/src/web-client/registry/module-utils.ts
- frontend/src/modules/tasks/config/tasks-module-contract.tsx
- frontend/src/web-client/screen/ScreenHost.tsx
- backend/src/core/authorization/permissions.decorator.ts
- backend/src/core/authorization/permissions.guard.ts

---

## Pattern: Tenancy por slug + tenantId em contexto

**Problema:**

Aplicacao multi-tenant precisa resolver tenant por rota e propagar contexto de forma segura para toda requisicao.

**Solucao:**

`TenancyMiddleware` resolve `/t/{slug}` para `tenantId`, reescreve rota e popula request.
`RequestContextMiddleware` e `RequestContextInterceptor` propagam `tenantId`, `userId` e metadados da requisicao via AsyncLocalStorage.

**Exemplo:**

```text
/t/{slug}/... -> resolve tenant -> req.tenantId
request-context -> tenantId/userId/requestId disponiveis na cadeia
```

**Onde aparece no codigo:**

- backend/src/core/tenancy/tenancy.middleware.ts
- backend/src/core/request-context/request-context.middleware.ts
- backend/src/core/request-context/request-context.interceptor.ts
- backend/src/app.module.ts

---

## Pattern: Database com Prisma + isolamento por tenant

**Problema:**

Manter consistencia de schema, acesso transacional e segregacao de dados por tenant em toda a aplicacao.

**Solucao:**

Usar Prisma como camada unica de persistencia (adapter Postgres), com modelos contendo `tenantId` e consultas sempre escopadas por tenant no service/controller.

**Exemplo:**

```text
PrismaService (adapter postgres)
schema com Tenant e relacoes tenantId
services: where: { tenantId, ... }
```

**Onde aparece no codigo:**

- backend/src/core/prisma/prisma-adapter.ts
- backend/src/core/prisma/prisma.service.ts
- backend/prisma/schema.prisma
- backend/src/modules/tasks/tasks.service.ts
- backend/src/modules/users/users.service.ts

---

## Pattern: Modulo backend em camadas de dominio

**Problema:**

Services grandes em modulos NestJS tendem a misturar DTO, regra de negocio, normalizacao, Prisma, resposta HTTP e compatibilidades legadas no mesmo arquivo.

**Solucao:**

Organizar o modulo backend em quatro camadas objetivas:

- `presentation`: controller e DTOs
- `application`: use cases, queries e mappers
- `domain`: constants, catalogs, normalizers, validators e policies
- `infrastructure`: persistencia e detalhes tecnicos

Extrair de forma incremental, mantendo o service principal apenas como fachada/orquestrador enquanto a transicao ainda existir.

**Exemplo:**

```text
person.controller.ts
  -> PersonService / UseCase

application/queries/person-list.query.ts
  -> buildPersonWhere
  -> buildPersonOrderBy

domain/validators/person-status.validator.ts
  -> assertDepartureReasonForStatus

application/mappers/person-persistence.mapper.ts
  -> buildCreatePersonData
  -> buildUpdatePersonData

infrastructure/persistence/person-upload-path.policy.ts
  -> centraliza compatibilidade tecnica de upload
```

**Onde aparece no codigo:**

- backend/src/modules/person/application/queries/person-list.query.ts
- backend/src/modules/person/application/mappers/person-persistence.mapper.ts
- backend/src/modules/person/application/mappers/person-contact-persistence.mapper.ts
- backend/src/modules/person/domain/validators/person-status.validator.ts
- backend/src/modules/person/domain/validators/person-contact.validator.ts
- backend/src/modules/person/domain/normalizers/person-field.normalizer.ts
- backend/src/modules/person/domain/policies/person-relation.policy.ts
- backend/src/modules/person/infrastructure/persistence/person-upload-path.policy.ts
