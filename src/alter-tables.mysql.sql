-- src/alter-tables.mysql.sql
-- Este script contém comandos ALTER TABLE para atualizar o schema existente sem apagar dados.
-- É útil para desenvolvimento quando o schema principal muda.

ALTER TABLE `platform_settings`
ADD COLUMN IF NOT EXISTS `logo_url` VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `favicon_url` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `subcategories`
ADD COLUMN IF NOT EXISTS `parent_category_id` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `lot_categories`
ADD COLUMN IF NOT EXISTS `icon_name` VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `data_ai_hint_icon` VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `cover_image_url` VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `data_ai_hint_cover` VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `mega_menu_image_url` VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `data_ai_hint_mega_menu` VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `has_subcategories` BOOLEAN DEFAULT FALSE;

ALTER TABLE `auctions`
ADD COLUMN IF NOT EXISTS `image_media_id` VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `judicial_process_id` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `lots`
ADD COLUMN IF NOT EXISTS `image_media_id` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `seller_id` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `sellers`
ADD COLUMN IF NOT EXISTS `is_judicial` BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS `judicial_branch_id` VARCHAR(255) DEFAULT NULL;

ALTER TABLE `bens`
ADD COLUMN IF NOT EXISTS `amenities` JSON DEFAULT NULL;
