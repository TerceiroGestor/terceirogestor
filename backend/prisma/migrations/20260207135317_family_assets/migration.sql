-- CreateTable
CREATE TABLE `HouseholdAsset` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `householdId` CHAR(36) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `item` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NULL DEFAULT 1,
    `condition` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HouseholdAsset_tenantId_idx`(`tenantId`),
    INDEX `HouseholdAsset_householdId_idx`(`householdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PersonAsset` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `item` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NULL DEFAULT 1,
    `condition` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PersonAsset_tenantId_idx`(`tenantId`),
    INDEX `PersonAsset_personId_idx`(`personId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HouseholdAsset` ADD CONSTRAINT `HouseholdAsset_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HouseholdAsset` ADD CONSTRAINT `HouseholdAsset_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonAsset` ADD CONSTRAINT `PersonAsset_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonAsset` ADD CONSTRAINT `PersonAsset_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
