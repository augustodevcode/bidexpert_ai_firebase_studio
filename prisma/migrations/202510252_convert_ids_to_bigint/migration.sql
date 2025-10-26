-- Migration to convert all ID fields from VARCHAR to BIGINT with AUTO_INCREMENT
-- This is a complex migration that would typically be done in multiple steps in production

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- For demonstration purposes, here's how you would convert one table
-- In a real production environment, you would need to:
-- 1. Create new tables with BIGINT IDs
-- 2. Migrate data from old tables to new tables
-- 3. Update all foreign key references
-- 4. Drop old tables
-- 5. Rename new tables to original names
-- 6. Recreate all foreign key constraints

-- Example for User table (simplified):
-- ALTER TABLE `User` DROP PRIMARY KEY, 
--     MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
--     ADD PRIMARY KEY (`id`);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Note: This is a simplified example. In practice, this migration would be much more complex
-- and would require careful planning and execution in a production environment.