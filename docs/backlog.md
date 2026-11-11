# Backlog

Tudo que foi adiado, sempre com o gatilho que o traz de volta. Nada é
adiado sem gatilho. Formato do Alicerce.

## Infraestrutura / repositório

- **`.gitignore` tem `scripts`, `script` e `infra` sem barra**, o que
  ignora qualquer diretório com esses nomes em qualquer profundidade
  (`backend/scripts/`, `scripts/windows/` incluídos). Os arquivos que já
  existiam continuam rastreados, mas qualquer arquivo **novo** criado
  nessas pastas não vai aparecer em `git status` nem entrar com
  `git add .` — só com `git add -f`.
  **Gatilho:** primeira vez que alguém notar um script novo "desaparecendo"
  do `git status`, ou antes da Parte 2 (quando o CI entra e isso pode
  mascarar um arquivo que devia estar versionado).

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

- **41 vulnerabilidades no backend (`npm audit`: 3 low, 22 moderate, 14
  high, 2 critical) e 27 no frontend (1 low, 10 moderate, 15 high, 1
  critical)**, não investigadas ainda (rodar `npm audit` completo é item
  da Parte 2).
  **Gatilho:** Parte 2, item "Atualizar dependências só em patch/minor... Rodar
  `npm audit` e registrar o resultado".

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
