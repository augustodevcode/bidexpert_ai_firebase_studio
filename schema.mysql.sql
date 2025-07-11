-- Schema for BidExpert using MySQL

-- ============================================================================
-- Core Platform Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(50) PRIMARY KEY,
  `siteTitle` VARCHAR(150),
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
  `name` VARCHAR(191) NOT NULL,
  `name_normalized` VARCHAR(191) NOT NULL UNIQUE,
  `description` TEXT,
  `permissions` JSON,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(191) PRIMARY KEY,
  `uid` VARCHAR(191) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255),
  `fullName` VARCHAR(255),
  `cpf` VARCHAR(20),
  `cellPhone` VARCHAR(20),
  `razaoSocial` VARCHAR(255),
  `cnpj` VARCHAR(25),
  `dateOfBirth` DATETIME,
  `zipCode` VARCHAR(15),
  `street` VARCHAR(255),
  `number` VARCHAR(50),
  `complement` VARCHAR(100),
  `neighborhood` VARCHAR(100),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `avatarUrl` VARCHAR(2048),
  `dataAiHint` VARCHAR(100),
  `roleId` VARCHAR(191),
  `sellerId` VARCHAR(191),
  `habilitationStatus` VARCHAR(50),
  `accountType` VARCHAR(50),
  `badges` JSON,
  `optInMarketing` BOOLEAN,
  `rgNumber` VARCHAR(50),
  `rgIssuer` VARCHAR(50),
  `rgIssueDate` DATETIME,
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
  `website` VARCHAR(2048),
  `responsibleName` VARCHAR(255),
  `responsibleCpf` VARCHAR(20),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL
);

-- ============================================================================
-- Geographic & Judicial Entities
-- ============================================================================

CREATE TABLE IF NOT EXISTS `states` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `uf` VARCHAR(2) NOT NULL,
  `slug` VARCHAR(191),
  `cityCount` INT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `cities` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191),
  `stateId` VARCHAR(191),
  `stateUf` VARCHAR(2),
  `ibgeCode` VARCHAR(10),
  `lotCount` INT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `courts` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255),
  `stateUf` VARCHAR(2),
  `website` VARCHAR(2048),
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255),
  `courtId` VARCHAR(191),
  `courtName` VARCHAR(255),
  `stateId` VARCHAR(191),
  `stateUf` VARCHAR(2),
  `zipCode` VARCHAR(15),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255),
  `districtId` VARCHAR(191),
  `districtName` VARCHAR(255),
  `contactName` VARCHAR(255),
  `phone` VARCHAR(20),
  `email` VARCHAR(191),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `sellers` (
  `id` VARCHAR(191) PRIMARY KEY,
  `publicId` VARCHAR(191) UNIQUE,
  `slug` VARCHAR(191) UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `contactName` VARCHAR(255),
  `email` VARCHAR(191),
  `phone` VARCHAR(20),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zipCode` VARCHAR(15),
  `website` VARCHAR(2048),
  `logoUrl` VARCHAR(2048),
  `logoMediaId` VARCHAR(191),
  `dataAiHintLogo` VARCHAR(100),
  `description` TEXT,
  `userId` VARCHAR(191),
  `memberSince` DATETIME,
  `rating` FLOAT,
  `activeLotsCount` INT,
  `totalSalesValue` DECIMAL(15, 2),
  `auctionsFacilitatedCount` INT,
  `isJudicial` BOOLEAN DEFAULT FALSE,
  `judicialBranchId` VARCHAR(191),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`judicialBranchId`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS `judicial_processes` (
  `id` VARCHAR(191) PRIMARY KEY,
  `publicId` VARCHAR(191) UNIQUE,
  `processNumber` VARCHAR(100) NOT NULL UNIQUE,
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
);

CREATE TABLE IF NOT EXISTS `judicial_parties` (
  `id` VARCHAR(191) PRIMARY KEY,
  `process_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `documentNumber` VARCHAR(50),
  `partyType` VARCHAR(50),
  FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) UNIQUE,
  `description` TEXT,
  `itemCount` INT,
  `hasSubcategories` BOOLEAN,
  `logoUrl` VARCHAR(2048),
  `logoMediaId` VARCHAR(191),
  `dataAiHintLogo` VARCHAR(100),
  `coverImageUrl` VARCHAR(2048),
  `coverImageMediaId` VARCHAR(191),
  `dataAiHintCover` VARCHAR(100),
  `megaMenuImageUrl` VARCHAR(2048),
  `megaMenuImageMediaId` VARCHAR(191),
  `dataAiHintMegaMenu` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191),
  `parentCategoryId` VARCHAR(191),
  `description` TEXT,
  `itemCount` INT,
  `displayOrder` INT,
  `iconUrl` VARCHAR(2048),
  `iconMediaId` VARCHAR(191),
  `dataAiHintIcon` VARCHAR(100),
  FOREIGN KEY (`parentCategoryId`) REFERENCES `lot_categories`(`id`) ON DELETE SET NULL
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
  `imageUrl` VARCHAR(2048),
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
  `bodyType` VARCHAR(50),
  `vin` VARCHAR(17),
  `renavam` VARCHAR(11),
  `enginePower` VARCHAR(50),
  `numberOfDoors` INT,
  `vehicleOptions` TEXT,
  `detranStatus` VARCHAR(100),
  `debts` TEXT,
  `runningCondition` VARCHAR(100),
  `bodyCondition` VARCHAR(100),
  `tiresCondition` VARCHAR(100),
  `hasKey` BOOLEAN,
  `propertyRegistrationNumber` VARCHAR(50),
  `iptuNumber` VARCHAR(50),
  `isOccupied` BOOLEAN,
  `totalArea` DECIMAL(10, 2),
  `builtArea` DECIMAL(10, 2),
  `bedrooms` INT,
  `suites` INT,
  `bathrooms` INT,
  `parkingSpaces` INT,
  `constructionType` VARCHAR(100),
  `finishes` TEXT,
  `infrastructure` TEXT,
  `condoDetails` TEXT,
  `improvements` TEXT,
  `topography` VARCHAR(100),
  `liensAndEncumbrances` TEXT,
  `propertyDebts` TEXT,
  `unregisteredRecords` TEXT,
  `hasHabiteSe` BOOLEAN,
  `zoningRestrictions` VARCHAR(200),
  `amenities` JSON,
  `brand` VARCHAR(50),
  `serialNumber` VARCHAR(100),
  `itemCondition` VARCHAR(100),
  `specifications` TEXT,
  `includedAccessories` TEXT,
  `batteryCondition` VARCHAR(100),
  `hasInvoice` BOOLEAN,
  `hasWarranty` BOOLEAN,
  `repairHistory` TEXT,
  `applianceCapacity` VARCHAR(50),
  `voltage` VARCHAR(20),
  `applianceType` VARCHAR(50),
  `additionalFunctions` VARCHAR(200),
  `hoursUsed` INT,
  `engineType` VARCHAR(50),
  `capacityOrPower` VARCHAR(100),
  `maintenanceHistory` TEXT,
  `installationLocation` VARCHAR(200),
  `compliesWithNR` VARCHAR(100),
  `operatingLicenses` VARCHAR(200),
  `breed` VARCHAR(50),
  `age` VARCHAR(30),
  `sex` VARCHAR(10),
  `weight` VARCHAR(30),
  `individualId` VARCHAR(50),
  `purpose` VARCHAR(100),
  `sanitaryCondition` VARCHAR(200),
  `lineage` VARCHAR(200),
  `isPregnant` BOOLEAN,
  `specialSkills` VARCHAR(200),
  `gtaDocument` VARCHAR(100),
  `breedRegistryDocument` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
);

