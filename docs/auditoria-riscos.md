# Auditoria de riscos — 2026-11-06

Levantamento feito por avaliação de código (sem nenhuma correção aplicada
ainda). Cada item abaixo é uma tarefa independente, numerada para
trabalharmos uma por vez. A ordem de execução sugerida é a numeração —
itens críticos primeiro. Quando uma tarefa for fechada, marcar o checkbox
e anotar a evidência (teste + commit), no mesmo formato do `PLAN.md`.

Relação com o plano principal: a maioria destes itens já está prevista em
`docs/Terceiro Gestor — Plano de Revisão e Produção.md`, Parte 3
("Correções severas") e Parte 2 ("Pequenas correções") — está indicado em
cada tarefa. Os itens 12–15 são achados novos, descobertos ao testar o
ambiente local em 2026-11-05, que não estavam na tabela original do
plano.

## Críticas

### 1. Download de arquivo sem autenticação (inclui documentos de saúde)

- [x] **Feito em 2026-11-06**, branch `p3/01-uploads-sem-auth`. **Onde
      estava:** `backend/src/app.module.ts:54-57` (`ServeStaticModule`
      servia `/uploads` publicamente); `backend/src/core/files/files.controller.ts`
      só protegia upload, não existia rota de download.
- **O que foi feito:** `ServeStaticModule` removido. Novo
  `UploadsController` (`backend/src/core/files/uploads.controller.ts`)
  serve `GET /uploads/:category/:filename` exigindo um token `?sig=`
  assinado (HMAC com `JWT_SECRET`, TTL de 5 min) — **não** `Authorization:
  Bearer`, porque o frontend usa `<img src>`/`<a href>` puro para avatar,
  anexos e documentos de saúde (token fica só em `sessionStorage`, nunca
  em cookie, então não viaja automaticamente nessas tags). Em vez de
  caçar cada lugar que devolve um `filePath`/`avatarUrl`/`documentUrl`,
  um `SignUploadsInterceptor` global (via `APP_INTERCEPTOR`) reassina
  automaticamente qualquer string `/uploads/<categoria>/<arquivo>` em
  qualquer resposta JSON autenticada, usando o `tenantId` de quem fez a
  requisição — a mesma lógica das URLs assinadas da R2 (Parte 4.2),
  adiantada para o driver local. `StorageService` (`storage.service.ts`)
  concentra `getSignedUrl`/`verifySignature`. Única exceção: categoria
  `tenants` (logo) continua pública, porque `GET /tenants/slug/:slug` é
  usado sem login para montar a tela de login (branding) —
  `backend/src/modules/tenants/tenants.controller.ts:20-22`.
- **Critério de aceite (ajustado):** nenhum arquivo é servido sem um
  token válido e não-expirado emitido para aquele tenant/arquivo
  específico (exceto o logo público); um `sig` reaproveitado para outro
  arquivo falha. Confirmado por 19 testes automatizados
  (`storage.service.spec.ts`, `uploads.controller.spec.ts`,
  `sign-uploads.interceptor.spec.ts`) e por um teste manual de ponta a
  ponta: login → criar `PersonHealthCondition.documentUrl` → a API já
  devolve a URL assinada → baixar com `?sig=` funciona (200) → sem `sig`
  falha (404) → reusar o `sig` para outro nome de arquivo falha (404).
- **Pendente (não é parte deste item):** a permissão por módulo no
  próprio download (hoje a única porta é o `tenantId` do token; a
  permissão já foi checada quando a URL foi emitida, mas não é checada
  de novo no download). Auditoria de download de documento de saúde
  virou o item 2, abaixo — já feito.
- **Plano:** Parte 3.2.

### 2. Download de documento sensível não gera auditoria

- [x] **Feito em 2026-11-06**, branch `p3/01-uploads-sem-auth` (mesmo
      branch do item 1 — são a mesma mudança de infraestrutura). **Onde
      estava:** `backend/src/modules/people/people.service.ts:1563-1579`
      (`logSensitiveAccess` só cobria leitura/edição do registro, não o
      arquivo em si).
