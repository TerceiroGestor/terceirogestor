# Terceiro Gestor — Roteiro de Evolução Técnica

Varredura completa feita em 2026-11-11, depois de fechar as Partes 2 e 3
do plano principal. Objetivo: levantar, com evidência concreta (arquivo,
número, comando), o que falta ajustar em estrutura, segurança, navegação,
módulos, produção (Railway/Cloudflare/R2) e otimização — incluindo um
plano detalhado de migração do frontend para Server-Side Rendering.

**Como este documento se relaciona com os outros:**

- `docs/Terceiro Gestor — Plano de Revisão e Produção.md` é o plano
  principal, com a Parte 4 (produção) e a Parte 5 (evolução de
  arquitetura) em alto nível. Este documento **detalha e atualiza** essas
  duas partes com o estado real do código hoje — não as substitui.
- `PLAN.md` continua sendo só o que está em andamento agora.
- `docs/backlog.md` continua sendo itens adiados com gatilho.
- `docs/auditoria-riscos.md` é a auditoria de segurança já majoritariamente
  fechada (Partes 2 e 3).
- Nada aqui é para executar sem avisar antes — é um mapa para decidir
  prioridade, não uma lista de tarefas já aprovadas.

---

## 1. Estrutura do repositório — limpeza e inconsistências de documentação

### 1.1 `docs/refactor/` é um plano morto, para um destino que não existe mais

`docs/refactor/` (`00-cloud-storage-overview.md`, `01-files-controller-refactor.md`,
`02-data-migration.md`, `03-testing.md`, `04-deployment.md`, mais
`README.md`/`INDEX.md`/`refactor.md`) é um plano inteiro de abril/2026 para
migrar uploads para **Google Cloud Storage** — o destino que foi
abandonado quando o projeto migrou para Railway + Cloudflare + R2 (decisão
registrada em `docs/Terceiro Gestor — Plano de Revisão e Produção.md`,
5/nov/2026). `docs/gcp/` já foi movido para `docs/historico/` na Parte 1,
mas este outro diretório de documentação GCP ficou de fora da limpeza.

Confirmado que não há mais nenhuma dependência de código real: `grep` por
`GCP_|GCS_|@google-cloud` em `backend/src`, `frontend/src` e nos dois
`package.json` não encontra nada.

**Sugestão:** mover `docs/refactor/` para `docs/historico/` (mesmo
tratamento de `docs/gcp/`). Baixo risco, puramente documentação.

### 1.2 `.env.example` e `.env.production.example` ainda têm um bloco GCP inteiro

Os dois arquivos têm uma seção `GOOGLE CLOUD PLATFORM` com `GCP_PROJECT_ID`,
`GCP_BUCKET_NAME`, `GCS_SIGNED_URL_TTL_*`, `CLOUD_SQL_CONNECTION_NAME`,
`GOOGLE_APPLICATION_CREDENTIALS` — nenhuma dessas variáveis é lida por
nenhum código hoje (confirmado pelo mesmo grep acima).
`.env.production.example` inteiro, na verdade, ainda é um guia de deploy
para **Cloud Run**, com instruções de `gcloud run deploy`, Secret Manager
etc. — nada disso corresponde ao destino real (Railway).

