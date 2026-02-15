# Exemplo end-to-end — Módulo `tasks` (backend + frontend)

Objetivo: documentar um exemplo completo de como criar um módulo novo seguindo o template.

> Este é um **exemplo didático**. Não precisa ser implementado exatamente assim, mas deve seguir o “contrato” do projeto.

---

## 1) Requisitos do módulo

Entidade `Task`:
- pertence a um tenant
- título, descrição (opcional)
- status (`OPEN | DONE`)
- responsável (opcional, `assignedToUserId`)
- datas: `createdAt`, `updatedAt`

Permissões:
- `tasks.read`
- `tasks.create`
- `tasks.update`
- `tasks.delete`

UI:
- lista (DataTable)
- criar/editar (FormEngine em Dialog/SectionDialog)
- detalhes (opcional no v1)
- auditoria: usar a timeline padrão no contexto do módulo (quando aplicável)

---

## 2) Backend (Nest + Prisma)

### 2.1 Prisma model
Em `backend/prisma/schema.prisma`:
```prisma
model Task {
  id        String   @id @default(uuid()) @db.Char(36)
  tenantId  String   @db.Char(36)
  title     String
  description String? @db.Text
  status    String   @default("OPEN")
  assignedToUserId String? @db.Char(36)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])
  assignedTo User? @relation(fields: [assignedToUserId], references: [id])

  @@index([tenantId])
  @@index([status])
  @@index([createdAt])
}
```

Gerar migration:
```bash
cd backend
npx prisma migrate dev --name tasks
```

### 2.2 Módulo
Criar:
```
backend/src/modules/tasks/
  tasks.module.ts
  tasks.controller.ts
  tasks.service.ts
  dto/
```

Controller:
- `@UseGuards(JwtAuthGuard, PermissionsGuard)`
- `@Permissions('tasks.read')` em GETs
- `@Permissions('tasks.create')` em POST
- `@Permissions('tasks.update')` em PATCH
- `@Permissions('tasks.delete')` em DELETE

Endpoints recomendados:
- `GET /t/:slug/tasks?page=&limit=&search=`
- `GET /t/:slug/tasks/:id`
- `POST /t/:slug/tasks`
- `PATCH /t/:slug/tasks/:id`
- `DELETE /t/:slug/tasks/:id`

### 2.3 Seed
Em `backend/prisma/seed.ts`:
- garantir permissões `tasks.*` na tabela `Permission`
- incluir `tasks.*` no role Admin
- criar algumas tasks de exemplo para o tenant seed

---

## 3) Frontend (Next + Modules)

### 3.1 Estrutura
Criar:
```
frontend/src/modules/tasks/
  manifest.ts
  index.ts
  api/
    index.ts
    tasks.ts
    types.ts
  features/
    list/ui/tasks-list-client-page.tsx
    form/config/task-form-config.ts
    form/ui/task-form-dialog.tsx
  shared/
    domain/tasks.constants.ts
    i18n/pt-BR.ts
```

Manifest:
- `permissions: ['tasks.read']` para aparecer no sidebar

### 3.2 Rotas (wrappers finos)
Criar rotas:
```
frontend/src/app/[tenant]/(modules)/tasks/page.tsx
```
Que renderiza:
- `<TasksListClientPage />`

### 3.3 Tela de listagem
Padrão:
- `canRead` bloqueia página
- `canCreate` controla botão “Nova task”
- `canUpdate/canDelete` controlam ações de row (editar/excluir)

Componentes recomendados:
- `DataTable` para lista
- `FormEngine` para criar/editar
- `useToast()` para feedback (sucesso/erro)
- `useConfirm()` para confirmação de delete

### 3.4 Textos/constantes
Para evitar texto espalhado:
- `shared/domain/tasks.constants.ts`: status/options/labels
- `shared/i18n/pt-BR.ts`: títulos, botões, mensagens

---

## 4) Teste final (E2E manual)
1) Reset + seed:
```bash
cd backend
npx prisma migrate reset --force
npx prisma db seed
```

2) Subir:
```bash
cd backend && npm run start:dev
cd frontend && npm run dev
```

3) Logar no tenant seed e validar:
- módulo aparece no sidebar (se tiver `tasks.read`)
- listar tasks funciona
- criar/editar/excluir respeita permissões (UI + backend)
- logs de auditoria aparecem em `Admin -> Auditoria` (para mutações)