- **O que foi feito:** o token assinado do item 1 agora carrega também
  `userId` (sempre) e `personId` (só para a categoria `health`) —
  `StorageService.getSignedUrl`/`verifySignature`
  (`storage.service.ts`). O `SignUploadsInterceptor` descobre o
  `personId` olhando o campo `personId` já presente como irmão de
  `documentUrl`/`permissionDocumentUrl` nas respostas de
  `PersonHealthCondition`/`PersonMedication` (`sign-uploads.interceptor.ts`),
  e propaga esse `personId` para objetos filhos também (não só o campo
  direto). `UploadsController.download` (`uploads.controller.ts`), ao
  validar um `sig` da categoria `health` que carrega `personId`, grava
  em `PersonSensitiveAccessLog` antes de servir o arquivo — se a
  escrita falhar, o download falha também (fail-closed, não existe
  download de documento de saúde sem conseguir registrar).
- **Critério de aceite:** confirmado por 6 testes novos (token carrega
  `personId` só para `health`; propaga por objetos aninhados; não grava
  nada em categorias não sensíveis mesmo com `personId` ao lado; não
  grava nada se o token de um documento de saúde não tiver `personId`)
  e por um teste manual real: criei uma `PersonHealthCondition` com
  `documentUrl` apontando pro arquivo de teste, baixei pela URL assinada
  que a própria API devolveu, e confirmei a linha nova em
  `PersonSensitiveAccessLog` com o `userId` de quem baixou, `action:
  READ`, IP (`::1`) e `userAgent` (`curl/8.19.0`) corretos.
