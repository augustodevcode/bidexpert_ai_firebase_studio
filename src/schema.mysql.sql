-- BidExpert MySQL Schema
-- =================================================================
-- Ordem de criação de tabelas otimizada para resolver dependências.
-- =================================================================

-- Nível 1: Tabelas Independentes
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
  `name_normalized` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `permissions` JSON,
  `created_at` DATETIME,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `states` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `uf` VARCHAR(2) NOT NULL,
  `slug` VARCHAR(100) UNIQUE,
  `city_count` INT DEFAULT 0,
  `created_at` DATETIME,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) UNIQUE,
  `description` TEXT,
  `has_subcategories` BOOLEAN,
  `item_count` INT DEFAULT 0,
  `logo_url` VARCHAR(255),
  `cover_image_url` VARCHAR(255),
  `mega_menu_image_url` VARCHAR(255),
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
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
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


-- Nível 2: Primeira dependência
CREATE TABLE IF NOT EXISTS `cities` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `state_id` VARCHAR(100) NOT NULL,
  `state_uf` VARCHAR(2) NOT NULL,
  `ibge_code` VARCHAR(10),
  `lot_count` INT DEFAULT 0,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `parent_category_id` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `item_count` INT DEFAULT 0,
  `display_order` INT DEFAULT 0,
  `icon_url` VARCHAR(255),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`parent_category_id`) REFERENCES `lot_categories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `courts` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `state_uf` VARCHAR(2),
  `website` VARCHAR(255),
  `created_at` DATETIME,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `court_id` VARCHAR(100),
  `state_id` VARCHAR(100),
  `zip_code` VARCHAR(10),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nível 3: Segunda dependência
CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `district_id` VARCHAR(100),
  `contact_name` VARCHAR(150),
  `phone` VARCHAR(20),
  `email` VARCHAR(150),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `uid` VARCHAR(100) UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255),
  `full_name` VARCHAR(150),
  `role_id` VARCHAR(100),
  `seller_id` VARCHAR(100),
  `habilitation_status` VARCHAR(50),
  `account_type` VARCHAR(50),
  `badges` JSON,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nível 4: Terceira dependência
CREATE TABLE IF NOT EXISTS `sellers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
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
  `logo_media_id` VARCHAR(100),
  `data_ai_hint_logo` VARCHAR(100),
  `description` TEXT,
  `user_id` VARCHAR(100),
  `member_since` DATETIME,
  `rating` DECIMAL(3, 2),
  `active_lots_count` INT DEFAULT 0,
  `total_sales_value` DECIMAL(15, 2),
  `auctions_facilitated_count` INT DEFAULT 0,
  `is_judicial` BOOLEAN DEFAULT FALSE,
  `judicial_branch_id` VARCHAR(100),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`judicial_branch_id`) REFERENCES `judicial_branches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(150) UNIQUE,
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
  `logo_media_id` VARCHAR(100),
  `data_ai_hint_logo` VARCHAR(100),
  `description` TEXT,
  `user_id` VARCHAR(100),
  `member_since` DATETIME,
  `rating` DECIMAL(3, 2),
  `auctions_conducted_count` INT DEFAULT 0,
  `total_value_sold` DECIMAL(15, 2),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_items` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `file_name` VARCHAR(255) NOT NULL,
  `storage_path` VARCHAR(255) NOT NULL,
  `title` VARCHAR(200),
  `alt_text` VARCHAR(200),
  `caption` VARCHAR(500),
  `description` TEXT,
  `mime_type` VARCHAR(100),
  `size_bytes` INT,
  `url_original` VARCHAR(255),
  `url_thumbnail` VARCHAR(255),
  `linked_lot_ids` JSON,
  `data_ai_hint` VARCHAR(100),
  `uploaded_by` VARCHAR(100),
  `uploaded_at` DATETIME,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 5: Quarta dependência
