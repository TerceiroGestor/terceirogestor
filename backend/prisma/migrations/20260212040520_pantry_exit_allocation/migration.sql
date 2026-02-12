-- AlterTable
ALTER TABLE `pantryentry` ALTER COLUMN `sector` DROP DEFAULT;

-- AlterTable
ALTER TABLE `pantryexit` ALTER COLUMN `sector` DROP DEFAULT;

-- CreateTable
CREATE TABLE `PantryExitAllocation` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `exitId` CHAR(36) NOT NULL,
    `entryId` CHAR(36) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PantryExitAllocation_tenantId_idx`(`tenantId`),
    INDEX `PantryExitAllocation_exitId_idx`(`exitId`),
    INDEX `PantryExitAllocation_entryId_idx`(`entryId`),
    UNIQUE INDEX `PantryExitAllocation_exitId_entryId_key`(`exitId`, `entryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PantryExitAllocation` ADD CONSTRAINT `PantryExitAllocation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PantryExitAllocation` ADD CONSTRAINT `PantryExitAllocation_exitId_fkey` FOREIGN KEY (`exitId`) REFERENCES `PantryExit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PantryExitAllocation` ADD CONSTRAINT `PantryExitAllocation_entryId_fkey` FOREIGN KEY (`entryId`) REFERENCES `PantryEntry`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
