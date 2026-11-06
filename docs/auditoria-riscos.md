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

- [ ] **Onde:** `backend/prisma/migrations/` só tem `migration_lock.toml`;
      `backend/scripts/docker-entrypoint.sh:8-14` cai em `prisma db push`.
- **O que fazer:** gerar a migration `0_init` a partir do schema atual,
  marcar bancos existentes como aplicados, remover o fallback `db push`
  do entrypoint.
- **Critério de aceite:** banco vazio → `migrate deploy` → seed → login
  funciona; entrypoint falha (não improvisa) se não houver migrations.
- **Plano:** Parte 3.1.

### 4. CORS aberto para qualquer origem, com cookies habilitados

- [ ] **Onde:** `backend/src/main.ts:24` —
      `app.enableCors({ origin: true, credentials: true })`.
- **O que fazer:** restringir a `origin` à lista em `WEB_URL` (separada
  por vírgula), nunca `true`.
- **Critério de aceite:** requisição de uma origem fora da lista não
  recebe `Access-Control-Allow-Origin`.
- **Plano:** Parte 3.4.

## Altas

### 5. `TenantGuard` existe mas não é usado em nenhum lugar

- [ ] **Onde:** `backend/src/core/auth/guards/tenant.guard.ts` (definido,
      zero imports em controllers/`app.module.ts`). O padrão real usado
      hoje (`tenantId` vindo do JWT via `getTenantId()`/`@CurrentUser()`)
      está correto nos módulos amostrados (people, deposit, pantry,
      tasks).
- **O que fazer:** decidir um mecanismo único — aplicar o guard
  globalmente ou apagá-lo e documentar que o padrão oficial é
  `getTenantId()` a partir do JWT.
- **Critério de aceite:** não sobra código morto nem dois padrões
  coexistindo.
- **Plano:** Parte 3.3.

### 6. Isolamento entre tenants sem teste automatizado

- [ ] **Onde:** ~64 ocorrências de `.update({ where: { id } })` /
      `.delete({ where: { id } })` fora de `updateMany`/`deleteMany` em
      `backend/src/modules/**/*.service.ts`. Amostra de 3 (`deposit.service.ts:1181`,
      `people.service.ts:3486`, `tasks.service.ts:575`) segue o padrão
      seguro (busca prévia filtrada por `tenantId` antes do `update`/`delete`
      por `id` cru), mas isso não foi conferido um por um, e não há teste
      que trave isso no CI.
- **O que fazer:** revisar os ~109 casos do plano um por um; escrever um
  teste e2e de vazamento por módulo (dois tenants, mesmo fluxo:
  listar/ler/editar/excluir/anexar) — todos devem retornar 404 para o
  tenant errado.
- **Plano:** Parte 3.3.

### 7. Token de acesso dura 8 horas

- [ ] **Onde:** `backend/src/core/auth/auth.module.ts:28` e
      `backend/src/modules/registration/registration.module.ts:21` —
      `signOptions: { expiresIn: '8h' }`.
- **O que fazer:** reduzir para 15–30 min. (O refresh token já está bem
  implementado: hash armazenado, rotação, e detecção de reuso que revoga
  todas as sessões — `auth.service.ts:171-177` — não precisa de ajuste.)
- **Critério de aceite:** token expirado é rejeitado; refresh continua
  renovando a sessão normalmente.
- **Plano:** Parte 3.4.

## Médias

### 8. Sem `helmet` (headers de segurança)

- [ ] **Onde:** `backend/src/main.ts` — nenhuma referência a `helmet` no
      backend inteiro.
- **O que fazer:** adicionar `helmet()` no bootstrap.
- **Plano:** Parte 2.

### 9. Variáveis de ambiente não são validadas no boot

- [ ] **Onde:** `backend/src/app.module.ts:49-53` — `ConfigModule.forRoot`
      sem `validate`/`validationSchema`. O app sobe normalmente mesmo
      faltando `JWT_SECRET`/`PII_MASTER_KEY`/`DATABASE_URL`, e só quebra
      depois, ao usar a variável (foi exatamente isso que causou o crash
      do backend em 2026-11-05, com chaves placeholder no `.env`).
- **O que fazer:** schema de validação (zod/Joi) no `ConfigModule`; app
  não sobe se faltar uma variável obrigatória.
- **Plano:** Parte 2.

### 10. Não existe `GET /health`

- [ ] **Onde:** `backend/src/app.controller.ts` só tem `GET /` (hello).
      Nenhuma rota testa a conexão com o banco.
- **O que fazer:** criar `GET /health` que confere a conexão com o
  Postgres, para o healthcheck do Railway.
- **Plano:** Parte 2 e Parte 4.1.

### 11. IP do cliente pode se perder atrás de proxy (Cloudflare → Railway)

- [ ] **Onde:** `backend/src/main.ts` — sem `app.set('trust proxy', ...)`.
      Audit log e rate-limit usam `req.ip`.
- **O que fazer:** configurar `trust proxy` corretamente antes do go-live,
  para `ipAddress` registrar o IP real do cliente, não o do proxy.
- **Critério de aceite:** em staging, atrás de Cloudflare+Railway, o IP
  logado no audit confere com o IP real do cliente de teste.
- **Plano:** não estava na tabela original — adicionar à Parte 4
  (Cloudflare/Railway) ou revisar junto da 3.4.

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
