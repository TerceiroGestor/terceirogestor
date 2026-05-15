# Feature: SideShell Global no People

## Status

Concluida tecnicamente

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
- [x] Auditoria do SideShell exibe apenas historico do item ativo no DetailShell.
- [x] Eliminar fallback de auditoria por entidade sem `entityId` no feed contextual.
- [x] Simplificar visual da auditoria para leitura rapida com detalhe sob demanda.
- [x] Ajustar Notas Internas para visual slim com botao de ampliar embutido no editor.
- [x] Reposicionar sugestoes de comandos/mencoes para area proxima ao foco de edicao.
- [x] Padronizar mencoes com `@` globalmente em Notas Internas (componente compartilhado).
- [x] Eliminar duplicidade de campo Notas nas telas do fluxo canonico (formulario principal unificado no SideShell).

---

## Pendencias (Tech Debt)

- [x] Consolidar remocao de campos legados de resumo/notas fora do fluxo canonico quando encontrados.

### Vinculo com Etapa 1 do Beneficiario

- Origem: docs/people/feature-beneficiario.md (Etapa 1: congelamento de escopo).
- Status de vinculo: ativo.

Itens vinculados para backlog de SideShell:

1. Consolidar remocao de campos legados de resumo/notas fora do fluxo canonico.
- Prioridade: Encerrado.
- Owner sugerido: Frontend SideShell.
- Criterio de aceite: ausencia de campos legados redundantes no fluxo ativo dos modulos que usam SideShell.

2. Padronizar mensagens de alerta no fluxo de metadados quando aplicavel.
- Prioridade: P2.
- Owner sugerido: Frontend Shared/UI.
- Criterio de aceite: erros e sucessos de metadados seguem padrao textual unico do sistema.

---

## Decisoes Tecnicas

- SideShell passa a ser fonte unica para anotacoes contextuais do item ativo.
- Redundancias funcionais (comentario/historico/contexto em paralelo) devem ser removidas quando sobrepostas ao novo modelo.
- A experiencia de rich text em Notas deve reutilizar base existente para reduzir divergencia de implementacao.
- Feed de auditoria contextual deve consultar somente fontes com IDs resolvidos do item ativo.
- Fontes relacionadas sem IDs nao devem gerar consulta ampla por entidade.
- Auditoria no SideShell deve priorizar resumo legivel na lista e abrir detalhe completo somente por acao explicita.
- No modo amplo de Notas, o retorno ao SideShell deve manter o editor visivel e sem estado residual de painel de comandos.

---

## Checklist de Validacao de Metadados

### Regras gerais do SideShell

- [x] Confirmar SideShell como fonte unica de metadados operacionais do item.
- [x] Confirmar ausencia de campos duplicados entre formulario e side para Notas/Tags quando aplicavel.
- [x] Confirmar comportamento consistente entre detail principal e details relacionais.

### Tags

- [x] Adicionar tag e persistir.
- [x] Remover tag e persistir.
- [x] Confirmar ausencia de duplicidade e normalizacao de valor.

### Notas internas (side + modo amplo)

- [x] Editar nota no side e persistir.
- [x] Abrir modo amplo e continuar edicao sem perder contexto.
- [x] Fechar modo amplo e retornar ao side com editor visivel.
- [x] Validar comandos @ e / no side.
- [x] Validar comandos @ e / no modo amplo.
- [x] Confirmar ausencia de estado residual (painel de sugestoes travado ou ocultacao do editor).

Observacao de validacao:

- A resolucao tecnica foi aplicada no componente compartilhado de Notas (`DetailNotesPanel`).
- Recomenda-se rodada final de validacao manual ponta a ponta para homologacao do fluxo em ambiente de usuario.

### Anexos

- [x] Upload de anexo concluido com atualizacao da lista.
- [x] Download/abertura de anexo funcionando.
- [x] Exclusao de anexo funcionando quando permitido.

### Auditoria

- [x] Exibir somente eventos do item ativo.
- [x] Exibir eventos de entidades relacionadas somente com IDs resolvidos.
- [x] Confirmar ausencia de fallback amplo por entidade sem entityId.
- [x] Abrir detalhe de alteracao sem quebra de layout.

### Criterio de pronto do SideShell

- [x] Tags aprovadas.
- [x] Notas aprovadas (incluindo modo amplo) no escopo tecnico de implementacao.
- [x] Anexos aprovados.
- [x] Auditoria aprovada.
- [x] Sem regressao aberta bloqueando operacao de metadados.

Status da validacao:

- Validacao tecnica (codigo) concluida em 2026-05-07.
- Componente compartilhado de metadados aderente no detail principal e nos details relacionais.
- Homologacao manual ponta a ponta permanece recomendada como rotina de QA, sem bloqueio tecnico ativo para o gate desta feature.

---

## Historico de Alteracoes

### 2026-05-07

- Ajuste do feed de auditoria para impedir exibicao de logs de outros cadastros no SideShell.
- Registro do contrato: auditoria contextual sem fallback por entidade quando nao houver `entityId`.
- Refino de UI/UX da auditoria para reduzir densidade visual e melhorar escaneabilidade.
- Refino de UI/UX de Notas Internas: ampliar embutido, comandos compactos e fluxo consistente entre side e modo amplo.
- Correcao de estabilidade de Notas no retorno do modo amplo para o side, sem colapso visual do editor.
- Padronizacao tecnica do comportamento de Notas no componente compartilhado para manter consistencia entre modulos.
- Eliminacao de duplicidade no fluxo canonico com descontinuidade da persistencia redundante de `profileSummary` no create/edit de beneficiario.
- Encerramento tecnico do checklist de validacao de SideShell (Tags, Notas, Anexos e Auditoria) com ausencia de bloqueio P1 ativo no fluxo canonico.

### 2026-05-06

- Consolidacao das decisoes e evidencias do SideShell a partir de acceptance checklist, test plan e delivery log.
- Definicao de arquivo unico da feature SideShell no modulo People.
