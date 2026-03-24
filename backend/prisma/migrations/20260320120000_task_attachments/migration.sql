-- CreateTable
CREATE TABLE `TaskOrganizerAttachment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `taskId` CHAR(36) NOT NULL,
  `uploadedByUserId` CHAR(36) NULL,
  `label` VARCHAR(191) NOT NULL,
  `filePath` VARCHAR(191) NOT NULL,
  `mimeType` VARCHAR(191) NULL,
  `fileSizeBytes` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `TaskOrganizerAttachment_tenantId_idx`(`tenantId`),
  INDEX `TaskOrganizerAttachment_taskId_createdAt_idx`(`taskId`, `createdAt`),
  INDEX `TaskOrganizerAttachment_uploadedByUserId_idx`(`uploadedByUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TaskOrganizerAttachment`
ADD CONSTRAINT `TaskOrganizerAttachment_tenantId_fkey`
FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskOrganizerAttachment`
ADD CONSTRAINT `TaskOrganizerAttachment_taskId_fkey`
FOREIGN KEY (`taskId`) REFERENCES `TaskOrganizerTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskOrganizerAttachment`
ADD CONSTRAINT `TaskOrganizerAttachment_uploadedByUserId_fkey`
FOREIGN KEY (`uploadedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
