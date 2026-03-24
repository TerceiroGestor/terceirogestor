ALTER TABLE `Program`
  ADD COLUMN `tags` TEXT NULL;

CREATE TABLE `ProgramComment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `programId` CHAR(36) NOT NULL,
  `authorUserId` CHAR(36) NULL,
  `body` TEXT NOT NULL,
  `mentionUserIds` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ProgramComment_tenantId_idx`(`tenantId`),
  INDEX `ProgramComment_programId_createdAt_idx`(`programId`, `createdAt`),
  INDEX `ProgramComment_authorUserId_idx`(`authorUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProgramAttachment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `programId` CHAR(36) NOT NULL,
  `uploadedByUserId` CHAR(36) NULL,
  `label` VARCHAR(191) NOT NULL,
  `filePath` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NULL,
  `fileSizeBytes` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ProgramAttachment_tenantId_idx`(`tenantId`),
  INDEX `ProgramAttachment_programId_createdAt_idx`(`programId`, `createdAt`),
  INDEX `ProgramAttachment_uploadedByUserId_idx`(`uploadedByUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProgramComment`
  ADD CONSTRAINT `ProgramComment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `ProgramComment_programId_fkey`
    FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ProgramComment_authorUserId_fkey`
    FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ProgramAttachment`
  ADD CONSTRAINT `ProgramAttachment_tenantId_fkey`
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `ProgramAttachment_programId_fkey`
    FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ProgramAttachment_uploadedByUserId_fkey`
    FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
