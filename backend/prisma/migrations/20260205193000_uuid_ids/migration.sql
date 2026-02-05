-- Drop foreign keys to allow type changes
ALTER TABLE `UserRole` DROP FOREIGN KEY `UserRole_userId_fkey`;
ALTER TABLE `UserRole` DROP FOREIGN KEY `UserRole_roleId_fkey`;
ALTER TABLE `UserRole` DROP FOREIGN KEY `UserRole_tenantId_fkey`;
ALTER TABLE `RolePermission` DROP FOREIGN KEY `RolePermission_roleId_fkey`;
ALTER TABLE `RolePermission` DROP FOREIGN KEY `RolePermission_permissionId_fkey`;
ALTER TABLE `RolePermission` DROP FOREIGN KEY `RolePermission_tenantId_fkey`;
ALTER TABLE `User` DROP FOREIGN KEY `User_tenantId_fkey`;
ALTER TABLE `Role` DROP FOREIGN KEY `Role_tenantId_fkey`;
ALTER TABLE `Person` DROP FOREIGN KEY `Person_tenantId_fkey`;

-- Clear data to avoid legacy IDs exceeding CHAR(36)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `UserRole`;
TRUNCATE TABLE `RolePermission`;
TRUNCATE TABLE `User`;
TRUNCATE TABLE `Role`;
TRUNCATE TABLE `Permission`;
TRUNCATE TABLE `Person`;
TRUNCATE TABLE `Tenant`;
SET FOREIGN_KEY_CHECKS = 1;

-- Update primary and foreign key column types to UUID (CHAR(36))
ALTER TABLE `Tenant` MODIFY `id` CHAR(36) NOT NULL;

ALTER TABLE `User`
  MODIFY `id` CHAR(36) NOT NULL,
  MODIFY `tenantId` CHAR(36) NOT NULL;

ALTER TABLE `Role`
  MODIFY `id` CHAR(36) NOT NULL,
  MODIFY `tenantId` CHAR(36) NOT NULL;

ALTER TABLE `Permission` MODIFY `id` CHAR(36) NOT NULL;

ALTER TABLE `RolePermission`
  MODIFY `id` CHAR(36) NOT NULL,
  MODIFY `tenantId` CHAR(36) NOT NULL,
  MODIFY `roleId` CHAR(36) NOT NULL,
  MODIFY `permissionId` CHAR(36) NOT NULL;

ALTER TABLE `UserRole`
  MODIFY `id` CHAR(36) NOT NULL,
  MODIFY `tenantId` CHAR(36) NOT NULL,
  MODIFY `userId` CHAR(36) NOT NULL,
  MODIFY `roleId` CHAR(36) NOT NULL;

ALTER TABLE `Person`
  MODIFY `id` CHAR(36) NOT NULL,
  MODIFY `tenantId` CHAR(36) NOT NULL;

-- Recreate foreign keys
ALTER TABLE `User` ADD CONSTRAINT `User_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Role` ADD CONSTRAINT `Role_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Person` ADD CONSTRAINT `Person_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
