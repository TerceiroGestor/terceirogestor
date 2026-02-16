-- AlterTable
ALTER TABLE `HouseholdProfile`
    ADD COLUMN `cep` VARCHAR(8) NULL,
    ADD COLUMN `street` VARCHAR(191) NULL,
    ADD COLUMN `number` VARCHAR(191) NULL,
    ADD COLUMN `complement` VARCHAR(191) NULL,
    ADD COLUMN `neighborhood` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(2) NULL,
    ADD COLUMN `ibge` VARCHAR(7) NULL,
    ADD COLUMN `gia` VARCHAR(191) NULL,
    ADD COLUMN `ddd` VARCHAR(3) NULL,
    ADD COLUMN `siafi` VARCHAR(4) NULL,
    ADD COLUMN `reference` TEXT NULL;

-- CreateIndex
CREATE INDEX `HouseholdProfile_tenantId_cep_idx` ON `HouseholdProfile`(`tenantId`, `cep`);

