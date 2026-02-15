# Exemplo end-to-end — Módulo `tasks` (backend + frontend)

Objetivo: mostrar um exemplo completo de como criar um módulo novo seguindo o template **e** como evoluir esse módulo com
**features** dentro da mesma tela (overview), com filtros, gráficos e histórico (timeline).

Padrões do template:
- Estrutura e contratos: `docs/patterns.md`
- Como criar módulo: `docs/guides/backend-new-module.md` e `docs/guides/frontend-new-module.md`

---

## 1) Conceitos: módulo vs feature (como pensar)

### Módulo
Uma unidade de produto “pluggable” no template.
- tem permissões próprias (`tasks.*`)
- tem rotas próprias no frontend
- tem endpoints próprios no backend

### Feature
Uma “fatia” de funcionalidade dentro do módulo.

Exemplos de features para `tasks`:
- **overview**: cards + quick actions + gráfico + últimas tasks + timeline
- **list**: listagem completa com DataTable (filtros avançados, agrupamento, export)
- **form**: criar/editar (FormEngine)
- **history**: timeline (auditoria do módulo + filtros)
- **analytics**: relatórios/gráficos mais completos (opcional)

Regra prática:
- se será usado em vários lugares do módulo → `shared/`
- se é específico de uma tela/fluxo → `features/<featureKey>/...`

---

## 2) Requisitos do módulo

Entidade `Task`:
- pertence a um tenant
- `title` (obrigatório)
- `description` (opcional)
- `status` (`OPEN | DONE`)
- `assignedToUserId` (opcional)
- `createdAt`, `updatedAt`

Permissões:
- `tasks.read`
- `tasks.create`
- `tasks.update`
- `tasks.delete`

UI mínima (v1):
- **overview** (uma tela com o que importa)
- **criar/editar** (FormEngine)
- **lista** (DataTable) — pode ser “últimas tasks” no overview e a lista completa em uma rota separada
- **histórico/auditoria** (timeline com filtros) — pode ser um painel no overview

---

## 3) Backend (Nest + Prisma)

### 3.1 Prisma model (exemplo)
Em `backend/prisma/schema.prisma`:
```prisma
model Task {
  id        String   @id @default(uuid()) @db.Char(36)
  tenantId  String   @db.Char(36)

  title       String
  description String? @db.Text
  status      String  @default("OPEN")

  assignedToUserId String? @db.Char(36)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant     Tenant @relation(fields: [tenantId], references: [id])
  assignedTo User?  @relation(fields: [assignedToUserId], references: [id])

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

### 3.2 Controller/Service/DTOs
Estrutura recomendada:
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

Proteção (segurança real):
- `@UseGuards(JwtAuthGuard, PermissionsGuard)` no controller
- `@Permissions('tasks.read')` em GETs
- `@Permissions('tasks.create')` em POST
- `@Permissions('tasks.update')` em PATCH
- `@Permissions('tasks.delete')` em DELETE

Endpoints mínimos:
- `GET /t/:slug/tasks?page=&limit=&search=`
- `GET /t/:slug/tasks/:id`
- `POST /t/:slug/tasks`
- `PATCH /t/:slug/tasks/:id`
- `DELETE /t/:slug/tasks/:id`

### 3.3 Endpoints para “overview” (quando ficar mais robusto)
Se a overview tiver cards/gráficos, vale adicionar endpoints agregados:
- `GET /t/:slug/tasks/summary`
  - total, abertas, concluídas, atrasadas, por responsável…
- `GET /t/:slug/tasks/analytics`
  - séries prontas para gráficos (ex.: abertas x concluídas por mês)

Motivo:
- menos dados trafegados
- menos regra no frontend
- melhor performance para dashboards

### 3.4 Seed (dev)
No `backend/prisma/seed.ts`:
- garantir permissões `tasks.*` na tabela `Permission`
- incluir `tasks.*` no role Admin
- criar tasks de exemplo para o tenant seed

---

## 4) Frontend (Next + Modules)

### 4.1 Estrutura (com features)
```
frontend/src/modules/tasks/
  manifest.ts
  index.ts

  api/
    index.ts
    tasks.ts
    types.ts

  features/
    overview/
      hooks/
        use-tasks-overview-model.ts
      ui/
        tasks-overview-client-page.tsx
        sections/
          tasks-summary-cards.tsx
          tasks-quick-actions.tsx
          tasks-latest-table.tsx
          tasks-status-chart.tsx

    list/
      hooks/
        use-tasks-list-model.ts
      ui/
        tasks-list-client-page.tsx
        columns.tsx

    form/
      config/
        task-form-config.ts
      ui/
        task-form-dialog.tsx

    history/
      hooks/
        use-tasks-history-model.ts
      ui/
        tasks-history-timeline.tsx

  shared/
    domain/
      tasks.constants.ts
    i18n/
      pt-BR.ts
    ui/
      tasks-subnav.tsx
