# Refatoração (frontend) — Padronização sem “big bang” (2026-02-20)

Objetivo: padronizar o frontend **sem reinventar a arquitetura** e **sem quebrar rotas/URLs**. A regra é: evoluir o código para ficar mais previsível, reaproveitável e alinhado com `docs/patterns.md` (App Router = wiring-only; domínio dentro de `modules/`).

## Restrições (o que não pode mudar)
- **Sem quebrar URLs existentes**. Se alguma rota mudar, manter compatibilidade via redirect (ex.: `/people` -> `/person`).
- **Sem “reorganizar tudo”**: nada de reestruturar módulos inteiros de uma vez.
- Refatorações devem ser **incrementais**, mantendo compatibilidade durante a migração.

> Observação: “não alterar a estrutura atual” aqui será tratado como “não trocar a arquitetura do projeto”. Algumas mudanças inevitavelmente criam novos arquivos/pastas (ex.: novo feature dentro de `modules/core`) e extraem telas de `app/` para `modules/`, mas **mantendo o mesmo padrão existente** do repositório.

---

## 1) Padrão de nomenclatura (people/person) — decisão: **Tudo `person`**

### Situação atual (detectado)
- Módulo e rotas usam **`people`**: `frontend/src/modules/people/**` e `frontend/src/app/[tenant]/(modules)/people/**`.
- Existem arquivos/componentes dentro do módulo com prefixo **`person-*`** (ex.: `person-contacts-dialog.tsx`, `person-identity-card.tsx`).

### Decisão (confirmada)
- Padronizar **módulo/rota/imports** como `person`.
- Manter `Person` como entidade (tipos/componentes).

> Observação: isso não implica alterar endpoints do backend (`/people/...`) nem permissões (`people.read`, etc.) neste momento.

### Estratégia (incremental, sem “big bang”)
1) Criar `frontend/src/modules/person/**` como fachada (re-exports) do módulo atual `people`.
2) Criar rotas novas em `frontend/src/app/[tenant]/(modules)/person/**`.
3) Transformar `frontend/src/app/[tenant]/(modules)/people/**` em rotas legadas que redirecionam para `/person/...`.

---

## 2) “Core” para acesso (login/register/auth) — tudo dentro de core; `app/` só referencia

### Situação atual (detectado)
Já está ok:
- Register já é `core`: `frontend/src/app/register/page.tsx` → `modules/core/features/registration`.

Fora do padrão (tela complexa dentro de `app/`):
- `frontend/src/app/page.tsx` (entrada por tenantSlug)
- `frontend/src/app/[tenant]/login/page.tsx` + `frontend/src/features/auth/login-form.tsx`
- `frontend/src/app/[tenant]/forgot-password/page.tsx`
- `frontend/src/app/[tenant]/reset-password/page.tsx`
- Admin/Settings (várias telas em `app/`, ver lista abaixo)

Dependência “core” ainda fora de `core`:
- Provider/API de auth vivem em `frontend/src/features/auth/**` e são usados por `modules/core/**`.

Arquivos `app/` com `"use client"` hoje (candidatos a virar wrappers finos):
- `frontend/src/app/page.tsx`
- `frontend/src/app/[tenant]/login/page.tsx`
- `frontend/src/app/[tenant]/forgot-password/page.tsx`
- `frontend/src/app/[tenant]/reset-password/page.tsx`
- `frontend/src/app/[tenant]/(modules)/settings/page.tsx`
- `frontend/src/app/[tenant]/(modules)/admin/*/page.tsx` (users/roles/permissions/tenant/audit-logs + admin index)

### Alvo
- Criar/organizar features dentro de `frontend/src/modules/core/features/**` para:
  - `auth` (login + MFA step, forgot/reset)
  - `landing` (entrada do sistema por slug)
  - `admin` (users/roles/permissions/tenant/audit) e/ou consolidar com features já existentes em core
  - `settings` (tela atual em `app/` vira `core/features/settings/ui/...`)
