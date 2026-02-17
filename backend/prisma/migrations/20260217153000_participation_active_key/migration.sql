-- Add activeKey columns to support historical rows while enforcing only one "active" row.

ALTER TABLE `ProjectEnrollmentGroupMembership`
  ADD COLUMN `activeKey` VARCHAR(80) NULL;

ALTER TABLE `ProjectEnrollmentCycleParticipation`
  ADD COLUMN `activeKey` CHAR(36) NULL;

-- Backfill activeKey for current active rows
UPDATE `ProjectEnrollmentGroupMembership`
SET `activeKey` = CONCAT(`enrollmentId`, ':', `groupId`)
WHERE `isActive` = true AND `activeKey` IS NULL;

UPDATE `ProjectEnrollmentCycleParticipation`
SET `activeKey` = `enrollmentId`
WHERE `isActive` = true AND `activeKey` IS NULL;

-- Drop legacy unique constraints that incorrectly prevented multiple inactive rows
DROP INDEX `PEGM_tenant_enroll_group_active_key` ON `ProjectEnrollmentGroupMembership`;
DROP INDEX `PECP_tenant_enroll_active_key` ON `ProjectEnrollmentCycleParticipation`;

-- Create unique constraints for active rows only (activeKey is NULL for inactive rows)
CREATE UNIQUE INDEX `PEGM_tenant_activeKey_key`
  ON `ProjectEnrollmentGroupMembership` (`tenantId`, `activeKey`);

CREATE UNIQUE INDEX `PECP_tenant_activeKey_key`
  ON `ProjectEnrollmentCycleParticipation` (`tenantId`, `activeKey`);

-- Helpful indexes
CREATE INDEX `PEGM_activeKey_idx` ON `ProjectEnrollmentGroupMembership` (`activeKey`);
CREATE INDEX `PECP_activeKey_idx` ON `ProjectEnrollmentCycleParticipation` (`activeKey`);

