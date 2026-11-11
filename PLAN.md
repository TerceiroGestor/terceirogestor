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
- **Parte 2 — Pequenas correções:** parcialmente feita.
  - [x] helmet (auditoria #8) · [x] validação de env vars no boot
    (auditoria #9) · [x] `GET /health` (auditoria #10) · [x]
    dependências patch/minor + `npm audit` (auditoria #15) · [x] 22
    suítes/91 testes do backend passando
  - [ ] CI no GitHub Actions — não existe (`.github/` só tem template
    de issue)
  - [ ] `frontend/middleware.ts` → `frontend/src/proxy.ts` (nome do
    Next 16) — ainda na raiz, não confirmado se roda
  - [ ] Separar `lint` (hoje roda com `--fix`) de um `lint:fix` —
    `backend/package.json:29` ainda é só `--fix`
  - [ ] Lint do backend medido (469 problemas) mas não reduzido — meta
    é não aumentar, registrado em `docs/backlog.md`
- **Parte 3 — Correções severas:** a maior parte feita via
  `docs/auditoria-riscos.md` (itens 1–2 → 3.2/3.5, item 3 → 3.1, itens
  4 → 3.4, 5–6 → 3.3, 7 → 3.4). Itens do checklist original da Parte 3
  que ficaram de fora do critério de aceite da auditoria e **continuam
  abertos**:
  - [ ] 3.1 — separar seed de produção (permissões/papéis) do seed de
    dados fictícios (mencionado como pendente no item 3 da auditoria)
  - [ ] 3.2 — reorganizar a chave física do arquivo para
    `tenantId/modulo/uuid.ext` (adiado de propósito no item 1 da
    auditoria, pra não arriscar URL já salva no banco)
  - [ ] 3.2 — validar o tipo real do arquivo pelos bytes (magic bytes),
    não só pelo mime declarado — não encontrado no backend
  - [ ] 3.4 — confirmar rate limit e expiração do token de reset nos 4
    fluxos (decorators já existem em `registration.controller.ts`, mas
    não há uma confirmação dedicada registrada)
  - [ ] 3.5 — mover `PII_MASTER_KEY`/`TOTP_ENCRYPTION_KEY` para um
    gerenciador de senhas fora do Railway (ação operacional, não é
    código)
- **Parte 4 — Produção:** só preparação, nada do Railway/Cloudflare/R2
  real existe ainda. `GET /health` (pré-requisito 4.1) e a interface do
  `StorageService` (pré-requisito 4.2) já estão prontos; o resto depende
  do projeto Railway e do bucket R2 existirem.
- **Achados novos da auditoria (13, 14, 16):** abertos, baixo risco,
  todos com gatilho em `docs/backlog.md`.

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

```
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