- Transformar páginas em `app/` em **wrappers** (`return <Screen />`) e redirects simples.

### Estratégia de migração (sem quebrar imports de uma vez)
1) Criar “fachada” em `modules/core` (re-exports) para que **novos imports sejam sempre `@/modules/core/...`**.
2) Migrar gradualmente chamadas `@/features/auth/*` → `@/modules/core/*` (mantendo `features/auth` funcionando como compat layer até terminar).
3) Somente depois (se necessário), mover os arquivos de `features/auth` fisicamente para `modules/core` (opcional; pode ficar como compat layer definitivo).

---

## 3) Forms: padronizar tudo em `FormEngine`

### Situação atual (detectado)
Há poucos formulários “manuais” usando `<form>` + `useState`, fora do FormEngine:
- `frontend/src/app/page.tsx`
- `frontend/src/features/auth/login-form.tsx`
- `frontend/src/app/[tenant]/forgot-password/page.tsx`
- `frontend/src/app/[tenant]/reset-password/page.tsx`
- `frontend/src/app/[tenant]/(modules)/admin/roles/page.tsx` (trecho de form)
- `frontend/src/modules/people/features/benefits/ui/benefit-form.tsx`
- `frontend/src/modules/people/features/education/ui/education-form.tsx`
- `frontend/src/modules/people/features/detentions/ui/detention-form.tsx`

### Alvo
- Todo create/edit/filters estruturados devem usar `FormEngine` (ou `FilterEngine` quando for filtro).
- Forms simples (ex.: input único) também podem usar `FormEngine` para manter consistência (principalmente em auth).

### Migração proposta
1) Converter auth (login + MFA) para `FormEngine` com `steps`.
2) Converter forgot/reset para `FormEngine` (sem steps).
3) Converter os 3 forms do módulo `people` (benefits/education/detentions) para configs `FormField[]` + `FormEngine`.
4) Avaliar admin/roles: extrair o form para um componente `modules/core/features/admin-roles/ui/role-form.tsx` usando `FormEngine`.

---

## 3.1) FormEngine — upgrade do visual do stepper (step-by-step com progresso)

### Situação atual (detectado)
- O stepper do `FormEngine` usa `Tabs` e não comunica “progresso” de forma forte.
- Não há barra/linha de progresso nem “check” visual por step concluído.

### Alvo visual/UX
- Stepper horizontal “bem visual”:
  - ícone por step (customizável; fallback por índice)
  - step atual destacado
  - steps concluídos com “check”
  - barra/linha de progresso conectando steps
  - permitir navegar para steps anteriores; bloquear pular para frente quando o step atual estiver inválido

### Implementação proposta (sem mudar API pública)
- Introduzir um componente interno (ex.: `components/FormEngine/Stepper.tsx`) consumido pelo `FormEngine`.
- Manter `steps` como está hoje (`FormStep[]`), mas calcular:
  - `completedSteps` (até `currentStep - 1`, ou por validação)
  - `progressPct`
- Garantir acessibilidade: `aria-current="step"` e navegação por teclado.

---

## 4) Padronização Dialog vs Drawer vs Page

### Regras (como você pediu)
- **Dialog**: somente `create` ou `view detail` (ex.: PersonIdentity).
- **Drawer (Sheet)**: somente filtros (`DataTable`/`FilterEngine`) ou `UsageDocumentation`.
- **Page**: quando precisa de espaço/visualização ampla (ex.: histórico, visão analítica, listas complexas).

### Situação atual (detectado)
Uso de Drawer fora do padrão:
- `frontend/src/modules/pantry/features/overview/ui/components/pantry-overview-header-actions.tsx`
  - “Movimentos recentes” e “Alertas” abrem em `Sheet` (não é filtro nem UsageDocumentation).

### Ação proposta (confirmada)
- Criar páginas dedicadas (mantendo o módulo `pantry`):
  - `/pantry/history` (ou `/pantry/movements`) para “Movimentos recentes”
  - `/pantry/alerts` para “Alertas”
