# Modularização do projeto (backend + frontend) para virar Template

Objetivo: transformar o projeto atual (`/backend` + `/frontend`) em um **template modular**, onde cada módulo fica **isolado**, com responsabilidades claras, e o host (app) só “pluga” os módulos.

> Este documento foca em **estrutura e processo**. A migração deve ser **incremental**, sem “big bang”.

---

## 1) Estado atual (resumo honesto)

### Backend (`/backend`)
- NestJS com separação **Core** (`src/core`) vs **Modules** (`src/modules`).
- Módulos existentes: `people`, `pantry`, `users`, `roles`, `permissions`, `tenants`.
- Tenancy via middleware `/t/:slug/...` (`src/core/tenancy/tenancy.middleware.ts`).
- Permissões/RBAC: `PermissionsGuard` + decorator `@Permissions(...)`.
- Auditoria: `src/core/audit` (com logs em `AuditLog`).
- Ponto crítico: **People** é grande (service com milhares de linhas), concentrando muitas responsabilidades.

### Frontend (`/frontend`)
- Next.js App Router com rota por tenant: `src/app/[tenant]/...`.
- Rotas de módulos em `src/app/[tenant]/(modules)/...`.
- Existe um padrão bom: **rotas finas** chamando UI da feature (ex.: pantry).
- Existe um padrão ruim: **módulos com lógica dentro de `app/`** (ex.: People com `_components`, `types`, `utils` dentro do caminho de rota).
- Sidebar estática: `src/components/Sidebar/sidebar-data.ts` (deveria ser gerada por manifestos de módulos).

---

## 2) Definições (para não virar bagunça de novo)

### O que é “Módulo”
Uma unidade de produto que:
- tem **rotas** próprias,
- tem **permissões** próprias,
- tem **UI** própria,
- tem **API** própria (backend),
- pode ser habilitada/desabilitada no futuro (mesmo que hoje esteja sempre habilitada).

Ex.: `people`, `pantry`, `admin`.

### O que é “Feature”
Uma sub-parte dentro de um módulo.

Ex.: dentro do módulo `people` você pode ter features `family-members`, `health-conditions`, `incomes`, etc.

Regra: **Feature nunca “vira módulo”** só porque tem muitos arquivos. Vira módulo quando precisa existir “como produto” isolado.

---

## 3) Estrutura alvo (simples e previsível)

### 3.1 Backend

**Estrutura padrão de módulo**
```
backend/src/modules/<moduleKey>/
  <moduleKey>.module.ts
  permissions.ts
  controllers/
  services/
  repositories/
  dto/
  domain/
  index.ts
```

**Regras**
- `controllers/` só orquestram request/response e validação.
- `services/` contém regras de negócio (pequenos).
- `repositories/` concentra Prisma queries (evita query espalhada).
- `permissions.ts` define as permissões do módulo (sem lista global “gigante”).

**People (proposta concreta)**
- quebrar `people.service.ts` em serviços menores por agregado:
  - `people/people.service.ts` (CRUD pessoa)
  - `people/households.service.ts`
  - `people/relations.service.ts`
  - `people/incomes.service.ts`
  - `people/medications.service.ts`
  - etc.
- cada controller foca em um grupo de endpoints (evita controller monolítico).

### 3.2 Frontend

#### Regra de ouro: `app/` é roteamento (wiring-only)
No Next.js App Router, a pasta `src/app` deve conter **apenas**:
- roteamento (`page.tsx`, `layout.tsx`),
- redirecionamentos,
- wrappers finos que chamam uma “screen” do módulo.

O `app/` **não** deve conter:
- `types.ts`, `utils.ts`, `domain`, `api`,
- componentes de tela (cards, forms, dialogs),
- regras de negócio e transformações de dados.

**Estrutura padrão de módulo**
```
frontend/src/modules/<moduleKey>/
  manifest.ts
  api/
  features/
  shared/
  index.ts
```

### 3.2.1 Contrato interno do módulo (frontend)

A ideia é que **todo módulo siga o mesmo contrato**, para você (e qualquer pessoa) bater o olho e saber onde ficam:
- telas, componentes, hooks, API, types, mappers, configs, relatórios;
- e como aplicar as mesmas ferramentas de UI (FormEngine/DataTable/Dialog/Toast/Chart) sem reinventar padrões.

