-- CreateTable
CREATE TABLE `TenantRegistration` (
    `id` CHAR(36) NOT NULL,
    `method` ENUM('EMAIL', 'GOOGLE', 'MICROSOFT') NOT NULL,
    `status` ENUM('PENDING_OAUTH', 'PENDING_VERIFICATION', 'CONFIRMED', 'EXPIRED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `tenantName` VARCHAR(191) NOT NULL,
    `tenantSlug` VARCHAR(191) NOT NULL,
    `adminName` VARCHAR(191) NULL,
    `adminEmail` VARCHAR(191) NULL,
    `adminPasswordHash` VARCHAR(191) NULL,
    `oauthProviderSub` VARCHAR(191) NULL,
    `oauthStateHash` VARCHAR(191) NULL,
    `verificationCodeHash` VARCHAR(191) NULL,
    `verificationCodeExpiresAt` DATETIME(3) NULL,
    `tenantId` CHAR(36) NULL,
    `adminUserId` CHAR(36) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TenantRegistration_adminEmail_idx`(`adminEmail`),
    INDEX `TenantRegistration_tenantSlug_idx`(`tenantSlug`),
    INDEX `TenantRegistration_status_idx`(`status`),
    INDEX `TenantRegistration_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

