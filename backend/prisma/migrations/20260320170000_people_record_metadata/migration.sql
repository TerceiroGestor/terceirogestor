CREATE TABLE `PersonRecordComment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `personId` CHAR(36) NOT NULL,
  `recordType` VARCHAR(64) NOT NULL,
  `recordId` CHAR(36) NOT NULL,
  `authorUserId` CHAR(36) NULL,
  `body` TEXT NOT NULL,
  `mentionUserIds` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `PersonRecordComment_tenantId_idx`(`tenantId`),
  INDEX `PRComment_record_idx`(`personId`, `recordType`, `recordId`, `createdAt`),
  INDEX `PersonRecordComment_authorUserId_idx`(`authorUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PersonRecordAttachment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `personId` CHAR(36) NOT NULL,
  `recordType` VARCHAR(64) NOT NULL,
  `recordId` CHAR(36) NOT NULL,
  `uploadedByUserId` CHAR(36) NULL,
  `label` VARCHAR(191) NOT NULL,
  `filePath` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NULL,
  `fileSizeBytes` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `PersonRecordAttachment_tenantId_idx`(`tenantId`),
  INDEX `PRAttach_record_idx`(`personId`, `recordType`, `recordId`, `createdAt`),
  INDEX `PersonRecordAttachment_uploadedByUserId_idx`(`uploadedByUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `PersonRecordTag` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `personId` CHAR(36) NOT NULL,
  `recordType` VARCHAR(64) NOT NULL,
  `recordId` CHAR(36) NOT NULL,
  `value` VARCHAR(120) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `PRTag_record_value_key`(`tenantId`, `recordType`, `recordId`, `value`),
  INDEX `PersonRecordTag_tenantId_idx`(`tenantId`),
  INDEX `PRTag_record_idx`(`personId`, `recordType`, `recordId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PersonRecordComment`
ADD CONSTRAINT `PersonRecordComment_tenantId_fkey`
FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PersonRecordComment`
ADD CONSTRAINT `PersonRecordComment_personId_fkey`
FOREIGN KEY (`personId`) REFERENCES `Person`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PersonRecordComment`
ADD CONSTRAINT `PersonRecordComment_authorUserId_fkey`
FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `PersonRecordAttachment`
ADD CONSTRAINT `PersonRecordAttachment_tenantId_fkey`
FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PersonRecordAttachment`
ADD CONSTRAINT `PersonRecordAttachment_personId_fkey`
FOREIGN KEY (`personId`) REFERENCES `Person`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PersonRecordAttachment`
ADD CONSTRAINT `PersonRecordAttachment_uploadedByUserId_fkey`
FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `PersonRecordTag`
ADD CONSTRAINT `PersonRecordTag_tenantId_fkey`
FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PersonRecordTag`
ADD CONSTRAINT `PersonRecordTag_personId_fkey`
FOREIGN KEY (`personId`) REFERENCES `Person`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
