-- MySQL ALTER TABLE Script
-- Use este script para atualizar um banco de dados existente que foi criado com uma versão incompleta do schema.

-- Adiciona as colunas faltantes na tabela `courts`
ALTER TABLE `courts`
  ADD COLUMN `slug` VARCHAR(150),
  ADD COLUMN `website` VARCHAR(255),
  ADD COLUMN `createdAt` DATETIME,
  ADD COLUMN `updatedAt` DATETIME;

-- Adiciona as colunas faltantes na tabela `judicial_districts`
ALTER TABLE `judicial_districts`
  ADD COLUMN `courtId` VARCHAR(100),
  ADD COLUMN `stateId` VARCHAR(100),
  ADD COLUMN `createdAt` DATETIME,
  ADD COLUMN `updatedAt` DATETIME,
  ADD CONSTRAINT `fk_district_court` FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  ADD CONSTRAINT `fk_district_state` FOREIGN KEY (`stateId`) REFERENCES `states`(`id`);

-- Adiciona as colunas faltantes na tabela `judicial_branches`
ALTER TABLE `judicial_branches`
  ADD COLUMN `districtId` VARCHAR(100),
  ADD COLUMN `contactName` VARCHAR(150),
  ADD COLUMN `phone` VARCHAR(20),
  ADD COLUMN `email` VARCHAR(100),
  ADD COLUMN `createdAt` DATETIME,
  ADD COLUMN `updatedAt` DATETIME,
  ADD CONSTRAINT `fk_branch_district` FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`);

-- Adiciona as colunas faltantes na tabela `judicial_processes`
ALTER TABLE `judicial_processes`
  ADD COLUMN `courtId` VARCHAR(100),
  ADD COLUMN `districtId` VARCHAR(100),
  ADD COLUMN `branchId` VARCHAR(100),
  ADD COLUMN `sellerId` VARCHAR(100),
  ADD CONSTRAINT `fk_process_court` FOREIGN KEY (`courtId`) REFERENCES `courts`(`id`),
  ADD CONSTRAINT `fk_process_district` FOREIGN KEY (`districtId`) REFERENCES `judicial_districts`(`id`),
  ADD CONSTRAINT `fk_process_branch` FOREIGN KEY (`branchId`) REFERENCES `judicial_branches`(`id`),
  ADD CONSTRAINT `fk_process_seller` FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE SET NULL;

-- Adiciona a chave estrangeira na tabela `judicial_parties`
ALTER TABLE `judicial_parties`
  ADD CONSTRAINT `fk_party_process` FOREIGN KEY (`process_id`) REFERENCES `judicial_processes`(`id`) ON DELETE CASCADE;

-- Adiciona as chaves estrangeiras na tabela `bens`
ALTER TABLE `bens`
  ADD CONSTRAINT `fk_bem_category` FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`),
  ADD CONSTRAINT `fk_bem_subcategory` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`),
  ADD CONSTRAINT `fk_bem_process` FOREIGN KEY (`judicialProcessId`) REFERENCES `judicial_processes`(`id`),
  ADD CONSTRAINT `fk_bem_seller` FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`);

-- Adiciona a chave estrangeira na tabela `lot_bens`
ALTER TABLE `lot_bens`
  ADD CONSTRAINT `fk_lotbens_lot` FOREIGN KEY (`lotId`) REFERENCES `lots`(`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_lotbens_bem` FOREIGN KEY (`bemId`) REFERENCES `bens`(`id`) ON DELETE CASCADE;

-- Adiciona a chave estrangeira na tabela `user_documents`
-- Corrigindo a referência para users.id
ALTER TABLE `user_documents`
  ADD CONSTRAINT `fk_userdoc_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_userdoc_doctype` FOREIGN KEY (`documentTypeId`) REFERENCES `document_types`(`id`);

-- Adiciona chaves estrangeiras faltantes em outras tabelas se necessário (exemplo)
ALTER TABLE `auctions`
  ADD CONSTRAINT `fk_auction_auctioneer` FOREIGN KEY (`auctioneerId`) REFERENCES `auctioneers`(`id`),
  ADD CONSTRAINT `fk_auction_seller` FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`);

ALTER TABLE `lots`
  ADD CONSTRAINT `fk_lot_auction` FOREIGN KEY (`auctionId`) REFERENCES `auctions`(`id`),
  ADD CONSTRAINT `fk_lot_category` FOREIGN KEY (`categoryId`) REFERENCES `lot_categories`(`id`);

SELECT 'Script de alteração concluído.' AS status;