#### Estrutura recomendada (padrão único)
```
frontend/src/modules/<moduleKey>/
  manifest.ts                # contrato do módulo (nav, grupo, chave)
  index.ts                   # exports públicos do módulo (screens)

  api/                       # client HTTP do módulo (quebrado por recurso)
    index.ts                 # barrel: export * + export type *
    types.ts                 # barrel de tipos
    types/                   # tipos por contexto (pequenos)
    <resource>.ts            # functions (list/get/create/update/delete...)

  shared/                    # reutilizável DENTRO do módulo (não global)
    domain/                  # types/mappers/helpers/validators
    config/                  # configs de form/table (fields, steps, columns)
    hooks/                   # hooks compartilhados do módulo
    ui/                      # componentes compartilhados do módulo

  features/
    <featureKey>/            # uma funcionalidade (“sub-jornada” do módulo)
      domain/                # types/validators/mappers da feature
      config/                # columns/filters/form configs da feature
      hooks/                 # hooks de tela (fetch/state/orquestração)
      ui/                    # screens e componentes de UI da feature
      reports/               # relatórios (pdf/csv/print) - funções puras
```

#### Regras do contrato (para todos os módulos)
1) `app/` (Next) é **wiring-only**: `return <Screen />`.
2) `shared/` é somente do módulo. Se algo for realmente global, sobe para `frontend/src/components/*` (toolbox).
3) `api/` nunca é arquivo monolítico. Quebrar por **recurso** (ex.: `items/entries/exits`) ou por **subdomínio** (ex.: `financial/relations`).
4) Tipos `Api*` vivem em `api/types/*`. Tipos de UI/domínio vivem em `shared/domain/*` e são os que a tela deveria preferir.
5) Arquivo >200 linhas: extrair (UI → `ui/components/*`, lógica → `hooks/*`, transformações → `domain/mappers.ts`).

#### Como padronizar por “ferramenta” (Engines)
- **Formulário**: sempre `FormEngine`
  - `features/<k>/config/<k>-form-config.ts` (fields/steps)
  - `features/<k>/domain/<k>.schema.ts` (validação, se tiver)
  - `features/<k>/ui/<k>-form.tsx` (wrapper fino do FormEngine)

- **Tabela**: sempre `DataTable` (TableEngine)
  - `features/<k>/config/<k>-columns.tsx`
  - `features/<k>/hooks/use-<k>-list.ts` (fetch/paginação/filtros)
  - `features/<k>/ui/<k>-list-page.tsx` (screen)

- **Dialog/Confirm**: sempre `DialogEngine`
  - evitar `window.confirm()` dentro de módulos

- **Toast/Alert**: sempre `useToast()`
  - feedback de ações (sucesso/erro) = toast

- **Gráficos**: usar um `ChartEngine` (ou wrappers consistentes)
  - `domain/mappers.ts` prepara `series/labels` (evitar regra de negócio no componente)

- **Relatórios**: `reports/*` deve ser puro
  - sem `window/document`, sem hooks/estado; só recebe dados e devolve estrutura pronta

#### Critérios práticos: “Feature” vs “Shared”
- Reutiliza em 2+ features do mesmo módulo → `shared/`.
- Reutiliza em vários módulos → `frontend/src/components/*` (toolbox global).
- Específico de 1 fluxo/tela → `features/<k>/ui/*`.

#### Exports (contrato público do módulo)
No `frontend/src/modules/<moduleKey>/index.ts`, exporte só as screens/entry points (para o `app/` sempre ser fino e consistente).

**Rotas (Next) ficam finas**
```
frontend/src/app/[tenant]/(modules)/<moduleKey>/**/page.tsx
  -> importa e renderiza 1 componente de screen do módulo
```

**Regra prática**
- Em `app/` só pode existir “wiring”: `return <Screen />`.
- Toda lógica do módulo vai para `src/modules/<moduleKey>/...`.
- Dentro do módulo, “features” são subpastas opcionais (`features/<featureKey>/...`) quando o módulo ficar grande.

#### Ferramentas de UI (Toolbox)
A UI base do projeto é um “kit de ferramentas” reutilizável e **agnóstico de domínio**.

Ela vive fora de `modules/`, por exemplo:
- `frontend/src/components/ui/*` (primitivos)
- `frontend/src/components/*` (componentes compartilhados)
- `frontend/src/shared/*` / `frontend/src/lib/*` (helpers e infra)

**Regra do template:** módulos **consomem** ferramentas (FormEngine/DataTable/Dialog/etc) e não reimplementam o mesmo padrão em cada módulo.

Diretrizes:
- “Engine” = componente genérico orientado a dados (ex.: `FormEngine`, `DataTable`).
- O módulo pode ter wrappers finos (ex.: `PeopleFormDialog`) mas deve delegar o “trabalho pesado” para as Engines.
- Se você encontrar 3+ implementações parecidas (ex.: vários dialogs quase iguais), isso vira ferramenta compartilhada.

