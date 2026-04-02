/*
  Warnings:

  - You are about to drop the column `cycleId` on the `ProjectAction` table. All the data in the column will be lost.
  - You are about to drop the column `cycleParticipationId` on the `ProjectActionAttendance` table. All the data in the column will be lost.
  - You are about to drop the `Cycle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CycleAttachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CycleComment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectCycle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectEnrollmentCycleParticipation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Cycle` DROP FOREIGN KEY `Cycle_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `CycleAttachment` DROP FOREIGN KEY `CycleAttachment_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `CycleAttachment` DROP FOREIGN KEY `CycleAttachment_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `CycleAttachment` DROP FOREIGN KEY `CycleAttachment_uploadedByUserId_fkey`;

-- DropForeignKey
ALTER TABLE `CycleComment` DROP FOREIGN KEY `CycleComment_authorUserId_fkey`;

-- DropForeignKey
ALTER TABLE `CycleComment` DROP FOREIGN KEY `CycleComment_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `CycleComment` DROP FOREIGN KEY `CycleComment_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectAction` DROP FOREIGN KEY `ProjectAction_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectActionAttendance` DROP FOREIGN KEY `ProjectActionAttendance_cycleParticipationId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectCycle` DROP FOREIGN KEY `ProjectCycle_catalogCycleId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectCycle` DROP FOREIGN KEY `ProjectCycle_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectCycle` DROP FOREIGN KEY `ProjectCycle_segmentId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectCycle` DROP FOREIGN KEY `ProjectCycle_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` DROP FOREIGN KEY `ProjectEnrollmentCycleParticipation_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` DROP FOREIGN KEY `ProjectEnrollmentCycleParticipation_enrollmentId_fkey`;

-- DropForeignKey
ALTER TABLE `ProjectEnrollmentCycleParticipation` DROP FOREIGN KEY `ProjectEnrollmentCycleParticipation_tenantId_fkey`;

-- DropIndex
DROP INDEX `ProjectAction_cycleId_idx` ON `ProjectAction`;

-- DropIndex
DROP INDEX `ProjectActionAttendance_cycleParticipationId_idx` ON `ProjectActionAttendance`;

-- AlterTable
ALTER TABLE `ProjectAction` DROP COLUMN `cycleId`;

-- AlterTable
ALTER TABLE `ProjectActionAttendance` DROP COLUMN `cycleParticipationId`;

-- DropTable
DROP TABLE `Cycle`;

-- DropTable
DROP TABLE `CycleAttachment`;

-- DropTable
DROP TABLE `CycleComment`;

-- DropTable
DROP TABLE `ProjectCycle`;

-- DropTable
DROP TABLE `ProjectEnrollmentCycleParticipation`;
