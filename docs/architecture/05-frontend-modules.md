# Frontend — módulos de domínio e legado (`frontend/src/modules/`, `frontend/src/features/`)

*Última revisão: 2026-11-25. Pré-requisito: `04-frontend-web-client.md`
(aqui descrevemos como cada módulo **usa** aquela infraestrutura, não o
mecanismo em si).*

## Forma comum de todo módulo

Todo módulo em `frontend/src/modules/<nome>/` segue a mesma forma:
`manifest.ts` (entrada de nav, `ModuleManifest`), `index.ts` (re-export
público), e até quatro subpastas — `api/`, `config/`, `features/`,
`shared/` (nem todo módulo tem as quatro).

A tela é resolvida por um `ScreenHost` genérico
(`frontend/src/web-client/screen/ScreenHost.tsx`): um `actionId` (ex.:
`"people.list"`, `"actions.detail"`) é resolvido via
`frontend/src/web-client/registry` até o componente real
(`*-list-module-client-page.tsx`/`*-detail-engine-client-page.tsx`) —
por isso `frontend/src/app/[tenant]/(modules)/<modulo>/page.tsx` é só
`<ScreenHost actionId="..."/>`, e o código real da tela vive inteiro em
`modules/<nome>/features/`.

## Roteamento (`frontend/src/app/`)

URLs seguem `/{tenant}/...`: `app/[tenant]/login`,
`app/[tenant]/forgot-password`, `app/[tenant]/reset-password` tratam os
fluxos de autenticação sem login; `app/register` + `app/register/confirm`
tratam auto-cadastro de tenant novo (via `core/features/registration`).
Toda tela de negócio autenticada vive sob o grupo de rota
`app/[tenant]/(modules)/`, uma pasta por chave de módulo (`actions`,
`attendances`, `deposit`, `occurrences`, `pantry`, `people`,
`people-groups`, `programs`, `projects`, `tasks`, mais `admin` e
`dashboard`), cada uma com `page.tsx` (lista), `new/page.tsx` (criar),
`[id]/page.tsx` (detail). Cada `page.tsx` é um wrapper fino renderizando
`<ScreenHost actionId="..."/>` — a pasta de rota mapeia 1:1 pra chave de
módulo, mas o código real que um bug deveria apontar está sempre em
`frontend/src/modules/<chave>/features/...`, nunca em `app/`. `deposit`
e `pantry` também expõem sub-rotas planas (`donors`, `entries`, `exits`,
`history`, `items`, `stock`) direto sob a pasta do módulo, em vez de
abas de relation.

## actions ("Atividades") — implementação de referência

Trata recorrência de atividade/plano de ação; uma Atividade agenda
"Encontros" recorrentes, rastreia participantes e equipe, e liga a
Occurrences/Attendances/People-Groups. **Tratado como implementação de
referência pra todo o padrão canônico** (`docs/canonical-web-client-standard.md`).

- `api/`: `project-actions.ts` (CRUD da própria Atividade),
  `attendances.ts`, `occurrences.ts`, `people-groups.ts`,
  `people-participations.ts`, `action-types.ts`, `types.ts`.
- `config/`: `actions-detail-layout-contract.tsx`,
  `actions-module-contract.tsx` — os contratos de registry de
  lista/detail.
- `features/`: `create/` (`action-create-engine-client-page.tsx`),
  `list/` (`actions-list-module-client-page.tsx`), `manage/` (o Detail
  da Atividade: `action-detail-engine-client-page.tsx`,
  `action-occurrences-section.tsx` pra agendamento em lote de
  Encontros, `action-participants-section.tsx`, `action-team-section.tsx`,
  `action-people-participation-picker-dialog.tsx`,
  `action-operational-relations.tsx`), `meetings/` (sub-tela do
  "Encontro": `config/meeting-detail-layout-contract.tsx` +
  `meetings-module-contract.tsx`, `meetings-detail-engine-client-page.tsx`,
  `meeting-participants-section.tsx`, `meeting-responsibles-section.tsx`,
  `meeting-team-picker-dialog.tsx`).
- `shared/`: só `domain/actions.constants.ts`.

**Sem desvios conhecidos** — é o modelo contra o qual os outros módulos
são comparados (lista com `all: true`, diálogo único pra relation etc.).

## attendances ("Atendimentos")

Rastreia registros de atendimento de pessoa (benefícios concedidos,
notas de evolução, profissional e pessoa vinculados).

