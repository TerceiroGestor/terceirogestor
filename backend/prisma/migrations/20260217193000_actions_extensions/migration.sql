-- Extend Actions domain: owner, group target, richtext, photos, and participation quality.

-- ActionType: define which entity the type targets (Projeto/Grupo/Ciclo)
ALTER TABLE `ActionType`
  ADD COLUMN `target` ENUM('PROJECT', 'GROUP', 'CYCLE') NOT NULL DEFAULT 'PROJECT';

-- ProjectAction: link to owner + optionally group, add richtext fields and photos
ALTER TABLE `ProjectAction`
  ADD COLUMN `createdByUserId` CHAR(36) NULL,
  ADD COLUMN `groupId` CHAR(36) NULL,
  ADD COLUMN `planHtml` TEXT NULL,
  ADD COLUMN `executedHtml` TEXT NULL,
  ADD COLUMN `conclusionHtml` TEXT NULL,
  ADD COLUMN `photoPaths` JSON NULL;

CREATE INDEX `ProjectAction_createdByUserId_idx` ON `ProjectAction`(`createdByUserId`);
CREATE INDEX `ProjectAction_groupId_idx` ON `ProjectAction`(`groupId`);

ALTER TABLE `ProjectAction`
  ADD CONSTRAINT `ProjectAction_createdByUserId_fkey`
    FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ProjectAction_groupId_fkey`
    FOREIGN KEY (`groupId`) REFERENCES `ProjectGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ProjectActionAttendance: quality + highlights (future ranking)
ALTER TABLE `ProjectActionAttendance`
  ADD COLUMN `qualityScore` INT NULL,
  ADD COLUMN `qualityNotes` TEXT NULL,
  ADD COLUMN `isHighlight` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `ProjectActionAttendance_isHighlight_idx` ON `ProjectActionAttendance`(`isHighlight`);
