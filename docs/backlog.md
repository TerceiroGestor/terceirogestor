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

- **Plataforma SCFV completa (Programas/Projetos/Atividades/Encontros +
  Atendimento Técnico + Encaminhamentos + Ocorrências + relatórios
  RMA/SISC).** Plano módulo a módulo, testável, em
  `docs/plano-implementacao-scfv.md` (2026-11-13) — substitui e amplia o
  plano anterior (`docs/plano-reestruturacao-programas-projetos-atividades.md`,
  2026-11-12, mantido como referência histórica do racional original de
  `ActionOccurrence`). 9 fases com dependências mapeadas: Encontro (model
  novo) → UI de Encontros → migração de presença para nível de Encontro (2
  deploys) → relabel "Ação"→"Atividade" (paralelo) → módulos novos
  Atendimento/Encaminhamento/Ocorrência (com guard de sigilo reaproveitável)
  → regras SCFV (faixa etária, público prioritário, lista de espera, motivo
  de desligamento) → timeline 360° da Pessoa (aba "Atendimentos", hoje
  `disabled: true` — `people-detail-tabs.tsx:45`) → relatórios de
  estrutura/compliance → prontuário individual exportável. Decisões
  pendentes listadas no fim de cada fase do plano, com recomendação própria
  cada uma.
  **Gatilho:** início da Parte 5 (evolução de arquitetura), depois do
  go-live (Parte 4). Decisão do usuário em 2026-11-12/13: registrar e não
  iniciar agora. **Atualização 2026-11-13:** Fases 1 (model
  `ActionOccurrence` + endpoints), 2 (UI de Encontros) e 3 (presença/
  qualidade por Encontro, com migration em 2 passos + backfill) já foram
  implementadas e testadas, a pedido explícito do usuário, à frente desta
  decisão de sequenciamento — ver evidência em
  `docs/plano-implementacao-scfv.md` e o desvio registrado no topo do
  `PLAN.md`. As Fases 4-9 continuam adiadas.

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
