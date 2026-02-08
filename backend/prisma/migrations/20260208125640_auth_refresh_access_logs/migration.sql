-- CreateTable
CREATE TABLE `UserSession` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenHash` VARCHAR(128) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `lastUsedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserSession_tenantId_idx`(`tenantId`),
    INDEX `UserSession_userId_idx`(`userId`),
    INDEX `UserSession_expiresAt_idx`(`expiresAt`),
    UNIQUE INDEX `UserSession_tokenHash_key`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccessLog` (
    `id` CHAR(36) NOT NULL,
    `tenantId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `action` ENUM('LOGIN', 'REFRESH', 'LOGOUT') NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AccessLog_tenantId_idx`(`tenantId`),
    INDEX `AccessLog_userId_idx`(`userId`),
    INDEX `AccessLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserSession` ADD CONSTRAINT `UserSession_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSession` ADD CONSTRAINT `UserSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccessLog` ADD CONSTRAINT `AccessLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccessLog` ADD CONSTRAINT `AccessLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
