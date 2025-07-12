
-- Este arquivo contém comandos ALTER TABLE para atualizar o schema do banco de dados
-- sem precisar apagar e recriar as tabelas. Ele será executado pelo script `init-db.ts`.

-- Adicionar colunas faltantes a `platform_settings`
ALTER TABLE `platform_settings` ADD COLUMN `logo_url` VARCHAR(2048) NULL;
ALTER TABLE `platform_settings` ADD COLUMN `favicon_url` VARCHAR(2048) NULL;
ALTER TABLE `platform_settings` ADD COLUMN `site_title` VARCHAR(255);
ALTER TABLE `platform_settings` ADD COLUMN `site_tagline` VARCHAR(255);
ALTER TABLE `platform_settings` ADD COLUMN `gallery_image_base_path` VARCHAR(255);
ALTER TABLE `platform_settings` ADD COLUMN `storage_provider` VARCHAR(50);
ALTER TABLE `platform_settings` ADD COLUMN `firebase_storage_bucket` VARCHAR(255);
ALTER TABLE `platform_settings` ADD COLUMN `active_theme_name` VARCHAR(100);
ALTER TABLE `platform_settings` ADD COLUMN `themes` JSON;
ALTER TABLE `platform_settings` ADD COLUMN `platform_public_id_masks` JSON;
ALTER TABLE `platform_settings` ADD COLUMN `homepage_sections` JSON;
ALTER TABLE `platform_settings` ADD COLUMN `mental_trigger_settings` JSON;
ALTER TABLE `platform_settings` ADD COLUMN `section_badge_visibility` JSON;
ALTER TABLE `platform_settings` ADD COLUMN `map_settings` JSON;
ALTER TABLE `platform_settings` ADD COLUMN `search_pagination_type` VARCHAR(50);
ALTER TABLE `platform_settings` ADD COLUMN `search_items_per_page` INT;
ALTER TABLE `platform_settings` ADD COLUMN `search_load_more_count` INT;
ALTER TABLE `platform_settings` ADD COLUMN `show_countdown_on_lot_detail` BOOLEAN;
ALTER TABLE `platform_settings` ADD COLUMN `show_countdown_on_cards` BOOLEAN;
ALTER TABLE `platform_settings` ADD COLUMN `show_related_lots_on_lot_detail` BOOLEAN;
ALTER TABLE `platform_settings` ADD COLUMN `related_lots_count` INT;
ALTER TABLE `platform_settings` ADD COLUMN `default_urgency_timer_hours` INT;
ALTER TABLE `platform_settings` ADD COLUMN `variable_increment_table` JSON;
ALTER TABLE `platform_settings` ADD COLUMN `bidding_settings` JSON;
ALTER TABLE `platform_settings` ADD COLUMN `default_list_items_per_page` INT;
ALTER TABLE `platform_settings` ADD COLUMN `updated_at` DATETIME;


-- Adicionar colunas faltantes a `roles`
ALTER TABLE `roles` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `roles` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `roles` ADD COLUMN `slug` VARCHAR(150);

-- Adicionar colunas faltantes a `lot_categories`
ALTER TABLE `lot_categories` ADD COLUMN `icon_name` VARCHAR(100) NULL;
ALTER TABLE `lot_categories` ADD COLUMN `data_ai_hint_icon` VARCHAR(50) NULL;

-- Adicionar colunas de data/timestamps a todas as tabelas principais
ALTER TABLE `auctions` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `auctions` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `lots` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `lots` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `users` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `users` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `sellers` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `sellers` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `auctioneers` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `auctioneers` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `bens` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `bens` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `judicial_processes` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `judicial_processes` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `courts` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `courts` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `judicial_districts` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `judicial_districts` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE `judicial_branches` ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `judicial_branches` ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Colunas adicionais previstas em `src/types` e `actions`
ALTER TABLE `auctions` ADD COLUMN `end_date` DATETIME;
ALTER TABLE `auctions` ADD COLUMN `category_id` INT;
ALTER TABLE `auctions` ADD COLUMN `seller_id` INT;
ALTER TABLE `auctions` ADD COLUMN `auctioneer_id` INT;
ALTER TABLE `auctions` ADD COLUMN `image_media_id` VARCHAR(255);
ALTER TABLE `auctions` ADD COLUMN `data_ai_hint` VARCHAR(255);
ALTER TABLE `auctions` ADD COLUMN `is_favorite` BOOLEAN;
ALTER TABLE `auctions` ADD COLUMN `visits` INT;
ALTER TABLE `auctions` ADD COLUMN `initial_offer` DECIMAL(15, 2);
ALTER TABLE `auctions` ADD COLUMN `auction_stages` JSON;
ALTER TABLE `auctions` ADD COLUMN `documents_url` VARCHAR(2048);
ALTER TABLE `auctions` ADD COLUMN `evaluation_report_url` VARCHAR(2048);
ALTER TABLE `auctions` ADD COLUMN `auction_certificate_url` VARCHAR(2048);
ALTER TABLE `auctions` ADD COLUMN `selling_branch` VARCHAR(255);
ALTER TABLE `auctions` ADD COLUMN `automatic_bidding_enabled` BOOLEAN;
ALTER TABLE `auctions` ADD COLUMN `silent_bidding_enabled` BOOLEAN;
ALTER TABLE `auctions` ADD COLUMN `allow_multiple_bids_per_user` BOOLEAN;
ALTER TABLE `auctions` ADD COLUMN `allow_installment_bids` BOOLEAN;
ALTER TABLE `auctions` ADD COLUMN `soft_close_enabled` BOOLEAN;
ALTER TABLE `auctions` ADD COLUMN `soft_close_minutes` INT;
ALTER TABLE `auctions` ADD COLUMN `estimated_revenue` DECIMAL(15, 2);
ALTER TABLE `auctions` ADD COLUMN `achieved_revenue` DECIMAL(15, 2);
ALTER TABLE `auctions` ADD COLUMN `total_habilitated_users` INT;
ALTER TABLE `auctions` ADD COLUMN `is_featured_on_marketplace` BOOLEAN;
ALTER TABLE `auctions` ADD COLUMN `marketplace_announcement_title` VARCHAR(255);
ALTER TABLE `auctions` ADD COLUMN `judicial_process_id` INT;
ALTER TABLE `auctions` ADD COLUMN `additional_triggers` JSON;
ALTER TABLE `auctions` ADD COLUMN `decrement_amount` DECIMAL(15, 2);
ALTER TABLE `auctions` ADD COLUMN `decrement_interval_seconds` INT;
ALTER TABLE `auctions` ADD COLUMN `floor_price` DECIMAL(15, 2);
ALTER TABLE `auctions` ADD COLUMN `auto_relist_settings` JSON;
