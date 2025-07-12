-- src/scripts/alter-tables.mysql.sql
-- Este script contém comandos ALTER TABLE para adicionar colunas faltantes às tabelas existentes.
-- Ele foi projetado para ser executado de forma idempotente pelo `init-db.ts`.

-- Adiciona colunas faltantes na tabela `platform_settings`
ALTER TABLE `platform_settings`
  ADD COLUMN `site_title` VARCHAR(255) NULL,
  ADD COLUMN `site_tagline` VARCHAR(255) NULL,
  ADD COLUMN `gallery_image_base_path` VARCHAR(255) NULL,
  ADD COLUMN `storage_provider` VARCHAR(50) NULL,
  ADD COLUMN `firebase_storage_bucket` VARCHAR(255) NULL,
  ADD COLUMN `active_theme_name` VARCHAR(100) NULL,
  ADD COLUMN `themes` JSON NULL,
  ADD COLUMN `platform_public_id_masks` JSON NULL,
  ADD COLUMN `homepage_sections` JSON NULL,
  ADD COLUMN `mental_trigger_settings` JSON NULL,
  ADD COLUMN `section_badge_visibility` JSON NULL,
  ADD COLUMN `map_settings` JSON NULL,
  ADD COLUMN `search_pagination_type` VARCHAR(50) NULL,
  ADD COLUMN `search_items_per_page` INT NULL,
  ADD COLUMN `search_load_more_count` INT NULL,
  ADD COLUMN `show_countdown_on_lot_detail` BOOLEAN NULL,
  ADD COLUMN `show_countdown_on_cards` BOOLEAN NULL,
  ADD COLUMN `show_related_lots_on_lot_detail` BOOLEAN NULL,
  ADD COLUMN `related_lots_count` INT NULL,
  ADD COLUMN `default_urgency_timer_hours` INT NULL,
  ADD COLUMN `variable_increment_table` JSON NULL,
  ADD COLUMN `bidding_settings` JSON NULL,
  ADD COLUMN `default_list_items_per_page` INT NULL,
  ADD COLUMN `updated_at` DATETIME NULL,
  ADD COLUMN `logo_url` VARCHAR(2048) NULL,
  ADD COLUMN `favicon_url` VARCHAR(2048) NULL;

-- Adiciona colunas faltantes na tabela `roles`
ALTER TABLE `roles`
  ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN `slug` VARCHAR(150) NULL;

-- Adiciona colunas faltantes na tabela `auctions`
ALTER TABLE `auctions`
  ADD COLUMN `auction_date` DATETIME NULL,
  ADD COLUMN `end_date` DATETIME NULL,
  ADD COLUMN `category_id` INT NULL,
  ADD COLUMN `seller_id` INT NULL,
  ADD COLUMN `auctioneer_id` INT NULL,
  ADD COLUMN `image_media_id` VARCHAR(255) NULL,
  ADD COLUMN `data_ai_hint` VARCHAR(255) NULL,
  ADD COLUMN `is_favorite` BOOLEAN NULL,
  ADD COLUMN `visits` INT NULL,
  ADD COLUMN `initial_offer` DECIMAL(15, 2) NULL,
  ADD COLUMN `auction_stages` JSON NULL,
  ADD COLUMN `documents_url` VARCHAR(2048) NULL,
  ADD COLUMN `evaluation_report_url` VARCHAR(2048) NULL,
  ADD COLUMN `auction_certificate_url` VARCHAR(2048) NULL,
  ADD COLUMN `selling_branch` VARCHAR(255) NULL,
  ADD COLUMN `automatic_bidding_enabled` BOOLEAN NULL,
  ADD COLUMN `silent_bidding_enabled` BOOLEAN NULL,
  ADD COLUMN `allow_multiple_bids_per_user` BOOLEAN NULL,
  ADD COLUMN `allow_installment_bids` BOOLEAN NULL,
  ADD COLUMN `soft_close_enabled` BOOLEAN NULL,
  ADD COLUMN `soft_close_minutes` INT NULL,
  ADD COLUMN `estimated_revenue` DECIMAL(15, 2) NULL,
  ADD COLUMN `achieved_revenue` DECIMAL(15, 2) NULL,
  ADD COLUMN `total_habilitated_users` INT NULL,
  ADD COLUMN `is_featured_on_marketplace` BOOLEAN NULL,
  ADD COLUMN `marketplace_announcement_title` VARCHAR(255) NULL,
  ADD COLUMN `judicial_process_id` INT NULL,
  ADD COLUMN `additional_triggers` JSON NULL,
  ADD COLUMN `decrement_amount` DECIMAL(15, 2) NULL,
  ADD COLUMN `decrement_interval_seconds` INT NULL,
  ADD COLUMN `floor_price` DECIMAL(15, 2) NULL,
  ADD COLUMN `auto_relist_settings` JSON NULL;
  
-- Adiciona colunas faltantes na tabela `lots`
ALTER TABLE `lots`
    ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Adiciona colunas faltantes na tabela `sellers`
ALTER TABLE `sellers`
    ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Adiciona colunas faltantes na tabela `auctioneers`
ALTER TABLE `auctioneers`
    ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Adiciona colunas faltantes na tabela `users`
ALTER TABLE `users`
    ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
    
-- Adiciona colunas faltantes na tabela `bens`
ALTER TABLE `bens`
    ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
    
-- Adiciona colunas de imagem na tabela `lot_categories`
ALTER TABLE `lot_categories`
  ADD COLUMN `logo_url` VARCHAR(2048) NULL,
  ADD COLUMN `data_ai_hint_logo` VARCHAR(50) NULL,
  ADD COLUMN `cover_image_url` VARCHAR(2048) NULL,
  ADD COLUMN `data_ai_hint_cover` VARCHAR(50) NULL,
  ADD COLUMN `mega_menu_image_url` VARCHAR(2048) NULL,
  ADD COLUMN `data_ai_hint_mega_menu` VARCHAR(50) NULL;
