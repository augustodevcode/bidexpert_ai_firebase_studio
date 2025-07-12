-- BidExpert MySQL Schema
-- Version 2.0
-- Corrected Creation Order

-- Nível 1: Tabelas Independentes
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `siteTitle` VARCHAR(100),
  `siteTagline` VARCHAR(200),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `name_normalized` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `permissions` JSON,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `states` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `uf` VARCHAR(2) NOT NULL UNIQUE,
  `slug` VARCHAR(100) UNIQUE,
  `cityCount` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_templates` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `content` LONGTEXT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(255),
  `message` TEXT NOT NULL,
  `isRead` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_types` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `isRequired` BOOLEAN DEFAULT TRUE,
  `appliesTo` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nível 2: Dependem do Nível 1
CREATE TABLE IF NOT EXISTS `cities` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `stateId` VARCHAR(100) NOT NULL,
  `stateUf` VARCHAR(2) NOT NULL,
  `ibgeCode` VARCHAR(10),
  `lotCount` INT DEFAULT 0,
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  FOREIGN KEY (`parentCategoryId`) REFERENCES `lot_categories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `courts` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `stateUf` VARCHAR(2) NOT NULL,
  `website` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`stateUf`) REFERENCES `states`(`uf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `courtId` VARCHAR(100),
  `stateId` VARCHAR(100),
  `zipCode` VARCHAR(10),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nível 3: Dependem dos Níveis 1 e 2
CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `districtId` VARCHAR(100) NOT NULL,
  `contactName` VARCHAR(150),
  `phone` VARCHAR(20),
  `email` VARCHAR(150),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `uid` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255),
  `fullName` VARCHAR(255),
  `roleId` VARCHAR(100),
  `habilitationStatus` VARCHAR(50),
  `accountType` VARCHAR(50),
  `badges` JSON,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nível 4: Dependem dos Níveis 1, 2 e 3
CREATE TABLE IF NOT EXISTS `sellers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `contactName` VARCHAR(150),
  `email` VARCHAR(150),
  `phone` VARCHAR(20),
  `address` VARCHAR(200),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zipCode` VARCHAR(10),
  `website` VARCHAR(255),
  `logoUrl` VARCHAR(255),
  `dataAiHintLogo` VARCHAR(100),
  `description` TEXT,
  `userId` VARCHAR(100),
  `isJudicial` BOOLEAN DEFAULT FALSE,
  `judicialBranchId` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`),
  FOREIGN KEY (`judicialBranchId`) REFERENCES `judicial_branches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
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
  `dataAiHintLogo` VARCHAR(100),
  `description` TEXT,
  `userId` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `uploadedAt` DATETIME,
  FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nível 5: Dependem dos Níveis 1-4
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_parties` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `process_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `documentNumber` VARCHAR(50),
  `partyType` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auctions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(255) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50),
  `auctionDate` DATETIME,
  `endDate` DATETIME,
  `auctioneerId` VARCHAR(100),
  `sellerId` VARCHAR(100),
  `categoryId` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`auctioneerId`) REFERENCES `auctioneers`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`documentTypeId`) REFERENCES `document_types`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `direct_sale_offers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `offerType` VARCHAR(50) NOT NULL,
  `price` DECIMAL(15, 2),
  `minimumOfferPrice` DECIMAL(15, 2),
  `status` VARCHAR(50) NOT NULL,
  `category` VARCHAR(100),
  `sellerId` VARCHAR(100) NOT NULL,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nível 6: Dependem dos Níveis 1-5
CREATE TABLE IF NOT EXISTS `lots` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `auctionId` VARCHAR(100) NOT NULL,
  `number` VARCHAR(50),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2),
  `initialPrice` DECIMAL(15, 2),
  `secondInitialPrice` DECIMAL(15, 2),
  `status` VARCHAR(50),
  `categoryId` VARCHAR(100),
  `subcategoryId` VARCHAR(100),
  `sellerId` VARCHAR(100),
  `winnerId` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`),
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nível 7: Dependem dos Níveis 1-6
CREATE TABLE IF NOT EXISTS `lot_bens` (
    `lotId` VARCHAR(100) NOT NULL,
    `bemId` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`lotId`, `bemId`),
    FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bemId`) REFERENCES `bens`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lotId` VARCHAR(100) NOT NULL,
  `auctionId` VARCHAR(100) NOT NULL,
  `bidderId` VARCHAR(100) NOT NULL,
  `bidderDisplay` VARCHAR(150),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` DATETIME,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`),
  FOREIGN KEY (`bidderId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lotId` VARCHAR(100) NOT NULL,
  `userId` VARCHAR(100) NOT NULL,
  `winningBidAmount` DECIMAL(15, 2) NOT NULL,
  `winDate` DATETIME,
  `paymentStatus` VARCHAR(50),
  `invoiceUrl` VARCHAR(255),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(100) NOT NULL,
  `lotId` VARCHAR(100) NOT NULL,
  `maxAmount` DECIMAL(15, 2) NOT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` DATETIME,
  UNIQUE KEY `user_lot_unique` (`userId`, `lotId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_reviews` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lotId` VARCHAR(100) NOT NULL,
  `auctionId` VARCHAR(100) NOT NULL,
  `userId` VARCHAR(100) NOT NULL,
  `userDisplayName` VARCHAR(150),
  `rating` INT,
  `comment` TEXT,
  `createdAt` DATETIME,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_questions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lotId` VARCHAR(100) NOT NULL,
  `auctionId` VARCHAR(100) NOT NULL,
  `userId` VARCHAR(100) NOT NULL,
  `userDisplayName` VARCHAR(150),
  `questionText` TEXT,
  `answerText` TEXT,
  `answeredByUserId` VARCHAR(100),
  `answeredByUserDisplayName` VARCHAR(150),
  `answeredAt` DATETIME,
  `isPublic` BOOLEAN DEFAULT TRUE,
  `createdAt` DATETIME,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
