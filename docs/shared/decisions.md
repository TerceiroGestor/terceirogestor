# shared/decisions.md

## Objetivo

Registrar decisoes tecnicas ativas que governam o projeto e seus modulos.

---

## DEC-001: Arquitetura canonica de tela

**Data:** 2026-05-06  
**Status:** Ativa

**Contexto:**

Havia divergencia estrutural entre modulos na camada web-client.

**Decisão:**

List usa `RecordListHost`; detail usa `DetailShellEngine`; side usa `StandardDetailMetadataSide`; relacoes usam host relacional compartilhado.

**Motivo:**

Garantir previsibilidade de interface e reduzir reimplementacoes por modulo.

**Consequências:**

- Novas telas fora dessa base sao consideradas desvio arquitetural.
- Evolucao de UX deve ocorrer nos componentes canonicos, nao por forks locais.

---

## DEC-002: Fluxo de persistencia de formulario

**Data:** 2026-05-06  
**Status:** Ativa

**Contexto:**

Criacao e atualizacao misturadas geravam comportamento inconsistente em detail e relacoes.

**Decisão:**

Criacao usa salvamento explicito; atualizacao usa autosave para registro persistido.

**Motivo:**

Separar responsabilidades de create e update, reduzindo erro operacional.

**Consequências:**

- Formularios novos devem nascer aderentes a esse contrato.
- Fluxos fora desse padrao devem ser corrigidos como debt de modulo.

---

## DEC-003: Side de metadados como hub unico

**Data:** 2026-05-06  
**Status:** Ativa

**Contexto:**

Campos de contexto espalhados entre formulario e paines laterais geravam duplicidade.

**Decisão:**

Padronizar metadados no side com blocos de tags, notas, anexos e auditoria (mais comentarios/contexto/historico quando suportado).

**Motivo:**

Centralizar contexto do registro e reduzir redundancia funcional.

**Consequências:**

- Campos equivalentes no body devem ser removidos.
- O side passa a ser ponto prioritario de evolucao de metadados.

---

## DEC-004: Estrategia de acesso por permissao declarativa

**Data:** 2026-05-06  
**Status:** Ativa

**Contexto:**

Aplicacao exige consistencia de autorizacao em frontend e backend para cada acao de modulo.

**Decisão:**

Backend usa `@Permissions(...)` com `PermissionsGuard`; frontend usa contrato de modulo (`permissions` e `actions`) para liberar UI e acao.

**Motivo:**

Evitar drift entre autorizacao de tela e autorizacao de API.

**Consequências:**

- Requisicao sem permissao falha no backend mesmo que UI esteja incorreta.
- Contrato de modulo vira referencia unica para capacidades da tela.

---

## DEC-005: Multi-tenancy obrigatoria por contexto

**Data:** 2026-05-06  
**Status:** Ativa

**Contexto:**

Todas as areas operam em contexto multi-tenant e precisam isolamento de dados.

**Decisão:**

Resolver tenant por slug de rota e propagar `tenantId` via request context em toda a cadeia da requisicao.

**Motivo:**

Garantir segregacao tenant-aware em autenticacao, autorizacao e persistencia.

**Consequências:**

- Services devem consultar e mutar dados sempre por `tenantId`.
- Qualquer endpoint sem escopo de tenant e risco de seguranca.

---

## DEC-006: Prisma como camada unica de persistencia

**Data:** 2026-05-06  
**Status:** Ativa

**Contexto:**

Persistencia dispersa aumenta custo de manutencao e dificulta auditoria.

**Decisão:**

Padronizar acesso a banco via PrismaService, com adapter Postgres e extensao de auditoria na camada de query.

**Motivo:**

Concentrar regras de persistencia, tenant e audit em uma camada comum.

**Consequências:**

- Regras de auditoria aplicam-se de forma transversal a modelos suportados.
- Mudancas de schema seguem fluxo unico de migration Prisma.

---

## DEC-007: docs/shared como fonte de verdade documental

**Data:** 2026-05-06  
**Status:** Ativa

**Contexto:**

Documentos distribuídos em varios pontos geravam ambiguidade de governanca.

**Decisão:**

`docs/shared` torna-se o coracao documental do projeto para convencoes, decisoes e patterns.

**Motivo:**

Centralizar regra global e reduzir conflito entre documentos historicos.

**Consequências:**

- Mudancas de arquitetura/processo devem atualizar `docs/shared`.
- Em conflito documental, prevalece o que estiver em `docs/shared`.

---

## DEC-008: Governanca centralizada de modulos

**Data:** 2026-05-06  
**Status:** Ativa

**Contexto:**

A governanca por modulo estava distribuida em multiplos arquivos, dificultando manutencao e visao unica.

**Decisão:**

Concentrar catalogo de modulos e regras de alinhamento entre frontend e backend em um unico ponto de decisao dentro de `docs/shared/decisions.md`.

**Motivo:**

Reduzir fragmentacao documental e facilitar auditoria de ownership por camada.

**Consequências:**

- Inclusao/remoção de modulo exige atualizacao desta secao no mesmo PR.
- Divergencia de escopo entre camadas deve ser registrada aqui.

### Catalogo oficial de modulos

Frontend:

- actions
- core
- deposit
- nav
- onboarding
- pantry
- people
- people-groups
- people-segments
- programs
- projects
- tasks

Backend:

- actions
- dashboard
- deposit
- pantry
- people
- people-groups
- people-segments
- permissions
- programs
- project-structure
- projects
- registration
- roles
- tasks
- tenants
- users

### Alinhamento de dominio (frontend x backend)

Alinhamento direto:

- actions -> actions
- deposit -> deposit
- pantry -> pantry
- people -> people
- people-groups -> people-groups
- people-segments -> people-segments
- programs -> programs
- projects -> projects
- tasks -> tasks

Backend sem espelho direto no frontend:

- dashboard
- permissions
- project-structure
- registration
- roles
- tenants
- users

Frontend sem espelho direto no backend:

- core
- nav
- onboarding

### Regras de entrada de novo modulo

Frontend:

- contrato de modulo definido (`views`, `permissions`, `actions`, `queryAdapters`)
- rotas de `list/new/detail` aderentes ao shell canonico
- Search config definida para `SearchPanel`

Backend:

- controller com escopo de tenant e permissao por rota
- service tenant-aware
- DTOs de `list/create/update` definidos
- schema/migration atualizados quando houver novo dominio

Regra transversal:

- modulo de dominio novo deve nascer em par frontend-backend quando expuser CRUD operacional
