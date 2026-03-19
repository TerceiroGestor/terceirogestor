-- CreateEnum
CREATE TABLE IF NOT EXISTS `_ActionPeopleParticipationRole` (
  `value` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `_ActionPeopleParticipationRole` (`value`) VALUES
  ('PARTICIPANTE'),
  ('FACILITADOR'),
  ('APOIO'),
  ('VOLUNTARIO'),
  ('RESPONSAVEL_TECNICO'),
  ('CONVIDADO');

-- AlterTable
CREATE TABLE `ProjectActionPeopleParticipation` (
  `id` CHAR(36) NOT NULL,
  `tenantId` CHAR(36) NOT NULL,
  `actionId` CHAR(36) NOT NULL,
  `personId` CHAR(36) NOT NULL,
  `enrollmentId` CHAR(36) NULL,
  `role` ENUM('PARTICIPANTE', 'FACILITADOR', 'APOIO', 'VOLUNTARIO', 'RESPONSAVEL_TECNICO', 'CONVIDADO') NOT NULL DEFAULT 'PARTICIPANTE',
  `activeKey` VARCHAR(120) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endsAt` DATETIME(3) NULL,
  `deletedAt` DATETIME(3) NULL,
  `internalNotes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `ProjectActionPeopleParticipation_tenantId_activeKey_key`(`tenantId`, `activeKey`),
  INDEX `ProjectActionPeopleParticipation_tenantId_idx`(`tenantId`),
  INDEX `ProjectActionPeopleParticipation_actionId_idx`(`actionId`),
  INDEX `ProjectActionPeopleParticipation_personId_idx`(`personId`),
  INDEX `ProjectActionPeopleParticipation_enrollmentId_idx`(`enrollmentId`),
  INDEX `ProjectActionPeopleParticipation_role_idx`(`role`),
  INDEX `ProjectActionPeopleParticipation_activeKey_idx`(`activeKey`),
  INDEX `ProjectActionPeopleParticipation_isActive_idx`(`isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectActionPeopleParticipation`
  ADD CONSTRAINT `ProjectActionPeopleParticipation_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjectActionPeopleParticipation`
  ADD CONSTRAINT `ProjectActionPeopleParticipation_actionId_fkey`
  FOREIGN KEY (`actionId`) REFERENCES `ProjectAction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjectActionPeopleParticipation`
  ADD CONSTRAINT `ProjectActionPeopleParticipation_personId_fkey`
  FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ProjectActionPeopleParticipation`
  ADD CONSTRAINT `ProjectActionPeopleParticipation_enrollmentId_fkey`
  FOREIGN KEY (`enrollmentId`) REFERENCES `ProjectEnrollment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