- `api/`: `attendances.ts`, `types.ts`.
- `config/`: `attendances-detail-layout-contract.tsx`,
  `attendances-module-contract.tsx`.
- `features/`: `list/ui/attendances-list-module-client-page.tsx`;
  `detail/ui/` com `attendances-detail-engine-client-page.tsx`,
  `attendance-benefit-detail-page.tsx` + `attendance-benefit-dialog.tsx`,
  `attendance-evolution-detail-page.tsx` + `attendance-evolution-dialog.tsx`,
  `attendance-people-picker-dialog.tsx`,
  `attendance-professional-picker-dialog.tsx`.
- `shared/`: `domain/attendances.constants.ts`,
  `domain/attendance-relation-routes.ts`,
  `ui/attendance-relation-detail-shell.tsx`.

**Desvio conhecido** (documentado em `docs/canonical-web-client-standard.md`):
**não segue a regra de 4 abas do `sideSlot`** (não passa `tags`/
`notes`/`attachments`/`tabOrder` pra `StandardDetailMetadataSide`, cai
no fallback legado Histórico+Contexto em vez de Tags/Notas/Anexos/
Auditoria) — correção exige schema novo no backend, rastreado em
`docs/backlog.md` ("Fase B" do plano de Atendimento).

## core — não é domínio, é chrome de plataforma

Não é um módulo de negócio — é dashboard, console de admin, telas
adjacentes de auth (perfil) e UI de auditoria.

- `core/admin/` — console de admin do tenant: `admin.constants.ts`,
  `admin.types.ts`, `config/admin-detail-layouts.tsx` +
  `admin-module-contract.tsx`, e `ui/` com páginas de log de auditoria
  (`admin-audit-list-module-client-page.tsx`,
  `admin-audit-detail-engine-client-page.tsx`), config de
  tenant/instituição (`admin-institution-detail-client-page.tsx`),
  permissões (`admin-permissions-list-module-client-page.tsx`), papéis
  (`admin-roles-list-module-client-page.tsx`, `admin-role-create-page.tsx`,
  `admin-role-detail-engine-client-page.tsx`) e usuários
  (`admin-users-list-module-client-page.tsx`, `admin-user-create-page.tsx`,
  `admin-user-detail-engine-client-page.tsx`). Mapeia pra
  `app/[tenant]/(modules)/admin/*`.
- `core/api/`: `dashboard.ts`, `mfa.ts`, `registration.ts`.
- `core/features/`: `admin-users/` (hooks/cards de log de acesso e
  auditoria), `audit/` (timeline genérica de auditoria:
  `audit-timeline.tsx`, `audit-timeline-page.tsx`,
  `audit-log-details-dialog.tsx` — reaproveitada pela aba Auditoria de
  todo módulo), `auth/ui/login-form.tsx`, `dashboard/ui/core-dashboard-client-page.tsx`,
  `profile/` (perfil de usuário, config de TOTP/MFA, painel de log de
  acesso), `registration/` (auto-cadastro de tenant/conta), `settings/`.
- Sem `config/`/`shared/` no nível de raiz do módulo (tem `admin/config`
  em vez disso).

## deposit / pantry — módulos gêmeos

Estruturalmente idênticos ("Depósito" / "Despensa" — estoque genérico
vs. estoque de alimentos), mesmo layout de sub-tela: Doadores, Entradas,
Saídas, Histórico (ledger), Itens (catálogo), Estoque (saldo por item/
setor).

- `api/`: `donors.ts`, `entries.ts`, `exits.ts`, `history.ts`, `items.ts`,
  `sectors.ts`, `audit.ts`, `dashboard.ts`, mais `types/` espelhando
  cada um e `types/shared.ts`.
- `config/`: `{deposit|pantry}-detail-layout-contract.tsx`,
  `{deposit|pantry}-module-contract.tsx`.
- `features/`: `donors/ui/` (lista, `*-donor-detail-engine-client-page.tsx`,
  seção de doações), `entries/ui/` (`*-entry-detail-engine-client-page.tsx`
  + `detail/deposit-entry-allocated-exits-section.tsx`),
  `exits/ui/*-exit-detail-engine-client-page.tsx`,
  `history/ui/*-history-module-client-page.tsx` (lista do ledger),
  `items/` (`ui/*-item-detail-engine-client-page.tsx` + `detail/`:
  diálogos rápidos de entrada/saída, formulário de item, seções de
  entradas/saídas/histórico; `domain/` tem helpers/types próprios),
  `stock/ui/*-stock-module-client-page.tsx` (lista de saldo atual).
