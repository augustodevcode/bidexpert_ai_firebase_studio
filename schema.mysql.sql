-- BidExpert MySQL Schema
-- Schema version: 1.1
-- Description: This schema defines the structure for the BidExpert auction platform.

-- =================================================================
-- Tables without foreign key dependencies
-- =================================================================

CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY DEFAULT 'global',
  `siteTitle` VARCHAR(150),
  `siteTagline` VARCHAR(255),
  `galleryImageBasePath` VARCHAR(255),
  `storageProvider` VARCHAR(50) DEFAULT 'local',
  `firebaseStorageBucket` VARCHAR(255),
  `activeThemeName` VARCHAR(100),
  `themes` JSON,
  `platformPublicIdMasks` JSON,
  `homepageSections` JSON,
  `mentalTriggerSettings` JSON,
  `sectionBadgeVisibility` JSON,
  `mapSettings` JSON,
  `searchPaginationType` VARCHAR(50) DEFAULT 'loadMore',
  `searchItemsPerPage` INT DEFAULT 12,
  `searchLoadMoreCount` INT DEFAULT 12,
  `showCountdownOnLotDetail` BOOLEAN DEFAULT TRUE,
  `showCountdownOnCards` BOOLEAN DEFAULT TRUE,
  `showRelatedLotsOnLotDetail` BOOLEAN DEFAULT TRUE,
  `relatedLotsCount` INT DEFAULT 5,
  `defaultUrgencyTimerHours` INT,
  `variableIncrementTable` JSON,
  `biddingSettings` JSON,
  `defaultListItemsPerPage` INT DEFAULT 10,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `name_normalized` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `permissions` JSON,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `states` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `uf` VARCHAR(2) NOT NULL UNIQUE,
  `slug` VARCHAR(100) UNIQUE,
  `cityCount` INT DEFAULT 0,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) UNIQUE,
  `description` TEXT,
  `itemCount` INT DEFAULT 0,
  `hasSubcategories` BOOLEAN DEFAULT FALSE,
  `logoUrl` VARCHAR(255),
  `logoMediaId` VARCHAR(100),
  `dataAiHintLogo` VARCHAR(100),
  `coverImageUrl` VARCHAR(255),
  `coverImageMediaId` VARCHAR(100),
  `dataAiHintCover` VARCHAR(100),
  `megaMenuImageUrl` VARCHAR(255),
  `megaMenuImageMediaId` VARCHAR(100),
  `dataAiHintMegaMenu` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `document_templates` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `content` TEXT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255),
  `message` TEXT NOT NULL,
  `isRead` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `document_types` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `isRequired` BOOLEAN DEFAULT FALSE,
  `appliesTo` VARCHAR(50) DEFAULT 'ALL' -- 'PHYSICAL', 'LEGAL', 'ALL'
);

-- =================================================================
-- Tables with one level of dependency
-- =================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `uid` VARCHAR(100) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255),
  `fullName` VARCHAR(255),
  `cpf` VARCHAR(20),
  `cellPhone` VARCHAR(20),
  `razaoSocial` VARCHAR(255),
  `cnpj` VARCHAR(20),
  `dateOfBirth` DATE,
  `zipCode` VARCHAR(10),
  `street` VARCHAR(255),
  `number` VARCHAR(20),
  `complement` VARCHAR(100),
  `neighborhood` VARCHAR(100),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `avatarUrl` VARCHAR(255),
  `dataAiHint` VARCHAR(100),
  `roleId` VARCHAR(100),
  `sellerId` VARCHAR(100) UNIQUE,
  `habilitationStatus` VARCHAR(50),
  `accountType` VARCHAR(50),
  `badges` JSON,
  `optInMarketing` BOOLEAN,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  `rgNumber` VARCHAR(50),
  `rgIssuer` VARCHAR(50),
  `rgIssueDate` DATE,
  `rgState` VARCHAR(50),
  `homePhone` VARCHAR(20),
  `gender` VARCHAR(50),
  `profession` VARCHAR(100),
  `nationality` VARCHAR(100),
  `maritalStatus` VARCHAR(50),
  `propertyRegime` VARCHAR(100),
  `spouseName` VARCHAR(255),
  `spouseCpf` VARCHAR(20),
  `inscricaoEstadual` VARCHAR(50),
  `website` VARCHAR(255),
  `responsibleName` VARCHAR(255),
  `responsibleCpf` VARCHAR(20),
  FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `cities` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `stateId` VARCHAR(100) NOT NULL,
  `stateUf` VARCHAR(2) NOT NULL,
  `ibgeCode` VARCHAR(10),
  `lotCount` INT DEFAULT 0,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) UNIQUE,
  `parentCategoryId` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `itemCount` INT DEFAULT 0,
  `displayOrder` INT DEFAULT 0,
  `iconUrl` VARCHAR(255),
  `iconMediaId` VARCHAR(100),
  `dataAiHintIcon` VARCHAR(100),
  FOREIGN KEY (`parentCategoryId`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `courts` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `stateUf` VARCHAR(2) NOT NULL,
  `website` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

-- =================================================================
-- Tables with two or more levels of dependency
-- =================================================================

CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `courtId` VARCHAR(100) NOT NULL,
  `courtName` VARCHAR(150),
  `stateId` VARCHAR(100) NOT NULL,
  `stateUf` VARCHAR(2),
  `zipCode` VARCHAR(10),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`)
);

CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `districtId` VARCHAR(100) NOT NULL,
  `districtName` VARCHAR(150),
  `contactName` VARCHAR(150),
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`)
);

