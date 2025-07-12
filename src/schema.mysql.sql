-- BidExpert MySQL Schema
-- Updated: 2025-07-12

-- This script is designed to be idempotent and can be run multiple times.

-- Nível 1: Independentes
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `site_title` VARCHAR(100),
  `site_tagline` VARCHAR(200),
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
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `name_normalized` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `permissions` JSON,
  `created_at` DATETIME,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `states` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `uf` VARCHAR(2) NOT NULL,
  `slug` VARCHAR(100),
  `city_count` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `description` TEXT,
  `item_count` INT DEFAULT 0,
  `has_subcategories` BOOLEAN DEFAULT FALSE,
  `logo_url` VARCHAR(255),
  `logo_media_id` VARCHAR(100),
  `data_ai_hint_logo` VARCHAR(100),
  `cover_image_url` VARCHAR(255),
  `cover_image_media_id` VARCHAR(100),
  `data_ai_hint_cover` VARCHAR(100),
  `mega_menu_image_url` VARCHAR(255),
  `mega_menu_image_media_id` VARCHAR(100),
  `data_ai_hint_mega_menu` VARCHAR(100),
  `created_at` DATETIME,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_templates` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` VARCHAR(50),
  `content` TEXT,
  `created_at` DATETIME,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(255),
  `message` TEXT,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_types` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `is_required` BOOLEAN DEFAULT TRUE,
  `applies_to` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `courts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `state_uf` VARCHAR(2),
  `website` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 2: Primeira dependência
CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `state_id` VARCHAR(100),
  `ibge_code` VARCHAR(20),
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `parent_category_id` VARCHAR(100),
  `description` TEXT,
  `display_order` INT DEFAULT 0,
  `icon_url` VARCHAR(255),
  `icon_media_id` VARCHAR(100),
  `data_ai_hint_icon` VARCHAR(100),
  FOREIGN KEY (`parent_category_id`) REFERENCES `lot_categories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `court_id` INT,
  `state_id` VARCHAR(100),
  `zip_code` VARCHAR(10),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 3: Segunda dependência
CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `district_id` INT,
  `contact_name` VARCHAR(150),
  `phone` VARCHAR(20),
  `email` VARCHAR(150),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `uid` VARCHAR(100) UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255),
  `full_name` VARCHAR(150),
  `cpf` VARCHAR(20) UNIQUE,
  `cell_phone` VARCHAR(20),
  `razao_social` VARCHAR(200),
  `cnpj` VARCHAR(20) UNIQUE,
  `date_of_birth` DATE,
  `zip_code` VARCHAR(10),
  `street` VARCHAR(255),
  `number` VARCHAR(20),
  `complement` VARCHAR(100),
  `neighborhood` VARCHAR(100),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `avatar_url` VARCHAR(255),
  `data_ai_hint` VARCHAR(100),
  `role_id` VARCHAR(100),
  `habilitation_status` VARCHAR(50),
  `account_type` VARCHAR(50),
  `badges` JSON,
  `opt_in_marketing` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 4: Terceira dependência
CREATE TABLE IF NOT EXISTS `sellers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150),
  `name` VARCHAR(150) NOT NULL,
  `contact_name` VARCHAR(150),
  `email` VARCHAR(150),
  `phone` VARCHAR(20),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zip_code` VARCHAR(10),
  `website` VARCHAR(255),
  `logo_url` VARCHAR(255),
  `data_ai_hint_logo` VARCHAR(100),
  `description` TEXT,
  `is_judicial` BOOLEAN DEFAULT FALSE,
  `judicial_branch_id` INT,
  `user_id` INT,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`judicial_branch_id`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150),
  `name` VARCHAR(150) NOT NULL,
  `registration_number` VARCHAR(50),
  `contact_name` VARCHAR(150),
  `email` VARCHAR(150),
  `phone` VARCHAR(20),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zip_code` VARCHAR(10),
  `website` VARCHAR(255),
  `logo_url` VARCHAR(255),
  `data_ai_hint_logo` VARCHAR(100),
  `description` TEXT,
  `user_id` INT,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_items` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `file_name` VARCHAR(255) NOT NULL,
  `storage_path` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255),
  `alt_text` VARCHAR(255),
  `caption` TEXT,
  `description` TEXT,
  `mime_type` VARCHAR(100),
  `size_bytes` INT,
  `url_original` VARCHAR(255),
  `url_thumbnail` VARCHAR(255),
  `url_medium` VARCHAR(255),
  `url_large` VARCHAR(255),
  `linked_lot_ids` JSON,
  `data_ai_hint` VARCHAR(100),
  `uploaded_by` INT,
  `uploaded_at` DATETIME,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 5: Quarta dependência
CREATE TABLE IF NOT EXISTS `judicial_processes` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `process_number` VARCHAR(100) NOT NULL,
  `is_electronic` BOOLEAN DEFAULT TRUE,
  `court_id` INT,
  `district_id` INT,
  `branch_id` INT,
  `seller_id` INT,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`),
  FOREIGN KEY (`branch_id`) REFERENCES `judicial_branches`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_parties` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `process_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `document_number` VARCHAR(50),
  `party_type` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bens` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT 'DISPONIVEL',
  `category_id` VARCHAR(100),
  `subcategory_id` INT,
  `judicial_process_id` VARCHAR(100),
  `seller_id` INT,
  `evaluation_value` DECIMAL(15, 2),
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(100),
  `gallery_image_urls` JSON,
  `media_item_ids` JSON,
  `amenities` JSON,
  `data_ai_hint` VARCHAR(100),
  `location_city` VARCHAR(100),
  `location_state` VARCHAR(100),
  `address` VARCHAR(255),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auctions` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(200),
  `description` TEXT,
  `status` VARCHAR(50),
  `auction_date` DATETIME,
  `end_date` DATETIME,
  `auction_type` VARCHAR(50),
  `category_id` VARCHAR(100),
  `auctioneer_id` INT,
  `seller_id` INT,
  `visits` INT DEFAULT 0,
  `total_lots` INT DEFAULT 0,
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(100),
  `data_ai_hint` VARCHAR(100),
  `is_featured_on_marketplace` BOOLEAN DEFAULT FALSE,
  `marketplace_announcement_title` VARCHAR(150),
  `automatic_bidding_enabled` BOOLEAN DEFAULT FALSE,
  `allow_installment_bids` BOOLEAN DEFAULT FALSE,
  `soft_close_enabled` BOOLEAN DEFAULT FALSE,
  `soft_close_minutes` INT,
  `auction_stages` JSON,
  `judicial_process_id` VARCHAR(100),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`auctioneer_id`) REFERENCES `auctioneers`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_documents` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `user_id` INT NOT NULL,
  `document_type_id` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `file_url` VARCHAR(255) NOT NULL,
  `file_name` VARCHAR(255),
  `rejection_reason` TEXT,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`document_type_id`) REFERENCES `document_types`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `direct_sale_offers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2),
  `status` VARCHAR(50),
  `seller_id` INT,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nível 6: Quinta dependência
