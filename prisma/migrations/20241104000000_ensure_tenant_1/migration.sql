-- Garante que o tenant com ID 1 exista
INSERT INTO `Tenant` (id, name, slug, status, createdAt, updatedAt)
VALUES (1, 'BidExpert Platform', 'bidexpert', 'ATIVO', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
name = VALUES(name), 
slug = VALUES(slug), 
status = VALUES(status), 
updatedAt = NOW();

