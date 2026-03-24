ALTER TABLE `Cycle`
  ADD COLUMN `tags` TEXT NULL;

CREATE TABLE `CycleComment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `cycleId` CHAR(36) NOT NULL,
  `authorUserId` CHAR(36) NULL,
  `body` TEXT NOT NULL,
  `mentionUserIds` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `CycleComment_tenantId_idx`(`tenantId`),
  INDEX `CycleComment_cycleId_idx`(`cycleId`),
  INDEX `CycleComment_authorUserId_idx`(`authorUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CycleAttachment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `cycleId` CHAR(36) NOT NULL,
  `uploadedByUserId` CHAR(36) NULL,
  `label` VARCHAR(191) NOT NULL,
  `filePath` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NULL,
  `fileSizeBytes` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `CycleAttachment_tenantId_idx`(`tenantId`),
  INDEX `CycleAttachment_cycleId_idx`(`cycleId`),
  INDEX `CycleAttachment_uploadedByUserId_idx`(`uploadedByUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProjectAction`
  ADD COLUMN `tags` TEXT NULL,
  ADD COLUMN `internalNotes` TEXT NULL;

CREATE TABLE `ProjectActionComment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `actionId` CHAR(36) NOT NULL,
  `authorUserId` CHAR(36) NULL,
  `body` TEXT NOT NULL,
  `mentionUserIds` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ProjectActionComment_tenantId_idx`(`tenantId`),
  INDEX `ProjectActionComment_actionId_idx`(`actionId`),
  INDEX `ProjectActionComment_authorUserId_idx`(`authorUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjectActionAttachment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `actionId` CHAR(36) NOT NULL,
  `uploadedByUserId` CHAR(36) NULL,
  `label` VARCHAR(191) NOT NULL,
  `filePath` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NULL,
  `fileSizeBytes` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ProjectActionAttachment_tenantId_idx`(`tenantId`),
  INDEX `ProjectActionAttachment_actionId_idx`(`actionId`),
  INDEX `ProjectActionAttachment_uploadedByUserId_idx`(`uploadedByUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CycleComment`
  ADD CONSTRAINT `CycleComment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `CycleComment_cycleId_fkey`
    FOREIGN KEY (`cycleId`) REFERENCES `Cycle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `CycleComment_authorUserId_fkey`
    FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `CycleAttachment`
  ADD CONSTRAINT `CycleAttachment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `CycleAttachment_cycleId_fkey`
    FOREIGN KEY (`cycleId`) REFERENCES `Cycle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `CycleAttachment_uploadedByUserId_fkey`
    FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ProjectActionComment`
  ADD CONSTRAINT `ProjectActionComment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `ProjectActionComment_actionId_fkey`
    FOREIGN KEY (`actionId`) REFERENCES `ProjectAction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `ProjectActionComment_authorUserId_fkey`
    FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ProjectActionAttachment`
  ADD CONSTRAINT `ProjectActionAttachment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `ProjectActionAttachment_actionId_fkey`
    FOREIGN KEY (`actionId`) REFERENCES `ProjectAction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `ProjectActionAttachment_uploadedByUserId_fkey`
    FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
