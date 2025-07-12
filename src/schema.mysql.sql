
-- =================================================================
-- TABELAS DE CONFIGURAÇÃO E PLATAFORMA
-- =================================================================

CREATE TABLE IF NOT EXISTS `platform_settings` (
    `id` VARCHAR(50) PRIMARY KEY DEFAULT 'global',
    `site_title` VARCHAR(255) NOT NULL,
    `site_tagline` VARCHAR(255),
    `logo_url` VARCHAR(2048),
    `favicon_url` VARCHAR(2048),
    `gallery_image_base_path` VARCHAR(255),
    `storage_provider` VARCHAR(50),
    `firebase_storage_bucket` VARCHAR(255),
    `active_theme_name` VARCHAR(100),
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
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `roles` (
    `id` VARCHAR(50) PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `name_normalized` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT,
    `permissions` JSON,
    `slug` VARCHAR(150),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `lot_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(50) UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150) NOT NULL UNIQUE,
    `description` TEXT,
    `has_subcategories` BOOLEAN DEFAULT FALSE,
    `icon_name` VARCHAR(100),
    `data_ai_hint_icon` VARCHAR(50),
    `cover_image_url` VARCHAR(2048),
    `data_ai_hint_cover` VARCHAR(50),
    `mega_menu_image_url` VARCHAR(2048),
    `data_ai_hint_mega_menu` VARCHAR(50),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `subcategories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(50) UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `parent_category_id` INT,
    `description` TEXT,
    `display_order` INT DEFAULT 0,
    `icon_media_id` VARCHAR(255),
    `data_ai_hint_icon` VARCHAR(50),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`parent_category_id`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `states` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `uf` VARCHAR(2) NOT NULL UNIQUE,
    `slug` VARCHAR(100) UNIQUE,
    `city_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `cities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150),
    `state_id` INT,
    `ibge_code` VARCHAR(10),
    `lot_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON DELETE SET NULL
);


-- =================================================================
-- TABELAS DE ENTIDADES PRINCIPAIS (USUÁRIOS, COMITENTES, LEILOEIROS)
-- =================================================================

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `uid` VARCHAR(100) UNIQUE NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255),
    `cpf` VARCHAR(20) UNIQUE,
    `cell_phone` VARCHAR(25),
    `razao_social` VARCHAR(255),
    `cnpj` VARCHAR(25) UNIQUE,
    `date_of_birth` DATE,
    `zip_code` VARCHAR(15),
    `street` VARCHAR(255),
    `number` VARCHAR(20),
    `complement` VARCHAR(100),
    `neighborhood` VARCHAR(100),
    `city` VARCHAR(100),
    `state` VARCHAR(50),
    `avatar_url` VARCHAR(2048),
    `data_ai_hint` VARCHAR(50),
    `role_id` VARCHAR(50),
    `seller_id` INT,
    `habilitation_status` VARCHAR(50) DEFAULT 'PENDING_DOCUMENTS',
    `account_type` VARCHAR(50),
    `badges` JSON,
    `opt_in_marketing` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `sellers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(50) UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) UNIQUE,
    `contact_name` VARCHAR(150),
    `email` VARCHAR(255),
    `phone` VARCHAR(25),
    `address` VARCHAR(255),
    `city` VARCHAR(100),
    `state` VARCHAR(50),
    `zip_code` VARCHAR(15),
    `website` VARCHAR(2048),
    `logo_url` VARCHAR(2048),
    `logo_media_id` VARCHAR(255),
    `data_ai_hint_logo` VARCHAR(50),
    `description` TEXT,
    `user_id` INT,
    `member_since` DATE,
    `rating` DECIMAL(3, 2),
    `active_lots_count` INT DEFAULT 0,
    `total_sales_value` DECIMAL(15, 2) DEFAULT 0,
    `auctions_facilitated_count` INT DEFAULT 0,
    `is_judicial` BOOLEAN DEFAULT FALSE,
    `judicial_branch_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS `auctioneers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(50) UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) UNIQUE,
    `registration_number` VARCHAR(50),
    `contact_name` VARCHAR(150),
    `email` VARCHAR(255),
    `phone` VARCHAR(25),
    `address` VARCHAR(255),
    `city` VARCHAR(100),
    `state` VARCHAR(50),
    `zip_code` VARCHAR(15),
    `website` VARCHAR(2048),
    `logo_url` VARCHAR(2048),
    `logo_media_id` VARCHAR(255),
    `data_ai_hint_logo` VARCHAR(50),
    `description` TEXT,
    `user_id` INT,
    `member_since` DATE,
    `rating` DECIMAL(3, 2),
    `auctions_conducted_count` INT DEFAULT 0,
    `total_value_sold` DECIMAL(15, 2) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =================================================================
