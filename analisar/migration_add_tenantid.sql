-- AlterTable
ALTER TABLE `AuctionStage` MODIFY `startDate` datetime NOT NULL,
    MODIFY `endDate` datetime NOT NULL;

-- CreateIndex
CREATE INDEX `Lot_auctioneerId_fkey` ON `Lot`(`auctioneerId` ASC);

-- CreateIndex
CREATE INDEX `Lot_categoryId_fkey` ON `Lot`(`categoryId` ASC);

-- CreateIndex
CREATE INDEX `Lot_cityId_fkey` ON `Lot`(`cityId` ASC);

-- CreateIndex
CREATE INDEX `Lot_sellerId_fkey` ON `Lot`(`sellerId` ASC);

-- CreateIndex
CREATE INDEX `Lot_stateId_fkey` ON `Lot`(`stateId` ASC);

-- CreateIndex
CREATE INDEX `Lot_subcategoryId_fkey` ON `Lot`(`subcategoryId` ASC);

-- CreateIndex
CREATE INDEX `Lot_tenantId_fkey` ON `Lot`(`tenantId` ASC);

-- CreateIndex
CREATE INDEX `Lot_winnerId_fkey` ON `Lot`(`winnerId` ASC);

-- CreateIndex
CREATE INDEX `Asset_categoryId_fkey` ON `Asset`(`categoryId` ASC);

-- CreateIndex
CREATE INDEX `Asset_judicialProcessId_fkey` ON `Asset`(`judicialProcessId` ASC);

-- CreateIndex
CREATE INDEX `Asset_sellerId_fkey` ON `Asset`(`sellerId` ASC);

-- CreateIndex
CREATE INDEX `Asset_subcategoryId_fkey` ON `Asset`(`subcategoryId` ASC);

-- CreateIndex
CREATE INDEX `Asset_tenantId_fkey` ON `Asset`(`tenantId` ASC);

-- CreateIndex
CREATE INDEX `AssetsOnLots_assetId_fkey` ON `AssetsOnLots`(`assetId` ASC);

-- CreateIndex
CREATE INDEX `Auction_categoryId_fkey` ON `Auction`(`categoryId` ASC);

-- CreateIndex
CREATE INDEX `Auction_cityId_fkey` ON `Auction`(`cityId` ASC);

-- CreateIndex
CREATE INDEX `Auction_judicialProcessId_fkey` ON `Auction`(`judicialProcessId` ASC);

-- CreateIndex
CREATE INDEX `Auction_stateId_fkey` ON `Auction`(`stateId` ASC);

-- CreateIndex
CREATE INDEX `Auction_tenantId_fkey` ON `Auction`(`tenantId` ASC);

-- CreateIndex
CREATE INDEX `LotStagePrice_auctionStageId_fkey` ON `LotStagePrice`(`auctionStageId` ASC);

-- CreateIndex
CREATE INDEX `JudicialProcess_branchId_fkey` ON `JudicialProcess`(`branchId` ASC);

-- CreateIndex
CREATE INDEX `JudicialProcess_courtId_fkey` ON `JudicialProcess`(`courtId` ASC);

-- CreateIndex
CREATE INDEX `JudicialProcess_districtId_fkey` ON `JudicialProcess`(`districtId` ASC);

-- CreateIndex
CREATE INDEX `JudicialProcess_sellerId_fkey` ON `JudicialProcess`(`sellerId` ASC);

-- CreateIndex
CREATE INDEX `JudicialProcess_tenantId_fkey` ON `JudicialProcess`(`tenantId` ASC);

-- CreateIndex
CREATE INDEX `Seller_tenantId_fkey` ON `Seller`(`tenantId` ASC);

-- CreateIndex
CREATE INDEX `Auctioneer_tenantId_fkey` ON `Auctioneer`(`tenantId` ASC);

-- CreateIndex
CREATE INDEX `JudicialDistrict_courtId_fkey` ON `JudicialDistrict`(`courtId` ASC);

