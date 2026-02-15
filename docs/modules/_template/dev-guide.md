# Guia de Desenvolvimento — `<moduleKey>`

Use este template para documentar um módulo do ponto de vista técnico (dev).

## Objetivo
- O que o módulo resolve (1 parágrafo).
- O que está fora do escopo.

## Modelos e dados
- Tabelas/entidades
- Relacionamentos
- Índices/uniques importantes
- Migrations relacionadas (listar pastas/arquivos)

## Endpoints
Liste endpoints e contratos (request/response) em alto nível.

Sugestão:
- `GET /...` (paginado? filtros?)
- `POST /...` (validações)
- `PATCH /...` (campos permitidos)
- `DELETE /...` (efeitos colaterais)

## Permissões
- `<moduleKey>.read`
- `<moduleKey>.create`
- `<moduleKey>.update`
- `<moduleKey>.delete`

## Regras de negócio
- …

## Auditoria
- Quais entidades são auditadas
- Como filtrar auditoria por módulo/entidade

## Seeds (dev)
- Dados de exemplo criados (o que e por quê)
- IDs fixos (se existirem)

## Observabilidade (opcional)
- Logs relevantes
- Métricas (se houver)

