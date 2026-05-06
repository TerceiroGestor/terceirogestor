# Feature: Documentos Sensiveis (LGPD)

## Status

Em desenvolvimento

## Objetivo

Garantir gestao de documentos sensiveis no fluxo de People com padrao visual consistente, controles de permissao e experiencia segura para usuarios autorizados.

---

## Checklist (Backlog)

- [x] Step de documentos sensiveis padronizado visualmente ao formulario principal.
- [x] Controle de permissao read/update aplicado.
- [x] Salvamento com feedback de sucesso/erro.
- [ ] Ocultar o step para usuarios sem permissao de visualizacao.
- [ ] Definir orientacao unica para uploads em formularios de saude/medicacoes usando anexos no SideShell.

---

## Pendencias (Tech Debt)

- [ ] Fechar regra de exibicao condicional por perfil/permissao para evitar exposicao de funcionalidade sem acesso.
- [ ] Consolidar politica de upload documental para evitar pontos de entrada duplicados no modulo.

---

## Decisoes Tecnicas

- A camada de permissao deve controlar nao apenas escrita, mas tambem visibilidade de step sensivel.
- O mecanismo de anexos do SideShell e o caminho preferencial para upload de documentos relacionados ao item ativo.
- O objetivo e manter uma unica estrategia de upload para reduzir erros operacionais.

---

## Historico de Alteracoes

### 2026-05-06

- Consolidacao da feature de documentos sensiveis com base em checklist, testes e log de entrega do modulo People.
