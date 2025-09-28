-- Schema for BidExpert using MySQL

CREATE TABLE IF NOT EXISTS `states` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `uf` VARCHAR(2) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `city_count` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `cities` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `state_id` VARCHAR(36) NOT NULL,
  `state_uf` VARCHAR(2) NOT NULL,
  `ibge_code` VARCHAR(7) NULL,
  `lot_count` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
);

CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `name_normalized` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `permissions` JSON NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `users` (
  `uid` VARCHAR(128) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `cpf` VARCHAR(20) NULL,
  `cell_phone` VARCHAR(20) NULL,
  `razao_social` VARCHAR(255) NULL,
  `cnpj` VARCHAR(25) NULL,
  `date_of_birth` DATE NULL,
  `zip_code` VARCHAR(10) NULL,
  `street` VARCHAR(255) NULL,
  `number` VARCHAR(20) NULL,
  `complement` VARCHAR(100) NULL,
  `neighborhood` VARCHAR(100) NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(50) NULL,
  `avatar_url` VARCHAR(512) NULL,
  `role_id` VARCHAR(36) NULL,
  `seller_id` VARCHAR(36) NULL,
  `habilitation_status` VARCHAR(50) DEFAULT 'PENDING_DOCUMENTS',
  `account_type` VARCHAR(50) DEFAULT 'PHYSICAL',
  `opt_in_marketing` BOOLEAN DEFAULT FALSE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
);

CREATE TABLE IF NOT EXISTS `sellers` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(50) NOT NULL UNIQUE,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `contact_name` VARCHAR(150) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `address` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(50) NULL,
  `zip_code` VARCHAR(10) NULL,
  `website` VARCHAR(255) NULL,
  `logo_url` VARCHAR(512) NULL,
  `logo_media_id` VARCHAR(36) NULL,
  `description` TEXT NULL,
  `user_id` VARCHAR(128) NULL,
  `is_judicial` BOOLEAN DEFAULT FALSE,
  `judicial_branch_id` VARCHAR(36) NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(50) NOT NULL UNIQUE,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `registration_number` VARCHAR(50) NULL,
  `contact_name` VARCHAR(150) NULL,
  `email` VARCHAR(255) NULL,
  `phone` VARCHAR(20) NULL,
  `address` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(50) NULL,
  `zip_code` VARCHAR(10) NULL,
  `website` VARCHAR(255) NULL,
  `logo_url` VARCHAR(512) NULL,
  `logo_media_id` VARCHAR(36) NULL,
  `description` TEXT NULL,
  `user_id` VARCHAR(128) NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(500) NULL,
  `item_count` INT DEFAULT 0,
  `has_subcategories` BOOLEAN DEFAULT FALSE,
  `logo_url` VARCHAR(512) NULL,
  `cover_image_url` VARCHAR(512) NULL,
  `mega_menu_image_url` VARCHAR(512) NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `parent_category_id` VARCHAR(36) NOT NULL,
  `description` VARCHAR(500) NULL,
  `display_order` INT DEFAULT 0,
  `icon_url` VARCHAR(512) NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`parent_category_id`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `courts` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `state_uf` VARCHAR(2) NOT NULL,
    `website` VARCHAR(255),
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `judicial_districts` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `court_id` VARCHAR(36) NOT NULL,
    `state_id` VARCHAR(36) NOT NULL,
    `state_uf` VARCHAR(2) NOT NULL,
    `zip_code` VARCHAR(10),
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`),
    FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
);

CREATE TABLE IF NOT EXISTS `judicial_branches` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `district_id` VARCHAR(36) NOT NULL,
    `contact_name` VARCHAR(150),
    `phone` VARCHAR(20),
    `email` VARCHAR(255),
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`)
);

