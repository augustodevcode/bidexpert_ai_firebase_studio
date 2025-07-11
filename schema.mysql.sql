-- BidExpert MySQL Schema
-- version 1.2
-- A ordem das tabelas é crucial para satisfazer as restrições de chave estrangeira.

-- =============================================
-- TABELAS BASE (Sem dependências externas)
-- =============================================
CREATE TABLE IF NOT EXISTS `platform_settings` (
    `id` VARCHAR(191) PRIMARY KEY,
    `siteTitle` VARCHAR(255) NOT NULL,
    `siteTagline` VARCHAR(255),
    `galleryImageBasePath` VARCHAR(255),
    `storageProvider` VARCHAR(255),
    `firebaseStorageBucket` VARCHAR(255),
    `activeThemeName` VARCHAR(255),
    `themes` JSON,
    `platformPublicIdMasks` JSON,
    `homepageSections` JSON,
    `mentalTriggerSettings` JSON,
    `sectionBadgeVisibility` JSON,
    `mapSettings` JSON,
    `searchPaginationType` VARCHAR(255),
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
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `name_normalized` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `permissions` JSON,
    `createdAt` DATETIME,
    `updatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_categories` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `description` TEXT,
    `itemCount` INT,
    `hasSubcategories` BOOLEAN,
    `logoUrl` VARCHAR(255),
    `logoMediaId` VARCHAR(191),
    `dataAiHintLogo` VARCHAR(255),
    `coverImageUrl` VARCHAR(255),
    `coverImageMediaId` VARCHAR(191),
    `dataAiHintCover` VARCHAR(255),
    `megaMenuImageUrl` VARCHAR(255),
    `megaMenuImageMediaId` VARCHAR(191),
    `dataAiHintMegaMenu` VARCHAR(255),
    `createdAt` DATETIME,
    `updatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `states` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `uf` VARCHAR(2) NOT NULL,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `cityCount` INT,
    `createdAt` DATETIME,
    `updatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_items` (
  `id` varchar(191) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `storagePath` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `altText` varchar(255) DEFAULT NULL,
  `caption` text,
  `description` text,
  `mimeType` varchar(100) NOT NULL,
  `sizeBytes` int NOT NULL,
  `urlOriginal` varchar(255) NOT NULL,
  `urlThumbnail` varchar(255) DEFAULT NULL,
  `urlMedium` varchar(255) DEFAULT NULL,
  `urlLarge` varchar(255) DEFAULT NULL,
  `linkedLotIds` json DEFAULT NULL,
  `dataAiHint` varchar(255) DEFAULT NULL,
  `uploadedBy` varchar(191) DEFAULT NULL,
  `uploadedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_templates` (
  `id` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_types` (
  `id` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `isRequired` tinyint(1) NOT NULL,
  `appliesTo` varchar(255) NOT NULL,
  `displayOrder` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================
-- Nível 2 (Dependem das tabelas base)
-- =============================================

CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(191) PRIMARY KEY,
    `uid` VARCHAR(191) UNIQUE,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255),
    `fullName` VARCHAR(255),
    `roleId` VARCHAR(191),
    `sellerId` VARCHAR(191),
    `habilitationStatus` VARCHAR(255),
    `accountType` VARCHAR(255),
    `badges` JSON,
    `createdAt` DATETIME,
    `updatedAt` DATETIME,
    FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subcategories` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `parentCategoryId` VARCHAR(191) NOT NULL,
    `description` TEXT,
    `itemCount` INT,
    `displayOrder` INT,
    `iconUrl` VARCHAR(255),
    `iconMediaId` VARCHAR(191),
    `dataAiHintIcon` VARCHAR(255),
    FOREIGN KEY (`parentCategoryId`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cities` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `stateId` VARCHAR(191) NOT NULL,
    `stateUf` VARCHAR(2),
    `ibgeCode` VARCHAR(255),
    `lotCount` INT,
    FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `courts` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `stateUf` VARCHAR(2),
    `website` VARCHAR(255),
    FOREIGN KEY (`stateUf`) REFERENCES `states`(`uf`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Nível 3 (Dependências mais complexas)
-- =============================================

CREATE TABLE IF NOT EXISTS `judicial_districts` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `courtId` VARCHAR(191) NOT NULL,
    `courtName` VARCHAR(255),
    `stateId` VARCHAR(191) NOT NULL,
    `stateUf` VARCHAR(2),
    `zipCode` VARCHAR(255),
    FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_branches` (
    `id` VARCHAR(191) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `districtId` VARCHAR(191) NOT NULL,
    `districtName` VARCHAR(255),
    `contactName` VARCHAR(255),
    `phone` VARCHAR(255),
    `email` VARCHAR(255),
    FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sellers` (
    `id` VARCHAR(191) PRIMARY KEY,
    `publicId` VARCHAR(191) UNIQUE,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `contactName` VARCHAR(255),
    `email` VARCHAR(255),
    `phone` VARCHAR(255),
    `address` VARCHAR(255),
    `city` VARCHAR(255),
    `state` VARCHAR(255),
    `zipCode` VARCHAR(255),
    `website` VARCHAR(255),
    `logoUrl` VARCHAR(255),
    `logoMediaId` VARCHAR(191),
    `dataAiHintLogo` VARCHAR(255),
    `description` TEXT,
    `userId` VARCHAR(191),
    `memberSince` DATETIME,
    `rating` FLOAT,
    `activeLotsCount` INT,
    `totalSalesValue` DECIMAL(15,2),
    `auctionsFacilitatedCount` INT,
    `isJudicial` BOOLEAN DEFAULT FALSE,
    `judicialBranchId` VARCHAR(191),
    `createdAt` DATETIME,
    `updatedAt` DATETIME,
    FOREIGN KEY (`judicialBranchId`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auctioneers` (
    `id` VARCHAR(191) PRIMARY KEY,
    `publicId` VARCHAR(191) UNIQUE,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `registrationNumber` VARCHAR(255),
    `contactName` VARCHAR(255),
    `email` VARCHAR(255),
    `phone` VARCHAR(255),
    `address` VARCHAR(255),
    `city` VARCHAR(255),
    `state` VARCHAR(255),
    `zipCode` VARCHAR(255),
    `website` VARCHAR(255),
    `logoUrl` VARCHAR(255),
    `logoMediaId` VARCHAR(191),
    `dataAiHintLogo` VARCHAR(255),
    `description` TEXT,
    `userId` VARCHAR(191),
    `memberSince` DATETIME,
    `rating` FLOAT,
    `auctionsConductedCount` INT,
    `totalValueSold` DECIMAL(15,2),
    `createdAt` DATETIME,
    `updatedAt` DATETIME,
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`branchId`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_parties` (
    `id` VARCHAR(191) PRIMARY KEY,
    `process_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `documentNumber` VARCHAR(255),
    `partyType` VARCHAR(255),
    FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bens` (
    `id` VARCHAR(191) PRIMARY KEY,
    `publicId` VARCHAR(191) UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` VARCHAR(255),
    `categoryId` VARCHAR(191),
    `subcategoryId` VARCHAR(191),
    `judicialProcessId` VARCHAR(191),
    `sellerId` VARCHAR(191),
    `evaluationValue` DECIMAL(15,2),
    `imageUrl` VARCHAR(255),
    `imageMediaId` VARCHAR(191),
    `galleryImageUrls` JSON,
    `mediaItemIds` JSON,
    `dataAiHint` VARCHAR(255),
    `locationCity` VARCHAR(255),
    `locationState` VARCHAR(255),
    `address` VARCHAR(255),
    `latitude` DECIMAL(10,8),
    `longitude` DECIMAL(11,8),
    -- Vehicle fields
    `plate` VARCHAR(255),
    `make` VARCHAR(255),
    `model` VARCHAR(255),
    `version` VARCHAR(255),
    `year` INT,
    `modelYear` INT,
    `mileage` INT,
    `color` VARCHAR(255),
    `fuelType` VARCHAR(255),
    `transmissionType` VARCHAR(255),
    `bodyType` VARCHAR(255),
    `vin` VARCHAR(255),
    `renavam` VARCHAR(255),
    `enginePower` VARCHAR(255),
    `numberOfDoors` INT,
    `vehicleOptions` TEXT,
    `detranStatus` VARCHAR(255),
    `debts` TEXT,
    `runningCondition` VARCHAR(255),
    `bodyCondition` VARCHAR(255),
    `tiresCondition` VARCHAR(255),
    `hasKey` BOOLEAN,
    -- Property fields
    `propertyRegistrationNumber` VARCHAR(255),
    `iptuNumber` VARCHAR(255),
    `isOccupied` BOOLEAN,
    `totalArea` DECIMAL(10,2),
    `builtArea` DECIMAL(10,2),
    `bedrooms` INT,
    `suites` INT,
    `bathrooms` INT,
    `parkingSpaces` INT,
    `constructionType` VARCHAR(255),
    `finishes` TEXT,
    `infrastructure` TEXT,
    `condoDetails` TEXT,
    `improvements` TEXT,
    `topography` VARCHAR(255),
    `liensAndEncumbrances` TEXT,
    `propertyDebts` TEXT,
    `unregisteredRecords` TEXT,
    `hasHabiteSe` BOOLEAN,
    `zoningRestrictions` VARCHAR(255),
    `amenities` JSON,
    `createdAt` DATETIME,
    `updatedAt` DATETIME,
    FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `auctions` (
    `id` VARCHAR(191) PRIMARY KEY,
    `publicId` VARCHAR(191) UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` VARCHAR(255),
    `auctionDate` DATETIME,
    `endDate` DATETIME,
    `totalLots` INT,
    `category` VARCHAR(255),
    `auctioneerId` VARCHAR(191),
    `sellerId` VARCHAR(191),
    `imageUrl` VARCHAR(255),
    `imageMediaId` VARCHAR(191),
    `dataAiHint` VARCHAR(255),
    `documentsUrl` VARCHAR(255),
    `visits` INT,
    `initialOffer` DECIMAL(15,2),
    `isFavorite` BOOLEAN,
    `auctionType` VARCHAR(255),
    `auctionStages` JSON,
    `createdAt` DATETIME,
    `updatedAt` DATETIME,
    FOREIGN KEY (`auctioneerId`) REFERENCES `auctioneers`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lots` (
    `id` VARCHAR(191) PRIMARY KEY,
    `publicId` VARCHAR(191) UNIQUE,
    `auctionId` VARCHAR(191) NOT NULL,
    `number` VARCHAR(255),
    `title` VARCHAR(255),
    `description` TEXT,
    `price` DECIMAL(15,2),
    `initialPrice` DECIMAL(15,2),
    `secondInitialPrice` DECIMAL(15,2),
    `bidIncrementStep` DECIMAL(10,2),
    `status` VARCHAR(255),
    `bidsCount` INT,
    `views` INT,
    `isFeatured` BOOLEAN,
    `isExclusive` BOOLEAN,
    `discountPercentage` DECIMAL(5,2),
    `additionalTriggers` JSON,
    `imageUrl` VARCHAR(255),
    `imageMediaId` VARCHAR(191),
    `galleryImageUrls` JSON,
    `mediaItemIds` JSON,
    `bemIds` JSON,
    `type` VARCHAR(255),
    `categoryId` VARCHAR(191),
    `subcategoryId` VARCHAR(191),
    `sellerId` VARCHAR(191),
    `auctioneerId` VARCHAR(191),
    `cityId` VARCHAR(191),
    `stateId` VARCHAR(191),
    `latitude` DECIMAL(10,8),
    `longitude` DECIMAL(11,8),
    `mapAddress` VARCHAR(255),
    `mapEmbedUrl` VARCHAR(255),
    `mapStaticImageUrl` VARCHAR(255),
    `endDate` DATETIME,
    `condition` VARCHAR(255),
    `dataAiHint` VARCHAR(255),
    `winnerId` VARCHAR(191),
    `winningBidTermUrl` VARCHAR(255),
    `allowInstallmentBids` BOOLEAN,
    `createdAt` DATETIME,
    `updatedAt` DATETIME,
    FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_bens` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `lotId` VARCHAR(191) NOT NULL,
    `bemId` VARCHAR(191) NOT NULL,
    FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bemId`) REFERENCES `bens`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `lot_bem_unique` (`lotId`, `bemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_documents` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `document_type_id` varchar(191) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `rejection_reason` text,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `document_type_id` (`document_type_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bids` (
  `id` varchar(191) NOT NULL,
  `lotId` varchar(191) NOT NULL,
  `auctionId` varchar(191) NOT NULL,
  `bidderId` varchar(191) NOT NULL,
  `bidderDisplay` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `timestamp` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `lotId` (`lotId`),
  KEY `bidderId` (`bidderId`),
  FOREIGN KEY (`lotId`) REFERENCES `lots` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bidderId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` varchar(191) NOT NULL,
  `lotId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `winningBidAmount` decimal(15,2) NOT NULL,
  `winDate` datetime NOT NULL,
  `paymentStatus` varchar(255) NOT NULL,
  `invoiceUrl` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lotId` (`lotId`),
  KEY `userId` (`userId`),
  FOREIGN KEY (`lotId`) REFERENCES `lots` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `direct_sale_offers` (
  `id` varchar(191) NOT NULL,
  `publicId` varchar(191) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `offerType` varchar(255) NOT NULL,
  `price` decimal(15,2) DEFAULT NULL,
  `minimumOfferPrice` decimal(15,2) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `sellerId` varchar(191) NOT NULL,
  `sellerName` varchar(255) NOT NULL,
  `sellerLogoUrl` varchar(255) DEFAULT NULL,
  `dataAiHintSellerLogo` varchar(255) DEFAULT NULL,
  `locationCity` varchar(255) DEFAULT NULL,
  `locationState` varchar(255) DEFAULT NULL,
  `imageUrl` varchar(255) DEFAULT NULL,
  `imageMediaId` varchar(191) DEFAULT NULL,
  `dataAiHint` varchar(255) DEFAULT NULL,
  `galleryImageUrls` json DEFAULT NULL,
  `mediaItemIds` json DEFAULT NULL,
  `itemsIncluded` json DEFAULT NULL,
  `views` int DEFAULT '0',
  `expiresAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sellerId` (`sellerId`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `lotId` varchar(191) NOT NULL,
  `maxAmount` decimal(15,2) NOT NULL,
  `isActive` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId_lotId_unique` (`userId`,`lotId`),
  KEY `lotId` (`lotId`),
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lotId`) REFERENCES `lots` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

