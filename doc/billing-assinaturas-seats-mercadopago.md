# Billing (assinaturas) — seats + Mercado Pago (padrão do Platform)

Este documento define o **padrão de assinatura** do Platform quando a cobrança é **somente por usuário (seats)** e o provedor escolhido é **Mercado Pago**.

## 1) Objetivo

- O Platform deve permitir que qualquer produto derivado ative Billing sem reescrever o core.
- Billing deve controlar:
  - `seatsPurchased` (contratados)
  - `seatsUsed` (em uso)
  - `subscriptionStatus` (estado da assinatura)
- Billing deve alimentar o sistema de módulos (`TenantModule`) e restrições de escrita.

## 2) Pacotes propostos (Platform Packages versionado)

- `@platform/billing-core`
  - Modelos (Plan/Subscription/Event)
  - Regras (seat policy, status policy)
  - Entitlements (read-only, limites)
  - Interface `BillingProvider`
- `@platform/billing-mercadopago`
  - Implementação do provider Mercado Pago
  - Webhooks + validação de assinatura
  - Sincronização/reconciliação
- `@platform/admin-billing-ui`
  - Tela de assinatura (status, seats, ações)
  - Histórico de eventos

> Observação: manter o provider separado é essencial para permitir troca futura (ex.: Stripe) sem quebrar produtos.

## 3) Políticas (decisões fechadas)

### 3.1 Seats (cobrança por usuário)

- `seatsUsed` = quantidade de usuários `isActive=true` no tenant.
- Não existem “roles gratuitas” no v1 (mantém previsibilidade e evita abuso).
- Regras:
  - Se `seatsUsed >= seatsPurchased`, bloquear:
    - criação de usuário
    - ativação de usuário
    - convite/aceite (se existir fluxo)
  - Não bloquear login de usuários já ativos apenas por exceder seats (o excesso deve ser impedido na entrada).

### 3.2 Inadimplência (`past_due`)

Política recomendada e adotada:
- `past_due` = **read-only** + **sem admin/escrita** (com carência configurável).

Comportamento:
- Permite autenticação e leitura (GET).
- Bloqueia ações administrativas e mutações (POST/PATCH/DELETE).
- Exibir banner na UI orientando pagamento.

Estados sugeridos:
- `trialing` → `active` → `past_due` → `canceled`
- (opcional) `overdue_hard`: após carência, read-only total ou bloqueio de login (decisão por produto).

## 4) Enforcement (onde as regras “pegam”)

### Backend (segurança real)

Obrigatório:
- `SubscriptionGuard` (ou interceptor) que bloqueia mutações quando `status=past_due`.
- `SeatLimitGuard` aplicado nas rotas de criação/ativação de usuário.

Recomendação:
- Unificar a decisão em um único lugar (ex.: `BillingPolicyService`) para não espalhar `if` em services.

### Frontend (UX)

Obrigatório:
- Ocultar/desabilitar botões de ações que não funcionarão (`past_due`).
- Banner global no layout quando `past_due`.

## 5) Dados (modelo mínimo no banco)

### Tabelas

- `Plan`
  - `id`, `key`, `name`, `seatPrice`, `currency`, `interval` (mensal), `isActive`
- `Subscription`
  - `tenantId`, `planId`, `status`, `seatsPurchased`
  - `provider` (`MERCADOPAGO`)
  - `providerCustomerId?`, `providerSubscriptionId?`
  - `currentPeriodEnd?`
  - `pastDueSince?` (para carência)
- `BillingEvent`
  - `providerEventId` (idempotência)
  - `type`, `receivedAt`, `processedAt?`
  - `tenantId?`
  - `payloadRaw` (armazenar mínimo necessário; evitar dados sensíveis)

### Derivações (não armazenar manualmente)
- `seatsUsed` deve ser calculado por query.

## 6) Webhooks (Mercado Pago)

Padrão de processamento:
1) Validar assinatura (`x-signature`) e timestamp conforme documentação do MP.
2) Persistir um `BillingEvent` (idempotente) o mais rápido possível.
3) Enfileirar/rodar processamento assíncrono:
   - Buscar detalhes na API do MP (quando aplicável).
   - Atualizar `Subscription` local.
   - Atualizar cache/estado do tenant.

Regras importantes:
- Idempotência: o mesmo evento pode chegar mais de uma vez.
- Resposta rápida: o MP re-tenta se o endpoint não confirmar em tempo.

## 7) UI Admin (mínimo vendável)

Tela “Assinatura” (Settings):
- Plano atual
- Status (`trialing/active/past_due/canceled`)
- Seats: contratados vs usados
- Botões:
  - aumentar seats (upgrade)
  - cancelar assinatura
  - “resolver pagamento” (link de portal/checkout)
- Histórico de eventos (timeline) usando um componente padrão (pode reaproveitar `AuditTimelineEngine` no futuro)

## 8) Modo dev/teste (obrigatório para plataforma)

Criar um provider fake:
- `@platform/billing-fake`
  - Permite simular estados e seats sem Mercado Pago.
  - Evita que todo produto dependa de credenciais MP para desenvolver.

## 9) Checklist de PR (Billing)

- Webhook validando assinatura?
- Idempotência garantida?
- `past_due` bloqueando mutação no backend?
- UI “read-only” consistente?
- Seats bloqueando criação/ativação?

