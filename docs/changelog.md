# Changelog

## 2026-02-11 — Auditoria de dados (fase 2)

### O que foi entregue
- Fluxo explicito para remover documentos em saude e medicacoes.
- Correção: atualização de condições/medicações não remove documento existente quando o campo não é enviado.
- Painel de detalhes com before/after na auditoria.
- Modelo AuditLog com before/after, metadados de request e indexes.
- Middleware de auditoria com redacao de campos sensiveis e request context por requisicao.
- Endpoint /audit-logs com filtros + tela administrativa para consulta.

## 2026-02-10 — Plano de estabilidade (v0.9 -> v1.0)

### Diagnostico do estado atual
- Tela de Detalhes Familiares concentra muitas secoes na mesma aba, sem hierarquia clara e com carga visual alta.
- Auditoria de alteracoes ainda inexistente para CRUD (hoje so ha AccessLog para login/refresh/logout).
- LGPD: CPF/RG/NIS permanecem no modelo `Person`, sem criptografia e exibidos em claro no detalhe.
- FormEngine nao aplica mask/validacao adequada para CPF, RG e NIS (apenas input simples).

### Proximos passos (ordem sugerida)

### Fase 1 — UX de Detalhes Familiares
1. Reorganizar a aba `familia` em blocos colapsaveis com resumo no topo (patrimonio, renda, moradia, relacoes, bens).
2. Definir um modo “Resumo” (cards agregados) e um modo “Detalhado” (listas completas) para reduzir carga.
3. Medir tempo de carregamento e ajustar queries para evitar excesso de dados por padrao.

### Fase 2 — Auditoria completa de dados
1. Criar modelo `AuditLog` com before/after, userId, tenantId, entidade, entidadeId, action, ip, userAgent, requestId e createdAt.
2. Implementar middleware/interceptor no backend para registrar CREATE/UPDATE/DELETE em todos os modulos.
3. Adicionar redacao de campos sensiveis no log e pagina admin para consulta.

### Fase 3 — LGPD e dados sensiveis
1. Mover CPF/RG/NIS para tabela dedicada (ex: `PersonSensitive`) com criptografia em repouso.
2. Implementar criptografia por campo com chave de ambiente e rotacao planejada.
3. Definir politicas de acesso por role e mascaramento por padrao (exibir apenas ultimos digitos).
4. Aplicar mascaramento no detalhe da pessoa e nos formulários de edicao.

### Fase 4 — FormEngine com masks
1. Adicionar tipos `rg` e `nis` (ou configuracao de mask por campo) no FormEngine.
2. Aplicar masks e validacao de formato no frontend (CPF, RG, NIS).
3. Normalizar armazenamento (somente digitos) no backend para consistencia.

### Fase 5 — Qualidade e fechamento
1. Revisar permissao por feature/role para leitura de dados sensiveis.
2. Cobrir com testes: unitarios de auditoria, criptografia e validacao de documentos.
3. Atualizar docs (arquitetura, banco e LGPD) e executar build de backend/frontend.

### Criterios para versao estavel
- Auditoria completa registrada em todas as mutacoes de dados com diff e metadados.
- CPF/RG/NIS criptografados em repouso e mascarados por padrao na UI.
- Detalhes Familiares com modo resumo e baixo ruido visual.
- FormEngine com masks/validacao para documentos sensiveis.
- Build limpo no backend e frontend.

## 2026-02-10 — Status do dia (historico)

### O que fizemos hoje
- Nova arvore genealogica: endpoint `/people/:id/relations-tree` com BFS e filtros (pai/mae/filho/irmao/conjuge).
- Nova pagina `/people/[id]/tree` com profundidade configuravel e botao de acesso no detalhe.
- Layout vertical da arvore com scroll e indicacao visual de conexao entre pessoas.
- Ajuste do `API_URL` no frontend para funcionar em intranet quando o env aponta para `localhost`.
- Builds de backend e frontend executados.

