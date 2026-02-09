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

## Seed
- Cadastra tenant, roles, users, people e exemplos de familia.
- IDs sao fixos para facilitar testes.
