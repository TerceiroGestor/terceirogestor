# Documentação (template)

Este diretório é a **fonte única** de documentação do projeto (arquitetura, processos, padrões e guias).

## Índice

### Visão geral
- `docs/architecture.md` — visão do sistema e pastas
- `docs/database.md` — modelo de dados, migrations e seed
- `docs/patterns.md` — padrões de código/estrutura e “contratos” de módulos
- `docs/changelog.md` — histórico e próximos passos
- `docs/backlog.md` — ideias/pendências organizadas

### Processos (para estudo/testes/debug)
- `docs/processes/backend.md` — processos e endpoints do backend
- `docs/processes/frontend.md` — processos do frontend e integração com API
- `docs/processes/registro-tenant-admin.md` — detalhes do registro de tenant + admin
- `docs/processes/testes-registro-2fa.md` — roteiro prático para validar registro + 2FA
- `docs/processes/validacao-cpf.md` — validação e normalização de CPF
- `docs/processes/fechamento-epico-1.1-pessoas.md` — checklist de validação (endereços/contatos/documentos sensíveis)

### Como criar novos módulos
- `docs/guides/backend-new-module.md` — criar módulo no backend (migrations/seed/perms/audit)
- `docs/guides/frontend-new-module.md` — criar módulo no frontend (manifest/api/features/shared/perms)

### Exemplo end-to-end
- `docs/examples/task-module-e2e.md` — exemplo completo do módulo `tasks` (backend + frontend)

### Templates de documentação por módulo
- `docs/modules/_template/dev-guide.md`
- `docs/modules/_template/user-guide.md`

### Arquivo histórico (não usar como referência principal)
- `docs/archive/` — documentos antigos/ideias de outros experimentos
