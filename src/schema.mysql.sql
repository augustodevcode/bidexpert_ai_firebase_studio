-- /src/schema.mysql.sql

-- =================================================================
-- TABELAS PRINCIPAIS (CORE TABLES)
-- =================================================================

-- Tabela de Configurações da Plataforma
CREATE TABLE `platform_settings` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY DEFAULT 'global',
  `site_title` VARCHAR(150),
  `site_tagline` VARCHAR(255),
  `logo_url` VARCHAR(255) NULL,
  `favicon_url` VARCHAR(255) NULL,
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
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- Tabela de Perfis de Usuário (Roles)
CREATE TABLE `roles` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `name_normalized` varchar(255) NOT NULL UNIQUE,
  `description` text,
  `permissions` json,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Usuários
CREATE TABLE `users` (
  `uid` varchar(255) NOT NULL PRIMARY KEY,
  `email` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255),
  `cpf` varchar(20) UNIQUE,
  `cell_phone` varchar(20),
  `razao_social` varchar(255),
  `cnpj` varchar(25) UNIQUE,
  `date_of_birth` date,
  `zip_code` varchar(15),
  `street` varchar(255),
  `number` varchar(20),
  `complement` varchar(100),
  `neighborhood` varchar(100),
  `city` varchar(100),
  `state` varchar(50),
  `avatar_url` varchar(255),
  `data_ai_hint` varchar(100),
  `role_id` varchar(255),
  `seller_id` varchar(255),
  `habilitation_status` varchar(50) DEFAULT 'PENDING_DOCUMENTS',
  `account_type` varchar(50),
  `badges` json,
  `opt_in_marketing` boolean DEFAULT false,
  `rg_number` varchar(50),
  `rg_issuer` varchar(50),
  `rg_issue_date` date,
  `rg_state` varchar(2),
  `home_phone` varchar(20),
  `gender` varchar(50),
  `profession` varchar(100),
  `nationality` varchar(100),
  `marital_status` varchar(50),
  `property_regime` varchar(50),
  `spouse_name` varchar(255),
  `spouse_cpf` varchar(20),
  `inscricao_estadual` varchar(50),
  `website` varchar(255),
  `responsible_name` varchar(255),
  `responsible_cpf` varchar(20),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL
);


-- Tabela de Leiloeiros
CREATE TABLE `auctioneers` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `public_id` varchar(255) NOT NULL UNIQUE,
  `slug` varchar(255) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL,
  `registration_number` varchar(100),
  `contact_name` varchar(255),
  `email` varchar(255),
  `phone` varchar(50),
  `address` varchar(255),
  `city` varchar(100),
  `state` varchar(50),
  `zip_code` varchar(20),
  `website` varchar(255),
  `logo_url` varchar(255),
  `logo_media_id` varchar(255),
  `data_ai_hint_logo` varchar(100),
  `description` text,
  `user_id` varchar(255),
  `member_since` date,
  `rating` decimal(3,2),
  `auctions_conducted_count` int,
  `total_value_sold` decimal(15,2),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Comitentes (Vendedores)
CREATE TABLE `sellers` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `public_id` varchar(255) NOT NULL UNIQUE,
  `slug` varchar(255) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL,
  `contact_name` varchar(255),
  `email` varchar(255),
  `phone` varchar(50),
  `address` varchar(255),
  `city` varchar(100),
  `state` varchar(50),
  `zip_code` varchar(20),
  `website` varchar(255),
  `logo_url` varchar(255),
  `logo_media_id` varchar(255),
  `data_ai_hint_logo` varchar(100),
  `description` text,
  `user_id` varchar(255),
  `member_since` date,
  `rating` decimal(3,2),
  `active_lots_count` int,
  `total_sales_value` decimal(15,2),
  `auctions_facilitated_count` int,
  `is_judicial` boolean DEFAULT false,
  `judicial_branch_id` varchar(255),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =================================================================
-- TABELAS DE LOCALIZAÇÃO E CATEGORIAS (LOCATION & CATEGORIES)
-- =================================================================

-- Tabela de Categorias de Lotes
CREATE TABLE `lot_categories` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL UNIQUE,
  `description` text,
  `has_subcategories` boolean DEFAULT false,
  `icon_name` varchar(100),
  `data_ai_hint_icon` varchar(100),
  `cover_image_url` varchar(255),
  `cover_image_media_id` varchar(255),
  `data_ai_hint_cover` varchar(100),
  `mega_menu_image_url` varchar(255),
  `mega_menu_image_media_id` varchar(255),
  `data_ai_hint_mega_menu` varchar(100),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- Tabela de Subcategorias
CREATE TABLE `subcategories` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL UNIQUE,
  `parent_category_id` varchar(255) NOT NULL,
  `description` text,
  `display_order` int DEFAULT 0,
  `icon_url` varchar(255),
  `icon_media_id` varchar(255),
  `data_ai_hint_icon` varchar(100),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Estados
