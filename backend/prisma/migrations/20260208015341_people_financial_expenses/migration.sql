-- CreateTable
CREATE TABLE `PersonExpense` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `frequency` ENUM('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'ANNUAL', 'ONCE') NOT NULL DEFAULT 'MONTHLY',
    `isHouseholdExpense` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PersonExpense_tenantId_idx`(`tenantId`),
    INDEX `PersonExpense_personId_idx`(`personId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PersonExpense` ADD CONSTRAINT `PersonExpense_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonExpense` ADD CONSTRAINT `PersonExpense_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
