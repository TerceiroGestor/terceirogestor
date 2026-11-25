# Backend — infraestrutura transversal (`backend/src/core/`)

*Última revisão: 2026-11-25. Escopo: `backend/src/core/` + fiação global
(`backend/src/app.module.ts`, `backend/src/main.ts`).*

Este é o código que **todo módulo de domínio** (`backend/src/modules/*`)
depende, direta ou indiretamente. Se o problema é "autenticação",
"permissão", "vazamento entre tenants", "arquivo não abre", "log de
auditoria faltando" ou "rate limit bloqueando sem motivo", comece aqui —
não dentro do módulo de negócio.

## Fiação global (`app.module.ts` / `main.ts`)

- `main.ts`: `trust proxy` (via `core/config/trust-proxy.ts`), Helmet
  (`crossOriginResourcePolicy: cross-origin` — necessário porque o
  frontend carrega `/uploads/...` cross-origin), ETag desabilitado,
  `Cache-Control: no-store` forçado, `ValidationPipe` global
  (`whitelist`, `transform`, `forbidUnknownValues`), CORS por allowlist
  (`WEB_URL`, via `core/auth/http/auth-http.ts`), filtro global de
  exceção do Sentry.
- `app.module.ts`: `ConfigModule.forRoot({ validate: validateEnv })`.
  **Middleware global** (toda rota): `TenancyMiddleware` →
  `RequestContextMiddleware`, nessa ordem.
  **Guard global:** só `RateLimitGuard` (`APP_GUARD`). **`JwtAuthGuard` e
  `PermissionsGuard` NÃO são globais** — cada controller precisa optar
  explicitamente com `@UseGuards(...)`. **Se um controller novo esquecer
  `@UseGuards`, a rota fica pública por padrão.** Primeira coisa a
  checar numa rota que "deveria exigir login mas não exige".
  **Interceptor global:** `RequestContextInterceptor` +
  `SignUploadsInterceptor` (este último registrado dentro de
  `FilesModule`, mas roda em toda resposta da aplicação, não só em
  `/files`).
- Ordem de uma requisição autenticada+permissionada: `TenancyMiddleware`
  → `RequestContextMiddleware` → `RateLimitGuard` (global) →
  `JwtAuthGuard` (da rota) → `PermissionsGuard` (da rota) →
  `RequestContextInterceptor` → `SignUploadsInterceptor` → handler →
  extensão de auditoria do Prisma em qualquer escrita.

## Auth (`core/auth/`)

Login, refresh, logout, reset de senha, e o sub-módulo de MFA.

| Arquivo | Responsabilidade |
|---|---|
| `auth.module.ts` | `JwtModule` (access token de 15 min, segredo = `JWT_SECRET`), registra `AuthController`, `MfaController`, `JwtStrategy`. |
| `auth.service.ts` | `validateUser` (bcrypt), `loginWithMeta` (ramifica pra MFA), `createSessionForUser`/`createLoginSessionForUser` (emite JWT + refresh token, grava `UserSession` + `AccessLog`), `refresh` (rotaciona refresh token, detecta reuso), `logout`, `requestPasswordReset`/`resetPassword` (token hasheado, TTL 30 min). |
| `auth.controller.ts` | `POST /auth/login`, `/forgot-password`, `/reset-password`, `/refresh`, `/logout`, `GET /auth/access-logs`. Rate-limited. |
| `guards/jwt-auth.guard.ts` | Wrapper do `AuthGuard('jwt')` do Passport. |
| `strategies/jwt.strategy.ts` | Valida assinatura/expiração e **cruza `payload.tenantId` com `req.tenantId`** (setado pelo `TenancyMiddleware` a partir do slug da URL) — rejeita (401) se não bater. Retorna `JwtUser = { userId, tenantId, tenantSlug, email, name, tenantName }`. |
| `decorators/current-user.decorator.ts` | `@CurrentUser()` — **única fonte sancionada de `tenantId` em controllers de domínio.** |
| `types/auth-token-payload.ts` | Formato exato assinado no JWT. |
| `dto/login.dto.ts` etc. | `LoginDto.tenantId` é opcional e só usado como *fallback* quando o slug da URL não resolveu tenant; se o body discordar do tenant resolvido pela URL, `AuthService` lança erro. |
| `http/auth-http.ts` | Cookies de refresh (`httpOnly`, `sameSite=lax`, `secure` auto), `getRequestMeta` (ip/user-agent p/ `AccessLog`), `parseWebUrlList`/`isOriginAllowed`/`getPrimaryWebUrl` (CORS e e-mail de reset). |