### O que vamos fazer amanha
- Validar a arvore com dados reais, ajustes finos de ordenacao e relacoes.
- Focar na linha de conexao entre cards (SVG) para deixar mais clara e elegante.
- Revisar e padronizar toda a feature de Pessoa para fechamento.
- Iniciar novas features: Atendimentos, Encaminhamentos, Diario, Vulnerabilidades, Qualidades.
- Proximos dias: Modulo de Projetos com matricula e submodulos (Presencas, Atividades, Oficinas, Eventos, Ocorrencias, Avaliacao de Destaques).

## 2026-02-09 — Plano de seguranca (fases)

### Fase 1 — Contexto de tenant e rotas
- `Tenant.slug` unico e uso de rota `/t/:slug/...` no frontend.
- Resolucao do `tenantId` no backend via slug (middleware/guard).
- Validacao de compatibilidade `tenantId` do token vs rota.

### Fase 2 — Sessao e refresh
- Tabela `UserSession` com refresh token hash, device, IP, exp e revogacao.
- Rotacao de refresh + deteccao de reuse (revoga todas as sessoes).
- Logout global por usuario/tenant.

### Fase 3 — Logs + Audit (com diff) + soft delete
- `AccessLog` global (endpoint, status, IP, user agent).
- `AuditLog` por mutacao com before/after.
- Soft delete em todos os modulos (`deletedAt`, `deletedBy`).

### Fase 4 — LGPD e dados sensiveis
- Mascaramento em UI (CPF, documentos), redacao por role.
- Retencao configuravel por tenant.
- Base para criptografia de campos sensiveis.

### Fase 5 — Hardening
- Rate limit em login/refresh.
- Security headers e CSP.
- Revisao de permissoes por feature/role.

### Frontend — /settings (estrutura)
- Visao geral (status de seguranca, ultima atividade).
- Instituicao (logo, CNPJ, descricao).
- Usuarios (CRUD + detalhe com logs).
- Perfis e permissoes por modulo (matriz).
- Sessoes (ativas, revogar).
- Logs de acesso e auditoria.
- Politicas LGPD (retencao, mascaramento).

## 2026-02-09 — Admin e sessoes

### Frontend
- Tela de configuracoes centralizando Tenant, Usuarios e Permissoes.
- Paginas admin para usuarios, perfis e permissoes com `SectionCard` + `DataTable`.
- Menu do usuario ajustado para perfil/configuracoes, com dados do tenant no header.
- Melhorias no formulario de usuarios (normalizacao + mensagens de erro).
- Breadcrumbs adicionados nas telas de admin/configuracoes.
- Detalhe de usuario com historico de acessos no admin.
- Tela de Instituicao com CNPJ, ano de inicio e descricao (richtext).
- Permissoes exibidas por modulo/feature.
- Tela de Perfis com DataTable e CRUD de perfis.

### Backend
- Novos campos de perfil (tenant logo, nome/avatares de usuario) e endpoints `/tenants/me`.
- Endpoints administrativos para usuarios, perfis e permissoes.
- Upload de logo do tenant.
- JWT com `name` e `tenantName` no payload.
- Campos extras de instituicao (cnpj, startYear, description) e novos endpoints de access-logs por usuario.
- CRUD de perfis com permissoes por modulo.

### Correcoes
- Validacao mais resiliente para atualizacao de usuario (trim e ignorar vazios).

### Testes
- `backend`: `npm run build`.
- `frontend`: `npm run build`.

## 2026-02-07 — Familia expandida

### Frontend
- Padronizacao de cards e metricas de renda, patrimonio e moradia.
- Ajustes de layout no PeopleDetailContent com secoes explicativas.
- Listas colapsaveis e cabecalhos compactos nas secoes de bens e relacoes familiares.

### Backend
- Inicio das migrations de familia e DTOs para rendas, bens e vinculos.

### Testes
- `frontend`: `npm run build`.