CREATE TABLE IF NOT EXISTS `sellers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `contactName` VARCHAR(255),
  `email` VARCHAR(255),
  `phone` VARCHAR(20),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zipCode` VARCHAR(10),
  `website` VARCHAR(255),
  `logoUrl` VARCHAR(255),
  `logoMediaId` VARCHAR(100),
  `dataAiHintLogo` VARCHAR(100),
  `description` TEXT,
  `userId` VARCHAR(100),
  `memberSince` DATETIME,
  `rating` DECIMAL(3, 2),
  `activeLotsCount` INT,
  `totalSalesValue` DECIMAL(15, 2),
  `auctionsFacilitatedCount` INT,
  `isJudicial` BOOLEAN DEFAULT FALSE,
  `judicialBranchId` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE SET NULL,
  FOREIGN KEY (`judicialBranchId`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `judicial_processes` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `processNumber` VARCHAR(100) NOT NULL,
  `isElectronic` BOOLEAN DEFAULT TRUE,
  `courtId` VARCHAR(100),
  `districtId` VARCHAR(100),
  `branchId` VARCHAR(100),
  `sellerId` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`),
  FOREIGN KEY (`branchId`) REFERENCES `judicial_branches`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `judicial_parties` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `process_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `documentNumber` VARCHAR(50),
  `partyType` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `bens` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT 'DISPONIVEL',
  `categoryId` VARCHAR(100),
  `subcategoryId` VARCHAR(100),
  `judicialProcessId` VARCHAR(100),
  `sellerId` VARCHAR(100),
  `evaluationValue` DECIMAL(15, 2),
  `imageUrl` VARCHAR(255),
  `imageMediaId` VARCHAR(100),
  `galleryImageUrls` JSON,
  `mediaItemIds` JSON,
  `dataAiHint` VARCHAR(100),
  `locationCity` VARCHAR(100),
  `locationState` VARCHAR(100),
  `address` VARCHAR(255),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  -- Add more specific fields from types/index.ts as needed...
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
);

CREATE TABLE IF NOT EXISTS `auctions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50),
  `auctionDate` DATETIME,
  `endDate` DATETIME,
  `totalLots` INT DEFAULT 0,
  `categoryId` VARCHAR(100),
  `auctioneerId` VARCHAR(100),
  `sellerId` VARCHAR(100),
  `mapAddress` VARCHAR(255),
  `imageUrl` VARCHAR(255),
  `imageMediaId` VARCHAR(100),
  `dataAiHint` VARCHAR(100),
  `visits` INT DEFAULT 0,
  `initialOffer` DECIMAL(15, 2),
  `auctionType` VARCHAR(50),
  `auctionStages` JSON,
  `documentsUrl` VARCHAR(255),
  `evaluationReportUrl` VARCHAR(255),
  `auctionCertificateUrl` VARCHAR(255),
  `sellingBranch` VARCHAR(100),
  `automaticBiddingEnabled` BOOLEAN DEFAULT FALSE,
  `silentBiddingEnabled` BOOLEAN DEFAULT FALSE,
  `allowMultipleBidsPerUser` BOOLEAN DEFAULT TRUE,
  `allowInstallmentBids` BOOLEAN DEFAULT FALSE,
  `softCloseEnabled` BOOLEAN DEFAULT FALSE,
  `softCloseMinutes` INT,
  `estimatedRevenue` DECIMAL(15, 2),
  `achievedRevenue` DECIMAL(15, 2),
  `totalHabilitatedUsers` INT,
  `isFeaturedOnMarketplace` BOOLEAN DEFAULT FALSE,
  `marketplaceAnnouncementTitle` VARCHAR(255),
  `judicialProcessId` VARCHAR(100),
  `additionalTriggers` JSON,
  `decrementAmount` DECIMAL(15, 2),
  `decrementIntervalSeconds` INT,
  `floorPrice` DECIMAL(15, 2),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  `slug` VARCHAR(255) UNIQUE,
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`auctioneerId`) REFERENCES `auctioneers`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`)
);

