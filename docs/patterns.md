# Padrões (estrutura, responsabilidades e textos)

Este arquivo define o “contrato” para manter o projeto **modular, previsível e fácil de manter**.

## 1) Regras de organização (frontend)

### 1.1 `app/` é só roteamento (wiring-only)
Em `frontend/src/app/**`:
- pode: `page.tsx`, `layout.tsx`, redirects, wrappers finos (`return <Screen />`)
- não pode: `api`, `domain`, `types`, `utils`, componentes de tela complexos, regras de negócio

### 1.2 Estrutura padrão de módulo
```
frontend/src/modules/<moduleKey>/
  manifest.ts
  index.ts
  api/
    index.ts
    <resource>.ts
    types/
  features/
    <featureKey>/
      hooks/
      ui/
      config/
      domain/
  shared/
    domain/
    ui/
    config/
    i18n/
```

### 1.3 Toolbox global (UI)
Componentes reutilizáveis e “agnósticos de domínio” ficam em `frontend/src/components/**`.
Regra: módulo **consome** toolbox, não reimplementa.

Exemplos já usados no projeto:
- Table: `DataTable`
- Form: `FormEngine`
- Dialog: `SectionDialog` / `useConfirm`
- Toast: `useToast`

### 1.4 Permissões (UI)
Sempre que uma tela/action tiver permissão:
- `canRead` → bloqueia a página (mensagem “sem permissão”)
- `canCreate/canUpdate/canDelete` → esconde botões e ações

Fonte:
- `useCurrentUser()` → `permissions: string[]`

---

## 2) Regras de organização (backend)

### 2.1 Estrutura padrão de módulo
```
backend/src/modules/<moduleKey>/
  <moduleKey>.module.ts
  <moduleKey>.controller.ts
  <moduleKey>.service.ts
  dto/
  (opcional) domain/
  (opcional) repositories/
```

### 2.2 Permissões (segurança real)
Regra: endpoint protegido por:
- `@UseGuards(JwtAuthGuard, PermissionsGuard)`
- `@Permissions('<moduleKey>.<action>')`

Convenção de chaves:
- leitura: `<moduleKey>.read`
- escrita: `<moduleKey>.create|update|delete`
- admin/gestão: `<moduleKey>.manage` (quando fizer sentido)

---

## 3) Arquivos pequenos (para manutenção)

Regras práticas:
- **Ideal:** até ~100 linhas por arquivo (UI e controllers)
- **Aceitável:** até ~200 linhas
- Se passar: extrair `hooks/`, `ui/components/`, `domain/` (mappers/helpers) e “sections”

Exceções aceitáveis:
- componentes “engine” (ex.: DataTable) podem ser maiores, mas devem ter arquitetura interna (subarquivos).

---

## 4) Textos fixos (padrão recomendado)

O objetivo é:
- evitar texto espalhado
- facilitar consistência e futura tradução
- manter “values” estáveis (o que salva no banco) e “labels” (o que exibe na UI) humanizados

### 4.1 `*.constants.ts` (domínio)
Use para:
- opções de select
- mapeamento `value -> label`
- enums/labels de badge

Local:
- `frontend/src/modules/<moduleKey>/shared/domain/<moduleKey>.constants.ts`

Regra:
- **values**: estáveis (ex.: `Nao informado`, `Prefiro nao informar`)
- **labels**: humanizados (ex.: `Não informado`, `Prefiro não informar`)

### 4.2 `pt-BR.ts` (UI/microcopy)
Use para:
- títulos/subtítulos de telas
- rótulos de botões
- placeholders
- textos de vazio
- mensagens de toast

Local:
- por módulo: `frontend/src/modules/<moduleKey>/shared/i18n/pt-BR.ts`
- por feature (se necessário): `frontend/src/modules/<moduleKey>/features/<featureKey>/i18n/pt-BR.ts`
- core (reuso global): `frontend/src/modules/core/shared/i18n/pt-BR.ts`

### 4.3 Como migrar sem “big bang”
1) Criar `shared/i18n/pt-BR.ts` por módulo (começar por `core`, `people`, `pantry`)
2) Centralizar textos mais repetidos primeiro (botões, títulos e toasts)
3) Deixar textos muito específicos na feature até estabilizar
4) (Futuro) Introduzir `t()` para permitir i18n de verdade

---

## 5) Manifesto do módulo (menu e permissões)

Todo módulo deve ter `manifest.ts` com:
- `key`
- `groupLabel`
- `navItems[]` com `permissions?: string[]` por item

Isso permite:
- sidebar baseada em registro (sem hardcode)
- ocultar módulo por permissão (`*.read`)

