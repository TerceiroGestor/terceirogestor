# Backlog

Tudo que foi adiado, sempre com o gatilho que o traz de volta. Nada é
adiado sem gatilho. Formato do Alicerce.

## Infraestrutura / repositório

- **Node local é v26.1.0**, fora da faixa `>=22 <23` dos dois
  `package.json` (`engines`). O frontend já avisa com `EBADENGINE` no
  `npm ci`. Tudo funciona nesta máquina mesmo assim, mas não é a versão
  que vai rodar no Railway.
  **Resolvido em 2026-11-13 (lado do build):** `backend/Dockerfile` e
  `frontend/Dockerfile` já usam `node:22-alpine` em todos os estágios,
  `.github/workflows/ci.yml` já roda com `node-version: "22"` nos dois
  jobs, e existe `.nvmrc` (`22`) em `backend/` e `frontend/` — nada
  precisou mudar, já estava certo. **Decisão do usuário:** não alinhar
  a máquina de desenvolvimento local agora (fica v26.1.0); revisitar
  por conta própria quando quiser, sem gatilho — não bloqueia nada.

- **`TRUST_PROXY_HOPS` está em 0 (nenhum proxy confiável) em todo
  lugar, inclusive nos `.env.example`.** Isso é seguro — ninguém
  consegue falsificar o IP visto por `rate-limit`/audit log via
  `X-Forwarded-For` —, mas também significa que todo IP registrado vai
  ser o do proxy do Railway, não o do cliente real, até esse valor ser
  ajustado. Confirmado manualmente (login real com `X-Forwarded-For`
  forjado): com `hops=0` o header é ignorado; com `hops=1` é respeitado
  — o mecanismo funciona, só falta saber o valor certo pra topologia
  real.
  **Gatilho:** quando o projeto Railway existir (Parte 4.1) e a
  topologia atrás do Cloudflare estiver decidida (DNS puro ou
  proxied/orange-cloud) — testar em staging com um cliente real e
  ajustar `TRUST_PROXY_HOPS` (provavelmente `1`) nas variáveis do
  Railway. Ver item 11 de `docs/auditoria-riscos.md`.

- **`npm audit` triado em 2026-11-11 (item 15 de `docs/auditoria-riscos.md`)
  — `npm audit fix` sem `--force` resolveu tudo que não exigia major**:
  backend 41 → 29 (as 2 críticas, `handlebars` e `proxy-addr`, foram
  embora); frontend 27 → 7, incluindo um RCE não-autenticado crítico no
  Next.js (16.1.6 → 16.4.6 — mesma major, só precisou de `--force` por o
  `package.json` fixar a versão exata; perguntei antes de aplicar).
  O que sobrou, tudo exigindo major (proibido antes da Parte 5) ou sem
  fix publicado ainda:
  - **Backend:** `nodemailer` (alta, direto, `7.x`→`10.5.0`) — era o único
    desses que roda em produção (envio de e-mail). **Resolvido em
    2026-11-13 por remoção, não upgrade:** `EmailService` trocou SMTP
    genérico (`nodemailer`) pelo SDK oficial do Resend (decisão do
    usuário), então `nodemailer` foi desinstalado — o problema deixou de
    existir em vez de precisar de upgrade. Os que sobram são só
    devDependencies (`jest`→`29.7.0`, na direção errada — bug do
    resolvedor do npm, não uma versão real mais nova —, `@nestjs/cli`→
    `12.0.12`, `ts-jest`→`25.5.1`).
  - **Backend e frontend:** o cluster `typescript-eslint`/
    `@typescript-eslint/*` aparece como "corrigível", mas a versão
    corrigida (`>8.72.2`) só existe como alpha (`8.72.3-alpha.*`) — não
    tem release estável ainda pra instalar.
  **Gatilho:** `jest`/`@nestjs/cli`/`ts-jest` — Parte 5 (majors).
  `typescript-eslint` — rodar `npm audit` de novo depois que uma versão
  estável `>8.72.2` for publicada.

