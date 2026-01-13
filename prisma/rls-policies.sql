-- Enable RLS on tables
ALTER TABLE "Lot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bid" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- Add other tables as needed

-- Create Policy for Tenant Isolation
-- Only allows access if the row's tenantId matches the current session tenant_id
CREATE POLICY tenant_isolation_policy ON "Lot"
    USING ("tenantId" = current_setting('app.current_tenant_id')::bigint);

CREATE POLICY tenant_isolation_policy ON "Bid"
    USING ("tenantId" = current_setting('app.current_tenant_id')::bigint);

CREATE POLICY tenant_isolation_policy ON "User"
    USING ("id" = current_setting('app.current_user_id')::bigint OR "tenantId" = current_setting('app.current_tenant_id')::bigint);

-- Grant access to the database user (e.g., 'postgres' or 'app_user')
-- Ensure they can leverage RLS bypass if needed, or stick to strict RLS.
-- FORCE RLS for the table owner as well if needed:
-- ALTER TABLE "Lot" FORCE ROW LEVEL SECURITY;
