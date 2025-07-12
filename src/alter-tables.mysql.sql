-- src/alter-tables.mysql.sql
-- Este arquivo contém alterações no schema que podem ser aplicadas a uma base de dados já existente.

-- Adiciona a coluna para vincular subcategorias à sua categoria principal.
ALTER TABLE `subcategories` ADD COLUMN `parent_category_id` VARCHAR(255) NOT NULL;

-- Adiciona colunas de URL para logo e favicon nas configurações da plataforma.
ALTER TABLE `platform_settings` ADD COLUMN `logo_url` VARCHAR(255) NULL;
ALTER TABLE `platform_settings` ADD COLUMN `favicon_url` VARCHAR(255) NULL;