Isso já está no checklist original da Parte 4.1 ("Apagar as variáveis
`GCP_*`/`GCS_*` do código e dos `.env*.example`") — reforçando aqui porque
é um ponto de confusão real para qualquer pessoa nova lendo o repositório.

**Sugestão:** reescrever `.env.production.example` do zero com o alvo
real (Railway: `DATABASE_URL` via referência de variável, sem
`RUN_DB_PRESTART` porque migrate vira pre-deploy command — ver 3.1 abaixo
—, mais as variáveis do R2 quando o driver existir). Fazer isso **junto**
com a Parte 4.1 do plano principal, não antes (evita reescrever duas
vezes).

### 1.3 `AGENTS.md` documenta um padrão de nome que nunca foi seguido

A regra diz: "cada módulo tem seu próprio `<Modulo>ListView.tsx` com
`"use client"`". Na prática, **nenhum arquivo com esse nome existe** — o
padrão real é `<modulo>-list-module-client-page.tsx` (kebab-case), ex.:
`modules/people/features/list/ui/people-list-module-client-page.tsx`,
`modules/actions/features/list/ui/actions-list-module-client-page.tsx`.

A **intenção** da regra está sendo seguida com rigor: todos os 45
arquivos do projeto que usam `ColumnDef` têm `"use client"` no topo, sem
exceção — zero vazamento de `cell` de Server para Client. O problema é só
o nome documentado, que nunca correspondeu ao nome real.

**Sugestão:** corrigir a frase no `AGENTS.md` para descrever o padrão real
(`<modulo>-list-module-client-page.tsx`), sem mudar nenhum código.

### 1.4 A regra "`web-client/` não importa de `modules/`" está sendo violada de forma sistemática — e parece ser por design

Contagem real: **93 linhas de import de `@/modules` em 32 arquivos
distintos** dentro de `web-client/`. Não é vazamento pontual — está
concentrado em duas pastas que existem exatamente para isso:

- `web-client/data-provider/rest/*.ts` (15 arquivos — `actions.ts`,
  `people.ts`, `tasks.ts`, `provider.ts`, etc.): importam as funções de
  API de cada módulo para montar o provider único do `ScreenHost`.
- `web-client/registry/actions/*.tsx` e `registry/searchViews/*.ts` (14
  arquivos): importam contratos/config/client-pages dos módulos para
  registrar as telas.

Essas duas pastas são literalmente a camada de integração entre o motor
genérico (`web-client/`) e os módulos — por definição, alguém precisa
"conhecer" os dois lados. A regra como está escrita hoje no `AGENTS.md`
("`web-client/` não importa de `modules/`") é verdadeira para quase todo
o resto de `web-client/` (control-panel, detail, forms, views, ui — zero
imports de módulos ali), mas falsa para `registry/` e `data-provider/rest/`.

**Sugestão:** não é uma violação para corrigir às pressas — é a regra que
está incompleta. Reescrever como: "`web-client/` não importa de
`modules/`, **exceto** `web-client/registry/` e
`web-client/data-provider/rest/`, que existem para isso." Isso também
importa para a migração de SSR (seção 5): essa camada de wiring vai
precisar ser repensada quando os módulos passarem a buscar dados no
servidor.

### 1.5 `people-groups` é um módulo fantasma

`modules/people-groups` tem só **3 arquivos** (`api/index.ts`,
`api/people-groups.ts`, `api/types.ts`) — sem `config/`, `features/`,
`shared/`, sem `manifest.ts`. Não está registrado em `modules/registry.ts`
(que lista `coreManifest, peopleManifest, peopleSegmentsManifest,
programsManifest, projectsManifest, actionsManifest, pantryManifest,
depositManifest, tasksManifest` — sem `peopleGroupsManifest`). As rotas
existem (`app/[tenant]/(modules)/people-groups/{page,new/page,[id]/page}.tsx`),
mas **todas apontam para telas de `people-segments`** (`actionId:
"people-segments.list"`, `"people-segments.create"`,
`"people-segments.detail"`). Hoje `/people-groups` é, na prática, um
alias de `/people-segments`, sem UI própria.

`docs/historico/canonical-business-structure.md` (arquivado em
2026-11-15 — descrevia `ProjectGroup` como conceito ativo, eliminado pela
Fase R1 do redesenho de grupos; a parte sobre `PeopleGroup` continua
factualmente certa) já modelava `PeopleGroup` como conceito de negócio
real (agrupamento institucional, finalidades `PUBLICO`/`EQUIPE`) e o
colocava **primeiro** na "Ordem de canonização" — ou seja, existe uma
intenção documentada de construí-lo de verdade, que nunca foi executada.

**Decisão pendente, não técnica:** construir `people-groups` como módulo
real (com manifest, UI própria, seguindo o padrão canônico de
`docs/canonical-web-client-standard.md`), ou assumir que foi fundido com
`people-segments` de propósito e documentar isso, removendo a rota
fantasma. Enquanto essa decisão não for tomada, não incluir
`people-groups` em nenhuma onda de migração SSR (seção 5) — ele não tem
UI para migrar.

### 1.6 Rota legada `/group` → redirect para `/projects/groups`

`app/[tenant]/(modules)/group/*` existe só para redirecionar para a
feature real (grupos de participantes de projeto, `ProjectGroup`). Código
morto de baixo risco — candidato a remover depois de confirmar (grep/
analytics) que nada mais linka para `/group`.

### 1.7 `docs/backlog.md` tem uma referência a um arquivo que não existe mais

A entrada "Testes e-2-e / CI local" cita `frontend/e2e/smoke.spec.ts` —
esse arquivo não existe no repositório hoje (`frontend/e2e/` nem existe
como pasta), e não há nenhum teste no frontend (ver seção 5.7). É uma
entrada órfã, provavelmente de uma versão anterior do projeto.

**Sugestão:** remover essa entrada do backlog, ou reescrevê-la como "não
existe teste de frontend hoje" (que já é coberto pela seção 5.7 deste
documento / item 5.7 do plano principal).

