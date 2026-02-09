-- AlterTable
ALTER TABLE `Tenant` ADD COLUMN `cnpj` VARCHAR(191) NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `startYear` INTEGER NULL;
