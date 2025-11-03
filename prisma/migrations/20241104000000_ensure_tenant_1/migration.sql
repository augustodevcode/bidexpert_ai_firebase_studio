-- Garante que o tenant com ID 1 exista
INSERT INTO "Tenant" (id, name, slug, status, createdAt, updatedAt)
VALUES (1, 'BidExpert Platform', 'bidexpert', 'ATIVO', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    slug = EXCLUDED.slug, 
    status = EXCLUDED.status, 
    updatedAt = NOW();

-- Atualiza todas as tabelas para usar tenantId = 1 onde for NULL
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT table_schema, table_name, column_name 
        FROM information_schema.columns 
        WHERE column_name = 'tenantId' 
        AND table_schema = 'public'
        AND table_name != 'Tenant'
    LOOP
        EXECUTE format('UPDATE %I.%I SET "%s" = 1 WHERE "%s" IS NULL', 
                      r.table_schema, r.table_name, r.column_name, r.column_name);
    END LOOP;
END $$;
