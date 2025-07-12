-- Script para remover todas as tabelas do banco de dados BidExpert na ordem correta de dependência.
-- Execute com cuidado, pois esta ação é IRREVERSÍVEL.

SET FOREIGN_KEY_CHECKS = 0; -- Desabilita a verificação de chaves estrangeiras para evitar erros de ordem.

DROP TABLE IF EXISTS `user_lot_max_bids`;
DROP TABLE IF EXISTS `user_wins`;
DROP TABLE IF EXISTS `bids`;
DROP TABLE IF EXISTS `lot_bens`;
DROP TABLE IF EXISTS `lots`;
DROP TABLE IF EXISTS `direct_sale_offers`;
DROP TABLE IF EXISTS `user_documents`;
DROP TABLE IF EXISTS `auctions`;
DROP TABLE IF EXISTS `bens`;
DROP TABLE IF EXISTS `judicial_parties`;
DROP TABLE IF EXISTS `judicial_processes`;
DROP TABLE IF EXISTS `media_items`;
DROP TABLE IF EXISTS `auctioneers`;
DROP TABLE IF EXISTS `sellers`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `judicial_branches`;
DROP TABLE IF EXISTS `judicial_districts`;
DROP TABLE IF EXISTS `courts`;
DROP TABLE IF EXISTS `subcategories`;
DROP TABLE IF EXISTS `cities`;
DROP TABLE IF EXISTS `document_types`;
DROP TABLE IF EXISTS `contact_messages`;
DROP TABLE IF EXISTS `document_templates`;
DROP TABLE IF EXISTS `lot_categories`;
DROP TABLE IF EXISTS `states`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `platform_settings`;

SET FOREIGN_KEY_CHECKS = 1; -- Reabilita a verificação de chaves estrangeiras.

-- Fim do Script
