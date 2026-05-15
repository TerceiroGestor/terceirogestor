# Feature: Beneficiario (Cadastro e Detalhe)

## Status

Concluida tecnicamente

## Objetivo

Garantir o fluxo completo de criacao e manutencao de beneficiario com UX previsivel, autosave em edicao e consistencia de dados no contexto SCFV.

---

## Checklist (Backlog)

- [x] Criar novo beneficiario com dados essenciais.
- [x] Editar beneficiario em autosave sem erros de runtime.
- [x] Ajustar step principal com visual compacto, icones e alinhamento a esquerda.
- [x] Ajustar campo Status para o final do formulario (proximo ao motivo de desligamento).
- [x] Padronizar mensagens de alerta em drawer/notificacao.
- [x] Corrigir exibicao de datas de nascimento e cadastro na barra de informacoes.
- [x] Remover step de observacoes em favor de Notas Internas no SideShell.
- [ ] Rodar build/lint completo e tratar pendencias fora do escopo local quando priorizado.

---

## Pendencias (Tech Debt)

- [ ] Revisar comportamentos estranhos residuais reportados durante testes ponta a ponta.
- [x] Consolidar padrao global de mensagens para validacoes de formulario.

---

## Decisoes Tecnicas

- Manter autosave para atualizacao e fluxo explicito para criacao quando necessario.
- Centralizar anotacoes operacionais no SideShell (Notas Internas), evitando campos duplicados no formulario principal.
- Preservar previsibilidade de layout com duas colunas quando aplicavel.
- Habilitar relacoes e chamadas dependentes de `personId` somente apos persistencia do cadastro (modo edit).
- Exibir na auditoria apenas eventos do registro ativo e de entidades relacionadas com IDs resolvidos.
- Navegacao de step no detail principal passa a seguir linguagem visual compacta de tabs (com icones e foco no fluxo).

---

## Snapshot Atual da Funcionalidade

### Fluxo de criacao

- Criacao de beneficiario ocorre apenas por acao explicita no botao Save.
- No modo create, commits de campo atualizam somente estado local do formulario.
- Nao ha persistencia automatica durante o preenchimento inicial.
- Abas relacionais permanecem em estado informativo no create, sem chamadas de API de relacoes.

### Fluxo de atualizacao

- Autosave permanece ativo somente para registros ja persistidos (modo edit).
- Commit de campo no edit continua disparando persistencia incremental conforme contrato do Detail.
- Relacoes e paineis dependentes de pessoa persistida ficam habilitados no edit.

### Estado atual de aderencia

- Aderente ao contrato: criacao explicita e autosave apenas em atualizacao.
- Sem mudanca de arquitetura do modulo e mantendo padroes de DetailShell/DataProvider.
- Auditoria do SideShell contextualizada no cadastro ativo, sem mistura de eventos de outros people.
- Step principal alinhado ao padrao visual de navegacao compacta do modulo People.

---

## Plano de Fechamento e Checklist de Validacao

Objetivo deste plano:

- garantir criterio unico de aceite para criacao, edicao, relacionamentos e metadados
- permitir validacao futura sem ambiguidade de escopo

### Etapa 1: Congelamento de escopo

- [x] Confirmar escopo de fechamento: criacao, edicao, relacionamentos e metadados.
- [x] Registrar itens fora de escopo (sem bloquear fechamento desta feature).
- [x] Vincular pendencias fora de escopo ao backlog do modulo.

Registro de encerramento da Etapa 1:

- Data: 2026-05-07
- Escopo fechado desta entrega:
	- criacao de beneficiario
	- edicao de beneficiario
	- relacionamentos no fluxo canonico
	- metadados no SideShell (Tags, Notas internas, Anexos e Auditoria)

Itens fora de escopo desta etapa (nao bloqueiam avancar para Etapa 2):

1. Ajuste de posicao do campo Status no formulario principal.
- Fonte: checklist Beneficiario.
- Prioridade: Encerrado.
- Owner sugerido: Frontend People.
- Criterio de aceite: campo Status reposicionado ao final, proximo ao motivo de desligamento, sem regressao de autosave.

2. Padronizacao de mensagens de alerta em drawer/notificacao.
- Fonte: checklist Beneficiario.
- Prioridade: Encerrado.
- Owner sugerido: Frontend Shared/UI.
- Criterio de aceite: mensagens de erro/sucesso seguem padrao unico em create/edit.

3. Ajuste de exibicao de datas (nascimento/cadastro) na barra de informacoes.
- Fonte: checklist Beneficiario.
- Prioridade: Encerrado.
- Owner sugerido: Frontend People.
- Criterio de aceite: datas exibidas no formato correto em create/edit.

4. Rodada final de build/lint global e tratamento de pendencias externas ao escopo local.
- Fonte: checklist Beneficiario.
- Prioridade: P1.
- Owner sugerido: Engenharia de modulo.
- Criterio de aceite: build/lint sem bloqueadores para o fechamento da feature.

5. Pendencias de relacoes fora do fechamento imediato da Etapa 1.
- Fonte: docs/people/feature-relacoes.md.
- Prioridade: P1.
- Owner sugerido: Frontend/Backend Relacoes.
- Criterio de aceite: checklist de relacoes concluido e inconsistencias residuais resolvidas.

6. Pendencias de SideShell fora do fechamento imediato da Etapa 1.
- Fonte: docs/people/feature-sideshell.md.
- Prioridade: P1.
- Owner sugerido: Frontend SideShell.
- Criterio de aceite: consolidacao de remocao de campos legados de resumo/notas fora do fluxo canonico.

Vinculos de backlog:

- Relacoes: consultar secao de vinculo em docs/people/feature-relacoes.md.
- SideShell: consultar secao de vinculo em docs/people/feature-sideshell.md.

