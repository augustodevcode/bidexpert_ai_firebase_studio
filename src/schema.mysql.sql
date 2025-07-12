-- Arquivo de schema para MySQL - BidExpert

-- Ordem de criação:
-- 1. Tabelas sem dependências externas (ou com dependências em tabelas já criadas)
--    roles, states, lot_categories, auctioneers, sellers, courts
-- 2. Tabelas dependentes de Nível 1
--    users (depende de roles), cities (depende de states), judicial_districts (depende de courts, states), subcategories (depende de lot_categories)
-- 3. Tabelas dependentes de Nível 2
--    judicial_branches (depende de judicial_districts), judicial_processes (depende de courts, districts, branches, sellers)
-- 4. Tabelas dependentes de Nível 3
--    bens (depende de judicial_processes, sellers, categories)
-- 5. Tabelas Centrais
--    auctions (depende de auctioneers, sellers)
-- 6. Tabelas de Itens
--    lots (depende de auctions, categories), media_items (depende de users), direct_sale_offers (depende de sellers, categories)
-- 7. Tabelas de Atividade
--    bids, user_wins, notifications, lot_questions, lot_reviews, user_documents, user_lot_max_bids

-- Tabelas de Autenticação e Autorização
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `name_normalized` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `permissions` JSON,
  `slug` VARCHAR(150),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `uid` VARCHAR(255) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255),
  `cpf` VARCHAR(20),
  `cell_phone` VARCHAR(20),
  `razao_social` VARCHAR(255),
  `cnpj` VARCHAR(20),
  `date_of_birth` DATETIME,
  `zip_code` VARCHAR(10),
  `street` VARCHAR(255),
  `number` VARCHAR(20),
  `complement` VARCHAR(100),
  `neighborhood` VARCHAR(100),
  `city` VARCHAR(100),
  `state` VARCHAR(100),
  `opt_in_marketing` BOOLEAN DEFAULT FALSE,
  `avatar_url` VARCHAR(255),
  `data_ai_hint` VARCHAR(100),
  `role_id` INT,
  `seller_id` INT,
  `habilitation_status` VARCHAR(50) DEFAULT 'PENDING_DOCUMENTS',
  `account_type` VARCHAR(50) DEFAULT 'PHYSICAL',
  `badges` JSON,
  `rg_number` VARCHAR(50),
  `rg_issuer` VARCHAR(50),
  `rg_issue_date` DATETIME,
  `rg_state` VARCHAR(2),
  `home_phone` VARCHAR(20),
  `gender` VARCHAR(50),
  `profession` VARCHAR(100),
  `nationality` VARCHAR(100),
  `marital_status` VARCHAR(50),
  `property_regime` VARCHAR(50),
  `spouse_name` VARCHAR(255),
  `spouse_cpf` VARCHAR(20),
  `inscricao_estadual` VARCHAR(50),
  `website` VARCHAR(255),
  `responsible_name` VARCHAR(255),
  `responsible_cpf` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL
);

-- Tabelas de Localização e Categorização
CREATE TABLE IF NOT EXISTS `states` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `uf` VARCHAR(2) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `city_count` INT DEFAULT 0,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `state_id` INT NOT NULL,
  `state_uf` VARCHAR(2),
  `ibge_code` VARCHAR(10),
  `lot_count` INT DEFAULT 0,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
);

CREATE TABLE IF NOT EXISTS `lot_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
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
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `subcategories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(150) NOT NULL,
  `parent_category_id` INT NOT NULL,
  `description` TEXT,
  `item_count` INT DEFAULT 0,
  `display_order` INT DEFAULT 0,
  `icon_url` VARCHAR(255),
  `icon_media_id` VARCHAR(100),
  `data_ai_hint_icon` VARCHAR(100),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`parent_category_id`) REFERENCES `lot_categories`(`id`)
);

