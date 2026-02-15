# Documentação e Textos (i18n) — padrão do Platform

Este documento define:
- Processo e estrutura de **documentação de desenvolvimento** (técnica).
- Processo e estrutura de **documentação de uso** (para usuários finais) por módulo.
- Padrão de **controle de textos/mensagens** (base para tradução/i18n) por módulo.

## 1) Objetivos

- Evitar “conhecimento na cabeça”: decisões ficam registradas.
- Todo módulo novo nasce com docs de uso + docs técnicas mínimas.
- Textos/mensagens centralizados e versionáveis, permitindo tradução.

---

## 2) Taxonomia e onde escrever (padrão de pastas)

### `doc/` (decisões e arquitetura do Platform)
Uso:
- Decisões de arquitetura, políticas e padrões do Platform.
- ADRs (Architecture Decision Records) e guias internos.

Exemplos:
- billing/assinaturas, política de seats, política de inadimplência, padrão de módulos, padrão de auditoria.

### `docs/` (documentação “estável” para produto e módulos)
Uso:
- Documentação que acompanha o produto/módulos e deve ser legível por devs e usuários internos (quando aplicável).

Subpastas propostas:
- `docs/platform/` (como usar o core do Platform em um produto)
- `docs/modules/<moduleKey>/` (documentação por módulo)
- `docs/runbooks/` (ops: deploy, backup, incidentes)
- `docs/adr/` (opcional: ADRs se preferir manter aqui em vez de `doc/`)

Regra:
- Se o conteúdo é “como usar/operar”, fica em `docs/`.
- Se é “decisão/padrão interno do Platform”, fica em `doc/`.

---

## 3) Documentação de Desenvolvimento (técnica)

### Obrigatória por módulo (mínimo)
Em `docs/modules/<moduleKey>/dev-guide.md`:
- Objetivo do módulo (1 parágrafo)
- Modelos/tabelas (resumo + links para migrations)
- Endpoints (lista + contratos)
- Permissões (`<moduleKey>.*`)
- Regras de negócio (bullet points)
- Auditoria (como filtra e onde aparece na UI)

### Obrigatória do Platform (mínimo)
Em `docs/platform/`:
- `overview.md`: visão geral (tenant/auth/RBAC/audit/module-registry)
- `modules.md`: padrão de módulo e checklist para criar um novo
- `billing.md`: billing (se o produto usa)
- `i18n.md`: padrão de textos/idiomas

### Opcional (mas recomendado)
- Swagger/OpenAPI para API (documentação navegável).
- Storybook para UI components do Platform (catálogo de componentes).
- ADRs para decisões “que doem para mudar”.

---

## 4) Documentação de uso do módulo (usuário final)

Objetivo:
- Ensinar a pessoa usuária a usar o módulo sem depender de vídeo ou suporte.

Estrutura recomendada em `docs/modules/<moduleKey>/user-guide.md`:
1) O que o módulo resolve
2) Quem pode usar (perfis/permissões)
3) Fluxo principal (passo a passo)
4) Telas (o que cada tela faz)
5) Regras importantes (ex.: validações, limites)
6) Auditoria no módulo (como consultar timeline, como interpretar)
7) FAQ / problemas comuns

Regras:
- Evitar termos técnicos (API, DTO, etc.).
- Sempre usar prints/gifs quando o fluxo for confuso.

---

## 5) Textos e mensagens (controle + tradução / i18n)

### 5.1 Problema que queremos evitar
- Textos “espalhados” nos componentes → manutenção difícil.
- Tradução impossível sem caça ao texto.
- Mensagens inconsistentes (ex.: “Salvar”, “Gravar”, “Confirmar” em telas diferentes).

### 5.2 Padrão proposto (namespaces por módulo)

Regra:
- Toda string “de UI” deve ser buscada por uma função `t()` (translator).
- As chaves são **namespaced** por módulo e contexto.

Exemplos de chaves:
- `core.actions.save`
- `core.actions.cancel`
- `tasks.title`
- `tasks.form.title.label`
- `tasks.toast.created`
- `billing.status.past_due`

### 5.3 Estrutura de arquivos de mensagens

Proposta:
- `packages/i18n/` (biblioteca + loader + tipos)
- `apps/web/src/messages/pt-BR/core.json` (core)
- `apps/web/src/messages/pt-BR/modules/<moduleKey>.json` (módulos)
- (opcional) `en-US/...` para segunda língua

Alternativa (mais modular para packages):
- Cada módulo (package) expõe seu `messages` e o produto agrega:
  - `@product/tasks/messages/pt-BR.json`
  - `@platform/core-ui/messages/pt-BR.json`

### 5.4 Backend: mensagens por código, não por texto

Padrão recomendado:
- Backend retorna erros com `code` (ex.: `BILLING_PAST_DUE`, `SEAT_LIMIT_EXCEEDED`)
- Frontend mapeia `code` → `t('...')`

Vantagens:
- Tradução consistente
- Mensagens não “quebram” APIs

### 5.5 Glossário e consistência

Manter um glossário (core):
- termo oficial (ex.: “Instituição”, “Usuário”, “Perfil”, “Permissão”, “Módulo”, “Auditoria”)
- traduções (pt-BR / en-US)
- regras de acentuação e estilo

---

## 6) Checklists

### Checklist: novo módulo
- Criou `docs/modules/<moduleKey>/user-guide.md`?
- Criou `docs/modules/<moduleKey>/dev-guide.md`?
- Registrou permissões e termos em mensagens (`modules/<moduleKey>.json`)?
- Auditoria aparece no contexto do módulo (timeline)?

### Checklist: nova tela
- Textos via `t()`?
- Ações usando labels do core (`core.actions.*`)?
- Erros do backend mapeados por `code`?