### Etapa 2: Validacao de criacao (modo create)

- [x] Confirmar que criacao ocorre apenas por clique no botao Save.
- [x] Confirmar que nao existe autosave durante preenchimento inicial.
- [x] Confirmar que abas relacionais ficam apenas informativas no create.
- [x] Confirmar que nao ha requisicao de relacao sem pessoa persistida.

Evidencias esperadas:

- [ ] Captura de fluxo sem salvar (sem persistencia).
- [ ] Captura de fluxo apos Save (com redirecionamento para edit).

Status da Etapa 2:

- Validacao tecnica (codigo) concluida em 2026-05-07.
- Evidencias visuais permanecem pendentes de homologacao manual no ambiente do usuario.

### Etapa 3: Validacao de atualizacao (modo edit)

- [x] Confirmar autosave somente para registro persistido.
- [x] Confirmar commit de campo funcionando sem erro de runtime.
- [x] Confirmar commit de draft sem perda de estado entre steps.
- [x] Confirmar feedback de estado de salvamento no header.

Evidencias esperadas:

- [ ] Alteracao em campo simples persistida automaticamente.
- [ ] Alteracao em campo composto persistida automaticamente.

Status da Etapa 3:

- Validacao tecnica (codigo) concluida em 2026-05-07.
- Evidencias de persistencia em tela permanecem pendentes de homologacao manual no ambiente do usuario.

### Etapa 4: Validacao de metadados no SideShell

- [x] Tags: criar, remover e persistir sem duplicidade.
- [x] Notas internas: editar no side e no modo amplo com retorno consistente.
- [x] Anexos: upload, listagem e exclusao funcionando em edit.
- [x] Auditoria: exibir apenas eventos do item ativo e fontes relacionadas com ID resolvido.

Evidencias esperadas:

- [ ] Registro de teste do fluxo completo de Notas (abrir modo amplo, fechar e retornar ao side).
- [ ] Registro de teste do fluxo de Anexos com upload e exclusao.

Status da Etapa 4:

- Validacao tecnica (codigo) concluida em 2026-05-07.
- Evidencias de fluxo operacional em tela permanecem pendentes de homologacao manual no ambiente do usuario.

### Etapa 5: Gate final de aceite da feature

- [x] Sem pendencia critica (P0/P1) aberta para Beneficiario.
- [x] Checklist de Relacoes validado integralmente.
- [x] Checklist de SideShell validado integralmente.
- [x] Status documental atualizado para concluido quando todos os itens acima estiverem verdes.

Status da Etapa 5:

- Validacao tecnica/documental executada em 2026-05-07.
- Revalidacao documental do gate final executada em 2026-05-07 apos fechamento dos itens P1 de Relacoes.
- Etapa 5 mantida como concluida tecnicamente, sem bloqueio ativo no gate final.

Bloqueadores atuais do gate final:

1. Nao ha bloqueador tecnico ativo no escopo da feature.

Critério objetivo para considerar a feature finalizada:

- [x] Criacao validada.
- [x] Edicao validada.
- [x] Relacionamentos validados.
- [x] Metadados validados.
- [x] Sem regressao aberta bloqueando operacao.

---

## Historico de Alteracoes

### 2026-05-07

- Registro da regra operacional: relacoes so podem ser carregadas quando houver pessoa persistida.
- Formalizacao do comportamento de create com abas relacionais bloqueadas ate o primeiro Save.
- Registro da regra de auditoria contextual por item ativo no DetailShell.
- Padronizacao visual do step no DetailShell para formato compacto com icones.
- Remocao da persistencia redundante de `profileSummary` no fluxo de create/edit para evitar sobreposicao com Notas Internas.
- Hardening da normalizacao do draft no autosave de edicao para prevenir erros de runtime por valores indefinidos/fora do tipo esperado.
- Encerramento da Etapa 1 (congelamento de escopo) com registro formal de escopo fechado, itens fora de escopo e vinculos de backlog.
- Conclusao tecnica da Etapa 2 (criacao): Save explicito, sem autosave no create e relacoes bloqueadas ate persistencia.
- Conclusao tecnica da Etapa 3 (atualizacao): autosave restrito ao edit, commit de campo/draft no estado central e feedback de salvamento no header.
- Conclusao tecnica da Etapa 4 (metadados SideShell): tags sem duplicidade, notas side/amplo consistentes, anexos operacionais em edit e auditoria contextual por IDs resolvidos.
- Execucao da Etapa 5 (gate final): validacao documental concluida com fechamento tecnico do gate apos encerramento dos checklists de Relacoes e SideShell.
- Revalidacao do gate final apos encerramento das pendencias P1 de Relacoes, mantendo o modulo como concluido tecnicamente.
- Remocao do legado de `profileSummary` no frontend do modulo People para consolidar o SideShell como fonte canonica de metadados contextuais.
- Reposicionamento do campo `Status` no fechamento do formulario principal, mantendo `Motivo do desligamento` no mesmo bloco sem regressao de autosave.
- Padronizacao de mensagens de feedback no detail de Beneficiario (validacao, erro e sucesso) para reduzir divergencia textual em notificacoes.
- Ajuste da exibicao de `Cadastro` na barra de informacoes com formatacao de data orientada a instante (`pt-BR`) e fallback seguro.

### 2026-05-06

- Consolidacao das informacoes de beneficiario a partir de implementation, acceptance checklist, test plan e delivery log.
- Definicao de arquivo unico da feature para reduzir duplicacao no modulo People.
- Ajuste no engine de detalhe para impedir persistencia no modo create fora do clique em Save.
- Manutencao de autosave apenas no modo edit, com commit local no create.
