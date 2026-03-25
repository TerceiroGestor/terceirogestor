ALTER TABLE `ActionType`
  MODIFY `target` ENUM('PROJECT', 'GROUP', 'CYCLE', 'PROJECT_GROUP', 'PEOPLE_GROUP', 'ENROLLMENT') NOT NULL DEFAULT 'PROJECT';

UPDATE `ActionType`
SET `target` = 'PROJECT_GROUP'
WHERE `target` = 'GROUP';

UPDATE `ActionType`
SET `target` = 'PEOPLE_GROUP'
WHERE `target` = 'CYCLE';

ALTER TABLE `ActionType`
  MODIFY `target` ENUM('PROJECT', 'PROJECT_GROUP', 'PEOPLE_GROUP', 'ENROLLMENT') NOT NULL DEFAULT 'PROJECT';

ALTER TABLE `ProjectAction`
  ADD COLUMN `targetEnrollmentId` CHAR(36) NULL;

CREATE INDEX `ProjectAction_targetEnrollmentId_idx` ON `ProjectAction`(`targetEnrollmentId`);

ALTER TABLE `ProjectAction`
  ADD CONSTRAINT `ProjectAction_targetEnrollmentId_fkey`
  FOREIGN KEY (`targetEnrollmentId`) REFERENCES `ProjectEnrollment`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
