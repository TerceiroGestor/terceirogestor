# 📌 BACKLOG MASTER — Plataforma de Gestão Socioassistencial

Este documento consolida todos os épicos acordados para a construção da plataforma, organizados por fases e prioridade.

- Legenda: `- [x]` concluído | `- [ ]` pendente
- Estado revisado em: **2026-02-16**

## 📍 Status por fase (visão geral)

- [ ] **FASE 0 — Fundação** (pendências: exportação de usuários, OAuth UI, storage de produção)
- [x] **FASE 1 — Pessoas e Famílias** (core concluído; pendências opcionais: georreferência, qualidade de dados)
- [ ] **FASE 2 — Organização institucional**
- [ ] **FASE 3 — Operação diária**
- [ ] **FASE 4 — Suporte material** (core concluído; pendência: vínculo com ação/atendimento)
- [ ] **FASE 5 — Educação e cursos**
- [ ] **FASE 6 — Relatórios e indicadores**
- [ ] **FASE 7 — Governança** (core concluído; pendência: retenção/rotação/exportação)
- [ ] **FASE 8 — Portal familiar**
- [ ] **FASE 9 — Portal do parceiro**
- [ ] **FASE 10 — Área do assinante**
- [ ] **FASE 11 — Experiência**

## ✅ Definição de pronto (DoD) para qualquer épico

- [ ] Modelagem (Prisma) + migrações + seed (quando aplicável)
- [ ] API (NestJS): controllers/services/DTOs/validações
- [ ] Permissões (RBAC): chaves + guards aplicados + seeds/roles padrão
- [ ] UI (Next.js): telas + formulários + estados de erro + loading
- [ ] Auditoria/logs: evento registrado e campos sensíveis redigidos
- [ ] Testes mínimos (unit/e2e) + documentação de uso

---

# 🧱 FASE 0 — FUNDAÇÃO

## ÉPICO 0.1 — Autenticação & Sessões

- [x] Login
- [x] Logout
- [x] Refresh Token (rotação via cookie)
- [x] Logs de acesso (LOGIN/REFRESH/LOGOUT)
- [x] MFA/TOTP (challenge + dispositivo confiável)
- [x] Recuperação de senha (fluxo por e-mail com token)
- [x] Troca de senha (usuário autenticado)
- [x] Proteções anti-abuso (rate limit/brute force) nos endpoints sensíveis

## ÉPICO 0.2 — Usuários

- [x] Criar usuário
- [x] Editar usuário
- [x] Ativar/Inativar usuário
- [x] Resetar senha (admin)
- [x] Perfil do usuário (me) + permissões efetivas
- [ ] Exportação/relatório de usuários (opcional)

## ÉPICO 0.3 — Papéis e Permissões

- [x] Criar papel/perfil
- [x] Editar papel/perfil
- [x] Definir permissões (catálogo)
- [x] Atribuir papel ao usuário
- [x] Guard de permissões por rota (backend)
- [x] UX de “permissões por módulo” (frontend, opcional)

## ÉPICO 0.4 — Instituições (Tenants) & Onboarding

- [x] Cadastro/gestão de instituição (Tenant)
- [x] Registro por e-mail (código) + confirmação
- [x] Registro OAuth (Google/Microsoft) — backend
- [ ] Fluxo OAuth (botões/UX) — frontend (se desejado)
- [x] Logo da instituição (upload)
- [ ] Política de domínios/SSO (para clientes maiores, opcional)

## ÉPICO 0.5 — Arquivos (Uploads)

- [x] Upload de avatar (pessoas/usuários)
- [x] Upload de logo (instituição)
- [x] Upload de documentos de saúde (imagens/PDF)
- [ ] Storage de produção (S3/MinIO) + URLs assinadas + antivírus/scan
- [ ] Retenção, expurgo e trilha LGPD para arquivos sensíveis

---

# 👥 FASE 1 — PESSOAS E FAMÍLIAS

## ÉPICO 1.1 — Pessoas

- [x] Cadastro de pessoa
- [x] Documentos sensíveis separados (tabela própria + criptografia + RBAC + auditoria reforçada)
- [x] Contatos (e-mail/telefone)
- [x] Contatos múltiplos (telefones/e-mails + responsáveis + preferências)
- [x] Endereço (domicílio via CEP/ViaCEP)
- [ ] Georreferência (opcional)
- [x] Foto (avatar) + upload
- [x] Observações gerais (notas, resumo, tags)

## ÉPICO 1.2 — Vínculos Familiares

- [x] Criar vínculo pessoa-pessoa
- [x] Definir parentesco
- [x] Composição familiar (mora junto → domicílio)
- [x] Responsável familiar (chefe do domicílio/guardião legal)
- [x] Árvore genealógica
- [ ] “Qualidade de dados” (alertas de inconsistência: ciclos, duplicidades, idades impossíveis)

## ÉPICO 1.3 — Condições Individuais

- [x] Saúde (condições)
- [x] Medicamentos (com documentos)
- [x] Escolaridade (nível atual + histórico escolar)
- [x] Trabalho/Renda (rendas, despesas, contribuições, transferências)
- [x] Reclusão (situação/medidas/observações)
- [x] Benefícios/Programas sociais (ex.: Bolsa Família, BPC, etc.)

---

# 🏢 FASE 2 — ORGANIZAÇÃO INSTITUCIONAL

## ÉPICO 2.1 — Programas

- [ ] Criar programa
- [ ] Tipagem (SCFV, PAIF, Cultura, Qualificação, etc.)
- [ ] Ativar/Inativar
- [ ] Permissões e visibilidade por unidade/equipe (se aplicável)

## ÉPICO 2.2 — Projetos

