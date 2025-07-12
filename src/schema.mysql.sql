-- /src/schema.mysql.sql

-- ============================================================================
-- TABELAS DE CONFIGURAÇÃO E LOCALIDADES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `platform_settings` (
    `id` VARCHAR(255) PRIMARY KEY,
    `site_title` VARCHAR(255),
    `site_tagline` VARCHAR(255),
    `logo_url` VARCHAR(255) DEFAULT NULL,
    `favicon_url` VARCHAR(255) DEFAULT NULL,
    `gallery_image_base_path` VARCHAR(255),
    `storage_provider` VARCHAR(50),
    `firebase_storage_bucket` VARCHAR(255),
    `active_theme_name` VARCHAR(255),
    `themes` JSON,
    `platform_public_id_masks` JSON,
    `homepage_sections` JSON,
    `mental_trigger_settings` JSON,
    `section_badge_visibility` JSON,
    `map_settings` JSON,
    `search_pagination_type` VARCHAR(50),
    `search_items_per_page` INT,
    `search_load_more_count` INT,
    `show_countdown_on_lot_detail` BOOLEAN,
    `show_countdown_on_cards` BOOLEAN,
    `show_related_lots_on_lot_detail` BOOLEAN,
    `related_lots_count` INT,
    `default_urgency_timer_hours` INT,
    `variable_increment_table` JSON,
    `bidding_settings` JSON,
    `default_list_items_per_page` INT,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `item_count` INT DEFAULT 0,
  `has_subcategories` BOOLEAN DEFAULT FALSE,
  `icon_name` VARCHAR(50) DEFAULT NULL,
  `data_ai_hint_icon` VARCHAR(50) DEFAULT NULL,
  `cover_image_url` VARCHAR(255) DEFAULT NULL,
  `cover_image_media_id` VARCHAR(255) DEFAULT NULL,
  `data_ai_hint_cover` VARCHAR(50) DEFAULT NULL,
  `mega_menu_image_url` VARCHAR(255) DEFAULT NULL,
  `mega_menu_image_media_id` VARCHAR(255) DEFAULT NULL,
  `data_ai_hint_mega_menu` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `parent_category_id` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `item_count` INT DEFAULT 0,
  `display_order` INT DEFAULT 0,
  `icon_url` VARCHAR(255),
  `icon_media_id` VARCHAR(255),
  `data_ai_hint_icon` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_parent_category_id` (`parent_category_id`)
);

CREATE TABLE IF NOT EXISTS `states` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `uf` VARCHAR(2) NOT NULL UNIQUE,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `city_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `cities` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `state_id` VARCHAR(255) NOT NULL,
  `state_uf` VARCHAR(2) NOT NULL,
  `ibge_code` VARCHAR(7),
  `lot_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_state_id` (`state_id`)
);

