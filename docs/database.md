# Banco de Dados

## Visao geral
- Banco: MySQL
- ORM: Prisma
- Schema: `backend/prisma/schema.prisma`
- Seed: `backend/prisma/seed.ts`

## Tabelas principais

### Tenant
- Instituicao/organizacao.
- Campos: `name`, `logoUrl`, `status`.
- Relacoes: users, roles, people, households, personRelations.

### User, Role, Permission
- `User` vinculado a `Tenant`.
- Campos: `name`, `email`, `avatarUrl`, `isActive`.
- `Role` define permissoes.
- `RolePermission` e `UserRole` fazem a ligacao (N:N).

### Person
Campos principais (resumo):
- Identificacao: `fullName`, `socialName`, `birthDate`.
- Dados sociais: `sex`, `gender`, `raceColor`, `maritalStatus`, `nationality`.
- Contato: `email`, `phone`.
- Documentos: `document`, `rg`, `nis`.
- Status: `status`, `departureReason`.
- Tags: `tags` (JSON string).
- Saude: `hasHealthIssue`.
- Resumo: `profileSummary`.

### Household / HouseholdMember
- `Household` representa o nucleo familiar (residencia).
- `HouseholdMember` liga pessoa a residencia e guarda indicadores sociais:
  - `isLegalGuardian`, `isIncomeContributor`, `isProvider`, `isDependent`.

### HouseholdProfile
- Perfil da moradia (tipo, condicao, propriedade, metragem e observacoes).
- Um perfil por residencia (`unique householdId`).

### PersonIncome
- Renda vinculada a pessoa.
- Campos principais: tipo, valor, frequencia e se compoe a renda familiar.

### HouseholdAsset / PersonAsset
- Itens compartilhados da residencia e itens individuais por pessoa.
- Campos principais: categoria, item, quantidade, condicao e observacoes.

### PersonRelation
- Vinculo entre duas pessoas.
- Campos: `personId`, `relatedPersonId`, `type`, `livesTogether`, `isLegalGuardian`.
- Relacao inversa e sincronizada no service.

## Relacionamentos importantes
- `Tenant` 1:N `Person`, `Household`, `PersonRelation`.
- `PersonRelation` conecta pessoas (auto-relacionamento).
- `HouseholdMember` conecta `Person` ao `Household`.
- `HouseholdProfile` 1:1 `Household`.
- `PersonIncome` N:1 `Person`.
- `HouseholdAsset` N:1 `Household`.
- `PersonAsset` N:1 `Person`.

## Regras e comportamento
- Vinculos familiares sao criados no service e replicados no sentido inverso.
- Quando `livesTogether=true`, cria/garante `Household` e `HouseholdMember`.
- `HouseholdMember` tem `unique (householdId, personId)`.
- `PersonRelation` tem `unique (tenantId, personId, relatedPersonId, type)`.

## Migracoes
- Criar: `npx prisma migrate dev`.
- Aplicar em prod: `npx prisma migrate deploy`.
- Regenerar client: `npx prisma generate`.

## Seguranca em Producao (sem perder dados)

### Como funciona
- As migracoes ficam em `backend/prisma/migrations` e sao aplicadas em ordem.
- O Prisma registra o historico em uma tabela interna `_prisma_migrations`.
- Em producao usamos **sempre** `npx prisma migrate deploy` (nao gera migracao, apenas aplica o que ja existe).

### Checklist seguro para novas features
1. Alterar `backend/prisma/schema.prisma`.
2. Rodar `npx prisma migrate dev` em ambiente local para gerar a migration.
3. Revisar o SQL gerado em `backend/prisma/migrations/.../migration.sql`.
4. Testar localmente com dados reais (ou staging).
5. Em staging: `npx prisma migrate deploy` + subir o backend/frontend.
6. Em producao: backup do banco + `npx prisma migrate deploy` + subir o app.

### Boas praticas (reduz risco)
- Preferir migracoes **aditivas** primeiro (criar coluna nova como `NULL`).
- Fazer backfill de dados com um script separado.
- Em outra migration, tornar a coluna `NOT NULL` se necessario.
- Evitar `DROP COLUMN` direto: use abordagem expand/contract.
- Se precisar remover um campo, primeiro pare de usar no app, depois remova do schema em outra release.

### Seed em producao
- **Nao execute `npx prisma db seed` em producao.**
- O seed atual eh voltado a dados de exemplo e pode sobrescrever dados.

### Rollback
- Prisma nao faz rollback automatico em producao.
- Para reverter, use **backup** do banco ou uma migration corretiva.

## Seed
- Cadastra tenant, roles, users, people e exemplos de familia.
- IDs sao fixos para facilitar testes.
