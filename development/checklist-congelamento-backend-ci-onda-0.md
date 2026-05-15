# Checklist de Congelamento Backend + CI - Onda 0

Data: 2026-05-13
Status: concluida tecnicamente

## 1. Objetivo

Concluir o congelamento operacional no backend e estabelecer gate automatizado para bloquear alteracoes em modulos congelados.

## 2. Backend (bootstrap)

Arquivo de controle:

- backend/src/app.module.ts

Validacoes tecnicas:

- [x] Modo People First definido por flag (`PEOPLE_FIRST_MODE`)
- [x] Modulos congelados removidos do bootstrap quando `PEOPLE_FIRST_MODE=true` (padrao)
- [x] Rollback controlado previsto via `PEOPLE_FIRST_MODE=false`

## 3. CI Gate

Arquivos de controle:

- .github/workflows/frozen-modules-gate.yml
- .github/scripts/check-frozen-modules.js

Validacoes tecnicas:

- [x] Workflow de CI criado para pull_request e push em main
- [x] Coleta de diff base/head configurada
- [x] Gate reprova alteracoes em paths de modulos congelados
- [x] Gate aprova quando nao ha alteracoes em modulos congelados

## 4. Criterio de aceite

- [x] Congelamento operacional backend implementado
- [x] Gate de CI implementado e versionado
- [x] Evidencias documentais atualizadas em development/

## 5. Observacoes

- Excecoes fora do escopo congelado devem ser registradas por decisao arquitetural explicita antes do merge.
- Este gate cobre modulo congelado por path. Ajustes de excecao podem ser evoluidos na Onda 1 conforme governanca.