-- ============================================================================
-- TABELAS DE USUÁRIOS, PERFIS E AUTENTICAÇÃO
-- ============================================================================
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `name_normalized` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `permissions` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uid` VARCHAR(255) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255),
  `cpf` VARCHAR(20) UNIQUE,
  `cell_phone` VARCHAR(20),
  `razao_social` VARCHAR(255),
  `cnpj` VARCHAR(20) UNIQUE,
  `date_of_birth` DATE,
  `zip_code` VARCHAR(10),
  `street` VARCHAR(255),
  `number` VARCHAR(50),
  `complement` VARCHAR(100),
  `neighborhood` VARCHAR(100),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `avatar_url` VARCHAR(255),
  `data_ai_hint` VARCHAR(50),
  `role_id` VARCHAR(255),
  `seller_id` VARCHAR(255),
  `habilitation_status` VARCHAR(50),
  `account_type` VARCHAR(50),
  `badges` JSON,
  `opt_in_marketing` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================================
-- TABELAS PRINCIPAIS DE LEILÃO
-- ============================================================================
CREATE TABLE IF NOT EXISTS `auctions` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(255) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) NOT NULL,
  `auction_date` TIMESTAMP NOT NULL,
  `end_date` TIMESTAMP,
  `total_lots` INT DEFAULT 0,
  `category_id` VARCHAR(255),
  `category` VARCHAR(255),
  `auctioneer` VARCHAR(255),
  `auctioneer_id` VARCHAR(255),
  `auctioneer_logo_url` VARCHAR(255),
  `seller` VARCHAR(255),
  `seller_id` VARCHAR(255),
  `map_address` VARCHAR(255),
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(255),
  `data_ai_hint` VARCHAR(50),
  `is_favorite` BOOLEAN DEFAULT FALSE,
  `visits` INT DEFAULT 0,
  `initial_offer` DECIMAL(10, 2),
  `auction_type` VARCHAR(50),
  `auction_stages` JSON,
  `documents_url` VARCHAR(255),
  `evaluation_report_url` VARCHAR(255),
  `auction_certificate_url` VARCHAR(255),
  `selling_branch` VARCHAR(100),
  `automatic_bidding_enabled` BOOLEAN DEFAULT FALSE,
  `silent_bidding_enabled` BOOLEAN DEFAULT FALSE,
  `allow_multiple_bids_per_user` BOOLEAN DEFAULT TRUE,
  `allow_installment_bids` BOOLEAN DEFAULT FALSE,
  `soft_close_enabled` BOOLEAN DEFAULT FALSE,
  `soft_close_minutes` INT,
  `estimated_revenue` DECIMAL(12, 2),
  `achieved_revenue` DECIMAL(12, 2),
  `total_habilitated_users` INT DEFAULT 0,
  `is_featured_on_marketplace` BOOLEAN DEFAULT FALSE,
  `marketplace_announcement_title` VARCHAR(255),
  `judicial_process_id` VARCHAR(255),
  `additional_triggers` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_status` (`status`),
  KEY `idx_auctioneer_id` (`auctioneer_id`),
  KEY `idx_seller_id` (`seller_id`)
);

CREATE TABLE IF NOT EXISTS `lots` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(255) NOT NULL UNIQUE,
  `auction_id` VARCHAR(255) NOT NULL,
  `auction_public_id` VARCHAR(255),
  `number` VARCHAR(50),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(12, 2) NOT NULL,
  `initial_price` DECIMAL(12, 2),
  `second_initial_price` DECIMAL(12, 2),
  `bid_increment_step` DECIMAL(10, 2),
  `status` VARCHAR(50) NOT NULL,
  `bids_count` INT DEFAULT 0,
  `views` INT DEFAULT 0,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `is_exclusive` BOOLEAN DEFAULT FALSE,
  `discount_percentage` DECIMAL(5, 2),
  `additional_triggers` JSON,
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(255),
  `gallery_image_urls` JSON,
  `media_item_ids` JSON,
  `bem_ids` JSON,
  `type` VARCHAR(255),
  `category_id` VARCHAR(255),
  `subcategory_name` VARCHAR(255),
  `subcategory_id` VARCHAR(255),
  `auction_name` VARCHAR(255),
  `seller_name` VARCHAR(255),
  `seller_id` VARCHAR(255),
  `auctioneer_id` VARCHAR(255),
  `city_id` VARCHAR(255),
  `state_id` VARCHAR(255),
  `city_name` VARCHAR(255),
  `state_uf` VARCHAR(2),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `map_address` VARCHAR(255),
  `map_embed_url` VARCHAR(255),
  `map_static_image_url` VARCHAR(255),
  `end_date` TIMESTAMP,
  `auction_date` TIMESTAMP,
  `lot_specific_auction_date` TIMESTAMP,
  `second_auction_date` TIMESTAMP,
  `condition` VARCHAR(255),
  `data_ai_hint` VARCHAR(50),
  `winner_id` VARCHAR(255),
  `winning_bid_term_url` VARCHAR(255),
  `reserve_price` DECIMAL(12, 2),
  `evaluation_value` DECIMAL(12, 2),
  `debt_amount` DECIMAL(12, 2),
  `itbi_value` DECIMAL(12, 2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_auction_id_status` (`auction_id`, `status`)
);

CREATE TABLE IF NOT EXISTS `bids` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `lot_id` VARCHAR(255) NOT NULL,
  `auction_id` VARCHAR(255) NOT NULL,
  `bidder_id` VARCHAR(255) NOT NULL,
  `bidder_display` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_lot_id_amount` (`lot_id`, `amount`)
);

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `lot_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `winning_bid_amount` DECIMAL(12, 2) NOT NULL,
  `win_date` TIMESTAMP NOT NULL,
  `payment_status` VARCHAR(50) NOT NULL,
  `invoice_url` VARCHAR(255),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_lot_id` (`lot_id`)
);

