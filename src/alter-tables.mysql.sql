-- src/alter-tables.mysql.sql
-- Este arquivo contém alterações no schema que podem ser aplicadas a um banco de dados existente.

ALTER TABLE `platform_settings`
ADD COLUMN `logo_url` VARCHAR(255) NULL AFTER `site_tagline`,
ADD COLUMN `favicon_url` VARCHAR(255) NULL AFTER `logo_url`;

ALTER TABLE `subcategories`
ADD COLUMN `parent_category_id` VARCHAR(255) NOT NULL AFTER `slug`;

ALTER TABLE `lot_categories`
ADD COLUMN `icon_name` VARCHAR(100) NULL AFTER `has_subcategories`,
ADD COLUMN `data_ai_hint_icon` VARCHAR(100) NULL AFTER `icon_name`,
ADD COLUMN `cover_image_url` VARCHAR(255) NULL AFTER `data_ai_hint_icon`,
ADD COLUMN `cover_image_media_id` VARCHAR(255) NULL AFTER `cover_image_url`,
ADD COLUMN `data_ai_hint_cover` VARCHAR(100) NULL AFTER `cover_image_media_id`,
ADD COLUMN `mega_menu_image_url` VARCHAR(255) NULL AFTER `data_ai_hint_cover`,
ADD COLUMN `mega_menu_image_media_id` VARCHAR(255) NULL AFTER `mega_menu_image_url`,
ADD COLUMN `data_ai_hint_mega_menu` VARCHAR(100) NULL AFTER `mega_menu_image_media_id`;
