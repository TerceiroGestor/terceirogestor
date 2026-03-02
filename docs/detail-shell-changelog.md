# DetailShell — Contrato e Changelog (v1)

Este documento define o **padrão definitivo** para telas de detalhe (create/edit/view) no Web Client.
Objetivo: qualquer módulo conseguir usar a mesma estrutura sem “gambiarras”, apenas passando parâmetros/slots.

> Referência de implementação: Pantry Item Detail (`/pantry/items/[id]`).

---

## 2026-02-28 — v1 (Contrato base)

### Objetivo
- Uma tela de detalhe sempre com a mesma “anatomia”:
  - **Header** (breadcrumb + título + status + ações)
  - **Header Info** (resumo/indicadores do registro)
  - **Main** (formulário create/edit/view)
  - **Side** (audit + notes + chat/alerts no futuro)
  - **Bottom** (relacionamentos e recursos do registro)

### Layout (slots)
**Obrigatórios**
- `mainSlot`: formulário principal.
- `sideSlot`: painel lateral com auditoria e notas (chat é extensível).

**Opcionais**
- `headerInfoSlot`: resumo compacto do registro (status, contadores, validade, etc.).
- `headerActionsSlot`: ações extras no header (ex.: excluir/arquivar/imprimir).
- `bottomSlot`: relacionamentos/recursos.

Regras:
- `sideSlot` existe em **todas** as telas de detalhe.
- `headerInfoSlot` é **compacto** (linhas finas). Evitar cards grandes; priorizar leitura rápida.
- `bottomSlot` é o “hub” do registro, mas **não** deve conter formulários complexos inline.

### Modos e comportamento
- `create`: botão **Salvar** (manual) + validações; após criar, redireciona para o detalhe do registro criado.
- `edit/view`: **autosave** (onBlur/commit) + status visual “Salvando…” / “Pronto”.
- O botão **X** (close) sempre volta para o **contexto anterior** (ex.: lista/estoque) via `returnTo`.

### Padrão de selects (mainSlot)
Regra definitiva:
- Todo campo “select” (enum/lista fixa) deve usar **listas do módulo em `*.constants.ts`**.
  - Ex.: Pantry `PANTRY_ITEM_GROUP`, `PANTRY_ITEM_UNIT`.
- Campos com lista **dinâmica e cadastrável** continuam como estão, com botão **“+”**:
  - Ex.: `Setor` (adicionar novo) abre **dialog simples** (apenas 1–2 inputs).

> Dialog fica reservado para “cadastro rápido” de dados simples, nunca para telas de detalhe completas.

### SideSlot (Audit / Notes / Chat)
Contrato:
- `Audit`: sempre disponível, com scroll interno e “Mostrar mais…”.
- `Notes`: campo padrão do registro (anotações internas).
- `Chat` (planejado): conversa por registro, com menções (`@`) e futura integração com alertas/notificações.

Regras de UX:
- Altura limitada + scroll interno (não pode “estourar” a tela).
- Itens do audit no formato “chat/timeline” (avatar, autor, data, conteúdo).

### BottomSlot (Relacionamentos)
Novo padrão:
- BottomSlot deve ser uma **visualização tipo tabela (ListView)** para cada relacionamento (ex.: Entradas, Saídas, Histórico).
- Inserção/edição de relacionamento:
  - botão **Adicionar** → abre uma **nova tela DetailShell** para aquele relacionamento.
  - não fazer formulários longos inline no BottomSlot.

#### Contexto de relacionamento (create)
Ao criar um relacionamento a partir de um registro pai:
- A tela de detalhe do relacionamento deve deixar explícito o vínculo:
  - exemplo: **“Nova entrada de Arroz”**.
- O payload deve carregar o `parentId` (ex.: `itemId`) automaticamente.
- Breadcrumb/close deve retornar ao detalhe do pai.

#### Identificadores amigáveis (planejado)
- Exibir identificadores como “Entrada #1”, “Saída #3” (sequencial por item/kind).
- Recomendação: sequência definida no backend (não derivada só no frontend).

### Checklist (aceite do padrão)
- [ ] Todo detalhe usa `DetailShell` com `mainSlot` + `sideSlot`.
- [ ] `headerInfoSlot` existe quando há “resumo” e é compacto (linha/mini-blocos).
- [ ] Campos enum usam constants do módulo (sem valores hardcoded na tela).
- [ ] Cadastro rápido via dialog apenas para inputs simples (ex.: setor).
- [ ] BottomSlot só lista (tabela), e create/edit abre outro DetailShell.
- [ ] Sempre há `returnTo` (close e breadcrumbs consistentes).

---

## 2026-02-28 — v1.1 (Relacionamentos no Pantry)

Implementado no módulo Pantry para validar o contrato:
- `Item Detail`: BottomSlot agora usa **ListView** (tabelas) para **Entradas / Saídas / Histórico**.
- Ações “Nova entrada” e “Nova saída” abrem Details dedicados:
  - `/pantry/entries/new?itemId=...&returnTo=...`
  - `/pantry/exits/new?itemId=...&returnTo=...`
- `returnTo` garante que o **X** volte ao detalhe do item pai.