### MFA (`core/auth/mfa/`)

| Arquivo | Responsabilidade |
|---|---|
| `mfa.controller.ts` (`/auth/mfa`) | `totp/setup`, `totp/confirm`, `totp/disable` (autenticado); `totp/verify` é **público** — é o 2º passo do login, usa `challengeId`, sem JWT ainda. |
| `mfa-totp.service.ts` | `createSetup` (segredo criptografado, TTL 10 min), `confirmSetup` (verifica código, ativa MFA, emite 10 códigos de recuperação hasheados), `disableTotp`, `createChallenge`/`verifyChallenge` (TTL 5 min, até 5 tentativas, aceita TOTP ou código de recuperação), `isTrustedDeviceValid`/`rememberDevice` (cookie "confiar neste dispositivo", 30 dias). |
| `mfa-crypto.service.ts` | AES-256-GCM do segredo TOTP, chave = `TOTP_ENCRYPTION_KEY`. **Se a env var não estiver setada, cai silenciosamente num fallback fraco (`sha256(JWT_SECRET)`, com warning no console)** — `env-validation.ts` torna essa variável obrigatória no boot justamente pra isso nunca acontecer em produção; qualquer warning desse tipo no log é má configuração grave. |
| `totp.service.ts` / `base32.ts` | Matemática RFC-6238 (SHA1, 6 dígitos, passo de 30s, janela ±1), URL `otpauth://` pro QR code, comparação de código em tempo constante. |
| `mfa.constants.ts` | TTLs e limites (challenge 5 min, setup 10 min, trusted device 30 dias, 5 tentativas). |

**Fluxo login→MFA→sessão:** `POST /t/:slug/auth/login` → middleware resolve
tenant pelo slug → `AuthService.loginWithMeta` valida credenciais; se TOTP
ativo e sem cookie de dispositivo confiável válido, devolve
`{ mfaRequired: true, challengeId }` em vez de tokens → cliente chama
`POST /auth/mfa/totp/verify` com o código → sucesso cria sessão igual a
um login normal. Access token: JWT de 15 min, **sem revogação no banco**
(stateless) — só espera expirar ou revoga a sessão (que só afeta
refresh). Refresh: token opaco (não-JWT), hash SHA-256 em `UserSession`,
**rotaciona a cada uso** e detecta reuso de um token já revogado/expirado
revogando **todas** as sessões daquele usuário (proteção contra roubo).
14 dias de expiração.

## Authorization / RBAC (`core/authorization/`)

Ponto de **aplicação** das permissões — os dados (Role/Permission/
RolePermission/UserRole) vivem em `modules/roles`/`modules/permissions`
(ver `02-backend-modules.md`).

- `permissions.decorator.ts` — `@Permissions('key1', 'key2', ...)`.
- `permissions.guard.ts` — `PermissionsGuard`: lê as chaves exigidas via
  `Reflector`; sem decorator, libera. Senão, carrega `req.user` (**precisa
  rodar depois do `JwtAuthGuard` no array de `@UseGuards`**), busca
  `Role` do usuário escopado por `tenantId`, depois `RolePermission` →
  `Permission` (mesmo escopo) e exige **todas** as chaves (E lógico, não
  OU). Sem permissão → `ForbiddenException`. Sem cache — 2 round-trips ao
  banco por requisição guardada.
- Uso típico: `@UseGuards(JwtAuthGuard, PermissionsGuard)` +
  `@Permissions('audit.read')` no controller.

## Tenancy (`core/tenancy/`) — o invariante mais crítico do projeto

- `tenancy.middleware.ts` (global, roda primeiro): casa `/t/:slug/...`,
  busca `Tenant.findUnique({ where: { slug } })` (slug desconhecido →
  404, nunca revela mais), seta `req.tenantId`/`req.tenantSlug` e
  **reescreve `req.url`** removendo o prefixo `/t/:slug`.
- Esse `req.tenantId` é a **única** fonte de tenant fora do JWT, e vem de
  uma consulta ao banco pelo slug — nunca é um id bruto vindo do cliente.
  Depois de autenticado, o `tenantId` do JWT é soberano (a `JwtStrategy`
  rejeita qualquer divergência); `req.tenantId` só importa nos fluxos
  pré-auth (login, forgot-password, verify do MFA) ou como checagem de
  adulteração.