CREATE TABLE IF NOT EXISTS `judicial_processes` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `public_id` VARCHAR(50) NOT NULL UNIQUE,
    `process_number` VARCHAR(100) NOT NULL,
    `is_electronic` BOOLEAN DEFAULT TRUE,
    `court_id` VARCHAR(36) NOT NULL,
    `district_id` VARCHAR(36) NOT NULL,
    `branch_id` VARCHAR(36) NOT NULL,
    `seller_id` VARCHAR(36) NULL,
    `parties` JSON NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`),
    FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`),
    FOREIGN KEY (`branch_id`) REFERENCES `judicial_branches`(`id`),
    FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `bens` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `public_id` VARCHAR(50) NOT NULL UNIQUE,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `status` VARCHAR(50) DEFAULT 'DISPONIVEL',
    `category_id` VARCHAR(36),
    `subcategory_id` VARCHAR(36),
    `judicial_process_id` VARCHAR(36),
    `seller_id` VARCHAR(36),
    `evaluation_value` DECIMAL(15, 2),
    `image_url` VARCHAR(512),
    `location_city` VARCHAR(100),
    `location_state` VARCHAR(100),
    `address` VARCHAR(255),
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
    FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`),
    FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`),
    FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`)
);

CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `site_title` VARCHAR(100),
  `site_tagline` VARCHAR(200),
  `gallery_image_base_path` VARCHAR(200),
  `storage_provider` VARCHAR(50),
  `firebase_storage_bucket` VARCHAR(200),
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
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `auctions` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `public_id` VARCHAR(50) NOT NULL UNIQUE,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` VARCHAR(50) DEFAULT 'RASCUNHO',
    `auction_type` VARCHAR(50),
    `category_id` VARCHAR(36),
    `auctioneer_id` VARCHAR(36),
    `seller_id` VARCHAR(36),
    `auction_date` TIMESTAMP NOT NULL,
    `end_date` TIMESTAMP,
    `city` VARCHAR(100),
    `state` VARCHAR(100),
    `image_url` VARCHAR(512),
    `image_media_id` VARCHAR(36),
    `documents_url` VARCHAR(512),
    `visits` INT DEFAULT 0,
    `initial_offer` DECIMAL(15, 2),
    `auction_stages` JSON,
    `automatic_bidding_enabled` BOOLEAN DEFAULT FALSE,
    `allow_installment_bids` BOOLEAN DEFAULT FALSE,
    `soft_close_enabled` BOOLEAN DEFAULT FALSE,
    `soft_close_minutes` INT,
    `is_featured_on_marketplace` BOOLEAN DEFAULT FALSE,
    `marketplace_announcement_title` VARCHAR(255),
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
    FOREIGN KEY (`auctioneer_id`) REFERENCES `auctioneers`(`id`),
    FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`)
);

CREATE TABLE IF NOT EXISTS `lots` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `public_id` VARCHAR(50) NOT NULL UNIQUE,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `auction_id` VARCHAR(36) NOT NULL,
    `number` VARCHAR(20),
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` VARCHAR(50) DEFAULT 'EM_BREVE',
    `price` DECIMAL(15, 2) NOT NULL,
    `initial_price` DECIMAL(15, 2),
    `second_initial_price` DECIMAL(15, 2),
    `bid_increment_step` DECIMAL(15, 2),
    `category_id` VARCHAR(36),
    `subcategory_id` VARCHAR(36),
    `image_url` VARCHAR(512),
    `image_media_id` VARCHAR(36),
    `city_id` VARCHAR(36),
    `state_id` VARCHAR(36),
    `bids_count` INT DEFAULT 0,
    `views` INT DEFAULT 0,
    `is_featured` BOOLEAN DEFAULT FALSE,
    `is_exclusive` BOOLEAN DEFAULT FALSE,
    `discount_percentage` INT,
    `end_date` TIMESTAMP,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
    FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`),
    FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`),
    FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
);

CREATE TABLE IF NOT EXISTS `lot_bens` (
    `lot_id` VARCHAR(36) NOT NULL,
    `bem_id` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`lot_id`, `bem_id`),
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bem_id`) REFERENCES `bens`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `bids` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `lot_id` VARCHAR(36) NOT NULL,
    `auction_id` VARCHAR(36) NOT NULL,
    `bidder_id` VARCHAR(128) NOT NULL,
    `bidder_display` VARCHAR(150) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
    FOREIGN KEY (`bidder_id`) REFERENCES `users`(`uid