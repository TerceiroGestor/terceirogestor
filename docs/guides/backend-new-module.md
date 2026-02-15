# Backend — Como criar um novo módulo (migrations, seed e permissões)

Este guia descreve o padrão para criar um módulo novo no backend de forma **segura, auditável e previsível**.

## 1) Checklist (visão rápida)
1. Definir `moduleKey` (ex.: `tasks`)
2. Criar permissões (`tasks.read/create/update/delete`)
3. Criar models Prisma + migration
4. Criar `TasksModule` + controller/service/dtos
5. Proteger endpoints com `JwtAuthGuard` + `PermissionsGuard` + `@Permissions(...)`
6. Garantir auditoria (automaticamente via PrismaService)
7. Atualizar `seed.ts` para:
   - cadastrar permissões (se necessário)
   - incluir permissões no role Admin (e roles padrão do template, se existir)

---

## 2) Prisma (schema + migration)

1) Editar `backend/prisma/schema.prisma`:
- adicionar models
- adicionar índices/uniques
- usar `tenantId` em todas as entidades do módulo

2) Gerar migration:
```bash
cd backend
npx prisma migrate dev --name tasks
```

3) Revisar SQL:
- `backend/prisma/migrations/<timestamp>_tasks/migration.sql`

---

## 3) Permissões (RBAC)

### 3.1 Criar/registrar permissões
As permissões são chaves globais (tabela `Permission`).
Padrão:
- `tasks.read`
- `tasks.create`
- `tasks.update`
- `tasks.delete`

Onde garantir que existam:
- `backend/src/modules/permissions/required-permissions.ts` (lista do template)
- `backend/prisma/seed.ts` (garantir que a tabela `Permission` tenha essas chaves)

### 3.2 Proteger endpoints
No controller do módulo:
- `@UseGuards(JwtAuthGuard, PermissionsGuard)` no controller
- `@Permissions('tasks.read')` em `GET`
- `@Permissions('tasks.create')` em `POST`
- `@Permissions('tasks.update')` em `PATCH`
- `@Permissions('tasks.delete')` em `DELETE`

Regra: UI pode esconder, mas a segurança real está aqui.

---

## 4) Estrutura de módulo (padrão)

```
backend/src/modules/tasks/
  tasks.module.ts
  tasks.controller.ts
  tasks.service.ts
  dto/
    create-task.dto.ts
    update-task.dto.ts
    list-tasks-query.dto.ts
```

Boas práticas:
- DTOs pequenos e validados (class-validator)
- Service sem “query gigante” espalhada (se crescer, criar `repositories/`)
- Evitar transações interativas longas (Prisma timeout)

---

## 5) Seed (dados de exemplo)

Objetivos do seed:
- permitir testar UI com dados reais
- garantir permissões/roles necessários

Regras:
- seed é **dev-only**
- não rodar seed em produção

Rodar:
```bash
cd backend
npx prisma db seed
```

---

## 6) Auditoria

O projeto registra `AuditLog` automaticamente nas mutações Prisma via `PrismaService`.
Para um módulo novo:
- usar Prisma via `PrismaService` (não bypassar)
- garantir que `tenantId` está sempre presente nas queries

---

## 7) Exemplo end-to-end
Veja: `docs/examples/task-module-e2e.md`

