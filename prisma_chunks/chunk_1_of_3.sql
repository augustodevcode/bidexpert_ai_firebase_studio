-- CreateEnum
CREATE TYPE "UserDocument_status" AS ENUM ('NOT_SENT', 'SUBMITTED', 'PENDING_ANALYSIS', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "bidder_notifications_type" AS ENUM ('AUCTION_WON', 'PAYMENT_DUE', 'PAYMENT_OVERDUE', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'DELIVERY_UPDATE', 'AUCTION_ENDING', 'SYSTEM_UPDATE');

-- CreateEnum
CREATE TYPE "DocumentTemplate_type" AS ENUM ('WINNING_BID_TERM', 'EVALUATION_REPORT', 'AUCTION_CERTIFICATE');

-- CreateEnum
CREATE TYPE "LotRisk_riskType" AS ENUM ('OCUPACAO_IRREGULAR', 'PENHORA', 'INSCRICAO_DIVIDA', 'RESTRICAO_AMBIENTAL', 'DOENCA_ACARAJADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "PaymentMethod_type" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "JudicialParty_partyType" AS ENUM ('AUTOR', 'REU', 'ADVOGADO_AUTOR', 'ADVOGADO_REU', 'JUIZ', 'ESCRIVAO', 'PERITO', 'ADMINISTRADOR_JUDICIAL', 'TERCEIRO_INTERESSADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "LotRisk_riskLevel" AS ENUM ('BAIXO', 'MEDIO', 'ALTO', 'CRITICO');

-- CreateEnum
CREATE TYPE "validation_rules_ruleType" AS ENUM ('REQUIRED', 'MIN_LENGTH', 'MAX_LENGTH', 'PATTERN', 'MIN_VALUE', 'MAX_VALUE', 'DATE_RANGE', 'FILE_TYPE', 'FILE_SIZE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('CADASTRO', 'DISPONIVEL', 'LOTEADO', 'VENDIDO', 'REMOVIDO', 'INATIVADO');

-- CreateEnum
CREATE TYPE "DirectSaleOffer_offerType" AS ENUM ('BUY_NOW', 'ACCEPTS_PROPOSALS');

-- CreateEnum
CREATE TYPE "Tenant_resolutionStrategy" AS ENUM ('SUBDOMAIN', 'PATH', 'CUSTOM_DOMAIN');

-- CreateEnum
CREATE TYPE "VisitorEvent_eventType" AS ENUM ('PAGE_VIEW', 'LOT_VIEW', 'AUCTION_VIEW', 'SEARCH', 'FILTER_APPLIED', 'BID_CLICK', 'SHARE_CLICK', 'FAVORITE_ADD', 'FAVORITE_REMOVE', 'DOCUMENT_DOWNLOAD', 'IMAGE_VIEW', 'VIDEO_PLAY', 'CONTACT_CLICK', 'HABILITATION_START');

-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('RASCUNHO', 'EM_VALIDACAO', 'EM_AJUSTE', 'EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'EM_PREGAO', 'ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "AuctionStage_status" AS ENUM ('RASCUNHO', 'AGENDADO', 'EM_ANDAMENTO', 'SUSPENSO', 'CONCLUIDO', 'CANCELADO', 'AGUARDANDO_INICIO', 'ABERTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "audit_logs_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE', 'PUBLISH', 'UNPUBLISH', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT');

-- CreateEnum
CREATE TYPE "form_submissions_status" AS ENUM ('DRAFT', 'VALIDATING', 'VALID', 'INVALID', 'SUBMITTED', 'FAILED');

-- CreateEnum
CREATE TYPE "itsm_tickets_status" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_USUARIO', 'RESOLVIDO', 'FECHADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "UserWin_paymentStatus" AS ENUM ('PENDENTE', 'PROCESSANDO', 'PAGO', 'FALHOU', 'REEMBOLSADO', 'CANCELADO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "itsm_tickets_priority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "DirectSaleOffer_status" AS ENUM ('ACTIVE', 'PENDING_APPROVAL', 'SOLD', 'EXPIRED', 'RASCUNHO');

-- CreateEnum
CREATE TYPE "InstallmentPayment_status" AS ENUM ('PENDENTE', 'PROCESSANDO', 'PAGO', 'FALHOU', 'REEMBOLSADO', 'CANCELADO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "itsm_tickets_category" AS ENUM ('TECNICO', 'FUNCIONAL', 'DUVIDA', 'SUGESTAO', 'BUG', 'OUTRO');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "validation_rules_severity" AS ENUM ('ERROR', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "won_lots_status" AS ENUM ('WON', 'PAID', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "participation_history_result" AS ENUM ('WON', 'LOST', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "won_lots_paymentStatus" AS ENUM ('PENDENTE', 'PROCESSANDO', 'PAGO', 'FALHOU', 'REEMBOLSADO', 'CANCELADO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "bidder_profiles_documentStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('RASCUNHO', 'AGUARDANDO', 'EM_BREVE', 'ABERTO_PARA_LANCES', 'EM_PREGAO', 'ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'RELISTADO', 'CANCELADO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('ATIVO', 'CANCELADO', 'VENCEDOR', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "TenantInvoice_status" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "Auction_auctionType" AS ENUM ('JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS', 'VENDA_DIRETA');

-- CreateEnum
CREATE TYPE "won_lots_deliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "Auction_auctionMethod" AS ENUM ('STANDARD', 'DUTCH', 'SILENT');

-- CreateEnum
CREATE TYPE "JudicialProcess_actionType" AS ENUM ('USUCAPIAO', 'REMOCAO', 'HIPOTECA', 'DESPEJO', 'PENHORA', 'COBRANCA', 'INVENTARIO', 'DIVORCIO', 'OUTROS');

-- CreateEnum
CREATE TYPE "Auction_participation" AS ENUM ('ONLINE', 'PRESENCIAL', 'HIBRIDO');

-- CreateEnum
CREATE TYPE "User_habilitationStatus" AS ENUM ('PENDING_DOCUMENTS', 'PENDING_ANALYSIS', 'HABILITADO', 'REJECTED_DOCUMENTS', 'BLOCKED');

-- CreateEnum
CREATE TYPE "User_accountType" AS ENUM ('PHYSICAL', 'LEGAL', 'DIRECT_SALE_CONSIGNOR');

-- CreateEnum
CREATE TYPE "PlatformSettings_storageProvider" AS ENUM ('LOCAL', 'FIREBASE');

-- CreateEnum
CREATE TYPE "PlatformSettings_searchPaginationType" AS ENUM ('loadMore', 'numberedPages');

-- CreateEnum
CREATE TYPE "Asset_occupationStatus" AS ENUM ('OCCUPIED', 'UNOCCUPIED', 'UNCERTAIN', 'SHARED_POSSESSION');

-- CreateTable
CREATE TABLE "Asset" (
    "id" BIGSERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "categoryId" BIGINT,
    "subcategoryId" BIGINT,
    "judicialProcessId" BIGINT,
    "sellerId" BIGINT,
    "evaluationValue" DECIMAL(15,2),
    "imageUrl" TEXT,
    "imageMediaId" BIGINT,
    "galleryImageUrls" JSONB,
    "mediaItemIds" JSONB,
    "dataAiHint" TEXT,
    "locationCity" TEXT,
    "locationState" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "lotId" BIGINT,
    "lotInfo" TEXT,
    "judicialProcessNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" BIGINT NOT NULL,
    "plate" TEXT,
    "make" TEXT,
    "model" TEXT,
    "version" TEXT,
    "year" INTEGER,
    "modelYear" INTEGER,
    "mileage" INTEGER,
    "color" TEXT,
    "fuelType" TEXT,
    "transmissionType" TEXT,
    "bodyType" TEXT,
    "vin" TEXT,
    "renavam" TEXT,
    "enginePower" TEXT,
    "numberOfDoors" INTEGER,
    "vehicleOptions" TEXT,
    "detranStatus" TEXT,
    "debts" TEXT,
    "runningCondition" TEXT,
    "bodyCondition" TEXT,
    "tiresCondition" TEXT,
    "hasKey" BOOLEAN,
    "propertyRegistrationNumber" TEXT,
    "iptuNumber" TEXT,
    "isOccupied" BOOLEAN,
    "occupationStatus" "Asset_occupationStatus",
    "occupationNotes" TEXT,
    "occupationLastVerified" TIMESTAMP(3),
    "occupationUpdatedBy" BIGINT,
    "totalArea" DECIMAL(65,30),
    "builtArea" DECIMAL(65,30),
    "bedrooms" INTEGER,
    "suites" INTEGER,
    "bathrooms" INTEGER,
    "parkingSpaces" INTEGER,
    "constructionType" TEXT,
    "finishes" TEXT,
    "infrastructure" TEXT,
    "condoDetails" TEXT,
    "improvements" TEXT,
    "topography" TEXT,
    "liensAndEncumbrances" TEXT,
    "propertyDebts" TEXT,
    "unregisteredRecords" TEXT,
    "hasHabiteSe" BOOLEAN,
    "zoningRestrictions" TEXT,
    "amenities" JSONB,
    "brand" TEXT,
    "serialNumber" TEXT,
    "itemCondition" TEXT,
    "specifications" TEXT,
    "includedAccessories" TEXT,
    "batteryCondition" TEXT,
    "hasInvoice" BOOLEAN,
    "hasWarranty" BOOLEAN,
    "repairHistory" TEXT,
    "applianceCapacity" TEXT,
    "voltage" TEXT,
    "applianceType" TEXT,
    "additionalFunctions" TEXT,
    "hoursUsed" INTEGER,
    "engineType" TEXT,
    "capacityOrPower" TEXT,
    "maintenanceHistory" TEXT,
    "installationLocation" TEXT,
    "compliesWithNR" TEXT,
    "operatingLicenses" TEXT,
    "breed" TEXT,
    "age" TEXT,
    "sex" TEXT,
    "weight" TEXT,
    "individualId" TEXT,
    "purpose" TEXT,
    "sanitaryCondition" TEXT,
    "lineage" TEXT,
    "isPregnant" BOOLEAN,
    "specialSkills" TEXT,
    "gtaDocument" TEXT,
    "breedRegistryDocument" TEXT,
    "furnitureType" TEXT,
    "material" TEXT,
    "style" TEXT,
    "dimensions" TEXT,
    "pieceCount" INTEGER,
    "jewelryType" TEXT,
    "metal" TEXT,
    "gemstones" TEXT,
    "totalWeight" TEXT,
    "jewelrySize" TEXT,
    "authenticityCertificate" TEXT,
    "workType" TEXT,
    "artist" TEXT,
    "period" TEXT,
    "technique" TEXT,
    "provenance" TEXT,
    "boatType" TEXT,
    "boatLength" TEXT,
    "hullMaterial" TEXT,
    "onboardEquipment" TEXT,
    "productName" TEXT,
    "quantity" TEXT,
    "packagingType" TEXT,
    "expirationDate" TIMESTAMP(3),
    "storageConditions" TEXT,
    "preciousMetalType" TEXT,
    "purity" TEXT,
    "forestGoodsType" TEXT,
    "volumeOrQuantity" TEXT,
    "species" TEXT,
    "dofNumber" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMedia" (
    "id" BIGSERIAL NOT NULL,
    "assetId" BIGINT NOT NULL,
    "mediaItemId" BIGINT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "AssetMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetsOnLots" (
    "lotId" BIGINT NOT NULL,
    "assetId" BIGINT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "AssetsOnLots_pkey" PRIMARY KEY ("lotId","assetId")
);

-- CreateTable
CREATE TABLE "Auction" (
    "id" BIGSERIAL NOT NULL,
    "publicId" TEXT,
    "slug" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AuctionStatus" NOT NULL DEFAULT 'RASCUNHO',
    "auctionDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalLots" INTEGER NOT NULL DEFAULT 0,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "totalHabilitatedUsers" INTEGER NOT NULL DEFAULT 0,
    "initialOffer" DECIMAL(15,2),
    "auctionType" "Auction_auctionType",
    "auctionMethod" "Auction_auctionMethod" DEFAULT 'STANDARD',
    "participation" "Auction_participation" DEFAULT 'ONLINE',
    "createdByUserId" BIGINT,
    "submittedAt" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "validatedBy" BIGINT,
    "validationNotes" TEXT,
    "openDate" TIMESTAMP(3),
    "actualOpenDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" BIGINT,
    "cancellationReason" TEXT,
    "onlineUrl" VARCHAR(500),
    "address" TEXT,
    "zipCode" VARCHAR(10),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "documentsUrl" VARCHAR(500),
    "isFeaturedOnMarketplace" BOOLEAN NOT NULL DEFAULT false,
    "softCloseEnabled" BOOLEAN DEFAULT false,
    "softCloseMinutes" INTEGER,
    "achievedRevenue" DECIMAL(15,2),
    "evaluationReportUrl" VARCHAR(500),
    "auctionCertificateUrl" VARCHAR(500),
    "floorPrice" DECIMAL(15,2),
    "decrementAmount" DECIMAL(10,2),
    "decrementIntervalSeconds" INTEGER,
    "sellingBranch" TEXT,
    "additionalTriggers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" BIGINT NOT NULL,
    "auctioneerId" BIGINT,
    "sellerId" BIGINT,
    "imageMediaId" BIGINT,
    "isRelisted" BOOLEAN NOT NULL DEFAULT false,
    "relistCount" INTEGER NOT NULL DEFAULT 0,
    "originalAuctionId" BIGINT,
    "cityId" BIGINT,
    "stateId" BIGINT,
    "judicialProcessId" BIGINT,
    "categoryId" BIGINT,
    "complement" VARCHAR(100),
    "neighborhood" VARCHAR(100),
    "number" VARCHAR(20),
    "street" VARCHAR(255),
    "supportPhone" VARCHAR(50),
    "supportEmail" VARCHAR(255),
    "supportWhatsApp" VARCHAR(50),

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionHabilitation" (
    "userId" BIGINT NOT NULL,
    "auctionId" BIGINT NOT NULL,
    "habilitatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "AuctionHabilitation_pkey" PRIMARY KEY ("userId","auctionId")
);

-- CreateTable
CREATE TABLE "AuctionStage" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "auctionId" BIGINT NOT NULL,
    "status" "AuctionStage_status" NOT NULL DEFAULT 'AGUARDANDO_INICIO',
    "tenantId" BIGINT NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 100.00,

    CONSTRAINT "AuctionStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auctioneer" (
    "id" BIGSERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "registrationNumber" TEXT,
    "logoUrl" TEXT,
    "logoMediaId" BIGINT,
    "dataAiHintLogo" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "supportWhatsApp" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" BIGINT NOT NULL,
    "userId" BIGINT,

    CONSTRAINT "Auctioneer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" BIGSERIAL NOT NULL,
    "lotId" BIGINT NOT NULL,
    "auctionId" BIGINT NOT NULL,
    "bidderId" BIGINT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BidStatus" NOT NULL DEFAULT 'ATIVO',
    "cancelledAt" TIMESTAMP(3),
    "isAutoBid" BOOLEAN NOT NULL DEFAULT false,
    "bidderDisplay" TEXT,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiddingSettings" (
    "id" BIGSERIAL NOT NULL,
    "platformSettingsId" BIGINT NOT NULL,
    "instantBiddingEnabled" BOOLEAN DEFAULT true,
    "getBidInfoInstantly" BOOLEAN DEFAULT true,
    "biddingInfoCheckIntervalSeconds" INTEGER DEFAULT 1,
    "defaultStageDurationDays" INTEGER DEFAULT 7,
    "defaultDaysBetweenStages" INTEGER DEFAULT 1,

    CONSTRAINT "BiddingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" BIGINT NOT NULL,
    "ibgeCode" TEXT,
    "slug" TEXT,
    "lotCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounterState" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" BIGINT NOT NULL,
    "entityType" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CounterState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Court" (
    "id" BIGSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateUf" TEXT NOT NULL,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Court_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "fields" JSONB NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectSaleOffer" (
    "id" BIGSERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "offerType" "DirectSaleOffer_offerType" NOT NULL,
    "price" DECIMAL(15,2),
    "minimumOfferPrice" DECIMAL(15,2),
    "status" "DirectSaleOffer_status" NOT NULL DEFAULT 'ACTIVE',
    "locationCity" TEXT,
    "locationState" TEXT,
    "imageUrl" TEXT,
    "imageMediaId" BIGINT,
    "dataAiHint" TEXT,
    "galleryImageUrls" JSONB,
    "mediaItemIds" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" BIGINT NOT NULL,
    "sellerId" BIGINT NOT NULL,
    "sellerName" TEXT,
    "sellerLogoUrl" TEXT,
    "dataAiHintSellerLogo" TEXT,
    "tenantId" BIGINT NOT NULL,
    "itemsIncluded" JSONB,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DirectSaleOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentTemplate_type" NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "appliesTo" TEXT NOT NULL,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdMasks" (
    "id" BIGSERIAL NOT NULL,
    "platformSettingsId" BIGINT NOT NULL,
    "auctionCodeMask" TEXT,
    "lotCodeMask" TEXT,
    "sellerCodeMask" TEXT,
    "auctioneerCodeMask" TEXT,
    "userCodeMask" TEXT,
    "assetCodeMask" TEXT,
    "categoryCodeMask" TEXT,
    "subcategoryCodeMask" TEXT,

    CONSTRAINT "IdMasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallmentPayment" (
    "id" BIGSERIAL NOT NULL,
    "userWinId" BIGINT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "totalInstallments" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" "InstallmentPayment_status" NOT NULL DEFAULT 'PENDENTE',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "InstallmentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudicialBranch" (
    "id" BIGSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" BIGINT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JudicialBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudicialDistrict" (
    "id" BIGSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courtId" BIGINT,
    "stateId" BIGINT,
    "zipCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JudicialDistrict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudicialParty" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "documentNumber" TEXT,
    "partyType" "JudicialParty_partyType" NOT NULL,
    "processId" BIGINT NOT NULL,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "JudicialParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudicialProcess" (
    "id" BIGSERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "processNumber" TEXT NOT NULL,
    "isElectronic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "tenantId" BIGINT NOT NULL,
    "courtId" BIGINT,
    "districtId" BIGINT,
    "branchId" BIGINT,
    "sellerId" BIGINT,
    "propertyMatricula" VARCHAR(50),
    "propertyRegistrationNumber" TEXT,
    "actionType" "JudicialProcess_actionType",
    "actionDescription" TEXT,
    "actionCnjCode" VARCHAR(20),

    CONSTRAINT "JudicialProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" BIGSERIAL NOT NULL,
    "publicId" TEXT,
    "auctionId" BIGINT NOT NULL,
    "number" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT,
    "price" DECIMAL(15,2) NOT NULL,
    "initialPrice" DECIMAL(15,2),
    "secondInitialPrice" DECIMAL(15,2),
    "bidIncrementStep" DECIMAL(10,2),
    "status" "LotStatus" NOT NULL DEFAULT 'EM_BREVE',
    "openedAt" TIMESTAMP(3),
    "lotClosedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "soldPrice" DECIMAL(15,2),
    "bidsCount" INTEGER DEFAULT 0,
    "views" INTEGER DEFAULT 0,
    "isFeatured" BOOLEAN DEFAULT false,
    "isExclusive" BOOLEAN DEFAULT false,
    "discountPercentage" INTEGER,
    "additionalTriggers" JSONB,
    "imageUrl" TEXT,
    "imageMediaId" BIGINT,
    "galleryImageUrls" JSONB,
    "mediaItemIds" JSONB,
    "stageDetails" JSONB,
    "type" TEXT NOT NULL,
    "condition" TEXT,
    "dataAiHint" TEXT,
    "winnerId" BIGINT,
    "winningBidTermUrl" TEXT,
    "allowInstallmentBids" BOOLEAN DEFAULT false,
    "isRelisted" BOOLEAN NOT NULL DEFAULT false,
    "relistCount" INTEGER NOT NULL DEFAULT 0,
    "original_lot_id" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "lotSpecificAuctionDate" TIMESTAMP(3),
    "secondAuctionDate" TIMESTAMP(3),
    "categoryId" BIGINT,
    "subcategoryId" BIGINT,
    "sellerId" BIGINT,
    "auctioneerId" BIGINT,
    "cityId" BIGINT,
    "stateId" BIGINT,
    "cityName" TEXT,
    "stateUf" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "mapAddress" TEXT,
    "tenantId" BIGINT NOT NULL,
    "depositGuaranteeAmount" DECIMAL(15,2),
    "depositGuaranteeInfo" TEXT,
    "requiresDepositGuarantee" BOOLEAN DEFAULT false,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotCategory" (
    "id" BIGSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "logoMediaId" BIGINT,
    "dataAiHintLogo" TEXT,
    "coverImageUrl" TEXT,
    "coverImageMediaId" BIGINT,
    "dataAiHintCover" TEXT,
    "megaMenuImageUrl" TEXT,
    "megaMenuImageMediaId" BIGINT,
    "dataAiHintMegaMenu" TEXT,
    "hasSubcategories" BOOLEAN DEFAULT false,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" BIGINT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "LotCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotDocument" (
    "id" BIGSERIAL NOT NULL,
    "lotId" BIGINT NOT NULL,
    "fileName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileSize" BIGINT,
    "mimeType" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "LotDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotQuestion" (
    "id" BIGSERIAL NOT NULL,
    "lotId" BIGINT NOT NULL,
    "auctionId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "userDisplayName" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerText" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "answeredByUserId" BIGINT,
    "answeredByUserDisplayName" TEXT,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "LotQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotRisk" (
    "id" BIGSERIAL NOT NULL,
    "lotId" BIGINT NOT NULL,
    "riskType" "LotRisk_riskType" NOT NULL,
    "riskLevel" "LotRisk_riskLevel" NOT NULL,
    "riskDescription" TEXT NOT NULL,
    "mitigationStrategy" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" BIGINT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "LotRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotStagePrice" (
    "id" BIGSERIAL NOT NULL,
    "lotId" BIGINT NOT NULL,
    "auctionId" BIGINT NOT NULL,
    "auctionStageId" BIGINT NOT NULL,
    "initialBid" DECIMAL(15,2),
    "bidIncrement" DECIMAL(10,2),
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "LotStagePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapSettings" (
    "id" BIGSERIAL NOT NULL,
    "platformSettingsId" BIGINT NOT NULL,
    "defaultProvider" TEXT DEFAULT 'openstreetmap',
    "googleMapsApiKey" TEXT,

    CONSTRAINT "MapSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" BIGSERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "urlOriginal" TEXT NOT NULL,
    "urlThumbnail" TEXT,
    "urlMedium" TEXT,
    "urlLarge" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "altText" TEXT,
    "caption" TEXT,
    "description" TEXT,
    "title" TEXT,
    "dataAiHint" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedByUserId" BIGINT,
    "judicialProcessId" BIGINT,
    "linkedLotIds" JSONB,
    "tenantId" BIGINT,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentalTriggerSettings" (
    "id" BIGSERIAL NOT NULL,
    "platformSettingsId" BIGINT NOT NULL,
    "showDiscountBadge" BOOLEAN NOT NULL DEFAULT true,
    "showPopularityBadge" BOOLEAN NOT NULL DEFAULT true,
    "popularityViewThreshold" INTEGER NOT NULL DEFAULT 500,
    "showHotBidBadge" BOOLEAN NOT NULL DEFAULT true,
    "hotBidThreshold" INTEGER NOT NULL DEFAULT 10,
    "showExclusiveBadge" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MentalTriggerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lotId" BIGINT,
    "auctionId" BIGINT,
    "tenantId" BIGINT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" BIGSERIAL NOT NULL,
    "platformSettingsId" BIGINT NOT NULL,
    "notifyOnNewAuction" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnFeaturedLot" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnAuctionEndingSoon" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnPromotions" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGatewaySettings" (
    "id" BIGSERIAL NOT NULL,
    "platformSettingsId" BIGINT NOT NULL,
    "defaultGateway" TEXT DEFAULT 'Manual',
    "platformCommissionPercentage" DOUBLE PRECISION DEFAULT 5,
    "gatewayApiKey" TEXT,
    "gatewayEncryptionKey" TEXT,

    CONSTRAINT "PaymentGatewaySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" BIGINT NOT NULL,
    "siteTitle" TEXT,
    "siteTagline" TEXT,
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "isSetupComplete" BOOLEAN NOT NULL DEFAULT false,
    "primaryColorHsl" VARCHAR(50),
    "primaryForegroundHsl" VARCHAR(50),
    "secondaryColorHsl" VARCHAR(50),
    "secondaryForegroundHsl" VARCHAR(50),
    "accentColorHsl" VARCHAR(50),
    "accentForegroundHsl" VARCHAR(50),
    "destructiveColorHsl" VARCHAR(50),
    "mutedColorHsl" VARCHAR(50),
    "backgroundColorHsl" VARCHAR(50),
    "foregroundColorHsl" VARCHAR(50),
    "borderColorHsl" VARCHAR(50),
    "radiusValue" VARCHAR(20),
    "customCss" TEXT,
    "customHeadScripts" TEXT,
    "customFontUrl" TEXT,
    "emailFromName" VARCHAR(100),
    "emailFromAddress" VARCHAR(255),
    "smsFromName" VARCHAR(50),
    "enableBlockchain" BOOLEAN NOT NULL DEFAULT false,
    "enableRealtime" BOOLEAN NOT NULL DEFAULT true,
    "enableSoftClose" BOOLEAN NOT NULL DEFAULT true,
    "enableDirectSales" BOOLEAN NOT NULL DEFAULT true,
    "enableMapSearch" BOOLEAN NOT NULL DEFAULT true,
    "enableAIFeatures" BOOLEAN NOT NULL DEFAULT false,
    "crudFormMode" TEXT DEFAULT 'modal',
    "galleryImageBasePath" TEXT,
    "storageProvider" "PlatformSettings_storageProvider",
    "firebaseStorageBucket" TEXT,
    "activeThemeName" TEXT,
    "searchPaginationType" "PlatformSettings_searchPaginationType",
    "searchItemsPerPage" INTEGER DEFAULT 12,
    "searchLoadMoreCount" INTEGER DEFAULT 12,
    "showCountdownOnLotDetail" BOOLEAN DEFAULT true,
    "showCountdownOnCards" BOOLEAN DEFAULT true,
    "showRelatedLotsOnLotDetail" BOOLEAN DEFAULT true,
    "relatedLotsCount" INTEGER DEFAULT 5,
    "defaultUrgencyTimerHours" INTEGER,
    "defaultListItemsPerPage" INTEGER DEFAULT 10,
    "marketingSiteAdsSuperOpportunitiesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds" INTEGER DEFAULT 6,
    "marketingSiteAdsSuperOpportunitiesDaysBeforeClosing" INTEGER DEFAULT 7,
    "auditTrailConfig" JSONB,
