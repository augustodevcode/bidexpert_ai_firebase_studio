
-- BidExpert MySQL Schema
-- version 1.1

-- Basic Setup
CREATE TABLE IF NOT EXISTS `platform_settings` (
    `id` VARCHAR(191) PRIMARY KEY,
    `siteTitle` VARCHAR(255) NOT NULL,
    `siteTagline` VARCHAR(255),
    `galleryImageBasePath` VARCHAR(255),
    `storageProvider` VARCHAR(50),
    `firebaseStorageBucket` VARCHAR(255),
    `activeThemeName` VARCHAR(100),
    `themes` JSON,
    `platformPublicIdMasks` JSON,
    `homepageSections` JSON,
    `mentalTriggerSettings` JSON,
    `sectionBadgeVisibility` JSON,
    `mapSettings` JSON,
    `searchPaginationType` VARCHAR(50),
    `searchItemsPerPage` INT,
    `searchLoadMoreCount` INT,
    `showCountdownOnLotDetail` BOOLEAN,
    `showCountdownOnCards` BOOLEAN,
    `showRelatedLotsOnLotDetail` BOOLEAN,
    `relatedLotsCount` INT,
    `defaultUrgencyTimerHours` INT,
    `variableIncrementTable` JSON,
    `biddingSettings` JSON,
    `defaultListItemsPerPage` INT,
    `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `roles` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(191) NOT NULL UNIQUE,
    `name_normalized` VARCHAR(191) NOT NULL UNIQUE,
    `description` TEXT,
    `permissions` JSON,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `lot_categories` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(191) NOT NULL UNIQUE,
    `slug` VARCHAR(191) NOT NULL UNIQUE,
    `description` TEXT,
    `itemCount` INT DEFAULT 0,
    `hasSubcategories` BOOLEAN DEFAULT FALSE,
    `logoUrl` VARCHAR(255),
    `logoMediaId` VARCHAR(191),
    `dataAiHintLogo` VARCHAR(100),
    `coverImageUrl` VARCHAR(255),
    `coverImageMediaId` VARCHAR(191),
    `dataAiHintCover` VARCHAR(100),
    `megaMenuImageUrl` VARCHAR(255),
    `megaMenuImageMediaId` VARCHAR(191),
    `dataAiHintMegaMenu` VARCHAR(100),
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `subcategories` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `parentCategoryId` VARCHAR(191) NOT NULL,
    `description` TEXT,
    `itemCount` INT DEFAULT 0,
    `displayOrder` INT DEFAULT 0,
    `iconUrl` VARCHAR(255),
    `iconMediaId` VARCHAR(191),
    `dataAiHintIcon` VARCHAR(100),
    FOREIGN KEY (`parentCategoryId`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `states` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(191) NOT NULL UNIQUE,
    `uf` VARCHAR(2) NOT NULL UNIQUE,
    `slug` VARCHAR(191) NOT NULL UNIQUE,
    `cityCount` INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `cities` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `stateId` VARCHAR(191) NOT NULL,
    `stateUf` VARCHAR(2) NOT NULL,
    `ibgeCode` VARCHAR(10),
    `lotCount` INT DEFAULT 0,
    FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `media_items` (
    `id` VARCHAR(191) PRIMARY KEY,
    `fileName` VARCHAR(255) NOT NULL,
    `storagePath` VARCHAR(1024) NOT NULL,
    `title` VARCHAR(255),
    `altText` VARCHAR(255),
    `caption` VARCHAR(500),
    `description` TEXT,
    `mimeType` VARCHAR(100) NOT NULL,
    `sizeBytes` INT NOT NULL,
    `urlOriginal` VARCHAR(1024) NOT NULL,
    `urlThumbnail` VARCHAR(1024),
    `urlMedium` VARCHAR(1024),
    `urlLarge` VARCHAR(1024),
    `linkedLotIds` JSON,
    `dataAiHint` VARCHAR(100),
    `uploadedBy` VARCHAR(191),
    `uploadedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `document_templates` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `content` TEXT,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `contact_messages` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN DEFAULT FALSE,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `document_types` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `isRequired` BOOLEAN NOT NULL DEFAULT TRUE,
    `appliesTo` VARCHAR(50) -- e.g., 'PHYSICAL', 'LEGAL', 'ALL'
);

