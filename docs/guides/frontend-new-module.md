# Frontend — Como criar um novo módulo (rotas, manifest, API e permissões)

Este guia define o padrão para criar um módulo no frontend com baixa fricção e alta previsibilidade.

## 1) Checklist (visão rápida)
1. Definir `moduleKey` (ex.: `tasks`)
2. Criar o módulo em `frontend/src/modules/<moduleKey>/...`
3. Criar `manifest.ts` com `permissions: ['<moduleKey>.read']`
4. Criar requests em `api/` (por recurso)
5. Criar screens em `features/*/ui/*`
6. Criar wrappers finos em `frontend/src/app/[tenant]/(modules)/<moduleKey>/**/page.tsx`
7. Aplicar gating de permissões (`canRead/canCreate/canUpdate/canDelete`)

---

## 2) Estrutura padrão

```
frontend/src/modules/tasks/
  manifest.ts
  index.ts
  api/
    index.ts
    tasks.ts
    types.ts
  features/
    list/
      ui/
      hooks/
    detail/
      ui/
    form/
      ui/
      config/
  shared/
    domain/
    ui/
    i18n/
      pt-BR.ts
```

---

## 3) Rotas (Next.js App Router)

Regra: rota é só wiring.

Exemplo:
```
frontend/src/app/[tenant]/(modules)/tasks/page.tsx
  -> return <TasksListClientPage />
```

---

## 4) Manifesto do módulo

`manifest.ts` deve conter:
- `key`
- `groupLabel`
- `navItems` com `permissions?: string[]`

Exemplo:
- menu só aparece se tiver `tasks.read`
- itens internos podem exigir permissões adicionais

---

## 5) Requests (API)

Regra:
- tudo tenant-scoped no backend: `/t/:slug/...`
- separar por recurso (evitar `api.ts` gigante)

Sugestão:
- `api/tasks.ts`: `listTasks`, `getTask`, `createTask`, `updateTask`, `deleteTask`
- `api/index.ts`: re-export

---

## 6) Permissões na UI

Padrão:
- `canRead` → bloqueia a página
- `canCreate/canUpdate/canDelete` → esconde botões/ações

Fonte:
- `useCurrentUser()` → `permissions`

---

## 7) Textos fixos

Padrão recomendado (planejado):
- `shared/domain/tasks.constants.ts` para options/labels do domínio
- `shared/i18n/pt-BR.ts` para microcopy de UI

Detalhes: `docs/patterns.md`

---

## 8) Exemplo end-to-end
Veja: `docs/examples/task-module-e2e.md`

