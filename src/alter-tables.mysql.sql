-- src/alter-tables.mysql.sql

-- Adiciona colunas faltantes à tabela `platform_settings` se elas não existirem.
-- Este script é seguro para ser executado múltiplas vezes.
ALTER TABLE `platform_settings` ADD COLUMN IF NOT EXISTS `logo_url` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `platform_settings` ADD COLUMN IF NOT EXISTS `favicon_url` VARCHAR(255) DEFAULT NULL;

-- Adiciona a coluna faltante `parent_category_id` à tabela `subcategories`.
ALTER TABLE `subcategories` ADD COLUMN IF NOT EXISTS `parent_category_id` VARCHAR(255) NOT NULL;

-- Adiciona a coluna faltante `auctioneer_logo_url` à tabela `auctions`.
ALTER TABLE `auctions` ADD COLUMN IF NOT EXISTS `auctioneer_logo_url` VARCHAR(255) DEFAULT NULL;

-- Adiciona colunas para armazenar dados de revisão de lotes
ALTER TABLE `lots` ADD COLUMN IF NOT EXISTS `winner_id` VARCHAR(255) DEFAULT NULL;

-- Adiciona tabela de revisões
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `lot_id` VARCHAR(255) NOT NULL,
  `auction_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `user_display_name` VARCHAR(255),
  `rating` INT NOT NULL,
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_lot_id` (`lot_id`)
);

-- Adiciona tabela de perguntas
CREATE TABLE IF NOT EXISTS `lot_questions` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `lot_id` VARCHAR(255) NOT NULL,
  `auction_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `user_display_name` VARCHAR(255),
  `question_text` TEXT NOT NULL,
  `answer_text` TEXT,
  `answered_by_user_id` VARCHAR(255),
  `answered_by_user_display_name` VARCHAR(255),
  `is_public` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `answered_at` TIMESTAMP NULL,
  KEY `idx_lot_id` (`lot_id`)
);

-- Adiciona tabela de lances máximos (proxy bids)
CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `lot_id` VARCHAR(255) NOT NULL,
  `max_amount` DECIMAL(12, 2) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_user_lot` (`user_id`, `lot_id`)
);
