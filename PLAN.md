# PLAN.md — Terceiro Gestor

Só o que está em andamento. Plano completo: `docs/Terceiro Gestor — Plano de
Revisão e Produção.md`. Regras do projeto: `AGENTS.md`. Auditoria de riscos
(Parte 3 detalhada, tarefa por tarefa): `docs/auditoria-riscos.md`.

## Estado real (sincronizado em 2026-11-11)

Este documento tinha ficado parado em "Parte 1 em andamento" enquanto o
trabalho real, registrado item a item em `docs/auditoria-riscos.md`,
avançou até cobrir quase toda a Parte 2 e a Parte 3. Mapa atualizado,
Parte por Parte:

- **Parte 1 — Limpeza:** fechada na prática (checklist abaixo). Único
  item sem evidência de ponta a ponta: clicar nos 9 módulos pela UI
  (só API/backend foram exercitados via curl/testes automatizados nas
  sessões seguintes). Não bloqueou o trabalho das Partes 2/3, que já
  começou.
- **Parte 2 — Pequenas correções:** critério de saída do plano
  principal atingido em 2026-11-11 ("CI verde na main, testes do
  backend passando, proxy.ts comprovadamente ativo e app recusando
  subir sem as variáveis obrigatórias"). Checkpoint completo rodado
  nesta sessão: backend `tsc` (0 erros) + `npm test` (22 suítes, 91
  testes) + `npm run build` (ok); frontend `tsc` (0 erros) + `npm run
  build` (ok, com `proxy.ts` confirmado ativo). Único item que
  continua aberto é intencional (dívida de lint, ver abaixo).
  - [x] helmet (auditoria #8) · [x] validação de env vars no boot
    (auditoria #9) · [x] `GET /health` (auditoria #10) · [x]
    dependências patch/minor + `npm audit` (auditoria #15) · [x] 22
    suítes/91 testes do backend passando
  - [x] **CI no GitHub Actions** — feito em 2026-11-11, branch
    `develop`. `.github/workflows/ci.yml`: job `backend` (`npm ci` →
    `tsc --noEmit -p tsconfig.build.json` → `npm test` → `npm run build`
    → `npm run build:seed` + `git diff --exit-code` nos artefatos do
    seed, que também fecha o item 14 da auditoria) e job `frontend`
    (`npm ci` → `tsc --noEmit` → `npm run build`), ambos em Node 22 (a
    faixa declarada em `engines`). Confirmado manualmente antes de
    subir: os dois builds e o `npm test` do backend passam com
    `env -i` (sem nenhuma variável de ambiente) — nenhum segredo de CI
    é necessário para `tsc`/`test`/`build`; `test:e2e` (precisa de
    Postgres real) fica de fora, como já previsto na auditoria.
  - [x] **`frontend/middleware.ts` → `frontend/src/proxy.ts`** — feito
    em 2026-11-11, branch `develop`. Confirmado na doc do Next 16
    embutida no próprio pacote (`node_modules/next/dist/docs/.../
    proxy.md`): desde a v16, `middleware` está deprecated; o arquivo
    precisa se chamar `proxy.ts`, ficar no mesmo nível de `app/`
    (então `src/proxy.ts`, já que o app está em `src/app`), e a
    função exportada precisa se chamar `proxy`, não `middleware`.
    `npx next build` mostra `ƒ Proxy (Middleware)` sem erro. Teste
    manual real com o dev server: `/t/acme` → 307 para `/acme/
    dashboard`; `/acme` (slug nu) → 307 para `/acme/dashboard`;
    `/dashboard` com cookie `terceirogestor_tenant=acme` → 307 para
    `/acme/dashboard`; `/dashboard` sem cookie → 200 (sem redirect,
    como esperado). O log do próprio Next confirma a execução:
    `GET /dashboard 200 in 4.3s (next.js: 3.6s, proxy.ts: 349ms,
    application-code: 356ms)`.
  - [x] **Separar `lint`/`lint:fix`** — feito em 2026-11-11, branch
    `develop`. `backend/package.json`: `lint` não aplica mais `--fix`;
    `lint:fix` novo, idêntico ao `lint` antigo. `AGENTS.md` atualizado
    (o aviso "não use `npm run lint`" não vale mais). Ao rodar sem
    `--fix`, apareceu um problema pré-existente e sem relação com esta
    mudança: `test/**/*.ts` não está em nenhum tsconfig, então o
    ESLint (`projectService: true`) falha com parsing error nos 2
    specs e2e — registrado em `docs/backlog.md`, não corrigido aqui
    (fora do escopo deste item).
  - [ ] Lint do backend medido (469 problemas, só em `src/`) mas não
    reduzido — meta é não aumentar, registrado em `docs/backlog.md`
- **Parte 3 — Correções severas:** fechada, exceto uma ação
  operacional do usuário (3.5, abaixo). Feita via
  `docs/auditoria-riscos.md` (itens 1–2 → 3.2/3.5, item 3 → 3.1, itens
  4 → 3.4, 5–6 → 3.3, 7 → 3.4) mais os itens do checklist original que
  tinham ficado de fora do critério de aceite da auditoria, fechados
  em 2026-11-11:
  - [x] **3.1 — separar seed de produção (permissões/papéis) do seed
    de dados fictícios** — feito em 2026-11-11, branch `develop`. Não
    existia uma separação de infraestrutura pra fazer: a produção já
    não chama o seed de dados fictícios (`docker-entrypoint.sh` só
    roda migration + start, nunca `seed.js`) — quem cria papéis/
    permissões num tenant real é o fluxo de registro
    (`registration.service.ts`), e o catálogo "oficial" já vivia em
    `backend/src/modules/permissions/core-permissions.ts`
    (`CORE_PERMISSIONS`/`DEFAULT_ROLE_DEFINITIONS`), reexportado por
    `registration.constants.ts`. O problema real: `prisma/seed.ts`
    (dados fictícios) tinha sua **própria cópia hardcoded** dessa
    mesma lista (permissões + papéis Gestor/Atendimento), sem nada
    forçando as duas a ficarem iguais — risco de o tenant de
    demonstração ficar com permissões diferentes do que um tenant real
    ganha no cadastro. `prisma/seed.ts` agora importa o catálogo
    (`CORE_PERMISSIONS`/`CORE_PERMISSION_KEYS`/
    `DEFAULT_ROLE_DEFINITIONS`) via um loader novo e compartilhado
    (`backend/scripts/load-core-permissions.js`, extraído do que já
    existia dentro de `backfill-core-permissions.js` — que passou a
    usar o mesmo loader) em vez de manter sua própria lista. O nome do
    papel "Administrador" foi mantido (é um alias já conhecido de
    "Admin" em `CORE_ROLE_PERMISSION_TEMPLATES`, coberto por
    `core-permissions.spec.ts`).
  - **Critério de aceite:** confirmado — diff do catálogo antigo
    (hardcoded) contra `CORE_PERMISSION_KEYS` é vazio (as 48 chaves já
    coincidiam hoje; o ganho é não poder mais divergir em silêncio).
    `npm run db:seed` real contra o Postgres local: `Seed executado
    com sucesso`; query direta no banco confirma `Administrador`
    com 48 permissões (= todo o catálogo), `Gestor` com 31, `Atendimento`
    com 9 — e o próprio Nest loga `Synced 48 required permissions` ao
    subir. Teste manual real: login de `admin@seed.local` → `201` com
    `accessToken`; `GET /people` com esse token → `200` com dados.
    `npm run permissions:backfill` também testado, continua funcionando
    com o loader compartilhado (`permissionsSynced=48`). `tsc --noEmit`:
    0 erros. `npm test`: 22 suítes, 91 testes.
  - [x] **3.2 — reorganizar a chave física do arquivo para
    `categoria/tenantId/uuid.ext`** — feito em 2026-11-11, branch
    `develop`. Tinha ficado de fora de propósito no item 1/12 da
    auditoria ("pra não arriscar URL já salva no banco sem uma
    migração pronta"); decisão do usuário foi fazer agora, com
    migração. **O que mudou:**
    - `StorageService.put`/`delete`/`getSignedUrl` (`storage.service.ts`)
      e o driver local passaram a receber `tenantId`; a URL assinada
      virou `/uploads/<categoria>/<tenantId>/<arquivo>?sig=...`.
    - `UPLOAD_PATH_PATTERN` (`upload-paths.ts`) passou de 2 pra 3
      grupos; `SignUploadsInterceptor` (que assina qualquer
      `/uploads/<categoria>/<tenantId>/<arquivo>` cru numa resposta)
      agora também confere que o `tenantId` embutido no caminho bate
      com o do usuário autenticado antes de assinar — nunca deveria
      bater diferente (os dados já vêm de query filtrada por tenant),
      mas falha fechado (não assina) em vez de confiar.
    - `UploadsController.download` (`uploads.controller.ts`) ganhou o
      parâmetro de rota `:tenantId`. Para categoria protegida, quem
      decide o caminho físico é o `tenantId` **do `sig` já verificado**
      (não o da URL) — então adulterar só o segmento da URL não
      redireciona pra pasta de outro tenant; a rota ainda exige os dois
      iguais, senão `404`. A categoria pública (`tenants`, logo) não
      tem `sig`, então usa o `tenantId` da URL direto (dado não
      sensível, já exposto sem login).
    - Os 10 endpoints de `files.controller.ts` ganharam
      `@CurrentUser()` e um `getTenantId()` (mesmo padrão de
      `people.controller.ts`/`tasks.controller.ts`) pra montar o
      caminho com o tenant de quem fez upload.
    - **Migração dos dados existentes:** novo
      `backend/scripts/migrate-upload-keys-to-tenant-scoped.js`
      (`npm run migrate:upload-keys`) — percorre os 21 campos
      `*Url`/`*Path` do schema que guardam caminho de upload (mapeados
      um a um em `FIELD_MIGRATIONS`) mais `ProjectAction.photoPaths`
      (array JSON, tratado separado), move o arquivo físico de
      `categoria/arquivo` pra `categoria/tenantId/arquivo` e atualiza o
      valor no banco. Idempotente (um valor já no formato novo tem `/`
      no que sobra do prefixo e é ignorado); arquivo referenciado no
      banco mas ausente em disco só avisa e segue (atualiza o caminho
      mesmo assim, não bloqueia); arquivo órfão (sem nenhuma linha que
      o referencie) fica onde está — ninguém vai servi-lo em nenhum
      dos dois formatos, mesma situação de antes. Não toca em
      `AuditLog.before`/`after` (são snapshots históricos, não é o
      storage ativo).
    - **Critério de aceite:** confirmado — 19 testes atualizados/novos
      nas 4 suítes afetadas (`storage.service.spec.ts`,
      `uploads.controller.spec.ts` — incluindo o caso novo "sig válido
      mas segmento de `tenantId` da URL não bate" e "segmento de
      `tenantId` com path traversal" —, `sign-uploads.interceptor.spec.ts`,
      `files.controller.spec.ts` — incluindo "token sem `tenantId`
      rejeita"). Teste manual real, backend de pé: login de verdade →
      `POST /files/avatars` devolveu
      `/uploads/avatars/<tenantId>/<uuid>.jpg?sig=...` → baixar com essa
      URL exata → `200`; a mesma URL com o segmento `tenantId` trocado
      por outro → `404` (a assinatura não cobre mais, resolve pelo
      `tenantId` do `sig`, não da URL); rota antiga de 2 segmentos
      (`/uploads/avatars/<arquivo>`) → `404` (não casa com a rota nova);
      logo de tenant (categoria pública, sem `sig`) em
      `/uploads/tenants/<tenantId>/<arquivo>` → `200` sem token nenhum.
      **Migração testada com um arquivo órfão real** (sobra de upload
      de uma sessão anterior, sem nenhuma linha do banco apontando pra
      ele): apontei o `avatarUrl` de um usuário do seed pra esse
      arquivo no formato antigo, roda `npm run migrate:upload-keys` →
      arquivo moveu de `uploads/avatars/<uuid>.jpg` pra
      `uploads/avatars/<tenantId>/<uuid>.jpg`, `avatarUrl` no banco
      virou o caminho novo; rodei a migração de novo → `migrated=0`
      (idempotente); testei também o caso de um valor antigo no banco
      sem o arquivo físico correspondente → avisa (`missingOnDisk=1`) e
      atualiza o caminho mesmo assim, sem travar. Banco local
      restaurado com `npm run db:seed` depois do teste. `tsc --noEmit`:
      0 erros. `npm test`: 23 suítes, 110 testes. `npm run test:e2e`: 3
      suítes, 14 testes (sem regressão de isolamento entre tenants).

  - [x] **3.2 — validar o tipo real do arquivo pelos bytes** — feito em
    2026-11-11, branch `develop`. **Onde estava:** os 10 endpoints de
    upload (`backend/src/core/files/files.controller.ts`) só filtravam
    por `mimetype` declarado (`imageOnlyFilter`/filtro inline de
    `health-documents`) ou por extensão do nome do arquivo
    (`extensionAllowlistFilter`) — os dois são controlados pelo
    cliente, nenhum inspeciona o conteúdo real. Um `.exe` renomeado
    para `.jpg` com `Content-Type: image/jpeg` passava direto.
    **O que foi feito:** novo `file-signature.ts` com
    `matchesFileSignature(extensao, buffer)`, checando os bytes mágicos
    reais (JPEG `FF D8 FF`, PNG, GIF, WEBP via `RIFF`/`WEBP`, PDF
    `%PDF-`, ZIP `PK\x03\x04` — cobre `.zip`/`.docx`/`.xlsx`/`.pptx`
    como família única, já que distinguir cada um exigiria abrir o
    ZIP — e OLE Compound File — cobre `.doc`/`.xls`/`.ppt` do mesmo
    jeito). `.txt`/`.csv` não têm assinatura binária confiável e
    continuam validados só por extensão, como antes. Um novo
    `assertFileContentMatchesExtension` roda nos 10 handlers (depois
    do multer já ter bufferizado o arquivo em memória — só aí o buffer
    completo existe; o `fileFilter` do multer roda antes disso, por
    isso a checagem não podia ficar lá) e rejeita com `400` se a
    extensão não estiver na allowlist **ou** se o conteúdo não bater
    com a assinatura esperada.
  - **Critério de aceite:** confirmado por 15 testes novos
    (`file-signature.spec.ts`: cada família de assinatura, extensão
    sem assinatura, buffer curto demais; `files.controller.spec.ts`:
    conteúdo que não bate com a extensão declarada rejeita, extensão
    fora da allowlist rejeita mesmo com bytes "válidos" de nenhuma
    família conhecida, `.txt` continua aceito) e por teste manual real
    — login de verdade, `POST /files/avatars` com um arquivo de texto
    puro nomeado `fake.jpg`/`Content-Type: image/jpeg` → `400 "O
    conteudo do arquivo nao corresponde ao tipo esperado."`; o mesmo
    endpoint com bytes JPEG reais (`FF D8 FF E0 ...`) → sucesso, com a
    URL assinada de volta. `tsc --noEmit`: 0 erros. `npm test`: 23
    suítes, 106 testes.
  - [x] **3.4 — confirmar rate limit e expiração do token de reset nos
    4 fluxos** — feito em 2026-11-11, branch `develop`. Os 4 decorators
    (`auth.controller.ts`: `login` 20/10min, `forgot-password` 10/h,
    `reset-password` 20/h; `registration.controller.ts`:
    `tenant/request` 10/h) já existiam, mas nem `RateLimitGuard` nem
    `RateLimitService` (`core/rate-limit/`) tinham teste próprio, e a
    expiração do token de reset (`auth.service.ts#resetPassword`,
    30 min) também não. Ao escrever os testes achei e corrigi um bug
    real: `RateLimitService.consume()` liberava incondicionalmente a
    **primeira** chamada de uma chave nova, mesmo com `max: 0` (o
    branch de "bucket novo" nunca checava `max`) — não afeta nenhum
    endpoint hoje (nenhum usa `max: 0`), mas é o tipo de bug que um
    `max` configurado errado no futuro deixaria passar batido.
    Corrigido: bucket novo com `max <= 0` já nasce bloqueado.
  - **Critério de aceite:** confirmado por 13 testes unitários novos
    (`rate-limit.service.spec.ts`: limite, reset de janela, chaves
    independentes, o caso `max: 0` corrigido; `rate-limit.guard.spec.ts`:
    sem metadata deixa passar, `429` com `retryAfterSeconds` ao
    exceder, mensagem customizada, cada `keyPart` — `ip`/`tenantId`/
    `bodyField` normalizado — gera buckets separados) e por um novo
    `test/password-reset-and-rate-limit.e2e-spec.ts` (Postgres real, 9
    testes): token de reset expirado/revogado/consumido → `400`;
    token válido → `201` e troca a senha de verdade (login com a senha
    nova confirmado); reusar o mesmo token depois → `400`; pedir um
    novo reset revoga o token anterior ainda válido do mesmo usuário
    (conferido direto no banco). Os 4 endpoints testados batendo
    repetidamente até o limite configurado: `/auth/login` (20),
    `/auth/forgot-password` (10), `/auth/reset-password` (20),
    `/registration/tenant/request` (10) — todos liberam até o limite e
    devolvem `429` exatamente na chamada seguinte. `tsc --noEmit`: 0
    erros. `npm test`: 25 suítes, 123 testes. `npm run test:e2e`: 4
    suítes, 23 testes.
  - [ ] 3.5 — mover `PII_MASTER_KEY`/`TOTP_ENCRYPTION_KEY` para um
    gerenciador de senhas fora do Railway — **ação sua, não é código**:
    eu não tenho acesso aos valores reais das chaves nem ao seu
    gerenciador de senhas. A rotação dessas chaves já está registrada
    em `docs/backlog.md` com gatilho ("primeiro incidente ou 12 meses
    em produção").
- **Parte 4 — Produção:** só preparação, nada do Railway/Cloudflare/R2
  real existe ainda. `GET /health` (pré-requisito 4.1) e a interface do
  `StorageService` (pré-requisito 4.2) já estão prontos; o resto depende
  do projeto Railway e do bucket R2 existirem.
  - **Perguntas em aberto respondidas em 2026-11-13** (ver
    "Perguntas em aberto" no plano completo): nenhuma instituição com
    dado real em banco ainda (só dev); domínio de produção
    `terceirogestor.com.br` (`app.`/`api.`); e-mail transacional via
    Resend; login Google/Microsoft fica fora do MVP (tirar por
    enquanto, revisitar pós go-live).
  - [x] **Remover login/cadastro via OAuth Google e Microsoft** — feito
    em 2026-11-13, branch `develop`, decorrente da decisão acima
    ("ordem é remover código não usado", registrada pelo usuário). Era
    usado só no cadastro de tenant (atalho que pré-preenchia nome/email
    via perfil OAuth), nunca no login de usuário existente (`auth`
    module, 100% email+senha+MFA, intacto). Removido: 4 rotas e os 7
    métodos de OAuth em `registration.controller.ts`/`registration.service.ts`;
    `GOOGLE`/`MICROSOFT` do enum `TenantRegistrationMethod` e
    `PENDING_OAUTH` do enum `TenantRegistrationStatus`; campos
    `oauthProviderSub`/`oauthStateHash` de `TenantRegistration`
    (migration `20261113114835_remove_tenant_registration_oauth`,
    aplicada local — sem dado real em produção, então migration única,
    sem precisar do padrão expandir/contrair); os 2 botões e as 2
    funções `build*RegistrationUrl` em
    `register-client-page.tsx`/`registration.ts` (frontend); as 4
    variáveis `GOOGLE_OAUTH_*`/`MICROSOFT_OAUTH_*` de `.env`,
    `.env.example`, `backend/.env.example`, `.env.production.example`;
    o item 4.3 do plano completo (URLs de redirect OAuth) marcado como
    não aplicável. Confirmado por `SELECT` direto no Postgres local:
    zero linhas em `TenantRegistration` usando `GOOGLE`/`MICROSOFT`/
    `PENDING_OAUTH` antes da migration (nada para perder).
    **Evidência:** backend `tsc --noEmit -p tsconfig.build.json` → 0
    erros; `npm test` → 27 suítes, 136 testes, ok; `npx eslint` nos
    arquivos tocados → 4 problemas (pré-existentes, nada novo — baseline
    media via `git stash` era 60, incluindo os `no-unsafe-*` do código
    OAuth agora removido); frontend `tsc --noEmit` → 0 erros; `npx
    eslint` nos arquivos tocados → 0 problemas; `npm run build` → ok.
  - [x] **Trocar provedor de e-mail para Resend** — feito em 2026-11-13,
    branch `develop` (decisão do usuário, ver "Perguntas em aberto"
    acima). `EmailService` reescrito: SMTP genérico (`nodemailer`) →
    SDK oficial `resend` (`npm install resend`, `npm uninstall
    nodemailer` — sem uso restante no projeto). Variáveis
    `SMTP_HOST/PORT/USER/PASS/FROM` → `RESEND_API_KEY`/`EMAIL_FROM` em
    `.env`, `.env.example`, `backend/.env.example`,
    `.env.production.example`. Sem `RESEND_API_KEY` configurada, o
    serviço imprime no console (mesmo comportamento de fallback de
    antes, só troca a variável que o aciona) — os 3 fluxos que mandam
    e-mail (reset de senha, código de registro, confirmação) continuam
    chamando a mesma interface `EmailService.send()`, não precisaram
    mudar. Resolve também o item de `npm audit` pendente sobre
    `nodemailer` (alta severidade) — por remoção, não upgrade.
    **Ainda falta:** testar o envio real, que exige a
    `RESEND_API_KEY` de uma conta Resend (ação do usuário).
    **Evidência:** 3 testes novos em `email.service.spec.ts` (fallback
    console sem chave, envio ok mockando o SDK, erro do Resend vira
    `BadRequestException`); backend `tsc --noEmit -p tsconfig.build.json`
    → 0 erros; `npm test` → 28 suítes, 139 testes, ok; `npx eslint` nos
    arquivos tocados → 0 problemas.
  - [x] **Driver `r2` do `StorageService`** — feito em 2026-11-13, branch
    `develop` (pré-requisito 4.2; decisão de arquitetura tomada junto
    com o usuário antes de codificar — ver pergunta "Arquitetura de
    download" respondida nesta sessão: **URL assinada nativa do R2**,
    não proxy pelo backend). `npm install @aws-sdk/client-s3
    @aws-sdk/s3-request-presigner`. Achado ao investigar: o download
    (`UploadsController.download`) lia o arquivo direto do disco local,
    ignorando por completo a abstração `StorageDriver` — um driver `r2`
    só com `put`/`delete` deixaria os downloads quebrados (upload vai
    pro R2, download nunca acha o arquivo). Corrigido junto:
    `getSignedUrl` virou parte da interface `StorageDriver` (antes era
    só HMAC fixo em `StorageService`) — `local` mantém a URL assinada
    própria de hoje (`/uploads/...?sig=`, verificada por
    `UploadsController`); `r2` presigna um `GetObjectCommand` nativo
    (`@aws-sdk/s3-request-presigner`), e o navegador passa a baixar
    direto do bucket, nunca pela API. Consequência assumida: o log de
    acesso sensível (`PersonSensitiveAccessLog`, item 2 de
    `docs/auditoria-riscos.md`) não pode mais depender do download
    passar pela API (não passa, com `r2`) — moveu de
    `UploadsController.download` para `SignUploadsInterceptor`, no
    momento em que a URL é emitida (mesmo princípio para os dois
    drivers agora, não só pra `r2`): uma falha ao gravar o log não
    derruba a resposta (`try/catch` + aviso, mesmo padrão defensivo de
    `PrismaService#safeAuditLog`). `getSignedUrl` ficou `async` (e
    `SignUploadsInterceptor` também, via `switchMap`/`Promise.all`, já
    que presignar no R2 é uma chamada assíncrona do SDK). Variáveis
    novas: `STORAGE_DRIVER` (default `local`), `R2_ACCOUNT_ID`,
    `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` nos 4
    arquivos de env (`.env.production.example` já com
    `STORAGE_DRIVER=r2`). **Ainda falta:** testar contra um bucket R2
    de verdade — exige a conta/credenciais (ação do usuário); migração
    dos arquivos que já existem localmente fica para quando isso
    acontecer (script idempotente, como o plano já previa).
    **Evidência:** `storage.service.spec.ts` reescrito (14 testes:
    local inalterado + 4 novos de `r2` mockando `@aws-sdk/client-s3`/
    `s3-request-presigner` + rejeição de driver desconhecido/env
    incompleta); `sign-uploads.interceptor.spec.ts` com 2 testes novos
    (log não dispara sem `personId` em nenhum nível, falha no log não
    derruba a resposta); `uploads.controller.spec.ts` simplificado (sem
    `PrismaService`/`RequestContextService`, que saíram do construtor).
    backend `tsc --noEmit -p tsconfig.build.json` → 0 erros; `npm test`
    → 28 suítes, 143 testes, ok; `npx eslint` nos arquivos tocados → 0
    problemas.
  - [x] **Sentry no backend e no frontend** — feito em 2026-11-13, pré-
    requisito 4.5 ("saber do erro antes da instituição ligar"),
    incluindo falha de auditoria. `npm install @sentry/nestjs`
    (backend) e `@sentry/nextjs` (frontend). **Backend:**
    `src/instrument.ts` (novo, `Sentry.init` só se `SENTRY_DSN` estiver
    setada — sem DSN, zero mudança de comportamento), importado como
    primeira linha de `main.ts`; `SentryModule.forRoot()` como primeiro
    item de `imports` em `app.module.ts`; `SentryGlobalFilter` como
    filtro global (`app.useGlobalFilters`) — não existia nenhum filtro
    global antes, sem conflito. `Sentry.captureException(error)`
    adicionado nos 2 pontos que hoje só fazem `console.warn` e engolem
    o erro (`PrismaService#safeAuditLog`,
    `SignUploadsInterceptor#logSensitiveAccess`) — a falha de auditoria
    agora também vira alerta, não só log local. **Frontend (Next 16,
    App Router):** `src/instrumentation.ts` (`register()` +
    `onRequestError: Sentry.captureRequestError`, API estável desde o
    Next 15, confirmada na doc embutida no pacote `next`),
    `src/instrumentation-client.ts` (convenção atual — `sentry.client.
    config.ts` foi descontinuado a partir do Next 15.3), `src/app/
    global-error.tsx` novo (não existia nenhum error boundary ainda).
    `next.config.ts` envolvido com `withSentryConfig` de
    `@sentry/nextjs/config` (não é mais exportado do pacote principal
    nesta versão) — `org`/`project`/`authToken` ficam de fora até
    existir um projeto Sentry real; sem eles o plugin só pula o upload
    de sourcemaps (confirmado: `npm run build` roda limpo, sem nenhum
    aviso do Sentry). Variáveis novas: `SENTRY_DSN`/`SENTRY_ENVIRONMENT`
    (server) e `NEXT_PUBLIC_SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_ENVIRONMENT`
    (client, mesma DSN normalmente) nos 4 arquivos de env.
    **Ainda falta:** DSN de um projeto Sentry real (ação do usuário) —
    sem ela nenhum dos dois apps reporta nada, intencionalmente.
    **Evidência:** backend `tsc` → 0 erros; `npm test` → 28 suítes, 143
    testes, ok (inalterado - nenhum spec monta o `AppModule` completo);
    `npx eslint` nos arquivos tocados → 0 problemas novos (`main.ts`/
    `prisma.service.ts` mantiveram a mesma contagem de antes, 137
    problemas, confirmado via `git stash`). Teste manual real: subi o
    backend (`npm run start:dev`) e confirmei no log — `SentryModule
    dependencies initialized` e `Nest application successfully
    started` antes de qualquer outra coisa, provando que o módulo e o
    filtro global inicializam sem erro (o bind da porta 3001 falhou só
    porque já havia outro processo `node dist/main` alheio a esta
    sessão ocupando a porta — não é regressão do Sentry). Frontend:
    `tsc` → 0 erros; `npx eslint` nos arquivos tocados → 0 problemas;
    `npm run build` → ok, sem nenhum aviso/erro do Sentry no output.
- **Achados novos da auditoria:** [x] 13 (`.gitignore` sem barra,
  2026-11-11), [x] 14 (seed sem build automatizado, 2026-11-11, ver CI
  acima) e [x] 16 (versão de Node, 2026-11-13 — Dockerfile/CI/`.nvmrc`
  dos dois apps já em 22.x, nenhuma mudança necessária; ambiente de dev
  local fica em v26.1.0 por decisão do usuário, ver `docs/backlog.md`)
  feitos.

## Parte atual: Partes 2 e 3 fechadas (exceto itens intencionalmente adiados), pronta para a Parte 4

Fica aberto só o que foi adiado de propósito: a dívida de lint medida
(não reduzida) e o item 3.5 (mover `PII_MASTER_KEY`/`TOTP_ENCRYPTION_KEY`
para um gerenciador de senhas — ação operacional do usuário, não é
código). Parte 4 (Railway/Cloudflare/R2) só começa quando o projeto
Railway existir.

**Desvio em andamento, a pedido explícito do usuário em 2026-11-13:**
Fases 1, 2 e 3 do plano SCFV (então em `docs/plano-implementacao-scfv.md`,
hoje `docs/historico/plano-implementacao-scfv.md` — ver nota de
2026-11-15 abaixo) foram iniciadas antes da Parte 4/5. Fase 1: model `ActionOccurrence` (Encontro)
+ endpoints (CRUD, geração em lote por recorrência semanal, cancelamento
em série). Fase 2: aba "Encontros" no detalhe da Atividade (lista/
calendário, agendamento em lote, edição/cancelamento) — testada de ponta
a ponta com navegador real. Fase 3: presença/qualidade migraram de
"por Atividade" para "por Encontro" (migration em 2 passos + backfill
+ seletor de Encontro no frontend, reaproveitando as abas existentes).
Todas implementadas e testadas (ver evidência nas seções "Fase 1"/
"Fase 2"/"Fase 3" desse plano). Não bloqueia a Parte 4; é trabalho
adicional em paralelo.

**Novo desvio, a pedido explícito do usuário em 2026-11-13:**
redesenho de Programa→Projeto→Atividade→Encontro (consolidar
`ProjectGroup`/`PeopleGroup`, matrícula por grupo, Encontro com grupo de
equipe, rename Ação→Atividade no código via `@@map`, relatórios em
cascata) — plano completo em
`docs/historico/plano-redesenho-grupos-matricula-atividades.md` (movido
para `historico` em 2026-11-15, ver nota abaixo), em fases R1-R5.

Fase R1 (eliminar `ProjectGroup`, consolidar em `PeopleGroup`) concluída:
migration de remoção (`20261113170301_remove_project_group`, sem dado de
produção a preservar), backend limpo (CRUD de `ProjectGroup` e branch
`PROJECT_GROUP` removidos de `project-structure.*` e `actions.service.ts`;
`tsc` 0 erros, `npm test` 28 suítes/143 testes sem regressão) e frontend
limpo (módulo standalone + 4 window actions + search view removidos via
`git rm`; `tsc` 0 erros; `eslint` 211 problemas vs. baseline 217 via `git
stash`, net -6, nenhuma categoria nova; `npm run build` sucesso). Detalhe
completo na seção "Status" da Fase R1 em
`docs/historico/plano-redesenho-grupos-matricula-atividades.md`.

Correção do seletor de colunas/Painel Search (fora da numeração R1-R5,
mas no mesmo desvio): causa raiz era estrutural
(`PageControlPanel`/`ControlPanelContext` relocam o botão da busca pra
fora do `ColumnVisibilityProvider` local) — corrigido elevando o estado
pro `RecordListHost`; Relations (abas de relação + diálogos de vínculo)
passam a nunca mostrar o seletor. Verificado com browser real (Chrome já
instalado + Playwright, sem baixar nada). Detalhe completo já registrado
nesta seção anteriormente.

Fase R2 (matrícula por grupo) concluída: sem migration — a revisão é
computada em cima de `PeopleGroupParticipation`/`ProjectEnrollment`
existentes (ver "Status" da Fase R2 no plano). Backend:
`syncPeopleGroupEnrollments` + rota `POST .../sync-enrollments`; `tsc` 0
erros, `npm test` 28/143 sem regressão, `eslint` igual à baseline (3
diffs de quebra de linha corrigidos com `--fix`). Frontend: botão
"Matricular/revisar membros" na tab Grupos de Pessoas do Projeto; `tsc` 0
erros, `eslint` igual à baseline, `npm run build` sucesso. Testado com
dado real via API direta no projeto "Projeto Alvorada"/grupo "C1M":
removida 1 participação ativa + adicionada 1 pessoa nova → resultado
exato `enrolled: [Bianca Torres], ended: [Sabrina Melo]`; testado
também no browser (botão aparece só nos grupos PARTICIPANT, diálogo de
confirmação, toast de resumo). Banco resetado via `npm run db:seed`
depois do teste. Seguindo para a Fase R3 (Encontro ganha planejamento/
relatório/fotos + grupo de equipe — escopo ampliado nesta sessão, ver o
plano).

Fase R3 (Encontro ganha planejamento/relatório/fotos + grupo de equipe)
concluída: migration `20261114013300_move_plan_report_to_occurrence_add_team_group`
move `planHtml`/`executedHtml`/`conclusionHtml`/`photoPaths` de
`ProjectAction` pra `ActionOccurrence` (mantém `completionPercent` na
Atividade) e cria `ActionOccurrenceTeamGroup`; `seed.ts` migrado junto.
Backend: `actions.service.ts` valida e persiste os 4 campos +
`teamPeopleGroupIds` em create/update/bulk de `ActionOccurrence`
(diff via `$transaction` no update); `createProjectAction`/
`updateProjectAction` não lidam mais com esses campos. `tsc` 0 erros,
`npm test` 28/143 sem regressão, `eslint` em `actions/**/*.ts` → 139
problemas vs. 137 na baseline (+2 do mesmo
`@typescript-eslint/no-unsafe-assignment` já existente, nenhuma
categoria nova); DTOs tocados → 0 problemas. Frontend: diálogo de
edição do Encontro ganha seletor de grupos de equipe, 3 campos
`<RichText>` e editor de fotos próprio; aba da Atividade troca
executado/conclusão/fotos por uma aba "Progresso" só com
`completionPercent`; "Relatório" passa a ler do Encontro selecionado.
`tsc` 0 erros, `eslint` nos 8 arquivos tocados → 11 problemas vs. 12 na
baseline (mesma categoria, contagem menor), `npm run build` sucesso.
Testado no browser com dado de seed (Encontro "Acolhimento de abertura"
do "Projeto Música Manhã"): diálogo já chega com grupos de equipe
marcados e conteúdo migrado preenchido; upload de foto ao vivo
funcionou (1/5 fotos) e salvou (toast "Encontro atualizado"); aba
Relatório confirma o mesmo conteúdo vindo do Encontro, não mais da
Atividade. Detalhe completo na seção "Status" da Fase R3 em
`docs/historico/plano-redesenho-grupos-matricula-atividades.md`. Fases R4
(rename Ação→Atividade via `@@map`) e R5 (relatórios em cascata) ainda
não retomadas — absorvidas em 2026-11-15 pelo novo plano mestre (ver nota
abaixo), como "Fase 1.0" e "Fase 9" respectivamente.

**Revisão de documentação em 2026-11-15, a pedido explícito do usuário:**
o usuário escreveu
`docs/terceiro-gestor-plano-de-desenvolvimento-modulos-atendimento-e-projetos.md`
(Fases 0-9 dos módulos Atendimento e Gestão de Projetos) e pediu revisão
de toda a documentação de planejamento para eliminar divergência. Decisão
do usuário: esse documento novo é **o plano mestre** para esses dois
módulos daqui pra frente, substituindo
`docs/plano-implementacao-scfv.md`,
`docs/especificacao-completa-saas-para-ongs-de-scfv.md` e as Fases R4/R5
de `docs/plano-redesenho-grupos-matricula-atividades.md` (os três movidos
para `docs/historico/`, mantidos como registro histórico — Fases 1-3/R1-R3
já implementadas continuam com evidência preservada lá). A nomenclatura do
documento novo (`Meeting`/`Attendance`/`Benefit`/`Referral`/`Occurrence`/
`Case`/etc.) é a referência oficial para o trabalho ainda não
implementado; o próprio documento traz uma tabela de mapeamento para o
que já existe no banco sob outros nomes (`ActionOccurrence` = `Meeting`,
`ProjectActionAttendance` = `MeetingAttendance` etc.) — nenhuma tabela já
criada foi renomeada só para bater com o texto. Também arquivados nesta
revisão, por estarem obsoletos/órfãos: `docs/canonical-business-structure.md`
(descrevia `ProjectGroup` como conceito ativo — eliminado na Fase R1) e
`docs/module-canonical-checklist.md` (checklist do "Marco Zero 1.0", já
fechado, sem nenhuma referência viva). `docs/pesquisa-de-mercado-modulo-scfv.md`
continua ativo (é pesquisa regulatória, não plano). Nenhuma linha de
código mudou nesta revisão — é só documentação.

**Fase 1.0 do plano mestre (rename no código) concluída em 2026-11-15,**
a pedido explícito do usuário. Escopo: só os 5 models que o plano
mestre lista — `ProjectAction`→`Activity`, `ActionType`→`ActivityType`,
`ActionOccurrence`→`Meeting`, `ProjectActionAttendance`→`MeetingAttendance`,
`ActionPeopleGroup`→`ActivityPeopleGroup` —, via `@@map`/`@map` do Prisma
(tabela física inalterada, nenhuma migration gerada). Deliberadamente
fora do escopo (nomes de modelo que não mudam, mesmo decisão já tomada na
Fase R4 original): `ProjectActionComment`, `ProjectActionAttachment`,
`ProjectActionPeopleParticipation`, `ActionOccurrenceTeamGroup`, e os 3
enums (`ActionStatus`, `ActionTarget`, `ActionPeopleParticipationRole`).
**Backend:** schema editado model a model (9 edições em
`schema.prisma`, confirmado `npx prisma validate` + `npx prisma generate`
sem erro); find-and-replace disciplinado de `prisma.<accessor>` e
`Prisma.<Tipo>` (ordem cuidando de colisão de prefixo, ex.:
`prisma.projectActionAttendance` antes de `prisma.projectAction`) em
`actions.service.ts`, `dashboard.service.ts`, `people-groups.service.ts`,
`project-structure.service.ts`, `prisma/seed.ts` (+ `seed.js`/`seed.js.map`
recompilados via `npm run build:seed`), `scripts/backfill-action-occurrences.js`,
`scripts/migrate-upload-keys-to-tenant-scoped.js`,
`test/tenant-isolation.e2e-spec.ts`, `test/support/tenant-isolation.setup.ts`.
2 comentários desatualizados corrigidos de propósito (`actions.service.ts`,
`sign-uploads.interceptor.spec.ts`). **Frontend:** 37 identificadores
renomeados (tipos `Api*`/`*Input`/`*Response`/`*ListItem` + funções do
cliente de API) em 20 arquivos de `modules/actions`, `modules/projects` e
`web-client/data-provider/rest/actions.ts` — nomes de componente React,
arquivos e rotas **não** foram tocados (fora do escopo: só "tipos e código
interno"). **Correção em 2026-11-15, achada durante teste de navegador da
Fase 1:** a afirmação original aqui ("a UI/labels já diziam 'Atividade'
desde a Fase 4 do plano SCFV") estava **errada** — nunca foi verificada.
O rótulo visível continua "Ação"/"Ações" em todo lugar (manifest do
módulo, sidebar, breadcrumbs, botão "Nova ação", `actions-module-contract.tsx`
`entity: { singular: "Ação", plural: "Ações" }`). O relabel textual
(Fase 4 do plano SCFV antigo) nunca foi de fato executado — registrado
como pendente em `docs/backlog.md`.
**Evidência:** backend `npx tsc --noEmit -p tsconfig.build.json` → 0
erros; `npm test` → 28 suítes/143 testes sem regressão; `npm run build` →
ok; `npx eslint` nos 4 arquivos de serviço tocados → 141 problemas vs. 146
na baseline (medida via `git stash` + `prisma generate` pro schema antigo,
pra não contaminar a comparação) — net -5, nenhuma categoria nova (1
`prettier/prettier` cosmético corrigido com `--fix`). Frontend `npx tsc
--noEmit` → 0 erros; `npm run build` → ok; `npx eslint` nas áreas tocadas →
mesma dívida já documentada (`react-hooks/set-state-in-effect`,
`react-hooks/preserve-manual-memoization`), nenhuma categoria nova.
Confirmado por grep (`\b(ProjectAction|ActionType|ActionOccurrence|
ProjectActionAttendance|ActionPeopleGroup)\b`, case-insensitive) em todo o
repositório: zero referência sobrando fora de `docs/historico/`, das
migrations (SQL histórico, não muda — `@@map` preserva a tabela física) e
de 3 pontos pré-existentes deixados intocados de propósito (`entity:
"ProjectAction"` em `prisma/seed.ts`, `ENTITY_LABELS` do dashboard e o
filtro da aba Auditoria em `actions-detail-layout-contract.tsx`/
`projects-detail-layout-contract.tsx` — nenhum corresponde a uma gravação
real de audit log hoje, confirmado por grep em `backend/src` por
`entity: 'ProjectAction'`/`entity: 'Project'`: só `DepositItem`/
`PantryItem`/`TaskOrganizerTask`/etc. são gravados de verdade; não são
identificadores de código, são valores de string livres). Sem Postgres
disponível neste ambiente para `prisma migrate status` — não é um
problema: `@@map` não gera migration (confirmado pelo schema validar e o
client gerar sem diff de migration).
**Achado incidental, registrado em `docs/backlog.md`:**
`migrate-upload-keys-to-tenant-scoped.js#migrateProjectActionPhotoPaths`
já estava quebrado desde a Fase R3 (2026-11-14, moveu `photoPaths` de
`ProjectAction` pra `ActionOccurrence`) — não corrigido aqui, fora do
escopo desta fase.

**Fase 1 do plano mestre (Estrutura básica de Projetos) concluída em
2026-11-15,** a pedido explícito do usuário. Dos 5 itens da fase,
`Program`/`Activity`/`Meeting` manual/turma vinculada já existiam; os 2
gaps reais, resolvidos agora:
- **Decisão do usuário sobre `funding_source`:** não é campo único no
  `Project` — a dor de "financiamento misto" (seção 1.2 do plano mestre)
  é real, então criei `ProjectFundingSource` (N por projeto: `source`
  `MUNICIPAL/ESTADUAL/FEDERAL/TERCEIRO` + `name`/`notes` livres).
  Pedido explícito do usuário: registrar no backlog uma fase futura para
  revisar essa estrutura visando boa gestão dos recursos do projeto
  (valores, prazos, templates por fonte) — feito em `docs/backlog.md`.
- `Goal`/`Objective` modelado como **uma única entidade** `Goal`
  (`title`/`description`, por `Project`) — decisão própria registrada
  explicitamente no plano mestre (seção da Fase 1) para confirmação do
  usuário, já que o documento original usava os dois nomes de forma
  ambígua.
**Schema:** migration `20261115120000_add_goal_and_project_funding_source`
(enum `FundingSourceType`; tabelas `ProjectFundingSource`/`Goal`; coluna
`goalId` em `ProjectAction`) — **escrita à mão**, replicando exatamente o
estilo das migrations já existentes (`CreateEnum`/`AlterTable`/
`CreateTable`/`CreateIndex`/`AddForeignKey`, mesma convenção de nomes de
constraint), porque este ambiente não tem Postgres acessível para
`prisma migrate dev` gerar automaticamente (`P1001`, confirmado também
que não há nada escutando a porta 5432 nem serviço de Postgres instalado
aqui). **Ação pendente do usuário:** rodar `npx prisma migrate dev` (ou
`migrate status`) numa máquina com Postgres antes de aplicar essa
migration em qualquer ambiente, para confirmar que o SQL bate com o
schema sem drift — isso não foi verificado nesta sessão.
**Backend:** CRUD completo de `funding-sources` e `goals` em
`project-structure.service.ts`/`.controller.ts` (rotas
`/projects/:projectId/funding-sources` e `/goals`, reaproveitando as
permissões `project-structure.*` já existentes, sem chave nova);
`actions.service.ts` valida `goalId` contra o projeto
(`ensureGoalBelongsToProject`) em create/update da Atividade e inclui
`goal: { id, title }` no retorno. `prisma/seed.ts` ganhou 1 meta + 2
fontes de financiamento de exemplo (Projeto Música Manhã), com a
atividade "Ensaio dos meninos da percussão" já vinculada à meta.
**Evidência:** `npx prisma validate` + `npx prisma generate` → ok; `tsc
--noEmit -p tsconfig.build.json` → 0 erros; `npm test` → 28 suítes/143
testes sem regressão; `npm run build` → ok; `npm run build:seed` → ok
(seed.ts compila e `seed.js`/`seed.js.map` foram recompilados); `npx
eslint` nos 9 arquivos novos/tocados do backend → 0 problemas novos (as 4
service files mantiveram os mesmos 141 problemas já medidos na Fase 1.0).
**Frontend:** tipos `ApiGoal`/`ApiProjectFundingSource` +
`GoalInput`/`ProjectFundingSourceInput` (`modules/projects/api/types/
structure.ts`) + funções de API (`project-structure.ts`); duas seções
novas autocontidas — `ProjectGoalsSection`/`ProjectFundingSourcesSection`
(mesmo padrão de `ActionOccurrencesSection`: fetch próprio via
`useAuth()`, sem acoplar ao engine) — plugadas como abas "Metas" e
"Financiamento" no detalhe do Projeto (`projects-detail-layout-contract.tsx`,
usando a chave genérica `content:` do `tabTemplates`, já suportada pelo
engine mas não usada antes neste arquivo); seletor de Meta opcional no
formulário de Atividade (`action-create-form-section.tsx`, compartilhado
por create/edit). **Evidência:** `tsc --noEmit` → 0 erros; `npm run
build` → ok; `npx eslint` nos arquivos novos → 4 problemas, todos
`react-hooks/set-state-in-effect` (dívida já tolerada em todo o projeto,
nenhuma categoria nova).
**Testado manualmente em 2026-11-15** — usuário religou o WSL, Postgres
local ficou acessível. `npx prisma migrate dev` aplicou a migration
escrita à mão **sem detectar drift** (confirma que o SQL batia com o
schema). `npm run db:seed` ok. Backend (`npm run start:dev`) e frontend
(`npm run dev`) subiram sem erro. Teste real de navegador (Playwright,
Chromium já em cache local, login real `admin@seed.local`): aba "Metas"
do Projeto mostra a meta do seed + cria uma nova via diálogo; aba
"Financiamento" mostra as 2 fontes do seed com badge Municipal/Terceiro
corretos; seletor "Meta (Plano de Trabalho)" no formulário de Atividade
popula corretamente ao escolher o Projeto; zero erro de console nas 8
telas visitadas. Achado no caminho, nada a ver com código quebrado: o
formulário de login realmente perde o que foi digitado se preenchido
antes do nome da instituição carregar (bug já conhecido, registrado em
`docs/backlog.md` desde 2026-11-13) — contornado no script de teste
esperando o nome carregar antes de preencher. Dados de teste (3 metas
fictícias, geradas ao reexecutar o script durante o ajuste dos
seletores) removidos via API; banco restaurado com `npm run db:seed`.
**Achado e corrigido na documentação:** a Fase 1.0 afirmava que o rótulo
de UI já dizia "Atividade" — nunca tinha sido verificado e estava
**errado** (confirmado nas telas reais: ainda era "Ação"/"Ações" em todo
lugar — manifest do módulo, breadcrumbs, botão "Nova ação"). Corrigido
na seção da Fase 1.0 acima.

**Relabel "Ação"→"Atividade" feito em 2026-11-15,** a pedido explícito
do usuário ("se ficou pendência na Fase 1, finalize"). Find-and-replace
disciplinado (regex com `\b`, preservando "ação"/"ações" genéricas que
não são sobre esta entidade — ex.: "Esta ação não pode ser desfeita" em
diálogos de confirmação, "Ação" como coluna de log de auditoria em
admin/access-log, "Ações" como menu de linha em `project-enrollments-card.tsx`
— nenhum desses foi tocado, são sobre o verbo genérico, não a entidade)
em 17 arquivos: `modules/actions/manifest.ts` (título do menu),
`actions-module-contract.tsx` (entity singular/plural, fallbackTitle,
field label, createActionLabel, downloadFileName), `actions-detail-layout-contract.tsx`
(label da fonte de auditoria), `action-create.constants.ts`/
`action-create-engine-client-page.tsx` (breadcrumbs, títulos), `actions-list.constants.ts`/
`actions-list-module-client-page.tsx` (breadcrumbs, botão, coluna),
`action-manage.constants.ts`/`action-quality.constants.ts`/
`action-relations.constants.ts`/`action-detail-engine-client-page.tsx`/
`action-report-preview.tsx` (todos os textos da tela de detalhe/gestão),
`project-action-manage-dialog.tsx`/`projects-detail-layout-contract.tsx`
(aba/coluna/label dentro do Projeto), `web-client/registry/actions/
actions.tsx`/`project-structure.tsx` (breadcrumbs, título da janela),
`web-client/registry/searchViews/actions.ts` (placeholder de busca —
achado só depois, porque estava sem acento: "Pesquisar acoes por..." não
batia com o regex acentuado), `core-dashboard-client-page.tsx` (ação
rápida do Dashboard + título do gráfico + nome do arquivo baixado).
**Evidência:** `npx tsc --noEmit` → 0 erros; `npm run build` → ok; `npx
eslint` nas áreas tocadas → mesma dívida já tolerada
(`react-hooks/set-state-in-effect`/`react-hooks/preserve-manual-memoization`),
nenhuma categoria nova. Teste real de navegador (mesmo Chromium em cache,
login real): sidebar mostra "Atividades"; ação rápida do Dashboard
mostra "Registrar atividade"; lista mostra breadcrumb "Atividades",
coluna "ATIVIDADE" e placeholder de busca "Pesquisar atividades por
titulo ou tipo"; formulário de criação mostra breadcrumb "Atividades >
Nova atividade", título "Nova atividade" e botão "Criar atividade" —
confirmado por screenshot real, zero "Ação"/"Ações" sobrando nessas
telas. Nenhum dado de teste criado (só navegação, não cheguei a
submeter o formulário). Servidores de dev encerrados ao final.
**Dívida reconhecida, não bloqueante:** o ambiente de dev ficou visivelmente
sobrecarregado durante os testes repetidos desta sessão (respostas de
10-20s+ em rotas já compiladas, 1 `ECONNRESET` de fetch) — não é
regressão de código (confirmado: a mesma rota funcionou assim que o
servidor teve um instante para respirar), é só o custo de rodar 3
sessões de Playwright + 2 reinícios de servidor seguidos neste sandbox.

**Fase 3 do plano mestre (Presença Diária derivada) concluída em
2026-11-15,** a pedido explícito do usuário ("implemente a fase 3, os
testes vou fazer depois" — mesmo assim, testada de ponta a ponta contra
Postgres real nesta sessão, ver abaixo). **Decisão própria de escopo,
registrada para confirmação futura:** `DailyAttendance` é por
pessoa/dia (`tenantId`+`personId`+`date`), não por projeto — o texto da
fase só diz "por pessoa/data"; se um dia precisar de presença diária
*dentro de um projeto específico*, é migração aditiva simples
(`projectId` a mais na tabela).
**Schema:** migration `20261115172019_add_daily_attendance` — desta vez
gerada e aplicada de verdade via `npx prisma migrate dev` (Postgres
local acessível nesta sessão, depois que o usuário religou o WSL), sem
precisar escrever SQL à mão como na Fase 1.
**Backend:** `syncDailyAttendanceForPersonDate` reavalia do zero a cada
chamada (conta quantos `MeetingAttendance` `PRESENT` existem pra
pessoa+data, em qualquer encontro/atividade, e faz upsert ou remove) —
decisão deliberada de não incrementar/decrementar contador, porque isso
trata corretamente o caso de corrigir uma presença já lançada (de
`PRESENT` pra `ABSENT`): se não sobra nenhuma outra presença no dia, o
registro some, não fica errado. Conectado em `actions.service.ts` nos 3
pontos que escrevem ou apagam `MeetingAttendance`:
`upsertProjectActionAttendances` (fluxo principal de marcar presença),
`deleteActionOccurrence` e `deleteProjectAction` (evita presença diária
órfã quando um encontro ou uma atividade inteira some). Relatório
simples novo: `GET /actions/attendance-summary/:personId?month=AAAA-MM`
→ `{ activityAttendances, dailyAttendances }`, reaproveitando a
permissão `actions.read` já existente (sem chave nova).
**Evidência:** `npx prisma migrate dev` → aplicou sem nenhum drift
detectado (prova que o design do schema está consistente);
`tsc --noEmit -p tsconfig.build.json` → 0 erros; `npm test` → 28
suítes/143 testes sem regressão; `npm run build` → ok; `eslint` em
`actions.service.ts`/`actions-list.controller.ts` → 131 problemas vs.
132 na baseline (medida via `git stash`, descontaminada regenerando o
Prisma Client pro schema antigo antes de medir) — net -1, nenhuma
categoria nova; DTO novo (`person-attendance-summary-query.dto.ts`) → 0
problemas.
**Testado de ponta a ponta contra Postgres real** (não só unitário, já
que o ambiente tinha banco disponível desta vez): backend de pé, dados
do seed, autenticação real. Criados 3 encontros em 3 atividades
diferentes do "Projeto Música Manhã" na mesma data (2026-04-01); marcada
presença `PRESENT` da mesma matrícula (pessoa `...113004`) nos 3 →
`GET /actions/attendance-summary/...113004?month=2026-04` devolveu
`{"activityAttendances":3,"dailyAttendances":1}` — bate exatamente com o
critério de teste da fase ("3 registros de presença por atividade, mas
1 único registro de presença diária"). Corrigida 1 das 3 presenças para
`ABSENT` → `dailyAttendances` continuou `1` (ainda sobravam 2
`PRESENT`, prova que a reavaliação funciona, não é só "criar e nunca
apagar"). Corrigidas as 2 restantes para `ABSENT` → `dailyAttendances`
caiu pra `0`. Marcada `PRESENT` de novo numa delas e excluído o próprio
encontro (única presença do dia) → `dailyAttendances` voltou a `0`,
confirmando que `deleteActionOccurrence` também dispara a reavaliação.
Os 3 encontros de teste foram excluídos via API ao final; banco
restaurado com `npm run db:seed`. Seed também ganhou 4
`DailyAttendance` de exemplo, coerentes com as presenças `PRESENT` já
existentes no seed — confirmado por `GET /actions/attendance-summary`
real contra o seed limpo antes de começar o teste
(`{"activityAttendances":1,"dailyAttendances":1}` para a pessoa
`...113001` em fevereiro/2026, batendo com o único `PRESENT` do seed
pra ela naquele mês).
**Fora do escopo desta fase, de propósito:** nenhuma tela de frontend
para o relatório — o critério de teste é inteiramente sobre
comportamento de dados (testável por API), e "relatório simples" no
texto da fase não especifica onde expor na UI. A API já existe; criar a
tela é um próximo passo separado e pequeno, se/quando quiser.

**Convenção de UI fixada em 2026-11-13, a pedido explícito do usuário —
seletor de colunas ("Colunas") por tipo de tela:**
- **ListView** (tela principal de um módulo — Pessoas, Grupos de Pessoas,
  Programas, Projetos, Ações, Tarefas, Admin, Pantry/Despensa): o botão
  "Colunas" fica **dentro do Painel Search**, na barra de busca, ao lado
  do botão de Filtros — nunca solto acima da tabela.
- **RelationView** (tabela de relação embutida numa aba de Detail — ex.:
  "Grupos de Pessoas"/"Participantes"/"Ações" dentro do Projeto — e
  diálogos de vínculo/picker como `ProjectPeopleGroupPickerDialog`/
  `BulkEnrollmentDialog`): o Painel Search é a **versão mínima** — só a
  barra de busca, pesquisando em qualquer coluna/valor (nome, número,
  o que for). **Sem seletor de colunas em nenhum lugar.**

Bug corrigido: o botão "Colunas" não aparecia em nenhum lugar em Pessoas/
Grupos de Pessoas, e aparecia solto acima da tabela (fora do Painel
Search) em Programas/Projetos/Ações — e o mesmo acontecia nas tabelas de
Relation, violando a regra acima. Causa raiz dupla: (1) `PageControlPanel`
não renderiza seus slots localmente — só registra as props num
`ControlPanelContext` que o `ControlPanelShell` (montado em outro ponto
do layout) lê e renderiza, então nenhum `ColumnVisibilityProvider` local
alcançava o botão da busca (afetava todo mundo); (2) `projects`/
`programs`/`actions` nunca passavam `columns` pro `EntityModuleShell`,
então o `ColumnVisibilityProvider` nem chegava a envolver a tela (o
`ListView` caía no botão flutuante próprio). Corrigido elevando o estado
de visibilidade pra dentro do `RecordListHost` (passado explícito pro
botão da busca, e como Provider controlado pro resto da árvore) e
adicionando `columns` nos ~6 módulos que não passavam; nas Relations e
diálogos de picker, `showColumnVisibilityButton={false}` explícito no
`ListView`/`TableView` em vez de deixar cair no padrão. Verificado com
browser real (Playwright + Chrome já instalado, sem baixar nada): botão
aparece dentro da busca nas 6 telas principais testadas (Pessoas, Grupos
de Pessoas, Programas, Projetos, Ações, Tarefas) e funciona (abre o menu,
esconde/mostra coluna, persiste); zero botão de coluna nas Relations e
diálogos testados (aba "Grupos de Pessoas" do Projeto, diálogo de
vincular grupo, aba "Participantes"). `tsc` 0 erros; `eslint` 210
problemas vs. baseline 212, net -2 (apagado `person-picker-dialog.tsx`,
não usado em lugar nenhum); `npm run build` sucesso.

Branch: `develop` (mesclada em `main` em 2026-11-06 — ver AGENTS.md para o
fluxo atual de branches). Ponto de retorno: tag `v0-baseline` (commit
`962b91c`).

## Parte 1 — Limpeza (histórico, fechada na prática)

### Checklist

- [x] Tag `v0-baseline` criada e enviada para `origin`
- [x] Linha de base medida (evidência abaixo)
- [x] Teste manual de login (sem Docker, Postgres próprio do usuário) —
      feito em 2026-11-05. No caminho, achamos e corrigimos 2 bugs reais
      que bloqueavam qualquer subida local (ver commits `da39dee` e
      `0409986`):
      1. `prisma.config.ts` lia `backend/.env` em vez da raiz (só ele,
         diferente de todo o resto do projeto) — corrigido para seguir a
         mesma convenção.
      2. `prisma/seed.ts` tentava limpar o banco com uma lista de
         `deleteMany` manual que cobria só ~30 dos ~94 models; qualquer
         dado de Household/PeopleGroup criado pelo uso manual do app
         quebrava o reseed com erro de FK, silenciosamente (`node
         prisma/seed.js` saía com `exit 0` sem imprimir nada). Troquei
         por `TRUNCATE ... CASCADE` em todas as tabelas. `prisma/seed.js`
         também estava desatualizado (emails antigos) — recompilado.
      Login confirmado via `curl` em `/t/instituicao-exemplo/auth/login`
      com `admin@seed.local` → `201` com `accessToken`.
      **Falta:** clicar nos 9 módulos pela UI (só a API foi testada aqui,
      sem browser disponível neste ambiente)
- [x] Removidos `backend-start.err.log`, `backend-start.out.log`,
      `docker/test.txt`; `*.log` agora ignorado em qualquer profundidade
- [x] `START.ps1` movido para `scripts/windows/` (não era referenciado em
      nenhum doc). `docker.ps1` ficou no lugar — é citado em `README.md` e
      `DOCKER_README.md`, mover exigiria reescrever a documentação sem
      ganho real para o MVP
- [x] `.env.production` renomeado para `.env.production.example` (só tinha
      placeholders `${...}`)
- [x] `docs/gcp/` e os 4 `docs/marco-zero-1.0*` movidos para
      `docs/historico/` (sem referências externas quebradas, confirmado por
      grep)
- [x] Removidas as 11 pastas sem uso de `frontend/src/features` (activities,
      addresses, assessments, attendances, diaries, formations, groups,
      incomes, occurrences, presences, school-histories) — 0 imports
      externos confirmados antes da remoção; `tsc` e `build` passam igual
- [x] `npm run format` no backend num commit isolado (1143 erros de
      prettier resolvidos, lógica inalterada: tsc + 15 suítes continuam
      verdes antes e depois)
- [x] `tsconfig.build.json` do backend **já excluía `test/`** (linha
      `"exclude": [..., "test", ...]`) — o erro TS6059 do plano não se
      reproduziu. Nenhuma mudança necessária
- [x] Criado `docs/backlog.md`
- [x] `CLAUDE.md`/`AGENTS.md` criados com as regras do projeto
- [x] `README.md` reescrito só com o necessário para rodar localmente
      (a versão anterior descrevia MySQL e scripts `.ps1` que não existem
      mais no repositório)

### Checkpoint completo (2026-11-05, fim da sessão)

```bash
backend: tsc --noEmit -p tsconfig.build.json → 0 erros
backend: npm test                            → 15 suites, 18 testes, ok
frontend: tsc --noEmit                       → 0 erros
frontend: npm run build                      → ok
```

**Único item aberto da Parte 1:** o teste manual de login + 9 módulos.
Não deu para rodar nesta sessão (sem Docker no PATH deste ambiente e sem
`.env` configurado, logo sem Postgres acessível). Rode na sua máquina:

```powershell
Copy-Item .env.example .env
# editar POSTGRES_PASSWORD, JWT_SECRET, PII_MASTER_KEY, TOTP_ENCRYPTION_KEY
.\docker.ps1 up -Environment dev
cd backend; npm run start:dev
cd ..\frontend; npm run dev
```

Depois de confirmar login e os 9 módulos (people, deposit, pantry,
actions, tasks, projects, programs, people-segments, people-groups) sem
quebrar nada, marque o item acima e crie a tag `v0.1-limpo` em `develop`.
`main` já recebeu todo o trabalho da Parte 1 e dos itens 1-3 da auditoria
de riscos num merge único em 2026-11-06 — o fluxo normal daqui pra frente
é `develop` → `main`, sem branch por item (ver AGENTS.md).

### Linha de base (medida em 2026-11-05, Windows, node v26.1.0 — fora da

faixa `>=22 <23` dos dois `package.json`, ver `docs/backlog.md`)

**Backend**

```
npm ci                                    → ok (832 pkgs, 41 vulnerabilidades: 3 low/22 moderate/14 high/2 critical)
npx prisma generate                       → ok (client v7.7.0)
npx tsc --noEmit -p tsconfig.build.json   → 0 erros
npm test                                  → 15 suites, 18 testes, todos passando
npx eslint "src/**/*.ts" (sem --fix)      → 1614 problemas antes do format (1145 prettier,
                                             170 no-unsafe-assignment, 133 no-unsafe-member-access,
                                             80 no-unsafe-return, 20 no-unsafe-call, 17 no-empty-object-type,
                                             15 no-unnecessary-type-assertion, 14 no-unsafe-argument,
                                             11 no-unused-vars, 7 no-base-to-string, 2 outros)
                                             → 469 problemas (454 erros, 15 avisos) depois do
                                             commit de formatação. Resto vai para a Parte 2
```

**Frontend**

```
npm ci              → ok (561 pkgs, 27 vulnerabilidades: 1 low/10 moderate/15 high/1 critical;
                      aviso EBADENGINE: node v26 vs engines >=22 <23)
npx tsc --noEmit    → 0 erros
npx eslint src      → 0 problemas
npm run build       → ok, inclui `ƒ Proxy (Middleware)` nas rotas — indício de que
                      `middleware.ts` na raiz **é** compilado/incluído mesmo com o app em
                      `src/app`. Não prova execução em runtime: confirmar com log na Parte 2
                      (achado #8 do plano)
```

**Observação sobre o achado #10 do plano:** a medição original de 8.083
problemas de lint no backend foi feita sem o client do Prisma gerado (tudo
virava `any`, cascata de `no-unsafe-*`). Com o client gerado, a linha de
base real é 1614 (1145 de prettier). Depois do commit de formatação: 469.

## Tags desta parte

- `v0-baseline` — ponto de partida, antes de qualquer mudança
- `v0.1-limpo` — ainda não criada. Falta só o teste manual de login + 9
  módulos pela UI (ver "Estado real" no topo) — na prática o trabalho já
  avançou para a Parte 2/3 sem essa tag, registrado aqui como desvio do
  processo, não como pendência bloqueante.

## Próxima parte

Partes 2 e 3 fechadas em 2026-11-11 (ver "Estado real" no topo) — só
restam itens adiados de propósito (dívida de lint, 3.5 operacional).
Ainda faltam criar as tags `v0.2-verde` e `v0.3-seguro` (não criadas
nesta sessão — tag é uma decisão do usuário). Parte 4 (Railway/
Cloudflare/R2) é a próxima, e só começa quando o projeto Railway
existir. Detalhe item a item da Parte 3: `docs/auditoria-riscos.md`.
Itens adiados com gatilho: `docs/backlog.md`.
