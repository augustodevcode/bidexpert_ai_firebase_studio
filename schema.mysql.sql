-- BidExpert MySQL Schema
-- This schema is designed for MySQL and defines the structure for the online auction platform.

--
-- Platform Settings & Core Configuration
--
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `siteTitle` VARCHAR(150) NOT NULL,
  `siteTagline` VARCHAR(255),
  `galleryImageBasePath` VARCHAR(255) NOT NULL DEFAULT '/uploads/media/',
  `storageProvider` VARCHAR(50) NOT NULL DEFAULT 'local',
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
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

--
-- Roles & Permissions
--
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `name_normalized` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `permissions` JSON,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

--
-- Location Data
--
CREATE TABLE IF NOT EXISTS `states` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `uf` VARCHAR(2) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `cityCount` INT DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `cities` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `stateId` VARCHAR(100) NOT NULL,
  `stateUf` VARCHAR(2) NOT NULL,
  `ibgeCode` VARCHAR(10),
  `lotCount` INT DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE CASCADE
);

--
-- Judicial Entities
--
CREATE TABLE IF NOT EXISTS `courts` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `stateId` VARCHAR(100),
  `stateUf` VARCHAR(2) NOT NULL,
  `website` VARCHAR(255),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `courtId` VARCHAR(100) NOT NULL,
  `courtName` VARCHAR(150),
  `stateId` VARCHAR(100) NOT NULL,
  `stateUf` VARCHAR(2),
  `zipCode` VARCHAR(10),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `districtId` VARCHAR(100) NOT NULL,
  `districtName` VARCHAR(150),
  `contactName` VARCHAR(150),
  `phone` VARCHAR(20),
  `email` VARCHAR(100),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`) ON DELETE CASCADE
);

--
-- Professional & Company Entities
--
CREATE TABLE IF NOT EXISTS `sellers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `contactName` VARCHAR(150),
  `email` VARCHAR(100),
  `phone` VARCHAR(20),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(100),
  `zipCode` VARCHAR(10),
  `website` VARCHAR(255),
  `logoUrl` VARCHAR(255),
  `logoMediaId` VARCHAR(100),
  `dataAiHintLogo` VARCHAR(50),
  `description` TEXT,
  `userId` VARCHAR(100),
  `memberSince` TIMESTAMP,
  `rating` DECIMAL(2, 1),
  `activeLotsCount` INT DEFAULT 0,
  `totalSalesValue` DECIMAL(15, 2) DEFAULT 0,
  `auctionsFacilitatedCount` INT DEFAULT 0,
  `isJudicial` BOOLEAN NOT NULL DEFAULT FALSE,
  `judicialBranchId` VARCHAR(100),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`judicialBranchId`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `registrationNumber` VARCHAR(50),
  `contactName` VARCHAR(150),
  `email` VARCHAR(100),
  `phone` VARCHAR(20),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(100),
  `zipCode` VARCHAR(10),
  `website` VARCHAR(255),
  `logoUrl` VARCHAR(255),
  `logoMediaId` VARCHAR(100),
  `dataAiHintLogo` VARCHAR(50),
  `description` TEXT,
  `userId` VARCHAR(100),
  `memberSince` TIMESTAMP,
  `rating` DECIMAL(2, 1),
  `auctionsConductedCount` INT DEFAULT 0,
  `totalValueSold` DECIMAL(15, 2) DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

--
-- Users & Related Data
--
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `uid` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `fullName` VARCHAR(150) NOT NULL,
  `cpf` VARCHAR(20),
  `cellPhone` VARCHAR(20),
  `razaoSocial` VARCHAR(150),
  `cnpj` VARCHAR(20),
  `dateOfBirth` TIMESTAMP,
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
  `sellerId` VARCHAR(100),
  `habilitationStatus` VARCHAR(50) NOT NULL DEFAULT 'PENDING_DOCUMENTS',
  `accountType` VARCHAR(50) NOT NULL DEFAULT 'PHYSICAL',
  `badges` JSON,
  `optInMarketing` BOOLEAN DEFAULT FALSE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
);