---

## 3.3 Sobre `frontend/src/features/*` (regra de transição)

Hoje ainda existe muita coisa em `frontend/src/features/*`. Para o template ficar **previsível** (e dar manutenção fácil), a regra é:

- `modules/<moduleKey>/...` = **domínio do produto** (módulos e suas features).
- `features/*` = **área de legado/transição** (coisas antigas que ainda não viraram um módulo).

### O que pode ficar em `features/` (permitido)
Somente o que for **infra cross-module** (não é domínio de um módulo):
- `features/auth/*` (contexto, login/logout, current-user)
- `features/uploads/*` (upload genérico)

> Mesmo nesses casos, é recomendado evoluir para algo ainda mais claro (ex.: `src/shared/auth/*`, `src/shared/uploads/*`), mas sem pressa.

### O que não deve ficar em `features/` (proibido no template final)
Qualquer coisa que seja **subdomínio** de um módulo.

Ex.: `family-members`, `health-conditions`, `medications`, `people-financial` são features do módulo `people` e devem viver dentro de `modules/people/features/*`.

### Onde colocar tipos/helpers globais reaproveitáveis
Para evitar `features/shared/*` e confusão, o padrão é:
- `frontend/src/shared/*` para helpers/tipos genéricos que não são de um módulo.

---

## 3.4 Checklist de “pronto para template”

Antes de considerar “template pronto”:
- Nenhum arquivo em `modules/*` importa de `app/*`.
- Rotas do Next (`app/`) são wrappers finos que renderizam screens do módulo.
- `api/` de cada módulo é quebrado por contexto (sem arquivo monolítico).
- Componentes de domínio não ficam em `components/` global (vão para `modules/<k>/shared/ui`).
- `features/*` só tem infra cross-module (auth/uploads) ou legado explicitamente marcado para migração.

#### Limite de tamanho por arquivo (para manutenção)
- Ideal: **até 100 linhas**.
- Aceitável: até **200 linhas**.
- Acima disso: extrair subcomponentes (`ui/`), helpers (`domain/`) ou hooks (`hooks/`).

---

## 4) Manifestos de módulo (o “contrato” do template)

Para cada módulo, criamos um `manifest.ts` que define:
- `key` (id estável: `people`, `pantry`)
- `groupLabel` (grupo do sidebar)
- itens de navegação (rotas)
- permissões necessárias por item (opcional)

Isso permite:
- sidebar e menus sem hardcode,
- admin configurar permissões por módulo,
- atualização simples ao adicionar/remover módulos.

Implementação inicial (já aplicada):
- `frontend/src/modules/*/manifest.ts`
- `frontend/src/modules/registry.ts` gera `navGroups`
- `frontend/src/components/Sidebar/sidebar-data.ts` reexporta do registry

---

## 5) Plano de migração incremental (sem quebrar produção)

### Fase 0 — “Base do template”
1) Manifestos/registry no frontend (feito).
2) Centralizar “reserved segments” do `middleware.ts` para não esquecer rotas novas.
3) No backend, centralizar permissões por módulo e sincronizar pelo `PermissionsSyncService`.

### Fase 1 — Migrar 1 módulo “modelo”
Escolha recomendada: **People** (porque hoje está acoplado ao `app/`).

Passos:
1) Criar `frontend/src/modules/people/*` e mover `types/utils/config` para lá.
2) Trocar imports de outras features que hoje apontam para `app/[tenant]/(modules)/people/...`.
3) Transformar páginas em wrappers finos (como já é em pantry).

### Fase 2 — Backend People por agregados
1) Criar `services/*` e `controllers/*` por contexto.
2) Mover queries para `repositories/*`.
3) Garantir que auditoria/tenancy continuam iguais.

### Fase 3 — Limpeza e “enforcement”
1) Remover arquivos duplicados/legados (`*.exemple`, wrappers desnecessários).
2) Adicionar regras de lint/boundaries (opcional) para impedir `module A` importar `module B` sem permissão.

---

## 6) Critérios de “módulo independente”

Um módulo é considerado independente quando:
- o frontend não importa nada de `app/...` (somente `src/modules/...` e `src/shared/...`);
- o backend não depende de classes internas de outros módulos (apenas de `core` e `shared`);
- permissões e nav são declaradas no próprio módulo;
- rotas do Next são wrappers finos;
- arquivos grandes (>200 linhas) são quebrados por responsabilidade.

---

## 7) Próximo passo recomendado

Escolher um único módulo para virar **referência de padrão**:
- `pantry` (já migrado como primeiro exemplo) e depois `people` (recomendado) ou `admin`.

Depois replicar o padrão para os demais.