---

## 2. Segurança — o que passou da Parte 3 para esta varredura

A Parte 3 do plano principal (tenant, auth, arquivos, rate limit) está
fechada (ver `PLAN.md`). Os itens abaixo são achados **novos**, fora do
escopo da auditoria original.

### 2.1 O frontend não tem nenhum header de segurança HTTP

O item 8 da auditoria (`helmet`) só cobriu o **backend**
(`backend/src/main.ts`). O `next.config.ts` do frontend só define
`Cache-Control` para `/sw.js` e `/manifest.webmanifest` — nenhum
`Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`,
`Strict-Transport-Security` ou `X-Content-Type-Options`. É o frontend
que serve a página que o usuário realmente abre; hoje ela não tem
nenhuma dessas proteções (clickjacking, MIME sniffing, etc.).

**Sugestão:** adicionar um bloco de headers em `next.config.ts`
equivalente ao que o `helmet` já faz no backend. CSP precisa de cuidado
— o Next usa alguns scripts/estilos inline; vale medir com
`Content-Security-Policy-Report-Only` antes de aplicar de verdade.

### 2.2 `HEALTHCHECK` do Dockerfile do backend não bate no `/health` real

`backend/Dockerfile` define `HEALTHCHECK ... CMD ... path: '/'`. O
endpoint `GET /health` (item 10 da auditoria) já existe e testa a conexão
com o banco (`SELECT 1`) — `/` só confirma que o processo Node está de
pé, não que o Postgres está acessível. Um banco fora do ar hoje não
derruba o healthcheck do container.

**Sugestão:** trocar o `path` do `HEALTHCHECK` para `/health` (e o mesmo
endpoint já serve como healthcheck do Railway, item 3.1 abaixo).

### 2.3 Bug real no script de restauração de uploads

`docker/backup/restore-uploads.sh` usa `${MYSQL_DATABASE}` para montar o
nome do arquivo de backup:

```sh
file="${BACKUP_DIR}/${MYSQL_DATABASE}-uploads-latest.tar.gz"
```

Esse projeto usa Postgres (`POSTGRES_DB`) — `MYSQL_DATABASE` nunca é
definida em lugar nenhum. É resíduo literal de um template MySQL anterior
(o `docker/backup/backup.sh`, que *gera* o arquivo, já usa `POSTGRES_DB`
corretamente). Resultado: `restore-uploads.sh --latest` (ou sem argumento)
monta um caminho com a variável vazia e não encontra o arquivo real —
falha exatamente na hora de um desastre de verdade, quando a restauração
é testada por último (ou nunca).