-- CreateIndex
CREATE INDEX `JudicialDistrict_stateId_fkey` ON `JudicialDistrict`(`stateId` ASC);

-- CreateIndex
CREATE INDEX `JudicialBranch_districtId_fkey` ON `JudicialBranch`(`districtId` ASC);

-- CreateIndex
CREATE INDEX `City_stateId_fkey` ON `City`(`stateId` ASC);

-- CreateIndex
CREATE INDEX `Bid_auctionId_fkey` ON `Bid`(`auctionId` ASC);

-- CreateIndex
CREATE INDEX `Bid_tenantId_fkey` ON `Bid`(`tenantId` ASC);

-- CreateIndex
CREATE INDEX `Subcategory_parentCategoryId_fkey` ON `Subcategory`(`parentCategoryId` ASC);

-- CreateIndex
CREATE INDEX `DirectSaleOffer_categoryId_fkey` ON `DirectSaleOffer`(`categoryId` ASC);

-- CreateIndex
CREATE INDEX `DirectSaleOffer_sellerId_fkey` ON `DirectSaleOffer`(`sellerId` ASC);

-- CreateIndex
CREATE INDEX `DirectSaleOffer_tenantId_fkey` ON `DirectSaleOffer`(`tenantId` ASC);

-- CreateIndex
CREATE INDEX `Notification_auctionId_fkey` ON `Notification`(`auctionId` ASC);

-- CreateIndex
CREATE INDEX `Notification_lotId_fkey` ON `Notification`(`lotId` ASC);

-- CreateIndex
CREATE INDEX `Notification_tenantId_fkey` ON `Notification`(`tenantId` ASC);

-- CreateIndex
CREATE INDEX `Review_auctionId_fkey` ON `Review`(`auctionId` ASC);

-- CreateIndex
CREATE INDEX `Review_userId_fkey` ON `Review`(`userId` ASC);

-- CreateIndex
CREATE INDEX `LotQuestion_auctionId_fkey` ON `LotQuestion`(`auctionId` ASC);

-- CreateIndex
CREATE INDEX `LotQuestion_userId_fkey` ON `LotQuestion`(`userId` ASC);

-- CreateIndex
CREATE INDEX `MediaItem_judicialProcessId_fkey` ON `MediaItem`(`judicialProcessId` ASC);

-- CreateIndex
CREATE INDEX `MediaItem_uploadedByUserId_fkey` ON `MediaItem`(`uploadedByUserId` ASC);

-- CreateIndex
CREATE INDEX `ThemeSettings_platformSettingsId_fkey` ON `ThemeSettings`(`platformSettingsId` ASC);

-- CreateIndex
CREATE INDEX `VariableIncrementRule_platformSettingsId_fkey` ON `VariableIncrementRule`(`platformSettingsId` ASC);

-- CreateIndex
CREATE INDEX `Report_createdById_fkey` ON `Report`(`createdById` ASC);

-- CreateIndex
CREATE INDEX `Report_tenantId_fkey` ON `Report`(`tenantId` ASC);

-- CreateIndex
CREATE INDEX `Subscriber_tenantId_fkey` ON `Subscriber`(`tenantId` ASC);

-- CreateIndex
CREATE INDEX `won_lots_bidderId_fkey` ON `won_lots`(`bidderId` ASC);

-- CreateIndex
CREATE INDEX `bidder_notifications_bidderId_fkey` ON `bidder_notifications`(`bidderId` ASC);

-- CreateIndex
CREATE INDEX `payment_methods_bidderId_fkey` ON `payment_methods`(`bidderId` ASC);

-- CreateIndex
CREATE INDEX `participation_history_bidderId_fkey` ON `participation_history`(`bidderId` ASC);

-- CreateIndex
CREATE INDEX `itsm_attachments_uploadedBy_fkey` ON `itsm_attachments`(`uploadedBy` ASC);

-- CreateIndex
CREATE INDEX `itsm_chat_logs_ticketId_fkey` ON `itsm_chat_logs`(`ticketId` ASC);