-- TABELAS JUDICIAIS
-- =================================================================

CREATE TABLE IF NOT EXISTS `courts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `slug` VARCHAR(255) UNIQUE,
    `state_uf` VARCHAR(2) NOT NULL,
    `website` VARCHAR(2048),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `judicial_districts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255),
    `court_id` INT,
    `state_id` INT,
    `zip_code` VARCHAR(15),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `judicial_branches` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255),
    `district_id` INT,
    `contact_name` VARCHAR(150),
    `phone` VARCHAR(25),
    `email` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `judicial_processes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(50) UNIQUE,
    `process_number` VARCHAR(100) NOT NULL UNIQUE,
    `is_electronic` BOOLEAN DEFAULT TRUE,
    `court_id` INT,
    `district_id` INT,
    `branch_id` INT,
    `seller_id` INT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`),
    FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`),
    FOREIGN KEY (`branch_id`) REFERENCES `judicial_branches`(`id`),
    FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`)
);

CREATE TABLE IF NOT EXISTS `judicial_parties` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `process_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `document_number` VARCHAR(50),
    `party_type` VARCHAR(50),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
);

-- =================================================================
-- TABELAS PRINCIPAIS DE NEGÓCIOS (LEILÕES, LOTES, BENS)
-- =================================================================

CREATE TABLE IF NOT EXISTS `auctions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(50) UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` VARCHAR(50) NOT NULL DEFAULT 'RASCUNHO',
    `auction_date` DATETIME,
    `end_date` DATETIME,
    `total_lots` INT DEFAULT 0,
    `category_id` INT,
    `auctioneer_id` INT,
    `seller_id` INT,
    `image_media_id` VARCHAR(255),
    `image_url` VARCHAR(2048),
    `data_ai_hint` VARCHAR(50),
    `is_favorite` BOOLEAN DEFAULT FALSE,
    `visits` INT DEFAULT 0,
    `initial_offer` DECIMAL(15, 2),
    `auction_type` VARCHAR(50),
    `auction_stages` JSON,
    `documents_url` VARCHAR(2048),
    `evaluation_report_url` VARCHAR(2048),
    `auction_certificate_url` VARCHAR(2048),
    `selling_branch` VARCHAR(255),
    `automatic_bidding_enabled` BOOLEAN DEFAULT FALSE,
    `silent_bidding_enabled` BOOLEAN DEFAULT FALSE,
    `allow_multiple_bids_per_user` BOOLEAN DEFAULT TRUE,
    `allow_installment_bids` BOOLEAN DEFAULT FALSE,
    `soft_close_enabled` BOOLEAN DEFAULT FALSE,
    `soft_close_minutes` INT,
    `estimated_revenue` DECIMAL(15, 2),
    `achieved_revenue` DECIMAL(15, 2),
    `total_habilitated_users` INT DEFAULT 0,
    `is_featured_on_marketplace` BOOLEAN DEFAULT FALSE,
    `marketplace_announcement_title` VARCHAR(255),
    `judicial_process_id` INT,
    `additional_triggers` JSON,
    `decrement_amount` DECIMAL(15, 2),
    `decrement_interval_seconds` INT,
    `floor_price` DECIMAL(15, 2),
    `auto_relist_settings` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
    FOREIGN KEY (`auctioneer_id`) REFERENCES `auctioneers`(`id`),
    FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`),
    FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`)
);


CREATE TABLE IF NOT EXISTS `bens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `public_id` VARCHAR(50) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50),
  `category_id` INT,
  `subcategory_id` INT,
  `judicial_process_id` INT,
  `seller_id` INT,
  `evaluation_value` DECIMAL(15, 2),
  `image_url` VARCHAR(2048),
  `image_media_id` VARCHAR(255),
  `gallery_image_urls` JSON,
  `media_item_ids` JSON,
  `data_ai_hint` VARCHAR(50),
  `location_city` VARCHAR(100),
  `location_state` VARCHAR(100),
  `address` VARCHAR(255),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `plate` VARCHAR(10),
  `make` VARCHAR(50),
  `model` VARCHAR(50),
  `version` VARCHAR(100),
  `year` INT,
  `model_year` INT,
  `mileage` INT,
  `color` VARCHAR(30),
  `fuel_type` VARCHAR(30),
  `transmission_type` VARCHAR(30),
  `body_type` VARCHAR(50),
  `vin` VARCHAR(17),
  `renavam` VARCHAR(11),
  `engine_power` VARCHAR(50),
  `number_of_doors` INT,
  `vehicle_options` VARCHAR(500),
  `detran_status` VARCHAR(100),
  `debts` VARCHAR(500),
  `running_condition` VARCHAR(100),
  `body_condition` VARCHAR(100),
  `tires_condition` VARCHAR(100),
  `has_key` BOOLEAN,
  `property_registration_number` VARCHAR(50),
  `iptu_number` VARCHAR(50),
  `is_occupied` BOOLEAN,
  `total_area` DECIMAL(10, 2),
  `built_area` DECIMAL(10, 2),
  `bedrooms` INT,
  `suites` INT,
  `bathrooms` INT,
  `parking_spaces` INT,
  `construction_type` VARCHAR(100),
  `finishes` VARCHAR(500),
  `infrastructure` VARCHAR(500),
  `condo_details` VARCHAR(500),
  `improvements` VARCHAR(500),
  `topography` VARCHAR(100),
  `liens_and_encumbrances` VARCHAR(1000),
  `property_debts` VARCHAR(500),
  `unregistered_records` VARCHAR(500),
  `has_habite_se` BOOLEAN,
  `zoning_restrictions` VARCHAR(200),
  `amenities` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`)
);

CREATE TABLE IF NOT EXISTS `lots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `public_id` VARCHAR(50) UNIQUE,
  `auction_id` INT NOT NULL,
  `number` VARCHAR(20),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2) NOT NULL,
  `initial_price` DECIMAL(15, 2),
  `second_initial_price` DECIMAL(15, 2),
  `bid_increment_step` DECIMAL(15, 2),
  `status` VARCHAR(50) NOT NULL,
  `bids_count` INT DEFAULT 0,
  `views` INT DEFAULT 0,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `is_exclusive` BOOLEAN DEFAULT FALSE,
  `discount_percentage` DECIMAL(5, 2),
  `additional_triggers` JSON,
  `image_url` VARCHAR(2048),
  `image_media_id` VARCHAR(255),
  `gallery_image_urls` JSON,
  `media_item_ids` JSON,
  `bem_ids` JSON,
  `type` VARCHAR(100),
  `category_id` INT,
  `subcategory_id` INT,
  `city_id` INT,
  `state_id` INT,
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `map_address` VARCHAR(255),
  `map_embed_url` VARCHAR(2048),
  `map_static_image_url` VARCHAR(2048),
  `end_date` DATETIME,
  `condition` VARCHAR(100),
  `data_ai_hint` VARCHAR(100),
  `winner_id` INT,
  `winning_bid_term_url` VARCHAR(2048),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `lot_bens` (
    `lot_id` INT NOT NULL,
    `bem_id` INT NOT NULL,
    PRIMARY KEY (`lot_id`, `bem_id`),
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bem_id`) REFERENCES `bens`(`id`) ON DELETE CASCADE
);

-- =================================================================
-- TABELAS DE TRANSAÇÕES E INTERAÇÕES
-- =================================================================

CREATE TABLE IF NOT EXISTS `bids` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lot_id` INT NOT NULL,
  `auction_id` INT NOT NULL,
  `bidder_id` INT NOT NULL,
  `bidder_display` VARCHAR(255),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bidder_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lot_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `winning_bid_amount` DECIMAL(15, 2) NOT NULL,
  `win_date` DATETIME NOT NULL,
  `payment_status` VARCHAR(50),
  `invoice_url` VARCHAR(2048),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `lot_id` INT NOT NULL,
  `max_amount` DECIMAL(15, 2) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (`user_id`, `lot_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`)
);


-- =================================================================
-- TABELAS DE CONTEÚDO E SUPORTE
-- =================================================================

CREATE TABLE IF NOT EXISTS `media_items` (
  `id` VARCHAR(255) PRIMARY KEY,
  `file_name` VARCHAR(255) NOT NULL,
  `storage_path` VARCHAR(2048) NOT NULL,
  `title` VARCHAR(255),
  `alt_text` VARCHAR(255),
  `caption` VARCHAR(500),
  `description` TEXT,
  `mime_type` VARCHAR(100),
  `size_bytes` INT,
  `url_original` VARCHAR(2048),
  `url_thumbnail` VARCHAR(2048),
  `url_medium` VARCHAR(2048),
  `url_large` VARCHAR(2048),
  `linked_lot_ids` JSON,
  `data_ai_hint` VARCHAR(50),
  `uploaded_by` VARCHAR(255),
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255),
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
