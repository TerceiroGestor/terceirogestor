# Plano de Execucao Tecnico - Refatoracao People First

## 1. Objetivo

Este documento define o plano oficial de execucao da refatoracao do projeto com foco em:

- modulo central `people`
- relacionamentos de `people`
- seguranca, auditoria, multi-tenant e padronizacao estrutural

Meta de negocio: chegar em agosto com MVP funcional, previsivel e escalavel.

## 2. Escopo da decisao

### Incluido

- backend e frontend do modulo `people`
- entidades e fluxos relacionais de `people`
- autenticacao, autorizacao, auditoria e isolamento tenant
- padroes de UI DetailShell/SideShell/Relationship
- testes e documentacao de base para producao inicial

### Excluido (nesta fase)

- evolucao funcional de modulos fora do nucleo `people`
- novas features sem dependencia direta do dominio `people`
- refatoracao oportunista fora do escopo validado por onda

## 3. Principios de execucao

- Seguranca e integridade de dados acima de conveniencia.
- Multi-tenant por contrato tecnico, nao por convencao.
- Auditoria como padrao default-on em operacoes sensiveis.
- Menor alteracao necessaria por entrega incremental.
- Padrao unico de arquitetura e UX para reduzir variacao estrutural.

## 4. Estrategia de ondas

Cada onda tem:

- objetivo tecnico
- entregaveis
- criterios de aceite
- riscos e mitigacao

So avanca para a proxima onda quando os criterios de aceite da onda atual estiverem atendidos.

---

## Onda 0 - Baseline e Congelamento Controlado

### Objetivo

Estabelecer base de controle antes da refatoracao profunda.

### Entregaveis

- congelamento de mudancas em modulos nao essenciais
- inventario de contratos atuais de `people` e relacionados
- mapa de dependencias cruzadas (backend e frontend)
- baseline de erros, cobertura e rotas ativas

### Criterios de aceite

- lista oficial de modulos congelados publicada
- inventario de endpoints e paginas `people` validado
- riscos de ruptura catalogados por severidade
- baseline salvo em documento versionado em `development/`

### Riscos e mitigacao

- Risco: exclusao prematura quebrar fluxo oculto.
- Mitigacao: primeiro congelar e desacoplar, depois remover.

---

## Onda 1 - Hardening de Seguranca e Acesso

### Objetivo

Garantir controle de acesso robusto e consistente.

### Entregaveis

- matriz de permissoes por caso de uso do `people`
- validacao obrigatoria de autenticacao em rotas protegidas
- autorizacao backend por acao sensivel (`read`, `update`, `audit`, `sensitive.read`, `sensitive.update`)
- padronizacao de resposta para acesso negado

### Criterios de aceite

- 100% das rotas de `people` sem acesso anonimo indevido
- 100% das rotas sensiveis com validacao de permissao no backend
- testes de acesso negado e permitido cobrindo cenarios criticos
- nenhuma rota sensivel controlada apenas por frontend

### Riscos e mitigacao

- Risco: quebra de fluxo por permissao incompleta.
- Mitigacao: matriz de permissoes + testes de regressao por perfil.

---

## Onda 2 - Isolamento Multi-tenant End-to-End

### Objetivo

Eliminar risco de vazamento entre tenants.

### Entregaveis

- enforce de `tenantId` em consultas e mutacoes
- validacao de ownership por tenant em recursos relacionados
- revisao de filtros e joins de relacionamento
- suite de testes de isolamento tenant

### Criterios de aceite

- 100% das operacoes de `people` com escopo tenant validado
- testes de tentativa de acesso cruzado retornando bloqueio
- sem query de recurso `people` sem restricao de tenant
- revisao de codigo formal registrada

### Riscos e mitigacao

- Risco: query legada sem filtro tenant.
- Mitigacao: checklist de PR obrigatorio + busca automatizada de padroes inseguros.

---

## Onda 3 - Auditoria, Log e Compliance Operacional

### Objetivo

Garantir rastreabilidade completa das operacoes criticas.

### Entregaveis

- trilha de auditoria em CRUD e acoes sensiveis de `people`
- padrao unico de payload de auditoria (quem, quando, acao, antes/depois)
- classificacao de eventos obrigatorios de compliance
- revisao de logs de documentos sensiveis

### Criterios de aceite

- 100% dos casos sensiveis com evento de auditoria
- historico consultavel por entidade relacional de `people`
- consistencia de schema de log em todos os eventos do escopo
- teste de integridade da trilha de auditoria aprovado

### Riscos e mitigacao

