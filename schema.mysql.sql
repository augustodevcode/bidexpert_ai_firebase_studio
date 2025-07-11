-- BidExpert - MySQL Schema
-- version 1.1

-- Tabela de Configurações da Plataforma
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `site_title` VARCHAR(255),
  `site_tagline` VARCHAR(255),
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
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Perfis de Usuário (Roles)
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `name_normalized` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `permissions` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `uid` VARCHAR(255) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255),
  `full_name` VARCHAR(255),
  `cpf` VARCHAR(20),
  `cell_phone` VARCHAR(20),
  `razao_social` VARCHAR(255),
  `cnpj` VARCHAR(20),
  `date_of_birth` DATE,
  `zip_code` VARCHAR(10),
  `street` VARCHAR(255),
  `number` VARCHAR(20),
  `complement` VARCHAR(100),
  `neighborhood` VARCHAR(100),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `avatar_url` VARCHAR(2048),
  `data_ai_hint` VARCHAR(100),
  `role_id` VARCHAR(255),
  `seller_id` VARCHAR(255),
  `habilitation_status` VARCHAR(50),
  `account_type` VARCHAR(50),
  `badges` JSON,
  `opt_in_marketing` BOOLEAN DEFAULT FALSE,
  `rg_number` VARCHAR(50),
  `rg_issuer` VARCHAR(50),
  `rg_issue_date` DATE,
  `rg_state` VARCHAR(2),
  `home_phone` VARCHAR(20),
  `gender` VARCHAR(50),
  `profession` VARCHAR(100),
  `nationality` VARCHAR(100),
  `marital_status` VARCHAR(50),
  `property_regime` VARCHAR(100),
  `spouse_name` VARCHAR(255),
  `spouse_cpf` VARCHAR(20),
  `inscricao_estadual` VARCHAR(50),
  `website` VARCHAR(2048),
  `responsible_name` VARCHAR(255),
  `responsible_cpf` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tabela de Leiloeiros
CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(255) UNIQUE,
  `slug` VARCHAR(255) UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `registration_number` VARCHAR(100),
  `contact_name` VARCHAR(255),
  `email` VARCHAR(255),
  `phone` VARCHAR(20),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zip_code` VARCHAR(10),
  `website` VARCHAR(2048),
  `logo_url` VARCHAR(2048),
  `logo_media_id` VARCHAR(255),
  `data_ai_hint_logo` VARCHAR(100),
  `description` TEXT,
  `user_id` VARCHAR(255),
  `member_since` TIMESTAMP,
  `rating` DECIMAL(2, 1),
  `auctions_conducted_count` INT,
  `total_value_sold` DECIMAL(15, 2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tabela de Comitentes/Vendedores
CREATE TABLE IF NOT EXISTS `sellers` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(255) UNIQUE,
  `slug` VARCHAR(255) UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `contact_name` VARCHAR(255),
  `email` VARCHAR(255),
  `phone` VARCHAR(20),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zip_code` VARCHAR(10),
  `website` VARCHAR(2048),
  `logo_url` VARCHAR(2048),
  `logo_media_id` VARCHAR(255),
  `data_ai_hint_logo` VARCHAR(100),
  `description` TEXT,
  `user_id` VARCHAR(255),
  `member_since` TIMESTAMP,
  `rating` DECIMAL(2, 1),
  `active_lots_count` INT,
  `total_sales_value` DECIMAL(15, 2),
  `auctions_facilitated_count` INT,
  `is_judicial` BOOLEAN DEFAULT FALSE,
  `judicial_branch_id` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelas Judiciais
CREATE TABLE IF NOT EXISTS `courts` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE,
  `state_uf` VARCHAR(2) NOT NULL,
  `website` VARCHAR(2048),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE,
  `court_id` VARCHAR(255),
  `state_id` VARCHAR(255),
  `state_uf` VARCHAR(2),
  `zip_code` VARCHAR(10),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE,
  `district_id` VARCHAR(255),
  `contact_name` VARCHAR(255),
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_processes` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(255) UNIQUE,
  `process_number` VARCHAR(255) NOT NULL UNIQUE,
  `is_electronic` BOOLEAN DEFAULT TRUE,
  `court_id` VARCHAR(255),
  `district_id` VARCHAR(255),
  `branch_id` VARCHAR(255),
  `seller_id` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`branch_id`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `judicial_parties` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `process_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `document_number` VARCHAR(50),
  `party_type` VARCHAR(50) NOT NULL,
  FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Categorias de Lote
CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE,
  `description` TEXT,
  `has_subcategories` BOOLEAN DEFAULT FALSE,
  `logo_url` VARCHAR(2048),
  `logo_media_id` VARCHAR(255),
  `data_ai_hint_logo` VARCHAR(100),
  `cover_image_url` VARCHAR(2048),
  `cover_image_media_id` VARCHAR(255),
  `data_ai_hint_cover` VARCHAR(100),
  `mega_menu_image_url` VARCHAR(2048),
  `mega_menu_image_media_id` VARCHAR(255),
  `data_ai_hint_mega_menu` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Subcategorias
CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE,
  `parent_category_id` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `display_order` INT DEFAULT 0,
  `icon_url` VARCHAR(2048),
  `icon_media_id` VARCHAR(255),
  `data_ai_hint_icon` VARCHAR(100),
  FOREIGN KEY (`parent_category_id`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tabela de Bens
CREATE TABLE IF NOT EXISTS `bens` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(255) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50),
  `category_id` VARCHAR(255),
  `subcategory_id` VARCHAR(255),
  `judicial_process_id` VARCHAR(255),
  `seller_id` VARCHAR(255),
  `evaluation_value` DECIMAL(15, 2),
  `image_url` VARCHAR(2048),
  `image_media_id` VARCHAR(255),
  `gallery_image_urls` JSON,
  `media_item_ids` JSON,
  `data_ai_hint` VARCHAR(100),
  `location_city` VARCHAR(100),
  `location_state` VARCHAR(100),
  `address` VARCHAR(255),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Leilões
CREATE TABLE IF NOT EXISTS `auctions` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(255) UNIQUE,
  `slug` VARCHAR(255) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50),
  `auction_type` VARCHAR(50),
  `auction_date` TIMESTAMP,
  `end_date` TIMESTAMP,
  `category_id` VARCHAR(255),
  `auctioneer_id` VARCHAR(255),
  `seller_id` VARCHAR(255),
  `judicial_process_id` VARCHAR(255),
  `initial_offer` DECIMAL(15, 2),
  `is_featured_on_marketplace` BOOLEAN DEFAULT FALSE,
  `marketplace_announcement_title` VARCHAR(255),
  `image_url` VARCHAR(2048),
  `image_media_id` VARCHAR(255),
  `data_ai_hint` VARCHAR(100),
  `visits` INT DEFAULT 0,
  `documents_url` VARCHAR(2048),
  `auction_stages` JSON,
  `automatic_bidding_enabled` BOOLEAN,
  `allow_installment_bids` BOOLEAN,
  `soft_close_enabled` BOOLEAN,
  `soft_close_minutes` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`auctioneer_id`) REFERENCES `auctioneers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tabela de Lotes
CREATE TABLE IF NOT EXISTS `lots` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `public_id` VARCHAR(255) UNIQUE,
  `auction_id` VARCHAR(255) NOT NULL,
  `number` VARCHAR(50),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2) NOT NULL,
  `initial_price` DECIMAL(15, 2),
  `second_initial_price` DECIMAL(15, 2),
  `bid_increment_step` DECIMAL(15, 2),
  `status` VARCHAR(50),
  `bids_count` INT DEFAULT 0,
  `views` INT DEFAULT 0,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `is_exclusive` BOOLEAN DEFAULT FALSE,
  `discount_percentage` INT,
  `additional_triggers` JSON,
  `image_url` VARCHAR(2048),
  `image_media_id` VARCHAR(255),
  `gallery_image_urls` JSON,
  `media_item_ids` JSON,
  `category_id` VARCHAR(255),
  `subcategory_id` VARCHAR(255),
  `seller_id` VARCHAR(255),
  `auctioneer_id` VARCHAR(255),
  `city_id` VARCHAR(255),
  `state_id` VARCHAR(255),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `map_address` VARCHAR(255),
  `end_date` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Lotes para Bens (Many-to-Many)
CREATE TABLE IF NOT EXISTS `lot_bens` (
  `lot_id` VARCHAR(255) NOT NULL,
  `bem_id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`lot_id`, `bem_id`),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bem_id`) REFERENCES `bens`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tabela de Estados e Cidades
CREATE TABLE IF NOT EXISTS `states` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `uf` VARCHAR(2) NOT NULL UNIQUE,
  `slug` VARCHAR(100) UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cities` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150),
  `state_id` VARCHAR(255),
  `ibge_code` VARCHAR(7),
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Outras tabelas...
CREATE TABLE IF NOT EXISTS `media_items` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `file_name` VARCHAR(255) NOT NULL,
  `storage_path` VARCHAR(2048),
  `title` VARCHAR(255),
  `alt_text` VARCHAR(255),
  `caption` VARCHAR(500),
  `description` TEXT,
  `mime_type` VARCHAR(100),
  `size_bytes` INT,
  `url_original` VARCHAR(2048),
  `url_thumbnail` VARCHAR(2048),
  `uploaded_by` VARCHAR(255),
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_templates` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `subject` VARCHAR(255),
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_types` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `is_required` BOOLEAN DEFAULT TRUE,
    `applies_to` VARCHAR(50) -- e.g., 'PHYSICAL', 'LEGAL', 'ALL'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_documents` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(255) NOT NULL,
    `document_type_id` VARCHAR(255) NOT NULL,
    `file_url` VARCHAR(2048) NOT NULL,
    `file_name` VARCHAR(255),
    `status` VARCHAR(50) NOT NULL,
    `rejection_reason` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`document_type_id`) REFERENCES `document_types`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bids` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `lot_id` VARCHAR(255) NOT NULL,
    `auction_id` VARCHAR(255) NOT NULL,
    `bidder_id` VARCHAR(255) NOT NULL,
    `bidder_display` VARCHAR(255),
    `amount` DECIMAL(15, 2) NOT NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bidder_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_wins` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `lot_id` VARCHAR(255) NOT NULL UNIQUE, -- A lot can only be won once
    `user_id` VARCHAR(255) NOT NULL,
    `auction_id` VARCHAR(255) NOT NULL,
    `winning_bid_amount` DECIMAL(15, 2) NOT NULL,
    `win_date` TIMESTAMP NOT NULL,
    `payment_status` VARCHAR(50),
    `invoice_url` VARCHAR(2048),
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
