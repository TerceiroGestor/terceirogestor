-- CreateTable
CREATE TABLE "ActionOccurrencePeopleGroup" (
    "id" CHAR(36) NOT NULL,
    "tenantId" CHAR(36) NOT NULL,
    "occurrenceId" CHAR(36) NOT NULL,
    "peopleGroupId" CHAR(36) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionOccurrencePeopleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionOccurrencePeopleGroup_tenantId_idx" ON "ActionOccurrencePeopleGroup"("tenantId");

-- CreateIndex
CREATE INDEX "ActionOccurrencePeopleGroup_occurrenceId_idx" ON "ActionOccurrencePeopleGroup"("occurrenceId");

-- CreateIndex
CREATE INDEX "ActionOccurrencePeopleGroup_peopleGroupId_idx" ON "ActionOccurrencePeopleGroup"("peopleGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "ActionOccurrencePeopleGroup_tenantId_occurrenceId_peopleGro_key" ON "ActionOccurrencePeopleGroup"("tenantId", "occurrenceId", "peopleGroupId");

-- AddForeignKey
ALTER TABLE "ActionOccurrencePeopleGroup" ADD CONSTRAINT "ActionOccurrencePeopleGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionOccurrencePeopleGroup" ADD CONSTRAINT "ActionOccurrencePeopleGroup_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "ActionOccurrence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionOccurrencePeopleGroup" ADD CONSTRAINT "ActionOccurrencePeopleGroup_peopleGroupId_fkey" FOREIGN KEY ("peopleGroupId") REFERENCES "PeopleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DataMigration: copia o grupo singular (quando existia) do Encontro para a
-- tabela de junção nova, antes de remover a coluna antiga. gen_random_uuid()
-- já é usado em outras migrations deste projeto (extensão pgcrypto, sempre
-- disponível no Postgres do Railway/local aqui).
INSERT INTO "ActionOccurrencePeopleGroup" ("id", "tenantId", "occurrenceId", "peopleGroupId", "createdAt")
SELECT gen_random_uuid()::text, "tenantId", "id", "peopleGroupId", now()
FROM "ActionOccurrence"
WHERE "peopleGroupId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "ActionOccurrence" DROP CONSTRAINT "ActionOccurrence_peopleGroupId_fkey";

-- AlterTable
ALTER TABLE "ActionOccurrence" DROP COLUMN "peopleGroupId";
