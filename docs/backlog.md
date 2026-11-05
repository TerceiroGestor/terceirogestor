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