--
-- Core Auction Entities
--
CREATE TABLE IF NOT EXISTS `judicial_processes` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `processNumber` VARCHAR(100) NOT NULL,
  `isElectronic` BOOLEAN NOT NULL DEFAULT TRUE,
  `courtId` VARCHAR(100),
  `courtName` VARCHAR(150),
  `districtId` VARCHAR(100),
  `districtName` VARCHAR(150),
  `branchId` VARCHAR(100),
  `branchName` VARCHAR(150),
  `sellerId` VARCHAR(100),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`branchId`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `itemCount` INT DEFAULT 0,
  `hasSubcategories` BOOLEAN DEFAULT FALSE,
  `logoUrl` VARCHAR(255),
  `logoMediaId` VARCHAR(100),
  `dataAiHintLogo` VARCHAR(50),
  `coverImageUrl` VARCHAR(255),
  `coverImageMediaId` VARCHAR(100),
  `dataAiHintCover` VARCHAR(50),
  `megaMenuImageUrl` VARCHAR(255),
  `megaMenuImageMediaId` VARCHAR(100),
  `dataAiHintMegaMenu` VARCHAR(50),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `parentCategoryId` VARCHAR(100) NOT NULL,
  `parentCategoryName` VARCHAR(100),
  `description` TEXT,
  `itemCount` INT DEFAULT 0,
  `displayOrder` INT DEFAULT 0,
  `iconUrl` VARCHAR(255),
  `iconMediaId` VARCHAR(100),
  `dataAiHintIcon` VARCHAR(50),
  FOREIGN KEY (`parentCategoryId`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE
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
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `auctions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT 'RASCUNHO',
  `auctionDate` TIMESTAMP,
  `endDate` TIMESTAMP,
  `totalLots` INT DEFAULT 0,
  `category` VARCHAR(100),
  `auctioneer` VARCHAR(150),
  `auctioneerId` VARCHAR(100),
  `auctioneerLogoUrl` VARCHAR(255),
  `seller` VARCHAR(150),
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
  `softCloseMinutes` INT DEFAULT 2,
  `estimatedRevenue` DECIMAL(15, 2),
  `achievedRevenue` DECIMAL(15, 2),
  `totalHabilitatedUsers` INT DEFAULT 0,
  `isFeaturedOnMarketplace` BOOLEAN DEFAULT FALSE,
  `marketplaceAnnouncementTitle` VARCHAR(150),
  `judicialProcessId` VARCHAR(100),
  `additionalTriggers` JSON,
  `decrementAmount` DECIMAL(15, 2),
  `decrementIntervalSeconds` INT,
  `floorPrice` DECIMAL(15, 2),
  `autoRelistSettings` JSON,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`auctioneerId`) REFERENCES `auctioneers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `lots` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `auctionId` VARCHAR(100) NOT NULL,
  `number` VARCHAR(20),
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2) NOT NULL DEFAULT 0,
  `initialPrice` DECIMAL(15, 2),
  `secondInitialPrice` DECIMAL(15, 2),
  `bidIncrementStep` DECIMAL(15, 2),
  `status` VARCHAR(50) NOT NULL DEFAULT 'EM_BREVE',
  `bidsCount` INT DEFAULT 0,
  `views` INT DEFAULT 0,
  `isFeatured` BOOLEAN DEFAULT FALSE,
  `isExclusive` BOOLEAN DEFAULT FALSE,
  `discountPercentage` DECIMAL(5, 2),
  `additionalTriggers` JSON,
  `imageUrl` VARCHAR(255),
  `imageMediaId` VARCHAR(100),
  `winningBidTermUrl` VARCHAR(255),
  `galleryImageUrls` JSON,
  `mediaItemIds` JSON,
  `categoryId` VARCHAR(100),
  `subcategoryId` VARCHAR(100),
  `winnerId` VARCHAR(100),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `lot_bens` (
    `lotId` VARCHAR(100) NOT NULL,
    `bemId` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`lotId`, `bemId`),
    FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bemId`) REFERENCES `bens`(`id`) ON DELETE CASCADE
);

--
-- Other Entities & Junction Tables
--
CREATE TABLE IF NOT EXISTS `media_items` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `fileName` VARCHAR(255) NOT NULL,
  `storagePath` VARCHAR(255) NOT NULL,
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
  `uploadedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `document_templates` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `content` TEXT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `isRead` BOOLEAN DEFAULT FALSE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `document_types` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `isRequired` BOOLEAN DEFAULT TRUE,
  `appliesTo` VARCHAR(50) DEFAULT 'ALL'
);

CREATE TABLE IF NOT EXISTS `user_documents` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(100) NOT NULL,
  `documentTypeId` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `fileUrl` VARCHAR(255) NOT NULL,
  `fileName` VARCHAR(255),
  `rejectionReason` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`documentTypeId`) REFERENCES `document_types`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lotId` VARCHAR(100) NOT NULL,
  `auctionId` VARCHAR(100),
  `bidderId` VARCHAR(100) NOT NULL,
  `bidderDisplay` VARCHAR(150),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`bidderId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lotId` VARCHAR(100) NOT NULL,
  `userId` VARCHAR(100) NOT NULL,
  `winningBidAmount` DECIMAL(15, 2) NOT NULL,
  `winDate` TIMESTAMP NOT NULL,
  `paymentStatus` VARCHAR(50) NOT NULL,
  `invoiceUrl` VARCHAR(255),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `direct_sale_offers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `offerType` VARCHAR(50) NOT NULL,
  `price` DECIMAL(15, 2),
  `minimumOfferPrice` DECIMAL(15, 2),
  `status` VARCHAR(50) NOT NULL,
  `category` VARCHAR(100),
  `sellerId` VARCHAR(100),
  `sellerName` VARCHAR(150),
  `locationCity` VARCHAR(100),
  `locationState` VARCHAR(100),
  `imageUrl` VARCHAR(255),
  `imageMediaId` VARCHAR(100),
  `dataAiHint` VARCHAR(100),
  `galleryImageUrls` JSON,
  `mediaItemIds` JSON,
  `itemsIncluded` JSON,
  `views` INT DEFAULT 0,
  `expiresAt` TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(100) NOT NULL,
  `lotId` VARCHAR(100) NOT NULL,
  `maxAmount` DECIMAL(15, 2) NOT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`userId`, `lotId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE
);