- **Nada em `core/` força `tenantId` automaticamente no nível do
  Prisma** (ver `core/prisma/` abaixo) — cada service de
  `modules/*` é responsável por incluir `tenantId` no `where` de toda
  consulta. Esta camada só garante **de onde o valor pode vir**, não que
  toda query o usa.

## PII (`core/pii/`)

Criptografia envelope para campos sensíveis (ex.: CPF, documentos),
separada da criptografia do segredo MFA.

- `pii-crypto.ts` — `parseMasterKey` (base64, ≥32 bytes, de
  `PII_MASTER_KEY`), `deriveTenantKey(masterKey, tenantId)` (HKDF-SHA256
  — **cada tenant tem sua própria chave derivada**, não uma chave global
  única), `encryptJson`/`decryptJson` (AES-256-GCM, IV aleatório de 12
  bytes).
- `pii-crypto.service.ts` — `PiiCryptoService.encryptForTenant`/
  `decryptForTenant`, cacheia a master key em memória.
- Único consumidor hoje: `modules/people/people.service.ts`. Qualquer
  campo sensível novo em qualquer módulo deveria passar por este
  serviço, não por criptografia ad hoc.

## Audit (`core/audit/` + extensão em `core/prisma/`)

- `core/audit/` é só o **lado de leitura**: `audit.controller.ts`
  (`GET /audit-logs`, `GET /audit-logs/:id`, exige
  `@Permissions('audit.read')`) e `audit.service.ts` (sempre filtrado
  por `tenantId` de `@CurrentUser()`, paginado, máx. 200/página).
- A **escrita** acontece dentro de `PrismaService`
  (`core/prisma/prisma.service.ts`): uma extensão de query do Prisma
  envolve `create/update/delete/upsert/createMany/updateMany/deleteMany`
  de **todo** model (exceto `AuditLog`/`AccessLog`/
  `PersonSensitiveAccessLog`, pra não recursar). Para
  update/delete/upsert, tira um snapshot "antes" via `findFirst`/
  `findMany` antes de rodar a query real, e grava `AuditLog` com JSON
  redigido (chaves como `password`, `cpf`, `token*`, `secret`,
  `dataenc`/`iv`/`tag` viram `'[REDACTED]'`). `tenantId`/`userId`/
  `ipAddress`/`userAgent`/`requestId` vêm do `RequestContextService`
  (abaixo) — **sem tenantId resolvido, a auditoria é silenciosamente
  descartada.** Falhas na escrita de auditoria nunca quebram a operação
  de negócio (try/catch + warn + Sentry).
- **Gotcha:** `RequestContextStore.disableAudit` é uma válvula de escape
  pra pular auditoria numa requisição — grep por `disableAudit` antes de
  assumir que toda escrita é auditada. Operações em lote só tiram
  snapshot de até 50 linhas (`BULK_AUDIT_LIMIT`); além disso, grava um
  resumo truncado em vez de antes/depois por linha.

## Files (`core/files/`)

Ponto único de upload/download de todo arquivo do sistema (avatar,
documento de saúde, logo do tenant, anexos de actions/people/pantry/
deposit/programs/projects/tasks/people-groups).

| Arquivo | Responsabilidade |
|---|---|
| `files.module.ts` | Registra `FilesController`, `UploadsController`, `StorageService`, e `SignUploadsInterceptor` como `APP_INTERCEPTOR` **global**. |
| `files.controller.ts` | Um endpoint `@Post` por categoria de upload, cada um `@UseGuards(JwtAuthGuard)`, multer `memoryStorage`, limite de tamanho e extensões permitidas por categoria. `assertFileContentMatchesExtension` (checagem de magic bytes) roda **depois** do multer bufferizar — é a checagem que manda de verdade, já que extensão/MIME declarados pelo cliente são falsificáveis. |
| `file-signature.ts` | Assinaturas de magic bytes (jpg/png/gif/webp/pdf/família zip — docx/xlsx/pptx/zip —, família OLE — doc/xls/ppt). `.txt`/`.csv` não têm assinatura, sempre passam. |
| `upload-paths.ts` | `UPLOAD_CATEGORY_DIRS` (categoria → pasta em disco local), `PUBLIC_UPLOAD_CATEGORIES = {'tenants'}` (logo é servido sem login, pra montar a tela de login), `SENSITIVE_UPLOAD_CATEGORIES = {'health'}` (dispara log de acesso LGPD). |
| `storage.service.ts` | `StorageService` abstrai dois drivers via `STORAGE_DRIVER` (`local`, padrão, ou `r2`): `LocalStorageDriver` escreve em disco do container (**efêmero — perdido a cada redeploy no Railway**) e assina sua própria URL via HMAC; `R2StorageDriver` (Cloudflare R2, `@aws-sdk/client-s3`) guarda no bucket e devolve URL pré-assinada nativa (download nem passa pela API). `verifySignature()` valida o HMAC do driver local (chave = `JWT_SECRET`, comparação em tempo constante) e a expiração do payload. |
| `uploads.controller.ts` (`/uploads/:category/:tenantId/:filename`) | Só alcançável com `STORAGE_DRIVER=local`. Exige `?sig=` emitido pelo `SignUploadsInterceptor`; o `tenantId` **dentro da assinatura** (não o da URL) é o que resolve o caminho físico — o segmento da URL é só checagem de consistência. Qualquer falha → 404. |
| `sign-uploads.interceptor.ts` | `SignUploadsInterceptor` — percorre toda resposta JSON do usuário autenticado e reassina qualquer string `/uploads/<categoria>/<tenantId>/<arquivo>`, **escopada ao tenant de quem está chamando** (falha fechado se o tenantId embutido não bater com `user.tenantId`). Para a categoria `health`, é também **o único lugar que grava `PersonSensitiveAccessLog`** — dispara no momento em que a URL assinada é emitida (porque no R2 o download em si nunca passa por esta API). |

