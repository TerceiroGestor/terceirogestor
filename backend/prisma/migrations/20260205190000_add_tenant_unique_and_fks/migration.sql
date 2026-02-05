-- Add unique constraint for Tenant.name
ALTER TABLE `Tenant` ADD UNIQUE INDEX `Tenant_name_key`(`name`);

-- Add foreign keys for tenantId in join tables
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
