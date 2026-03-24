-- CreateTable
CREATE TABLE `StorageItem` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `group` VARCHAR(191) NULL,
    `defaultSector` VARCHAR(191) NOT NULL DEFAULT 'Geral',
    `unit` VARCHAR(191) NOT NULL,
    `minStock` DECIMAL(10, 2) NOT NULL,
    `notes` TEXT NULL,
    `tags` TEXT NULL,
    `internalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageItem_tenantId_idx`(`tenantId`),
    INDEX `StorageItem_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageSector` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageSector_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `StorageSector_tenantId_name_key`(`tenantId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageDonor` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('PERSON', 'COMPANY') NOT NULL DEFAULT 'PERSON',
    `contact` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `tags` TEXT NULL,
    `internalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageDonor_tenantId_idx`(`tenantId`),
    INDEX `StorageDonor_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageEntry` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `donorId` CHAR(36) NULL,
    `sector` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `entryDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiryDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `tags` TEXT NULL,
    `internalNotes` TEXT NULL,
    `reversalOfExitId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageEntry_tenantId_idx`(`tenantId`),
    INDEX `StorageEntry_itemId_idx`(`itemId`),
    INDEX `StorageEntry_donorId_idx`(`donorId`),
    INDEX `StorageEntry_sector_idx`(`sector`),
    INDEX `StorageEntry_entryDate_idx`(`entryDate`),
    INDEX `StorageEntry_expiryDate_idx`(`expiryDate`),
    INDEX `StorageEntry_reversalOfExitId_idx`(`reversalOfExitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageExit` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `sector` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `exitDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` ENUM('ATTENDED', 'DONATION', 'EVENT', 'PARTY', 'CORRECTION') NOT NULL DEFAULT 'ATTENDED',
    `eventName` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `tags` TEXT NULL,
    `internalNotes` TEXT NULL,
    `reversalOfEntryId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageExit_tenantId_idx`(`tenantId`),
    INDEX `StorageExit_itemId_idx`(`itemId`),
    INDEX `StorageExit_sector_idx`(`sector`),
    INDEX `StorageExit_exitDate_idx`(`exitDate`),
    INDEX `StorageExit_reversalOfEntryId_idx`(`reversalOfEntryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageExitAllocation` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `exitId` CHAR(36) NOT NULL,
    `entryId` CHAR(36) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StorageExitAllocation_tenantId_idx`(`tenantId`),
    INDEX `StorageExitAllocation_exitId_idx`(`exitId`),
    INDEX `StorageExitAllocation_entryId_idx`(`entryId`),
    UNIQUE INDEX `StorageExitAllocation_exitId_entryId_key`(`exitId`, `entryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageItemComment` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `authorUserId` CHAR(36) NULL,
    `body` TEXT NOT NULL,
    `mentionUserIds` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageItemComment_tenantId_idx`(`tenantId`),
    INDEX `StorageItemComment_itemId_createdAt_idx`(`itemId`, `createdAt`),
    INDEX `StorageItemComment_authorUserId_idx`(`authorUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageItemAttachment` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `itemId` CHAR(36) NOT NULL,
    `uploadedByUserId` CHAR(36) NULL,
    `label` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `fileSizeBytes` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageItemAttachment_tenantId_idx`(`tenantId`),
    INDEX `StorageItemAttachment_itemId_createdAt_idx`(`itemId`, `createdAt`),
    INDEX `StorageItemAttachment_uploadedByUserId_idx`(`uploadedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageDonorComment` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `donorId` CHAR(36) NOT NULL,
    `authorUserId` CHAR(36) NULL,
    `body` TEXT NOT NULL,
    `mentionUserIds` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageDonorComment_tenantId_idx`(`tenantId`),
    INDEX `StorageDonorComment_donorId_createdAt_idx`(`donorId`, `createdAt`),
    INDEX `StorageDonorComment_authorUserId_idx`(`authorUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageDonorAttachment` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `donorId` CHAR(36) NOT NULL,
    `uploadedByUserId` CHAR(36) NULL,
    `label` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `fileSizeBytes` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageDonorAttachment_tenantId_idx`(`tenantId`),
    INDEX `StorageDonorAttachment_donorId_createdAt_idx`(`donorId`, `createdAt`),
    INDEX `StorageDonorAttachment_uploadedByUserId_idx`(`uploadedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageEntryComment` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `entryId` CHAR(36) NOT NULL,
    `authorUserId` CHAR(36) NULL,
    `body` TEXT NOT NULL,
    `mentionUserIds` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageEntryComment_tenantId_idx`(`tenantId`),
    INDEX `StorageEntryComment_entryId_createdAt_idx`(`entryId`, `createdAt`),
    INDEX `StorageEntryComment_authorUserId_idx`(`authorUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageEntryAttachment` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `entryId` CHAR(36) NOT NULL,
    `uploadedByUserId` CHAR(36) NULL,
    `label` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `fileSizeBytes` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageEntryAttachment_tenantId_idx`(`tenantId`),
    INDEX `StorageEntryAttachment_entryId_createdAt_idx`(`entryId`, `createdAt`),
    INDEX `StorageEntryAttachment_uploadedByUserId_idx`(`uploadedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageExitComment` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `exitId` CHAR(36) NOT NULL,
    `authorUserId` CHAR(36) NULL,
    `body` TEXT NOT NULL,
    `mentionUserIds` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageExitComment_tenantId_idx`(`tenantId`),
    INDEX `StorageExitComment_exitId_createdAt_idx`(`exitId`, `createdAt`),
    INDEX `StorageExitComment_authorUserId_idx`(`authorUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageExitAttachment` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `exitId` CHAR(36) NOT NULL,
    `uploadedByUserId` CHAR(36) NULL,
    `label` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `fileSizeBytes` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageExitAttachment_tenantId_idx`(`tenantId`),
    INDEX `StorageExitAttachment_exitId_createdAt_idx`(`exitId`, `createdAt`),
    INDEX `StorageExitAttachment_uploadedByUserId_idx`(`uploadedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StorageItem` ADD CONSTRAINT `StorageItem_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageSector` ADD CONSTRAINT `StorageSector_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageDonor` ADD CONSTRAINT `StorageDonor_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageEntry` ADD CONSTRAINT `StorageEntry_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageEntry` ADD CONSTRAINT `StorageEntry_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `StorageItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageEntry` ADD CONSTRAINT `StorageEntry_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `StorageDonor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageEntry` ADD CONSTRAINT `StorageEntry_reversalOfExitId_fkey` FOREIGN KEY (`reversalOfExitId`) REFERENCES `StorageExit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExit` ADD CONSTRAINT `StorageExit_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExit` ADD CONSTRAINT `StorageExit_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `StorageItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExit` ADD CONSTRAINT `StorageExit_reversalOfEntryId_fkey` FOREIGN KEY (`reversalOfEntryId`) REFERENCES `StorageEntry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExitAllocation` ADD CONSTRAINT `StorageExitAllocation_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExitAllocation` ADD CONSTRAINT `StorageExitAllocation_exitId_fkey` FOREIGN KEY (`exitId`) REFERENCES `StorageExit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExitAllocation` ADD CONSTRAINT `StorageExitAllocation_entryId_fkey` FOREIGN KEY (`entryId`) REFERENCES `StorageEntry`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageItemComment` ADD CONSTRAINT `StorageItemComment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageItemComment` ADD CONSTRAINT `StorageItemComment_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `StorageItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageItemComment` ADD CONSTRAINT `StorageItemComment_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageItemAttachment` ADD CONSTRAINT `StorageItemAttachment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageItemAttachment` ADD CONSTRAINT `StorageItemAttachment_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `StorageItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageItemAttachment` ADD CONSTRAINT `StorageItemAttachment_uploadedByUserId_fkey` FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageDonorComment` ADD CONSTRAINT `StorageDonorComment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageDonorComment` ADD CONSTRAINT `StorageDonorComment_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `StorageDonor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageDonorComment` ADD CONSTRAINT `StorageDonorComment_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageDonorAttachment` ADD CONSTRAINT `StorageDonorAttachment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageDonorAttachment` ADD CONSTRAINT `StorageDonorAttachment_donorId_fkey` FOREIGN KEY (`donorId`) REFERENCES `StorageDonor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageDonorAttachment` ADD CONSTRAINT `StorageDonorAttachment_uploadedByUserId_fkey` FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageEntryComment` ADD CONSTRAINT `StorageEntryComment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageEntryComment` ADD CONSTRAINT `StorageEntryComment_entryId_fkey` FOREIGN KEY (`entryId`) REFERENCES `StorageEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageEntryComment` ADD CONSTRAINT `StorageEntryComment_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageEntryAttachment` ADD CONSTRAINT `StorageEntryAttachment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageEntryAttachment` ADD CONSTRAINT `StorageEntryAttachment_entryId_fkey` FOREIGN KEY (`entryId`) REFERENCES `StorageEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageEntryAttachment` ADD CONSTRAINT `StorageEntryAttachment_uploadedByUserId_fkey` FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExitComment` ADD CONSTRAINT `StorageExitComment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExitComment` ADD CONSTRAINT `StorageExitComment_exitId_fkey` FOREIGN KEY (`exitId`) REFERENCES `StorageExit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExitComment` ADD CONSTRAINT `StorageExitComment_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExitAttachment` ADD CONSTRAINT `StorageExitAttachment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExitAttachment` ADD CONSTRAINT `StorageExitAttachment_exitId_fkey` FOREIGN KEY (`exitId`) REFERENCES `StorageExit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageExitAttachment` ADD CONSTRAINT `StorageExitAttachment_uploadedByUserId_fkey` FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