**Sugestão:** trocar `MYSQL_DATABASE` por `POSTGRES_DB` em
`restore-uploads.sh`. Baixo risco, bug isolado — mas só vai ser pego por
quem já estiver tentando restaurar backup, o peor momento para descobrir.
Vale corrigir antes do primeiro ensaio de restauração (Parte 4.4).

### 2.4 Sem configuração de pool de conexões do Postgres

Nenhum lugar do projeto define `connection_limit`/`pool_timeout` na
`DATABASE_URL`, nem usa PgBouncer. O Prisma calcula o tamanho do pool por
padrão como `num_cpus * 2 + 1` — em produção, com 1 réplica da API (regra
atual, até mover rate-limit/refresh para Redis — Parte 5.8), isso
provavelmente é suficiente, mas o Postgres do Railway tem limite de
conexões simultâneas por plano. Vale medir, não assumir.

**Sugestão:** ao configurar o Postgres do Railway (3.1), confirmar o
limite de conexões do plano e, se necessário, definir
`connection_limit`/`pool_timeout` explícitos na `DATABASE_URL`.

### 2.5 LGPD: falta o lado de direitos do titular, não só auditoria

A auditoria já garante que acesso a documento de saúde gera log (item 2).
O que não existe ainda, e o sistema vai precisar antes de abrir para
instituições reais com dados de beneficiários (CPF, RG, NIS, condições de
saúde):

- Exportação dos dados de uma pessoa (direito de acesso).
- Anonimização/exclusão de uma pessoa a pedido (direito ao esquecimento) —
  hoje não há nenhum fluxo de "excluir pessoa" que vá alem do soft/hard
  delete do registro operacional.
- Política de retenção de dados (por quanto tempo manter uma pessoa
  inativa, um log de auditoria, um backup).

Isso **não bloqueia** o go-live com instituições piloto pequenas, mas é
um gap real de conformidade que cresce junto com o número de
instituições. O plano principal (4.7) já cita "termos de uso e política
de privacidade publicados" — isso é sobre a política em si; os pontos
acima são sobre os *mecanismos* que a política precisa poder cumprir.

**Sugestão:** registrar como item do backlog com gatilho "antes de passar
de ~3 instituições reais, ou se alguma pedir exportação/exclusão de
dados".

### 2.6 Prisma 8 já está disponível (major)

`npx prisma migrate status` mostra `Update available 7.10.1 -> 8.0.0-rc.33`.
Major update — proibido antes da Parte 5 pela regra do projeto
("Atualizações major... depois do go-live"). Só para acompanhar: quando a
versão estável (não `-rc`) saír, entra na lista de majors da Parte 5.9.

---

## 3. Produção — Railway + Cloudflare + R2 (detalhando a Parte 4)

Nada do Railway/Cloudflare/R2 existe ainda — o que já está pronto é só
preparação de código. Mapa do que falta, item a item do plano principal,
com o que já está feito:

### 3.1 Railway

| Pré-requisito | Status |
| --- | --- |
| Dockerfiles respeitam `$PORT` | ✅ já prontos (`backend/Dockerfile`, `frontend/Dockerfile`) |
| `GET /health` para healthcheck | ✅ existe, mas o `HEALTHCHECK` do próprio Dockerfile ainda aponta pra `/` (ver 2.2) |
| `prisma migrate deploy` fora do entrypoint | ❌ ainda dentro de `docker-entrypoint.sh` (`RUN_DB_PRESTART`) — mover para pre-deploy command do Railway é um passo da configuração do próprio Railway, não do código |
| Variáveis via referência (`${{Postgres.DATABASE_URL}}`) | ❌ não aplicável ainda, projeto não existe |
| Apagar `GCP_*`/`GCS_*` dos `.env*.example` | ❌ pendente (ver 1.2) |
| Node 22 fixado no build | ⚠️ `engines` já diz `>=22 <23` nos dois `package.json`, Dockerfiles já usam `node:22-alpine` — falta só alinhar o Node **local** de desenvolvimento (achado 16 da auditoria, v26 atualmente), que é cosmético |