-- ============================================================================
-- Auction and Lot Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS `auctions` (
  `id` VARCHAR(191) PRIMARY KEY,
  `publicId` VARCHAR(191) UNIQUE,
  `slug` VARCHAR(255) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50),
  `auctionType` VARCHAR(50),
  `auctioneerId` VARCHAR(191),
  `sellerId` VARCHAR(191),
  `judicialProcessId` VARCHAR(191),
  `auctioneer` VARCHAR(255),
  `seller` VARCHAR(255),
  `auctionDate` DATETIME,
  `endDate` DATETIME,
  `imageUrl` VARCHAR(2048),
  `imageMediaId` VARCHAR(191),
  `dataAiHint` VARCHAR(100),
  `documentsUrl` VARCHAR(2048),
  `visits` INT DEFAULT 0,
  `totalLots` INT DEFAULT 0,
  `initialOffer` DECIMAL(15, 2),
  `isFavorite` BOOLEAN DEFAULT FALSE,
  `isFeaturedOnMarketplace` BOOLEAN DEFAULT FALSE,
  `marketplaceAnnouncementTitle` VARCHAR(255),
  `estimatedRevenue` DECIMAL(15, 2),
  `achievedRevenue` DECIMAL(15, 2),
  `totalHabilitatedUsers` INT,
  `automaticBiddingEnabled` BOOLEAN DEFAULT FALSE,
  `allowInstallmentBids` BOOLEAN DEFAULT FALSE,
  `softCloseEnabled` BOOLEAN DEFAULT FALSE,
  `softCloseMinutes` INT DEFAULT 2,
  `silentBiddingEnabled` BOOLEAN DEFAULT FALSE,
  `allowMultipleBidsPerUser` BOOLEAN DEFAULT TRUE,
  `auctionStages` JSON,
  `additionalTriggers` JSON,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`auctioneerId`) REFERENCES `auctioneers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `lots` (
  `id` VARCHAR(191) PRIMARY KEY,
  `publicId` VARCHAR(191) UNIQUE,
  `slug` VARCHAR(255) UNIQUE,
  `auctionId` VARCHAR(191) NOT NULL,
  `number` VARCHAR(20),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2) NOT NULL,
  `initialPrice` DECIMAL(15, 2),
  `secondInitialPrice` DECIMAL(15, 2),
  `bidIncrementStep` DECIMAL(10, 2),
  `status` VARCHAR(50),
  `bidsCount` INT DEFAULT 0,
  `views` INT DEFAULT 0,
  `isFeatured` BOOLEAN DEFAULT FALSE,
  `isExclusive` BOOLEAN DEFAULT FALSE,
  `discountPercentage` DECIMAL(5, 2),
  `additionalTriggers` JSON,
  `imageUrl` VARCHAR(2048),
  `imageMediaId` VARCHAR(191),
  `galleryImageUrls` JSON,
  `mediaItemIds` JSON,
  `categoryId` VARCHAR(191),
  `subcategoryId` VARCHAR(191),
  `sellerId` VARCHAR(191),
  `auctioneerId` VARCHAR(191),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `mapAddress` VARCHAR(255),
  `endDate` DATETIME,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `lot_bens` (
  `lotId` VARCHAR(191) NOT NULL,
  `bemId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`lotId`, `bemId`),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bemId`) REFERENCES `bens`(`id`) ON DELETE CASCADE
);

-- ============================================================================
-- Other Entities
-- ============================================================================

CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` VARCHAR(191) PRIMARY KEY,
  `publicId` VARCHAR(191) UNIQUE,
  `slug` VARCHAR(191) UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `registrationNumber` VARCHAR(100),
  `contactName` VARCHAR(255),
  `email` VARCHAR(191),
  `phone` VARCHAR(20),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zipCode` VARCHAR(15),
  `website` VARCHAR(2048),
  `logoUrl` VARCHAR(2048),
  `logoMediaId` VARCHAR(191),
  `dataAiHintLogo` VARCHAR(100),
  `description` TEXT,
  `userId` VARCHAR(191),
  `memberSince` DATETIME,
  `rating` FLOAT,
  `auctionsConductedCount` INT,
  `totalValueSold` DECIMAL(15, 2),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `media_items` (
  `id` VARCHAR(191) PRIMARY KEY,
  `fileName` VARCHAR(255),
  `storagePath` VARCHAR(2048),
  `title` VARCHAR(255),
  `altText` VARCHAR(255),
  `caption` VARCHAR(500),
  `description` TEXT,
  `mimeType` VARCHAR(100),
  `sizeBytes` INT,
  `urlOriginal` VARCHAR(2048),
  `urlThumbnail` VARCHAR(2048),
  `urlMedium` VARCHAR(2048),
  `urlLarge` VARCHAR(2048),
  `linkedLotIds` JSON,
  `dataAiHint` VARCHAR(100),
  `uploadedBy` VARCHAR(191),
  `uploadedAt` DATETIME,
  FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`uid`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `document_templates` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `content` TEXT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `isRead` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

CREATE TABLE IF NOT EXISTS `document_types` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `isRequired` BOOLEAN,
  `appliesTo` VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS `user_documents` (
  `id` VARCHAR(191) PRIMARY KEY,
  `userId` VARCHAR(191) NOT NULL,
  `documentTypeId` VARCHAR(191) NOT NULL,
  `fileUrl` VARCHAR(2048),
  `fileName` VARCHAR(255),
  `status` VARCHAR(50),
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
  `timestamp` DATETIME,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bidderId`) REFERENCES `users`(`uid`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` VARCHAR(191) PRIMARY KEY,
  `lotId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `winningBidAmount` DECIMAL(15, 2) NOT NULL,
  `winDate` DATETIME,
  `paymentStatus` VARCHAR(50),
  `invoiceUrl` VARCHAR(2048),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` VARCHAR(191) PRIMARY KEY,
  `userId` VARCHAR(191) NOT NULL,
  `lotId` VARCHAR(191) NOT NULL,
  `maxAmount` DECIMAL(15, 2) NOT NULL,
  `isActive` BOOLEAN,
  `createdAt` DATETIME,
  UNIQUE (`userId`, `lotId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE CASCADE,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `direct_sale_offers` (
  `id` VARCHAR(191) PRIMARY KEY,
  `publicId` VARCHAR(191) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `offerType` VARCHAR(50),
  `price` DECIMAL(15, 2),
  `minimumOfferPrice` DECIMAL(15, 2),
  `status` VARCHAR(50),
  `category` VARCHAR(100),
  `sellerId` VARCHAR(191),
  `sellerName` VARCHAR(255),
  `sellerLogoUrl` VARCHAR(2048),
  `dataAiHintSellerLogo` VARCHAR(100),
  `locationCity` VARCHAR(100),
  `locationState` VARCHAR(100),
  `imageUrl` VARCHAR(2048),
  `imageMediaId` VARCHAR(191),
  `dataAiHint` VARCHAR(100),
  `galleryImageUrls` JSON,
  `mediaItemIds` JSON,
  `itemsIncluded` JSON,
  `views` INT,
  `expiresAt` DATETIME,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `notifications` (
    `id` VARCHAR(191) PRIMARY KEY,
    `userId` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(2048),
    `isRead` BOOLEAN DEFAULT FALSE,
    `createdAt` DATETIME,
    FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE CASCADE
);

