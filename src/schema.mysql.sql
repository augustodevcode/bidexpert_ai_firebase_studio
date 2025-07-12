
-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `uid` VARCHAR(255) UNIQUE NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255),
    `full_name` VARCHAR(255),
    `role_id` VARCHAR(255),
    `habilitation_status` VARCHAR(50),
    `account_type` VARCHAR(50),
    `cpf` VARCHAR(20),
    `date_of_birth` DATE,
    `razao_social` VARCHAR(255),
    `cnpj` VARCHAR(20),
    `inscricao_estadual` VARCHAR(30),
    `website` VARCHAR(255),
    `cell_phone` VARCHAR(20),
    `home_phone` VARCHAR(20),
    `zip_code` VARCHAR(10),
    `street` VARCHAR(255),
    `number` VARCHAR(20),
    `complement` VARCHAR(100),
    `neighborhood` VARCHAR(100),
    `city` VARCHAR(100),
    `state` VARCHAR(50),
    `opt_in_marketing` BOOLEAN DEFAULT FALSE,
    `avatar_url` VARCHAR(255),
    `data_ai_hint` VARCHAR(100),
    `seller_id` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `badges` JSON,
    `rg_number` VARCHAR(50),
    `rg_issuer` VARCHAR(50),
    `rg_issue_date` DATE,
    `rg_state` VARCHAR(2),
    `gender` VARCHAR(50),
    `profession` VARCHAR(100),
    `nationality` VARCHAR(100),
    `marital_status` VARCHAR(50),
    `property_regime` VARCHAR(100),
    `spouse_name` VARCHAR(255),
    `spouse_cpf` VARCHAR(20),
    `responsible_name` VARCHAR(255),
    `responsible_cpf` VARCHAR(20)
);

-- Tabela de Categorias de Lote
CREATE TABLE IF NOT EXISTS `lot_categories` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(255) UNIQUE NOT NULL,
    `slug` VARCHAR(255) UNIQUE NOT NULL,
    `description` TEXT,
    `icon_name` VARCHAR(50),
    `has_subcategories` BOOLEAN DEFAULT FALSE,
    `data_ai_hint_icon` VARCHAR(100),
    `cover_image_url` VARCHAR(255),
    `mega_menu_image_url` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Subcategorias
CREATE TABLE IF NOT EXISTS `subcategories` (
    `id` VARCHAR(255) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `parent_category_id` VARCHAR(255),
    `description` TEXT,
    `display_order` INT DEFAULT 0,
    `icon_url` VARCHAR(255),
    `icon_media_id` VARCHAR(255),
    `data_ai_hint_icon` VARCHAR(100),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`parent_category_id`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE
);

-- Tabela de Leilões
CREATE TABLE IF NOT EXISTS `auctions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(255) UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` VARCHAR(50),
    `auction_date` DATETIME,
    `end_date` DATETIME,
    `category_id` VARCHAR(255),
    `auctioneer_id` INT,
    `seller_id` INT,
    `image_url` VARCHAR(255),
    `data_ai_hint` VARCHAR(100),
    `is_featured_on_marketplace` BOOLEAN DEFAULT FALSE,
    `marketplace_announcement_title` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `slug` VARCHAR(255)
);

-- Tabela de Lotes
CREATE TABLE IF NOT EXISTS `lots` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `public_id` VARCHAR(255) UNIQUE,
    `auction_id` INT,
    `number` VARCHAR(50),
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `price` DECIMAL(15, 2),
    `initial_price` DECIMAL(15, 2),
    `second_initial_price` DECIMAL(15, 2),
    `status` VARCHAR(50),
    `bids_count` INT,
    `views` INT,
    `is_featured` BOOLEAN,
    `image_url` VARCHAR(255),
    `data_ai_hint` VARCHAR(100),
    `category_id` VARCHAR(255),
    `subcategory_id` VARCHAR(255),
    `city_name` VARCHAR(100),
    `state_uf` VARCHAR(2),
    `end_date` DATETIME,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `winner_id` VARCHAR(255),
    `slug` VARCHAR(255)
);

-- Tabela de Configurações da Plataforma
CREATE TABLE IF NOT EXISTS `platform_settings` (
    `id` VARCHAR(255) PRIMARY KEY,
    `site_title` VARCHAR(255),
    `site_tagline` VARCHAR(255),
    `logo_url` VARCHAR(255),
    `favicon_url` VARCHAR(255),
    `gallery_image_base_path` VARCHAR(255),
    `storage_provider` VARCHAR(50),
    `firebase_storage_bucket` VARCHAR(255),
    `active_theme_name` VARCHAR(50),
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
    `updated_at` TIMESTAMP
);


