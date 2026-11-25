# Arquitetura — índice

Documento de Arquitetura de Software (SAD) + Manual do Desenvolvedor do
Terceiro Gestor. Objetivo: quando alguém achar um problema num lugar
específico do sistema, saber exatamente quais arquivos/pastas estão no
escopo, sem precisar ler o projeto inteiro.

Isto é documentação de **apoio**, não normativa — as regras que valem de
verdade continuam em [`AGENTS.md`](../../AGENTS.md) (raiz do repo) e nos
documentos canônicos específicos (`docs/canonical-web-client-standard.md`,
`docs/auditoria-riscos.md`). Se algo aqui conflitar com o código ou com
esses documentos, o código/os documentos canônicos vencem — isto aqui
pode ficar desatualizado, aquilo é vivo. Veja a data de "última revisão"
no topo de cada arquivo.

## Como navegar

| Se o problema está em... | Leia |
|---|---|
| Login, token, MFA, sessão expirando | [01-backend-core.md](01-backend-core.md) §Auth |
| "Usuário vê dado de outro tenant" / isolamento | [01-backend-core.md](01-backend-core.md) §Tenancy |
| Permissão/papel não funciona como esperado | [01-backend-core.md](01-backend-core.md) §Authorization |
| CPF/dado sensível não criptografa ou não decripta | [01-backend-core.md](01-backend-core.md) §PII |
| Upload/download de arquivo, avatar, anexo | [01-backend-core.md](01-backend-core.md) §Files |
| Rate limit bloqueando sem motivo | [01-backend-core.md](01-backend-core.md) §Rate limit |
| Log de auditoria faltando/errado | [01-backend-core.md](01-backend-core.md) §Audit |
| Regra de negócio de Pessoas/Família | [02-backend-modules.md](02-backend-modules.md) §people |
| Grupos (turmas, equipes) | [02-backend-modules.md](02-backend-modules.md) §people-groups |
| Programa → Projeto → Atividade → Encontro | [02-backend-modules.md](02-backend-modules.md) §programs/projects/actions |
| Matrícula (quem está em qual projeto) | [02-backend-modules.md](02-backend-modules.md) §project-structure |
| Ocorrência (incidente) | [02-backend-modules.md](02-backend-modules.md) §occurrences |
| Atendimento (social/psicológico) | [02-backend-modules.md](02-backend-modules.md) §attendances |
| Doações (Pantry/Deposit) | [02-backend-modules.md](02-backend-modules.md) §pantry/deposit |
| Tarefas internas da equipe | [02-backend-modules.md](02-backend-modules.md) §tasks |
| Dashboard/indicadores | [02-backend-modules.md](02-backend-modules.md) §dashboard |
| Cadastro de novo tenant (onboarding) | [02-backend-modules.md](02-backend-modules.md) §registration |
| Modelo de dados / migration | [03-database.md](03-database.md) |
| Tabela/lista não atualiza, ordenação, paginação | [04-frontend-web-client.md](04-frontend-web-client.md) §registry/record |
| Tela de Detail, abas, autosave, "Salvando..." preso | [04-frontend-web-client.md](04-frontend-web-client.md) §detail |
| Relation dentro do Detail (sub-tabela) | [04-frontend-web-client.md](04-frontend-web-client.md) §relation |
| Filtro/busca não funciona | [04-frontend-web-client.md](04-frontend-web-client.md) §filtering/search |
| Tela específica de um módulo (ex.: form de Pessoa) | [05-frontend-modules.md](05-frontend-modules.md) |
| Login/sessão no navegador, rota admin, upload no front | [05-frontend-modules.md](05-frontend-modules.md) §features (legado) |
| Deploy, Docker, variáveis de ambiente, CI | [06-infra-deploy.md](06-infra-deploy.md) |
| Segurança (o que já foi corrigido e por quê) | [06-infra-deploy.md](06-infra-deploy.md) §Segurança |

## Arquivos deste diretório

1. [00-overview.md](00-overview.md) — visão geral: stack, camadas, fluxo de uma requisição, convenções inter-arquivo (AGENTS.md resumido com ponteiros).
2. [01-backend-core.md](01-backend-core.md) — infraestrutura transversal do backend (`backend/src/core/`): auth, authorization, tenancy, pii, audit, files, rate-limit, config, email, cep.
3. [02-backend-modules.md](02-backend-modules.md) — módulos de domínio do backend (`backend/src/modules/`): people, people-groups, programs, projects, project-structure, actions, occurrences, attendances, pantry, deposit, tasks, dashboard, registration, permissions, roles, tenants, users.
4. [03-database.md](03-database.md) — modelo de dados Prisma: famílias de tabelas, relações, enums, convenções de migration.
5. [04-frontend-web-client.md](04-frontend-web-client.md) — infraestrutura de UI reutilizável (`frontend/src/web-client/`): List, Detail, Relation, registry de contratos, data-provider.
6. [05-frontend-modules.md](05-frontend-modules.md) — telas de cada módulo (`frontend/src/modules/`) e o que resta do legado (`frontend/src/features/`).
7. [06-infra-deploy.md](06-infra-deploy.md) — Docker, ambientes, variáveis de ambiente, CI, segurança (resumo navegável da auditoria de riscos).

## Como manter isto vivo

Este conjunto de documentos não é atualizado automaticamente. Ao fechar
qualquer item do `PLAN.md` que mude uma pasta/módulo descrito aqui, vale
atualizar a seção correspondente — mas isso **não é obrigatório por
regra do projeto**, é só recomendado para a documentação não apodrecer
rápido. Se notar algo errado ou desatualizado, corrija direto; não é um
documento formal que exige aprovação para editar.
