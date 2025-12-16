-- =============================================================================
-- MIGRATION: Gaps Implementation - Phase 1 to 5
-- Description: Adds new tables and fields for the 8 critical gaps implementation
-- Date: 2024-12-13
-- Version: 1.0.0
-- =============================================================================

-- =============================================================================
-- FASE 1: IMÓVEIS - Gap 1.2 (Simulador de Custos)
-- =============================================================================

-- Tabela de configuração de custos por leilão
CREATE TABLE IF NOT EXISTS `AuctionCostConfig` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `auctionId` BIGINT NOT NULL,
  `tenantId` BIGINT NOT NULL,
  
  -- Taxas Percentuais
  `successFeePercent` DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  `itbiPercent` DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  `registryFeePercent` DECIMAL(5,2) NOT NULL DEFAULT 1.50,
  
  -- Taxas Fixas
  `legalFeesFixed` DECIMAL(15,2) NULL,
  `notaryFeesFixed` DECIMAL(15,2) NULL,
  
  -- Configurações por Estado
  `stateUf` VARCHAR(2) NULL,
  `customRules` JSON NULL,
  
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `AuctionCostConfig_auctionId_key` (`auctionId`),
  INDEX `AuctionCostConfig_tenantId_idx` (`tenantId`),
  INDEX `AuctionCostConfig_stateUf_idx` (`stateUf`),
  
  CONSTRAINT `AuctionCostConfig_auctionId_fkey` 
    FOREIGN KEY (`auctionId`) REFERENCES `Auction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AuctionCostConfig_tenantId_fkey` 
    FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FASE 1: IMÓVEIS - Gap 1.3 (Indicadores de Mercado)
-- =============================================================================

-- Enum para tipo de propriedade
-- Note: In MySQL, we'll use VARCHAR and validate in application layer
-- ALTER TYPE PropertyType ADD VALUES IF NOT EXISTS...