CREATE TABLE `states` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `name` varchar(100) NOT NULL,
  `uf` varchar(2) NOT NULL UNIQUE,
  `slug` varchar(100) NOT NULL UNIQUE,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Cidades
CREATE TABLE `cities` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `name` varchar(150) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `state_id` varchar(255) NOT NULL,
  `state_uf` varchar(2) NOT NULL,
  `ibge_code` varchar(10),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =================================================================
-- TABELAS JUDICIAIS (JUDICIAL TABLES)
-- =================================================================

-- Tabela de Tribunais
CREATE TABLE `courts` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `state_uf` varchar(2) NOT NULL,
  `website` varchar(255),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Comarcas
CREATE TABLE `judicial_districts` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `court_id` varchar(255) NOT NULL,
  `state_id` varchar(255) NOT NULL,
  `zip_code` varchar(10),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Varas
CREATE TABLE `judicial_branches` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `district_id` varchar(255) NOT NULL,
  `contact_name` varchar(255),
  `phone` varchar(50),
  `email` varchar(255),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Processos Judiciais
CREATE TABLE `judicial_processes` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `public_id` varchar(255) UNIQUE,
  `process_number` varchar(100) NOT NULL UNIQUE,
  `is_electronic` boolean DEFAULT true,
  `court_id` varchar(255),
  `district_id` varchar(255),
  `branch_id` varchar(255),
  `seller_id` varchar(255),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Partes do Processo