- [ ] Criar projeto
- [ ] Vincular programa
- [ ] Status do projeto
- [ ] Período de execução
- [ ] Metas/indicadores por projeto (base para dashboards)

## ÉPICO 2.3 — Estruturas do Projeto

- [ ] Grupos
- [ ] Turmas
- [ ] Ciclos
- [ ] Alocar pessoas
- [ ] Regras de elegibilidade (idade, perfil, etc.)

---

# 🗓️ FASE 3 — OPERAÇÃO DIÁRIA

## ÉPICO 3.1 — Ações

- [ ] Tipos de ação
- [ ] Planejamento
- [ ] Execução
- [ ] Presença
- [ ] Destaques
- [ ] Relatório
- [ ] Voluntários
- [ ] Anexos por ação (fotos/docs) + auditoria

## ÉPICO 3.2 — Presenças

- [ ] Registro individual
- [ ] Registro em massa
- [ ] Justificativa
- [ ] Histórico

## ÉPICO 3.3 — Ocorrências

- [ ] Registro
- [ ] Classificação
- [ ] Gravidade
- [ ] Acompanhamento
- [ ] Conclusão

## ÉPICO 3.4 — Atendimentos

- [ ] Registro
- [ ] Evoluções
- [ ] Plano de ação
- [ ] Conclusão

## ÉPICO 3.5 — Encaminhamentos

- [ ] Criar encaminhamento
- [ ] Definir destino
- [ ] Acompanhamento
- [ ] Conclusão

---

# 📦 FASE 4 — SUPORTE MATERIAL

## ÉPICO 4.1 — Estoque / Depósito

- [x] Cadastro de itens
- [x] Categorias/Grupos
- [x] Entrada
- [x] Saída
- [x] Validade
- [x] Alerta mínimo
- [x] Doadores (pessoa/empresa)
- [x] Reversão de movimentos (estorno) + alocação por lote
- [x] Dashboard/consumo/fluxo/uso
- [ ] Vínculo com ação/atendimento (FASE 3)

---

# 🎓 FASE 5 — EDUCAÇÃO E CURSOS

## ÉPICO 5.1 — Cursos

- [ ] Criar curso
- [ ] Criar módulos
- [ ] Criar aulas
- [ ] Matrícula
- [ ] Player
- [ ] Progresso
- [ ] Certificados + trilhas (opcional)

---

# 📊 FASE 6 — RELATÓRIOS E INDICADORES

## ÉPICO 6.1 — Dashboards

- [ ] Institucional
- [ ] Programa
- [ ] Projeto
- [ ] Indicadores de operação (ações, presenças, atendimentos, etc.)

## ÉPICO 6.2 — Relatórios

- [ ] Frequência
- [ ] Ocorrências
- [ ] Atendimentos
- [ ] Encaminhamentos
- [ ] Estoque
- [ ] Ações
- [ ] Exportações (CSV/PDF) + trilha de auditoria

---

# 🧾 FASE 7 — GOVERNANÇA

## ÉPICO 7.1 — Auditoria

- [x] Log de ações (auditoria por entidade)
- [x] Histórico de alterações (before/after) com redação de campos sensíveis
- [ ] Retenção de logs + rotação + exportação (compliance)

## ÉPICO 7.2 — Templates

- [ ] Template de planejamento
- [ ] Template de relatório

---

# 👨‍👩‍👧‍👦 FASE 8 — PORTAL FAMILIAR

## ÉPICO 8.1 — Acesso do Responsável

- [ ] Login
- [ ] Recuperação de senha
- [ ] MFA opcional

## ÉPICO 8.2 — Gestão de Familiares

- [ ] Cadastrar familiar
- [ ] Atualizar dados
- [ ] Solicitar alteração (workflow de aprovação)

## ÉPICO 8.3 — Acompanhamento

- [ ] Presenças
- [ ] Ações realizadas
- [ ] Comunicados

---

# 🤝 FASE 9 — PORTAL DO PARCEIRO

## ÉPICO 9.1 — Acesso

- [ ] Login do parceiro
- [ ] Permissões e recortes (somente o que o parceiro pode ver)

## ÉPICO 9.2 — Dashboard de Impacto

- [ ] Atendidos
- [ ] Ações
- [ ] Presenças
- [ ] Projetos ativos

## ÉPICO 9.3 — Relatórios

- [ ] Visualizar
- [ ] Download PDF

---

# 💳 FASE 10 — ÁREA DO ASSINANTE

## ÉPICO 10.1 — Planos e Assinaturas

- [ ] Contratar plano
- [ ] Cancelar plano
- [ ] Trilhas de upgrade/downgrade (opcional)

## ÉPICO 10.2 — Pagamentos

- [ ] Integração Mercado Pago
- [ ] Webhooks
- [ ] Conciliação + idempotência de eventos

## ÉPICO 10.3 — Controle de Acesso

- [ ] Aviso de vencimento
- [ ] Bloqueio parcial
- [ ] Bloqueio total
- [ ] Reativação

## ÉPICO 10.4 — Histórico Financeiro

- [ ] Faturas
- [ ] Recibos

## ÉPICO 10.5 — Suporte

- [ ] Abrir chamado
- [ ] Acompanhar chamado
- [ ] SLA + categorização (opcional)

---

# ✨ FASE 11 — EXPERIÊNCIA

## ÉPICO 11.1 — Notificações

- [ ] Ocorrência crítica
- [ ] Encaminhamento pendente
- [ ] Estoque baixo
- [ ] Canal (e-mail/in-app/WhatsApp) + opt-in (LGPD)

## ÉPICO 11.2 — Calendário

- [ ] Ações
- [ ] Atendimentos
- [ ] Reuniões
- [ ] iCal/Google Calendar (opcional)

---

# ✅ FIM DO DOCUMENTO