- `shared/`: `domain/{deposit|pantry}.constants.ts`,
  `ui/{deposit|pantry}-header-nav.tsx` (sub-nav entre doadores/entradas/
  saídas/histórico/itens/estoque).

**Desvios conhecidos:** marcados junto com Projects/Programs/Tasks como
ainda **não migrados pro `sideSlot` de 4 abas**. Também foram os dois
módulos corrigidos em 2026-11-24 por um bug onde a lista de doadores só
buscava a página atual em vez de `all: true` pra views Gráfico/Kanban/
`groupBy`.

## occurrences ("Ocorrências")

Registros de incidente/ocorrência, cada um ligado a uma ou mais pessoas
envolvidas.

- `api/`: `occurrences.ts`, `types.ts`.
- `config/`: `occurrences-detail-layout-contract.tsx`,
  `occurrences-module-contract.tsx`.
- `features/`: `list/ui/occurrences-list-module-client-page.tsx`;
  `detail/ui/` com `occurrences-detail-engine-client-page.tsx`,
  `occurrence-people-section.tsx` (lista de relation),
  `occurrence-people-picker-dialog.tsx` (referência viva no documento
  canônico pra um diálogo de vínculo "fica aberto entre seleções").

**Desvio conhecido:** mesmo gap de `sideSlot` de Attendances (sem Tags/
Notas/Anexos/Auditoria, mostra Histórico+Contexto legado).

## people ("Pessoas")

O registro central de pessoa/beneficiário: identidade, contatos,
endereço, árvore de família, saúde, educação, medicação, detenção,
financeiro, benefícios, documentos sensíveis. **De longe o módulo mais
rico.**

- `api/`: a maior superfície de qualquer módulo — `people.ts`,
  `contacts.ts`, `household.ts`, `education.ts`, `financial.ts`,
  `health-conditions.ts`, `medications.ts`, `detentions.ts`,
  `relations.ts` + `relations-tree.ts`, `sensitive-documents.ts`, cada
  um com `types/` correspondente.
- `config/`: `people-detail-layout-contract.tsx`,
  `people-module-contract.tsx`.
- `features/`: um cluster por sub-domínio, cada um geralmente com seu
  próprio `config/`, `data/` (hooks), `ui/`: `benefits/`, `contacts/`
  (`person-contacts-panel.tsx` — a UI real de contatos, ver nota sobre
  `features/contacts/` legado abaixo), `create/`, `detail/`
  (`people-detail-engine-client-page.tsx`), `detentions/`, `education/`,
  `family-members/` (`context/`, `data/use-family-relations.ts`,
  `ui/family-preview.tsx`, `utils/` — ver também gap documentado em
  `docs/backlog.md` sobre `HouseholdAsset`/patrimônio sem tela e
  cluster de componentes mortos dessa pasta), `health-conditions/`,
  `list/`, `medications/`, `people-financial/`, `sensitive-documents/`,
  `tree/` (visualização de genealogia familiar,
  `people-tree-client-page.tsx`).
- `shared/`: `domain/` (`address.ts`, `people.constants.ts`,
  `people.helpers.ts`, `people-module.helpers.ts`,
  `people-relation-routes.ts`, `types.ts`, `utils.ts`), `ui/`
  (`people-detail-sidebar.tsx`, `people-detail-tags.tsx`,
  `people-detail-field.tsx`, `people-detail-family-preview.tsx`,
  `people-relation-detail-shell.tsx`, `person-identity-card.tsx`,
  `person-address-section.tsx`, `family-tree-map/`).

**Desvio confirmado — sistema de abas próprio:** People **não** usa a
flag genérica `mainTab: true` que todo outro módulo usa. Em vez disso,
`people-detail-layout-contract.tsx` define `mainTab: { key:
"dados-basicos", label: "Dados básicos", icon: <IdCard/> }` como um
objeto de aba customizado explícito, mais um array grande de
`tabTemplates` conectando abas específicas de negócio (Contatos,
Endereço, Família, Financeiro, Saúde, Medicamentos, Detenções,
Educação, Benefícios, Documentos sensíveis) — cada uma com seu próprio
cluster `features/<nome>`. Não existe um arquivo separado
`PeopleDetailTabs`/`PeopleDetailMain` — o comportamento de abas
customizadas vive inline no contrato de layout (ver também
`docs/backlog.md`, "People usa um sistema de abas próprio"). Por outro
lado, People já está em conformidade com o `sideSlot` de 4 abas (Tags/
Notas/Anexos/Auditoria). O botão "Árvore genealógica" também segue fora
do padrão de cor (`variant: "action"` em vez de `"default"`) — gap
registrado em `docs/backlog.md`.

