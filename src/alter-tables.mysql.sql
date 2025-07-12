-- src/alter-tables.mysql.sql

-- Adiciona a coluna parent_category_id à tabela subcategories, se ela não existir.
ALTER TABLE `subcategories` ADD COLUMN `parent_category_id` VARCHAR(255);
ALTER TABLE `subcategories` ADD COLUMN `display_order` INT DEFAULT 0;

-- Adiciona as colunas de imagem e ícone à tabela lot_categories, se não existirem.
ALTER TABLE `lot_categories` ADD COLUMN `icon_name` VARCHAR(255);
ALTER TABLE `lot_categories` ADD COLUMN `data_ai_hint_icon` VARCHAR(255);
ALTER TABLE `lot_categories` ADD COLUMN `cover_image_url` VARCHAR(255);
ALTER TABLE `lot_categories` ADD COLUMN `mega_menu_image_url` VARCHAR(255);
ALTER TABLE `lot_categories` ADD COLUMN `has_subcategories` BOOLEAN DEFAULT FALSE;

-- Adiciona as colunas de URL de logo e favicon à tabela de configurações, se não existirem.
ALTER TABLE `platform_settings` ADD COLUMN `favicon_url` VARCHAR(255);
ALTER TABLE `platform_settings` ADD COLUMN `logo_url` VARCHAR(255);