- **O upgrade do `eslint-config-next` pra `16.4.6` (item acima) trouxe
  uma versão mais nova do `eslint-plugin-react-hooks`, com regras novas
  de segurança do React Compiler — e o frontend já tem
  `reactCompiler: true` no `next.config.ts`. `npx eslint src` foi de 0
  pra 213 problemas em 107 arquivos**, todos nessas 4 regras novas
  (nenhuma é erro de digitação nem quebra o build — `tsc`, `next build`
  e um teste manual real com os dois servidores de pé continuam
  passando):
  `react-hooks/set-state-in-effect` (181), `react-hooks/preserve-manual-memoization`
  (27), `react-hooks/refs` (3), `react-hooks/immutability` (2).
  **Gatilho:** Parte 2 (mesmo padrão da dívida de lint do backend: medir,
  não deixar crescer, zerar com calma) — ou antes de qualquer trabalho
  real de adoção do React Compiler, já que são exatamente os padrões que
  o compiler não otimiza/pode quebrar.

## Dívida de lint (backend)

- **469 problemas de lint reais** depois do commit de formatação (medição
  de 2026-11-05): 170 `no-unsafe-assignment`, 133 `no-unsafe-member-access`,
  80 `no-unsafe-return`, 20 `no-unsafe-call`, 17 `no-empty-object-type`, 15
  `no-unnecessary-type-assertion`, 14 `no-unsafe-argument`, 11
  `no-unused-vars`, 7 `no-base-to-string`, 1 `require-await`, 1
  `no-floating-promises`.
  **Gatilho:** Parte 2, item "Lint do backend: medir de novo com o client
  gerado. Corrigir os erros que são bug real." Meta: não aumentar o total
  enquanto não for zerado.

- **`npm run lint` do backend tenta lintar `test/**/*.ts`, mas
  `tsconfig.json` exclui `test` do projeto** (`exclude: [..., "test",
  ...]`). Como o ESLint usa `projectService: true`
  (`eslint.config.mjs:26`), qualquer arquivo em `test/` que não esteja
  em nenhum tsconfig (hoje, os dois specs e2e criados pelo item 6 da
  auditoria: `test/tenant-isolation.e2e-spec.ts`,
  `test/support/tenant-isolation.setup.ts`) falha com "Parsing error:
  ... was not found by the project service" em vez de ser lintado —
  489 → 509 problemas reportados quando o `--fix` foi removido do
  script (2026-11-11) e isso ficou visível por não travar mais
  silenciosamente no fix automático. Achado durante a correção do item
  "separar `lint`/`lint:fix`" da Parte 2; não é regressão dessa
  correção, só ficou visível por ela.
  **Gatilho:** Parte 2, junto da próxima medição de lint do backend —
  decidir entre dar ao `test/` seu próprio tsconfig (como o
  `tsconfig-eslint` de outros projetos Nest) ou tirar `test` do glob do
  script `lint`, já que a cobertura real de `test/` hoje é só via
  `test:e2e`/`tsc` do Jest, não do ESLint.

## Arquivos

- **Excluir um registro de anexo (`deletePersonAttachment`,
  `deleteProgramAttachment`, etc., em pelo menos 7 módulos) só remove a
  linha do banco — o arquivo físico em `uploads/<categoria>/<tenantId>/`
  fica órfão pra sempre.** `StorageService.delete(categoria, tenantId,
  filename)` já existe (item 12 de `docs/auditoria-riscos.md`), só não
  está plugado nesses fluxos ainda; conectar os 7+ módulos é uma
  mudança maior que o escopo desse item.
  **Gatilho:** quando o espaço em disco dos uploads virar problema
  perceptível, ou ao implementar o driver R2 (Parte 4.2) — nesse ponto
  já vale revisar todos os pontos de exclusão de uma vez.

