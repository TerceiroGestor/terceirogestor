# Feature: SideShell Global no People

## Status

Em desenvolvimento

## Objetivo

Estabelecer o SideShell como canal unico de contexto do item ativo, com foco em Tags, Notas Internas, Anexos e Auditoria, removendo redundancias e mantendo consistencia global.

---

## Checklist (Backlog)

- [x] SideShell exibe blocos padronizados para relacoes persistidas.
- [x] Definir estrutura alvo: Tags, Notas Internas, Anexos e Auditoria.
- [x] Ordem explicita aplicada: Tags, Notas, Anexos e Auditoria.
- [x] Comentarios/Notas funcionam para relationId persistido.
- [x] Anexos funcionam para relationId persistido.
- [x] Comandos `@` e `/` habilitados em Notas Internas no People.
- [x] Remover campo Resumo no People para evitar duplicidade com Notas Internas.
- [ ] Padronizar mencoes com `@` globalmente em Notas Internas (lacuna reportada).
- [ ] Eliminar duplicidade de campo Notas nas telas onde ainda existe formulario + SideShell.

---

## Pendencias (Tech Debt)

- [ ] Unificar experiencia rich text em Notas sem toolbar, aproveitando estilos existentes e comandos por teclado.
- [ ] Garantir comportamento identico de Notas Internas em todos os modulos que usam SideShell.

---

## Decisoes Tecnicas

- SideShell passa a ser fonte unica para anotacoes contextuais do item ativo.
- Redundancias funcionais (comentario/historico/contexto em paralelo) devem ser removidas quando sobrepostas ao novo modelo.
- A experiencia de rich text em Notas deve reutilizar base existente para reduzir divergencia de implementacao.

---

## Historico de Alteracoes

### 2026-05-06

- Consolidacao das decisoes e evidencias do SideShell a partir de acceptance checklist, test plan e delivery log.
- Definicao de arquivo unico da feature SideShell no modulo People.
