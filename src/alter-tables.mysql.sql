-- Este arquivo contém comandos ALTER TABLE para atualizar um schema existente.
-- Pode ser executado com segurança, pois verifica a existência das colunas antes de adicioná-las.
-- A recomendação, no entanto, é apagar e recriar o banco com o schema.mysql.sql atualizado.

-- Adiciona a coluna site_title se ela não existir
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS site_title VARCHAR(255);

-- Adiciona a coluna created_at se ela não existir
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Outras alterações podem ser adicionadas aqui no futuro para migrações.