- **`npm run migrate:upload-keys` precisa rodar uma vez em qualquer
  ambiente que já tenha arquivos no formato antigo** (`categoria/arquivo`,
  sem `tenantId`) antes/junto do deploy desta mudança — hoje só existe
  localmente, nenhum ambiente real foi afetado. Depois de rodar uma vez
  num ambiente, rodar de novo não faz nada (idempotente).
  **Gatilho:** antes do primeiro deploy em staging/produção que inclua
  o commit da reorganização da chave física (item 3.2 do `PLAN.md`).

- **`migrate-upload-keys-to-tenant-scoped.js#migrateProjectActionPhotoPaths`
  está quebrado desde 2026-11-14** — a Fase R3 do redesenho de Grupos moveu
  `photoPaths` de `ProjectAction`/`Activity` para `ActionOccurrence`/
  `Meeting`, mas a função continua filtrando `activity.findMany({ where: {
  photoPaths: ... } })`, campo que não existe mais nesse model (vai falhar
  com erro do Prisma se rodar hoje). Achado incidentalmente durante o
  rename da Fase 1.0 (ver
  `docs/terceiro-gestor-plano-de-desenvolvimento-modulos-atendimento-e-projetos.md`),
  não corrigido ali porque exige decidir se a função deve migrar para
  `meeting.photoPaths` ou se já é redundante (o próprio objetivo dela —
  mover chave física pra `categoria/tenantId/arquivo` — já rodou com
  sucesso uma vez, por `ProjectAction.photoPaths`, antes da Fase R3 existir).
  **Gatilho:** o mesmo item acima — antes do próximo ambiente que precisar
  rodar `npm run migrate:upload-keys` com arquivos no formato antigo.

## Segurança / chaves

- **Rotação de `PII_MASTER_KEY` e `TOTP_ENCRYPTION_KEY`.**
  **Gatilho:** primeiro incidente de segurança, ou 12 meses em produção
  (o que vier primeiro).

## Escala

- **Rate limit e controle de refresh em memória do processo `api`.**
  **Gatilho:** precisar de uma 2ª réplica do `api` no Railway (ver Parte
  5.8 do plano — mover para Redis).

## Módulo people — família

- **Patrimônio da família (`HouseholdAsset`/`PersonAsset`) não tem
  nenhuma tela hoje.** O backend já expõe os 10 endpoints
  (`people.controller.ts`: `listHouseholdAssets`/`createHouseholdAsset`/
  `updateHouseholdAsset`/`removeHouseholdAsset`,
  `listPersonAssets`/`listHouseholdPersonAssets`/`createPersonAsset`/
  `updatePersonAsset`/`removePersonAsset`), mas a aba "Financeiro" do
  frontend (`people-financial`) só cobre renda/despesas/transferências —
  nenhum arquivo do módulo referencia `HouseholdAsset`/`PersonAsset`.
  Achado ao revisar por que endereço não tinha onde ser cadastrado
  (2026-11-12): existe uma implementação pronta e funcional
  (`family-assets-report.tsx`, em
  `frontend/src/modules/people/features/family-members/ui/`), só que
  nunca foi ligada a nenhuma rota — mesmo problema do item abaixo.
  **Gatilho:** quando o patrimônio da família for revisado como feature
  (fora do escopo desta sessão, que tratou só endereço).

- **`features/family-members/ui/` tem um cluster de componentes sem
  nenhum importador vivo**, sobras da versão anterior à migração da aba
  "Família" para o padrão canônico (tabela + formulário simples):
  `family-income-report.tsx`, `family-assets-report.tsx` (ver item
  acima), `family-relations-list.tsx` + `family-relations-section.tsx`
  (substituídos por `family-relations-panel.tsx` +
  `family-relation-detail-page.tsx`), `family-summary-sheet.tsx`,
  `family-preview.tsx`, `family-header-preview.tsx`. Mais dois arquivos
  de re-export que também não têm importador:
  `shared/ui/people-family-list.tsx` e
  `shared/ui/people-detail-family-preview.tsx`. `family-household-report.tsx`
  foi a exceção — sua lógica de busca de CEP foi reaproveitada ao tornar
  `person-address-section.tsx` editável (2026-11-12), mas o arquivo
  original continua intocado e sem importador.
  Confirmado por grep: zero ocorrências de cada nome de componente fora
  do próprio arquivo e dos outros arquivos do mesmo cluster morto.
  `tsc`/`npm run build` não pegam isso porque são módulos válidos, só
  não referenciados por nenhuma rota.
  **Gatilho:** ao decidir o destino do patrimônio (item acima) — nesse
  momento, decidir junto se algum desses componentes é reaproveitado
  (ex.: `family-income-report`/`family-summary-sheet` podem servir de
  base) ou se o cluster inteiro é removido.

