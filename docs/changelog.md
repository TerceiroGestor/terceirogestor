# Changelog

## 2026-02-10 — Status do dia

### O que fizemos hoje

- Padronização do PersonIdentityCard para uso em tabelas, listas e detalhes.
- Nome social como principal e nome completo como secundário em todas as views de pessoa.
- Ajustes em listas de familiares e itens individuais para refletir o mesmo padrão de identificação.
- Commit e push das alterações de identidade de pessoa.
- Estrutura de tenant > [tenant]/login....

### O que vamos fazer amanhã

- Finalizar logs, audits e autorização com middlewares respeitando roles e permissões granulares.
- Revisar e padronizar toda a feature de Pessoa para fechamento.
- Iniciar novas features: Atendimentos, Encaminhamentos, Diário, Vulnerabilidades, Qualidades.
- Próximos dias: Módulo de Projetos com matrícula e submódulos (Presenças, Atividades, Oficinas, Eventos, Ocorrências, Avaliação de Destaques).

### O que fizemos hoje

- Padronizacao do PersonIdentityCard para uso em tabelas, listas e detalhes.
- Nome social como principal e nome completo como secundario em todas as views de pessoa.
- Ajustes em listas de familiares e itens individuais para refletir o mesmo padrao de identificacao.
- Commit e push das alteracoes de identidade de pessoa.

### O que vamos fazer amanha

- Finalizar logs, audits e autorizacao com middlewares respeitando roles e permissoes granulares.
- Revisar e padronizar toda a feature de Pessoa para fechamento.
- Iniciar novas features: Atendimentos, Encaminhamentos, Diario, Vulnerabilidades, Qualidades.
- Proximos dias: Modulo de Projetos com matricula e submodulos (Presencas, Atividades, Oficinas, Eventos, Ocorrencias, Avaliacao de Destaques).

## 2026-02-09 — Plano de segurança (fases)

### Fase 1 — Contexto de tenant e rotas

- `Tenant.slug` único e uso de rota `/t/:slug/...` no frontend.
- Resolução do `tenantId` no backend via slug (middleware/guard).
- Validação de compatibilidade `tenantId` do token vs rota.

### Fase 2 — Sessão e refresh

- Tabela `UserSession` com refresh token hash, device, IP, exp e revogação.
- Rotação de refresh + detecção de reuse (revoga todas as sessões).
- Logout global por usuario/tenant.

### Fase 3 — Logs + Audit (com diff) + soft delete

- `AccessLog` global (endpoint, status, IP, user agent).
- `AuditLog` por mutação com before/after.
- Soft delete em todos os modulos (`deletedAt`, `deletedBy`).

### Fase 4 — LGPD e dados sensíveis

- Mascaramento em UI (CPF, documentos), redação por role.
- Retenção configurável por tenant.
- Base para criptografia de campos sensíveis.

### Fase 5 — Hardening

- Rate limit em login/refresh.
- Security headers e CSP.
- Revisão de permissões por feature/role.

### Frontend — /settings (estrutura)

- Visão geral (status de segurança, última atividade).
- Instituição (logo, CNPJ, descrição).
- Usuários (CRUD + detalhe com logs).
- Perfis e permissões por módulo (matriz).
- Sessões (ativas, revogar).
- Logs de acesso e auditoria.
- Políticas LGPD (retenção, mascaramento).

## 2026-02-09 — Admin e sessões

### Frontend

- Tela de configurações centralizando Tenant, Usuários e Permissões.
- Páginas admin para usuários, perfis e permissões com `SectionCard` + `DataTable`.
- Menu do usuário ajustado para perfil/configurações, com dados do tenant no header.
- Melhorias no formulário de usuários (normalização + mensagens de erro).
- Breadcrumbs adicionados nas telas de admin/configuracoes.
- Detalhe de usuario com historico de acessos no admin.
- Tela de Instituicao com CNPJ, ano de inicio e descricao (richtext).
- Permissoes exibidas por modulo/feature.
- Tela de Perfis com DataTable e CRUD de perfis.

### Backend

- Novos campos de perfil (tenant logo, nome/avatares de usuário) e endpoints `/tenants/me`.
- Endpoints administrativos para usuários, perfis e permissões.
- Upload de logo do tenant.
- JWT com `name` e `tenantName` no payload.
- Campos extras de instituicao (cnpj, startYear, description) e novos endpoints de access-logs por usuario.
- CRUD de perfis com permissões por modulo.

### Correções

- Validação mais resiliente para atualização de usuário (trim e ignorar vazios).

### Testes

- `backend`: `npm run build`.
- `frontend`: `npm run build`.

## 2026-02-07 — Família expandida

### Frontend

- Padronização de cards e métricas de renda, patrimônio e moradia.
- Ajustes de layout no PeopleDetailContent com seções explicativas.
- Listas colapsáveis e cabeçalhos compactos nas seções de bens e relações familiares.

### Backend

- Início das migrations de família e DTOs para rendas, bens e vínculos.

### Testes

- `frontend`: `npm run build`.
