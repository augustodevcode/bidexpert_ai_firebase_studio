-- CreateEnum para AuditAction
CREATE TYPE `AuditAction` AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'SOFT_DELETE',
  'RESTORE',
  'PUBLISH',
  'UNPUBLISH',
  'APPROVE',
  'REJECT',
  'EXPORT',
  'IMPORT'
);

-- CreateEnum para ValidationType
CREATE TYPE `ValidationType` AS ENUM (
  'REQUIRED',
  'MIN_LENGTH',
  'MAX_LENGTH',
  'PATTERN',
  'MIN_VALUE',
  'MAX_VALUE',
  'DATE_RANGE',
  'FILE_TYPE',
  'FILE_SIZE',
  'CUSTOM'
);

-- CreateEnum para ValidationSeverity
CREATE TYPE `ValidationSeverity` AS ENUM (
  'ERROR',
  'WARNING',
  'INFO'
);

-- CreateEnum para SubmissionStatus
CREATE TYPE `SubmissionStatus` AS ENUM (
  'DRAFT',
  'VALIDATING',
  'VALID',
  'INVALID',
  'SUBMITTED',
  'FAILED'
);

-- CreateTable AuditLog
CREATE TABLE `audit_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenantId` BIGINT NULL,
    `userId` BIGINT NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` BIGINT NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE', 'PUBLISH', 'UNPUBLISH', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT') NOT NULL,
    `changes` JSON NULL,
    `metadata` JSON NULL,
    `ipAddress` TEXT NULL,
    `userAgent` TEXT NULL,
    `location` TEXT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_tenantId_entityType_entityId_idx`(`tenantId`, `entityType`, `entityId`),
    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_timestamp_idx`(`timestamp`),
    INDEX `audit_logs_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ValidationRule
CREATE TABLE `validation_rules` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `entityType` VARCHAR(191) NOT NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `ruleType` ENUM('REQUIRED', 'MIN_LENGTH', 'MAX_LENGTH', 'PATTERN', 'MIN_VALUE', 'MAX_VALUE', 'DATE_RANGE', 'FILE_TYPE', 'FILE_SIZE', 'CUSTOM') NOT NULL,
    `config` JSON NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `errorMessage` TEXT NOT NULL,
    `severity` ENUM('ERROR', 'WARNING', 'INFO') NOT NULL DEFAULT 'ERROR',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `validation_rules_entityType_idx`(`entityType`),
    UNIQUE INDEX `validation_rules_entityType_fieldName_ruleType_key`(`entityType`, `fieldName`, `ruleType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable FormSubmission
CREATE TABLE `form_submissions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tenantId` BIGINT NULL,
    `userId` BIGINT NOT NULL,
    `formType` VARCHAR(191) NOT NULL,
    `entityId` BIGINT NULL,
    `status` ENUM('DRAFT', 'VALIDATING', 'VALID', 'INVALID', 'SUBMITTED', 'FAILED') NOT NULL,
    `validationScore` INTEGER NOT NULL,
    `data` JSON NOT NULL,
    `validationErrors` JSON NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `form_submissions_tenantId_formType_idx`(`tenantId`, `formType`),
    INDEX `form_submissions_userId_idx`(`userId`),
    INDEX `form_submissions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_submissions` ADD CONSTRAINT `form_submissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_submissions` ADD CONSTRAINT `form_submissions_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
