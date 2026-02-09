# Changelog

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

### Backend
- Novos campos de perfil (tenant logo, nome/avatares de usuário) e endpoints `/tenants/me`.
- Endpoints administrativos para usuários, perfis e permissões.
- Upload de logo do tenant.
- JWT com `name` e `tenantName` no payload.
- Campos extras de instituicao (cnpj, startYear, description) e novos endpoints de access-logs por usuario.

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