CREATE TABLE IF NOT EXISTS `lots` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `auction_id` INT,
  `number` VARCHAR(20),
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2),
  `initial_price` DECIMAL(15, 2),
  `status` VARCHAR(50),
  `bids_count` INT DEFAULT 0,
  `views` INT DEFAULT 0,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(100),
  `category_id` VARCHAR(100),
  `subcategory_id` INT,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 7: Sexta dependência
CREATE TABLE IF NOT EXISTS `lot_bens` (
    `lot_id` INT NOT NULL,
    `bem_id` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`lot_id`, `bem_id`),
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bem_id`) REFERENCES `bens`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_reviews` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lot_id` INT,
  `auction_id` INT,
  `user_id` INT,
  `user_display_name` VARCHAR(150),
  `rating` INT,
  `comment` TEXT,
  `created_at` DATETIME,
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_questions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lot_id` INT,
  `auction_id` INT,
  `user_id` INT,
  `user_display_name` VARCHAR(150),
  `question_text` TEXT,
  `answer_text` TEXT,
  `answered_by_user_id` INT,
  `answered_by_user_display_name` VARCHAR(150),
  `is_public` BOOLEAN,
  `created_at` DATETIME,
  `answered_at` DATETIME,
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`answered_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `user_id` INT NOT NULL,
  `message` TEXT,
  `link` VARCHAR(255),
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bids` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `lot_id` INT NOT NULL,
  `auction_id` INT NOT NULL,
  `bidder_id` INT NOT NULL,
  `bidder_display` VARCHAR(150),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` DATETIME,
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`),
  FOREIGN KEY (`bidder_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `lot_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `winning_bid_amount` DECIMAL(15, 2) NOT NULL,
  `win_date` DATETIME,
  `payment_status` VARCHAR(50),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `lot_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `max_amount` DECIMAL(15, 2) NOT NULL,
  `is_active` BOOLEAN,
  `created_at` DATETIME,
  UNIQUE (`user_id`, `lot_id`),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
