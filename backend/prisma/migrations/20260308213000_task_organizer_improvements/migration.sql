ALTER TABLE `TaskOrganizerChecklistItem`
  ADD COLUMN `ownerUserId` CHAR(36) NULL,
  ADD COLUMN `notes` TEXT NULL;

CREATE INDEX `TaskOrganizerChecklistItem_ownerUserId_idx`
  ON `TaskOrganizerChecklistItem`(`ownerUserId`);

ALTER TABLE `TaskOrganizerChecklistItem`
  ADD CONSTRAINT `TaskOrganizerChecklistItem_ownerUserId_fkey`
  FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `TaskOrganizerSubtask`
  ADD COLUMN `ownerUserId` CHAR(36) NULL,
  ADD COLUMN `description` TEXT NULL;

CREATE INDEX `TaskOrganizerSubtask_ownerUserId_idx`
  ON `TaskOrganizerSubtask`(`ownerUserId`);

ALTER TABLE `TaskOrganizerSubtask`
  ADD CONSTRAINT `TaskOrganizerSubtask_ownerUserId_fkey`
  FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `TaskOrganizerComment` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `taskId` CHAR(36) NOT NULL,
  `authorUserId` CHAR(36) NULL,
  `body` TEXT NOT NULL,
  `mentionUserIds` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `TaskOrganizerComment_tenantId_idx`(`tenantId`),
  INDEX `TaskOrganizerComment_taskId_createdAt_idx`(`taskId`, `createdAt`),
  INDEX `TaskOrganizerComment_authorUserId_idx`(`authorUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TaskOrganizerComment`
  ADD CONSTRAINT `TaskOrganizerComment_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `TaskOrganizerComment`
  ADD CONSTRAINT `TaskOrganizerComment_taskId_fkey`
  FOREIGN KEY (`taskId`) REFERENCES `TaskOrganizerTask`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `TaskOrganizerComment`
  ADD CONSTRAINT `TaskOrganizerComment_authorUserId_fkey`
  FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `TaskOrganizerTaskDependency` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `taskId` CHAR(36) NOT NULL,
  `dependsOnTaskId` CHAR(36) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `TaskOrganizerTaskDependency_taskId_dependsOnTaskId_key`(`taskId`, `dependsOnTaskId`),
  INDEX `TaskOrganizerTaskDependency_tenantId_idx`(`tenantId`),
  INDEX `TaskOrganizerTaskDependency_taskId_idx`(`taskId`),
  INDEX `TaskOrganizerTaskDependency_dependsOnTaskId_idx`(`dependsOnTaskId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TaskOrganizerTaskDependency`
  ADD CONSTRAINT `TaskOrganizerTaskDependency_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `TaskOrganizerTaskDependency`
  ADD CONSTRAINT `TaskOrganizerTaskDependency_taskId_fkey`
  FOREIGN KEY (`taskId`) REFERENCES `TaskOrganizerTask`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `TaskOrganizerTaskDependency`
  ADD CONSTRAINT `TaskOrganizerTaskDependency_dependsOnTaskId_fkey`
  FOREIGN KEY (`dependsOnTaskId`) REFERENCES `TaskOrganizerTask`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
