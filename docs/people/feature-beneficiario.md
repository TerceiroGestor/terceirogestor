# Feature: Beneficiario (Cadastro e Detalhe)

## Status

Em desenvolvimento

## Objetivo

Garantir o fluxo completo de criacao e manutencao de beneficiario com UX previsivel, autosave em edicao e consistencia de dados no contexto SCFV.

---

## Checklist (Backlog)

- [x] Criar novo beneficiario com dados essenciais.
- [] Editar beneficiario em autosave sem erros de runtime.
- [] Ajustar step principal com status e motivo de desligamento.
- [] Ajustar campo Status para o final do formulario (proximo ao motivo de desligamento).
- [] Padronizar mensagens de alerta em drawer/notificacao.
- [] Corrigir exibicao de datas de nascimento e cadastro na barra de informacoes.
- [] Remover step de observacoes em favor de Notas Internas no SideShell.
- [] Rodar build/lint completo e tratar pendencias fora do escopo local quando priorizado.

---

## Pendencias (Tech Debt)

- [ ] Revisar comportamentos estranhos residuais reportados durante testes ponta a ponta.
- [ ] Consolidar padrao global de mensagens para validacoes de formulario.

---

## Decisoes Tecnicas

- Manter autosave para atualizacao e fluxo explicito para criacao quando necessario.
- Centralizar anotacoes operacionais no SideShell (Notas Internas), evitando campos duplicados no formulario principal.
- Preservar previsibilidade de layout com duas colunas quando aplicavel.

---

## Snapshot Atual da Funcionalidade

### Fluxo de criacao

- Criacao de beneficiario ocorre apenas por acao explicita no botao Save.
- No modo create, commits de campo atualizam somente estado local do formulario.
- Nao ha persistencia automatica durante o preenchimento inicial.

### Fluxo de atualizacao

- Autosave permanece ativo somente para registros ja persistidos (modo edit).
- Commit de campo no edit continua disparando persistencia incremental conforme contrato do Detail.

### Estado atual de aderencia

- Aderente ao contrato: criacao explicita e autosave apenas em atualizacao.
- Sem mudanca de arquitetura do modulo e mantendo padroes de DetailShell/DataProvider.

---

## Historico de Alteracoes

### 2026-05-06

- Consolidacao das informacoes de beneficiario a partir de implementation, acceptance checklist, test plan e delivery log.
- Definicao de arquivo unico da feature para reduzir duplicacao no modulo People.
- Ajuste no engine de detalhe para impedir persistencia no modo create fora do clique em Save.
- Manutencao de autosave apenas no modo edit, com commit local no create.