-- Outras tabelas...
CREATE TABLE IF NOT EXISTS `states` (`id` VARCHAR(255) PRIMARY KEY, `name` VARCHAR(100), `uf` VARCHAR(2), `slug` VARCHAR(100), `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS `cities` (`id` VARCHAR(255) PRIMARY KEY, `name` VARCHAR(150), `state_id` VARCHAR(255), `ibge_code` VARCHAR(7), `slug` VARCHAR(150), `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS `sellers` (`id` INT AUTO_INCREMENT PRIMARY KEY, `public_id` VARCHAR(255), `slug` VARCHAR(255), `name` VARCHAR(255), `contact_name` VARCHAR(255), `email` VARCHAR(255), `phone` VARCHAR(20), `address` VARCHAR(255), `city` VARCHAR(100), `state` VARCHAR(100), `zip_code` VARCHAR(20), `website` VARCHAR(255), `logo_url` VARCHAR(255), `data_ai_hint_logo` VARCHAR(100), `description` TEXT, `is_judicial` BOOLEAN, `judicial_branch_id` VARCHAR(255), `created_at` TIMESTAMP, `updated_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `auctioneers` (`id` INT AUTO_INCREMENT PRIMARY KEY, `public_id` VARCHAR(255), `slug` VARCHAR(255), `name` VARCHAR(255), `registration_number` VARCHAR(50), `contact_name` VARCHAR(255), `email` VARCHAR(255), `phone` VARCHAR(20), `address` VARCHAR(255), `city` VARCHAR(100), `state` VARCHAR(100), `zip_code` VARCHAR(20), `website` VARCHAR(255), `logo_url` VARCHAR(255), `data_ai_hint_logo` VARCHAR(100), `description` TEXT, `user_id` VARCHAR(255), `created_at` TIMESTAMP, `updated_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `bids` (`id` VARCHAR(255) PRIMARY KEY, `lot_id` VARCHAR(255), `auction_id` VARCHAR(255), `bidder_id` VARCHAR(255), `bidder_display` VARCHAR(255), `amount` DECIMAL(15,2), `timestamp` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `user_wins` (`id` VARCHAR(255) PRIMARY KEY, `lot_id` VARCHAR(255), `user_id` VARCHAR(255), `winning_bid_amount` DECIMAL(15,2), `win_date` TIMESTAMP, `payment_status` VARCHAR(50), `invoice_url` VARCHAR(255));
CREATE TABLE IF NOT EXISTS `direct_sale_offers` (`id` VARCHAR(255) PRIMARY KEY, `public_id` VARCHAR(255), `title` VARCHAR(255), `description` TEXT, `offer_type` VARCHAR(50), `price` DECIMAL(15,2), `minimum_offer_price` DECIMAL(15,2), `status` VARCHAR(50), `category` VARCHAR(100), `seller_id` VARCHAR(255), `seller_name` VARCHAR(255), `location_city` VARCHAR(100), `location_state` VARCHAR(100), `image_url` VARCHAR(255), `expires_at` TIMESTAMP, `created_at` TIMESTAMP, `updated_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `reviews` (`id` VARCHAR(255) PRIMARY KEY, `lot_id` VARCHAR(255), `auction_id` VARCHAR(255), `user_id` VARCHAR(255), `user_display_name` VARCHAR(255), `rating` INT, `comment` TEXT, `created_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `lot_questions` (`id` VARCHAR(255) PRIMARY KEY, `lot_id` VARCHAR(255), `auction_id` VARCHAR(255), `user_id` VARCHAR(255), `user_display_name` VARCHAR(255), `question_text` TEXT, `answer_text` TEXT, `is_public` BOOLEAN, `answered_by_user_id` VARCHAR(255), `answered_by_user_display_name` VARCHAR(255), `created_at` TIMESTAMP, `answered_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `document_types` (`id` VARCHAR(255) PRIMARY KEY, `name` VARCHAR(255), `description` TEXT, `is_required` BOOLEAN, `applies_to` VARCHAR(50));
CREATE TABLE IF NOT EXISTS `user_documents` (`id` VARCHAR(255) PRIMARY KEY, `user_id` VARCHAR(255), `document_type_id` VARCHAR(255), `status` VARCHAR(50), `file_url` VARCHAR(255), `file_name` VARCHAR(255), `rejection_reason` TEXT, `created_at` TIMESTAMP, `updated_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `notifications` (`id` VARCHAR(255) PRIMARY KEY, `user_id` VARCHAR(255), `message` TEXT, `link` VARCHAR(255), `is_read` BOOLEAN, `created_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `user_lot_max_bids` (`id` VARCHAR(255) PRIMARY KEY, `user_id` VARCHAR(255), `lot_id` VARCHAR(255), `max_amount` DECIMAL(15,2), `is_active` BOOLEAN, `created_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `media_items` (`id` VARCHAR(255) PRIMARY KEY, `file_name` VARCHAR(255), `storage_path` VARCHAR(512), `title` VARCHAR(255), `alt_text` VARCHAR(255), `caption` VARCHAR(512), `description` TEXT, `mime_type` VARCHAR(100), `size_bytes` INT, `url_original` VARCHAR(512), `url_thumbnail` VARCHAR(512), `url_medium` VARCHAR(512), `url_large` VARCHAR(512), `linked_lot_ids` JSON, `data_ai_hint` VARCHAR(100), `uploaded_by` VARCHAR(255), `uploaded_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `courts` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(255), `slug` VARCHAR(255), `state_uf` VARCHAR(2), `website` VARCHAR(255), `created_at` TIMESTAMP, `updated_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `judicial_districts` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(255), `slug` VARCHAR(255), `court_id` INT, `state_id` VARCHAR(255), `zip_code` VARCHAR(10), `created_at` TIMESTAMP, `updated_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `judicial_branches` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(255), `slug` VARCHAR(255), `district_id` INT, `contact_name` VARCHAR(255), `phone` VARCHAR(20), `email` VARCHAR(255), `created_at` TIMESTAMP, `updated_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `judicial_processes` (`id` INT AUTO_INCREMENT PRIMARY KEY, `public_id` VARCHAR(255), `process_number` VARCHAR(100), `is_electronic` BOOLEAN, `court_id` INT, `district_id` INT, `branch_id` INT, `seller_id` INT, `created_at` TIMESTAMP, `updated_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `judicial_parties` (`id` INT AUTO_INCREMENT PRIMARY KEY, `process_id` INT, `name` VARCHAR(255), `document_number` VARCHAR(50), `party_type` VARCHAR(50));
CREATE TABLE IF NOT EXISTS `bens` (`id` INT AUTO_INCREMENT PRIMARY KEY, `public_id` VARCHAR(255), `title` VARCHAR(255), `description` TEXT, `status` VARCHAR(50), `category_id` VARCHAR(255), `subcategory_id` VARCHAR(255), `judicial_process_id` INT, `seller_id` INT, `evaluation_value` DECIMAL(15,2), `image_url` VARCHAR(255), `image_media_id` VARCHAR(255), `gallery_image_urls` JSON, `media_item_ids` JSON, `data_ai_hint` VARCHAR(100), `location_city` VARCHAR(100), `location_state` VARCHAR(100), `address` VARCHAR(255), `latitude` DECIMAL(10,8), `longitude` DECIMAL(11,8), `created_at` TIMESTAMP, `updated_at` TIMESTAMP, `plate` VARCHAR(10), `make` VARCHAR(50), `model` VARCHAR(50), `version` VARCHAR(100), `year` INT, `model_year` INT, `mileage` INT, `color` VARCHAR(30), `fuel_type` VARCHAR(30), `transmission_type` VARCHAR(30), `body_type` VARCHAR(50), `vin` VARCHAR(17), `renavam` VARCHAR(11), `engine_power` VARCHAR(50), `number_of_doors` INT, `vehicle_options` TEXT, `detran_status` VARCHAR(100), `debts` TEXT, `running_condition` VARCHAR(100), `body_condition` VARCHAR(100), `tires_condition` VARCHAR(100), `has_key` BOOLEAN, `property_registration_number` VARCHAR(50), `iptu_number` VARCHAR(50), `is_occupied` BOOLEAN, `total_area` DECIMAL(15,2), `built_area` DECIMAL(15,2), `bedrooms` INT, `suites` INT, `bathrooms` INT, `parking_spaces` INT, `construction_type` VARCHAR(100), `finishes` TEXT, `infrastructure` TEXT, `condo_details` TEXT, `improvements` TEXT, `topography` VARCHAR(100), `liens_and_encumbrances` TEXT, `property_debts` TEXT, `unregistered_records` TEXT, `has_habite_se` BOOLEAN, `zoning_restrictions` VARCHAR(200), `amenities` JSON);
CREATE TABLE IF NOT EXISTS `lot_bens` (`lot_id` INT, `bem_id` INT, PRIMARY KEY (`lot_id`, `bem_id`));
CREATE TABLE IF NOT EXISTS `document_templates` (`id` VARCHAR(255) PRIMARY KEY, `name` VARCHAR(255), `type` VARCHAR(50), `content` LONGTEXT, `created_at` TIMESTAMP, `updated_at` TIMESTAMP);
CREATE TABLE IF NOT EXISTS `contact_messages` (`id` INT AUTO_INCREMENT PRIMARY KEY, `name` VARCHAR(255), `email` VARCHAR(255), `subject` VARCHAR(255), `message` TEXT, `is_read` BOOLEAN DEFAULT FALSE, `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP);