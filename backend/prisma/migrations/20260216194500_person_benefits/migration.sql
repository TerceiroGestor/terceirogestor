-- CreateTable
CREATE TABLE `PersonBenefit` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `householdId` CHAR(36) NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NULL,
    `frequency` ENUM('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'ANNUAL', 'ONCE') NOT NULL DEFAULT 'MONTHLY',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PersonBenefit_tenantId_idx`(`tenantId`),
    INDEX `PersonBenefit_personId_idx`(`personId`),
    INDEX `PersonBenefit_householdId_idx`(`householdId`),
    INDEX `PersonBenefit_tenantId_personId_idx`(`tenantId`, `personId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PersonBenefit` ADD CONSTRAINT `PersonBenefit_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonBenefit` ADD CONSTRAINT `PersonBenefit_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonBenefit` ADD CONSTRAINT `PersonBenefit_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