-- Tables with dependencies
CREATE TABLE IF NOT EXISTS `users` (
    `uid` VARCHAR(191) PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255),
    `fullName` VARCHAR(255),
    `cpf` VARCHAR(20) UNIQUE,
    `cellPhone` VARCHAR(20),
    `razaoSocial` VARCHAR(255),
    `cnpj` VARCHAR(255) UNIQUE,
    `dateOfBirth` DATETIME,
    `zipCode` VARCHAR(20),
    `street` VARCHAR(255),
    `number` VARCHAR(50),
    `complement` VARCHAR(100),
    `neighborhood` VARCHAR(100),
    `city` VARCHAR(100),
    `state` VARCHAR(50),
    `avatarUrl` VARCHAR(1024),
    `dataAiHint` VARCHAR(100),
    `roleId` VARCHAR(191),
    `sellerId` VARCHAR(191),
    `habilitationStatus` VARCHAR(50),
    `accountType` VARCHAR(50),
    `badges` JSON,
    `optInMarketing` BOOLEAN DEFAULT FALSE,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `auctioneers` (
    `id` VARCHAR(191) PRIMARY KEY,
    `publicId` VARCHAR(191) UNIQUE,
    `slug` VARCHAR(255) UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `registrationNumber` VARCHAR(100),
    `contactName` VARCHAR(255),
    `email` VARCHAR(255),
    `phone` VARCHAR(20),
    `address` VARCHAR(255),
    `city` VARCHAR(100),
    `state` VARCHAR(50),
    `zipCode` VARCHAR(20),
    `website` VARCHAR(255),
    `logoUrl` VARCHAR(1024),
    `logoMediaId` VARCHAR(191),
    `dataAiHintLogo` VARCHAR(100),
    `description` TEXT,
    `userId` VARCHAR(191),
    `memberSince` DATETIME,
    `rating` FLOAT,
    `auctionsConductedCount` INT,
    `totalValueSold` DECIMAL(15, 2),
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `sellers` (
    `id` VARCHAR(191) PRIMARY KEY,
    `publicId` VARCHAR(191) UNIQUE,
    `slug` VARCHAR(255) UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `contactName` VARCHAR(255),
    `email` VARCHAR(255),
    `phone` VARCHAR(20),
    `address` VARCHAR(255),
    `city` VARCHAR(100),
    `state` VARCHAR(50),
    `zipCode` VARCHAR(20),
    `website` VARCHAR(255),
    `logoUrl` VARCHAR(1024),
    `logoMediaId` VARCHAR(191),
    `dataAiHintLogo` VARCHAR(100),
    `description` TEXT,
    `isJudicial` BOOLEAN DEFAULT FALSE,
    `judicialBranchId` VARCHAR(191),
    `userId` VARCHAR(191),
    `memberSince` DATETIME,
    `rating` FLOAT,
    `activeLotsCount` INT,
    `totalSalesValue` DECIMAL(15, 2),
    `auctionsFacilitatedCount` INT,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `courts` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255),
  `stateUf` VARCHAR(2),
  `website` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255),
  `courtId` VARCHAR(191),
  `stateId` VARCHAR(191),
  `zipCode` VARCHAR(20),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`)
);

CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255),
  `districtId` VARCHAR(191),
  `contactName` VARCHAR(255),
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`)
);

