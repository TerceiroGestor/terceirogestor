# Feature: Relacoes do Beneficiario

## Status

Concluida tecnicamente

## Objetivo

Padronizar e estabilizar as relacoes do beneficiario (familia, endereco, contatos, financeiro, saude, medicacoes, escolaridade, reclusao) com create previsivel, update por autosave e delete com confirmacao.

---

## Checklist (Backlog)

- [x] Aba Familia abre, lista e permite create/edit de vinculo.
- [x] Aba Endereco abre e salva household profile.
- [x] Aba Contatos abre e permite create/edit/delete.
- [x] Aba Financeiro abre e lista registros.
- [x] Aba Saude abre e permite create/edit.
- [x] Aba Medicacoes abre e permite create/edit.
- [x] Aba Escolaridade abre e permite create/edit.
- [x] Aba Reclusao abre e permite create/edit.
- [x] Garantir comportamento: criar via botao Salvar, atualizar via autosave.
- [x] Padronizar endereco no mesmo fluxo de detail/lista das demais relacoes.
- [x] Revisar validacoes backend para funcionamento ponta a ponta das relacoes.
- [x] Resolver inconsistencias residuais em relacoes reportadas nos testes finais.

---

## Pendencias (Tech Debt)

- [x] Padronizar completamente o comportamento global de Notas em todas as relacoes (sem duplicatas em formulario).
- [x] Revisar todos os formul arios para remocao de campos redundantes com SideShell.
- [ ] Reavaliar escopo de Atendimento e Encaminhamento como modulo proprio (fora de relacoes de People).

### Vinculo com Etapa 1 do Beneficiario

- Origem: docs/people/feature-beneficiario.md (Etapa 1: congelamento de escopo).
- Status de vinculo: ativo.

Itens vinculados para backlog de Relacoes:

1. Resolver inconsistencias residuais em relacoes reportadas nos testes finais.
- Prioridade: Encerrado.
- Owner sugerido: Frontend/Backend Relacoes.
- Criterio de aceite: sem erro funcional nas abas relacionais do fluxo canonico.

2. Padronizar completamente o comportamento global de Notas em todas as relacoes.
- Prioridade: Encerrado.
- Owner sugerido: Frontend SideShell/Relacoes.
- Criterio de aceite: sem duplicidade de campo Notas entre formulario relacional e SideShell no fluxo ativo.

3. Revisar formularios para remocao de campos redundantes com SideShell.
- Prioridade: Encerrado.
- Owner sugerido: Frontend Relacoes.
- Criterio de aceite: formulario relacional sem redundancia funcional de metadados.

4. Reavaliar escopo de Atendimento e Encaminhamento como modulo proprio.
- Prioridade: P2.
- Owner sugerido: Arquitetura de modulo.
- Criterio de aceite: decisao registrada (manter em relacoes ou extrair para modulo dedicado).

---

## Decisoes Tecnicas

- Contrato de `recordType` alinhado para metadados relacionais (incluindo `contact`; houve extensao previa para `attendance` e `referral`).
- Endereco permanece semanticamente ligado ao household profile, com experiencia integrada na aba de relacoes.
- Upload de documentos operacionais deve priorizar anexos no SideShell para evitar multiplas estrategias concorrentes.
- Atendimento e Encaminhamento foram apontados como candidatos a modulo separado por complexidade funcional.
- Relacoes devem ser carregadas e mutadas somente quando o `personId` representar registro persistido.
- No modo create, paineis relacionais devem ficar em estado informativo, sem requisicoes para endpoints de relacao.

---

## Matriz Atual de Relacionamentos

| Relacao | Funcionamento atual | Tipo de relacao | Comportamento esperado |
| --- | --- | --- | --- |
| Familia | Abre, lista e permite create/edit de vinculo | Operacional | Bloqueada no create; ativa no edit; depende de personId persistido |
| Endereco | Abre e salva household profile | Operacional | Bloqueada no create; ativa no edit; integrada ao fluxo de relacoes |
| Contatos | Abre e permite create/edit/delete | Operacional | Bloqueada no create; ativa no edit; mutacoes com confirmacao quando aplicavel |
| Financeiro | Abre e lista registros | Informacional | Bloqueada no create; ativa no edit |
| Saude | Abre e permite create/edit | Operacional | Bloqueada no create; ativa no edit |
| Medicacoes | Abre e permite create/edit | Operacional | Bloqueada no create; ativa no edit |
| Escolaridade | Abre e permite create/edit | Operacional | Bloqueada no create; ativa no edit |
| Reclusao | Abre e permite create/edit | Operacional | Bloqueada no create; ativa no edit |

Observacoes:

- Todas as relacoes devem permanecer sem chamadas de API no modo create.
- O modo edit e o unico ponto habilitado para carga e mutacao relacional.

---

## Checklist de Validacao de Relacionamentos

### Regras globais

- [x] Confirmar que todas as abas relacionais ficam informativas no create.
- [x] Confirmar que nao ha request relacional com id temporario (ex.: new).
- [x] Confirmar que todas as relacoes habilitam normalmente apos primeiro Save.

### Checklist por relacao

Familia:
- [x] Abrir aba e listar sem erro.
- [x] Criar vinculo e persistir.
- [x] Editar vinculo e persistir.

Endereco:
- [x] Abrir aba e carregar dados atuais.
- [x] Atualizar household profile e persistir.

Contatos:
- [x] Abrir aba e listar sem erro.
- [x] Criar contato e persistir.
- [x] Editar contato e persistir.
- [x] Excluir contato com confirmacao.

Financeiro:
- [x] Abrir aba e listar sem erro.
- [x] Validar filtro por pessoa ativa.

Saude:
- [x] Abrir aba e listar sem erro.
- [x] Criar/editar condicao e persistir.

Medicacoes:
- [x] Abrir aba e listar sem erro.
- [x] Criar/editar medicacao e persistir.

Escolaridade:
- [x] Abrir aba e listar sem erro.
- [x] Criar/editar escolaridade e persistir.

Reclusao:
- [x] Abrir aba e listar sem erro.
- [x] Criar/editar registro e persistir.

### Encerramento da validacao de relacoes

- [x] Consolidar evidencias por aba (aprovado/falhou/observacao).
- [x] Reclassificar pendencias residuais por prioridade.
- [x] Atualizar status da feature de Relacoes apos fechamento dos itens criticos.

Status da validacao:

- Validacao tecnica (codigo) concluida em 2026-05-07.
- Fluxos relacionais principais aderentes ao contrato de create informativo e edit operacional.
- Homologacao manual ponta a ponta permanece recomendada como rotina de QA, sem bloqueio tecnico ativo para o gate desta feature.

---

## Historico de Alteracoes

### 2026-05-07

- Formalizacao do contrato de relacoes: habilitacao apenas apos persistencia do cadastro da pessoa.
- Registro de regra anti-regressao para impedir chamadas de relacoes durante create.
- Alinhamento visual de SideShell entre detail principal e details relacionais (auditoria e notas internas).
- Encerramento tecnico do checklist de validacao relacional com criterio de create/edit confirmado no codigo.
- Encerramento dos itens P1 de metadados relacionais com eliminacao de duplicidade de `notes` nos contratos de formularios relacionais.
- Consolidacao do SideShell como hub unico de metadados (notas/tags/anexos/auditoria) no fluxo relacional canonico.

### 2026-05-06

- Consolidacao de relacoes a partir de acceptance checklist, implementation plan, migration plan, test plan e delivery log.
- Definicao do arquivo unico da feature de relacoes para reduzir sobreposicoes de checklist/plano/teste.
