# Plan for Converting All ID Fields to BigInt with Autoincrement

## Overview
This document outlines the steps required to convert all ID fields in the Prisma schema from String (using cuid()) to BigInt with autoincrement. This is a major architectural change that affects the entire application.

## Prisma Schema Changes (COMPLETED)
- All `id` fields in models have been changed from `String @id @default(cuid())` to `BigInt @id @default(autoincrement())`
- All foreign key fields referencing these IDs have been updated from `String` to `BigInt`
- The Prisma client has been successfully generated

## Database Migration (PENDING)
The database needs to be updated to match the new schema. This requires:

### Approach 1: Shadow Database (Recommended for Production)
1. Create a shadow database with the new schema
2. Migrate data from the old database to the new one
3. Update all foreign key references
4. Switch to the new database

### Approach 2: In-Place Migration (For Development)
1. Disable foreign key checks
2. Modify each table to change ID columns to BIGINT AUTO_INCREMENT
3. Update all foreign key references
4. Re-enable foreign key checks

### Migration Script Example
```sql
-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- For each table, modify the ID column
ALTER TABLE `User` DROP PRIMARY KEY, 
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
```

## Application Code Changes (IN PROGRESS)

### 1. Update Type Definitions
- Update all type definitions in `src/types/index.ts` to use `bigint` instead of `string` for ID fields
- Update related types like `UserCreationData`, `EditableUserProfileData`, etc.

### 2. Update Services
- Update all service classes to handle `bigint` IDs instead of `string` IDs
- Examples: `UserService`, `AssetService`, `AuctionService`, etc.

### 3. Update Repositories
- Update all repository classes to handle `bigint` IDs
- Examples: `UserRepository`, `AssetRepository`, `AuctionRepository`, etc.

### 4. Update Controllers/API Routes
- Update all API routes to handle `bigint` IDs in request parameters and responses

### 5. Update Frontend Components
- Update all frontend components that display or manipulate IDs
- Update form handling and validation

### 6. Update Seed Scripts
- Update seed scripts to work with `bigint` IDs
- Update data generation logic

## Files That Need to Be Updated

### Core Services and Repositories
1. `src/services/user.service.ts` - Update method signatures to use `bigint`
2. `src/repositories/user.repository.ts` - Update method signatures to use `bigint`
3. `src/services/tenant.service.ts` - Update method signatures to use `bigint`
4. `src/repositories/tenant.repository.ts` - Update method signatures to use `bigint`
5. `src/services/role.service.ts` - Update method signatures to use `bigint`
6. `src/repositories/role.repository.ts` - Update method signatures to use `bigint`

### Asset Management Services
7. `src/services/asset.service.ts` - Update method signatures to use `bigint`
8. `src/repositories/asset.repository.ts` - Update method signatures to use `bigint`
9. `src/services/category.service.ts` - Update method signatures to use `bigint`
10. `src/repositories/category.repository.ts` - Update method signatures to use `bigint`
11. `src/services/subcategory.service.ts` - Update method signatures to use `bigint`
12. `src/repositories/subcategory.repository.ts` - Update method signatures to use `bigint`

### Auction Services
13. `src/services/auction.service.ts` - Update method signatures to use `bigint`
14. `src/repositories/auction.repository.ts` - Update method signatures to use `bigint`
15. `src/services/lot.service.ts` - Update method signatures to use `bigint`
16. `src/repositories/lot.repository.ts` - Update method signatures to use `bigint`
17. `src/services/bid.service.ts` - Update method signatures to use `bigint`
18. `src/repositories/bid.repository.ts` - Update method signatures to use `bigint`

### User Management Services
19. `src/services/user-win.service.ts` - Update method signatures to use `bigint`
20. `src/repositories/user-win.repository.ts` - Update method signatures to use `bigint`
21. `src/services/user-document.service.ts` - Update method signatures to use `bigint`
22. `src/repositories/user-document.repository.ts` - Update method signatures to use `bigint`

