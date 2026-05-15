# Mapa de Dependencias Cruzadas - Onda 0

Data: 2026-05-13
Status: baseline inicial

## 1. Objetivo

Mapear dependencias entre `people` e outros modulos para orientar desacoplamento seguro antes de remocao.

## 2. Dependencias de entrada no frontend (modulos que dependem de people)

Dependencias observadas:

- `projects` importa componentes/utilitarios de `people` (avatar, idade, identidade)
- `people-groups` usa tipos de API de `people`
- `registry.ts` registra `people` junto com demais modulos ativos

Impacto:

- remocao de `projects` sem planejamento e simples, mas remocao de `people` e inviavel (nucleo)
- remocao de outros modulos exige limpar imports cruzados primeiro

## 3. Dependencias de saida no frontend (people depende de)

`people` depende principalmente de:

- `core` (infra de auth, lista admin shared, componentes base)
- `nav/groups` (estrutura de navegacao)
- `web-client` (shells e hosts canonicos)

Impacto:

- `core` e `web-client` nao podem ser removidos; sao infraestrutura de execucao

## 4. Dependencias no backend

`PeopleModule` depende de camadas core:

- `PrismaModule`
- `CepModule`
- `PiiModule`
- `RequestContextModule`

`AppModule` ainda carrega varios modulos fora do foco.

Impacto:

- antes de remover modulos do backend, desacoplar import em `AppModule`
- manter `Auth`, `Permissions`, `Tenants`, `Users`, `Roles` no minimo operacional para `people`

## 5. Roteiro de desacoplamento recomendado

1. Ocular/ocultar modulos fora do foco na navegacao (sem delete imediato)
2. Separar utilitarios compartilhados para camada comum quando hoje estiverem acoplados a modulo congelado
3. Remover imports de bootstrap gradualmente (frontend registry e backend AppModule)
4. Rodar validacao de ruptura por etapa
5. Excluir codigo de modulo somente apos zero referencia ativa

## 6. Regra de aceite para remocao fisica de modulo

Um modulo so pode ser removido quando:

- nao estiver no bootstrap
- nao estiver na navegacao
- nao possuir imports ativos
- nao possuir endpoint ativo chamado por `people`
- passar checklist de impacto sem regressao critica