- Risco: lacuna de auditoria em fluxo secundario.
- Mitigacao: mapa de eventos obrigatorios e validacao por checklist.

---

## Onda 4 - Padronizacao Estrutural Backend (People Core)

### Objetivo

Unificar arquitetura interna e reduzir variacao tecnica.

### Entregaveis

- normalizacao de contratos DTO e validacoes
- padrao unico de service/controller para entidades relacionadas
- tratamento de erro padronizado
- consolidacao de tipos de `recordType` e metadata

### Criterios de aceite

- 100% dos endpoints `people` no padrao definido
- sem logica de negocio critica fora da camada de servico
- contratos de entrada/saida consistentes entre relacoes
- reducao comprovada de duplicacao estrutural

### Riscos e mitigacao

- Risco: regressao por unificacao extensa.
- Mitigacao: migrar por fatias com testes por entidade relacional.

---

## Onda 5 - Padronizacao Estrutural Frontend (Detail Pattern)

### Objetivo

Aplicar UX e arquitetura visual unicas no dominio `people`.

### Entregaveis

- uso consistente de DetailShell/SideShell/Relationship Tabs
- padrao de formularios relacionais (create/edit)
- padrao de metadata lateral (comentarios, anexos, tags, historico)
- remocao de variantes visuais e de fluxo fora do padrao

### Criterios de aceite

- 100% das telas relacionais de `people` no shell canonico
- navegacao por tabs sem desvios de comportamento
- autosave/manual save no comportamento esperado por contexto
- testes de navegacao e operacao manual sem erro bloqueante

### Riscos e mitigacao

- Risco: divergencia visual residual.
- Mitigacao: checklist UI por relacao e review de consistencia.

---

## Onda 6 - Qualidade Tecnica e Estabilidade para MVP

### Objetivo

Garantir previsibilidade operacional para inicio de producao.

### Entregaveis

- suite minima de testes automatizados do nucleo `people`
- smoke tests manuais oficiais por fluxo critico
- criterio de merge com gates de qualidade
- backlog de pendencias pos-MVP classificado

### Criterios de aceite

- fluxo ponta a ponta validado: beneficiario + relacoes + atendimento + encaminhamento
- sem erro bloqueante conhecido no escopo `people`
- checklist de aceite funcional concluido
- plano de monitoramento inicial pronto para operacao MVP

### Riscos e mitigacao

- Risco: pressao de prazo reduzir cobertura.
- Mitigacao: priorizacao por risco e bloqueio de escopo fora do nucleo.

---

## 5. Criterios globais de pronto (Definition of Done)

Um item so e considerado concluido quando:

- atende ao contrato arquitetural definido
- atende isolamento tenant e regras de permissao
- gera auditoria quando aplicavel
- possui teste ou evidencia de validacao
- possui documentacao atualizada no diretorio `development/`

## 6. Cronograma sugerido (maio -> agosto)

- Maio (2a quinzena): Ondas 0 e 1
- Junho (1a quinzena): Onda 2
- Junho (2a quinzena): Ondas 3 e 4
- Julho (1a quinzena): Onda 5
- Julho (2a quinzena): Onda 6
- Inicio de agosto: estabilizacao final e preparacao de go-live MVP

## 7. Governanca e rito de acompanhamento

- Reuniao semanal de arquitetura: status por onda e bloqueios
- Reuniao tecnica de qualidade: seguranca/multi-tenant/auditoria
- Gate de passagem de onda: criterios de aceite assinados
- Mudanca de escopo: somente com decisao explicita registrada

## 8. Proximos documentos recomendados em `development/`

- `baseline-onda-0.md`
- `matriz-permissoes-people.md`
- `checklist-tenant-isolation.md`
- `mapa-eventos-auditoria-people.md`
- `checklist-aceite-mvp-people.md`

## 9. Status de execucao atual

### Onda 0

- baseline inicial publicado em `development/baseline-onda-0.md`
- congelamento controlado publicado em `development/congelamento-modulos-onda-0.md`
- mapa de dependencias cruzadas publicado em `development/mapa-dependencias-cruzadas-onda-0.md`
- checklist frontend publicado em `development/checklist-congelamento-operacional-frontend.md`
- checklist backend+ci publicado em `development/checklist-congelamento-backend-ci-onda-0.md`

Status: concluida tecnicamente e em consolidacao final do baseline MVP

Pendencias remanescentes (nao bloqueiam encerramento tecnico da Onda 0):

- gerar e aplicar migration destrutiva para refletir a remocao no banco
- aferir baseline de cobertura de testes para `people`