-- ============================================================================
-- TABELAS DE APOIO E ENTIDADES
-- ============================================================================
CREATE TABLE IF NOT EXISTS `sellers` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(255) NOT NULL UNIQUE,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `contact_name` VARCHAR(255),
  `email` VARCHAR(255),
  `phone` VARCHAR(50),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zip_code` VARCHAR(20),
  `website` VARCHAR(255),
  `logo_url` VARCHAR(255),
  `logo_media_id` VARCHAR(255),
  `data_ai_hint_logo` VARCHAR(50),
  `description` TEXT,
  `user_id` VARCHAR(255),
  `member_since` TIMESTAMP,
  `rating` DECIMAL(3, 2),
  `active_lots_count` INT DEFAULT 0,
  `total_sales_value` DECIMAL(15, 2),
  `auctions_facilitated_count` INT DEFAULT 0,
  `is_judicial` BOOLEAN DEFAULT FALSE,
  `judicial_branch_id` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `auctioneers` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `public_id` VARCHAR(255) NOT NULL UNIQUE,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `registration_number` VARCHAR(100),
    `contact_name` VARCHAR(255),
    `email` VARCHAR(255),
    `phone` VARCHAR(50),
    `address` VARCHAR(255),
    `city` VARCHAR(100),
    `state` VARCHAR(50),
    `zip_code` VARCHAR(20),
    `website` VARCHAR(255),
    `logo_url` VARCHAR(255),
    `logo_media_id` VARCHAR(255),
    `data_ai_hint_logo` VARCHAR(50),
    `description` TEXT,
    `user_id` VARCHAR(255),
    `member_since` TIMESTAMP,
    `rating` DECIMAL(3, 2),
    `auctions_conducted_count` INT,
    `total_value_sold` DECIMAL(15, 2),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `direct_sale_offers` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(255) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `offer_type` VARCHAR(50) NOT NULL,
  `price` DECIMAL(12, 2),
  `minimum_offer_price` DECIMAL(12, 2),
  `status` VARCHAR(50) NOT NULL,
  `category` VARCHAR(255),
  `seller_id` VARCHAR(255),
  `seller_name` VARCHAR(255),
  `seller_logo_url` VARCHAR(255),
  `data_ai_hint_seller_logo` VARCHAR(50),
  `location_city` VARCHAR(100),
  `location_state` VARCHAR(50),
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(255),
  `data_ai_hint` VARCHAR(50),
  `gallery_image_urls` JSON,
  `media_item_ids` JSON,
  `items_included` JSON,
  `views` INT DEFAULT 0,
  `expires_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================================
-- TABELAS DO SISTEMA
-- ============================================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `link` VARCHAR(255),
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_user_id` (`user_id`)
);

CREATE TABLE IF NOT EXISTS `media_items` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `file_name` VARCHAR(255) NOT NULL,
  `storage_path` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255),
  `alt_text` VARCHAR(255),
  `caption` VARCHAR(255),
  `description` TEXT,
  `mime_type` VARCHAR(100) NOT NULL,
  `size_bytes` INT NOT NULL,
  `url_original` VARCHAR(255) NOT NULL,
  `url_thumbnail` VARCHAR(255),
  `url_medium` VARCHAR(255),
  `url_large` VARCHAR(255),
  `linked_lot_ids` JSON,
  `data_ai_hint` VARCHAR(50),
  `uploaded_by` VARCHAR(255),
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `document_types` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `is_required` BOOLEAN DEFAULT TRUE,
  `applies_to` VARCHAR(50) -- e.g., PHYSICAL, LEGAL, ALL
);

CREATE TABLE IF NOT EXISTS `user_documents` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `document_type_id` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `file_url` VARCHAR(255) NOT NULL,
  `file_name` VARCHAR(255),
  `rejection_reason` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_user_id` (`user_id`)
);

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
