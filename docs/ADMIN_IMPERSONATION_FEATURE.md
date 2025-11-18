# Admin Impersonation Feature - Lawyer Dashboard

## Overview

This feature allows administrators to view the lawyer dashboard as if they were logged in as a specific lawyer. This is similar to the "Painel do Comitente" (Consignor Panel) where administrators can select a consignor to see their view.

## Implementation Details

### 1. Services

#### `AdminImpersonationService` (`src/services/admin-impersonation.service.ts`)

This service handles all admin impersonation logic:

- **`isAdmin(userId: string)`**: Checks if a user has admin permissions
- **`getImpersonatableLawyers(adminUserId: string)`**: Returns a list of lawyers that can be impersonated, including:
  - User ID, name, email, CPF
  - Count of active cases for each lawyer
- **`canImpersonate(adminUserId: string, targetUserId: string)`**: Validates if an admin can impersonate a specific user

### 2. Actions

#### Updated `src/app/lawyer/dashboard/actions.ts`

- **`getLawyerDashboardOverviewAction(userId, impersonateUserId?)`**: 
  - Modified to accept optional `impersonateUserId` parameter
  - Validates admin permissions before allowing impersonation
  - Returns dashboard data for the target lawyer

- **`getImpersonatableLawyersAction()`**: 
  - New action to fetch list of lawyers for the impersonation selector
  - Only accessible by administrators

### 3. Components

#### `LawyerImpersonationSelector` (`src/app/lawyer/dashboard/lawyer-impersonation-selector.tsx`)

A client component that:
- Displays a dropdown selector for administrators
- Shows list of lawyers with their active cases count
- Allows selection of "My own panel" or any lawyer
- Shows visual indication when viewing as admin
- Hidden for non-admin users

### 4. UI Updates

#### Updated `src/app/lawyer/dashboard/page.tsx`

- Added state management for `impersonatedLawyerId`
- Conditionally renders `LawyerImpersonationSelector` for admin users
- Refetches dashboard data when impersonated lawyer changes
- Maintains all existing functionality

### 5. Type Fixes

#### Updated `src/types/lawyer-dashboard.ts`

Fixed type definitions to allow null values:
- `LawyerCaseSummary.updatedAt`: Changed from `Date` to `Date | null`
- `LawyerDocumentSummary.updatedAt`: Changed from `Date` to `Date | null`

#### Updated `src/services/lawyer-dashboard.service.ts`

Fixed TypeScript errors:
- Corrected `tenantId` type conversion to `BigInt`
- Added proper type annotations for array methods
- Fixed property access issues with Prisma relations
- Removed references to non-existent `LawyerDocumentStatus` type

## Testing

### E2E Tests (`tests/e2e/admin/lawyer-impersonation.spec.ts`)

New test suite covering:

1. **Admin Access**:
   - Admin can access lawyer dashboard
   - Impersonation selector is visible for admins

2. **Lawyer Selection**:
   - Admin can open the lawyer selector
   - Admin can select a lawyer to impersonate
   - Dashboard updates with selected lawyer's data

3. **Navigation**:
   - Admin can switch between different lawyers
   - Admin can return to their own panel
   - Visual indicators show when in impersonation mode

4. **Permissions**:
   - Non-admin users don't see the impersonation selector
   - Only authorized actions are permitted

5. **Data Loading**:
   - Metrics load correctly when impersonating
   - Dashboard maintains functionality during impersonation

## User Flow

### For Administrators:

1. Navigate to `/lawyer/dashboard`
2. See "Visualização Administrativa" card at top of page
3. Click the dropdown to see list of lawyers
4. Select a lawyer or "Meu próprio painel"
5. Dashboard refreshes with selected lawyer's data
6. See indicator "Você está visualizando o painel como administrador"
7. Switch between lawyers or return to own panel at any time

### For Regular Lawyers:

1. Navigate to `/lawyer/dashboard`
2. See their own dashboard without impersonation selector
3. Normal dashboard functionality remains unchanged

## Security Considerations

- Permission checks are performed server-side in actions
- Admin status is verified before returning lawyer lists
- Impersonation validation prevents unauthorized access
- No client-side security bypasses

## Database Queries

The feature relies on existing database structure:
- Users table with roles relationships
- JudicialProcess table with parties
- No new migrations required

## UI/UX Features

- Clean, card-based selector matching existing design system
- Badge indicating admin mode
- Lawyer list sorted by active cases count
- Email and case count shown for easy identification
- Seamless switching without page refresh

## Future Enhancements

Potential improvements:
1. Session persistence for selected lawyer
2. Audit logging of impersonation actions
3. Time-limited impersonation sessions
4. Extend to other user roles (bidders, auctioneers, etc.)
5. Impersonation history for admins

## Files Changed/Created

### New Files:
- `src/services/admin-impersonation.service.ts`
- `src/app/lawyer/dashboard/lawyer-impersonation-selector.tsx`
- `tests/e2e/admin/lawyer-impersonation.spec.ts`

### Modified Files:
- `src/app/lawyer/dashboard/actions.ts`
- `src/app/lawyer/dashboard/page.tsx`
- `src/services/lawyer-dashboard.service.ts`
- `src/types/lawyer-dashboard.ts`

## Testing Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run only lawyer impersonation tests
npx playwright test tests/e2e/admin/lawyer-impersonation.spec.ts

# Run with UI
npx playwright test tests/e2e/admin/lawyer-impersonation.spec.ts --ui
```

## API Endpoints

While the current implementation uses Server Actions, future REST API endpoints could be:

- `GET /api/admin/impersonation/lawyers` - List impersonatable lawyers
- `POST /api/admin/impersonation/validate` - Validate impersonation permission
- `GET /api/admin/impersonation/sessions` - List active impersonation sessions (future)

## Environment Requirements

No new environment variables required. Uses existing:
- `DATABASE_URL` for Prisma
- `NEXTAUTH_SECRET` for authentication

## Compatibility

- Next.js 14+ with App Router
- React 18+
- Prisma ORM
- NextAuth.js v5 (Auth.js)
- Playwright for testing
