-- Arquivo: src/schema.mysql.sql
-- Descrição: Schema completo para o banco de dados MySQL do BidExpert.

-- ============================================================================
-- NÍVEL 1: Tabelas Independentes (sem chaves estrangeiras para outras tabelas da app)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `site_title` VARCHAR(100),
  `site_tagline` VARCHAR(200),
  `gallery_image_base_path` VARCHAR(255),
  `storage_provider` VARCHAR(50),
  `firebase_storage_bucket` VARCHAR(200),
  `active_theme_name` VARCHAR(100),
  `themes` JSON,
  `platform_public_id_masks` JSON,
  `homepage_sections` JSON,
  `mental_trigger_settings` JSON,
  `section_badge_visibility` JSON,
  `map_settings` JSON,
  `bidding_settings` JSON,
  `search_pagination_type` VARCHAR(50),
  `search_items_per_page` INT,
  `search_load_more_count` INT,
  `show_countdown_on_lot_detail` BOOLEAN,
  `show_countdown_on_cards` BOOLEAN,
  `show_related_lots_on_lot_detail` BOOLEAN,
  `related_lots_count` INT,
  `default_urgency_timer_hours` INT,
  `variable_increment_table` JSON,
  `default_list_items_per_page` INT,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `name_normalized` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(500),
  `permissions` JSON,
  `created_at` DATETIME,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `states` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `uf` VARCHAR(2) NOT NULL UNIQUE,
  `slug` VARCHAR(100) UNIQUE,
  `created_at` DATETIME,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) UNIQUE,
  `description` VARCHAR(500),
  `has_subcategories` BOOLEAN DEFAULT FALSE,
  `logo_url` VARCHAR(255),
  `data_ai_hint_logo` VARCHAR(50),
  `cover_image_url` VARCHAR(255),
  `data_ai_hint_cover` VARCHAR(50),
  `mega_menu_image_url` VARCHAR(255),
  `data_ai_hint_mega_menu` VARCHAR(50),
  `created_at` DATETIME,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_templates` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `content` TEXT,
  `created_at` DATETIME,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(200),
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_types` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255),
  `is_required` BOOLEAN DEFAULT TRUE,
  `applies_to` VARCHAR(50) -- e.g., 'PHYSICAL', 'LEGAL', 'ALL'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NÍVEL 2: Dependem apenas do Nível 1
-- ============================================================================

CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `state_id` INT NOT NULL,
  `ibge_code` VARCHAR(7),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100),
  `parent_category_id` INT NOT NULL,
  `description` VARCHAR(500),
  `display_order` INT DEFAULT 0,
  `icon_url` VARCHAR(255),
  `icon_media_id` VARCHAR(100),
  `data_ai_hint_icon` VARCHAR(50),
  FOREIGN KEY (`parent_category_id`) REFERENCES `lot_categories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `courts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `state_uf` VARCHAR(2) NOT NULL,
  `website` VARCHAR(255),
  `created_at` DATETIME,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `court_id` INT,
  `state_id` INT,
  `zip_code` VARCHAR(10),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NÍVEL 3: Dependem dos Níveis 1 e 2
-- ============================================================================

CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `district_id` INT NOT NULL,
  `contact_name` VARCHAR(150),
  `phone` VARCHAR(20),
  `email` VARCHAR(100),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `uid` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `cpf` VARCHAR(20),
  `cell_phone` VARCHAR(20),
  `razao_social` VARCHAR(200),
  `cnpj` VARCHAR(20),
  `date_of_birth` DATE,
  `zip_code` VARCHAR(10),
  `street` VARCHAR(200),
  `number` VARCHAR(20),
  `complement` VARCHAR(100),
  `neighborhood` VARCHAR(100),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `avatar_url` VARCHAR(255),
  `role_id` INT,
  `seller_id` INT,
  `habilitation_status` VARCHAR(50) DEFAULT 'PENDING_DOCUMENTS',
  `account_type` VARCHAR(50) DEFAULT 'PHYSICAL',
  `badges` JSON,
  `opt_in_marketing` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NÍVEL 4: Dependem dos Níveis 1, 2 e 3
-- ============================================================================