Zero bloqueadores de código para criar o projeto Railway — o que falta é
a própria criação (staging + production, 3 serviços cada: `web`, `api`,
`Postgres`) e a config operacional (variáveis, domínio customizado).

### 3.2 Cloudflare R2

`StorageService` (`backend/src/core/files/storage.service.ts`) já
abstrai `put`/`delete`/`getSignedUrl`/`verifySignature` atrás de uma
interface `StorageDriver`; a chave física já é `categoria/tenantId/arquivo`
(reorganizado nesta sessão, item 3.2). Isso significa que o trabalho que
falta para o driver `r2` é **só** implementar `StorageDriver` com
`@aws-sdk/client-s3` — nenhuma mudança de chamador, URL ou chave física
será necessária de novo.

Falta: criar os buckets (`tg-<ambiente>-arquivos`, `tg-<ambiente>-backups`),
o token de API limitado, e a classe `R2StorageDriver`. Depois, migrar os
arquivos que existirem em disco com um script análogo ao
`migrate-upload-keys-to-tenant-scoped.js` desta sessão (mesma lógica:
idempotente, não quebra nada que já funciona).

### 3.3 Cloudflare DNS

Nada feito — depende de domínio real, que ainda não existe
("Qual é o domínio de produção?" continua uma pergunta aberta no plano
principal). Sem ação de código possível agora.

### 3.4 Backup e restauração

`docker/backup/` já tem `backup.sh` (pg_dump + tar dos uploads, com
rotação por `BACKUP_KEEP_DAYS`), `restore-db.sh`, `restore-uploads.sh` e
um `entrypoint.sh` que roda isso num cron dentro do próprio container
(`BACKUP_SCHEDULE`, padrão `0 3 * * *`). Isso é mais do que o plano
principal supõe ("adaptar docker/backup/") — já existe uma versão
funcional para **disco local**. O que falta:

- Corrigir o bug do `MYSQL_DATABASE` (2.3) antes de confiar nele.
- Apontar para o bucket de backups do R2 em vez do disco local, quando o
  R2 existir (3.2).
- Adaptar para rodar como serviço cron do Railway (ou manter como
  container próprio, se o Railway suportar bem esse padrão).
- **O ensaio de restauração nunca aconteceu** — nem localmente. Vale
  fazer isso **antes** de ir para R2, só para validar a lógica de
  pg_dump/restore em si, já que o bug do passo anterior mostra que nunca
  foi testado de ponta a ponta.

### 3.5 Monitoramento

Zero Sentry (confirmado: nenhuma referência a "sentry" em nenhum dos dois
apps). Zero monitor de uptime externo. `GET /health` já existe e está
pronto para ser consumido por um — é só configurar algo externo (ex.:
UptimeRobot, Better Uptime) batendo nele a cada minuto.

### 3.6 Fluxo de deploy e go-live (4.6/4.7 do plano principal)

Sem Railway/domínio, não há o que configurar ainda. Preparação de código
(CI, `/health`, `StorageService`, migrations versionadas) já está pronta
para quando esses dois existirem.

---

## 4. Navegação — mapa atual

Árvore de rotas sob `app/[tenant]/`: `login`, `forgot-password`,
`reset-password` (públicas), e um grupo `(modules)/` com todas as telas
autenticadas — `actions`, `admin/{audit-logs,permissions,roles,tenant,users}`,
`auth/profile`, `dashboard`, `deposit/{donors,entries,exits,history,items,stock}`,
`pantry/{...espelha deposit...}`, `people` (com a sub-árvore mais rica do
sistema: `[id]/{benefits,detentions,edit,education,family-relations,
financial/{expenses,incomes,transfers},health-conditions,medications,tree}`),
`people-groups` (fantasma, ver 1.5), `people-segments`, `programs`,
`projects` (+ `[id]/{actions,enrollments,groups}`, `groups`), `settings`,
`tasks`. Fora do grupo: `group` (legado, ver 1.6).