### Location Services
23. `src/services/city.service.ts` - Update method signatures to use `bigint`
24. `src/repositories/city.repository.ts` - Update method signatures to use `bigint`
25. `src/services/state.service.ts` - Update method signatures to use `bigint`
26. `src/repositories/state.repository.ts` - Update method signatures to use `bigint`

### Judicial Services
27. `src/services/judicial-process.service.ts` - Update method signatures to use `bigint`
28. `src/repositories/judicial-process.repository.ts` - Update method signatures to use `bigint`
29. `src/services/court.service.ts` - Update method signatures to use `bigint`
30. `src/repositories/court.repository.ts` - Update method signatures to use `bigint`

### Participant Services
31. `src/services/seller.service.ts` - Update method signatures to use `bigint`
32. `src/repositories/seller.repository.ts` - Update method signatures to use `bigint`
33. `src/services/auctioneer.service.ts` - Update method signatures to use `bigint`
34. `src/repositories/auctioneer.repository.ts` - Update method signatures to use `bigint`

### Media and Document Services
35. `src/services/media.service.ts` - Update method signatures to use `bigint`
36. `src/repositories/media.repository.ts` - Update method signatures to use `bigint`
37. `src/services/document-type.service.ts` - Update method signatures to use `bigint`
38. `src/repositories/document-type.repository.ts` - Update method signatures to use `bigint`

### Payment Services
39. `src/services/installment-payment.service.ts` - Update method signatures to use `bigint`
40. `src/repositories/installment-payment.repository.ts` - Update method signatures to use `bigint`

### Notification Services
41. `src/services/notification.service.ts` - Update method signatures to use `bigint`
42. `src/repositories/notification.repository.ts` - Update method signatures to use `bigint`

### Vehicle Services
43. `src/services/vehicle-make.service.ts` - Update method signatures to use `bigint`
44. `src/repositories/vehicle-make.repository.ts` - Update method signatures to use `bigint`
45. `src/services/vehicle-model.service.ts` - Update method signatures to use `bigint`
46. `src/repositories/vehicle-model.repository.ts` - Update method signatures to use `bigint`

### Platform Services
47. `src/services/platform-settings.service.ts` - Update method signatures to use `bigint`
48. `src/repositories/platform-settings.repository.ts` - Update method signatures to use `bigint`

### Types
49. `src/types/index.ts` - Update all type definitions to use `bigint` for ID fields

### Seed Scripts
50. `scripts/seed-data-extended.ts` - Update to work with `bigint` IDs
51. `scripts/seed-data-quick-test.ts` - Update to work with `bigint` IDs

## Testing Strategy

### 1. Unit Tests
- Update all unit tests to work with `bigint` IDs
- Ensure all service methods work correctly

### 2. Integration Tests
- Test database operations with the new schema
- Test API endpoints with `bigint` IDs

### 3. End-to-End Tests
- Test the complete user flow with `bigint` IDs
- Verify all CRUD operations work correctly

## Rollback Plan

### 1. Database Rollback
- Keep a backup of the original database
- Have a migration script to revert changes if needed

### 2. Code Rollback
- Use version control to revert code changes if needed
- Have a testing environment to validate rollback

## Timeline

### Phase 1: Type Definitions and Core Services (2 days)
- Update type definitions
- Update core service classes (User, Role, Tenant)

### Phase 2: Remaining Services and Repositories (3 days)
- Update all remaining service classes
- Update all repository classes

### Phase 3: API Routes and Frontend (2 days)
- Update API routes
- Update frontend components

### Phase 4: Testing and Validation (2 days)
- Run unit tests
- Run integration tests
- Run end-to-end tests

### Phase 5: Database Migration (1 day)
- Execute database migration
- Validate data integrity

## Risks and Mitigations

### 1. Data Loss Risk
- Mitigation: Full database backup before migration

### 2. Downtime Risk
- Mitigation: Plan migration during low-traffic periods

### 3. Compatibility Risk
- Mitigation: Thorough testing in staging environment

### 4. Performance Risk
- Mitigation: Monitor performance after migration

## Next Steps

1. Update type definitions in `src/types/index.ts`
2. Update the `UserService` and `UserRepository` classes
3. Create a comprehensive test plan
4. Set up a staging environment for testing