-- Tabelas de Entidades de Leilão
CREATE TABLE IF NOT EXISTS `auctioneers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) UNIQUE,
  `slug` VARCHAR(255) UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `registration_number` VARCHAR(50),
  `contact_name` VARCHAR(150),
  `email` VARCHAR(255),
  `phone` VARCHAR(20),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(100),
  `zip_code` VARCHAR(10),
  `website` VARCHAR(255),
  `logo_url` VARCHAR(255),
  `logo_media_id` VARCHAR(100),
  `data_ai_hint_logo` VARCHAR(50),
  `description` TEXT,
  `user_id` INT,
  `member_since` DATETIME,
  `rating` DECIMAL(3, 2),
  `auctions_conducted_count` INT DEFAULT 0,
  `total_value_sold` DECIMAL(15, 2) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `sellers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) UNIQUE,
  `slug` VARCHAR(255) UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `contact_name` VARCHAR(150),
  `email` VARCHAR(255),
  `phone` VARCHAR(20),
  `address` VARCHAR(255),
  `city` VARCHAR(100),
  `state` VARCHAR(100),
  `zip_code` VARCHAR(10),
  `website` VARCHAR(255),
  `logo_url` VARCHAR(255),
  `logo_media_id` VARCHAR(100),
  `data_ai_hint_logo` VARCHAR(50),
  `description` TEXT,
  `user_id` INT,
  `member_since` DATETIME,
  `rating` DECIMAL(3, 2),
  `active_lots_count` INT DEFAULT 0,
  `total_sales_value` DECIMAL(15, 2) DEFAULT 0,
  `auctions_facilitated_count` INT DEFAULT 0,
  `is_judicial` BOOLEAN DEFAULT FALSE,
  `judicial_branch_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Tabelas Judiciais
CREATE TABLE IF NOT EXISTS `courts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(150),
  `state_uf` VARCHAR(2),
  `website` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `judicial_districts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(150),
  `court_id` INT,
  `state_id` INT,
  `zip_code` VARCHAR(10),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`)
);

CREATE TABLE IF NOT EXISTS `judicial_branches` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(150),
  `district_id` INT,
  `contact_name` VARCHAR(150),
  `phone` VARCHAR(20),
  `email` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`)
);

CREATE TABLE IF NOT EXISTS `judicial_processes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) UNIQUE,
  `process_number` VARCHAR(100) NOT NULL UNIQUE,
  `is_electronic` BOOLEAN DEFAULT TRUE,
  `court_id` INT,
  `district_id` INT,
  `branch_id` INT,
  `seller_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`court_id`) REFERENCES `courts`(`id`),
  FOREIGN KEY (`district_id`) REFERENCES `judicial_districts`(`id`),
  FOREIGN KEY (`branch_id`) REFERENCES `judicial_branches`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `judicial_parties` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `process_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `document_number` VARCHAR(50),
  `party_type` VARCHAR(50),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE
);

-- Tabela Central de Bens
CREATE TABLE IF NOT EXISTS `bens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) NOT NULL,
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
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`)
);

-- Tabela de Leilões
CREATE TABLE IF NOT EXISTS `auctions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) UNIQUE,
  `slug` VARCHAR(255),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50),
  `auction_date` DATETIME,
  `end_date` DATETIME,
  `category_id` INT,
  `auctioneer_id` INT,
  `seller_id` INT,
  `city` VARCHAR(100),
  `state` VARCHAR(2),
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(100),
  `data_ai_hint` VARCHAR(100),
  `documents_url` VARCHAR(255),
  `visits` INT DEFAULT 0,
  `initial_offer` DECIMAL(15, 2),
  `is_favorite` BOOLEAN,
  `auction_type` VARCHAR(50),
  `auction_stages` JSON,
  `evaluation_report_url` VARCHAR(255),
  `auction_certificate_url` VARCHAR(255),
  `selling_branch` VARCHAR(100),
  `automatic_bidding_enabled` BOOLEAN,
  `silent_bidding_enabled` BOOLEAN,
  `allow_multiple_bids_per_user` BOOLEAN,
  `allow_installment_bids` BOOLEAN,
  `soft_close_enabled` BOOLEAN,
  `soft_close_minutes` INT,
  `estimated_revenue` DECIMAL(15, 2),
  `achieved_revenue` DECIMAL(15, 2),
  `total_habilitated_users` INT,
  `is_featured_on_marketplace` BOOLEAN,
  `marketplace_announcement_title` VARCHAR(255),
  `judicial_process_id` INT,
  `additional_triggers` JSON,
  `decrement_amount` DECIMAL(15, 2),
  `decrement_interval_seconds` INT,
  `floor_price` DECIMAL(15, 2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`auctioneer_id`) REFERENCES `auctioneers`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`),
  FOREIGN KEY (`judicial_process_id`) REFERENCES `judicial_processes`(`id`)
);