`src/proxy.ts` (ex-`middleware.ts`, convenção do Next 16 — migrado nesta
sessão) resolve **só** o slug do tenant: reescreve prefixos legados
(`/dashboard` → `/{slug}/dashboard`, usando um cookie
`terceirogestor_tenant`) e normaliza `/t/:slug` e `/{slug}` nu para
`/{slug}/dashboard`. Ele **não participa de autenticação** — isso
acontece inteiramente no cliente, via `auth-context.tsx` (ver seção 5.1).
Isso é relevante para a migração de SSR: o `proxy.ts` é exatamente onde a
leitura do cookie de sessão (quando existir, Parte 5.1) vai precisar
entrar, no mesmo lugar que já resolve o tenant.

Não há paginação incremental nem cache de rota hoje — toda busca de dados
usa `cache: "no-store"` (confirmado em `src/lib/api.ts`), então não há
nada de cache para "quebrar" numa migração futura, mas também nenhum
ganho de performance sendo aproveitado hoje.

---

## 5. Otimização — plano de migração para Server-Side Rendering

Isto detalha a Parte 5.1–5.5 do plano principal com números reais do
código de hoje. **Pré-requisito do próprio plano principal
continua valendo: só começa depois do go-live estável por ~2 semanas.**
Nada disto é para fazer agora — é o roteiro para quando chegar a hora.

### 5.1 Diagnóstico atual (factual, varredura de 2026-11-11)

- **647 arquivos** `.ts`/`.tsx` em `frontend/src`; **353 (54,6%)** têm
  `"use client"`.
- Em `src/app` (App Router), só **9 de 110 arquivos (8,2%)** têm
  `"use client"` — mas isso é ilusório: quase toda `page.tsx` é um
  wrapper de 3 linhas que renderiza `<ScreenHost actionId="..." />`, e o
  `ScreenHost` (`web-client/screen/ScreenHost.tsx`) já é `"use client"`.
  Ou seja, o App Router hoje é só um roteador fino por cima de um app
  inteiramente client-side.
- **Existe exatamente 1 fetch real no servidor em todo o projeto**:
  `app/[tenant]/layout.tsx#generateMetadata()` chama
  `fetchTenantPreviewBySlug()` (`src/lib/server/tenant-preview.ts`) só
  para preencher `<title>`/favicon antes do primeiro paint — nenhum
  dado de página vem daí.
- Token de acesso em `sessionStorage` (`src/features/auth/auth-context.tsx`),
  nunca em cookie. **Não existe proxy de sessão via cookie** no estilo do
  Alicerce (confirmado: nenhum diretório `app/api/`, nenhuma referência a
  padrão de session-proxy).
- Todo fetch usa `cache: "no-store"` (`src/lib/api.ts`) — zero
  aproveitamento de cache do Next.
- Camada de dados hoje: `modules/<modulo>/api/*.ts` (funções REST) →
  `web-client/data-provider/rest/<modulo>.ts` → `provider.ts` único →
  `ScreenHost`/registry. Tudo client-side, tudo por `lib/api.ts`.

**Conclusão prática:** o app paga o custo de renderização dinâmica no
servidor a cada navegação (toda rota aparece como `ƒ` no build do Next,
nunca `○` estático) sem colher nenhum benefício disso — porque nada é
realmente buscado no servidor. A migração para SSR não é sobre "ligar"
algo que já existe parcialmente; é construir do zero a capacidade de
buscar dados no servidor com autenticação, módulo por módulo.