## Arquitetura (Parte 5)

- **Revisar `ProjectFundingSource` para permitir boa gestão dos recursos
  do projeto.** Decisão do usuário em 2026-11-15, ao aprovar a Fase 1 do
  plano mestre: a modelagem atual (N fontes por projeto, cada uma só com
  `source`/`name`/`notes` livres) resolve o caso de "projeto com
  financiamento misto" descrito na dor de negócio, mas é uma primeira
  passada — não cobre valor orçado/recebido por fonte, prazo de
  prestação de contas, nem template de relatório por financiador (esse
  último já é o escopo da Fase 9 do plano mestre, que pode alimentar
  essa revisão). **Gatilho:** antes de qualquer tela de "prestação de
  contas"/relatório financeiro por fonte, ou quando uma instituição real
  pedir para registrar valores por convênio/edital.

- **Plataforma SCFV completa (Programas/Projetos/Atividades/Encontros +
  Atendimento Técnico + Encaminhamentos + Ocorrências + relatórios
  RMA/SISC).** Plano módulo a módulo, testável, em
  `docs/terceiro-gestor-plano-de-desenvolvimento-modulos-atendimento-e-projetos.md`
  (revisão de 2026-11-15 — plano mestre atual; substitui
  `docs/historico/plano-implementacao-scfv.md`,
  `docs/historico/especificacao-completa-saas-para-ongs-de-scfv.md` e
  `docs/historico/plano-reestruturacao-programas-projetos-atividades.md`,
  todos movidos para `docs/historico/` nesta revisão). 10 fases com
  dependências mapeadas (Fase 1.0 de rename de nomenclatura → Encontro/
  presença/avaliação por participante → presença diária derivada →
  recorrência/agenda anual → Ocorrência → Atendimento → Encaminhamento →
  Caso (agrupador) → relatórios por financiador). Decisões pendentes
  listadas no fim de cada fase do plano, com recomendação própria cada
  uma.
  **Gatilho:** início da Parte 5 (evolução de arquitetura), depois do
  go-live (Parte 4). Decisão do usuário em 2026-11-12/13: registrar e não
  iniciar agora. **Atualização 2026-11-13:** Fases 1 (model
  `ActionOccurrence` + endpoints), 2 (UI de Encontros) e 3 (presença/
  qualidade por Encontro, com migration em 2 passos + backfill) já foram
  implementadas e testadas, a pedido explícito do usuário, à frente desta
  decisão de sequenciamento — ver evidência em
  `docs/historico/plano-implementacao-scfv.md` e o desvio registrado no
  topo do `PLAN.md`. Também já implementadas: Fases R1-R3 do redesenho de
  Grupos/matrícula/Encontro (ver `docs/historico/plano-redesenho-Grupos-matricula-atividades.md`).
  Tudo que continua sem implementar — presença diária derivada, rename de
  nomenclatura, Ocorrência/Atendimento/Encaminhamento/Caso, relatórios por
  financiador — está mapeado no plano mestre atual.

## Frontend — autenticação

