

-- MySQL Schema for BidExpert
-- Version 2.0 - With all tables and correct creation order
-- All column names converted to camelCase

-- =================================================================
-- 1. TABLES WITH NO FOREIGN KEY DEPENDENCIES (BASE TABLES)
-- =================================================================

CREATE TABLE IF NOT EXISTS `platformSettings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `siteTitle` VARCHAR(100),
  `siteTagline` VARCHAR(200),
  `galleryImageBasePath` VARCHAR(200),
  `storageProvider` VARCHAR(50),
  `firebaseStorageBucket` VARCHAR(200),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `nameNormalized` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `permissions` JSON,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `states` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `uf` VARCHAR(2) NOT NULL UNIQUE,
  `slug` VARCHAR(100) UNIQUE,
  `cityCount` INT DEFAULT 0,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lotCategories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) UNIQUE,
  `description` VARCHAR(500),
  `hasSubcategories` BOOLEAN,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `documentTemplates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `content` TEXT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contactMessages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `isRead` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `documentTypes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` VARCHAR(255),
  `isRequired` BOOLEAN DEFAULT TRUE,
  `appliesTo` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- 2. TABLES WITH ONE LEVEL OF DEPENDENCY
-- =================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,  
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255),
  `fullName` VARCHAR(150),
  `roleId` BIGINT UNSIGNED,
  `sellerId` BIGINT UNSIGNED,
  `habilitationStatus` VARCHAR(50) DEFAULT 'PENDING_DOCUMENTS',
  `accountType` VARCHAR(50) DEFAULT 'PHYSICAL',
  `avatarUrl` VARCHAR(255),
  `dataAiHint` VARCHAR(100),
  `badges` JSON,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cities` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `stateId` BIGINT UNSIGNED NOT NULL,
  `stateUf` VARCHAR(2),
  `ibgeCode` VARCHAR(10),
  `lotCount` INT DEFAULT 0,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100),
  `parentCategoryId` BIGINT UNSIGNED NOT NULL,
  `description` VARCHAR(500),
  `displayOrder` INT DEFAULT 0,
  `iconUrl` VARCHAR(255),
  `iconMediaId` VARCHAR(100),
  `dataAiHintIcon` VARCHAR(100),
  FOREIGN KEY (`parentCategoryId`) REFERENCES `lotCategories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `courts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `stateUf` VARCHAR(2),
  `website` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- 3. TABLES WITH TWO OR MORE LEVELS OF DEPENDENCY
-- =================================================================

CREATE TABLE IF NOT EXISTS `judicialDistricts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) UNIQUE,
  `courtId` BIGINT UNSIGNED,
  `stateId` BIGINT UNSIGNED,
  `zipCode` VARCHAR(10),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicialBranches` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) UNIQUE,
  `districtId` BIGINT UNSIGNED,
  `contactName` VARCHAR(150),
  `phone` VARCHAR(20),
  `email` VARCHAR(150),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`districtId`) REFERENCES `judicialDistricts`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sellers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `contactName` VARCHAR(150),
  `email` VARCHAR(150),
  `phone` VARCHAR(20),
  `address` VARCHAR(200),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zipCode` VARCHAR(10),
  `website` VARCHAR(255),
  `logoUrl` VARCHAR(255),
  `logoMediaId` VARCHAR(100),
  `dataAiHintLogo` VARCHAR(100),
  `description` TEXT,
  `userId` BIGINT UNSIGNED,
  `isJudicial` BOOLEAN DEFAULT FALSE,
  `judicialBranchId` BIGINT UNSIGNED,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`judicialBranchId`) REFERENCES `judicialBranches`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `registrationNumber` VARCHAR(50),
  `contactName` VARCHAR(150),
  `email` VARCHAR(150),
  `phone` VARCHAR(20),
  `address` VARCHAR(200),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zipCode` VARCHAR(10),
  `website` VARCHAR(255),
  `logoUrl` VARCHAR(255),
  `logoMediaId` VARCHAR(100),
  `dataAiHintLogo` VARCHAR(100),
  `description` TEXT,
  `userId` BIGINT UNSIGNED,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicialProcesses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `processNumber` VARCHAR(100) NOT NULL,
  `isElectronic` BOOLEAN DEFAULT TRUE,
  `courtId` BIGINT UNSIGNED,
  `districtId` BIGINT UNSIGNED,
  `branchId` BIGINT UNSIGNED,
  `sellerId` BIGINT UNSIGNED,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`districtId`) REFERENCES `judicialDistricts`(`id`),
  FOREIGN KEY (`branchId`) REFERENCES `judicialBranches`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicialParties` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `processId` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `documentNumber` VARCHAR(50),
  `partyType` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`processId`) REFERENCES `judicialProcesses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT 'DISPONIVEL',
  `categoryId` BIGINT UNSIGNED,
  `subcategoryId` BIGINT UNSIGNED,
  `judicialProcessId` BIGINT UNSIGNED,
  `sellerId` BIGINT UNSIGNED,
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
  FOREIGN KEY (`categoryId`) REFERENCES `lotCategories`(`id`),
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`judicialProcessId`) REFERENCES `judicialProcesses`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auctions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(255) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) DEFAULT 'RASCUNHO',
  `auctionDate` DATETIME,
  `endDate` DATETIME,
  `auctioneerId` BIGINT UNSIGNED,
  `sellerId` BIGINT UNSIGNED,
  `categoryId` BIGINT UNSIGNED,
  `auctionType` VARCHAR(50),
  `imageUrl` VARCHAR(255),
  `imageMediaId` VARCHAR(100),
  `documentsUrl` VARCHAR(255),
  `visits` INT DEFAULT 0,
  `totalLots` INT DEFAULT 0,
  `initialOffer` DECIMAL(15, 2),
  `isFavorite` BOOLEAN DEFAULT FALSE,
  `dataAiHint` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`auctioneerId`) REFERENCES `auctioneers`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`categoryId`) REFERENCES `lotCategories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `auctionId` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(255),
  `number` VARCHAR(20),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2) NOT NULL,
  `initialPrice` DECIMAL(15, 2),
  `secondInitialPrice` DECIMAL(15, 2),
  `bidIncrementStep` DECIMAL(10, 2),
  `status` VARCHAR(50) DEFAULT 'EM_BREVE',
  `bidsCount` INT DEFAULT 0,
  `views` INT DEFAULT 0,
  `isFeatured` BOOLEAN DEFAULT FALSE,
  `isExclusive` BOOLEAN DEFAULT FALSE,
  `discountPercentage` INT,
  `additionalTriggers` JSON,
  `imageUrl` VARCHAR(255),
  `imageMediaId` VARCHAR(100),
  `galleryImageUrls` JSON,
  `mediaItemIds` JSON,
  `type` VARCHAR(100),
  `categoryId` BIGINT UNSIGNED,
  `subcategoryId` BIGINT UNSIGNED,
  `auctionName` VARCHAR(255),
  `sellerId` BIGINT UNSIGNED,
  `sellerName` VARCHAR(150),
  `auctioneerId` BIGINT UNSIGNED,
  `cityId` BIGINT UNSIGNED,
  `stateId` BIGINT UNSIGNED,
  `cityName` VARCHAR(100),
  `stateUf` VARCHAR(2),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `mapAddress` VARCHAR(255),
  `mapEmbedUrl` VARCHAR(500),
  `mapStaticImageUrl` VARCHAR(255),
  `endDate` DATETIME,
  `auctionDate` DATETIME,
  `lotSpecificAuctionDate` DATETIME,
  `secondAuctionDate` DATETIME,
  `condition` VARCHAR(100),
  `dataAiHint` VARCHAR(100),
  `winnerId` BIGINT UNSIGNED,
  `winningBidTermUrl` VARCHAR(255),
  `allowInstallmentBids` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoryId`) REFERENCES `lotCategories`(`id`),
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`),
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`),
  FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lotBens` (
  `lotId` BIGINT UNSIGNED NOT NULL,
  `bemId` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`lotId`, `bemId`),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`bemId`) REFERENCES `bens`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mediaItems` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `fileName` VARCHAR(255) NOT NULL UNIQUE,
  `storagePath` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255),
  `altText` VARCHAR(255),
  `caption` VARCHAR(500),
  `description` TEXT,
  `mimeType` VARCHAR(100) NOT NULL,
  `sizeBytes` INT,
  `urlOriginal` VARCHAR(255) NOT NULL,
  `urlThumbnail` VARCHAR(255),
  `urlMedium` VARCHAR(255),
  `urlLarge` VARCHAR(255),
  `linkedLotIds` JSON,
  `dataAiHint` VARCHAR(100),
  `uploadedBy` BIGINT UNSIGNED,
  `uploadedAt` DATETIME,
  FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `userDocuments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` BIGINT UNSIGNED NOT NULL,
  `documentTypeId` BIGINT UNSIGNED NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `fileUrl` VARCHAR(255) NOT NULL,
  `fileName` VARCHAR(255),
  `rejectionReason` TEXT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`documentTypeId`) REFERENCES `documentTypes`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bids` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `lotId` BIGINT UNSIGNED NOT NULL,
  `auctionId` VARCHAR(100) NOT NULL,
  `bidderId` BIGINT UNSIGNED NOT NULL,
  `bidderDisplay` VARCHAR(150),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` DATETIME NOT NULL,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bidderId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `userWins` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `lotId` BIGINT UNSIGNED NOT NULL,
  `userId` BIGINT UNSIGNED NOT NULL,
  `winningBidAmount` DECIMAL(15, 2) NOT NULL,
  `winDate` DATETIME NOT NULL,
  `paymentStatus` VARCHAR(50) NOT NULL,
  `invoiceUrl` VARCHAR(255),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `directSaleOffers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `offerType` VARCHAR(50),
  `price` DECIMAL(15, 2),
  `minimumOfferPrice` DECIMAL(15, 2),
  `status` VARCHAR(50) DEFAULT 'ACTIVE',
  `category` VARCHAR(100),
  `sellerId` BIGINT UNSIGNED,
  `sellerName` VARCHAR(150),
  `sellerLogoUrl` VARCHAR(255),
  `dataAiHintSellerLogo` VARCHAR(100),
  `locationCity` VARCHAR(100),
  `locationState` VARCHAR(100),
  `imageUrl` VARCHAR(255),
  `imageMediaId` VARCHAR(100),
  `dataAiHint` VARCHAR(100),
  `galleryImageUrls` JSON,
  `mediaItemIds` JSON,
  `itemsIncluded` JSON,
  `views` INT DEFAULT 0,
  `expiresAt` DATETIME,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `userLotMaxBids` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` BIGINT UNSIGNED NOT NULL,
  `lotId` BIGINT UNSIGNED NOT NULL,
  `maxAmount` DECIMAL(15, 2) NOT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` DATETIME,
  UNIQUE (`userId`, `lotId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;