- Substituir os botões do header para navegar para as páginas (ou abrir dialog apenas para create/view detail).

---

## 5) UsageDocumentation em todas as páginas — **somente visual (sem banco por enquanto)**

### Situação atual (detectado)
- Existe UI estática: `frontend/src/components/UsageDocumentation/UsageDocumentation.tsx` (drawer lateral).
- Só é usado em `modules/actions` hoje.
- Não existe persistência (é passado via `items`).

### Alvo
- Disponível em **todas as páginas** (render global).
- Conteúdo por escrito (itens estáticos) definido por módulo/feature.

### Evolução futura (não implementar agora)
- Persistência de Q&A por página + moderação/roles.

---

## 6) Textos fixos / options / labels — `constants.ts`

### Problema
Existem features com textos fixos e options espalhados no UI. O padrão desejado é centralizar em `constants.ts` para consistência, reuso e futura i18n.

### Padrão proposto
- Por módulo (reuso amplo):
  - `frontend/src/modules/<moduleKey>/shared/domain/<moduleKey>.constants.ts`
- Por feature (microcopy/opções específicas):
  - `frontend/src/modules/<moduleKey>/features/<featureKey>/domain/<featureKey>.constants.ts`

Regra prática:
- se o texto/opção é usado por 2+ features do módulo → vai para constants do módulo
- se é exclusivo de 1 feature → fica na constants da feature

### Caso imediato: tradução do AuditLog
- Criar constants de tradução para `entity` (ex.: `PantryExit` → `Saídas da dispensa`) para deixar a timeline mais legível.

---

## 7) Entregáveis e sequência (mapa de refatoração)

### Fase 0 — Acordo de padrão (sem código)
1) Confirmar decisão de nomenclatura: manter `people` como módulo e `Person` como entidade (recomendado) **ou** “tudo people” em nomes de arquivos.
2) Confirmar as rotas-alvo do pantry: `/pantry/history` e `/pantry/alerts` (nomes finais).
3) Confirmar o MVP do UsageDocumentation (permissões e quem pode responder).

Status (confirmado):
- Nomenclatura: **Tudo `person`** (módulo/rota/imports).
- Pantry: **`/pantry/history`** e **`/pantry/alerts`**.
- UsageDocumentation: **somente visual** (sem banco) por enquanto.

### Fase 1 — “App Router wiring-only”
- Extrair telas de `frontend/src/app/**` para `frontend/src/modules/core/features/**` (sem mudar URLs).
- `app/**/page.tsx` vira somente wrapper.

### Fase 2 — Core/Auth consolidado
- Criar entrypoints em `modules/core` para `useAuth`, `useCurrentUser`, APIs de auth.
- Migrar imports de `@/features/auth/*` para `@/modules/core/*` (compat layer até terminar).

### Fase 3 — FormEngine em todos os forms + Stepper bonito
- Refatorar os forms listados na seção 3.
- Atualizar `FormEngine` stepper conforme seção 3.1.

### Fase 4 — Dialog/Drawer/Page
- Trocar `Sheet` (pantry overview) por navegação para páginas dedicadas.
- Revisar usos de `SectionDialog` e alinhar com as regras (create/view detail).

### Fase 5 — UsageDocumentation persistido (futuro)
- Implementar backend + prisma + frontend (core feature).
- Integrar globalmente para aparecer em todas as páginas.

---

## Checklist de aceitação (para validar no final)
- `frontend/src/app/**` contém apenas wrappers/redirects (sem telas complexas).
- Nenhum formulário “de domínio” fora do `FormEngine` (ou `FilterEngine` quando filtro).
- Stepper do `FormEngine` tem progresso visual + check de steps concluídos.
- Drawer só para filtros e UsageDocumentation; histórico/visões amplas viram páginas.
- UsageDocumentation aparece em toda página e salva/consulta Q&A por página (tenant-scoped).
