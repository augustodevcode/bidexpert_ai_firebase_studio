
-- =================================================================
--  Schema para o Banco de Dados BidExpert (MySQL)
--  Arquivo reorganizado para garantir a ordem de criação correta
--  e resolver dependências de chaves estrangeiras.
-- =================================================================

--
-- Tabela: platform_settings (Independente)
--
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY DEFAULT 'global',
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

--
-- Tabela: roles (Independente)
--
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `name_normalized` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `permissions` JSON,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

--
-- Tabela: states (Independente)
--
CREATE TABLE IF NOT EXISTS `states` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `uf` VARCHAR(2) NOT NULL UNIQUE,
  `slug` VARCHAR(100) UNIQUE,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

--
-- Tabela: lot_categories (Independente)
--
CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) UNIQUE,
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

--
-- Tabela: document_templates (Independente)
--
CREATE TABLE IF NOT EXISTS `document_templates` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `content` TEXT NOT NULL,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);

--
-- Tabela: contact_messages (Independente)
--
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `isRead` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME
);

--
-- Tabela: document_types (Independente)
--
CREATE TABLE IF NOT EXISTS `document_types` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `isRequired` BOOLEAN DEFAULT FALSE,
  `appliesTo` VARCHAR(50) -- e.g., 'PHYSICAL', 'LEGAL', 'ALL'
);

--
-- Tabela: users (Depende de: roles)
--
CREATE TABLE IF NOT EXISTS `users` (
  `uid` VARCHAR(100) NOT NULL PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255),
  `fullName` VARCHAR(255),
  `cpf` VARCHAR(20) UNIQUE,
  `cellPhone` VARCHAR(30),
  `razaoSocial` VARCHAR(255),
  `cnpj` VARCHAR(20) UNIQUE,
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
  `sellerId` VARCHAR(100),
  `habilitationStatus` VARCHAR(50),
  `accountType` VARCHAR(50),
  `badges` JSON,
  `optInMarketing` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL
);

--
-- Tabela: cities (Depende de: states)
--
CREATE TABLE IF NOT EXISTS `cities` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `stateId` VARCHAR(100) NOT NULL,
  `stateUf` VARCHAR(2) NOT NULL,
  `ibgeCode` VARCHAR(10),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`)
);

--
-- Tabela: subcategories (Depende de: lot_categories)
--
CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100),
  `parentCategoryId` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `displayOrder` INT DEFAULT 0,
  `iconUrl` VARCHAR(255),
  `iconMediaId` VARCHAR(100),
  `dataAiHintIcon` VARCHAR(100),
  FOREIGN KEY (`parentCategoryId`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE
);

--
-- Tabela: courts (Depende de: states)
--
CREATE TABLE IF NOT EXISTS `courts` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `stateUf` VARCHAR(2) NOT NULL,
  `website` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`stateUf`) REFERENCES `states`(`uf`)
);

--
-- Tabela: judicial_districts (Depende de: courts, states)
--
CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `courtId` VARCHAR(100) NOT NULL,
  `stateId` VARCHAR(100) NOT NULL,
  `zipCode` VARCHAR(10),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`)
);

--
-- Tabela: judicial_branches (Depende de: judicial_districts)
--
CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `districtId` VARCHAR(100) NOT NULL,
  `contactName` VARCHAR(150),
  `phone` VARCHAR(30),
  `email` VARCHAR(150),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`)
);

--
-- Tabela: sellers (Depende de: judicial_branches)
--
CREATE TABLE IF NOT EXISTS `sellers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `contactName` VARCHAR(150),
  `email` VARCHAR(150),
  `phone` VARCHAR(30),
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
  `isJudicial` BOOLEAN DEFAULT FALSE,
  `judicialBranchId` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`judicialBranchId`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE SET NULL
);

--
-- Tabela: auctioneers (Depende de: users)
--
CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `registrationNumber` VARCHAR(50),
  `contactName` VARCHAR(150),
  `email` VARCHAR(150),
  `phone` VARCHAR(30),
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
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`) ON DELETE SET NULL
);

--
-- Tabela: judicial_processes (Depende de: courts, judicial_districts, judicial_branches, sellers)
--
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

--
-- Tabela: judicial_parties (Depende de: judicial_processes)
--
CREATE TABLE IF NOT EXISTS `judicial_parties` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `process_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `documentNumber` VARCHAR(50),
  `partyType` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
);

