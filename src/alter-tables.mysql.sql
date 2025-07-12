-- Este script contém alterações de tabela para serem aplicadas após a criação inicial do schema.
-- Adicionar colunas de logo e favicon à tabela de configurações da plataforma.

ALTER TABLE `platform_settings` ADD COLUMN `logo_url` VARCHAR(2048) NULL;
ALTER TABLE `platform_settings` ADD COLUMN `favicon_url` VARCHAR(2048) NULL;