### 5.2 Por que a sessão em cookie vem primeiro (Parte 5.1 do plano)

Um Server Component não tem acesso a `sessionStorage` (é só client-side).
Sem um jeito do servidor saber quem é o usuário, nenhum Server Component
consegue buscar dado autenticado — por isso o plano principal já ordena
a sessão via cookie **antes** de qualquer Server Component real (5.1
antes de 5.4). Essa ordem está certa e não muda com esta varredura.

O trabalho de 5.1 (transplantar do Alicerce): um proxy de sessão
(`app/api/proxy/[...path]/route.ts` ou equivalente) que guarda o
`access_token`/`refresh_token` num cookie `httpOnly`, com deduplicação de
refresh concorrente — e trocar `auth-context.tsx`/`lib/api.ts` para não
depender mais de `sessionStorage`. É uma mudança grande e atravessa o
app inteiro (login, logout, toda chamada autenticada) — por isso merece
ser uma onda isolada, testada a fundo (login, refresh, logout, timeout de
sessão) antes de tocar em qualquer módulo.

### 5.3 Prova de conceito (Parte 5.4) — qual módulo escolher

O plano principal já sugere `people-segments` como POC. A varredura
confirma que é a escolha certa:

- **Não pode ser `people-groups`** — é um módulo fantasma (1.5), sem UI
  própria; migrar "nada" não prova nada sobre o padrão.
- `people-segments` tem **11 arquivos**, é o segundo módulo mais simples
  depois do fantasma, e já tem a estrutura completa (`api/`, `config/`,
  `features/{detail,list}`, `shared/domain`) — representativo do padrão
  real dos outros 7 módulos de verdade, sem a complexidade de `people`
  (sub-recursos, 11 rotas dinâmicas).

### 5.4 Ondas por tamanho (Parte 5.5), com números reais

| Ordem | Módulo | Arquivos (`modules/<m>`) | Observação |
| --- | --- | --- | --- |
| — | `people-groups` | 3 | **Resolver antes** (1.5) — construir de verdade ou matar a rota fantasma. Não entra na escala de migração enquanto não tiver UI. |
| 1 (POC) | `people-segments` | 11 | Prova de conceito, 5.4 |
| 2 | `tasks` | 12 | Sem `api/` próprio hoje (usa `shared/domain` + `data-provider/rest/tasks.ts`) — primeira migração vai ter que decidir se cria um `api/` server-only aqui |
| 2 | `programs` | 12 | Estrutura padrão, sem surpresas |
| 4 | `actions` | 24 | |
| 5 | `projects` | 32 | Tem sub-rotas (`[id]/{actions,enrollments,groups}`) — primeiro módulo com sub-recursos de verdade |
| 6 | `deposit` | 36 | "Gêmeo" estrutural de `pantry` — migrar os dois em sequência próxima, reaproveitando o aprendizado |
| 6 | `pantry` | 36 | Idêntico em estrutura a `deposit` |
| 8 (último) | `people` | 107 | De longe o mais complexo: 11 sub-recursos sob `[id]/` (saúde, medicação, financeiro, família, educação...). Só migrar depois de rodar o padrão em todos os outros. |

`modules/core` (admin, auth, dashboard, profile, registration, settings —
49 arquivos) é infraestrutura de plataforma, não um módulo de negócio
migrável da mesma forma — tratar separado, provavelmente junto com a
migração de autenticação (5.2) já que `auth`/`profile` vivem ali.

### 5.5 O que cada onda precisa resolver, além de "mover o fetch pro servidor"

- **A camada de wiring (`web-client/registry/` e
  `web-client/data-provider/rest/`) vai precisar ser repensada.** Hoje
  ela importa das funções de API client-side de cada módulo (1.4) — num
  mundo com Server Components, o módulo migrado precisa de uma função
  de busca server-only (ex.: um `api-server.ts` por módulo, lendo o
  cookie via `next/headers`, como já cita 5.2 do plano principal), e o
  `ScreenHost`/registry atual (inteiramente client-side) não vai
  conseguir chamar isso diretamente — alguém vai ter que decidir se o
  registry ganha uma variante server, ou se o módulo migrado sai do
  `ScreenHost` genérico e ganha página própria.