CREATE TABLE `judicial_parties` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `process_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `document_number` varchar(50),
  `party_type` varchar(50) NOT NULL
);


-- =================================================================
-- TABELAS DE LEILÃO (AUCTION TABLES)
-- =================================================================

-- Tabela de Leilões
CREATE TABLE `auctions` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `public_id` varchar(255) NOT NULL UNIQUE,
  `slug` varchar(255) NOT NULL UNIQUE,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(50) NOT NULL,
  `auction_date` datetime NOT NULL,
  `end_date` datetime,
  `category` varchar(255),
  `category_id` varchar(255),
  `auctioneer` varchar(255),
  `auctioneer_id` varchar(255),
  `seller` varchar(255),
  `seller_id` varchar(255),
  `map_address` varchar(255),
  `image_url` varchar(255),
  `image_media_id` varchar(255),
  `data_ai_hint` varchar(100),
  `visits` int DEFAULT 0,
  `total_lots` int DEFAULT 0,
  `auction_type` varchar(50),
  `auction_stages` json,
  `documents_url` varchar(255),
  `evaluation_report_url` varchar(255),
  `auction_certificate_url` varchar(255),
  `selling_branch` varchar(100),
  `automatic_bidding_enabled` boolean DEFAULT false,
  `silent_bidding_enabled` boolean DEFAULT false,
  `allow_multiple_bids_per_user` boolean DEFAULT true,
  `allow_installment_bids` boolean DEFAULT false,
  `soft_close_enabled` boolean DEFAULT false,
  `soft_close_minutes` int DEFAULT 2,
  `estimated_revenue` decimal(15,2),
  `achieved_revenue` decimal(15,2),
  `total_habilitated_users` int DEFAULT 0,
  `is_featured_on_marketplace` boolean DEFAULT false,
  `marketplace_announcement_title` varchar(255),
  `judicial_process_id` varchar(255),
  `additional_triggers` json,
  `decrement_amount` decimal(15,2),
  `decrement_interval_seconds` int,
  `floor_price` decimal(15,2),
  `auto_relist_settings` json,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Bens (Assets)
CREATE TABLE `bens` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `public_id` varchar(255) UNIQUE,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(50) NOT NULL,
  `category_id` varchar(255),
  `subcategory_id` varchar(255),
  `judicial_process_id` varchar(255),
  `seller_id` varchar(255),
  `evaluation_value` decimal(15,2),
  `image_url` varchar(255),
  `image_media_id` varchar(255),
  `gallery_image_urls` json,
  `media_item_ids` json,
  `data_ai_hint` varchar(100),
  `location_city` varchar(100),
  `location_state` varchar(100),
  `address` varchar(255),
  `latitude` decimal(10,8),
  `longitude` decimal(11,8),
  `plate` varchar(10),
  `make` varchar(50),
  `model` varchar(50),
  `version` varchar(100),
  `year` int,
  `model_year` int,
  `mileage` int,
  `color` varchar(30),
  `fuel_type` varchar(30),
  `transmission_type` varchar(30),
  `body_type` varchar(50),
  `vin` varchar(17),
  `renavam` varchar(11),
  `engine_power` varchar(50),
  `number_of_doors` int,
  `vehicle_options` text,
  `detran_status` varchar(100),
  `debts` text,
  `running_condition` varchar(100),
  `body_condition` varchar(100),
  `tires_condition` varchar(100),
  `has_key` boolean,
  `property_type` varchar(100),
  `property_registration_number` varchar(50),
  `iptu_number` varchar(50),
  `is_occupied` boolean,
  `area` decimal(10,2),
  `total_area` decimal(10,2),
  `built_area` decimal(10,2),
  `bedrooms` int,
  `suites` int,
  `bathrooms` int,
  `parking_spaces` int,
  `construction_type` varchar(100),
  `finishes` text,
  `infrastructure` text,
  `condo_details` text,
  `improvements` text,
  `topography` varchar(100),
  `liens_and_encumbrances` text,
  `property_debts` text,
  `unregistered_records` text,
  `has_habite_se` boolean,
  `zoning_restrictions` varchar(200),
  `amenities` json,
  `brand` varchar(50),
  `serial_number` varchar(100),
  `item_condition` varchar(100),
  `specifications` text,
  `included_accessories` text,
  `battery_condition` varchar(100),
  `has_invoice` boolean,
  `has_warranty` boolean,
  `repair_history` text,
  `appliance_capacity` varchar(50),
  `voltage` varchar(20),
  `appliance_type` varchar(50),
  `additional_functions` text,
  `hours_used` int,
  `engine_type` varchar(50),
  `capacity_or_power` varchar(100),
  `maintenance_history` text,
  `installation_location` varchar(200),
  `complies_with_nr` varchar(100),
  `operating_licenses` varchar(200),
  `breed` varchar(50),
  `age` varchar(30),
  `sex` varchar(10),
  `weight` varchar(30),
  `individual_id` varchar(50),
  `purpose` varchar(100),
  `sanitary_condition` text,
  `vaccination_status` text,
  `lineage` text,
  `is_pregnant` boolean,
  `special_skills` text,
  `gta_document` varchar(100),
  `breed_registry_document` varchar(100),
  `furniture_type` varchar(100),
  `material` varchar(100),
  `style` varchar(50),
  `dimensions` varchar(100),
  `piece_count` int,
  `jewelry_type` varchar(100),
  `metal` varchar(100),
  `gemstones` text,
  `total_weight` varchar(50),
  `jewelry_size` varchar(50),
  `authenticity_certificate` varchar(200),
  `work_type` varchar(100),
  `artist` varchar(100),
  `period` varchar(100),
  `technique` varchar(100),
  `provenance` text,
  `boat_type` varchar(100),
  `boat_length` varchar(50),
  `hull_material` varchar(50),
  `onboard_equipment` text,
  `product_name` varchar(100),
  `quantity` varchar(50),
  `packaging_type` varchar(50),
  `expiration_date` date,
  `storage_conditions` text,
  `precious_metal_type` varchar(50),
  `purity` varchar(50),
  `forest_goods_type` varchar(100),
  `volume_or_quantity` varchar(100),
  `species` varchar(100),
  `dof_number` varchar(100),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Lotes
CREATE TABLE `lots` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `public_id` varchar(255) NOT NULL UNIQUE,
  `slug` varchar(255) NOT NULL UNIQUE,
  `number` varchar(20),
  `title` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(15,2) NOT NULL,
  `initial_price` decimal(15,2),
  `second_initial_price` decimal(15,2),
  `bid_increment_step` decimal(15,2),
  `status` varchar(50) NOT NULL,
  `bids_count` int DEFAULT 0,
  `views` int DEFAULT 0,
  `is_featured` boolean DEFAULT false,
  `is_exclusive` boolean DEFAULT false,
  `discount_percentage` decimal(5,2),
  `additional_triggers` json,
  `image_url` varchar(255),
  `image_media_id` varchar(255),
  `gallery_image_urls` json,
  `media_item_ids` json,
  `bem_ids` json,
  `type` varchar(100),
  `category_id` varchar(255),
  `subcategory_id` varchar(255),
  `auction_id` varchar(255),
  `auction_name` varchar(255),
  `seller_id` varchar(255),
  `seller_name` varchar(255),
  `auctioneer_id` varchar(255),
  `city_id` varchar(255),
  `state_id` varchar(255),
  `latitude` decimal(10,8),
  `longitude` decimal(11,8),
  `map_address` varchar(255),
  `map_embed_url` text,
  `map_static_image_url` varchar(255),
  `end_date` datetime,
  `lot_specific_auction_date` datetime,
  `second_auction_date` datetime,
  `condition` varchar(100),
  `data_ai_hint` varchar(100),
  `winner_id` varchar(255),
  `winning_bid_term_url` varchar(255),
  `allow_installment_bids` boolean DEFAULT false,
  `judicial_process_number` varchar(100),
  `court_district` varchar(100),
  `court_name` varchar(100),
  `public_process_url` varchar(255),
  `property_registration_number` varchar(100),
  `property_liens` text,
  `known_debts` text,
  `additional_documents_info` text,
  `reserve_price` decimal(15,2),
  `evaluation_value` decimal(15,2),
  `debt_amount` decimal(15,2),
  `itbi_value` decimal(15,2),
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela associativa entre Lotes e Bens
CREATE TABLE `lot_bens` (
    `lot_id` VARCHAR(255) NOT NULL,
    `bem_id` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`lot_id`, `bem_id`)
);

-- Tabela de Lances
CREATE TABLE `bids` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `lot_id` varchar(255) NOT NULL,
  `auction_id` varchar(255),
  `bidder_id` varchar(255) NOT NULL,
  `bidder_display` varchar(255),
  `amount` decimal(15,2) NOT NULL,
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  `bid_type` varchar(50) DEFAULT 'MANUAL'
);

-- Tabela de Arremates do Usuário
CREATE TABLE `user_wins` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `lot_id` VARCHAR(255) NOT NULL,
    `userId` VARCHAR(255) NOT NULL,
    `winning_bid_amount` DECIMAL(15,2) NOT NULL,
    `win_date` DATETIME NOT NULL,
    `payment_status` VARCHAR(50) DEFAULT 'PENDENTE',
    `invoice_url` VARCHAR(255)
);

-- =================================================================
-- TABELAS DE SUPORTE (SUPPORT TABLES)
-- =================================================================

-- Tabela de Venda Direta
CREATE TABLE `direct_sale_offers` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `public_id` varchar(255) UNIQUE,
  `title` varchar(255) NOT NULL,
  `description` text,
  `offer_type` varchar(50) NOT NULL,
  `price` decimal(15,2),
  `minimum_offer_price` decimal(15,2),
  `status` varchar(50) NOT NULL,
  `category` varchar(100),
  `seller_id` varchar(255),
  `seller_name` varchar(255),
  `location_city` varchar(100),
  `location_state` varchar(50),
  `image_url` varchar(255),
  `image_media_id` varchar(255),
  `data_ai_hint` varchar(100),
  `gallery_image_urls` json,
  `media_item_ids` json,
  `items_included` json,
  `views` int DEFAULT 0,
  `expires_at` datetime,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Tipos de Documentos (para habilitação)
CREATE TABLE `document_types` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `is_required` BOOLEAN DEFAULT TRUE,
    `applies_to` VARCHAR(50) -- 'PHYSICAL', 'LEGAL', 'ALL'
);

-- Tabela de Documentos dos Usuários
CREATE TABLE `user_documents` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(255) NOT NULL,
    `document_type_id` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `file_url` VARCHAR(255),
    `file_name` VARCHAR(255),
    `rejection_reason` TEXT,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`) ON DELETE CASCADE
);