CREATE TABLE IF NOT EXISTS `judicial_processes` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `process_number` VARCHAR(100) NOT NULL,
  `is_electronic` BOOLEAN DEFAULT TRUE,
  `court_id` VARCHAR(100),
  `district_id` VARCHAR(100),
  `branch_id` VARCHAR(100),
  `seller_id` VARCHAR(100),
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
  `subcategory_id` VARCHAR(100),
  `judicial_process_id` VARCHAR(100),
  `seller_id` VARCHAR(100),
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
  `has_key` BOOLEAN,
  `is_occupied` BOOLEAN,
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `auctions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `slug` VARCHAR(200) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) NOT NULL,
  `auction_date` DATETIME,
  `end_date` DATETIME,
  `total_lots` INT DEFAULT 0,
  `category_id` VARCHAR(100),
  `auctioneer_id` VARCHAR(100),
  `seller_id` VARCHAR(100),
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(100),
  `documents_url` VARCHAR(255),
  `visits` INT DEFAULT 0,
  `is_favorite` BOOLEAN DEFAULT FALSE,
  `auction_type` VARCHAR(50),
  `auction_stages` JSON,
  `automatic_bidding_enabled` BOOLEAN DEFAULT FALSE,
  `allow_installment_bids` BOOLEAN DEFAULT FALSE,
  `soft_close_enabled` BOOLEAN DEFAULT FALSE,
  `soft_close_minutes` INT,
  `estimated_revenue` DECIMAL(15, 2),
  `achieved_revenue` DECIMAL(15, 2),
  `total_habilitated_users` INT,
  `is_featured_on_marketplace` BOOLEAN DEFAULT FALSE,
  `marketplace_announcement_title` VARCHAR(150),
  `judicial_process_id` VARCHAR(100),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`auctioneer_id`) REFERENCES `auctioneers`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `user_documents` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(100) NOT NULL,
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
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `offer_type` VARCHAR(50),
  `price` DECIMAL(15, 2),
  `status` VARCHAR(50),
  `category_id` VARCHAR(100),
  `seller_id` VARCHAR(100),
  `image_url` VARCHAR(255),
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Nível 6: Quinta dependência
CREATE TABLE IF NOT EXISTS `lots` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(100) UNIQUE,
  `auction_id` VARCHAR(100) NOT NULL,
  `number` VARCHAR(20),
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2) NOT NULL,
  `initial_price` DECIMAL(15, 2),
  `status` VARCHAR(50) NOT NULL,
  `bids_count` INT DEFAULT 0,
  `views` INT DEFAULT 0,
  `is_featured` BOOLEAN,
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(100),
  `category_id` VARCHAR(100),
  `subcategory_id` VARCHAR(100),
  `city_id` VARCHAR(100),
  `state_id` VARCHAR(100),
  `end_date` DATETIME,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`),
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`),
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nível 7: Sexta dependência
CREATE TABLE IF NOT EXISTS `lot_bens` (
    `lot_id` VARCHAR(100) NOT NULL,
    `bem_id` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`lot_id`, `bem_id`),
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bem_id`) REFERENCES `bens`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bids` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lot_id` VARCHAR(100) NOT NULL,
  `auction_id` VARCHAR(100),
  `bidder_id` VARCHAR(100) NOT NULL,
  `bidder_display` VARCHAR(150),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` DATETIME,
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`),
  FOREIGN KEY (`bidder_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `lot_id` VARCHAR(100) NOT NULL,
  `user_id` VARCHAR(100) NOT NULL,
  `winning_bid_amount` DECIMAL(15, 2) NOT NULL,
  `win_date` DATETIME,
  `payment_status` VARCHAR(50),
  `invoice_url` VARCHAR(255),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
    `id` VARCHAR(100) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(100) NOT NULL,
    `lot_id` VARCHAR(100) NOT NULL,
    `max_amount` DECIMAL(15, 2) NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME,
    UNIQUE KEY `user_lot_unique` (`user_id`, `lot_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_reviews` (
    `id` VARCHAR(100) NOT NULL PRIMARY KEY,
    `lot_id` VARCHAR(100) NOT NULL,
    `user_id` VARCHAR(100) NOT NULL,
    `user_display_name` VARCHAR(150),
    `rating` INT,
    `comment` TEXT,
    `created_at` DATETIME,
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lot_questions` (
    `id` VARCHAR(100) NOT NULL PRIMARY KEY,
    `lot_id` VARCHAR(100) NOT NULL,
    `user_id` VARCHAR(100) NOT NULL,
    `user_display_name` VARCHAR(150),
    `question_text` TEXT,
    `answer_text` TEXT,
    `answered_by_user_id` VARCHAR(100),
    `is_public` BOOLEAN,
    `answered_at` DATETIME,
    `created_at` DATETIME,
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
    `id` VARCHAR(100) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(100) NOT NULL,
    `message` TEXT,
    `link` VARCHAR(255),
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
