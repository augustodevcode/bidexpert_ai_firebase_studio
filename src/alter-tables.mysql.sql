-- src/alter-tables.mysql.sql
-- Este script contém comandos ALTER TABLE para atualizar um schema existente.
-- Ele foi projetado para ser executado várias vezes sem causar erros.

-- Adiciona a coluna parent_category_id na tabela de subcategorias se ela não existir.
ALTER TABLE `subcategories` ADD COLUMN IF NOT EXISTS `parent_category_id` VARCHAR(255);

-- Adiciona a coluna display_order na tabela de subcategorias se ela não existir.
ALTER TABLE `subcategories` ADD COLUMN IF NOT EXISTS `display_order` INT DEFAULT 0;

-- Adiciona colunas de ícone na tabela de categorias de lote se elas não existirem.
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `icon_name` VARCHAR(50);
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `data_ai_hint_icon` VARCHAR(50);
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `cover_image_url` VARCHAR(255);
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `mega_menu_image_url` VARCHAR(255);
ALTER TABLE `lot_categories` ADD COLUMN IF NOT EXISTS `has_subcategories` BOOLEAN DEFAULT FALSE;

-- Adiciona colunas para logos/favicons nas configurações da plataforma se elas não existirem.
ALTER TABLE `platform_settings` ADD COLUMN IF NOT EXISTS `logo_url` VARCHAR(255);
ALTER TABLE `platform_settings` ADD COLUMN IF NOT EXISTS `favicon_url` VARCHAR(255);
