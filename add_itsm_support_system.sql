-- CreateEnum for ITSM
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` VARCHAR(36) NOT NULL,
  `checksum` VARCHAR(64) NOT NULL,
  `finished_at` DATETIME(3) NULL,
  `migration_name` VARCHAR(255) NOT NULL,
  `logs` TEXT NULL,
  `rolled_back_at` DATETIME(3) NULL,
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add ITSM Support System Tables
-- ITSM_Ticket
CREATE TABLE IF NOT EXISTS `itsm_tickets` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `publicId` VARCHAR(191) NOT NULL,
  `userId` BIGINT NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_USUARIO', 'RESOLVIDO', 'FECHADO', 'CANCELADO') NOT NULL DEFAULT 'ABERTO',
  `priority` ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL DEFAULT 'MEDIA',
  `category` ENUM('TECNICO', 'FUNCIONAL', 'DUVIDA', 'SUGESTAO', 'BUG', 'OUTRO') NOT NULL DEFAULT 'OUTRO',
  `userSnapshot` JSON NULL,
  `userAgent` TEXT NULL,
  `browserInfo` TEXT NULL,
  `screenSize` VARCHAR(191) NULL,
  `pageUrl` TEXT NULL,
  `errorLogs` JSON NULL,
  `assignedToUserId` BIGINT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `resolvedAt` DATETIME(3) NULL,
  `closedAt` DATETIME(3) NULL,
  UNIQUE INDEX `itsm_tickets_publicId_key`(`publicId`),
  INDEX `itsm_tickets_userId_idx`(`userId`),
  INDEX `itsm_tickets_status_idx`(`status`),
  INDEX `itsm_tickets_priority_idx`(`priority`),
  INDEX `itsm_tickets_assignedToUserId_idx`(`assignedToUserId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ITSM_Message
CREATE TABLE IF NOT EXISTS `itsm_messages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `ticketId` BIGINT NOT NULL,
  `userId` BIGINT NOT NULL,
  `message` TEXT NOT NULL,
  `isInternal` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `itsm_messages_ticketId_idx`(`ticketId`),
  INDEX `itsm_messages_userId_idx`(`userId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ITSM_Attachment
CREATE TABLE IF NOT EXISTS `itsm_attachments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `ticketId` BIGINT NOT NULL,
  `fileName` VARCHAR(191) NOT NULL,
  `fileUrl` TEXT NOT NULL,
  `fileSize` INT NULL,
  `mimeType` VARCHAR(191) NULL,
  `uploadedBy` BIGINT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `itsm_attachments_ticketId_idx`(`ticketId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ITSM_ChatLog
CREATE TABLE IF NOT EXISTS `itsm_chat_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `ticketId` BIGINT NULL,
  `userId` BIGINT NOT NULL,
  `messages` JSON NOT NULL,
  `sessionId` VARCHAR(191) NULL,
  `context` JSON NULL,
  `wasHelpful` BOOLEAN NULL,
  `ticketCreated` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `itsm_chat_logs_userId_idx`(`userId`),
  INDEX `itsm_chat_logs_sessionId_idx`(`sessionId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ITSM_QueryLog
CREATE TABLE IF NOT EXISTS `itsm_query_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `query` TEXT NOT NULL,
  `duration` INT NOT NULL,
  `success` BOOLEAN NOT NULL,
  `errorMessage` TEXT NULL,
  `userId` BIGINT NULL,
  `endpoint` VARCHAR(191) NULL,
  `method` VARCHAR(191) NULL,
  `ipAddress` VARCHAR(191) NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `itsm_query_logs_timestamp_idx`(`timestamp`),
  INDEX `itsm_query_logs_userId_idx`(`userId`),
  INDEX `itsm_query_logs_success_idx`(`success`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add Foreign Keys
ALTER TABLE `itsm_tickets` ADD CONSTRAINT `itsm_tickets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `itsm_tickets` ADD CONSTRAINT `itsm_tickets_assignedToUserId_fkey` FOREIGN KEY (`assignedToUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `itsm_messages` ADD CONSTRAINT `itsm_messages_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `itsm_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `itsm_messages` ADD CONSTRAINT `itsm_messages_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `itsm_attachments` ADD CONSTRAINT `itsm_attachments_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `itsm_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `itsm_attachments` ADD CONSTRAINT `itsm_attachments_uploadedBy_fkey` FOREIGN KEY (`uploadedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `itsm_chat_logs` ADD CONSTRAINT `itsm_chat_logs_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `itsm_tickets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `itsm_chat_logs` ADD CONSTRAINT `itsm_chat_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `itsm_query_logs` ADD CONSTRAINT `itsm_query_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
