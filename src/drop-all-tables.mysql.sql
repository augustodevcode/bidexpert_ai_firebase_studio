-- drop-all-tables.mysql.sql
-- Script para remover todas as tabelas na ordem inversa de dependência.
-- Útil para uma reinicialização limpa do banco de dados de desenvolvimento.

-- Desativa a verificação de chaves estrangeiras para evitar erros de ordem
SET FOREIGN_KEY_CHECKS = 0;

-- Nível 7: Tabelas de Junção e Dependentes Finais
DROP TABLE IF EXISTS `lot_bens`;
DROP TABLE IF EXISTS `bids`;
DROP TABLE IF EXISTS `user_wins`;
DROP TABLE IF EXISTS `user_lot_max_bids`;
DROP TABLE IF EXISTS `lot_reviews`;
DROP TABLE IF EXISTS `lot_questions`;
DROP TABLE IF EXISTS `notifications`;

-- Nível 6: Dependem dos Níveis 1-5
DROP TABLE IF EXISTS `lots`;

-- Nível 5: Quarta dependência
DROP TABLE IF EXISTS `auctions`;
DROP TABLE IF EXISTS `bens`;
DROP TABLE IF EXISTS `judicial_parties`;
DROP TABLE IF EXISTS `judicial_processes`;
DROP TABLE IF EXISTS `user_documents`;
DROP TABLE IF EXISTS `direct_sale_offers`;

-- Nível 4: Terceira dependência
DROP TABLE IF EXISTS `sellers`;
DROP TABLE IF EXISTS `auctioneers`;
DROP TABLE IF EXISTS `media_items`;

-- Nível 3: Segunda dependência
DROP TABLE IF EXISTS `judicial_branches`;
DROP TABLE IF EXISTS `users`;

-- Nível 2: Primeira dependência
DROP TABLE IF EXISTS `cities`;
DROP TABLE IF EXISTS `subcategories`;
DROP TABLE IF EXISTS `judicial_districts`;

-- Nível 1: Independentes
DROP TABLE IF EXISTS `platform_settings`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `states`;
DROP TABLE IF EXISTS `lot_categories`;
DROP TABLE IF EXISTS `document_templates`;
DROP TABLE IF EXISTS `contact_messages`;
DROP TABLE IF EXISTS `document_types`;
DROP TABLE IF EXISTS `courts`;

-- Reativa a verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;
