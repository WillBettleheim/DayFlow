-- AlterTable
ALTER TABLE `Project` ADD COLUMN `dueDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `task` ADD COLUMN `projectId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `task` ADD CONSTRAINT `task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