## people-groups ("Grupos")

Grupos de pessoas (ex.: coortes/família), cada um com participantes.

- `api/`: `people-groups.ts`, `types.ts`.
- `config/`: `people-groups-detail-layout-contract.tsx`,
  `people-groups-module-contract.tsx`.
- `features/`: `list/ui/people-groups-list-module-client-page.tsx`;
  `detail/ui/` com `people-groups-detail-engine-client-page.tsx`,
  `people-group-participants-section.tsx`,
  `people-group-people-picker-dialog.tsx`.
- `shared/`: `domain/people-groups.constants.ts`.

**Sem desvio óbvio** — usa `mainTab: true` padrão.

## programs ("Programas")

Registros de programa que agrupam/patrocinam Projetos.

- `api/`: `programs.ts`, `types.ts` + `types/programs.ts`,
  `types/shared.ts`.
- `config/`: `programs-detail-layout-contract.tsx`,
  `programs-module-contract.tsx`.
- `features/`: `list/ui/programs-list-module-client-page.tsx`;
  `detail/ui/` com `programs-detail-engine-client-page.tsx`,
  `program-projects-section.tsx` (relation pra Projetos),
  `program-project-quick-create-dialog.tsx`.
- `shared/`: `domain/programs.constants.ts`.

**Desvio conhecido:** marcado junto com Projects/Tasks/Pantry/Deposit
como ainda não migrado pro `sideSlot` de 4 abas.

## projects ("Projetos")

Fontes de financiamento, metas, equipe, matrículas de pessoa/grupo, e
as atividades ("Ações") que pertencem a um projeto. Tem também entrada
de nav `/projects/groups`.

- `api/`: `projects.ts`, `project-structure.ts`, `types.ts` +
  `types/projects.ts`, `types/structure.ts`, `types/shared.ts`.
- `config/`: `projects-detail-layout-contract.tsx`,
  `projects-module-contract.tsx`.
- `features/`: `list/ui/projects-list-module-client-page.tsx` (citado
  explicitamente em `docs/canonical-web-client-standard.md` como
  **implementação de referência** do padrão "buscar `all: true`,
  filtrar no cliente, cortar só pra Tabela"); `detail/ui/` é o maior
  cluster único do código-fonte — `projects-detail-engine-client-page.tsx`,
  `projects-detail-route-client-page.tsx`, equipe
  (`project-team-section.tsx`, `project-team-picker-dialog.tsx`),
  financiamento (`project-funding-sources-section.tsx`), metas
  (`project-goals-section.tsx`), participantes
  (`project-participants-section.tsx`), grupos
  (`project-people-groups-section.tsx`,
  `project-people-group-picker-dialog.tsx`), matrículas
  (`project-enrollments-card.tsx`, `project-enrollment-manage-dialog.tsx`,
  `project-enrollments-manage-route-client-page.tsx`,
  `bulk-enrollment-dialog.tsx`), e atividades
  (`project-actions-section.tsx`, `project-action-manage-dialog.tsx`,
  `project-action-quick-create-dialog.tsx`,
  `project-actions-manage-route-client-page.tsx`,
  `project-action-attendances-card.tsx`).
- `shared/`: `domain/projects.constants.ts`.

**Desvios conhecidos:** mesmo grupo "ainda não `sideSlot` de 4 abas" de
Programs/Tasks/Pantry/Deposit. Além disso, as abas "Equipe"/"Metas"/
"Financiamento" usam `content:` com lista própria em vez de
`RelationListHost` (decisão aceita do usuário por ora, ver
`docs/backlog.md`).

## tasks — não é módulo de negócio real

**Importante pra triagem:** comentário em
`frontend/src/modules/tasks/manifest.ts`: *"Modulo criado so pra testar
a padronizacao visual, nao faz parte do modelo de negocio"* — item de
nav com `disabled: true` e badge "Desativado".

- `config/` (`tasks-detail-layout-contract.tsx`,
  `tasks-module-contract.tsx`), `features/` (`create/ui/tasks-create-page.tsx`,
  `detail/ui/tasks-detail-engine-client-page.tsx`,
  `list/ui/tasks-list-module-client-page.tsx`), `shared/`
  (`domain/tasks.constants.ts`, `domain/types.ts`, `ui/task-card.tsx`,
  `ui/task-detail-form.tsx`, `ui/task-related-item-forms.tsx`).
  **Sem pasta `api/` nenhuma** — é um sandbox de padrão de UI, não
  conectado a um módulo de backend real da mesma forma que os outros
  (o módulo `tasks` do **backend** é real, ver `02-backend-modules.md`
  — é só esta tela do frontend que está desligada da navegação).

Um bug relatado contra "Tasks" quase certamente pertence a este
escopo de teste/demo, não a uma tela real voltada ao cliente — a rota
está desativada na nav, embora `app/[tenant]/(modules)/tasks/*` ainda
exista e seja alcançável por URL direta.

## nav

Não é módulo de domínio — utilitário de 1 arquivo:
`frontend/src/modules/nav/groups.ts` exporta `NAV_GROUPS` (labels tipo
GESTAO/OPERACOES/RECURSOS) e `NAV_GROUP_ORDER`, consumido pelo
`manifest.ts` de cada módulo pra decidir em qual grupo da sidebar
aparece, e por `frontend/src/modules/registry.ts`
(`buildNavGroupsFromManifests`), que agrega todos os manifests num
`nav` final.

## Legado (`frontend/src/features/`)

Regra documentada em `frontend/src/features/README.md`: "domínio de
produto → `src/modules/<key>`"; "infra cross-module (auth, uploads) →
pode ficar aqui por enquanto." Admin ainda está aqui também (ainda não
migrado pra camada de API de `modules/core/admin`).

