-- CreateTable
CREATE TABLE `PantryItem` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `group` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NOT NULL,
    `minStock` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PantryItem_tenantId_idx`(`tenantId`),
    INDEX `PantryItem_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PantryDonor` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('PERSON', 'COMPANY') NOT NULL DEFAULT 'PERSON',
    `contact` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PantryDonor_tenantId_idx`(`tenantId`),
    INDEX `PantryDonor_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PantryEntry` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `donorId` CHAR(36) NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `entryDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiryDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PantryEntry_tenantId_idx`(`tenantId`),
    INDEX `PantryEntry_itemId_idx`(`itemId`),
    INDEX `PantryEntry_donorId_idx`(`donorId`),
    INDEX `PantryEntry_entryDate_idx`(`entryDate`),
    INDEX `PantryEntry_expiryDate_idx`(`expiryDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PantryExit` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `exitDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` ENUM('ATTENDED', 'DONATION', 'EVENT', 'PARTY') NOT NULL DEFAULT 'ATTENDED',
    `eventName` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PantryExit_tenantId_idx`(`tenantId`),
    INDEX `PantryExit_itemId_idx`(`itemId`),
    INDEX `PantryExit_exitDate_idx`(`exitDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PantryItem` ADD CONSTRAINT `PantryItem_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PantryDonor` ADD CONSTRAINT `PantryDonor_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PantryEntry` ADD CONSTRAINT `PantryEntry_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PantryEntry` ADD CONSTRAINT `PantryEntry_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `PantryItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PantryEntry` ADD CONSTRAINT `PantryEntry_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `PantryDonor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PantryExit` ADD CONSTRAINT `PantryExit_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PantryExit` ADD CONSTRAINT `PantryExit_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `PantryItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
