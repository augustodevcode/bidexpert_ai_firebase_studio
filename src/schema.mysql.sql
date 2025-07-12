-- /src/schema.mysql.sql

-- Tabela de Configurações da Plataforma
CREATE TABLE `platform_settings` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `site_title` VARCHAR(255) NOT NULL,
    `site_tagline` VARCHAR(255),
    `logo_url` VARCHAR(255) NULL,
    `favicon_url` VARCHAR(255) NULL,
    `gallery_image_base_path` VARCHAR(255) DEFAULT '/uploads/media/',
    `storage_provider` VARCHAR(50) DEFAULT 'local',
    `firebase_storage_bucket` VARCHAR(255),
    `active_theme_name` VARCHAR(255),
    `themes` JSON,
    `platform_public_id_masks` JSON,
    `homepage_sections` JSON,
    `mental_trigger_settings` JSON,
    `section_badge_visibility` JSON,
    `map_settings` JSON,
    `search_pagination_type` VARCHAR(50) DEFAULT 'loadMore',
    `search_items_per_page` INT DEFAULT 12,
    `search_load_more_count` INT DEFAULT 12,
    `show_countdown_on_lot_detail` BOOLEAN DEFAULT true,
    `show_countdown_on_cards` BOOLEAN DEFAULT true,
    `show_related_lots_on_lot_detail` BOOLEAN DEFAULT true,
    `related_lots_count` INT DEFAULT 5,
    `default_urgency_timer_hours` INT,
    `variable_increment_table` JSON,
    `bidding_settings` JSON,
    `default_list_items_per_page` INT DEFAULT 10,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Perfis de Usuário (Roles)
CREATE TABLE `roles` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `name_normalized` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT,
    `permissions` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Categorias de Lote
CREATE TABLE `lot_categories` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `description` TEXT,
    `has_subcategories` BOOLEAN DEFAULT false,
    `icon_name` VARCHAR(255),
    `data_ai_hint_icon` VARCHAR(255),
    `cover_image_url` VARCHAR(255),
    `cover_image_media_id` VARCHAR(255),
    `data_ai_hint_cover` VARCHAR(255),
    `mega_menu_image_url` VARCHAR(255),
    `mega_menu_image_media_id` VARCHAR(255),
    `data_ai_hint_mega_menu` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Subcategorias
CREATE TABLE `subcategories` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `parent_category_id` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `display_order` INT DEFAULT 0,
    `icon_url` VARCHAR(255),
    `icon_media_id` VARCHAR(255),
    `data_ai_hint_icon` VARCHAR(255),
    `item_count` INT DEFAULT 0,
    FOREIGN KEY (`parent_category_id`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE
);


-- Tabela de Estados
CREATE TABLE `states` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `uf` VARCHAR(2) NOT NULL UNIQUE,
    `slug` VARCHAR(255) NOT NULL UNIQUE
);

-- Tabela de Cidades
CREATE TABLE `cities` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `state_id` VARCHAR(255) NOT NULL,
    `state_uf` VARCHAR(2) NOT NULL,
    `ibge_code` VARCHAR(10),
    `lot_count` INT DEFAULT 0,
    FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON DELETE CASCADE
);

-- Tabela de Tribunais
CREATE TABLE `courts` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `state_uf` VARCHAR(2) NOT NULL,
    `website` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Comarcas
CREATE TABLE `judicial_districts` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `court_id` VARCHAR(255) NOT NULL,
    `state_id` VARCHAR(255) NOT NULL,
    `zip_code` VARCHAR(10),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`),
    FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
);

-- Tabela de Varas
CREATE TABLE `judicial_branches` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `district_id` VARCHAR(255) NOT NULL,
    `contact_name` VARCHAR(255),
    `phone` VARCHAR(20),
    `email` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`)
);