--
-- Tabela: auctions (Depende de: sellers, auctioneers, judicial_processes)
--
CREATE TABLE IF NOT EXISTS `auctions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(200),
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50),
  `auctionDate` DATETIME,
  `endDate` DATETIME,
  `totalLots` INT,
  `category` VARCHAR(100),
  `auctioneer` VARCHAR(150),
  `auctioneerId` VARCHAR(100),
  `seller` VARCHAR(150),
  `sellerId` VARCHAR(100),
  `mapAddress` VARCHAR(255),
  `imageUrl` VARCHAR(255),
  `imageMediaId` VARCHAR(100),
  `dataAiHint` VARCHAR(100),
  `visits` INT,
  `initialOffer` DECIMAL(15, 2),
  `auctionType` VARCHAR(50),
  `auctionStages` JSON,
  `documentsUrl` VARCHAR(255),
  `automaticBiddingEnabled` BOOLEAN,
  `allowInstallmentBids` BOOLEAN,
  `softCloseEnabled` BOOLEAN,
  `softCloseMinutes` INT,
  `estimatedRevenue` DECIMAL(15, 2),
  `achievedRevenue` DECIMAL(15, 2),
  `totalHabilitatedUsers` INT,
  `isFeaturedOnMarketplace` BOOLEAN,
  `marketplaceAnnouncementTitle` VARCHAR(150),
  `additionalTriggers` JSON,
  `judicialProcessId` VARCHAR(100),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`auctioneerId`) REFERENCES `auctioneers`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`) ON DELETE SET NULL
);

--
-- Tabela: bens (Depende de: lot_categories, subcategories, judicial_processes, sellers)
--
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
  `amenities` JSON,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
);

--
-- Tabela: lots (Depende de: auctions, lot_categories, etc.)
--
CREATE TABLE IF NOT EXISTS `lots` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `auctionId` VARCHAR(100) NOT NULL,
  `number` VARCHAR(50),
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(255),
  `description` TEXT,
  `price` DECIMAL(15, 2) NOT NULL,
  `initialPrice` DECIMAL(15, 2),
  `secondInitialPrice` DECIMAL(15, 2),
  `bidIncrementStep` DECIMAL(15, 2),
  `status` VARCHAR(50) NOT NULL,
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
  `bemIds` JSON,
  `type` VARCHAR(100),
  `categoryId` VARCHAR(100),
  `subcategoryId` VARCHAR(100),
  `sellerId` VARCHAR(100),
  `auctioneerId` VARCHAR(100),
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
  `reservePrice` DECIMAL(15, 2),
  `evaluationValue` DECIMAL(15, 2),
  `debtAmount` DECIMAL(15, 2),
  `itbiValue` DECIMAL(15, 2),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`auctioneerId`) REFERENCES `auctioneers`(`id`),
  FOREIGN KEY (`winnerId`) REFERENCES `users`(`uid`)
);

--
-- Tabela: lot_bens (Depende de: lots, bens)
--
CREATE TABLE IF NOT EXISTS `lot_bens` (
    `lotId` VARCHAR(100) NOT NULL,
    `bemId` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`lotId`, `bemId`),
    FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bemId`) REFERENCES `bens`(`id`) ON DELETE CASCADE
);

--
-- Tabela: media_items (Depende de: users)
--
CREATE TABLE IF NOT EXISTS `media_items` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `fileName` VARCHAR(255) NOT NULL,
  `storagePath` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255),
  `altText` VARCHAR(255),
  `caption` TEXT,
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
  FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`uid`) ON DELETE SET NULL
);

--
-- Tabela: user_documents (Depende de: users, document_types)
--
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

--
-- Tabela: bids (Depende de: lots, auctions, users)
--
CREATE TABLE IF NOT EXISTS `bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lotId` VARCHAR(100) NOT NULL,
  `auctionId` VARCHAR(100) NOT NULL,
  `bidderId` VARCHAR(100) NOT NULL,
  `bidderDisplay` VARCHAR(150),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` DATETIME,
  `type` VARCHAR(50),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bidderId`) REFERENCES `users`(`uid`)
);

--
-- Tabela: user_wins (Depende de: lots, users)
--
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

--
-- Tabela: direct_sale_offers (Depende de: sellers)
--
CREATE TABLE IF NOT EXISTS `direct_sale_offers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `offerType` VARCHAR(50),
  `price` DECIMAL(15, 2),
  `minimumOfferPrice` DECIMAL(15, 2),
  `status` VARCHAR(50),
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
  `views` INT,
  `expiresAt` DATETIME,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
);

--
-- Tabela: user_lot_max_bids (Depende de: users, lots)
--
CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(100) NOT NULL,
  `lotId` VARCHAR(100) NOT NULL,
  `maxAmount` DECIMAL(15, 2) NOT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` DATETIME,
  UNIQUE (`userId`, `lotId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`uid`),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`)
);
