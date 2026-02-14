    "updatedAt" TIMESTAMP(3),
    "supportAddress" TEXT,
    "supportBusinessHours" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "supportWhatsApp" TEXT,
    "logoMediaId" BIGINT,
    "themeColorsDark" JSONB,
    "themeColorsLight" JSONB,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealtimeSettings" (
    "id" BIGSERIAL NOT NULL,
    "platformSettingsId" BIGINT NOT NULL,
    "blockchainEnabled" BOOLEAN NOT NULL DEFAULT false,
    "blockchainNetwork" TEXT NOT NULL DEFAULT 'NONE',
    "softCloseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "softCloseMinutes" INTEGER NOT NULL DEFAULT 5,
    "lawyerPortalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lawyerMonetizationModel" TEXT NOT NULL DEFAULT 'SUBSCRIPTION',
    "lawyerSubscriptionPrice" INTEGER,
    "lawyerPerUsePrice" INTEGER,
    "lawyerRevenueSharePercent" DECIMAL(5,2),

    CONSTRAINT "RealtimeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "definition" JSONB NOT NULL,
    "tenantId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" BIGINT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" BIGSERIAL NOT NULL,
    "lotId" BIGINT NOT NULL,
    "auctionId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userDisplayName" TEXT,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionBadgeVisibility" (
    "id" BIGSERIAL NOT NULL,
    "platformSettingsId" BIGINT NOT NULL,
    "searchGrid" JSONB,
    "lotDetail" JSONB,

    CONSTRAINT "SectionBadgeVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seller" (
    "id" BIGSERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "logoMediaId" BIGINT,
    "dataAiHintLogo" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contactName" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "cityId" BIGINT,
    "stateId" BIGINT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "slug" TEXT NOT NULL,
    "isJudicial" BOOLEAN NOT NULL DEFAULT false,
    "judicialBranchId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" BIGINT NOT NULL,
    "userId" BIGINT,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" BIGSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uf" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentCategoryId" BIGINT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "iconUrl" TEXT,
    "iconMediaId" BIGINT,
    "dataAiHintIcon" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" BIGINT,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "domain" TEXT,
    "resolutionStrategy" "Tenant_resolutionStrategy" NOT NULL DEFAULT 'SUBDOMAIN',
    "customDomainVerified" BOOLEAN NOT NULL DEFAULT false,
    "customDomainVerifyToken" VARCHAR(64),
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "trialStartedAt" TIMESTAMP(3),
    "trialExpiresAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "suspendedReason" TEXT,
    "planId" VARCHAR(50),
    "maxUsers" INTEGER DEFAULT 5,
    "maxStorageBytes" BIGINT DEFAULT 1073741824,
    "maxAuctions" INTEGER DEFAULT 10,
    "externalId" VARCHAR(100),
    "apiKey" VARCHAR(64),
    "webhookUrl" TEXT,
    "webhookSecret" VARCHAR(64),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantInvoice" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" BIGINT NOT NULL,
    "invoiceNumber" VARCHAR(50) NOT NULL,
    "externalId" VARCHAR(100),
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "TenantInvoice_status" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "lineItems" JSONB,
    "paymentMethod" VARCHAR(50),
    "paymentReference" VARCHAR(100),
    "invoiceUrl" TEXT,
    "receiptUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeColors" (
    "id" BIGSERIAL NOT NULL,
    "themeSettingsId" BIGINT NOT NULL,
    "light" JSONB,
    "dark" JSONB,

    CONSTRAINT "ThemeColors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeSettings" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "platformSettingsId" BIGINT,

    CONSTRAINT "ThemeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "fullName" TEXT,
    "cpf" TEXT,
    "rgNumber" TEXT,
    "rgIssuer" TEXT,
    "rgIssueDate" TIMESTAMP(3),
    "dateOfBirth" TIMESTAMP(3),
    "cellPhone" TEXT,
    "homePhone" TEXT,
    "gender" TEXT,
    "profession" TEXT,
    "nationality" TEXT,
    "maritalStatus" TEXT,
    "propertyRegime" TEXT,
    "spouseName" TEXT,
    "spouseCpf" TEXT,
    "zipCode" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "avatarUrl" TEXT,
    "dataAiHint" TEXT,
    "habilitationStatus" "User_habilitationStatus" NOT NULL DEFAULT 'PENDING_DOCUMENTS',
    "accountType" "User_accountType" NOT NULL DEFAULT 'PHYSICAL',
    "badges" JSONB,
    "razaoSocial" TEXT,
    "cnpj" TEXT,
    "inscricaoEstadual" TEXT,
    "website" TEXT,
    "responsibleName" TEXT,
    "responsibleCpf" TEXT,
    "optInMarketing" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDocument" (
    "id" BIGSERIAL NOT NULL,
    "status" "UserDocument_status" NOT NULL DEFAULT 'PENDING_ANALYSIS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" BIGINT NOT NULL,
    "documentTypeId" BIGINT NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "tenantId" BIGINT,

    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLotMaxBid" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "lotId" BIGINT NOT NULL,
    "maxAmount" DECIMAL(15,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "UserLotMaxBid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWin" (
    "id" BIGSERIAL NOT NULL,
    "lotId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "winningBidAmount" DECIMAL(15,2) NOT NULL,
    "winDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentStatus" "UserWin_paymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "retrievalStatus" TEXT NOT NULL DEFAULT 'PENDENTE',
    "invoiceUrl" TEXT,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "UserWin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsersOnRoles" (
    "userId" BIGINT NOT NULL,
    "roleId" BIGINT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "UsersOnRoles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "UsersOnTenants" (
    "userId" BIGINT NOT NULL,
    "tenantId" BIGINT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "UsersOnTenants_pkey" PRIMARY KEY ("userId","tenantId")
);

-- CreateTable
CREATE TABLE "VariableIncrementRule" (
    "id" BIGSERIAL NOT NULL,
    "platformSettingsId" BIGINT NOT NULL,
    "from" DOUBLE PRECISION NOT NULL,
    "to" DOUBLE PRECISION,
    "increment" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VariableIncrementRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMake" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "VehicleMake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleModel" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "makeId" BIGINT NOT NULL,

    CONSTRAINT "VehicleModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" BIGINT,
    "userId" BIGINT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" BIGINT NOT NULL,
    "action" "audit_logs_action" NOT NULL,
    "changes" JSONB,
    "trace_id" VARCHAR(255),
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_fields" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidderNotification" (
    "id" BIGSERIAL NOT NULL,
    "bidderId" BIGINT NOT NULL,
    "type" "bidder_notifications_type" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" BIGINT,

    CONSTRAINT "BidderNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidderProfile" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "fullName" TEXT,
    "cpf" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "documentStatus" "bidder_profiles_documentStatus" NOT NULL DEFAULT 'PENDING',
    "submittedDocuments" JSONB,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" BIGINT,

    CONSTRAINT "BidderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityViewMetrics" (
    "id" BIGSERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" BIGINT NOT NULL,
    "entityPublicId" TEXT,
    "tenantId" BIGINT,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "viewsLast24h" INTEGER NOT NULL DEFAULT 0,
    "viewsLast7d" INTEGER NOT NULL DEFAULT 0,
    "viewsLast30d" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "favoritesCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityViewMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" BIGINT,
    "userId" BIGINT NOT NULL,
    "formType" TEXT NOT NULL,
    "entityId" BIGINT,
    "status" "form_submissions_status" NOT NULL,
    "validationScore" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "validationErrors" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itsm_attachments" (
    "id" BIGSERIAL NOT NULL,
    "ticketId" BIGINT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedBy" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itsm_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ITSM_ChatLog" (
    "id" BIGSERIAL NOT NULL,
    "ticketId" BIGINT,
    "userId" BIGINT NOT NULL,
    "messages" JSONB NOT NULL,
    "sessionId" TEXT,
    "context" JSONB,
    "wasHelpful" BOOLEAN,
    "ticketCreated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" BIGINT,

    CONSTRAINT "ITSM_ChatLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itsm_messages" (
    "id" BIGSERIAL NOT NULL,
    "ticketId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "message" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itsm_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itsm_query_logs" (
    "id" BIGSERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "userId" BIGINT,
    "endpoint" TEXT,
    "method" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itsm_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ITSM_Ticket" (
    "id" BIGSERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "itsm_tickets_status" NOT NULL DEFAULT 'ABERTO',
    "priority" "itsm_tickets_priority" NOT NULL DEFAULT 'MEDIA',
    "category" "itsm_tickets_category" NOT NULL DEFAULT 'OUTRO',
    "userSnapshot" JSONB,
    "userAgent" TEXT,
    "browserInfo" TEXT,
    "screenSize" TEXT,
    "pageUrl" TEXT,
    "errorLogs" JSONB,
    "assignedToUserId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "tenantId" BIGINT,

    CONSTRAINT "ITSM_Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipationHistory" (
    "id" BIGSERIAL NOT NULL,
    "bidderId" BIGINT NOT NULL,
    "lotId" BIGINT NOT NULL,
    "auctionId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "auctionName" TEXT NOT NULL,
    "maxBid" DECIMAL(10,2),
    "finalBid" DECIMAL(10,2),
    "result" "participation_history_result" NOT NULL,
    "participatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bidCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "ParticipationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" BIGSERIAL NOT NULL,
    "bidderId" BIGINT NOT NULL,
    "type" "PaymentMethod_type" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "cardToken" TEXT,
    "pixKey" TEXT,
    "pixKeyType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" BIGINT,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_rules" (
    "id" BIGSERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "ruleType" "validation_rules_ruleType" NOT NULL,
    "config" JSONB NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT NOT NULL,
    "severity" "validation_rules_severity" NOT NULL DEFAULT 'ERROR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorEvent" (
    "id" BIGSERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "visitorId" BIGINT NOT NULL,
    "sessionId" BIGINT NOT NULL,
    "eventType" "VisitorEvent_eventType" NOT NULL,
    "entityType" TEXT,
    "entityId" BIGINT,
    "entityPublicId" TEXT,
    "metadata" JSONB,
    "pageUrl" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorSession" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "visitorId" BIGINT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "eventsCount" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,

    CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" BIGSERIAL NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" BIGINT,
    "firstVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstUserAgent" TEXT,
    "firstIpAddress" TEXT,
    "firstReferrer" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "totalVisits" INTEGER NOT NULL DEFAULT 1,
    "totalPageViews" INTEGER NOT NULL DEFAULT 0,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WonLot" (
    "id" BIGSERIAL NOT NULL,
    "bidderId" BIGINT NOT NULL,
    "lotId" BIGINT NOT NULL,
    "auctionId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "finalBid" DECIMAL(10,2) NOT NULL,
    "wonAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "won_lots_status" NOT NULL DEFAULT 'WON',
    "paymentStatus" "won_lots_paymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "dueDate" TIMESTAMP(3),
    "deliveryStatus" "won_lots_deliveryStatus" NOT NULL DEFAULT 'PENDING',
    "trackingCode" TEXT,
    "invoiceUrl" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "WonLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_configs" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "fields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AuctionToCourt" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "_AuctionToJudicialBranch" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "_AuctionToJudicialDistrict" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "_InstallmentPaymentToLot" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "_JudicialProcessToLot" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_publicId_key" ON "Asset"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_vin_key" ON "Asset"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_renavam_key" ON "Asset"("renavam");

-- CreateIndex
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId");

-- CreateIndex
CREATE INDEX "Asset_judicialProcessId_idx" ON "Asset"("judicialProcessId");

-- CreateIndex
CREATE INDEX "Asset_occupationUpdatedBy_idx" ON "Asset"("occupationUpdatedBy");

-- CreateIndex
CREATE INDEX "Asset_sellerId_idx" ON "Asset"("sellerId");

-- CreateIndex
CREATE INDEX "Asset_subcategoryId_idx" ON "Asset"("subcategoryId");

-- CreateIndex
CREATE INDEX "Asset_tenantId_idx" ON "Asset"("tenantId");

-- CreateIndex
CREATE INDEX "AssetMedia_assetId_idx" ON "AssetMedia"("assetId");

-- CreateIndex
CREATE INDEX "AssetMedia_mediaItemId_idx" ON "AssetMedia"("mediaItemId");

-- CreateIndex
CREATE INDEX "AssetMedia_tenantId_idx" ON "AssetMedia"("tenantId");

-- CreateIndex
CREATE INDEX "AssetsOnLots_assetId_idx" ON "AssetsOnLots"("assetId");

-- CreateIndex
CREATE INDEX "AssetsOnLots_tenantId_idx" ON "AssetsOnLots"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Auction_publicId_key" ON "Auction"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Auction_slug_key" ON "Auction"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Auction_originalAuctionId_key" ON "Auction"("originalAuctionId");

-- CreateIndex
CREATE INDEX "Auction_auctioneerId_idx" ON "Auction"("auctioneerId");

-- CreateIndex
CREATE INDEX "Auction_categoryId_idx" ON "Auction"("categoryId");

-- CreateIndex
CREATE INDEX "Auction_cityId_idx" ON "Auction"("cityId");

-- CreateIndex
CREATE INDEX "Auction_judicialProcessId_idx" ON "Auction"("judicialProcessId");

-- CreateIndex
CREATE INDEX "Auction_sellerId_idx" ON "Auction"("sellerId");

-- CreateIndex
CREATE INDEX "Auction_stateId_idx" ON "Auction"("stateId");

-- CreateIndex
CREATE INDEX "Auction_tenantId_idx" ON "Auction"("tenantId");

-- CreateIndex
CREATE INDEX "AuctionHabilitation_auctionId_idx" ON "AuctionHabilitation"("auctionId");

-- CreateIndex
CREATE INDEX "AuctionHabilitation_tenantId_idx" ON "AuctionHabilitation"("tenantId");

-- CreateIndex
CREATE INDEX "AuctionStage_auctionId_idx" ON "AuctionStage"("auctionId");

-- CreateIndex
CREATE INDEX "AuctionStage_tenantId_idx" ON "AuctionStage"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Auctioneer_publicId_key" ON "Auctioneer"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Auctioneer_slug_key" ON "Auctioneer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Auctioneer_userId_key" ON "Auctioneer"("userId");

-- CreateIndex
CREATE INDEX "Auctioneer_tenantId_idx" ON "Auctioneer"("tenantId");

-- CreateIndex
CREATE INDEX "Bid_auctionId_idx" ON "Bid"("auctionId");

-- CreateIndex
CREATE INDEX "Bid_bidderId_idx" ON "Bid"("bidderId");

-- CreateIndex
CREATE INDEX "Bid_lotId_idx" ON "Bid"("lotId");

-- CreateIndex
CREATE INDEX "Bid_tenantId_idx" ON "Bid"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BiddingSettings_platformSettingsId_key" ON "BiddingSettings"("platformSettingsId");

-- CreateIndex
CREATE UNIQUE INDEX "City_ibgeCode_key" ON "City"("ibgeCode");

-- CreateIndex
CREATE INDEX "City_stateId_idx" ON "City"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_stateId_key" ON "City"("name", "stateId");

-- CreateIndex
CREATE INDEX "CounterState_tenantId_idx" ON "CounterState"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CounterState_tenantId_entityType_key" ON "CounterState"("tenantId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "Court_slug_key" ON "Court"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_modelName_key" ON "DataSource"("modelName");

-- CreateIndex
CREATE UNIQUE INDEX "DirectSaleOffer_publicId_key" ON "DirectSaleOffer"("publicId");

-- CreateIndex
CREATE INDEX "DirectSaleOffer_categoryId_idx" ON "DirectSaleOffer"("categoryId");

-- CreateIndex
CREATE INDEX "DirectSaleOffer_sellerId_idx" ON "DirectSaleOffer"("sellerId");

-- CreateIndex
CREATE INDEX "DirectSaleOffer_tenantId_idx" ON "DirectSaleOffer"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_name_key" ON "DocumentTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_name_key" ON "DocumentType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IdMasks_platformSettingsId_key" ON "IdMasks"("platformSettingsId");

-- CreateIndex
CREATE INDEX "InstallmentPayment_tenantId_idx" ON "InstallmentPayment"("tenantId");

-- CreateIndex
CREATE INDEX "InstallmentPayment_userWinId_idx" ON "InstallmentPayment"("userWinId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallmentPayment_userWinId_installmentNumber_key" ON "InstallmentPayment"("userWinId", "installmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "JudicialBranch_slug_key" ON "JudicialBranch"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "JudicialBranch_name_key" ON "JudicialBranch"("name");

-- CreateIndex
CREATE INDEX "JudicialBranch_districtId_idx" ON "JudicialBranch"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "JudicialDistrict_slug_key" ON "JudicialDistrict"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "JudicialDistrict_name_key" ON "JudicialDistrict"("name");

-- CreateIndex
CREATE INDEX "JudicialDistrict_courtId_idx" ON "JudicialDistrict"("courtId");

-- CreateIndex
CREATE INDEX "JudicialDistrict_stateId_idx" ON "JudicialDistrict"("stateId");

-- CreateIndex
CREATE INDEX "JudicialParty_processId_idx" ON "JudicialParty"("processId");

-- CreateIndex
CREATE INDEX "JudicialParty_tenantId_idx" ON "JudicialParty"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "JudicialProcess_publicId_key" ON "JudicialProcess"("publicId");

-- CreateIndex
CREATE INDEX "JudicialProcess_actionType_idx" ON "JudicialProcess"("actionType");

-- CreateIndex
CREATE INDEX "JudicialProcess_branchId_idx" ON "JudicialProcess"("branchId");

-- CreateIndex
CREATE INDEX "JudicialProcess_courtId_idx" ON "JudicialProcess"("courtId");

-- CreateIndex
CREATE INDEX "JudicialProcess_districtId_idx" ON "JudicialProcess"("districtId");

-- CreateIndex
CREATE INDEX "JudicialProcess_propertyMatricula_idx" ON "JudicialProcess"("propertyMatricula");

-- CreateIndex
CREATE INDEX "JudicialProcess_propertyRegistrationNumber_idx" ON "JudicialProcess"("propertyRegistrationNumber");

-- CreateIndex
CREATE INDEX "JudicialProcess_sellerId_idx" ON "JudicialProcess"("sellerId");

-- CreateIndex
CREATE INDEX "JudicialProcess_tenantId_idx" ON "JudicialProcess"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "JudicialProcess_processNumber_tenantId_key" ON "JudicialProcess"("processNumber", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_publicId_key" ON "Lot"("publicId");

