# Feature: Relacoes do Beneficiario

## Status

Em desenvolvimento

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
- [ ] Resolver inconsistencias residuais em relacoes reportadas nos testes finais.

---

## Pendencias (Tech Debt)

- [ ] Padronizar completamente o comportamento global de Notas em todas as relacoes (sem duplicatas em formulario).
- [ ] Revisar todos os formul arios para remocao de campos redundantes com SideShell.
- [ ] Reavaliar escopo de Atendimento e Encaminhamento como modulo proprio (fora de relacoes de People).

---

## Decisoes Tecnicas

- Contrato de `recordType` alinhado para metadados relacionais (incluindo `contact`; houve extensao previa para `attendance` e `referral`).
- Endereco permanece semanticamente ligado ao household profile, com experiencia integrada na aba de relacoes.
- Upload de documentos operacionais deve priorizar anexos no SideShell para evitar multiplas estrategias concorrentes.
- Atendimento e Encaminhamento foram apontados como candidatos a modulo separado por complexidade funcional.

---

## Historico de Alteracoes

### 2026-05-06

- Consolidacao de relacoes a partir de acceptance checklist, implementation plan, migration plan, test plan e delivery log.
- Definicao do arquivo unico da feature de relacoes para reduzir sobreposicoes de checklist/plano/teste.
