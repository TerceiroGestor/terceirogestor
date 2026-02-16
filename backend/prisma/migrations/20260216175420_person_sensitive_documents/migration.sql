-- CreateTable
CREATE TABLE `PersonSensitiveDocument` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `schemaVersion` INTEGER NOT NULL DEFAULT 1,
    `dataEnc` LONGBLOB NOT NULL,
    `iv` VARBINARY(12) NOT NULL,
    `tag` VARBINARY(16) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PersonSensitiveDocument_personId_key`(`personId`),
    INDEX `PersonSensitiveDocument_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PersonSensitiveAccessLog` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `personId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `action` ENUM('READ', 'UPDATE') NOT NULL,
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PersonSensitiveAccessLog_tenantId_idx`(`tenantId`),
    INDEX `PersonSensitiveAccessLog_personId_idx`(`personId`),
    INDEX `PersonSensitiveAccessLog_userId_idx`(`userId`),
    INDEX `PersonSensitiveAccessLog_tenantId_personId_action_idx`(`tenantId`, `personId`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PersonSensitiveDocument` ADD CONSTRAINT `PersonSensitiveDocument_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonSensitiveDocument` ADD CONSTRAINT `PersonSensitiveDocument_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonSensitiveAccessLog` ADD CONSTRAINT `PersonSensitiveAccessLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonSensitiveAccessLog` ADD CONSTRAINT `PersonSensitiveAccessLog_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PersonSensitiveAccessLog` ADD CONSTRAINT `PersonSensitiveAccessLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
