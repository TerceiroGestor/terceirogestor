CREATE TABLE `PersonComment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `personId` CHAR(36) NOT NULL,
  `authorUserId` CHAR(36) NULL,
  `body` TEXT NOT NULL,
  `mentionUserIds` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `PersonComment_tenantId_idx`(`tenantId`),
  INDEX `PersonComment_personId_createdAt_idx`(`personId`, `createdAt`),
  INDEX `PersonComment_authorUserId_idx`(`authorUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PersonAttachment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `personId` CHAR(36) NOT NULL,
  `uploadedByUserId` CHAR(36) NULL,
  `label` VARCHAR(191) NOT NULL,
  `filePath` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NULL,
  `fileSizeBytes` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `PersonAttachment_tenantId_idx`(`tenantId`),
  INDEX `PersonAttachment_personId_createdAt_idx`(`personId`, `createdAt`),
  INDEX `PersonAttachment_uploadedByUserId_idx`(`uploadedByUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PersonComment`
ADD CONSTRAINT `PersonComment_tenantId_fkey`
FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PersonComment`
ADD CONSTRAINT `PersonComment_personId_fkey`
FOREIGN KEY (`personId`) REFERENCES `Person`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PersonComment`
ADD CONSTRAINT `PersonComment_authorUserId_fkey`
FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `PersonAttachment`
ADD CONSTRAINT `PersonAttachment_tenantId_fkey`
FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PersonAttachment`
ADD CONSTRAINT `PersonAttachment_personId_fkey`
FOREIGN KEY (`personId`) REFERENCES `Person`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PersonAttachment`
ADD CONSTRAINT `PersonAttachment_uploadedByUserId_fkey`
FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;
