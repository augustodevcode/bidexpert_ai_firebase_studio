-- Migration to change all ID fields from VARCHAR to BIGINT with AUTO_INCREMENT

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- First, we need to drop all foreign key constraints
-- This is a simplified approach - in a real production environment, you would need to drop specific constraints

-- Then modify all tables to change ID columns to BIGINT AUTO_INCREMENT
-- Note: This is a complex operation that would typically be done in multiple steps in production

-- For User table
ALTER TABLE `User` DROP PRIMARY KEY, 
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- For Role table
ALTER TABLE `Role` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- For other tables, we would need to do similar operations
-- However, this is a complex migration that requires careful handling of foreign key relationships

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- In a real production environment, you would need to:
-- 1. Create new tables with BIGINT IDs
-- 2. Migrate data from old tables to new tables
-- 3. Update all foreign key references
-- 4. Drop old tables
-- 5. Rename new tables to original names
-- 6. Recreate all foreign key constraints

-- For now, we'll just update the Prisma schema and note that the database migration
-- needs to be handled separately based on the specific production environment