**Gotchas:** disco local não é persistente entre deploys (risco já
documentado, `docs/auditoria-riscos.md` item 12, driver R2 ainda não
plugado de fato). A checagem de tenant+permissão no download acontece
**uma vez**, no momento de emitir a URL assinada — não há segunda
checagem por byte servido; no R2 não há segunda checagem alguma, o
browser fala direto com o bucket depois disso.

## Request context (`core/request-context/`)

Estado por requisição via `AsyncLocalStorage`, pra levar tenant/usuário/
requestId/IP/user-agent/flag de auditoria até código profundamente
aninhado (principalmente a extensão de auditoria do Prisma) sem passar
isso por parâmetro em cada função.

- `request-context.service.ts` — wrapper do `AsyncLocalStorage`.
- `request-context.middleware.ts` (global, depois do `TenancyMiddleware`) —
  gera/propaga request id, abre o contexto com IP/UA/tenantId pré-auth.
- `request-context.interceptor.ts` (`APP_INTERCEPTOR` global) — roda
  depois dos guards (já com `req.user` populado) e completa o contexto
  com `userId`/`tenantId` reais.

**Gotcha:** contexto só existe durante a vida da requisição (ALS) —
trabalho assíncrono "fire-and-forget" iniciado dentro de uma requisição
mas aguardado fora do seu ciclo de vida pode perder o contexto.

## Prisma (`core/prisma/`)

- `prisma.module.ts` — singleton clássico, qualquer módulo que precise
  de banco importa `PrismaModule`.
- `prisma-adapter.ts` — valida `DATABASE_URL`, monta o adapter `PrismaPg`
  (driver adapter do Prisma 7, não a datasource string clássica).
- `prisma.service.ts` — `PrismaService extends PrismaClient`, instala a
  extensão de auditoria (ver §Audit acima).

**Gotcha mais importante da camada:** **não existe escopo de tenant
automático aqui.** A extensão só audita; não injeta nem confere
`where: { tenantId }` em nenhuma query. Qualquer service de
`modules/*` que esquecer `tenantId` no `where` é um vazamento entre
tenants que nada em `core/prisma/` detecta. **Esse é o primeiro lugar a
suspeitar ao investigar "apareceu dado de outro tenant".**

## Rate limit (`core/rate-limit/`)

- `rate-limit.service.ts` — `Map` em memória, contador de janela fixa
  (`consume(key, windowMs, max)`). **Sem Redis, sem coordenação entre
  processos** — estado é só do processo Node local. Buckets nunca são
  removidos proativamente (só sobrescritos quando `resetAt` passa).
- `rate-limit.guard.ts` — `RateLimitGuard`, **único guard global**
  (`APP_GUARD`) — roda em toda rota, mas só age se houver
  `@RateLimit(...)` na rota. Chave composta por `keyParts` (padrão
  `['ip','path','method']`; pode incluir `'tenantId'` ou `'bodyField'`
  — usado pra limitar tentativa de login por e-mail). Acima do limite:
  `429` com `retryAfterSeconds`.
- Hoje usado em `core/auth/auth.controller.ts` (login, forgot/reset
  password, refresh) e `core/cep/cep.controller.ts`.

