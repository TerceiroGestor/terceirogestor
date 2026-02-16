# Plano de desenvolvimento — épico por épico

Revisado em **2026-02-16** com base no estado atual do repositório (backend NestJS + Prisma + MySQL; frontend Next.js).

## Princípios para um sistema robusto, seguro e fácil de manter

1) **Multi-tenant por padrão**: toda query deve ser escopada por `tenantId` e toda rota deve exigir autenticação + permissão quando aplicável.  
2) **Auditoria e rastreabilidade**: toda mutação relevante gera `AuditLog` (com redação de campos sensíveis).  
3) **Dados sensíveis (LGPD)**: separar/criptografar PII crítica (documentos, saúde, anexos) e registrar acesso.  
4) **Módulos pequenos e coesos**: cada domínio tem seu módulo (API + UI + permissões + seeds).  
5) **Idempotência e consistência**: webhooks/pagamentos/integrações com reprocessamento seguro.  
6) **Operação previsível**: backups, migrações, observabilidade e alertas fazem parte da entrega.

## Ordem sugerida (para destravar o produto)

1. **FASE 0** (hardening): fechar lacunas de segurança (recuperação de senha, rate limit, cookies/headers).  
2. **FASE 1** (pessoas): completar endereço/contatos/documentos sensíveis e escolaridade.  
3. **FASE 2** (programas/projetos): base institucional para operar o dia a dia.  
4. **FASE 3** (operação): ações/presenças/atendimentos/encaminhamentos e integrações com estoque.  
5. **FASE 6** (indicadores): dashboards e relatórios para gestão e parceiros.  
6. Portais (FASE 8/9) e Assinaturas (FASE 10) entram quando o “core” estiver estável.

---

# FASE 0 — FUNDAÇÃO

## ÉPICO 0.1 — Autenticação & Sessões

**Status**: concluído (login/logout/refresh + MFA + recuperação/troca de senha + anti-abuso).

**Plano (melhorias recomendadas)**:
- Revisar política de cookies/headers por ambiente (ex.: `Secure` em produção) e manter padronizado.
- Monitorar limites (rate limit) e ajustar conforme uso real.

**Critérios de aceite**:
- Tokens não vazam em logs/auditoria; sessões antigas são revogadas após reset.
- Testes unitários de fluxo e teste e2e de ponta-a-ponta.

## ÉPICO 0.2 — Usuários

**Status**: concluído (CRUD + ativação + reset senha admin + perfil).

**Plano (melhorias recomendadas)**:
- Políticas de senha (NIST-like: mínimo + bloqueio de senhas comuns).
- Convite por e-mail (opcional) em vez de setar senha manualmente.
- Trilhas de auditoria de ações administrativas (já existe) e UI para filtros.

## ÉPICO 0.3 — Papéis e Permissões

**Status**: concluído.

**Plano (melhorias recomendadas)**:
- Agrupar permissões por “módulo” no frontend.
- Criar papéis padrão por tipo de instituição (Admin, Técnico, Financeiro, Leitor).

## ÉPICO 0.4 — Instituições (Tenants) & Onboarding

**Status**: parcialmente concluído (e-mail ok; OAuth backend ok; UI OAuth pendente).

**Plano (pendências)**:
- Finalizar UX do registro OAuth (botões, copy, erros e fallback).
- Adicionar governança de tenant:
  - domínios permitidos,
  - convite de usuários,
  - travas de slug/nome e política de renomeação.

## ÉPICO 0.5 — Arquivos (Uploads)

**Status**: concluído para ambiente local; pendente para produção/compliance.

**Plano (pendências)**:
- Migrar uploads para **storage externo** (S3/MinIO) e servir via URL assinada.
- Antivírus/scan (ex.: ClamAV) e validação adicional de MIME/assinatura.
- Regras de retenção/expurgo e “right to be forgotten” (LGPD).

---

# FASE 1 — PESSOAS E FAMÍLIAS

## ÉPICO 1.1 — Pessoas

**Status**: concluído.

**Entregas**:
- **Endereço** definido como **domicílio** (`HouseholdProfile`) com validação de CEP via **ViaCEP** e visualização no mapa.
- **Contatos múltiplos** (`PersonContact`) com e-mails/telefones + responsáveis/emergência + preferências (primário/WhatsApp).
- **Documentos sensíveis** em tabela dedicada (`PersonSensitiveDocument`) com **criptografia em repouso** + **RBAC** (`people.sensitive.*`) e **auditoria/log de acesso**.

**Plano (próximos incrementos/opcionais)**:
- Georreferência (quando necessário) e filtros por território.

**Critérios de aceite**:
- PII não aparece em `AuditLog`/logs; acessos são rastreáveis e limitados por permissão.

## ÉPICO 1.2 — Vínculos Familiares