-- Tabela de Templates de Documentos
CREATE TABLE `document_templates` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL, -- 'WINNING_BID_TERM', 'EVALUATION_REPORT', etc.
    `content` TEXT NOT NULL,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Notificações
CREATE TABLE `notifications` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(255),
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Biblioteca de Mídia
CREATE TABLE `media_items` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `file_name` varchar(255) NOT NULL,
  `storage_path` varchar(255) NOT NULL,
  `title` varchar(255),
  `alt_text` varchar(255),
  `caption` text,
  `description` text,
  `mime_type` varchar(100) NOT NULL,
  `size_bytes` int NOT NULL,
  `url_original` varchar(255) NOT NULL,
  `url_thumbnail` varchar(255),
  `url_medium` varchar(255),
  `url_large` varchar(255),
  `linked_lot_ids` json,
  `data_ai_hint` varchar(100),
  `uploaded_by` varchar(255),
  `uploaded_at` timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Mensagens de Contato
CREATE TABLE `contact_messages` (
    `id` varchar(255) NOT NULL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Avaliações
CREATE TABLE `reviews` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `lot_id` VARCHAR(255) NOT NULL,
    `auction_id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `user_display_name` VARCHAR(255),
    `rating` INT NOT NULL,
    `comment` TEXT,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Perguntas e Respostas
CREATE TABLE `lot_questions` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `lot_id` VARCHAR(255) NOT NULL,
    `auction_id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `user_display_name` VARCHAR(255),
    `question_text` TEXT NOT NULL,
    `answer_text` TEXT,
    `answered_by_user_id` VARCHAR(255),
    `answered_by_user_display_name` VARCHAR(255),
    `is_public` BOOLEAN DEFAULT TRUE,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `answered_at` timestamp NULL
);

-- Tabela de Lances Máximos (Robô)
CREATE TABLE `user_lot_max_bids` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(255) NOT NULL,
    `lot_id` VARCHAR(255) NOT NULL,
    `max_amount` DECIMAL(15,2) NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `user_lot` (`user_id`,`lot_id`)
);
