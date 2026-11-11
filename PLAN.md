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
- **Parte 3 — Correções severas:** a maior parte feita via
  `docs/auditoria-riscos.md` (itens 1–2 → 3.2/3.5, item 3 → 3.1, itens
  4 → 3.4, 5–6 → 3.3, 7 → 3.4). Itens do checklist original da Parte 3
  que ficaram de fora do critério de aceite da auditoria e **continuam
  abertos**:
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
- **Achados novos da auditoria:** [x] 13 (`.gitignore` sem barra,
  2026-11-11) e [x] 14 (seed sem build automatizado, 2026-11-11, ver CI
  acima) feitos. [ ] 16 (versão de Node) aberto, baixo risco, gatilho em
  `docs/backlog.md`.

## Parte atual: Parte 2 — Pequenas correções (itens restantes acima) e fechamento dos itens da Parte 3 que ficaram pendentes

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

Ver "Estado real (sincronizado em 2026-11-11)" no topo deste arquivo para
os itens abertos de Parte 2 e Parte 3. Detalhe item a item da Parte 3:
`docs/auditoria-riscos.md`. Itens adiados com gatilho: `docs/backlog.md`.