-- Tabela de Comitentes/Vendedores
CREATE TABLE `sellers` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `public_id` VARCHAR(255) NOT NULL UNIQUE,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `contact_name` VARCHAR(255),
    `email` VARCHAR(255),
    `phone` VARCHAR(20),
    `address` VARCHAR(255),
    `city` VARCHAR(100),
    `state` VARCHAR(50),
    `zip_code` VARCHAR(10),
    `website` VARCHAR(255),
    `logo_url` VARCHAR(255),
    `logo_media_id` VARCHAR(255),
    `data_ai_hint_logo` VARCHAR(255),
    `description` TEXT,
    `is_judicial` BOOLEAN DEFAULT false,
    `judicial_branch_id` VARCHAR(255),
    `user_id` VARCHAR(255),
    `member_since` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `rating` DECIMAL(3, 2),
    `active_lots_count` INT DEFAULT 0,
    `total_sales_value` DECIMAL(15, 2) DEFAULT 0,
    `auctions_facilitated_count` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`judicial_branch_id`) REFERENCES `judicial_branches`(`id`) ON DELETE SET NULL
);

-- Tabela de Processos Judiciais
CREATE TABLE `judicial_processes` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `public_id` VARCHAR(255) NOT NULL UNIQUE,
    `process_number` VARCHAR(100) NOT NULL UNIQUE,
    `is_electronic` BOOLEAN DEFAULT true,
    `court_id` VARCHAR(255) NOT NULL,
    `district_id` VARCHAR(255) NOT NULL,
    `branch_id` VARCHAR(255) NOT NULL,
    `seller_id` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`),
    FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`),
    FOREIGN KEY (`branch_id`) REFERENCES `judicial_branches`(`id`),
    FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
);

-- Tabela de Partes do Processo
CREATE TABLE `judicial_parties` (
  `id` VARCHAR(255) PRIMARY KEY NOT NULL,
  `process_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `document_number` VARCHAR(50),
  `party_type` ENUM('AUTOR', 'REU', 'ADVOGADO_AUTOR', 'ADVOGADO_REU', 'JUIZ', 'ESCRIVAO', 'PERITO', 'ADMINISTRADOR_JUDICIAL', 'TERCEIRO_INTERESSADO', 'OUTRO') NOT NULL,
  FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
);

-- Tabela de Bens
CREATE TABLE `bens` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `public_id` VARCHAR(255) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` ENUM('CADASTRO', 'DISPONIVEL', 'LOTEADO', 'VENDIDO', 'REMOVIDO', 'INATIVADO') DEFAULT 'DISPONIVEL',
    `category_id` VARCHAR(255) NOT NULL,
    `subcategory_id` VARCHAR(255),
    `judicial_process_id` VARCHAR(255),
    `seller_id` VARCHAR(255),
    `evaluation_value` DECIMAL(15, 2),
    `image_url` VARCHAR(255),
    `image_media_id` VARCHAR(255),
    `gallery_image_urls` JSON,
    `media_item_ids` JSON,
    `data_ai_hint` VARCHAR(255),
    `location_city` VARCHAR(100),
    `location_state` VARCHAR(100),
    `address` VARCHAR(255),
    `latitude` DECIMAL(10, 8),
    `longitude` DECIMAL(11, 8),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
    FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
);

-- Tabela de Leiloeiros
CREATE TABLE `auctioneers` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `public_id` VARCHAR(255) NOT NULL UNIQUE,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `registration_number` VARCHAR(255),
    `contact_name` VARCHAR(255),
    `email` VARCHAR(255),
    `phone` VARCHAR(20),
    `address` VARCHAR(255),
    `city` VARCHAR(100),
    `state` VARCHAR(50),
    `zip_code` VARCHAR(10),
    `website` VARCHAR(255),
    `logo_url` VARCHAR(255),
    `logo_media_id` VARCHAR(255),
    `data_ai_hint_logo` VARCHAR(255),
    `description` TEXT,
    `user_id` VARCHAR(255),
    `member_since` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `rating` DECIMAL(3, 2),
    `auctions_conducted_count` INT DEFAULT 0,
    `total_value_sold` DECIMAL(15, 2) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Leilões
