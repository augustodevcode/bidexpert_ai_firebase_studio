
-- src/alter-tables.mysql.sql
-- Este script contém alterações na estrutura das tabelas que foram criadas inicialmente.
-- Ele é projetado para ser executado após o schema.mysql.sql.

-- Adicionando colunas à tabela 'auctions'
ALTER TABLE `auctions` ADD COLUMN `auction_date` DATETIME;
ALTER TABLE `auctions` ADD COLUMN `end_date` DATETIME;
ALTER TABLE `auctions` ADD COLUMN `category_id` INT;
ALTER TABLE `auctions` ADD COLUMN `seller_id` INT;
ALTER TABLE `auctions` ADD COLUMN `auctioneer_id` INT;
ALTER TABLE `auctions` ADD COLUMN `initial_offer` DECIMAL(15, 2);
ALTER TABLE `auctions` ADD COLUMN `visits` INT DEFAULT 0;
ALTER TABLE `auctions` ADD COLUMN `is_favorite` BOOLEAN DEFAULT FALSE;
ALTER TABLE `auctions` ADD COLUMN `image_url` VARCHAR(255);
ALTER TABLE `auctions` ADD COLUMN `image_media_id` VARCHAR(255);
ALTER TABLE `auctions` ADD COLUMN `data_ai_hint` VARCHAR(100);
ALTER TABLE `auctions` ADD COLUMN `documents_url` VARCHAR(255);
ALTER TABLE `auctions` ADD COLUMN `auction_type` VARCHAR(50);
ALTER TABLE `auctions` ADD COLUMN `city` VARCHAR(100);
ALTER TABLE `auctions` ADD COLUMN `state` VARCHAR(2);

-- Adicionando colunas à tabela 'roles' (Exemplo de como adicionar a outras tabelas)
ALTER TABLE `roles` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `roles` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `roles` ADD COLUMN `slug` VARCHAR(150);


-- Adicionando chaves estrangeiras que podem estar faltando
-- ALTER TABLE `auctions` ADD CONSTRAINT `fk_auction_category` FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`);
-- ALTER TABLE `auctions` ADD CONSTRAINT `fk_auction_seller` FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`);
-- ALTER TABLE `auctions` ADD CONSTRAINT `fk_auction_auctioneer` FOREIGN KEY (`auctioneer_id`) REFERENCES `auctioneers`(`id`);