### features/admin/ — ativo

`admin/api.ts` (tipos e chamadas REST de usuário/papel admin) e
`admin/config/rbac.constants.ts` são importados por ~20 arquivos —
essencialmente todo `modules/core/admin/*` e
`modules/core/features/{admin-users,audit}/*`, mais
`web-client/registry/searchViews/admin.ts` e
`web-client/data-provider/rest/admin.ts`. Rotas
`app/[tenant]/(modules)/admin/{page,users,roles,permissions,tenant,audit-logs}`
renderizam via `modules/core/admin/ui/*`, que depende disto.

### features/auth/ — ativo, pesado

`api.ts`, `auth-context.tsx`, `current-user-context.tsx`,
`login-form.tsx`, `use-mentionable-users.ts`. Usado por
`hooks/use-require-auth.ts`, `components/layout/AppProviders.tsx`,
`components/Sidebar/*`, `app/[tenant]/forgot-password/page.tsx`,
`app/[tenant]/reset-password/page.tsx`, `app/page.tsx`, e dezenas de
arquivos de módulo (via `useCurrentUser`/`ScreenHost`, seletores de
`@mention` nas abas de Notas de todo módulo).

> **Bug conhecido não reproduzido** (ver `docs/backlog.md`):
> `LoginForm` perde o que a pessoa já digitou se ela começar a digitar
> antes do nome da instituição carregar (busca assíncrona do tenant por
> slug reseta o form ao resolver) — `login-form.tsx`.

### features/uploads/ — ativo, pesado

`uploads/api.ts` (`uploadAvatar`, helper genérico de upload) é
importado por ~22 arquivos — virtualmente todo
`*-detail-engine-client-page.tsx` de actions, deposit, pantry, projects,
programs, people-groups, people (páginas de detail de medicações/
condições de saúde), core/admin (páginas de criação/detail de usuário/
instituição), core/features/profile — ou seja, o fluxo compartilhado de
upload de avatar/anexo usado pelo header de Detail e pela aba Anexos de
todo módulo.

### features/contacts/ — morto, confirmado

Grep na árvore inteira de `frontend/src` por imports de
`@/features/contacts/*` só encontra imports **internos,
autorreferentes** (`ContactsList.tsx` importando `ContactForm` e
`contacts-service` de dentro da própria pasta `features/contacts`).
Nenhum módulo, nenhuma rota `app/`, nenhum outro `features/*` importa
daqui. A feature real e viva de "contatos" já vive em
`frontend/src/modules/people/features/contacts/ui/person-contacts-panel.tsx`,
conectada de fato pela aba "Contatos" em `people-detail-layout-contract.tsx`.
**`features/contacts/` é legado superado, removível sem impacto** — não
referenciado nem por `frontend/src/app/` (não existe segmento de rota
`contacts` sob `app/`). Candidato a entrar em `docs/backlog.md` como
item de limpeza (Parte 1) se ainda não estiver listado lá.