**Gotcha — múltiplas instâncias:** como o estado é por processo, subir
uma 2ª réplica do backend multiplica o limite efetivo por
`max × nº de instâncias`, e um atacante balanceado entre instâncias
pode escapar quase totalmente do limite. Gatilho documentado em
`docs/backlog.md`: mover para Redis quando precisar de 2ª réplica.

## CEP (`core/cep/`)

Proxy fino pro ViaCEP (`GET /cep/:cep`, público, rate-limited 120/h por
IP). Usado pelo frontend em formulários de endereço (registration,
people, tenants) antes/depois do login.

## Config (`core/config/`)

- `env-validation.ts` — `validateEnv`, exige e **parseia de verdade**
  (não só checa presença) `DATABASE_URL`, `JWT_SECRET`,
  `PII_MASTER_KEY`, `TOTP_ENCRYPTION_KEY` no boot — motivado por um
  incidente real em 2026-11-05 (chave placeholder só quebrava no primeiro
  uso, não no boot).
- `trust-proxy.ts` — `parseTrustProxyHops`, controla quantos hops de
  `X-Forwarded-For` o Express confia ao montar `req.ip`. Afeta
  diretamente as chaves de rate-limit e o `ipAddress` de `AccessLog`/
  `AuditLog` — configurar errado permite falsificar o próprio IP via
  header. Valor correto depende da topologia real Railway/Cloudflare
  (ver `docs/backlog.md`).

## Email (`core/email/`)

- `email.service.ts` — `EmailService.send`: sem `RESEND_API_KEY`
  configurado, só loga no console (**sem erro** — um ambiente de
  produção mal configurado "envia" silenciosamente nada). Com a chave,
  usa o SDK oficial do Resend (não SMTP genérico — ver `docs/backlog.md`
  sobre a remoção do `nodemailer`).
- `templates/` — funções puras que devolvem `{ subject, text, html }`.
- Consumido por `auth.service.ts` (reset de senha) e por
  `modules/registration` (código de cadastro de tenant).

## Primitivas compartilhadas (`core/dto/`, `core/utils/`, `core/types/`)

- `core/dto/pagination-query.dto.ts` — `PaginationQueryDto { all?, page?,
  limit? }` (limite máx. 1000), base dos endpoints de listagem de
  `modules/*`.
- `core/utils/pagination.ts` — `resolvePagination`/`buildPaginationMeta`
  — implementação compartilhada que os módulos **deveriam** usar em vez
  de reinventar skip/take (nem todo código de `core/` segue isso ainda —
  oportunidade de normalizar se for tocar).
- `core/utils/cpf.ts` — `normalizeCpfOrNull`/`isValidCpfDigits` (dígito
  verificador real, rejeita sequências repetidas).
- `core/utils/dates.ts` — `parseDateInput`: datas sem hora (`YYYY-MM-DD`)
  são tratadas como **UTC**, de propósito, pra não haver drift de fuso
  entre chamadores em fusos diferentes.
- `core/utils/json.ts` — `parseJsonArray` defensivo (`[]` em qualquer
  falha).
- `core/types/express.d.ts` — augmentação global de `Express.Request`
  (`user?: JwtUser`, `tenantId?: string`) — é isso que torna `req.user`/
  `req.tenantId` type-safe no projeto inteiro.

## Invariantes para qualquer contribuição nova

1. `tenantId` só pode vir de (a) `TenancyMiddleware` resolvendo o slug
   `/t/:slug` contra `Tenant` (fluxos pré-auth), ou (b) a claim do JWT
   via `@CurrentUser()` (pós-auth, soberana). Nunca de body/query/
   `:tenantId` de rota num controller de domínio.
2. Nenhum escopo automático de tenant no nível do Prisma — todo service
   de domínio precisa incluir `tenantId` manualmente.
3. Guards são opt-in, exceto `RateLimitGuard`. Controller novo sem
   `@UseGuards(JwtAuthGuard, ...)` é público por padrão.
4. Auditoria é automática mas best-effort; pode ser desligada por
   requisição via `disableAudit`.
5. `TOTP_ENCRYPTION_KEY`/`PII_MASTER_KEY` nunca devem mudar depois de
   setadas (dados criptografados ficam ilegíveis) — regra do
   `AGENTS.md`.
6. Rate limit é por processo — não escala sozinho com múltiplas réplicas.
7. Storage de arquivo é plugável (`local` vs `r2`) — checagem de tenant/
   permissão no download acontece uma vez, na emissão da URL assinada.