- **`ColumnDef`/`cell`:** já é seguido corretamente em todo o projeto
  hoje (45 arquivos, 100% com `"use client"`) — não é dívida nova, só
  continuar seguindo o padrão ao criar o Server Component por cima.
- **Lint de fronteira (5.6)** só faz sentido depois de 1.4 estar
  resolvido (a regra real precisa estar clara antes de automatizá-la).

### 5.6 Testes de frontend (Parte 5.7) — ponto de partida real

Hoje: **zero testes automatizados no frontend.** Não há `vitest`/`jest`
nem Playwright instalado, nenhum arquivo `.test.ts(x)`/`.spec.ts(x)`, e
nenhum script `test` no `package.json`. (A entrada do backlog sobre um
`frontend/e2e/smoke.spec.ts` instável está desatualizada — esse arquivo
não existe mais, ver 1.7.)

Isso muda a ordem prática: "testes antes dos módulos grandes" (5.7) não é
um reforço — é a primeira vez que o frontend ganha qualquer teste. Vale
nascer já testando o padrão novo (o Server Component + o client wrapper
que ele renderiza), não o app antigo que vai ser substituído.

### 5.7 Depois das ondas (Parte 5.8–5.10)

Redis (rate-limit/refresh) só quando precisar de 2ª réplica da API — sem
mudança nenhuma até lá. Atualizações major (Next, Prisma — já com um RC
disponível, ver 2.6) ficam para depois do go-live, uma por vez. Extrair
um fork como Alicerce v2 é decisão de negócio (~10 instituições), não
técnica — fora do escopo deste documento.

---

## 6. Priorização sugerida

**Antes do go-live (baixo risco, baixo esforço, vale fazer já):**

- [ ] 2.2 — `HEALTHCHECK` do Dockerfile do backend para `/health`
- [ ] 2.3 — corrigir `MYSQL_DATABASE` → `POSTGRES_DB` em `restore-uploads.sh`
- [ ] 1.1 — mover `docs/refactor/` para `docs/historico/`
- [ ] 1.3 — corrigir o nome do padrão no `AGENTS.md`
- [ ] 1.7 — limpar a entrada órfã do backlog sobre `smoke.spec.ts`
- [ ] 2.1 — headers de segurança no frontend (`next.config.ts`)
- [ ] 3.4 — ensaio de restauração de backup (local, mesmo antes do R2)

**Junto com a Parte 4 do plano principal (quando o Railway/domínio existirem):**

- 1.2 — reescrever `.env.production.example` para o alvo real
- 2.4 — confirmar/configurar pool de conexões do Postgres
- 3.1 a 3.6 completos

**Decisão de produto, não técnica, antes de qualquer código:**

- 1.5 — o que fazer com `people-groups`
- 2.5 — mecanismos de direito do titular (LGPD), com gatilho por volume de instituições

**Só depois do go-live estável (Parte 5, nesta ordem):**

1. Sessão via cookie (5.2 acima)
2. POC em `people-segments` (5.3)
3. Ondas por tamanho: `tasks`/`programs` → `actions` → `projects` →
   `deposit`/`pantry` → `people` (5.4)
4. Testes de frontend nascem com o padrão novo (5.6)

---

## 7. Como manter este documento vivo

Revisitar depois de cada Parte fechada do plano principal, ou quando um
achado aqui for resolvido — marcar o checkbox na seção 6 e anotar a
evidência (mesmo padrão do `PLAN.md`). Se um item daqui virar trabalho
em andamento, ele se move para `PLAN.md`; se for adiado, ganha uma linha
em `docs/backlog.md` com gatilho — este documento não acumula os dois.