**Status**: concluído (vínculos + domicílio + árvore).

**Plano (melhorias recomendadas)**:
- Detecção de inconsistências (ciclos na árvore, relações conflitantes).
- Deduplicação de pessoas (fuzzy match com revisão humana).

## ÉPICO 1.3 — Condições Individuais

**Status**: concluído (saúde/medicação/renda/escolaridade/benefícios/reclusão).

**Plano (melhorias recomendadas)**:
- Escolaridade:
  - anexos (declarações) via uploads seguros (opcional).
- Benefícios sociais:
  - concluído (tipo/valor/frequência/período + histórico por pessoa).

---

# FASE 2 — ORGANIZAÇÃO INSTITUCIONAL

## ÉPICO 2.1 — Programas

**Plano**:
- Modelagem: `Program` + tipagem + status + metas/indicadores básicos.
- API: CRUD + ativar/inativar + permissões (`programs.*`).
- UI: listagem + formulário + filtros.
- Seeds: permissões e papel Admin com acesso total.

## ÉPICO 2.2 — Projetos

**Plano**:
- Modelagem: `Project` ligado a `Program` + período + status.
- UI: visão de projetos + detalhes (pessoas alocadas, turmas, ações).
- Auditoria e logs de mudanças de status.

## ÉPICO 2.3 — Estruturas do Projeto

**Plano**:
- Modelagem: `Group`, `Class`, `Cycle` e relações.
- Regras: capacidade, elegibilidade, inscrições.
- UI de alocação (drag/drop ou assistente) + trilha de auditoria.

---

# FASE 3 — OPERAÇÃO DIÁRIA

## ÉPICO 3.1 — Ações

**Plano**:
- Modelagem: `ActionType`, `Action`, `ActionPlan`, `ActionReport`, anexos.
- Fluxo: planejar → executar → registrar presença → gerar relatório.
- Integração com estoque (FASE 4): saída vinculada a ação/atendimento.
- Permissões (`actions.*`) e auditoria.

## ÉPICO 3.2 — Presenças

**Plano**:
- Modelagem: `Attendance` por pessoa + ação/turma.
- Registro em massa com validações (duplicidade, período).
- Histórico e justificativas.

## ÉPICO 3.3 — Ocorrências

**Plano**:
- Modelagem: `Occurrence` com classificação, severidade, timeline.
- Notificações (FASE 11) para severidade alta.

## ÉPICO 3.4 — Atendimentos

**Plano**:
- Modelagem: `ServiceCase`/`Appointment` + evolução + plano de ação.
- Permitir anexos e vincular encaminhamentos.

## ÉPICO 3.5 — Encaminhamentos

**Plano**:
- Modelagem: `Referral` com destino, status, retorno.
- Relatórios e alertas de pendências.

---

# FASE 4 — SUPORTE MATERIAL

## ÉPICO 4.1 — Estoque / Depósito

**Status**: concluído, faltando integração com FASE 3.

**Plano (pendência)**:
- Relacionar saída/entrada com `Action`/`ServiceCase` e refletir em relatórios.

---

# FASE 5 — EDUCAÇÃO E CURSOS

## ÉPICO 5.1 — Cursos

**Plano**:
- Decidir se “cursos” são internos (LMS) ou apenas registros de participação.
- Se LMS: modelagem (curso/módulo/aula/matrícula/progresso) + player.
- Se registro: integrar com Ações/Presenças.

---

# FASE 6 — RELATÓRIOS E INDICADORES

## ÉPICO 6.1/6.2 — Dashboards e Relatórios

**Plano**:
- Definir indicadores por fase (pessoas atendidas, frequência, evolução, estoque, etc.).
- Queries otimizadas + índices + cache (quando necessário).
- Exportações (CSV/PDF) com trilha de auditoria.
- Permissões (`reports.*`) e recortes por tenant/programa/projeto.

---

# FASE 7 — GOVERNANÇA

## ÉPICO 7.1 — Auditoria

**Status**: concluído (core), faltando políticas operacionais.

**Plano (pendências)**:
- Retenção/rotação de logs.
- Exportação segura para auditoria externa (com mascaramento).

## ÉPICO 7.2 — Templates

**Plano**:
- Motor de templates (ex.: JSON Schema + renderizador) para relatórios/planejamentos.
- Versionamento de templates e permissões.

---

# FASE 8/9/10/11 — Portais, Assinaturas e Experiência

**Plano macro**:
- Portais (8/9): autenticação própria + RBAC + recortes fortes de dados; começar pequeno (apenas leitura).
- Assinaturas (10): Mercado Pago + webhooks idempotentes + gating por tenant.
- Notificações/Calendário (11): infraestrutura de jobs (fila), canais (in-app/e-mail) e preferências do usuário.
