# Terceiro Gestor — Plano de Revisão e Produção

Nov 5, 2026 · @Weverton

## Decisão e regras do jogo

O foco é colocar o Terceiro Gestor (antigo repositório `system_development`) em produção no Railway, com Cloudflare para DNS e R2 para arquivos, sem colocar em risco os dados de nenhuma instituição. O Alicerce fica congelado até o Terceiro Gestor ter cerca de 10 instituições usando e rodando estável.

- **O que não reabre:** a escolha entre Terceiro Gestor e Alicerce. A pergunta só volta quando o critério das 10 instituições for atingido.
- **Papel do Alicerce até lá:** doador de peças já testadas, como o proxy de sessão com cookie httpOnly, a auditoria com Sentry, o processo com `PLAN.md` e `backlog.md` e o gerador de módulos. Cada peça transplantada vira um item deste plano, e não um projeto paralelo.
- **Regra de ouro:** cada parte termina com o sistema funcionando. Nenhuma parte começa antes de a anterior estar fechada no checklist.
- **Ordem das partes:** limpar → pequenas correções → correções severas → produção → evolução de arquitetura. A Parte 5 só começa depois do go-live.

## Diagnóstico do repositório

O produto está funcionalmente pronto, mas tem 4 bloqueadores de produção: arquivos expostos sem login, banco sem migrations, CORS aberto e o deploy montado para GCP. Foi analisado o commit de 21/04/2026 (56 commits no total). O frontend passa no `tsc` sem erros. O `tsc` e os testes do backend não puderam ser confirmados aqui, porque o client do Prisma não foi gerado por bloqueio de rede. Esses dois rodam primeiro na sua máquina (Parte 1).

**O que já está pronto e vale proteger:** 9 módulos de domínio (people, deposit, pantry, actions, tasks, projects, programs, people-segments, people-groups), auth com MFA/TOTP, criptografia de dados pessoais (PII), RBAC, auditoria, rate limit e 94 models no Prisma. A stack é Next 16.1.6, React 19.2 e Nest 11 com Prisma 7.5.

| # | Achado | Onde | Gravidade | Parte |
| --- | --- | --- | --- | --- |
| 1 | `/uploads` servido como estático **sem autenticação**, incluindo `uploads/health` (documentos de saúde) | `ServeStaticModule` em `app.module.ts` | Crítica | 3 |
| 2 | Banco sem migrations: só existe `migration_lock.toml`, e o entrypoint cai em `prisma db push` | `prisma/migrations`, `scripts/docker-entrypoint.sh` | Crítica | 3 |
| 3 | Arquivos gravados no disco do container (11 pastas). No Railway, tudo se perde a cada deploy | `core/files/files.controller.ts` | Crítica | 4 |
| 4 | CORS `origin: true` + `credentials: true`: qualquer site pode chamar a API com o cookie do usuário | `main.ts` | Alta | 3 |
| 5 | `TenantGuard` existe, mas nenhum controller usa. O `tenantId` vem do JWT via `getTenantId()` em cada controller, o que está correto, mas sem teste de vazamento entre tenants | `core/auth/guards`, controllers | Alta | 3 |
| 6 | 109 updates/deletes com `where: { id }` dependem de uma busca anterior filtrada por tenant. É o padrão certo, mas precisa ser conferido um por um | `*.service.ts` | Alta | 3 |
| 7 | Sem headers de segurança (helmet) e sem monitoramento de erros | `main.ts` | Média | 2 / 4 |
| 8 | `middleware.ts` na raiz de `frontend/`, mas o app está em `src/app`. O Next só lê o arquivo ao lado de `app/`, então ele provavelmente não roda. No Next 16, o nome novo é `proxy.ts` | `frontend/middleware.ts` | Média (verificar) | 2 |
| 9 | Deploy e documentação feitos para GCP/Cloud Run, com variáveis `GCP_*` e GCS que nunca foram implementadas | `docs/gcp`, `.env.production` | Média | 1 / 4 |
| 10 | Lint do backend: 8.083 problemas. 1.143 são de prettier (autocorrigíveis). O resto (`no-unsafe-*`) precisa ser medido de novo com o client do Prisma gerado | backend | Média | 1 / 2 |
| 11 | Arquivos sem uso versionados: `backend-start.*.log` (66 KB), `docker/test.txt`, scripts `.ps1` e 11 pastas em `src/features` sem nenhum import | raiz, `frontend/src/features` | Baixa | 1 |
| 12 | 15 specs no backend, nenhum teste no frontend e nenhum CI (`.github` só tem template de issue) | — | Média | 2 / 4 |
| 13 | 425 de 699 arquivos do frontend com `"use client"`. Access token em `sessionStorage`, refresh em cookie | frontend | Baixa para o MVP | 5 |
| 14 | Generator legado `prisma-client-js` + script que copia o client para `dist` | `schema.prisma`, `scripts/` | Baixa | 5 |