CREATE TABLE IF NOT EXISTS `lots` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `auctionId` VARCHAR(100) NOT NULL,
  `number` VARCHAR(50),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2) NOT NULL,
  `initialPrice` DECIMAL(15, 2),
  `secondInitialPrice` DECIMAL(15, 2),
  `bidIncrementStep` DECIMAL(15, 2),
  `status` VARCHAR(50),
  `bidsCount` INT,
  `views` INT,
  `isFeatured` BOOLEAN,
  `isExclusive` BOOLEAN,
  `discountPercentage` DECIMAL(5, 2),
  `additionalTriggers` JSON,
  `imageUrl` VARCHAR(255),
  `imageMediaId` VARCHAR(100),
  `galleryImageUrls` JSON,
  `mediaItemIds` JSON,
  `categoryId` VARCHAR(100),
  `subcategoryId` VARCHAR(100),
  `sellerId` VARCHAR(100),
  `cityId` VARCHAR(100),
  `stateId` VARCHAR(100),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `mapAddress` VARCHAR(255),
  `endDate` DATETIME,
  `lotSpecificAuctionDate` DATETIME,
  `secondAuctionDate` DATETIME,
  `condition` VARCHAR(100),
  `dataAiHint` VARCHAR(100),
  `winnerId` VARCHAR(100),
  `winningBidTermUrl` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  `slug` VARCHAR(255) UNIQUE,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`),
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`),
  FOREIGN KEY (`winnerId`) REFERENCES `users`(`uid`)
);

CREATE TABLE IF NOT EXISTS `lot_bens` (
    `lotId` VARCHAR(100) NOT NULL,
    `bemId` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`lotId`, `bemId`),
    FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bemId`) REFERENCES `bens`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `media_items` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `fileName` VARCHAR(255),
  `storagePath` VARCHAR(255),
  `title` VARCHAR(255),
  `altText` VARCHAR(255),
  `caption` VARCHAR(255),
  `description` TEXT,
  `mimeType` VARCHAR(100),
  `sizeBytes` INT,
  `urlOriginal` VARCHAR(255),
  `urlThumbnail` VARCHAR(255),
  `urlMedium` VARCHAR(255),
  `urlLarge` VARCHAR(255),
  `linkedLotIds` JSON,
  `dataAiHint` VARCHAR(100),
  `uploadedBy` VARCHAR(100),
  `uploadedAt` DATETIME,
  FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`uid`)
);

CREATE TABLE IF NOT EXISTS `user_documents` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(100) NOT NULL,
  `documentTypeId` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `fileUrl` VARCHAR(255) NOT NULL,
  `fileName` VARCHAR(255),
  `rejectionReason` TEXT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE CASCADE,
  FOREIGN KEY (`documentTypeId`) REFERENCES `document_types`(`id`)
);

CREATE TABLE IF NOT EXISTS `bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lotId` VARCHAR(100) NOT NULL,
  `auctionId` VARCHAR(100) NOT NULL,
  `bidderId` VARCHAR(100) NOT NULL,
  `bidderDisplay` VARCHAR(255),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` DATETIME,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`),
  FOREIGN KEY (`bidderId`) REFERENCES `users`(`uid`)
);

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lotId` VARCHAR(100) NOT NULL,
  `userId` VARCHAR(100) NOT NULL,
  `winningBidAmount` DECIMAL(15, 2) NOT NULL,
  `winDate` DATETIME,
  `paymentStatus` VARCHAR(50),
  `invoiceUrl` VARCHAR(255),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`)
);

CREATE TABLE IF NOT EXISTS `direct_sale_offers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `offerType` VARCHAR(50),
  `price` DECIMAL(15, 2),
  `minimumOfferPrice` DECIMAL(15, 2),
  `status` VARCHAR(50),
  `category` VARCHAR(100),
  `sellerId` VARCHAR(100),
  `locationCity` VARCHAR(100),
  `locationState` VARCHAR(100),
  `imageUrl` VARCHAR(255),
  `imageMediaId` VARCHAR(100),
  `dataAiHint` VARCHAR(100),
  `galleryImageUrls` JSON,
  `mediaItemIds` JSON,
  `views` INT DEFAULT 0,
  `expiresAt` DATETIME,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
);

CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(100) NOT NULL,
  `lotId` VARCHAR(100) NOT NULL,
  `maxAmount` DECIMAL(15, 2) NOT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` DATETIME,
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE CASCADE,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  UNIQUE (`userId`, `lotId`)
);