```

### 4.2 Rotas (wrappers finos)
Padrão: rotas são wiring-only.

Rota principal:
- `frontend/src/app/[tenant]/(modules)/tasks/page.tsx` → `<TasksOverviewClientPage />`

Rotas opcionais (quando o volume crescer):
- `.../tasks/list/page.tsx` → `<TasksListClientPage />`
- `.../tasks/history/page.tsx` → `<TasksHistoryTimeline />`
- `.../tasks/[id]/page.tsx` → detalhe (se fizer sentido no produto)

> Recomendações: comece com **uma rota (overview)** e só abra novas rotas quando a UX pedir.

---

## 5) Como aplicar várias funcionalidades na mesma tela (igual Pantry)

Pense na tela `/tasks` como um “dashboard do módulo” (overview).
Ela deve ser uma composição de seções pequenas, independentes e reutilizáveis.

### 5.1 Estrutura recomendada da página (para arquivos pequenos)
- `TasksOverviewClientPage` só compõe layout e passa props
- `useTasksOverviewModel` centraliza carregamento e estados (loading/error/refresh)
- `sections/*` são blocos visuais (cada um com responsabilidade única)

Exemplo de seções (inspirado no Pantry):
- **Resumo**: cards (total, abertas, concluídas, atrasadas)
- **Ações rápidas**: botão “Nova task”, “Concluir selecionadas”, “Exportar”
- **Gráfico**: “abertas x concluídas por mês”
- **Últimas tasks**: DataTable reduzida (top 20) com ações permitidas
- **Histórico**: timeline vertical com filtros (audit-logs do módulo)

### 5.2 Mesma tela, mas com “subfuncionalidades”
Você tem 3 padrões para colocar funcionalidades dentro da mesma rota:
1) **Seções empilhadas** (mais simples; ótimo para overview)
2) **Tabs/segment control** (quando são “views” do mesmo dado: resumo/detalhado)
3) **Drawer/Sheet** (para filtros avançados sem roubar espaço do conteúdo)

O Pantry é um bom exemplo de composição:
- overview mistura: cards + alertas + gráficos + tabela + timeline
- filtros ficam em drawer quando necessário

---

## 6) Filtros, gráficos e histórico (padrões de implementação)

### 6.1 Filtros (padrão para qualquer módulo)
Você tende a ter 2 níveis de filtro:
1) **Simples**: search + selects básicos no header (rápido)
2) **Avançado**: Drawer/Sheet com `FilterEngine` (quando tiver muitos campos)

Padrão para backend:
- `search` (string)
- filtros estruturados quando necessário (ex.: `filters=` em JSON)
- filtros de período (`from/to`) quando fizer sentido

Padrão para frontend:
- para tabelas: `DataTable` (já tem advanced filters)
- para timeline/cards/gráficos: Drawer com `FilterEngine`

Filtros típicos para `tasks`:
- status
- responsável
- período (from/to)
- “somente atrasadas”

### 6.2 Gráficos (mantendo modular)
Regra: o componente do gráfico **não** faz regra de negócio.

Padrão recomendado:
- `hooks/use-tasks-analytics.ts`: busca dados agregados (ou `GET /tasks/analytics`)
- `domain/mappers.ts`: transforma resposta em `series/labels`
- `ui/sections/tasks-status-chart.tsx`: renderiza (wrapper/ChartEngine)

### 6.3 Histórico / timeline (auditoria do módulo)
Quando quiser histórico “dentro do contexto do módulo”:
- filtrar `/audit-logs` por `entity` e/ou `entityId`
- timeline vertical com scroll
- clicar abre dialog com before/after (detalhes)

Aplicando em `tasks`:
- timeline do módulo: `entity="Task"`
- timeline de um item: `entity="Task"` + `entityId=<taskId>`

> A timeline do módulo resolve exatamente o caso que você citou: “histórico é uma funcionalidade dentro da mesma tela”.

---

## 7) Teste final (E2E manual)
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

3) Validar:
- módulo aparece no sidebar (se tiver `tasks.read`)
- overview carrega e exibe cards/tabela/timeline
- ações respeitam permissões (UI + backend)
- auditoria aparece em `Admin -> Auditoria` e no histórico do módulo (quando implementado)