CREATE TABLE `auctions` (
    `id` VARCHAR(255) PRIMARY KEY NOT NULL,
    `public_id` VARCHAR(255) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` ENUM('RASCUNHO', 'EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO') NOT NULL,
    `auction_date` TIMESTAMP NOT NULL,
    `end_date` TIMESTAMP,
    `category_id` VARCHAR(255),
    `category` VARCHAR(255),
    `auctioneer_id` VARCHAR(255),
    `auctioneer` VARCHAR(255),
    `seller_id` VARCHAR(255),
    `seller` VARCHAR(255),
    `map_address` VARCHAR(255),
    `image_url` VARCHAR(255),
    `image_media_id` VARCHAR(255),
    `data_ai_hint` VARCHAR(255),
    `visits` INT DEFAULT 0,
    `total_lots` INT DEFAULT 0,
    `initial_offer` DECIMAL(15, 2),
    `auction_type` ENUM('JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS', 'DUTCH', 'SILENT'),
    `auction_stages` JSON,
    `documents_url` VARCHAR(255),
    `evaluation_report_url` VARCHAR(255),
    `auction_certificate_url` VARCHAR(255),
    `selling_branch` VARCHAR(100),
    `automatic_bidding_enabled` BOOLEAN DEFAULT false,
    `silent_bidding_enabled` BOOLEAN DEFAULT false,
    `allow_multiple_bids_per_user` BOOLEAN DEFAULT true,
    `allow_installment_bids` BOOLEAN DEFAULT false,
    `soft_close_enabled` BOOLEAN DEFAULT false,
    `soft_close_minutes` INT DEFAULT 2,
    `estimated_revenue` DECIMAL(15, 2),
    `achieved_revenue` DECIMAL(15, 2) DEFAULT 0,
    `total_habilitated_users` INT DEFAULT 0,
    `is_featured_on_marketplace` BOOLEAN DEFAULT false,
    `marketplace_announcement_title` VARCHAR(150),
    `judicial_process_id` VARCHAR(255),
    `additional_triggers` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
    FOREIGN KEY (`auctioneer_id`) REFERENCES `auctioneers`(`id`),
    FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`),
    FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`)
);

-- Tabela de Lotes
CREATE TABLE `lots` (
  `id` VARCHAR(255) PRIMARY KEY NOT NULL,
  `public_id` VARCHAR(255) NOT NULL UNIQUE,
  `auction_id` VARCHAR(255) NOT NULL,
  `number` VARCHAR(20),
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2) NOT NULL,
  `initial_price` DECIMAL(15, 2),
  `second_initial_price` DECIMAL(15, 2),
  `bid_increment_step` DECIMAL(10, 2),
  `status` ENUM('RASCUNHO', 'EM_BREVE', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'VENDIDO', 'NAO_VENDIDO', 'CANCELADO') NOT NULL,
  `bids_count` INT DEFAULT 0,
  `views` INT DEFAULT 0,
  `is_featured` BOOLEAN DEFAULT false,
  `is_exclusive` BOOLEAN DEFAULT false,
  `discount_percentage` DECIMAL(5, 2),
  `additional_triggers` JSON,
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(255),
  `winning_bid_term_url` VARCHAR(255),
  `gallery_image_urls` JSON,
  `media_item_ids` JSON,
  `category_id` VARCHAR(255) NOT NULL,
  `subcategory_id` VARCHAR(255),
  `seller_id` VARCHAR(255),
  `auctioneer_id` VARCHAR(255),
  `city_id` VARCHAR(255),
  `state_id` VARCHAR(255),
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `map_address` VARCHAR(255),
  `map_embed_url` VARCHAR(255),
  `map_static_image_url` VARCHAR(255),
  `end_date` TIMESTAMP,
  `lot_specific_auction_date` TIMESTAMP,
  `second_auction_date` TIMESTAMP,
  `condition` VARCHAR(100),
  `data_ai_hint` VARCHAR(255),
  `winner_id` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`auctioneer_id`) REFERENCES `auctioneers`(`id`)
);

-- Tabela de associação Lote-Bem
CREATE TABLE `lot_bens` (
    `lot_id` VARCHAR(255) NOT NULL,
    `bem_id` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`lot_id`, `bem_id`),
    FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`bem_id`) REFERENCES `bens`(`id`) ON DELETE CASCADE
);

    