-- CreateIndex
CREATE UNIQUE INDEX "Lot_original_lot_id_key" ON "Lot"("original_lot_id");

-- CreateIndex
CREATE INDEX "Lot_auctioneerId_idx" ON "Lot"("auctioneerId");

-- CreateIndex
CREATE INDEX "Lot_categoryId_idx" ON "Lot"("categoryId");

-- CreateIndex
CREATE INDEX "Lot_cityId_idx" ON "Lot"("cityId");

-- CreateIndex
CREATE INDEX "Lot_sellerId_idx" ON "Lot"("sellerId");

-- CreateIndex
CREATE INDEX "Lot_stateId_idx" ON "Lot"("stateId");

-- CreateIndex
CREATE INDEX "Lot_subcategoryId_idx" ON "Lot"("subcategoryId");

-- CreateIndex
CREATE INDEX "Lot_tenantId_idx" ON "Lot"("tenantId");

-- CreateIndex
CREATE INDEX "Lot_winnerId_idx" ON "Lot"("winnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_auctionId_number_key" ON "Lot"("auctionId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "LotCategory_slug_key" ON "LotCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LotCategory_name_key" ON "LotCategory"("name");

-- CreateIndex
CREATE INDEX "LotCategory_tenantId_idx" ON "LotCategory"("tenantId");

-- CreateIndex
CREATE INDEX "LotDocument_lotId_idx" ON "LotDocument"("lotId");

-- CreateIndex
CREATE INDEX "LotDocument_tenantId_idx" ON "LotDocument"("tenantId");

-- CreateIndex
CREATE INDEX "LotQuestion_auctionId_idx" ON "LotQuestion"("auctionId");

-- CreateIndex
CREATE INDEX "LotQuestion_lotId_idx" ON "LotQuestion"("lotId");

-- CreateIndex
CREATE INDEX "LotQuestion_tenantId_idx" ON "LotQuestion"("tenantId");

-- CreateIndex
CREATE INDEX "LotQuestion_userId_idx" ON "LotQuestion"("userId");

-- CreateIndex
CREATE INDEX "LotRisk_lotId_idx" ON "LotRisk"("lotId");

-- CreateIndex
CREATE INDEX "LotRisk_riskLevel_idx" ON "LotRisk"("riskLevel");

-- CreateIndex
CREATE INDEX "LotRisk_riskType_idx" ON "LotRisk"("riskType");

-- CreateIndex
CREATE INDEX "LotRisk_tenantId_idx" ON "LotRisk"("tenantId");

-- CreateIndex
CREATE INDEX "LotRisk_verifiedBy_idx" ON "LotRisk"("verifiedBy");

-- CreateIndex
CREATE INDEX "LotStagePrice_auctionId_idx" ON "LotStagePrice"("auctionId");

-- CreateIndex
CREATE INDEX "LotStagePrice_auctionStageId_idx" ON "LotStagePrice"("auctionStageId");

-- CreateIndex
CREATE INDEX "LotStagePrice_tenantId_idx" ON "LotStagePrice"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "LotStagePrice_lotId_auctionStageId_key" ON "LotStagePrice"("lotId", "auctionStageId");

-- CreateIndex
CREATE UNIQUE INDEX "MapSettings_platformSettingsId_key" ON "MapSettings"("platformSettingsId");

-- CreateIndex
CREATE INDEX "MediaItem_judicialProcessId_idx" ON "MediaItem"("judicialProcessId");

-- CreateIndex
CREATE INDEX "MediaItem_tenantId_idx" ON "MediaItem"("tenantId");

-- CreateIndex
CREATE INDEX "MediaItem_uploadedByUserId_idx" ON "MediaItem"("uploadedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MentalTriggerSettings_platformSettingsId_key" ON "MentalTriggerSettings"("platformSettingsId");

-- CreateIndex
CREATE INDEX "Notification_auctionId_idx" ON "Notification"("auctionId");

-- CreateIndex
CREATE INDEX "Notification_lotId_idx" ON "Notification"("lotId");

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_platformSettingsId_key" ON "NotificationSettings"("platformSettingsId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_email_token_key" ON "PasswordResetToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewaySettings_platformSettingsId_key" ON "PaymentGatewaySettings"("platformSettingsId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSettings_tenantId_key" ON "PlatformSettings"("tenantId");

-- CreateIndex
CREATE INDEX "PlatformSettings_logoMediaId_idx" ON "PlatformSettings"("logoMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "RealtimeSettings_platformSettingsId_key" ON "RealtimeSettings"("platformSettingsId");

-- CreateIndex
CREATE INDEX "Report_createdById_idx" ON "Report"("createdById");

-- CreateIndex
CREATE INDEX "Report_tenantId_idx" ON "Report"("tenantId");

-- CreateIndex
CREATE INDEX "Review_auctionId_idx" ON "Review"("auctionId");

-- CreateIndex
CREATE INDEX "Review_lotId_idx" ON "Review"("lotId");

-- CreateIndex
CREATE INDEX "Review_tenantId_idx" ON "Review"("tenantId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_nameNormalized_key" ON "Role"("nameNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "SectionBadgeVisibility_platformSettingsId_key" ON "SectionBadgeVisibility"("platformSettingsId");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_publicId_key" ON "Seller"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_name_key" ON "Seller"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_slug_key" ON "Seller"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_judicialBranchId_key" ON "Seller"("judicialBranchId");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_userId_key" ON "Seller"("userId");

-- CreateIndex
CREATE INDEX "Seller_tenantId_idx" ON "Seller"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "State_slug_key" ON "State"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "State_uf_key" ON "State"("uf");

-- CreateIndex
CREATE INDEX "Subcategory_parentCategoryId_idx" ON "Subcategory"("parentCategoryId");

-- CreateIndex
CREATE INDEX "Subcategory_tenantId_idx" ON "Subcategory"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_name_parentCategoryId_key" ON "Subcategory"("name", "parentCategoryId");

-- CreateIndex
CREATE INDEX "Subscriber_tenantId_idx" ON "Subscriber"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_tenantId_key" ON "Subscriber"("email", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_externalId_key" ON "Tenant"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_apiKey_key" ON "Tenant"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvoice_invoiceNumber_key" ON "TenantInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvoice_externalId_key" ON "TenantInvoice"("externalId");

-- CreateIndex
CREATE INDEX "TenantInvoice_dueDate_idx" ON "TenantInvoice"("dueDate");

-- CreateIndex
CREATE INDEX "TenantInvoice_periodStart_periodEnd_idx" ON "TenantInvoice"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "TenantInvoice_status_idx" ON "TenantInvoice"("status");

-- CreateIndex
CREATE INDEX "TenantInvoice_tenantId_idx" ON "TenantInvoice"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeColors_themeSettingsId_key" ON "ThemeColors"("themeSettingsId");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeSettings_name_key" ON "ThemeSettings"("name");

-- CreateIndex
CREATE INDEX "ThemeSettings_platformSettingsId_idx" ON "ThemeSettings"("platformSettingsId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserDocument_documentTypeId_idx" ON "UserDocument"("documentTypeId");

-- CreateIndex
CREATE INDEX "UserDocument_tenantId_idx" ON "UserDocument"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDocument_userId_documentTypeId_key" ON "UserDocument"("userId", "documentTypeId");

-- CreateIndex
CREATE INDEX "UserLotMaxBid_lotId_idx" ON "UserLotMaxBid"("lotId");

-- CreateIndex
CREATE INDEX "UserLotMaxBid_tenantId_idx" ON "UserLotMaxBid"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLotMaxBid_userId_lotId_key" ON "UserLotMaxBid"("userId", "lotId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWin_lotId_key" ON "UserWin"("lotId");

-- CreateIndex
CREATE INDEX "UserWin_tenantId_idx" ON "UserWin"("tenantId");

-- CreateIndex
CREATE INDEX "UserWin_userId_idx" ON "UserWin"("userId");

-- CreateIndex
CREATE INDEX "UsersOnRoles_roleId_idx" ON "UsersOnRoles"("roleId");

-- CreateIndex
CREATE INDEX "UsersOnTenants_tenantId_idx" ON "UsersOnTenants"("tenantId");

-- CreateIndex
CREATE INDEX "VariableIncrementRule_platformSettingsId_idx" ON "VariableIncrementRule"("platformSettingsId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMake_name_key" ON "VehicleMake"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMake_slug_key" ON "VehicleMake"("slug");

-- CreateIndex
CREATE INDEX "VehicleModel_slug_idx" ON "VehicleModel"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_makeId_name_key" ON "VehicleModel"("makeId", "name");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_entityType_entityId_idx" ON "AuditLog"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_trace_id_idx" ON "AuditLog"("trace_id");

-- CreateIndex
CREATE INDEX "BidderNotification_bidderId_idx" ON "BidderNotification"("bidderId");

-- CreateIndex
CREATE INDEX "BidderNotification_tenantId_idx" ON "BidderNotification"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BidderProfile_userId_key" ON "BidderProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BidderProfile_cpf_key" ON "BidderProfile"("cpf");

-- CreateIndex
CREATE INDEX "BidderProfile_tenantId_idx" ON "BidderProfile"("tenantId");

-- CreateIndex
CREATE INDEX "EntityViewMetrics_entityPublicId_idx" ON "EntityViewMetrics"("entityPublicId");

-- CreateIndex
CREATE INDEX "EntityViewMetrics_tenantId_idx" ON "EntityViewMetrics"("tenantId");

-- CreateIndex
CREATE INDEX "EntityViewMetrics_totalViews_idx" ON "EntityViewMetrics"("totalViews");

-- CreateIndex
CREATE INDEX "EntityViewMetrics_viewsLast24h_idx" ON "EntityViewMetrics"("viewsLast24h");

-- CreateIndex
CREATE UNIQUE INDEX "EntityViewMetrics_entityType_entityId_key" ON "EntityViewMetrics"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FormSubmission_status_idx" ON "FormSubmission"("status");

-- CreateIndex
CREATE INDEX "FormSubmission_tenantId_formType_idx" ON "FormSubmission"("tenantId", "formType");

-- CreateIndex
CREATE INDEX "FormSubmission_userId_idx" ON "FormSubmission"("userId");

-- CreateIndex
CREATE INDEX "itsm_attachments_ticketId_idx" ON "itsm_attachments"("ticketId");

-- CreateIndex
CREATE INDEX "itsm_attachments_uploadedBy_idx" ON "itsm_attachments"("uploadedBy");

-- CreateIndex
CREATE INDEX "ITSM_ChatLog_sessionId_idx" ON "ITSM_ChatLog"("sessionId");

-- CreateIndex
CREATE INDEX "ITSM_ChatLog_tenantId_idx" ON "ITSM_ChatLog"("tenantId");

-- CreateIndex
CREATE INDEX "ITSM_ChatLog_ticketId_idx" ON "ITSM_ChatLog"("ticketId");

-- CreateIndex
CREATE INDEX "ITSM_ChatLog_userId_idx" ON "ITSM_ChatLog"("userId");

-- CreateIndex
CREATE INDEX "itsm_messages_ticketId_idx" ON "itsm_messages"("ticketId");

-- CreateIndex
CREATE INDEX "itsm_messages_userId_idx" ON "itsm_messages"("userId");

-- CreateIndex
CREATE INDEX "itsm_query_logs_success_idx" ON "itsm_query_logs"("success");

-- CreateIndex
CREATE INDEX "itsm_query_logs_timestamp_idx" ON "itsm_query_logs"("timestamp");

-- CreateIndex
CREATE INDEX "itsm_query_logs_userId_idx" ON "itsm_query_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ITSM_Ticket_publicId_key" ON "ITSM_Ticket"("publicId");

-- CreateIndex
CREATE INDEX "ITSM_Ticket_assignedToUserId_idx" ON "ITSM_Ticket"("assignedToUserId");

-- CreateIndex
CREATE INDEX "ITSM_Ticket_priority_idx" ON "ITSM_Ticket"("priority");

-- CreateIndex
CREATE INDEX "ITSM_Ticket_status_idx" ON "ITSM_Ticket"("status");

-- CreateIndex
CREATE INDEX "ITSM_Ticket_tenantId_idx" ON "ITSM_Ticket"("tenantId");

-- CreateIndex
CREATE INDEX "ITSM_Ticket_userId_idx" ON "ITSM_Ticket"("userId");

-- CreateIndex
CREATE INDEX "ParticipationHistory_bidderId_idx" ON "ParticipationHistory"("bidderId");

-- CreateIndex
CREATE INDEX "ParticipationHistory_tenantId_idx" ON "ParticipationHistory"("tenantId");

-- CreateIndex
CREATE INDEX "PaymentMethod_bidderId_idx" ON "PaymentMethod"("bidderId");

-- CreateIndex
CREATE INDEX "PaymentMethod_tenantId_idx" ON "PaymentMethod"("tenantId");

-- CreateIndex
CREATE INDEX "validation_rules_entityType_idx" ON "validation_rules"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "validation_rules_entityType_fieldName_ruleType_key" ON "validation_rules"("entityType", "fieldName", "ruleType");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorEvent_eventId_key" ON "VisitorEvent"("eventId");

-- CreateIndex
CREATE INDEX "VisitorEvent_entityPublicId_idx" ON "VisitorEvent"("entityPublicId");

-- CreateIndex
CREATE INDEX "VisitorEvent_entityType_entityId_idx" ON "VisitorEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "VisitorEvent_eventType_idx" ON "VisitorEvent"("eventType");

-- CreateIndex
CREATE INDEX "VisitorEvent_sessionId_idx" ON "VisitorEvent"("sessionId");

-- CreateIndex
CREATE INDEX "VisitorEvent_timestamp_idx" ON "VisitorEvent"("timestamp");

-- CreateIndex
CREATE INDEX "VisitorEvent_visitorId_idx" ON "VisitorEvent"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorSession_sessionId_key" ON "VisitorSession"("sessionId");

-- CreateIndex
CREATE INDEX "VisitorSession_sessionId_idx" ON "VisitorSession"("sessionId");

-- CreateIndex
CREATE INDEX "VisitorSession_startedAt_idx" ON "VisitorSession"("startedAt");

-- CreateIndex
CREATE INDEX "VisitorSession_visitorId_idx" ON "VisitorSession"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_visitorId_key" ON "Visitor"("visitorId");

-- CreateIndex
CREATE INDEX "Visitor_country_idx" ON "Visitor"("country");

-- CreateIndex
CREATE INDEX "Visitor_lastVisitAt_idx" ON "Visitor"("lastVisitAt");

-- CreateIndex
CREATE INDEX "Visitor_userId_idx" ON "Visitor"("userId");

-- CreateIndex
CREATE INDEX "WonLot_bidderId_idx" ON "WonLot"("bidderId");

-- CreateIndex
CREATE INDEX "WonLot_tenantId_idx" ON "WonLot"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "audit_configs_entity_key" ON "audit_configs"("entity");

-- CreateIndex
CREATE UNIQUE INDEX "_AuctionToCourt_AB_unique" ON "_AuctionToCourt"("A", "B");

-- CreateIndex
CREATE INDEX "_AuctionToCourt_B_index" ON "_AuctionToCourt"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AuctionToJudicialBranch_AB_unique" ON "_AuctionToJudicialBranch"("A", "B");

-- CreateIndex
CREATE INDEX "_AuctionToJudicialBranch_B_index" ON "_AuctionToJudicialBranch"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AuctionToJudicialDistrict_AB_unique" ON "_AuctionToJudicialDistrict"("A", "B");

-- CreateIndex
CREATE INDEX "_AuctionToJudicialDistrict_B_index" ON "_AuctionToJudicialDistrict"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_InstallmentPaymentToLot_AB_unique" ON "_InstallmentPaymentToLot"("A", "B");

-- CreateIndex
CREATE INDEX "_InstallmentPaymentToLot_B_index" ON "_InstallmentPaymentToLot"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_JudicialProcessToLot_AB_unique" ON "_JudicialProcessToLot"("A", "B");

-- CreateIndex
CREATE INDEX "_JudicialProcessToLot_B_index" ON "_JudicialProcessToLot"("B");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LotCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_judicialProcessId_fkey" FOREIGN KEY ("judicialProcessId") REFERENCES "JudicialProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_occupationUpdatedBy_fkey" FOREIGN KEY ("occupationUpdatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMedia" ADD CONSTRAINT "AssetMedia_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMedia" ADD CONSTRAINT "AssetMedia_mediaItemId_fkey" FOREIGN KEY ("mediaItemId") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMedia" ADD CONSTRAINT "AssetMedia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetsOnLots" ADD CONSTRAINT "AssetsOnLots_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetsOnLots" ADD CONSTRAINT "AssetsOnLots_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetsOnLots" ADD CONSTRAINT "AssetsOnLots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_auctioneerId_fkey" FOREIGN KEY ("auctioneerId") REFERENCES "Auctioneer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LotCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_judicialProcessId_fkey" FOREIGN KEY ("judicialProcessId") REFERENCES "JudicialProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_originalAuctionId_fkey" FOREIGN KEY ("originalAuctionId") REFERENCES "Auction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionHabilitation" ADD CONSTRAINT "AuctionHabilitation_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionHabilitation" ADD CONSTRAINT "AuctionHabilitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionHabilitation" ADD CONSTRAINT "AuctionHabilitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionStage" ADD CONSTRAINT "AuctionStage_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionStage" ADD CONSTRAINT "AuctionStage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auctioneer" ADD CONSTRAINT "Auctioneer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auctioneer" ADD CONSTRAINT "Auctioneer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiddingSettings" ADD CONSTRAINT "BiddingSettings_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectSaleOffer" ADD CONSTRAINT "DirectSaleOffer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LotCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectSaleOffer" ADD CONSTRAINT "DirectSaleOffer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectSaleOffer" ADD CONSTRAINT "DirectSaleOffer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdMasks" ADD CONSTRAINT "IdMasks_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPayment" ADD CONSTRAINT "InstallmentPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPayment" ADD CONSTRAINT "InstallmentPayment_userWinId_fkey" FOREIGN KEY ("userWinId") REFERENCES "UserWin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudicialBranch" ADD CONSTRAINT "JudicialBranch_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "JudicialDistrict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudicialDistrict" ADD CONSTRAINT "JudicialDistrict_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudicialDistrict" ADD CONSTRAINT "JudicialDistrict_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudicialParty" ADD CONSTRAINT "JudicialParty_processId_fkey" FOREIGN KEY ("processId") REFERENCES "JudicialProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudicialParty" ADD CONSTRAINT "JudicialParty_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudicialProcess" ADD CONSTRAINT "JudicialProcess_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "JudicialBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudicialProcess" ADD CONSTRAINT "JudicialProcess_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudicialProcess" ADD CONSTRAINT "JudicialProcess_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "JudicialDistrict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudicialProcess" ADD CONSTRAINT "JudicialProcess_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudicialProcess" ADD CONSTRAINT "JudicialProcess_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_auctioneerId_fkey" FOREIGN KEY ("auctioneerId") REFERENCES "Auctioneer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LotCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_original_lot_id_fkey" FOREIGN KEY ("original_lot_id") REFERENCES "Lot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotCategory" ADD CONSTRAINT "LotCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotDocument" ADD CONSTRAINT "LotDocument_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotDocument" ADD CONSTRAINT "LotDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotQuestion" ADD CONSTRAINT "LotQuestion_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotQuestion" ADD CONSTRAINT "LotQuestion_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotQuestion" ADD CONSTRAINT "LotQuestion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotQuestion" ADD CONSTRAINT "LotQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotRisk" ADD CONSTRAINT "LotRisk_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotRisk" ADD CONSTRAINT "LotRisk_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotRisk" ADD CONSTRAINT "LotRisk_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotStagePrice" ADD CONSTRAINT "LotStagePrice_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotStagePrice" ADD CONSTRAINT "LotStagePrice_auctionStageId_fkey" FOREIGN KEY ("auctionStageId") REFERENCES "AuctionStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotStagePrice" ADD CONSTRAINT "LotStagePrice_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotStagePrice" ADD CONSTRAINT "LotStagePrice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapSettings" ADD CONSTRAINT "MapSettings_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_judicialProcessId_fkey" FOREIGN KEY ("judicialProcessId") REFERENCES "JudicialProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentalTriggerSettings" ADD CONSTRAINT "MentalTriggerSettings_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentGatewaySettings" ADD CONSTRAINT "PaymentGatewaySettings_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSettings" ADD CONSTRAINT "PlatformSettings_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "MediaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSettings" ADD CONSTRAINT "PlatformSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealtimeSettings" ADD CONSTRAINT "RealtimeSettings_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionBadgeVisibility" ADD CONSTRAINT "SectionBadgeVisibility_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_judicialBranchId_fkey" FOREIGN KEY ("judicialBranchId") REFERENCES "JudicialBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "LotCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvoice" ADD CONSTRAINT "TenantInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeColors" ADD CONSTRAINT "ThemeColors_themeSettingsId_fkey" FOREIGN KEY ("themeSettingsId") REFERENCES "ThemeSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeSettings" ADD CONSTRAINT "ThemeSettings_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLotMaxBid" ADD CONSTRAINT "UserLotMaxBid_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLotMaxBid" ADD CONSTRAINT "UserLotMaxBid_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLotMaxBid" ADD CONSTRAINT "UserLotMaxBid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWin" ADD CONSTRAINT "UserWin_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWin" ADD CONSTRAINT "UserWin_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWin" ADD CONSTRAINT "UserWin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnRoles" ADD CONSTRAINT "UsersOnRoles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnRoles" ADD CONSTRAINT "UsersOnRoles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnTenants" ADD CONSTRAINT "UsersOnTenants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsersOnTenants" ADD CONSTRAINT "UsersOnTenants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableIncrementRule" ADD CONSTRAINT "VariableIncrementRule_platformSettingsId_fkey" FOREIGN KEY ("platformSettingsId") REFERENCES "PlatformSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "VehicleMake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidderNotification" ADD CONSTRAINT "BidderNotification_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "BidderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidderNotification" ADD CONSTRAINT "BidderNotification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidderProfile" ADD CONSTRAINT "BidderProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidderProfile" ADD CONSTRAINT "BidderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itsm_attachments" ADD CONSTRAINT "itsm_attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ITSM_Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itsm_attachments" ADD CONSTRAINT "itsm_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSM_ChatLog" ADD CONSTRAINT "ITSM_ChatLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSM_ChatLog" ADD CONSTRAINT "ITSM_ChatLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ITSM_Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSM_ChatLog" ADD CONSTRAINT "ITSM_ChatLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itsm_messages" ADD CONSTRAINT "itsm_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ITSM_Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itsm_messages" ADD CONSTRAINT "itsm_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itsm_query_logs" ADD CONSTRAINT "itsm_query_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSM_Ticket" ADD CONSTRAINT "ITSM_Ticket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSM_Ticket" ADD CONSTRAINT "ITSM_Ticket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITSM_Ticket" ADD CONSTRAINT "ITSM_Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationHistory" ADD CONSTRAINT "ParticipationHistory_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "BidderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationHistory" ADD CONSTRAINT "ParticipationHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "BidderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorEvent" ADD CONSTRAINT "VisitorEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VisitorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorEvent" ADD CONSTRAINT "VisitorEvent_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorSession" ADD CONSTRAINT "VisitorSession_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WonLot" ADD CONSTRAINT "WonLot_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "BidderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WonLot" ADD CONSTRAINT "WonLot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuctionToCourt" ADD CONSTRAINT "_AuctionToCourt_A_fkey" FOREIGN KEY ("A") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuctionToCourt" ADD CONSTRAINT "_AuctionToCourt_B_fkey" FOREIGN KEY ("B") REFERENCES "Court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuctionToJudicialBranch" ADD CONSTRAINT "_AuctionToJudicialBranch_A_fkey" FOREIGN KEY ("A") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuctionToJudicialBranch" ADD CONSTRAINT "_AuctionToJudicialBranch_B_fkey" FOREIGN KEY ("B") REFERENCES "JudicialBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuctionToJudicialDistrict" ADD CONSTRAINT "_AuctionToJudicialDistrict_A_fkey" FOREIGN KEY ("A") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AuctionToJudicialDistrict" ADD CONSTRAINT "_AuctionToJudicialDistrict_B_fkey" FOREIGN KEY ("B") REFERENCES "JudicialDistrict"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstallmentPaymentToLot" ADD CONSTRAINT "_InstallmentPaymentToLot_A_fkey" FOREIGN KEY ("A") REFERENCES "InstallmentPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InstallmentPaymentToLot" ADD CONSTRAINT "_InstallmentPaymentToLot_B_fkey" FOREIGN KEY ("B") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JudicialProcessToLot" ADD CONSTRAINT "_JudicialProcessToLot_A_fkey" FOREIGN KEY ("A") REFERENCES "JudicialProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JudicialProcessToLot" ADD CONSTRAINT "_JudicialProcessToLot_B_fkey" FOREIGN KEY ("B") REFERENCES "Lot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

