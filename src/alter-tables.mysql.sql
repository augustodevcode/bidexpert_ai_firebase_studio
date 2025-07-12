-- /src/alter-tables.mysql.sql

-- Adiciona a coluna parent_category_id na tabela subcategories, se não existir
ALTER TABLE `subcategories` ADD COLUMN IF NOT EXISTS `parent_category_id` VARCHAR(255) NOT NULL AFTER `slug`;
ALTER TABLE `platform_settings` ADD COLUMN IF NOT EXISTS `logo_url` VARCHAR(255) NULL AFTER `site_tagline`;
ALTER TABLE `platform_settings` ADD COLUMN IF NOT EXISTS `favicon_url` VARCHAR(255) NULL AFTER `logo_url`;

ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `icon_name` VARCHAR(255) NULL AFTER `has_subcategories`;
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `data_ai_hint_icon` VARCHAR(255) NULL AFTER `icon_name`;
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `cover_image_url` VARCHAR(255) NULL AFTER `data_ai_hint_icon`;
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `cover_image_media_id` VARCHAR(255) NULL AFTER `cover_image_url`;
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `data_ai_hint_cover` VARCHAR(255) NULL AFTER `cover_image_media_id`;
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `mega_menu_image_url` VARCHAR(255) NULL AFTER `data_ai_hint_cover`;
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `mega_menu_image_media_id` VARCHAR(255) NULL AFTER `mega_menu_image_url`;
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `data_ai_hint_mega_menu` VARCHAR(255) NULL AFTER `mega_menu_image_media_id`;

    