-- Este arquivo contém comandos ALTER TABLE para atualizar um schema existente.
-- Ele deve ser escrito de forma a poder ser executado múltiplas vezes sem causar erros (idempotente).

ALTER TABLE `lot_categories`
  ADD COLUMN IF NOT EXISTS `has_subcategories` BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS `icon_name` VARCHAR(50),
  ADD COLUMN IF NOT EXISTS `data_ai_hint_icon` VARCHAR(100),
  ADD COLUMN IF NOT EXISTS `cover_image_url` VARCHAR(255),
  ADD COLUMN IF NOT EXISTS `mega_menu_image_url` VARCHAR(255);

ALTER TABLE `subcategories`
  ADD COLUMN IF NOT EXISTS `parent_category_id` VARCHAR(255),
  ADD COLUMN IF NOT EXISTS `display_order` INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `icon_url` VARCHAR(255),
  ADD COLUMN IF NOT EXISTS `icon_media_id` VARCHAR(255),
  ADD COLUMN IF NOT EXISTS `data_ai_hint_icon` VARCHAR(100);
  
ALTER TABLE `platform_settings`
    ADD COLUMN IF NOT EXISTS `logo_url` VARCHAR(255),
    ADD COLUMN IF NOT EXISTS `favicon_url` VARCHAR(255);

-- Adiciona a chave estrangeira se ela não existir
SET @constraint_name = 'subcategories_ibfk_1';
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints
     WHERE `TABLE_SCHEMA` = DATABASE()
       AND `TABLE_NAME` = 'subcategories'
       AND `CONSTRAINT_NAME` = @constraint_name
       AND `CONSTRAINT_TYPE` = 'FOREIGN KEY') = 0,
    'ALTER TABLE `subcategories` ADD CONSTRAINT `subcategories_ibfk_1` FOREIGN KEY (`parent_category_id`) REFERENCES `lot_categories`(`id`) ON DELETE CASCADE;',
    'SELECT "Chave estrangeira já existe." AS status;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```