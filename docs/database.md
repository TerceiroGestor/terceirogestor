# Banco de Dados

## Visão geral
- Banco: MySQL
- ORM: Prisma
- Schema: `backend/prisma/schema.prisma`
- Seed: `backend/prisma/seed.ts`

## Tabelas principais

### Tenant
- Instituição/organização.
- Relações: users, roles, people, households, personRelations.

### User, Role, Permission
- `User` vinculado a `Tenant`.
- `Role` define permissões.
- `RolePermission` e `UserRole` fazem a ligação (N:N).

### Person
Campos principais (resumo):
- Identificação: `fullName`, `socialName`, `birthDate`.
- Dados sociais: `sex`, `gender`, `raceColor`, `maritalStatus`, `nationality`.
- Contato: `email`, `phone`.
- Documentos: `document`, `rg`, `nis`.
- Status: `status`, `departureReason`.
- Tags: `tags` (JSON string).
- Saúde: `hasHealthIssue`.
- Resumo: `profileSummary`.

### Household / HouseholdMember
- `Household` representa o núcleo familiar (residência).
- `HouseholdMember` liga pessoa à residência e guarda indicadores sociais:
  - `isLegalGuardian`, `isIncomeContributor`, `isProvider`, `isDependent`.

### HouseholdProfile
- Perfil da moradia (tipo, condição, propriedade, metragem e observações).
- Um perfil por residência (`unique householdId`).

### PersonIncome
- Renda vinculada à pessoa.
- Campos principais: tipo, valor, frequência e se compõe a renda familiar.

### HouseholdAsset / PersonAsset
- Itens compartilhados da residência e itens individuais por pessoa.
- Campos principais: categoria, item, quantidade, condição e observações.

### PersonRelation
- Vínculo entre duas pessoas.
- Campos: `personId`, `relatedPersonId`, `type`, `livesTogether`, `isLegalGuardian`.
- Relação inversa e sincronizada no service.

## Relacionamentos importantes
- `Tenant` 1:N `Person`, `Household`, `PersonRelation`.
- `PersonRelation` conecta pessoas (auto-relacionamento).
- `HouseholdMember` conecta `Person` ao `Household`.
- `HouseholdProfile` 1:1 `Household`.
- `PersonIncome` N:1 `Person`.
- `HouseholdAsset` N:1 `Household`.
- `PersonAsset` N:1 `Person`.

## Regras e comportamento
- Vínculos familiares são criados no service e replicados no sentido inverso.
- Quando `livesTogether=true`, cria/garante `Household` e `HouseholdMember`.
- `HouseholdMember` tem `unique (householdId, personId)`.
- `PersonRelation` tem `unique (tenantId, personId, relatedPersonId, type)`.

## Migrações
- Criar: `npx prisma migrate dev`.
- Aplicar em prod: `npx prisma migrate deploy`.
- Regenerar client: `npx prisma generate`.

## Seed
- Cadastra tenant, roles, users, people e exemplos de família.
- IDs sao fixos para facilitar testes.

