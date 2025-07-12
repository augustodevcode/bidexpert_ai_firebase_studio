-- Schema completo e ordenado para o banco de dados BidExpert em MySQL.
-- IDs são inteiros auto-incrementados.
-- A ordem de criação respeita as dependências de chaves estrangeiras.

-- Nível 1: Tabelas Independentes
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
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
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `name_normalized` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `permissions` JSON,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `states` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `uf` VARCHAR(2) NOT NULL UNIQUE,
  `slug` VARCHAR(100),
  `cityCount` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_templates` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `content` TEXT NOT NULL,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `isRead` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_types` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255),
  `isRequired` BOOLEAN DEFAULT TRUE,
  `appliesTo` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nível 2: Dependências de Nível 1
CREATE TABLE IF NOT EXISTS `courts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `stateUf` VARCHAR(2),
  `website` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`stateUf`) REFERENCES `states`(`uf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `stateId` INT,
  `stateUf` VARCHAR(2),
  `ibgeCode` VARCHAR(10),
  `lotCount` INT DEFAULT 0,
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100),
  `parentCategoryId` INT NOT NULL,
  `description` TEXT,
  `itemCount` INT DEFAULT 0,
  `displayOrder` INT DEFAULT 0,
  `iconUrl` VARCHAR(255),
  `iconMediaId` VARCHAR(100),
  `dataAiHintIcon` VARCHAR(100),
  FOREIGN KEY (`parentCategoryId`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `courtId` INT,
  `stateId` INT,
  `zipCode` VARCHAR(10),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 3: Dependências de Nível 2
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `uid` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `fullName` VARCHAR(150) NOT NULL,
  `roleId` INT,
  `sellerId` INT,
  `habilitationStatus` VARCHAR(50),
  `accountType` VARCHAR(50),
  `badges` JSON,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  -- ... demais campos
  FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `districtId` INT NOT NULL,
  `contactName` VARCHAR(150),
  `phone` VARCHAR(20),
  `email` VARCHAR(150),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 4: Dependências de Nível 3
CREATE TABLE IF NOT EXISTS `sellers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `isJudicial` BOOLEAN DEFAULT FALSE,
  `judicialBranchId` INT,
  `userId` INT,
  `logoUrl` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  -- ... demais campos
  FOREIGN KEY (`judicialBranchId`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `userId` INT,
  `logoUrl` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  -- ... demais campos
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_items` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `uploadedBy` INT,
  `fileName` VARCHAR(255),
  `storagePath` VARCHAR(255),
  `title` VARCHAR(255),
  `altText` VARCHAR(255),
  `mimeType` VARCHAR(50),
  `sizeBytes` INT,
  `urlOriginal` VARCHAR(255),
  `urlThumbnail` VARCHAR(255),
  `createdAt` DATETIME,
  -- ... demais campos
  FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 5: Dependências de Nível 4
CREATE TABLE IF NOT EXISTS `judicial_processes` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `processNumber` VARCHAR(100) NOT NULL,
  `isElectronic` BOOLEAN DEFAULT TRUE,
  `courtId` INT,
  `districtId` INT,
  `branchId` INT,
  `sellerId` INT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`),
  FOREIGN KEY (`branchId`) REFERENCES `judicial_branches`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_parties` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `process_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `documentNumber` VARCHAR(50),
  `partyType` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bens` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT 'DISPONIVEL',
  `categoryId` INT,
  `subcategoryId` INT,
  `judicialProcessId` INT,
  `sellerId` INT,
  `evaluationValue` DECIMAL(15, 2),
  `imageUrl` VARCHAR(255),
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auctions` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(200),
  `description` TEXT,
  `status` VARCHAR(50),
  `auctionDate` DATETIME,
  `endDate` DATETIME,
  `auctioneerId` INT,
  `sellerId` INT,
  `categoryId` INT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  -- ... outros campos
  FOREIGN KEY (`auctioneerId`) REFERENCES `auctioneers`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_documents` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `userId` INT NOT NULL,
  `documentTypeId` INT NOT NULL,
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
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200),
  `sellerId` INT,
  -- ... outros campos
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 6: Dependências de Nível 5
CREATE TABLE IF NOT EXISTS `lots` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `publicId` VARCHAR(100) UNIQUE,
  `auctionId` INT NOT NULL,
  `number` VARCHAR(20),
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2),
  `initialPrice` DECIMAL(15, 2),
  `status` VARCHAR(50),
  `categoryId` INT,
  `subcategoryId` INT,
  `sellerId` INT,
  `cityId` INT,
  `stateId` INT,
  `winnerId` INT,
  `createdAt` DATETIME,
  `updatedAt` DATETIME,
  -- ... outros campos
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`),
  FOREIGN KEY (`stateId`) REFERENCES `states`(`id`),
  FOREIGN KEY (`winnerId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 7: Tabelas de Junção e Dependentes Finais
CREATE TABLE IF NOT EXISTS `lot_bens` (
  `lotId` INT NOT NULL,
  `bemId` INT NOT NULL,
  PRIMARY KEY (`lotId`, `bemId`),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bemId`) REFERENCES `bens`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lotId` INT NOT NULL,
  `auctionId` INT NOT NULL,
  `bidderId` INT NOT NULL,
  `bidderDisplay` VARCHAR(150),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` DATETIME,
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bidderId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lotId` INT NOT NULL,
  `userId` INT NOT NULL,
  `winningBidAmount` DECIMAL(15, 2) NOT NULL,
  `winDate` DATETIME,
  `paymentStatus` VARCHAR(50),
  `invoiceUrl` VARCHAR(255),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `userId` INT NOT NULL,
  `lotId` INT NOT NULL,
  `maxAmount` DECIMAL(15, 2) NOT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` DATETIME,
  UNIQUE (`userId`, `lotId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`),
  FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