- **Plano:** Parte 3.5 ("confirmar que todo acesso a documentos de saúde
  gera registro na auditoria").

### 3. Banco sem migrations versionadas

- [x] **Feito em 2026-11-06**, branch `p3/03-migrations-versionadas`.
      **Onde estava:** `backend/prisma/migrations/` só tinha
      `migration_lock.toml`; `backend/scripts/docker-entrypoint.sh:8-14`
      caía em `prisma db push`.
- **O que foi feito:** gerada `backend/prisma/migrations/0_init/migration.sql`
  com `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma
  --script` (3361 linhas, todo o schema atual). Banco local marcado como já
  aplicado com `npx prisma migrate resolve --applied 0_init` (ele já estava
  em dia via `db push`, então não roda `migrate deploy` em cima dele — é só
  o registro). `docker-entrypoint.sh` perdeu o `else` que caía pra
  `db push`: agora é só `ensure-database.js` + `prisma migrate deploy`, sem
  ambiente nenhum que mais sincroniza por `db push`.
- **Critério de aceite:** confirmado dropando e recriando o banco local do
  zero → `npx prisma migrate deploy` aplicou a `0_init` → `node
  prisma/seed.js` rodou → login de `admin@seed.local` devolveu `201` com
  token → os 9 módulos (people, deposit, pantry, programs, projects, tasks,
  actions, people-segments, people-groups) responderam `200` nos
  respectivos endpoints de listagem. `docker-entrypoint.sh` agora falha
  (não improvisa) se não houver migration aplicável — não existe mais
  caminho de código que chama `db push` fora do uso manual local.
- **Pendente (não é parte deste item):** separar seed de produção
  (permissões core, papéis padrão) do seed de desenvolvimento (dados
  fictícios) — é um item citado na Parte 3.1 do plano principal, mas fora
  do critério de aceite deste item da auditoria. Também pendente: mover
  `prisma migrate deploy` para rodar como *pre-deploy command* do Railway
  em vez de dentro do entrypoint (Parte 4.1 — só faz sentido configurar
  quando o projeto Railway existir).
- **Plano:** Parte 3.1.

### 4. CORS aberto para qualquer origem, com cookies habilitados

- [x] **Feito em 2026-11-10**, branch `develop`. **Onde estava:**
      `backend/src/main.ts:24` —
      `app.enableCors({ origin: true, credentials: true })`.
- **O que foi feito:** `WEB_URL` agora é a allowlist de CORS (uma ou mais
  origens separadas por vírgula). `parseWebUrlList`/`isOriginAllowed`
  (`backend/src/core/auth/http/auth-http.ts`) viram as funções puras
  usadas por `main.ts` para montar o `origin` dinâmico do `enableCors`
  (callback que só libera origem presente na lista, ou ausência de
  `Origin` — chamada sem browser). Os três lugares que liam `WEB_URL`
  como uma única URL (cookie de sessão em `auth-http.ts`, link de reset
  de senha em `auth.service.ts`, callback de OAuth em
  `registration.controller.ts`) passaram a usar `getPrimaryWebUrl`
  (primeira entrada da lista), sem mudar o comportamento de quem só tem
  uma origem configurada. `frontend/next.config.ts` também passou a
  iterar a lista inteira ao montar os `remotePatterns` de imagem.
- **Critério de aceite:** confirmado por 12 testes novos
  (`backend/src/core/auth/http/auth-http.spec.ts`) e por teste manual
  real: subi o backend local (`WEB_URL=http://localhost`) e comparei
  `GET /tenants/slug/instituicao-exemplo` com `Origin: http://localhost`
  (200, com `Access-Control-Allow-Origin: http://localhost`) contra o
  mesmo request com `Origin: https://evil.example` (200, **sem** nenhum
  header `Access-Control-Allow-*`) e sem header `Origin` nenhum (200,
  `Access-Control-Allow-Credentials` presente mas sem
  `Access-Control-Allow-Origin`, como esperado para chamada
  servidor-a-servidor).
- **Plano:** Parte 3.4.

## Altas

### 5. `TenantGuard` existe mas não é usado em nenhum lugar

- [x] **Feito em 2026-11-10**, branch `develop`. **Onde estava:**
      `backend/src/core/auth/guards/tenant.guard.ts` (definido, zero
      imports em controllers/`app.module.ts`).
- **O que foi feito:** apaguei o guard em vez de ligá-lo. Ele só
  repetia uma checagem que já é feita antes de qualquer controller
  rodar: `JwtStrategy.validate()`
  (`backend/src/core/auth/strategies/jwt.strategy.ts:34-36`) já lança
  `UnauthorizedException` se o token não tiver `tenantId`, então todo
  `@UseGuards(JwtAuthGuard, ...)` garante um `tenantId` não-vazio em
  `req.user` antes do handler. O isolamento por slug da URL
  (`/t/:slug`) é tratado por um componente diferente, o
  `TenancyMiddleware`
  (`backend/src/core/tenancy/tenancy.middleware.ts`), que resolve o
  slug só para popular `req.tenantId` nas rotas públicas (ex.: login) —
  e a própria `JwtStrategy` confere que esse `req.tenantId` (quando
  presente) bate com o `tenantId` do token, rejeitando token de um
  tenant usado na URL de outro. Nenhum desses dois mecanismos usava ou
  precisava do `TenantGuard`. O padrão oficial (`tenantId` vindo do JWT
  via `getTenantId()`/`user.tenantId`, nunca do slug) já estava
  documentado no `AGENTS.md` antes desta tarefa — não precisou de doc
  nova.
- **Critério de aceite:** confirmado — `grep -r TenantGuard
  backend/src` não encontra mais nenhuma referência (nem definição, nem
  uso); não existe segundo mecanismo de tenant concorrendo com o
  padrão JWT. Checkpoint: `tsc --noEmit` (0 erros) e `npm test` (19
  suítes, 55 testes, sem mudança de comportamento — a remoção não
  afeta nenhum fluxo, já que o guard nunca era referenciado).
- **Plano:** Parte 3.3.

### 6. Isolamento entre tenants sem teste automatizado

- [x] **Feito em 2026-11-10**, branch `develop`. **Onde estava:** ~109
      ocorrências de `.update({ where: { id } })` /
      `.delete({ where: { id } })` fora de `updateMany`/`deleteMany` em
      `backend/src/modules/**/*.service.ts`, nunca conferidas uma a uma, e
      sem nenhum teste automatizado que travasse vazamento entre tenants.
- **O que foi feito (parte 1 — revisão estática):** revisei os 14
  arquivos de serviço que tinham essas ocorrências (`deposit`, `pantry`,
  `actions`, `programs`, `projects`, `people-segments`, `people`,
  `tasks`, `people-groups`, `project-structure`, `users`, `roles`,
  `tenants`, `registration`). **Nenhuma** das ~109 ocorrências estava
  insegura: todo `update`/`delete` por `id` cru é precedido, na mesma
  função (ou dentro da mesma `$transaction`), por um `findFirst`/helper
  equivalente que já filtra por `tenantId` usando aquele mesmo id — e
  todo `updateMany`/`deleteMany` já inclui `tenantId` no `where`. Os dois
  casos fora do padrão comum são seguros por natureza diferente:
  `tenants.service.ts#updateTenant` usa o próprio `tenantId` do contexto
  como id (não é um id de sub-recurso de outro tenant), e os updates em
  `tenantRegistration` (`registration.service.ts`) operam num registro
  de onboarding que ainda não pertence a nenhum tenant, protegido por
  hash de código de verificação em vez de `tenantId`.
- **O que foi feito (parte 2 — teste e2e):** criei
  `backend/test/tenant-isolation.e2e-spec.ts` +
  `backend/test/support/tenant-isolation.setup.ts`. O teste sobe a
  aplicação inteira contra um Postgres real (mesmo `DATABASE_URL` do
  `start:dev`), cria dois tenants com usuário de acesso total cada
  (via Prisma direto, sem passar pelo fluxo de registro), grava um
  recurso só no Tenant A e, autenticado como Tenant B, confere que
  listar/ler/editar/excluir/comentar **todos voltam 404** (nunca os
  dados do tenant errado) — e que o recurso continua intacto no banco
  depois da tentativa de exclusão. Cobre os 9 módulos do plano
  (programs, projects, pantry, deposit, tasks, people, people-groups,
  people-segments, actions) e mais um teste que confere que o slug
  `/t/:slug` da URL nunca prevalece sobre o `tenantId` do JWT (token do
  Tenant B contra a URL do Tenant A → 401, rejeitado pela
  `JwtStrategy` antes de qualquer controller rodar). `afterAll` limpa
  os dois tenants de teste do banco (incluindo o `AuditLog` que o
  próprio `PrismaService` gera automaticamente pra cada escrita).
- **Critério de aceite:** confirmado — `npm run test:e2e` (precisa de
  Postgres real; não entra no `npm test` unitário): 2 suítes, 11
  testes, todos passando. `npx tsc --noEmit -p tsconfig.build.json`: 0
  erros. `npm test` (unitário): 19 suítes, 55 testes, sem regressão.
- **Plano:** Parte 3.3 (revisão dos 109 casos + teste e2e por módulo).
  O quarto item da seção 3.3 do plano ("conferir que o slug nunca
  prevalece sobre o JWT") também ficou coberto pelo teste acima.

### 7. Token de acesso dura 8 horas

- [x] **Feito em 2026-11-10**, branch `develop`. **Onde estava:**
      `backend/src/core/auth/auth.module.ts:28` e
      `backend/src/modules/registration/registration.module.ts:21` —
      `signOptions: { expiresIn: '8h' }`.
- **O que foi feito:** `expiresIn` trocado para `'15m'` nos dois
  arquivos (únicos dois lugares que configuram o `JwtModule`). O
  refresh token não mudou (hash armazenado, rotação, detecção de reuso
  já cobertos).
- **Efeito colateral avaliado e aceito:** o frontend desloga o usuário
  automaticamente no instante em que o access token expira
  (`frontend/src/features/auth/auth-context.tsx:149-156`, timer
  rearmado a cada renovação). Sem token de 8h, ficar parado (sem
  nenhuma chamada de API) por mais de 15 min agora desloga — antes só
  acontecia depois de 8h parado. Decisão: manter assim (15 min de
  inatividade real é razoável num sistema com dados de saúde/CPF); não
  é bug, é o comportamento esperado de uma sessão mais curta.
- **Critério de aceite:** confirmado por
  `backend/test/auth-token-expiry.e2e-spec.ts` (novo, e2e com Postgres
  real): o access token assinado tem vida de ~15 min (não mais 8h); um
  token expirado (assinado com `expiresIn: '-10s'`) é rejeitado com
  `401` numa rota protegida; `POST /auth/refresh` com um refresh token
  válido continua devolvendo um access token novo e funcional (`200`
  na rota protegida com ele). `npm run test:e2e`: 3 suítes, 14 testes,
  todos passando. `tsc --noEmit`: 0 erros. `npm test`: 19 suítes, 55
  testes, sem regressão.
- **Plano:** Parte 3.4.

## Médias

### 8. Sem `helmet` (headers de segurança)

- [x] **Feito em 2026-11-10**, branch `develop`. **Onde estava:**
      `backend/src/main.ts` — nenhuma referência a `helmet` no backend
      inteiro.
- **O que foi feito:** `helmet` adicionado às dependências (`^8.3.0`) e
  `app.use(helmet(...))` logo no início do `bootstrap()`. Único ajuste
  em relação ao padrão do helmet: `crossOriginResourcePolicy: { policy:
  'cross-origin' }` — o padrão (`same-origin`) bloquearia o
  `<img src>`/`<a href>` direto que o frontend usa pra avatar, anexos e
  logo num domínio diferente do backend (ver item 1 desta auditoria;
  em produção `WEB_URL` e a API ficam em domínios/subdomínios
  diferentes).
- **Critério de aceite:** confirmado por teste manual real — subi o
  backend local e comparei os headers de `GET /` antes/depois:
  `Content-Security-Policy`, `Cross-Origin-Opener-Policy`,
  `Referrer-Policy: no-referrer`, `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` e
  `X-Powered-By` removido — todos presentes depois da mudança, nenhum
  antes. Confirmei que o CORS do item 4 continua funcionando igual
  (`Access-Control-Allow-Origin` presente pra origem permitida) e que
  `GET /uploads/...` mantém `Cross-Origin-Resource-Policy: cross-origin`
  mesmo com o helmet ativo.
- **Plano:** Parte 2.

### 9. Variáveis de ambiente não são validadas no boot

- [x] **Feito em 2026-11-10**, branch `develop`. **Onde estava:**
      `backend/src/app.module.ts:49-53` — `ConfigModule.forRoot` sem
      `validate`/`validationSchema`. O app subia normalmente mesmo
      faltando `JWT_SECRET`/`PII_MASTER_KEY`/`TOTP_ENCRYPTION_KEY`/
      `DATABASE_URL`, e só quebrava depois, ao usar a variável (foi
      exatamente isso que causou o crash do backend em 2026-11-05, com
      chaves placeholder no `.env`).
- **O que foi feito:** `backend/src/core/config/env-validation.ts`
  (novo) define `EnvironmentVariables` com `class-validator`/
  `class-transformer` — mesma biblioteca já usada em todos os DTOs do
  projeto, não precisou adicionar zod/Joi como dependência nova — e
  exige `DATABASE_URL`, `JWT_SECRET`, `PII_MASTER_KEY` e
  `TOTP_ENCRYPTION_KEY` (as quatro citadas no plano principal, Parte
  2). Passado como `validate` em `ConfigModule.forRoot`
  (`app.module.ts`). Além de checar presença, a validação reaproveita
  o parsing que cada serviço já fazia — `createPrismaAdapter`
  (`DATABASE_URL`), `parseMasterKey` (`PII_MASTER_KEY`) e o `parseKey`
  do `MfaCryptoService` (agora exportado, `TOTP_ENCRYPTION_KEY`) — pra
  também rejeitar uma variável presente mas com formato errado (não só
  ausente), sem duplicar a lógica de parsing em dois lugares.
  `WEB_URL` não entrou na lista: sem ela o CORS (item 4) já nega toda
  origem por padrão — comportamento seguro, não precisa impedir o
  boot.
- **Critério de aceite:** confirmado por 13 testes novos
  (`env-validation.spec.ts`: cada uma das 4 variáveis ausente/vazia/
  malformada rejeita, válidas aceita, variáveis opcionais fora do
  schema não são descartadas) e por teste manual real com o binário
  compilado (`node dist/main.js`): com `PII_MASTER_KEY` inválida, o
  processo recusa subir na hora (`Error: PII_MASTER_KEY inválida: ...
  must be at least 32 bytes`, lançado dentro de `ConfigModule.forRoot`,
  antes de qualquer outro módulo carregar); com as variáveis reais do
  `.env`, sobe normalmente (`Nest application successfully started`).
  `tsc --noEmit`: 0 erros. `npm test`: 20 suítes, 68 testes.
- **Plano:** Parte 2.

### 10. Não existe `GET /health`

- [x] **Feito em 2026-11-10**, branch `develop`. **Onde estava:**
      `backend/src/app.controller.ts` só tinha `GET /` (hello).
      Nenhuma rota testava a conexão com o banco.
- **O que foi feito:** `GET /health` em `AppController` roda
  `SELECT 1` via `PrismaService.$queryRaw`; devolve `200
  {"status":"ok","database":"up"}` se o Postgres responde, ou `503
  {"status":"error","database":"down"}`
  (`ServiceUnavailableException`) se a query falhar. Rota pública
  (sem `@UseGuards`), igual a `GET /`, e fora de qualquer
  `@RateLimit` — Railway pode chamá-la com a frequência que quiser
  sem ser bloqueada.
- **Critério de aceite:** confirmado por 2 testes novos
  (`app.controller.spec.ts`: `$queryRaw` resolve → `200 ok`;
  `$queryRaw` rejeita → lança `ServiceUnavailableException`) e por
  teste manual real: subi o backend local e `curl
  http://localhost:3001/health` devolveu
  `{"status":"ok","database":"up"}` com `200`.
  `tsc --noEmit`: 0 erros. `npm test`: 20 suítes, 70 testes.
- **Plano:** Parte 2 e Parte 4.1 (falta configurar esse endpoint como
  healthcheck no `railway.json`/painel do Railway quando o projeto
  existir — fora do escopo deste item).

### 11. IP do cliente pode se perder atrás de proxy (Cloudflare → Railway)

- [x] **Preparado em 2026-11-10**, branch `develop` — **parcial, de
      propósito** (ver justificativa abaixo). **Onde estava:**
      `backend/src/main.ts` — sem `app.set('trust proxy', ...)`. Audit
      log e rate-limit usam `req.ip`.
- **Por que não fechou 100%:** o critério de aceite original pede
  confirmar em staging, atrás do Cloudflare+Railway reais, que o IP
  logado bate com o IP do cliente de teste — essa infra não existe
  ainda (o projeto Railway nem foi criado; é por isso que este item
  nem estava na tabela original do plano). Fixar um número de hops
  agora, sem saber a topologia real, é arriscado: errado pra menos
  (0 quando devia ser 1) só perde precisão no IP registrado; errado
  pra mais (1 quando na verdade não há proxy confiável) deixa
  **qualquer cliente falsificar o próprio IP** via `X-Forwarded-For` e
  furar o rate-limit ou poluir o audit log. Perguntei ao usuário como
  proceder; a decisão foi deixar configurável e seguro por padrão, sem
  travar um valor às cegas.
- **O que foi feito:** `TRUST_PROXY_HOPS` (nova variável, padrão `0` —
  mesmo comportamento de antes, nenhum proxy confiável) lida e
  aplicada via `app.set('trust proxy', ...)` em `main.ts`
  (`backend/src/core/config/trust-proxy.ts` faz o parse, com fallback
  seguro para qualquer valor inválido/negativo/não-inteiro).
  Documentado nos três `.env.example` com a mesma ressalva: não
  aumentar sem confirmar a topologia real em staging primeiro.
  Registrado em `docs/backlog.md` com o gatilho ("quando o projeto
  Railway existir e a topologia atrás do Cloudflare estiver decidida").
- **Critério de aceite (o que dá pra confirmar sem staging):**
  confirmado por 4 testes novos (`trust-proxy.spec.ts`) e por teste
  manual real — login de verdade (`admin@seed.local`) com
  `X-Forwarded-For: 9.9.9.9` forjado: com `TRUST_PROXY_HOPS=0`
  (padrão), o `AccessLog` registrou o IP real da conexão (`::1`),
  ignorando o header forjado; reiniciando com `TRUST_PROXY_HOPS=1`, o
  mesmo header forjado foi aceito e `AccessLog.ipAddress` ficou
  `9.9.9.9` — prova que o mecanismo funciona nos dois sentidos, dado
  o número de hops certo. `tsc --noEmit`: 0 erros. `npm test`: 21
  suítes, 74 testes.
- **Pendente (registrado no backlog):** confirmar `TRUST_PROXY_HOPS`
  correto (provavelmente `1`) em staging real, atrás do Railway (e do
  Cloudflare, se proxied) — só então o critério de aceite original
  fecha de verdade.
- **Plano:** não estava na tabela original — Parte 4 (Cloudflare/Railway).

### 12. Arquivos em disco do container (efêmero no Railway)

- [ ] **Onde:** `backend/src/core/files/files.controller.ts:16-30` — 10
      pastas sob `uploads/` via `multer.diskStorage`. Nenhum código de
      S3/R2 ainda.
- **O que fazer:** `StorageService` com driver `local` (dev) e `r2`
  (produção).
- **Plano:** Parte 3.2 (interface) e Parte 4.2 (driver R2).

## Achados novos (fora da tabela original do plano)

### 13. `.gitignore` ignora silenciosamente pastas `scripts`/`script`/`infra`

- [ ] **Onde:** `.gitignore` tem essas três entradas sem barra —
      qualquer arquivo **novo** criado em `backend/scripts/` ou
      `scripts/windows/` não aparece em `git status`.
- **O que fazer:** ancorar as entradas (ex.: `/scripts` só na raiz, ou
  remover as genéricas e listar exceções específicas).
- Já registrado em `docs/backlog.md`.

### 14. `prisma/seed.js` sem build automatizado

- [ ] **Onde:** nenhum script compila `seed.ts` → `seed.js`. Já ficou
      desatualizado uma vez (emails antigos) até ser corrigido em
      2026-11-05.
- **O que fazer:** passo no CI que falha o PR se `seed.js` divergir do
  que `seed.ts` geraria.
- Já registrado em `docs/backlog.md`.

### 15. Vulnerabilidades de dependências não auditadas

- [ ] **Onde:** `npm audit` (2026-11-05): 41 no backend (3 low/22
      moderate/14 high/2 critical), 27 no frontend (1 low/10 moderate/15
      high/1 critical).
- **O que fazer:** rodar `npm audit` completo, triar cada uma, atualizar
  patch/minor.
- **Plano:** Parte 2.

### 16. Node local fora da faixa declarada em `engines`

- [ ] **Onde:** `package.json` (`"node": ">=22 <23"`) vs. Node v26.1.0
      rodando nesta máquina.
- **O que fazer:** fixar a versão de Node do build (Railway/Dockerfile)
  em 22.x; alinhar o ambiente de dev se possível.
- Já registrado em `docs/backlog.md`.

## Como vamos trabalhar

Um item por vez, seguindo a numeração. Cada um fecha com o checkpoint do
`AGENTS.md` (tsc + test no app que mudou) e, quando for correção de
segurança/tenant, com o teste que prova a correção. Ao terminar um item,
marco o checkbox aqui e registro a evidência.