- **`LoginForm` perde o que a pessoa já digitou se ela começar a digitar
  antes do nome da instituição carregar.** `login-form.tsx` busca o
  tenant por slug de forma assíncrona (`fetchTenantBySlug`) e, ao
  resolver, dispara um re-render que reseta os campos do formulário de
  credenciais para os valores iniciais — qualquer coisa já digitada
  nesse meio-tempo é perdida. Achado em 2026-11-13 testando a Fase 2 do
  plano SCFV via automação de navegador (preencher o campo de e-mail
  antes do nome do tenant aparecer reproduz 100% das vezes). Impacto
  baixo (a busca do tenant é rápida), mas é uma causa plausível de
  "preenchi e sumiu" relatado por usuário real.
  **Gatilho:** próxima vez que o `login-form.tsx` for tocado, ou se
  virar reclamação de usuário real — mover os valores padrão de
  `initialValues` para fora do fluxo de re-render do tenant (ex.: não
  depender de um state que muda após o fetch), ou usar `key` estável no
  `RecordForm` para não perder o que já foi digitado.

## Testes e-2-e / CI local

- `frontend/e2e/smoke.spec.ts` ("usuário já logado redireciona pro
  dashboard") é instável neste tipo de ambiente de sandbox, independente
  de mudança de código.
  **Gatilho:** só investigar se falhar de forma consistente e repetível no
  CI real (Parte 2), não numa única corrida local.

## Módulos Atendimento / Gestão de Projetos

- **Encontro (`Meeting`) com múltiplos Grupos de uma vez (N:N), para
  eventos especiais** — achado 4.14 do teste manual da Fase 4
  (2026-11-16). Decisão do usuário: por ora só a Atividade ganha
  múltiplos Grupos-alvo (multiselect); o Encontro continua escolhendo 1
  Grupos por vez dentre os vinculados à Atividade — cobre o caso do dia a
  dia. `Meeting.peopleGroupId` continua FK singular nullable.
  **Gatilho:** quando aparecer a necessidade real de registrar 1 único
  Encontro que juntou vários Grupos simultaneamente (ex.: um evento
  especial com todas as turmas) — nesse ponto, trocar `peopleGroupId`
  por uma tabela de junção `MeetingPeopleGroup` (mesmo padrão de
  `ActivityPeopleGroup`), migrando os dados existentes.

- **Coluna "Ocorrências" sempre `0` na aba agregada de Participantes da
  Atividade** — achado da Fase 5 (2026-11-18, `Occurrence`/
  `OccurrencePeople` implementados). O valor está hardcoded em
  `actions.service.ts:2813,2903` desde a Fase 4 Ciclo 2, quando a Fase 5
  ainda não existia. Fechar de verdade exige uma agregação nova: contar,
  por pessoa, quantas `Occurrence` ligadas aos `Meeting`s desta atividade a
  envolvem (join `Occurrence` → `OccurrencePeople` → `personId`, filtrado
  por `meeting.actionId`).
  **Gatilho:** quando a aba de Participantes da Atividade precisar mostrar
  esse número de verdade (ex.: relatório que cruza frequência com
  ocorrências por pessoa) — não fazia parte do critério de teste da Fase 5.

- **Permissões novas (`occurrences.*`) não chegam em papéis já existentes
  de um tenant** — achado da Fase 5 (2026-11-18). O
  `PermissionsSyncService` só faz upsert do catálogo (`Permission`) no
  boot; a associação `RolePermission` dos papéis Admin/Gestor/Atendimento
  só é recriada rodando o seed de novo (`npm run build:seed && npm run
  db:seed`, que recompila o helper que lê `core-permissions.ts` em tempo
  real). Num tenant real de produção isso significa que adicionar uma
  permissão nova ao catálogo não dá acesso automático a ninguém — alguém
  precisa editar o papel manualmente pela UI de Administração.
  **Gatilho:** antes da Parte 4 (produção) — decidir se isso é aceitável
  (admin ajusta papéis manualmente quando uma feature nova sai) ou se vale
  a pena um mecanismo de sync de `RolePermission` pros papéis padrão
  (`Admin`/`Gestor`/`Atendimento`/`Leitor`) rodar no boot também, não só o
  catálogo de permissões.

## Infraestrutura de UI (web-client)

- **`ListView.tsx` (`enableRowSelection`/`onSelectionChange`): o efeito
  que notifica a seleção recalcula `selectedRows` com `.map()` a cada
  render, sem memoização — qualquer consumidor que passe o `setState`
  bruto (`onSelectionChange={setSelectedRows}`) entra em loop infinito
  ("Maximum update depth exceeded"), porque a nova referência do array
  (mesmo com conteúdo igual) sempre dispara um re-render do pai, que
  força o `ListView` a recalcular de novo. Achado e contornado em
  `action-occurrences-section.tsx` (Fase 4, ajuste 2.9) com um updater
  funcional que compara o conteúdo antes de trocar a referência — não
  mexi no `ListView.tsx` em si, por ser infraestrutura compartilhada com
  outros 5 consumidores (`project-enrollments-card.tsx`,
  `pantry-donors-module-client-page.tsx`, etc.) e eu não ter orçamento
  nesta sessão pra testar o impacto nos seis.
  **Gatilho:** da próxima vez que outro consumidor de
  `onSelectionChange` relatar o mesmo loop (ou ao tocar em
  `ListView.tsx` por outro motivo) — mover a comparação de conteúdo
  para dentro do próprio componente (memoizar `selectedRows` com
  `useMemo` chaveado em algo estável, tipo os ids selecionados) em vez
  de depender de cada consumidor se proteger por conta própria.

- **Projects preso em "Salvando..." — relatado pelo usuário, não
  reproduzido ao vivo (2026-11-18).** Durante o item avulso "fechar
  Atividades/Encontros" (ver `PLAN.md`), editei um campo real de um
  Projeto existente com o backend/frontend de pé e observei o PATCH:
  disparou, voltou 200, e o cabeçalho mostrou "Pronto" em menos de 1
  segundo — a cadeia de código (`useDetailAutoSaveController`,
  `ProjectsDetailMain`, `projects-detail-engine-client-page.tsx`) está
  estruturalmente igual à de People-Groups, que funciona. A Atividade
  tinha um bug parecido mas com causa raiz diferente e já identificada
  (`refreshReport()` deixando `qualitySaving` preso em `true` — fixado
  nesta mesma sessão), que pode ou não ser o que o usuário viu em
  Projects.
  **Gatilho:** se o travamento em Projects persistir, pedir ao usuário
  passos de reprodução específicos (qual campo, qual projeto, em que
  sequência de cliques) antes de investigar de novo — não adivinhar o
  fix sem um repro real.

- **Comentários/Histórico/Contexto ainda no `sideSlot` de Projects,
  Programs, Tasks, Pantry e Deposit** — a partir de 2026-11-18 o padrão
  canônico do `sideSlot` é só `Tags`/`Notas`/`Anexos`/`Auditoria` (ver
  `docs/canonical-web-client-standard.md`, seção `sideSlot`); People e
  Activity já seguem isso, os outros 5 módulos ainda não foram migrados
  — decisão explícita do usuário foi fechar só a Atividade nesta rodada
  e deixar o resto pra trás.
  **Gatilho:** próxima vez que um desses 5 módulos for mexido por outro
  motivo, ou quando a padronização dos módulos restantes entrar em
  pauta por conta própria — migrar seguindo o mesmo padrão aplicado em
  Activity (tirar `comments`/`history`/`contextItems` do `side`, dar
  `richText`/`mentionUsers` pra `notes` se ainda não tiver).

- **Achados de densidade visual/estrutural fora de escopo, por módulo
  (investigação de 2026-11-18, não tocados por decisão do usuário):**
  - Tasks: telas de Detail sem `DetailSectionHeading`/cabeçalho de
    seção visual (campos soltos, sem agrupamento).
  - Pantry e Deposit: `canAudit` hardcoded `true` no formulário de item
    (toda ação aparenta ser auditável mesmo quando não é).
  - Typos de gênero ("Novo fonte" em vez de "Nova fonte", "doador" sem
    flexão de gênero em telas que deveriam concordar com o cadastro).
  - Texto corrompido "Doa??o" (mojibake de "Doação") em pelo menos uma
    tela do módulo de doações.
  - Tasks: feed de histórico próprio (`history` customizado) em vez de
    reaproveitar a Auditoria canônica.
  **Gatilho:** da próxima vez que qualquer um desses módulos específicos
  for mexido por outro motivo — ou quando o usuário pedir uma rodada de
  padronização dedicada aos módulos restantes (nos moldes desta sessão e
  da sessão de padronização visual de 2026-11-17).

- **`docs/canonical-web-client-standard.md` com mojibake em boa parte
  dos acentos** (ex.: "ObrigatÃ³rio", "nÃ£o", "Ã©") — o arquivo parece ter
  sido salvo/editado em algum momento com encoding errado (UTF-8 lido
  como Latin-1 ou vice-versa). As seções mais novas do arquivo ("Visual
  do Detail", a edição de 2026-11-18 na seção `sideSlot`) já evitam o
  problema escrevendo sem acentos de propósito. Não corrigido nesta
  sessão por ser cosmético e fora do escopo (teria que revisar o
  arquivo inteiro, não só a seção tocada).
  **Gatilho:** da próxima vez que alguém for editar esse arquivo por
  outro motivo, ou numa sessão dedicada a limpar encoding de docs —
  reescrever o arquivo inteiro em UTF-8 correto de uma vez.

## Atividades — login lento após autenticar (não reproduzido, 2026-11-18)

Usuário relatou: logo após logar, a tela de Dashboard fica presa em
"Carregando dashboard..." e nenhuma outra tela carrega (nem clicando em
outros itens do menu) até dar F5 — só acontece no primeiro acesso.
Tentei reproduzir de 3 formas diferentes, todas sem sucesso:

1. `next dev` logo após subir o servidor do zero: reproduzi uma demora real
   (~24s), mas era compilação sob demanda de rota (Next dev recompila cada
   rota na primeira visita da sessão) — o usuário confirmou que o problema
   acontece em modo `start` (produção), não em `dev`.
2. `next build && next start` do zero, primeiro login: completou em <2s.
3. Mesmo build já aquecido, 3 tentativas seguidas (login → dashboard →
   clique em Atividades): todas completaram em 1-3s, sem nenhum "Carregando"
   preso.

Candidato mais provável que não pude testar: o navegador real do usuário
pode ter um service worker antigo (`public/sw.js`, registrado em sessão
anterior rodando `next dev`) ainda ativo quando ele troca pra `next start`
no mesmo endereço — o SW é um passthrough sem cache, mas intercepta toda
`fetch`, incluindo as chamadas de navegação RSC do Next; não encontrei
evidência direta de que ele cause o travamento, só não consegui descartar
sem acesso ao navegador real.
**Gatilho:** se acontecer de novo, abrir o DevTools (F12) antes de dar F5 —
aba Application → Service Workers (tem algo registrado? deu erro?) e aba
Network (alguma requisição amarela/vermelha, presa em "pending"?) — e
registrar o que aparece. Isso decide se o próximo passo é mexer no
registro do service worker ou procurar em outro lugar.

## Barra de Status/Tipo/Período/Cadastro no header do Detail (2026-11-18)

Removida da Atividade a pedido do usuário ("suja a tela, quebra a lógica
visual") — ver `PLAN.md`. Usuário confirmou gostar do resultado e pediu
pra documentar como padrão (feito em
`docs/canonical-web-client-standard.md`, seção "Header colado nas
abas"). Projects, Programs e People-Groups ainda têm essa mesma barra
(`header.slot`) nos seus respectivos `*-detail-layout-contract.tsx` —
ainda não migrados.
**Gatilho:** quando o usuário pedir pra revisar um desses 3 módulos
especificamente (igual está fazendo com Atividades agora) — remover o
`header.slot` do contract correspondente do mesmo jeito (apagar a função
que monta a barra, não só esconder) e levar os campos que ela mostrava
pro formulário principal, seguindo a mesma convenção de primeira linha
(Título/Status/Tipo/relacionamento principal) adotada na Atividade.

## Relations ainda no `DetailRelationsRenderer`, não em `RelationListHost` (2026-11-18)

A aba Encontros da Atividade virou a referência do padrão canônico de
relation (ver `docs/canonical-web-client-standard.md`, seção "Relation
no rodapé do Detail") — barra única sem cabeçalho, botões Colunas/Filtros
estilo ghost, agrupamento por qualquer coluna repetível, atalho de
intervalo de data automático no painel de Filtros, tabela sem borda, sem
coluna de Ações (editar é clicar na linha, excluir é selecionar +
"Excluir selecionados"). Três abas da própria Atividade ainda não seguem
isso — Participantes, Qualidade e Equipe continuam no mecanismo mais
simples (`DetailRelationsRenderer`/`DetailRelationConfig`,
`web-client/detail/DetailLayoutSections.tsx`), sem `SearchPanelMenu` de
verdade, sem botão de Colunas, sem agrupamento.
**Gatilho:** quando o usuário pedir pra revisar uma dessas 3 abas
especificamente (mesmo fluxo usado pra Encontros) — trocar
`DetailRelationsRenderer` por `RelationListHost` (ou
`DetailRelationTablePanel`, se a relation não precisar de visualização
alternativa tipo calendário), seguindo a seção do padrão canônico passo a
passo. A aba Participantes especificamente já tem um `type: "dateRange"`
customizado (item anterior do backlog, agora marcado como legado) que
pode ser removido nessa migração — o atalho de data do `SearchPanelMenu`
substitui.

**Fora do escopo desta migração, mas candidato futuro:** o List Principal
(`RecordListHost`) ainda renderiza `ListView` com borda (`bordered` não
informado, fica no padrão `true`) — se o usuário quiser a mesma ausência
de borda nas telas de lista principal, não só nas relations, é só passar
`bordered={false}` lá também; não assumido agora porque não foi pedido
para essa parte do sistema.

## Botão "Árvore genealógica" de People ainda laranja (`variant: "action"`) (2026-11-19)

Ao padronizar o botão de ação extra do header do Detail da Atividade
("Registrar ocorrência", `actions-detail-layout-contract.tsx`) para
`variant: "default"` (azul, igual ao botão "Novo"), ficou confirmado que
o botão `family-tree` de People (`people-detail-layout-contract.tsx`)
continua em `variant: "action"` (laranja, `--action` do design system) —
usuário concordou que está fora do padrão, mas decidiu não mexer agora
porque o escopo da sessão era só Atividades.
**Gatilho:** quando o usuário pedir pra revisar People especificamente
(mesmo fluxo usado pra Atividades) — trocar `variant: "action"` por
`variant: "default"` em `PEOPLE_DETAIL_HEADER_ACTIONS` (chave
`family-tree`).

## `onClose`/X do `DetailShell` sem uso depois da remoção do botão fechar (2026-11-19)

O botão X do header do `DetailShell.tsx` (voltava pra lista do módulo)
foi removido a pedido do usuário — já dá pra voltar pelo breadcrumb. A
prop `onClose` continua declarada em `DetailShellProps` e continua sendo
passada por todo module engine client page (~25 arquivos, um `onClose={...}`
por módulo: People, Projects, Tasks, Programs, Admin, Deposit, Pantry,
Occurrences, People-Groups etc.) — decisão do usuário foi deixar assim
por agora em vez de remover a plumbing inteira numa tarefa só de ajuste
visual.
**Gatilho:** numa próxima rodada de limpeza (ou quando mexer de novo no
`DetailShell`/`DetailShellEngine`) — remover `onClose` de
`DetailShellProps` (`components/layout/DetailShell.tsx`) e de
`DetailShellEngineProps` (`web-client/detail/DetailShellEngine.tsx`), e
apagar o prop `onClose={...}` de cada um dos ~25 call sites (viram
`router.push`/`backToList`/`close` sem consumidor — conferir se essas
funções auxiliares também ficam sem uso em algum desses arquivos e, se
sim, apagar junto).