-- Tabela de índices de preço de mercado
CREATE TABLE IF NOT EXISTS `MarketPriceIndex` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  
  -- Localização
  `stateUf` VARCHAR(2) NOT NULL,
  `cityName` VARCHAR(255) NULL,
  `neighborhood` VARCHAR(255) NULL,
  `zipCodePrefix` VARCHAR(5) NULL,
  
  -- Tipo de Imóvel
  `propertyType` VARCHAR(50) NOT NULL DEFAULT 'OUTRO',
  
  -- Preços
  `pricePerSquareMeter` DECIMAL(15,2) NOT NULL,
  `minPrice` DECIMAL(15,2) NULL,
  `maxPrice` DECIMAL(15,2) NULL,
  `medianPrice` DECIMAL(15,2) NULL,
  
  -- Metadados
  `sampleSize` INT NULL,
  `dataSource` VARCHAR(100) NULL,
  `referenceDate` DATETIME(3) NOT NULL,
  
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `MarketPriceIndex_location_type_date_key` 
    (`stateUf`, `cityName`, `neighborhood`, `propertyType`, `referenceDate`),
  INDEX `MarketPriceIndex_stateUf_cityName_idx` (`stateUf`, `cityName`),
  INDEX `MarketPriceIndex_zipCodePrefix_idx` (`zipCodePrefix`),
  INDEX `MarketPriceIndex_propertyType_idx` (`propertyType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de histórico de preços de mercado
CREATE TABLE IF NOT EXISTS `MarketPriceHistory` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `marketPriceIndexId` BIGINT NOT NULL,
  `pricePerSquareMeter` DECIMAL(15,2) NOT NULL,
  `referenceDate` DATETIME(3) NOT NULL,
  
  PRIMARY KEY (`id`),
  INDEX `MarketPriceHistory_marketPriceIndexId_idx` (`marketPriceIndexId`),
  INDEX `MarketPriceHistory_referenceDate_idx` (`referenceDate`),
  
  CONSTRAINT `MarketPriceHistory_marketPriceIndexId_fkey` 
    FOREIGN KEY (`marketPriceIndexId`) REFERENCES `MarketPriceIndex`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FASE 2: VEÍCULOS - Gap 2.2 (Avaliação FIPE)
-- =============================================================================

-- Tabela de preços FIPE (cache)
CREATE TABLE IF NOT EXISTS `VehicleFipePrice` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  
  -- Identificação do Veículo
  `fipeCode` VARCHAR(50) NOT NULL,
  `brandName` VARCHAR(100) NOT NULL,
  `modelName` VARCHAR(200) NOT NULL,
  `year` INT NOT NULL,
  `fuelType` VARCHAR(50) NULL,
  
  -- Preços
  `fipePrice` DECIMAL(15,2) NOT NULL,
  `referenceMonth` VARCHAR(7) NOT NULL,
  
  -- Cache
  `cachedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `VehicleFipePrice_fipeCode_key` (`fipeCode`),
  INDEX `VehicleFipePrice_brandName_modelName_year_idx` (`brandName`, `modelName`, `year`),
  INDEX `VehicleFipePrice_referenceMonth_idx` (`referenceMonth`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de avaliação FIPE por asset
CREATE TABLE IF NOT EXISTS `AssetFipeEvaluation` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `assetId` BIGINT NOT NULL,
  
  `fipeCode` VARCHAR(50) NULL,
  `fipePrice` DECIMAL(15,2) NULL,
  `evaluationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `mileageAdjustment` DECIMAL(15,2) NULL,
  `conditionAdjustment` DECIMAL(15,2) NULL,
  `adjustedPrice` DECIMAL(15,2) NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `AssetFipeEvaluation_assetId_key` (`assetId`),
  INDEX `AssetFipeEvaluation_assetId_idx` (`assetId`),
  
  CONSTRAINT `AssetFipeEvaluation_assetId_fkey` 
    FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FASE 3: ELETRÔNICOS - Gap 3.1 (Especificações Dinâmicas)
-- =============================================================================

-- Tabela de templates de especificações por categoria
CREATE TABLE IF NOT EXISTS `CategorySpecTemplate` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `categoryId` BIGINT NOT NULL,
  `subcategoryId` BIGINT NULL,
  
  -- Template de specs (JSON array)
  `specFields` JSON NOT NULL,
  
  -- Metadados
  `version` INT NOT NULL DEFAULT 1,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `CategorySpecTemplate_categoryId_subcategoryId_key` (`categoryId`, `subcategoryId`),
  
  CONSTRAINT `CategorySpecTemplate_categoryId_fkey` 
    FOREIGN KEY (`categoryId`) REFERENCES `LotCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CategorySpecTemplate_subcategoryId_fkey` 
    FOREIGN KEY (`subcategoryId`) REFERENCES `Subcategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar campo de specs dinâmicas ao Asset (se não existir)
-- ALTER TABLE `Asset` ADD COLUMN IF NOT EXISTS `dynamicSpecs` JSON NULL;

-- =============================================================================
-- FASE 3: ELETRÔNICOS - Gap 3.2 (Preços de Varejo)
-- =============================================================================

-- Tabela de referência de preços de varejo
CREATE TABLE IF NOT EXISTS `RetailPriceReference` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  
  -- Identificação do Produto
  `productName` VARCHAR(500) NOT NULL,
  `brand` VARCHAR(100) NULL,
  `model` VARCHAR(200) NULL,
  `ean` VARCHAR(20) NULL,
  `gtin` VARCHAR(20) NULL,
  
  -- Preços de Referência
  `averageRetailPrice` DECIMAL(15,2) NOT NULL,
  `minRetailPrice` DECIMAL(15,2) NULL,
  `maxRetailPrice` DECIMAL(15,2) NULL,
  
  -- Fontes
  `source` VARCHAR(50) NULL,
  `sourceUrl` VARCHAR(500) NULL,
  
  -- Cache
  `cachedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  
  PRIMARY KEY (`id`),
  INDEX `RetailPriceReference_productName_idx` (`productName`(100)),
  INDEX `RetailPriceReference_brand_model_idx` (`brand`, `model`),
  INDEX `RetailPriceReference_ean_idx` (`ean`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FASE 4: MÁQUINAS - Gap 4.1 & 4.2 (Inspeções e Certificações)
-- =============================================================================

-- Tabela de inspeções de máquinas
CREATE TABLE IF NOT EXISTS `MachineryInspection` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `assetId` BIGINT NOT NULL,
  
  -- Inspeção
  `inspectionDate` DATETIME(3) NOT NULL,
  `inspectorName` VARCHAR(200) NOT NULL,
  `inspectorCredential` VARCHAR(100) NULL,
  
  -- Checklist (usando VARCHAR para enum-like values)
  `hydraulicSystem` VARCHAR(50) NOT NULL DEFAULT 'NAO_VERIFICADO',
  `transmission` VARCHAR(50) NOT NULL DEFAULT 'NAO_VERIFICADO',
  `electricalSystem` VARCHAR(50) NOT NULL DEFAULT 'NAO_VERIFICADO',
  `structuralIntegrity` VARCHAR(50) NOT NULL DEFAULT 'NAO_VERIFICADO',
  `safetyFeatures` VARCHAR(50) NOT NULL DEFAULT 'NAO_VERIFICADO',
  
  -- Resultado
  `overallStatus` VARCHAR(50) NOT NULL,
  `observations` TEXT NULL,
  `reportUrl` VARCHAR(500) NULL,
  
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  INDEX `MachineryInspection_assetId_idx` (`assetId`),
  
  CONSTRAINT `MachineryInspection_assetId_fkey` 
    FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de certificações de máquinas
CREATE TABLE IF NOT EXISTS `MachineryCertification` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `assetId` BIGINT NOT NULL,
  
  `certificationType` VARCHAR(50) NOT NULL,
  `certificationNumber` VARCHAR(100) NULL,
  `issuingBody` VARCHAR(200) NULL,
  `issueDate` DATETIME(3) NULL,
  `expirationDate` DATETIME(3) NULL,
  `isValid` BOOLEAN NOT NULL DEFAULT true,
  `documentUrl` VARCHAR(500) NULL,
  
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  INDEX `MachineryCertification_assetId_idx` (`assetId`),
  INDEX `MachineryCertification_certificationType_idx` (`certificationType`),
  
  CONSTRAINT `MachineryCertification_assetId_fkey` 
    FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FASE 5: SEMOVENTES - Gap 5.1 (Saúde e Reprodução)
-- =============================================================================

-- Tabela de registros de saúde de semoventes
CREATE TABLE IF NOT EXISTS `LivestockHealthRecord` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `assetId` BIGINT NOT NULL,
  
  -- Vacinas
  `vaccinationType` VARCHAR(100) NOT NULL,
  `applicationDate` DATETIME(3) NOT NULL,
  `nextApplicationDate` DATETIME(3) NULL,
  `veterinarianName` VARCHAR(200) NULL,
  `veterinarianCrmv` VARCHAR(50) NULL,
  `batchNumber` VARCHAR(100) NULL,
  
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  INDEX `LivestockHealthRecord_assetId_idx` (`assetId`),
  
  CONSTRAINT `LivestockHealthRecord_assetId_fkey` 
    FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de histórico reprodutivo de semoventes
CREATE TABLE IF NOT EXISTS `LivestockReproductiveHistory` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `assetId` BIGINT NOT NULL,
  
  `eventType` VARCHAR(50) NOT NULL,
  `eventDate` DATETIME(3) NOT NULL,
  `details` TEXT NULL,
  `offspringCount` INT NULL,
  
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  INDEX `LivestockReproductiveHistory_assetId_idx` (`assetId`),
  
  CONSTRAINT `LivestockReproductiveHistory_assetId_fkey` 
    FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FASE 5: DASHBOARD - Gap 5.2 (Dashboard Pessoal)
-- =============================================================================

-- Tabela de dashboard do investidor
CREATE TABLE IF NOT EXISTS `InvestorDashboard` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `userId` BIGINT NOT NULL,
  
  -- Configurações
  `alertSettings` JSON NULL,
  `dashboardLayout` JSON NULL,
  
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `InvestorDashboard_userId_key` (`userId`),
  
  CONSTRAINT `InvestorDashboard_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de lotes salvos
CREATE TABLE IF NOT EXISTS `SavedLot` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `userId` BIGINT NOT NULL,
  `lotId` BIGINT NOT NULL,
  
  `savedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` TEXT NULL,
  `notifyOnPriceChange` BOOLEAN NOT NULL DEFAULT true,
  `notifyOnStatusChange` BOOLEAN NOT NULL DEFAULT true,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `SavedLot_userId_lotId_key` (`userId`, `lotId`),
  INDEX `SavedLot_userId_idx` (`userId`),
  INDEX `SavedLot_lotId_idx` (`lotId`),
  
  CONSTRAINT `SavedLot_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SavedLot_lotId_fkey` 
    FOREIGN KEY (`lotId`) REFERENCES `Lot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de alertas do investidor
CREATE TABLE IF NOT EXISTS `InvestorAlert` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `userId` BIGINT NOT NULL,
  
  -- Filtros do alerta
  `alertName` VARCHAR(200) NOT NULL,
  `categoryIds` JSON NULL,
  `stateUfs` JSON NULL,
  `cityIds` JSON NULL,
  `minPrice` DECIMAL(15,2) NULL,
  `maxPrice` DECIMAL(15,2) NULL,
  `keywords` JSON NULL,
  
  -- Notificação
  `notifyEmail` BOOLEAN NOT NULL DEFAULT true,
  `notifyPush` BOOLEAN NOT NULL DEFAULT false,
  `frequency` VARCHAR(20) NOT NULL DEFAULT 'INSTANT',
  
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `lastTriggeredAt` DATETIME(3) NULL,
  
  PRIMARY KEY (`id`),
  INDEX `InvestorAlert_userId_idx` (`userId`),
  
  CONSTRAINT `InvestorAlert_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de estatísticas do investidor
CREATE TABLE IF NOT EXISTS `InvestorStatistics` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `userId` BIGINT NOT NULL,
  
  -- Estatísticas
  `totalBidsPlaced` INT NOT NULL DEFAULT 0,
  `totalLotsWon` INT NOT NULL DEFAULT 0,
  `totalAmountWon` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `totalAmountSpent` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `averageDiscount` DECIMAL(5,2) NULL,
  `winRate` DECIMAL(5,2) NULL,
  
  -- ROI
  `estimatedPortfolioValue` DECIMAL(15,2) NULL,
  
  `lastCalculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `InvestorStatistics_userId_key` (`userId`),
  
  CONSTRAINT `InvestorStatistics_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- ADICIONAR CAMPO dynamicSpecs AO Asset (se não existir)
-- =============================================================================
ALTER TABLE `Asset` ADD COLUMN IF NOT EXISTS `dynamicSpecs` JSON NULL;

-- =============================================================================
-- FIM DA MIGRATION
-- =============================================================================
