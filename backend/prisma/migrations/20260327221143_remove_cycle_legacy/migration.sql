/*
  Warnings:

  - You are about to drop the column `cycleId` on the `projectaction` table. All the data in the column will be lost.
  - You are about to drop the column `cycleParticipationId` on the `projectactionattendance` table. All the data in the column will be lost.
  - You are about to drop the `cycle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cycleattachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cyclecomment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projectcycle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projectenrollmentcycleparticipation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `cycle` DROP FOREIGN KEY `Cycle_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `cycleattachment` DROP FOREIGN KEY `CycleAttachment_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `cycleattachment` DROP FOREIGN KEY `CycleAttachment_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `cycleattachment` DROP FOREIGN KEY `CycleAttachment_uploadedByUserId_fkey`;

-- DropForeignKey
ALTER TABLE `cyclecomment` DROP FOREIGN KEY `CycleComment_authorUserId_fkey`;

-- DropForeignKey
ALTER TABLE `cyclecomment` DROP FOREIGN KEY `CycleComment_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `cyclecomment` DROP FOREIGN KEY `CycleComment_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `projectaction` DROP FOREIGN KEY `ProjectAction_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `projectactionattendance` DROP FOREIGN KEY `ProjectActionAttendance_cycleParticipationId_fkey`;

-- DropForeignKey
ALTER TABLE `projectcycle` DROP FOREIGN KEY `ProjectCycle_catalogCycleId_fkey`;

-- DropForeignKey
ALTER TABLE `projectcycle` DROP FOREIGN KEY `ProjectCycle_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `projectcycle` DROP FOREIGN KEY `ProjectCycle_segmentId_fkey`;

-- DropForeignKey
ALTER TABLE `projectcycle` DROP FOREIGN KEY `ProjectCycle_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `projectenrollmentcycleparticipation` DROP FOREIGN KEY `ProjectEnrollmentCycleParticipation_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `projectenrollmentcycleparticipation` DROP FOREIGN KEY `ProjectEnrollmentCycleParticipation_enrollmentId_fkey`;

-- DropForeignKey
ALTER TABLE `projectenrollmentcycleparticipation` DROP FOREIGN KEY `ProjectEnrollmentCycleParticipation_tenantId_fkey`;

-- DropIndex
DROP INDEX `ProjectAction_cycleId_idx` ON `projectaction`;

-- DropIndex
DROP INDEX `ProjectActionAttendance_cycleParticipationId_idx` ON `projectactionattendance`;

-- AlterTable
ALTER TABLE `projectaction` DROP COLUMN `cycleId`;

-- AlterTable
ALTER TABLE `projectactionattendance` DROP COLUMN `cycleParticipationId`;

-- DropTable
DROP TABLE `cycle`;

-- DropTable
DROP TABLE `cycleattachment`;

-- DropTable
DROP TABLE `cyclecomment`;

-- DropTable
DROP TABLE `projectcycle`;

-- DropTable
DROP TABLE `projectenrollmentcycleparticipation`;