CREATE TABLE IF NOT EXISTS `judicial_processes` (
  `id` VARCHAR(191) PRIMARY KEY,
  `publicId` VARCHAR(191) UNIQUE,
  `processNumber` VARCHAR(255) NOT NULL,
  `isElectronic` BOOLEAN,
  `courtId` VARCHAR(191),
  `districtId` VARCHAR(191),
  `branchId` VARCHAR(191),
  `sellerId` VARCHAR(191),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`),
  FOREIGN KEY (`branchId`) REFERENCES `judicial_branches`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
);

CREATE TABLE IF NOT EXISTS `judicial_parties` (
  `id` VARCHAR(191) PRIMARY KEY,
  `process_id` VARCHAR(191),
  `name` VARCHAR(255) NOT NULL,
  `documentNumber` VARCHAR(50),
  `partyType` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `bens` (
  `id` VARCHAR(191) PRIMARY KEY,
  `publicId` VARCHAR(191) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50),
  `categoryId` VARCHAR(191),
  `subcategoryId` VARCHAR(191),
  `judicialProcessId` VARCHAR(191),
  `sellerId` VARCHAR(191),
  `evaluationValue` DECIMAL(15, 2),
  `imageUrl` VARCHAR(1024),
  `imageMediaId` VARCHAR(191),
  `galleryImageUrls` JSON,
  `mediaItemIds` JSON,
  `dataAiHint` VARCHAR(100),
  `locationCity` VARCHAR(100),
  `locationState` VARCHAR(100),
  `address` VARCHAR(255),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `plate` VARCHAR(10),
  `make` VARCHAR(50),
  `model` VARCHAR(50),
  `version` VARCHAR(100),
  `year` INT,
  `modelYear` INT,
  `mileage` INT,
  `color` VARCHAR(30),
  `fuelType` VARCHAR(30),
  `transmissionType` VARCHAR(30),
  `hasKey` BOOLEAN,
  `propertyRegistrationNumber` VARCHAR(50),
  `iptuNumber` VARCHAR(50),
  `isOccupied` BOOLEAN,
  `area` DECIMAL(10, 2),
  `bedrooms` INT,
  `bathrooms` INT,
  `parkingSpaces` INT,
  `amenities` JSON,
  `hoursUsed` INT,
  `serialNumber` VARCHAR(100),
  `breed` VARCHAR(50),
  `sex` VARCHAR(10),
  `age` VARCHAR(30),
  `vaccinationStatus` VARCHAR(200),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
);

CREATE TABLE IF NOT EXISTS `auctions` (
    `id` VARCHAR(191) PRIMARY KEY,
    `publicId` VARCHAR(191) UNIQUE,
    `slug` VARCHAR(255) UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` VARCHAR(50),
    `auctionType` VARCHAR(50),
    `auctionDate` DATETIME NOT NULL,
    `endDate` DATETIME,
    `imageUrl` VARCHAR(1024),
    `imageMediaId` VARCHAR(191),
    `dataAiHint` VARCHAR(100),
    `documentsUrl` VARCHAR(1024),
    `auctioneerId` VARCHAR(191),
    `sellerId` VARCHAR(191),
    `categoryId` VARCHAR(191),
    `visits` INT DEFAULT 0,
    `totalLots` INT DEFAULT 0,
    `isFeaturedOnMarketplace` BOOLEAN DEFAULT FALSE,
    `marketplaceAnnouncementTitle` VARCHAR(255),
    `automaticBiddingEnabled` BOOLEAN DEFAULT FALSE,
    `softCloseEnabled` BOOLEAN DEFAULT FALSE,
    `softCloseMinutes` INT DEFAULT 2,
    `auctionStages` JSON,
    `estimatedRevenue` DECIMAL(15, 2),
    `achievedRevenue` DECIMAL(15, 2),
    `totalHabilitatedUsers` INT,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`auctioneerId`) REFERENCES `auctioneers`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `lots` (
    `id` VARCHAR(191) PRIMARY KEY,
    `publicId` VARCHAR(191) UNIQUE,
    `slug` VARCHAR(255) UNIQUE,
    `number` VARCHAR(50),
    `auctionId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` VARCHAR(50),
    `price` DECIMAL(15, 2) NOT NULL,
    `initialPrice` DECIMAL(15, 2),
    `secondInitialPrice` DECIMAL(15, 2),
    `bidIncrementStep` DECIMAL(15, 2),
    `isFeatured` BOOLEAN DEFAULT FALSE,
    `isExclusive` BOOLEAN,
    `bidsCount` INT,
    `views` INT,
    `winnerId` VARCHAR(191),
    `categoryId` VARCHAR(191),
    `subcategoryId` VARCHAR(191),
    `imageUrl` VARCHAR(1024),
    `imageMediaId` VARCHAR(191),
    `dataAiHint` VARCHAR(100),
    `galleryImageUrls` JSON,
    `mediaItemIds` JSON,
    `bemIds` JSON,
    `locationCity` VARCHAR(100),
    `locationState` VARCHAR(100),
    `address` VARCHAR(255),
    `latitude` DECIMAL(10, 8),
    `longitude` DECIMAL(11, 8),
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`winnerId`) REFERENCES `users`(`uid`) ON DELETE SET NULL,
    FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `lot_bens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lotId` VARCHAR(191) NOT NULL,
  `bemId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bemId`) REFERENCES `bens`(`id`) ON DELETE CASCADE,
  UNIQUE (`lotId`, `bemId`)
);

CREATE TABLE IF NOT EXISTS `user_documents` (
  `id` VARCHAR(191) PRIMARY KEY,
  `userId` VARCHAR(191) NOT NULL,
  `documentTypeId` VARCHAR(191) NOT NULL,
  `fileUrl` VARCHAR(1024) NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `rejectionReason` TEXT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE CASCADE,
  FOREIGN KEY (`documentTypeId`) REFERENCES `document_types`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `bids` (
  `id` VARCHAR(191) PRIMARY KEY,
  `lotId` VARCHAR(191) NOT NULL,
  `auctionId` VARCHAR(191) NOT NULL,
  `bidderId` VARCHAR(191) NOT NULL,
  `bidderDisplay` VARCHAR(255),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bidderId`) REFERENCES `users`(`uid`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` VARCHAR(191) PRIMARY KEY,
  `lotId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `winningBidAmount` DECIMAL(15, 2) NOT NULL,
  `winDate` DATETIME NOT NULL,
  `paymentStatus` VARCHAR(50) NOT NULL,
  `invoiceUrl` VARCHAR(1024),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE RESTRICT
);

-- Adicionar outras tabelas conforme necessário:
-- direct_sale_offers, lot_questions, lot_reviews, user_lot_max_bids, etc.