O `.env.production` versionado só tem placeholders `${...}`, sem segredo real. Mesmo assim, deve virar `.env.production.example`. O backend usa Express, e não Fastify, e continua assim: trocar o adapter agora não traz nada para o MVP.

## Arquitetura alvo de produção

O navegador fala só com a Cloudflare. Ela encaminha para dois serviços no Railway: `web` (Next.js) e `api` (NestJS). O banco é o Postgres do próprio Railway. Arquivos e backups saem do disco do container e vão para buckets privados no R2.

&#91;embedded content: arquitetura de produção · Cloudflare, Railway, R2\]

O navegador baixa um arquivo pela URL assinada de curta duração que a `api` gera depois de checar a permissão. O bucket nunca fica público.

| Peça | Escolha | Por quê |
| --- | --- | --- |
| Domínios | `app.<domínio>` → web, `api.<domínio>` → api | Mesmo domínio registrável, então o cookie `refresh_token` funciona com `SameSite=Lax` sem CORS aberto |
| Cloudflare SSL | **Full** (testar **Full (strict)**). Nunca **Flexible** | Flexible gera loop de redirect e tráfego sem TLS até o Railway. Na comunidade do Railway há relatos dos dois modos funcionando ([discussão](https://station.railway.com/questions/cloudflare-ssl-full-strict-does-not-ab35244a)) |
| Ambientes | `production` e `staging` no mesmo projeto Railway, cada um com seu banco | Toda migration e todo deploy passam primeiro por staging |
| Banco | Postgres do Railway, só `prisma migrate deploy` | Nada de `db push` em produção |
| Arquivos | R2 via SDK S3 (`@aws-sdk/client-s3` + presigner) | Disco do container é efêmero, e o R2 não cobra saída de dados |
| Backup | Serviço cron no Railway: `pg_dump` → bucket `backups` | Cópia fora do Railway, com restauração testada |
| Erros | Sentry no backend e no frontend (padrão do Alicerce) | Saber do erro antes da instituição ligar |

## Parte 1 — Limpeza (sem mudar comportamento)

Objetivo: deixar o repositório limpo e medido, sem mudar nada do que o usuário vê. Estimativa: 2 a 3 dias. Cada item vira um commit separado, para que qualquer regressão aponte direto para a causa.

- [ ] Criar a tag `v0-baseline` no estado atual, antes de qualquer mudança. É o ponto de retorno garantido
- [ ] Medir a linha de base e registrar os números no `PLAN.md`:
  - backend: `npm ci` → `npx prisma generate` → `npx tsc --noEmit -p tsconfig.build.json` → `npm test` → `npx eslint "src/**/*.ts"`
  - frontend: `npm ci` → `npx tsc --noEmit` → `npx eslint src` → `npm run build`
  - O script `npm run lint` do backend roda com `--fix` e altera arquivos. Na medição, use o `eslint` sem `--fix`
- [ ] Subir o sistema localmente com o banco atual, fazer login e abrir cada um dos 9 módulos. Anotar o que quebra, sem corrigir ainda
- [ ] Remover os arquivos sem uso: `backend-start.err.log`, `backend-start.out.log`, `docker/test.txt`. Adicionar `*.log` ao `.gitignore`
- [ ] Mover `START.ps1` e `docker.ps1` para `scripts/windows/`, ou remover se não forem mais usados
- [ ] Renomear `.env.production` para `.env.production.example`
- [ ] Mover `docs/gcp/` e os `docs/marco-zero-*` para `docs/historico/`. Eles descrevem um alvo que deixou de existir
- [ ] Apagar as 11 pastas de `frontend/src/features` sem nenhum import (activities, addresses, assessments, attendances, diaries, formations, groups, incomes, occurrences, presences, school-histories). Rodar `tsc` e `build` depois de cada remoção
- [ ] Rodar o prettier no backend (`npm run format`) num commit só de formatação. Isso elimina cerca de 1.143 erros de lint sem mudar lógica
- [ ] Corrigir o `tsconfig` do backend para o `tsc` não puxar `test/` para dentro de `rootDir` (erro TS6059)
- [ ] Criar o `PLAN.md` (só o que está em andamento) e o `docs/backlog.md` (itens adiados com gatilho), no mesmo formato do Alicerce
- [ ] Criar um `CLAUDE.md`/`AGENTS.md` curto com as regras do projeto: tenant sempre do JWT, nada de `db push`, um commit por item
- [ ] Atualizar o `README.md` só com o que é preciso para rodar localmente

**Critério de saída:** os dois apps buildam, os testes que passavam continuam passando e o fluxo manual de login + 9 módulos funciona igual ao `v0-baseline`.

## Parte 2 — Pequenas correções

Objetivo: deixar tudo verde e criar a rede de proteção (CI) antes de mexer em segurança e dados. Estimativa: 3 a 5 dias. São correções de baixo risco, cada uma reversível com um `git revert`.

- [ ] Corrigir o que o teste manual da Parte 1 apontou como quebrado
- [ ] Fazer as 15 suítes de teste do backend passarem. Aqui, 12 falharam só porque o client do Prisma não existia. Confirmar na sua máquina antes de mexer em código
- [ ] Lint do backend: medir de novo com o client gerado. Corrigir os erros que são bug real. O que for só tipagem vai para o `backlog.md`, com uma meta de não aumentar
- [ ] Tirar o `--fix` do script `lint` e criar `lint:fix` separado, para o CI nunca alterar arquivos
- [ ] Mover `frontend/middleware.ts` para `frontend/src/proxy.ts` (nome do Next 16). Confirmar com um log que ele roda e que os redirects de tenant e de rotas legadas funcionam
- [ ] Adicionar `helmet` no `main.ts` (headers de segurança)
- [ ] Validar as variáveis de ambiente no boot com um schema (zod ou Joi no `ConfigModule`). O app não sobe se faltar `JWT_SECRET`, `PII_MASTER_KEY`, `TOTP_ENCRYPTION_KEY` ou `DATABASE_URL`
- [ ] Criar ou confirmar um endpoint `GET /health` que testa a conexão com o banco, para o healthcheck do Railway
- [ ] Atualizar dependências só em patch/minor (Next 16.x, Nest 11.x, Prisma 7.x). Nada de major nesta parte. Rodar `npm audit` e registrar o resultado
- [ ] Criar o CI no GitHub Actions: em todo PR, rodar `tsc` + `test` + `build` nos dois apps. A partir daqui, nada entra na `main` com o CI vermelho

**Critério de saída:** CI verde na `main`, testes do backend passando, `proxy.ts` comprovadamente ativo e app recusando subir sem as variáveis obrigatórias.

## Parte 3 — Correções severas (segurança, tenant, dados)

Objetivo: fechar tudo que pode vazar dados entre instituições ou corromper o banco. Estimativa: 1,5 a 2 semanas. É a parte que mais protege a produção. Cada bloco termina com um teste automatizado que prova a correção.

### 3.1 Banco com migrations versionadas

- [ ] Gerar a migration de base a partir do schema atual: `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql`
- [ ] Em todo banco que já existe (o seu local, ou algum piloto), marcar a base como aplicada: `npx prisma migrate resolve --applied 0_init`
- [ ] Remover o fallback `prisma db push` do `docker-entrypoint.sh`. Sem migrations, o deploy deve falhar, e não improvisar
- [ ] Provar que funciona: banco vazio → `migrate deploy` → seed → login → os 9 módulos abrem
- [ ] Separar o seed de produção (permissões core, papéis padrão, `permissions:backfill`) do seed de desenvolvimento (dados fictícios)

### 3.2 Arquivos fora do acesso público

- [ ] Remover o `ServeStaticModule` de `/uploads`. Nenhum arquivo é servido sem login
- [ ] Criar um `StorageService` com interface única (`put`, `getSignedUrl`, `delete`) e o driver `local` para desenvolvimento. O driver R2 entra na Parte 4
- [ ] Refatorar o `files.controller.ts`: as 11 pastas viram uma chave `tenantId/modulo/uuid.ext`. O download passa por um endpoint que confere o tenant e a permissão antes de liberar
- [ ] Validar o tipo real do arquivo pelos bytes (não só pelo mime declarado), com limite de tamanho por tipo. É o mesmo padrão já feito no Alicerce
- [ ] Teste: um usuário do tenant A não baixa um arquivo do tenant B, mesmo conhecendo a chave

### 3.3 Isolamento entre instituições

- [ ] Decidir um mecanismo único: aplicar o `TenantGuard` globalmente ou apagá-lo e manter o `getTenantId()`. Não deixar os dois
- [ ] Revisar os 109 `where: { id }` em updates e deletes. Cada um precisa vir de uma busca anterior filtrada por `tenantId`. Onde não vier, trocar por `updateMany`/`deleteMany` com `tenantId` no `where`
- [ ] Escrever um teste e2e de vazamento por módulo, com dois tenants e o mesmo fluxo: listar, ler, editar, excluir e anexar com o usuário do outro tenant. Todos devem retornar 404
- [ ] Conferir que o slug `/t/:slug` da URL nunca prevalece sobre o `tenantId` do JWT

### 3.4 Sessão e borda da API

- [ ] CORS só para as origens da variável `WEB_URL` (lista separada por vírgula), nunca `origin: true`
- [ ] Reduzir a validade do access token de 8 h para 15 a 30 min. O refresh em cookie `httpOnly` + `SameSite=Lax` + `Secure` já existe e cobre a renovação
- [ ] Conferir o rate limit em login, cadastro, esqueci a senha e reset (os 4 decorators já existem) e a expiração do token de reset

### 3.5 Chaves e dados sensíveis

- [ ] Guardar `PII_MASTER_KEY` e `TOTP_ENCRYPTION_KEY` num gerenciador de senhas, fora do Railway. Se essas chaves se perderem, os dados criptografados ficam irrecuperáveis
- [ ] Registrar no `backlog.md` a rotação de chaves, com o gatilho "primeiro incidente ou 12 meses de produção"
- [ ] Documentos de saúde são dado sensível pela LGPD: confirmar que todo acesso a eles gera registro na auditoria

**Critério de saída:** os testes de vazamento passam em todos os módulos, um banco novo sobe só com migrations e nenhum arquivo abre sem login.

## Parte 4 — Estruturação para produção

Objetivo: subir no Railway com staging, R2, backup testado e monitoramento, e então abrir para as primeiras instituições. Estimativa: 1 a 1,5 semana até o go-live. Nada vai para `production` sem passar antes por `staging`.

### 4.1 Railway

- [ ] Criar um projeto com dois ambientes, `staging` e `production`. Cada ambiente tem 3 serviços: `web`, `api` e `Postgres`
- [ ] Buildar pelos Dockerfiles que já existem. No `api`, usar `npx prisma migrate deploy` como pre-deploy command, e não dentro do entrypoint
- [ ] Configurar `/health` como healthcheck do `api`
- [ ] Usar referência de variável para o banco (`${{Postgres.DATABASE_URL}}`) e segredos só no painel do Railway
- [ ] `NEXT_PUBLIC_API_URL` é lido no build do Next, não no runtime: definir a variável no serviço `web` antes do build
- [ ] Manter o `api` com **1 réplica**. Rate limit e controle de refresh ficam em memória do processo. Escalar exige mover isso para Redis (item do `backlog.md`)
- [ ] Apagar as variáveis `GCP_*`/`GCS_*` do código e dos `.env*.example`

### 4.2 Cloudflare R2

- [ ] Criar dois buckets privados por ambiente: `tg-<ambiente>-arquivos` e `tg-<ambiente>-backups`
- [ ] Criar um token de API do R2 limitado a esses buckets, com permissão de leitura e escrita de objetos
- [ ] Implementar o driver `r2` do `StorageService` com `@aws-sdk/client-s3` (endpoint `https://<account_id>.r2.cloudflarestorage.com`, região `auto`) + `@aws-sdk/s3-request-presigner`. URLs assinadas de 5 minutos para documentos sensíveis
- [ ] Migrar os arquivos que já existem (se houver piloto) com um script idempotente que copia do disco para o R2 e atualiza os caminhos no banco
- [ ] Regra de ciclo de vida no bucket de backups: apagar dumps diários depois de 30 dias e manter os mensais

### 4.3 Cloudflare DNS

- [ ] Cadastrar `app.<domínio>` e `api.<domínio>` como domínios customizados no Railway e criar os CNAMEs na Cloudflare com o proxy ativo
- [ ] SSL/TLS em **Full**, "Always Use HTTPS" ligado. Testar **Full (strict)**
- [ ] Registros de e-mail transacional: SPF, DKIM e DMARC do provedor SMTP escolhido
- [ ] Atualizar as URLs de redirect do OAuth Google e Microsoft para `app.<domínio>`

### 4.4 Backup e restauração

- [ ] Adaptar `docker/backup/` para um serviço cron no Railway: `pg_dump` diário → bucket de backups
- [ ] **Ensaio de restauração em staging:** baixar o dump, restaurar num banco vazio e logar. Um backup que nunca foi restaurado não conta
- [ ] Repetir o ensaio todo mês. Registrar a data no `PLAN.md`

### 4.5 Monitoramento

- [ ] Sentry no `api` e no `web` (trazer o padrão do Alicerce), incluindo falha de auditoria
- [ ] Monitor externo de uptime batendo em `/health` a cada minuto, com alerta no celular

### 4.6 Regras de deploy

- [ ] Fluxo: PR → CI verde → merge → deploy automático em `staging` → teste manual → promoção para `production`
- [ ] Migrations em produção são só aditivas. Remover ou renomear coluna leva dois deploys (expandir, depois contrair)
- [ ] Rollback: redeploy da versão anterior pelo Railway. Por isso nenhuma migration pode quebrar a versão anterior do código

### 4.7 Go-live

- [ ] Ensaio completo em staging com dados fictícios de uma instituição, do cadastro ao uso diário
- [ ] Termos de uso e política de privacidade publicados (o sistema trata dados de saúde)
- [ ] Abrir para 1 ou 2 instituições piloto. Acompanhar o Sentry diariamente por 2 semanas antes de ampliar
- [ ] Crescer até 10 instituições, uma por vez

**Critério de saída (go-live):** staging idêntico a produção, restauração de backup ensaiada, Sentry e uptime ativos, e os testes de vazamento da Parte 3 rodando no CI.

## Parte 5 — Evolução de arquitetura (pós-produção)

Objetivo: tornar o sistema mais rápido e robusto sem parar o uso das instituições. Começa só depois do go-live e anda em ondas pequenas, um módulo por vez. Nenhuma onda se mistura com funcionalidade nova no mesmo PR. A ordem importa: a sessão em cookie é o que destrava o Server Side.

| Onda | O que muda | Pré-requisito ou gatilho |
| --- | --- | --- |
| 5.1 | Sessão via proxy do Next com cookie `httpOnly`. O access token sai do `sessionStorage`. Transplantar `app/api/proxy/[...path]/route.ts` do Alicerce, com deduplicação de refresh | Go-live estável há 2 semanas |
| 5.2 | `api-server.ts` server-only (lê o cookie via `next/headers`) + `DataProvider` como caminho único de escrita | 5.1 |
| 5.3 | Generator `prisma-client` com `moduleFormat = "cjs"`. Remover o script que copia o client para `dist` | Qualquer momento, depois de 5.1 |
| 5.4 | Server Components com fetch real, prova de conceito em `people-segments` | 5.2 |
| 5.5 | Ondas por tamanho: `people-groups` → `programs` → `projects` → `tasks` → `actions` → `deposit` → `pantry` → `people` | 5.4 aprovada em produção |
| 5.6 | Lint de fronteira (`no-restricted-imports`) entre `web-client` e `modules` | Durante 5.5 |
| 5.7 | Testes no frontend: Vitest nos componentes do `web-client` + smoke com Playwright no fluxo de login e em um módulo | Antes de 5.5 chegar nos módulos grandes |
| 5.8 | Redis para rate limit e controle de refresh | Precisar de uma 2ª réplica do `api` |
| 5.9 | Atualizações major (Next, Nest, Prisma) | Uma por vez, sempre via staging |
| 5.10 | Extrair um fork zerado como Alicerce v2 | \~10 instituições usando, com o sistema estável |

Em cada módulo migrado, cuidar da armadilha conhecida: `ColumnDef` com `cell` não atravessa a fronteira Server→Client. Cada módulo precisa do seu próprio `<Modulo>ListView.tsx` com `"use client"`.

## Processo de trabalho

Um processo enxuto e repetível vale mais que velocidade: cada item do checklist é um commit pequeno, verificado e reversível.

- **Branches:** `main` sempre deployável. Um branch por item (`p1/remove-logs`, `p3/tenant-leak-tests`), com PR para a `main`. A partir da Parte 2, o CI é obrigatório no PR
- **Commits:** Conventional Commits (`chore:`, `fix:`, `feat:`, `refactor:`, `test:`). Formatação em massa sempre num commit isolado
- **Checkpoint rápido** (todo commit): `tsc --noEmit` no app que mudou
- **Checkpoint completo** (fim de cada bloco): `tsc` + `test` + `build` nos dois apps + teste manual de login e do módulo afetado
- **`PLAN.md`:** só o que está em andamento, com caixas marcadas e a evidência (comando + resultado)
- **`docs/backlog.md`:** tudo que foi adiado, sempre com o gatilho que o traz de volta. Nada é adiado sem gatilho
- **Tags:** uma tag ao fechar cada parte (`v0.1-limpo`, `v0.2-verde`, `v0.3-seguro`, `v1.0-producao`)
- **Regra anti-vai-e-volta:** uma ideia nova de arquitetura durante as Partes 1 a 4 vai para o `backlog.md` e não para o código

## Primeiros passos ao clonar

O primeiro dia é só para medir: marcar o ponto de retorno, rodar tudo e registrar os números, sem corrigir nada ainda.

```bash
# 1. clonar (troque pelo novo nome do repositório)
git clone https://github.com/TerceiroGestor/<novo-nome>.git terceiro-gestor
cd terceiro-gestor

# 2. ponto de retorno
git tag v0-baseline && git push origin v0-baseline
git switch -c p1/baseline

# 3. backend
cd backend
npm ci
npx prisma generate
npx tsc --noEmit -p tsconfig.build.json
npm test
npx eslint "src/**/*.ts" | tail -3

# 4. frontend
cd ../frontend
npm ci
npx tsc --noEmit
npx eslint src
npm run build
```

Depois disso:

1. Criar o `PLAN.md` com a Parte 1 e colar os resultados de cada comando como linha de base
2. Subir o Postgres local (`docker/compose.dev.yml`), rodar o seed e fazer o teste manual: login e os 9 módulos
3. Começar os itens de limpeza da Parte 1, um commit por item

### Perguntas em aberto

- [ ] Já existe alguma instituição com dados reais em algum banco? Se sim, a migration de base (3.1) precisa ser marcada como aplicada nele, e os arquivos em disco entram no script de migração para o R2 (4.2)
- [ ] Qual é o domínio de produção (`app.` e `api.`)?
- [ ] Qual será o provedor de e-mail transacional (Resend, Brevo, Amazon SES ou outro)?
- [ ] Vão continuar o login com Google e Microsoft no go-live, ou entram depois?

Fonte consultada: [discussão no Railway Station sobre Cloudflare Full e Full (strict)](https://station.railway.com/questions/cloudflare-ssl-full-strict-does-not-ab35244a).
