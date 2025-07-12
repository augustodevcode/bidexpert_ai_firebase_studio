-- src/alter-tables.mysql.sql
-- Este arquivo conterá os comandos ALTER TABLE para atualizar um schema existente.
-- Executar apenas uma vez por atualização se o banco já existir.

ALTER TABLE `lot_categories` ADD COLUMN `has_subcategories` BOOLEAN DEFAULT FALSE;
ALTER TABLE `subcategories` ADD COLUMN `display_order` INT DEFAULT 0;
ALTER TABLE `platform_settings` ADD COLUMN `favicon_url` VARCHAR(255);
ALTER TABLE `platform_settings` ADD COLUMN `logo_url` VARCHAR(255);
ALTER TABLE `platform_settings` ADD COLUMN `site_tagline` VARCHAR(255);
