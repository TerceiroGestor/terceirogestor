# Backlog

Tudo que foi adiado, sempre com o gatilho que o traz de volta. Nada é
adiado sem gatilho. Formato do Alicerce.

## Infraestrutura / repositório

- **Node local é v26.1.0**, fora da faixa `>=22 <23` dos dois
  `package.json` (`engines`). O frontend já avisa com `EBADENGINE` no
  `npm ci`. Tudo funcionou nesta sessão, mas não é a versão que vai rodar
  no Railway.
  **Gatilho:** antes do Parte 4.1 (configurar o Railway), fixar a versão de
  Node do build (nixpacks/Dockerfile) em 22.x e, se possível, alinhar o
  ambiente de desenvolvimento também.

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
  - **Backend:** `nodemailer` (alta, direto, `7.x`→`10.5.0`) — é o único
    desses que roda em produção (envio de e-mail); os outros são só
    devDependencies (`jest`→`29.7.0`, na direção errada — bug do
    resolvedor do npm, não uma versão real mais nova —, `@nestjs/cli`→
    `12.0.12`, `ts-jest`→`25.5.1`).
  - **Backend e frontend:** o cluster `typescript-eslint`/
    `@typescript-eslint/*` aparece como "corrigível", mas a versão
    corrigida (`>8.72.2`) só existe como alpha (`8.72.3-alpha.*`) — não
    tem release estável ainda pra instalar.
  **Gatilho:** `nodemailer` — na próxima vez que o fluxo de e-mail for
  tocado (ou antes do go-live, o que vier primeiro), subir pra `10.x`
  com teste manual dos 3 fluxos que mandam e-mail (reset de senha,
  código de registro, confirmação). `jest`/`@nestjs/cli`/`ts-jest` —
  Parte 5 (majors). `typescript-eslint` — rodar `npm audit` de novo
  depois que uma versão estável `>8.72.2` for publicada.

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

## Dados de teste

- **`prisma/seed.js` é um artefato compilado manualmente, sem nenhum
  script de build.** Já ficou desatualizado em relação ao `prisma/seed.ts`
  uma vez (emails diferentes: `admin@exemplo.com` no `.js` vs
  `admin@seed.local` no `.ts` corrigido em 2026-11-05). Continua sem
  nenhuma automação: qualquer edição futura em `seed.ts` sem recompilar
  manualmente (`npx tsc prisma/seed.ts --outDir prisma --module commonjs
  --moduleResolution node --target es2023 --esModuleInterop --skipLibCheck
  --declaration --sourceMap`) volta a divergir silenciosamente — `node
  prisma/seed.js` não avisa, só roda a versão antiga.
  **Gatilho:** Parte 2, ao criar o CI — adicionar um passo que recompila
  e falha o PR se `git diff` mostrar `seed.js` diferente do que o
  `seed.ts` geraria. Até lá, recompilar manualmente a cada edição de
  `seed.ts`.

## Arquivos

- **Excluir um registro de anexo (`deletePersonAttachment`,
  `deleteProgramAttachment`, etc., em pelo menos 7 módulos) só remove a
  linha do banco — o arquivo físico em `uploads/<categoria>/` fica
  órfão pra sempre.** `StorageService.delete(categoria, filename)`
  já existe (item 12 de `docs/auditoria-riscos.md`), só não está
  plugado nesses fluxos ainda; conectar os 7+ módulos é uma mudança
  maior que o escopo desse item.
  **Gatilho:** quando o espaço em disco dos uploads virar problema
  perceptível, ou ao implementar o driver R2 (Parte 4.2) — nesse ponto
  já vale revisar todos os pontos de exclusão de uma vez.

## Segurança / chaves

- **Rotação de `PII_MASTER_KEY` e `TOTP_ENCRYPTION_KEY`.**
  **Gatilho:** primeiro incidente de segurança, ou 12 meses em produção
  (o que vier primeiro).

## Escala

- **Rate limit e controle de refresh em memória do processo `api`.**
  **Gatilho:** precisar de uma 2ª réplica do `api` no Railway (ver Parte
  5.8 do plano — mover para Redis).

## Testes e-2-e / CI local

- `frontend/e2e/smoke.spec.ts` ("usuário já logado redireciona pro
  dashboard") é instável neste tipo de ambiente de sandbox, independente
  de mudança de código.
  **Gatilho:** só investigar se falhar de forma consistente e repetível no
  CI real (Parte 2), não numa única corrida local.