-- Tabela de Lotes
CREATE TABLE IF NOT EXISTS `lots` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) UNIQUE,
  `auction_id` INT NOT NULL,
  `number` VARCHAR(20),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15, 2) NOT NULL,
  `initial_price` DECIMAL(15, 2),
  `second_initial_price` DECIMAL(15, 2),
  `bid_increment_step` DECIMAL(15, 2),
  `status` VARCHAR(50),
  `bids_count` INT DEFAULT 0,
  `views` INT DEFAULT 0,
  `is_featured` BOOLEAN,
  `is_exclusive` BOOLEAN,
  `discount_percentage` DECIMAL(5, 2),
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(100),
  `gallery_image_urls` JSON,
  `media_item_ids` JSON,
  `category_id` INT,
  `subcategory_id` INT,
  `city_id` INT,
  `state_id` INT,
  `end_date` DATETIME,
  `winner_id` INT,
  `winning_bid_term_url` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`),
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`),
  FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`),
  FOREIGN KEY (`state_id`) REFERENCES `states`(`id`),
  FOREIGN KEY (`winner_id`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `lot_bens` (
  `lot_id` INT NOT NULL,
  `bem_id` INT NOT NULL,
  PRIMARY KEY (`lot_id`, `bem_id`),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bem_id`) REFERENCES `bens`(`id`) ON DELETE CASCADE
);

-- Outras Tabelas
CREATE TABLE IF NOT EXISTS `media_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `file_name` VARCHAR(255),
  `storage_path` VARCHAR(255),
  `title` VARCHAR(255),
  `alt_text` VARCHAR(255),
  `caption` VARCHAR(255),
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
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `user_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `document_type_id` INT,
  `file_url` VARCHAR(255),
  `file_name` VARCHAR(255),
  `status` VARCHAR(50),
  `rejection_reason` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`document_type_id`) REFERENCES `document_types`(`id`)
);

CREATE TABLE IF NOT EXISTS `direct_sale_offers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `public_id` VARCHAR(50) UNIQUE,
  `title` VARCHAR(255),
  `description` TEXT,
  `offer_type` VARCHAR(50),
  `price` DECIMAL(15, 2),
  `minimum_offer_price` DECIMAL(15, 2),
  `status` VARCHAR(50),
  `category_id` INT,
  `seller_id` INT,
  `location_city` VARCHAR(100),
  `location_state` VARCHAR(2),
  `image_url` VARCHAR(255),
  `image_media_id` VARCHAR(100),
  `data_ai_hint` VARCHAR(100),
  `gallery_image_urls` JSON,
  `media_item_ids` JSON,
  `items_included` JSON,
  `views` INT,
  `expires_at` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `lot_categories`(`id`),
  FOREIGN KEY (`seller_id`) REFERENCES `sellers`(`id`)
);

-- Tabelas de Atividade do Usuário
CREATE TABLE IF NOT EXISTS `bids` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lot_id` INT NOT NULL,
  `auction_id` INT NOT NULL,
  `bidder_id` INT NOT NULL,
  `bidder_display` VARCHAR(255),
  `amount` DECIMAL(15, 2) NOT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`),
  FOREIGN KEY (`bidder_id`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `user_wins` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lot_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `winning_bid_amount` DECIMAL(15, 2),
  `win_date` DATETIME,
  `payment_status` VARCHAR(50),
  `invoice_url` VARCHAR(255),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `lot_id` INT NOT NULL,
  `max_amount` DECIMAL(15, 2) NOT NULL,
  `is_active` BOOLEAN,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_lot_unique` (`user_id`, `lot_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`)
);

CREATE TABLE IF NOT EXISTS `lot_reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lot_id` INT,
  `auction_id` INT,
  `user_id` INT,
  `user_display_name` VARCHAR(255),
  `rating` INT,
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `lot_questions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lot_id` INT,
  `auction_id` INT,
  `user_id` INT,
  `user_display_name` VARCHAR(255),
  `question_text` TEXT,
  `is_public` BOOLEAN,
  `answer_text` TEXT,
  `answered_by_user_id` INT,
  `answered_by_user_display_name` VARCHAR(255),
  `answered_at` DATETIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`lot_id`) REFERENCES `lots`(`id`),
  FOREIGN KEY (`auction_id`) REFERENCES `auctions`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`answered_by_user_id`) REFERENCES `users`(`id`)
);

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `message` TEXT,
  `link` VARCHAR(255),
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Tabela de Configurações da Plataforma
CREATE TABLE IF NOT EXISTS `platform_settings` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `site_title` VARCHAR(255),
    `site_tagline` VARCHAR(255),
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
);

-- Tabela de Documentos (ex: CPF, RG)
CREATE TABLE IF NOT EXISTS `document_types` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `is_required` BOOLEAN DEFAULT FALSE,
    `applies_to` VARCHAR(50), -- e.g., 'PHYSICAL', 'LEGAL', 'ALL'
    PRIMARY KEY (`id`)
);

-- Tabela de Mensagens de Contato
CREATE TABLE IF NOT EXISTS `contact_messages` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `subject` VARCHAR(255),
    `message` TEXT,
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
);

-- Tabela de Templates de Documentos
CREATE TABLE IF NOT EXISTS `document_templates` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL, -- e.g., 'WINNING_BID_TERM', 'EVALUATION_REPORT'
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
);