CREATE TABLE IF NOT EXISTS `sellers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `contact_name` VARCHAR(150),
  `email` VARCHAR(150),
  `phone` VARCHAR(20),
  `address` VARCHAR(200),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zip_code` VARCHAR(10),
  `website` VARCHAR(255),
  `logo_url` VARCHAR(255),
  `data_ai_hint_logo` VARCHAR(50),
  `description` TEXT,
  `user_id` INT,
  `is_judicial` BOOLEAN DEFAULT FALSE,
  `judicial_branch_id` INT,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`judicial_branch_id`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `registration_number` VARCHAR(50),
  `contact_name` VARCHAR(150),
  `email` VARCHAR(150),
  `phone` VARCHAR(20),
  `address` VARCHAR(200),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zip_code` VARCHAR(10),
  `website` VARCHAR(255),
  `logo_url` VARCHAR(255),
  `data_ai_hint_logo` VARCHAR(50),
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
  `title` VARCHAR(200),
  `alt_text` VARCHAR(200),
  `caption` VARCHAR(500),
  `description` TEXT,
  `mime_type` VARCHAR(50),
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


-- ============================================================================
-- NÍVEL 5: Dependem dos Níveis 1-4
-- ============================================================================

CREATE TABLE IF NOT EXISTS `judicial_processes` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
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
  `process_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `document_number` VARCHAR(50),
  `party_type` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bens` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT 'DISPONIVEL',
  `category_id` INT,
  `subcategory_id` INT,
  `judicial_process_id` INT,
  `seller_id` INT,
  `evaluation_value` DECIMAL(15, 2),
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(100),
  `gallery_image_urls` JSON,
  `media_item_ids` JSON,
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
  `description` TEXT,
  `status` VARCHAR(50) DEFAULT 'RASCUNHO',
  `auction_date` DATETIME,
  `end_date` DATETIME,
  `category_id` INT,
  `auctioneer_id` INT,
  `seller_id` INT,
  `map_address` VARCHAR(300),
  `image_url` VARCHAR(255),
  `documents_url` VARCHAR(255),
  `automatic_bidding_enabled` BOOLEAN DEFAULT FALSE,
  `allow_installment_bids` BOOLEAN DEFAULT FALSE,
  `soft_close_enabled` BOOLEAN DEFAULT FALSE,
  `soft_close_minutes` INT,
  `estimated_revenue` DECIMAL(15, 2),
  `achieved_revenue` DECIMAL(15, 2),
  `total_habilitated_users` INT,
  `is_featured_on_marketplace` BOOLEAN DEFAULT FALSE,
  `marketplace_announcement_title` VARCHAR(150),
  `auction_stages` JSON,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`auctioneer_id`) REFERENCES `auctioneers`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`)
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
  `offer_type` VARCHAR(50) NOT NULL,
  `price` DECIMAL(15, 2),
  `minimum_offer_price` DECIMAL(15, 2),
  `status` VARCHAR(50) NOT NULL,
  `category_id` INT,
  `seller_id` INT,
  `location_city_id` INT,
  `location_state_id` INT,
  `image_url` VARCHAR(255),
  `gallery_image_urls` JSON,
  `expires_at` DATETIME,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NÍVEL 6: Dependem dos Níveis 1-5
-- ============================================================================

CREATE TABLE IF NOT EXISTS `lots` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `auction_id` INT NOT NULL,
  `number` VARCHAR(20),
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2) NOT NULL,
  `initial_price` DECIMAL(15, 2),
  `second_initial_price` DECIMAL(15, 2),
  `bid_increment_step` DECIMAL(15, 2),
  `status` VARCHAR(50) NOT NULL DEFAULT 'EM_BREVE',
  `views` INT DEFAULT 0,
  `bids_count` INT DEFAULT 0,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `is_exclusive` BOOLEAN DEFAULT FALSE,
  `discount_percentage` INT,
  `additional_triggers` JSON,
  `image_url` VARCHAR(255),
  `gallery_image_urls` JSON,
  `category_id` INT,
  `subcategory_id` INT,
  `seller_id` INT,
  `city_id` INT,
  `state_id` INT,
  `end_date` DATETIME,
  `winner_id` INT,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`),
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`),
  FOREIGN KEY (`winner_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- NÍVEL 7: Dependem dos Níveis 1-6
-- ============================================================================

CREATE TABLE IF NOT EXISTS `lot_bens` (
  `lot_id` INT NOT NULL,
  `bem_id` INT NOT NULL,
  PRIMARY KEY (`lot_id`, `bem_id`),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bem_id`) REFERENCES `bens`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lot_id` INT NOT NULL,
  `auction_id` INT NOT NULL,
  `bidder_id` INT NOT NULL,
  `bidder_display` VARCHAR(150),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` DATETIME,
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bidder_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lot_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `winning_bid_amount` DECIMAL(15, 2),
  `win_date` DATETIME,
  `payment_status` VARCHAR(50),
  `invoice_url` VARCHAR(255),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `user_id` INT NOT NULL,
  `lot_id` INT NOT NULL,
  `max_amount` DECIMAL(15, 2) NOT NULL,
  `is_active` BOOLEAN,
  `created_at` DATETIME,
  UNIQUE (`user_id`, `lot_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_reviews` (
    `id` VARCHAR(100) NOT NULL PRIMARY KEY,
    `lot_id` INT NOT NULL,
    `auction_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `user_display_name` VARCHAR(150),
    `rating` INT NOT NULL,
    `comment` TEXT,
    `created_at` DATETIME,
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_questions` (
    `id` VARCHAR(100) NOT NULL PRIMARY KEY,
    `lot_id` INT NOT NULL,
    `auction_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `user_display_name` VARCHAR(150),
    `question_text` TEXT NOT NULL,
    `is_public` BOOLEAN DEFAULT TRUE,
    `answer_text` TEXT,
    `answered_by_user_id` INT,
    `answered_by_user_display_name` VARCHAR(150),
    `answered_at` DATETIME,
    `created_at` DATETIME,
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`answered_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
    `id` VARCHAR(100) NOT NULL PRIMARY KEY,
    `user_id` INT NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `link` VARCHAR(255),
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
