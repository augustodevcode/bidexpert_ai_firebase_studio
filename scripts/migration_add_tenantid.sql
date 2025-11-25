-- Migration: Add tenantId to multi-tenant tables
-- Date: 2024-11-25
-- Purpose: Complete multi-tenant isolation

-- 1. AuctionStage
ALTER TABLE `AuctionStage` 
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `status`;

ALTER TABLE `AuctionStage`
ADD INDEX `AuctionStage_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `AuctionStage_tenantId_fkey` 
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. LotStagePrice
ALTER TABLE `LotStagePrice`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `bidIncrement`;

ALTER TABLE `LotStagePrice`
ADD INDEX `LotStagePrice_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `LotStagePrice_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. JudicialParty
ALTER TABLE `JudicialParty`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `processId`;

ALTER TABLE `JudicialParty`
ADD INDEX `JudicialParty_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `JudicialParty_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. AssetsOnLots
ALTER TABLE `AssetsOnLots`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `assignedBy`;

ALTER TABLE `AssetsOnLots`
ADD INDEX `AssetsOnLots_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `AssetsOnLots_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. AssetMedia
ALTER TABLE `AssetMedia`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `displayOrder`;

ALTER TABLE `AssetMedia`
ADD INDEX `AssetMedia_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `AssetMedia_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. UserWin
ALTER TABLE `UserWin`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `invoiceUrl`;

ALTER TABLE `UserWin`
ADD INDEX `UserWin_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `UserWin_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. InstallmentPayment
ALTER TABLE `InstallmentPayment`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `transactionId`;

ALTER TABLE `InstallmentPayment`
ADD INDEX `InstallmentPayment_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `InstallmentPayment_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. UserLotMaxBid
ALTER TABLE `UserLotMaxBid`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `createdAt`;

ALTER TABLE `UserLotMaxBid`
ADD INDEX `UserLotMaxBid_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `UserLotMaxBid_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. AuctionHabilitation
ALTER TABLE `AuctionHabilitation`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `habilitatedAt`;

ALTER TABLE `AuctionHabilitation`
ADD INDEX `AuctionHabilitation_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `AuctionHabilitation_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Review
ALTER TABLE `Review`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `userDisplayName`;

ALTER TABLE `Review`
ADD INDEX `Review_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `Review_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 11. LotQuestion
ALTER TABLE `LotQuestion`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `answeredByUserDisplayName`;

ALTER TABLE `LotQuestion`
ADD INDEX `LotQuestion_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `LotQuestion_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 12. MediaItem (nullable)
ALTER TABLE `MediaItem`
ADD COLUMN `tenantId` BIGINT NULL AFTER `linkedLotIds`;

ALTER TABLE `MediaItem`
ADD INDEX `MediaItem_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `MediaItem_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 13. UserDocument (nullable)
ALTER TABLE `UserDocument`
ADD COLUMN `tenantId` BIGINT NULL AFTER `rejectionReason`;

ALTER TABLE `UserDocument`
ADD INDEX `UserDocument_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `UserDocument_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 14. LotCategory (nullable - supports global/tenant-specific)
ALTER TABLE `LotCategory`
ADD COLUMN `isGlobal` BOOLEAN NOT NULL DEFAULT TRUE AFTER `hasSubcategories`,
ADD COLUMN `tenantId` BIGINT NULL AFTER `isGlobal`;

ALTER TABLE `LotCategory`
ADD INDEX `LotCategory_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `LotCategory_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 15. Subcategory (nullable - supports global/tenant-specific)  
ALTER TABLE `Subcategory`
ADD COLUMN `isGlobal` BOOLEAN NOT NULL DEFAULT TRUE AFTER `dataAiHintIcon`,
ADD COLUMN `tenantId` BIGINT NULL AFTER `isGlobal`;

ALTER TABLE `Subcategory`
ADD INDEX `Subcategory_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `Subcategory_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 16. bidder_profiles (nullable)
ALTER TABLE `bidder_profiles`
ADD COLUMN `tenantId` BIGINT NULL AFTER `updatedAt`;

ALTER TABLE `bidder_profiles`
ADD INDEX `bidder_profiles_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `bidder_profiles_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 17. won_lots
ALTER TABLE `won_lots`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `updatedAt`;

ALTER TABLE `won_lots`
ADD INDEX `won_lots_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `won_lots_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 18. bidder_notifications (nullable)
ALTER TABLE `bidder_notifications`
ADD COLUMN `tenantId` BIGINT NULL AFTER `createdAt`;

ALTER TABLE `bidder_notifications`
ADD INDEX `bidder_notifications_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `bidder_notifications_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 19. payment_methods (nullable)
ALTER TABLE `payment_methods`
ADD COLUMN `tenantId` BIGINT NULL AFTER `updatedAt`;

ALTER TABLE `payment_methods`
ADD INDEX `payment_methods_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `payment_methods_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 20. participation_history
ALTER TABLE `participation_history`
ADD COLUMN `tenantId` BIGINT NOT NULL AFTER `createdAt`;

ALTER TABLE `participation_history`
ADD INDEX `participation_history_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `participation_history_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 21. itsm_tickets (nullable)
ALTER TABLE `itsm_tickets`
ADD COLUMN `tenantId` BIGINT NULL AFTER `closedAt`;

ALTER TABLE `itsm_tickets`
ADD INDEX `itsm_tickets_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `itsm_tickets_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 22. itsm_chat_logs (nullable)
ALTER TABLE `itsm_chat_logs`
ADD COLUMN `tenantId` BIGINT NULL AFTER `updatedAt`;

ALTER TABLE `itsm_chat_logs`
ADD INDEX `itsm_chat_logs_tenantId_idx` (`tenantId`),
ADD CONSTRAINT `itsm_chat_logs_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
