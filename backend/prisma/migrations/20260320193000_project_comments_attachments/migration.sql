CREATE TABLE `ProjectComment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `projectId` CHAR(36) NOT NULL,
  `authorUserId` CHAR(36) NULL,
  `body` TEXT NOT NULL,
  `mentionUserIds` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `ProjectComment_tenantId_idx`(`tenantId`),
  INDEX `ProjectComment_projectId_idx`(`projectId`),
  INDEX `ProjectComment_authorUserId_idx`(`authorUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjectAttachment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `projectId` CHAR(36) NOT NULL,
  `uploadedByUserId` CHAR(36) NULL,
  `label` VARCHAR(191) NOT NULL,
  `filePath` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NULL,
  `fileSizeBytes` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `ProjectAttachment_tenantId_idx`(`tenantId`),
  INDEX `ProjectAttachment_projectId_idx`(`projectId`),
  INDEX `ProjectAttachment_uploadedByUserId_idx`(`uploadedByUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProjectComment`
  ADD CONSTRAINT `ProjectComment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `ProjectComment_projectId_fkey`
    FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `ProjectComment_authorUserId_fkey`
    FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ProjectAttachment`
  ADD CONSTRAINT `ProjectAttachment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `ProjectAttachment_projectId_fkey`
    FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `ProjectAttachment_uploadedByUserId_fkey`
    FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
