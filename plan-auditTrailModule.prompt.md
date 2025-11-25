# Audit Trail Module - Implementation Plan

## Overview
Implement tenant-aware audit logging by extending Prisma models/services, wiring client extensions to capture entity diffs, and surfacing Change History UI with configurable model coverage and robust filters/pagination.

## Current State Analysis

### Existing Infrastructure
✅ **Prisma Schema** - AuditLog model already defined with:
- Fields: tenantId, userId, entityType, entityId, action, changes, metadata, ipAddress, userAgent, location, timestamp
- Indexes: [tenantId, entityType, entityId], [userId], [timestamp], [action]
- Relations: User, Tenant

✅ **AuditAction Enum** - Already defined with actions:
- CREATE, UPDATE, DELETE, SOFT_DELETE, RESTORE, PUBLISH, UNPUBLISH, APPROVE, REJECT, EXPORT

✅ **Basic Audit Service** - `src/services/audit.service.ts` exists with:
- logAction() method
- getLogs() with filtering
- getStats() for analytics
- deleteOldLogs() for cleanup

### Gaps to Address
1. ❌ Prisma client extension for automatic CRUD interception
2. ❌ Enhanced audit service with field-level diff tracking
3. ❌ UI configuration for selecting audited models
4. ❌ REST API endpoints for Change History queries
5. ❌ Change History Tab React component
6. ❌ Field-level exclusion metadata (@audit skip)
7. ❌ Dual-database deployment support
8. ❌ Role-based audit log visibility policies
9. ❌ Automated tests for audit functionality

## Implementation Steps

### Phase 1: Enhanced Backend Infrastructure

#### 1.1 Prisma Client Extension (`src/lib/prisma.ts`)
**Purpose**: Automatically intercept and log all CRUD operations

**Implementation**:
```typescript
// Add Prisma middleware extension
prisma.$use(async (params, next) => {
  const result = await next(params);
  
  // Log CREATE, UPDATE, DELETE operations
  if (['create', 'update', 'delete'].includes(params.action)) {
    await auditMiddleware(params, result);
  }
  
  return result;
});
```

**Features**:
- Capture before/after state for UPDATE operations
- Extract user context from async local storage
- Filter sensitive fields (password, tokens, etc.)
- Support batch operations
- Handle nested writes

#### 1.2 Enhanced Audit Service (`src/services/enhanced-audit.service.ts`)
**Status**: File already exists - needs enhancement

**Enhancements Needed**:
- Field-level diff calculation
- Sensitive field filtering (configurable)
- Support for related entity changes
- Bulk logging for performance
- Lazy loading for change history collections

**New Methods**:
```typescript
class EnhancedAuditService {
  // Calculate field-level diffs
  static calculateDiff(before: any, after: any): FieldChange[];
  
  // Filter sensitive fields
  static filterSensitiveData(changes: any, modelName: string): any;
  
  // Get audit trail for specific entity
  static getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]>;
  
  // Get user-specific audit logs (for non-admin users)
  static getUserAuditLogs(userId: string, tenantId?: string): Promise<AuditLog[]>;
}
```

#### 1.3 Audit Configuration Service (`src/services/audit-config.service.ts`)
**Purpose**: Manage which models are audited and field exclusions

**Features**:
- Store configuration in PlatformSettings
- Default audited models: Auction, Lot, Asset, Bid, User, Seller
- Per-model field exclusion lists
- Enable/disable audit module globally
- Per-tenant configuration overrides

#### 1.4 REST API Endpoints (`src/app/api/audit/*`)

**Endpoints to Create**:

1. `GET /api/audit/logs` - List audit logs with filters
   - Query params: tenantId, userId, entityType, entityId, action, startDate, endDate, page, pageSize
   - Response: Paginated audit log entries with user details

2. `GET /api/audit/logs/[entityType]/[entityId]` - Get history for specific entity
   - Returns: Complete change history for the entity
   - Includes: User names, timestamps, field-level changes

3. `GET /api/audit/config` - Get audit configuration
   - Returns: Enabled status, audited models, field exclusions

4. `PUT /api/audit/config` - Update audit configuration (admin only)
   - Body: { enabled, auditedModels, fieldExclusions }

5. `GET /api/audit/stats` - Get audit statistics
   - Returns: Action counts by model, user activity, etc.

### Phase 2: Frontend Components

#### 2.1 Change History Tab Component (`src/components/admin/change-history-tab.tsx`)

**UI Structure**:
```
┌─────────────────────────────────────────────────────┐
│ [Tasks] [Change History*] [Phone Numbers]          │ <- Tab Bar
├─────────────────────────────────────────────────────┤
│ 🔍 [Text to search...          ] [Q]               │ <- Search Toolbar
├─────────────────────────────────────────────────────┤
│ ☐ │ User Name ↑ │ Modified On │ Operation │ ...   │ <- Table Header
│ ☐ │ John Doe    │ 2024-01-15  │ UPDATE    │ ...   │
│ ☐ │ Jane Smith  │ 2024-01-14  │ CREATE    │ ...   │
├─────────────────────────────────────────────────────┤
│ « [1] »                        Page size: [20 ▾]   │ <- Pagination
└─────────────────────────────────────────────────────┘
```

**Columns**:
1. Checkbox - Selection for bulk operations
2. User Name - Who made the change (sortable, with arrow indicator)
3. Modified On - Timestamp (formatted)
4. Operation Type - CREATE/UPDATE/DELETE badge
5. Property Name - Field that changed
6. Old Value - Previous value
7. New Value - New value (tooltip on hover)

**Features**:
- Server-side search and filtering
- Sortable columns
- Pagination (20, 50, 100 items per page)
- Responsive design (collapse secondary columns on mobile)
- BidExpertCard container styling
- Brand accent underline on active tab

**Props Interface**:
```typescript
interface ChangeHistoryTabProps {
  entityType: string;
  entityId: string;
  tenantId?: string;
  showUserFilter?: boolean;
  defaultPageSize?: 20 | 50 | 100;
}
```

#### 2.2 Audit Settings Page (`src/app/(admin)/settings/audit/page.tsx`)

**Features**:
- Toggle audit module on/off
- Select which models to audit (multi-select)
- Configure field exclusions per model
- Set retention policy (days to keep logs)
- Configure dedicated audit database (optional)
- Preview current audit log volume

**UI Sections**:
1. **Global Settings**
   - Enable/Disable Audit Trail
   - Retention Period (days)
   - Use Dedicated Database (checkbox)

2. **Audited Models**
   - Checklist of all Prisma models
   - Default: Auction, Lot, Asset, Bid, User, Seller, JudicialProcess

3. **Field Exclusions**
   - Per-model sensitive field configuration
   - Default exclusions: password, tokens, internalNotes

4. **Statistics**
   - Total audit logs count
   - Logs by model (chart)
   - Storage usage estimate

#### 2.3 Audit Log Viewer (`src/components/admin/audit-log-viewer.tsx`)

**Purpose**: Standalone component for viewing audit logs (not entity-specific)

**Features**:
- Global audit log search
- Advanced filters (user, model, action, date range)
- Export to CSV
- Admin-only access
- Real-time updates (optional)

### Phase 3: Advanced Features

#### 3.1 Field Exclusion Metadata

**Approach 1: Zod Schema Metadata** (Recommended)
```typescript
// In zod-schemas.ts
const assetSchema = z.object({
  title: z.string(),
  internalNotes: z.string().meta({ auditSkip: true }),
  estimatedValue: z.number(),
});
```

**Approach 2: Service-Level Configuration**
```typescript
// In audit-config.service.ts
const SENSITIVE_FIELDS = {
  User: ['password', 'resetToken', 'verificationToken'],
  Asset: ['internalNotes', 'privateRemarks'],
  Auction: ['adminNotes'],
};
```

#### 3.2 Dual-Database Support

**Environment Variables**:
```env
# Main database
DATABASE_URL=mysql://...

# Optional: Dedicated audit database
AUDIT_DATABASE_URL=mysql://...
AUDIT_DATABASE_ENABLED=true
```

**Implementation**:
```typescript
// In prisma.ts
const auditPrisma = process.env.AUDIT_DATABASE_ENABLED === 'true'
  ? new PrismaClient({ datasources: { db: { url: process.env.AUDIT_DATABASE_URL }}})
  : prisma;

// Use auditPrisma for all audit log operations
```

**Considerations**:
- Ensure AuditLog model exists in both schemas
- Handle schema migrations for both databases
- Monitor connection pool limits

#### 3.3 Role-Based Visibility

**Permission Model**:
```typescript
enum AuditPermission {
  VIEW_OWN_AUDIT_LOGS = 'audit:view:own',
  VIEW_ALL_AUDIT_LOGS = 'audit:view:all',
  MANAGE_AUDIT_CONFIG = 'audit:config:manage',
  EXPORT_AUDIT_LOGS = 'audit:export',
}
```

**Access Rules**:
- **Regular Users**: Can only see their own audit logs
- **Managers**: Can see audit logs for their team/department
- **Admins**: Full access to all audit logs
- **System Admin**: Can manage audit configuration

**Implementation**:
```typescript
// In audit.service.ts
static async getLogs(userId: string, userRoles: string[], options: FilterOptions) {
  const isAdmin = userRoles.includes('ADMIN');
  
  if (!isAdmin) {
    // Non-admins can only see their own logs
    options.userId = userId;
  }
  
  return prisma.auditLog.findMany({ where: buildWhereClause(options) });
}
```

### Phase 4: Testing

#### 4.1 Unit Tests (`tests/unit/audit/`)

**Test Files**:
1. `audit-service.test.ts`
   - Test logAction with various scenarios
   - Test field diff calculation
   - Test sensitive field filtering
   - Test pagination and filtering

2. `audit-middleware.test.ts`
   - Test Prisma middleware interception
   - Test nested write handling
   - Test batch operation logging

3. `audit-config.test.ts`
   - Test configuration CRUD
   - Test model selection validation
   - Test field exclusion logic

#### 4.2 Integration Tests (`tests/e2e/admin/`)

**Test Scenarios**:
1. **audit-logging.spec.ts**
   - Create entity → verify audit log created
   - Update entity → verify before/after captured
   - Delete entity → verify deletion logged
   - Verify field-level changes tracked

2. **change-history-tab.spec.ts**
   - Navigate to entity with change history
   - Verify tab renders correctly
   - Test search functionality
   - Test pagination
   - Test sorting
   - Verify responsive behavior

3. **audit-settings.spec.ts**
   - Enable/disable audit module
   - Select audited models
   - Configure field exclusions
   - Verify settings persisted

4. **audit-permissions.spec.ts**
   - Regular user sees only own logs
   - Admin sees all logs
   - Verify unauthorized access blocked

#### 4.3 Performance Tests

**Scenarios**:
- Bulk operations (100+ entities) → audit logs created efficiently
- Query 10k+ audit logs with pagination
- Concurrent writes don't block audit logging
- Dedicated database option reduces main DB load

### Phase 5: Documentation

#### 5.1 Developer Documentation

**Files to Create**:
1. `docs/audit-trail/README.md` - Overview and architecture
2. `docs/audit-trail/CONFIGURATION.md` - Setup and configuration guide
3. `docs/audit-trail/API.md` - API endpoint documentation
4. `docs/audit-trail/COMPONENTS.md` - UI component usage
5. `docs/audit-trail/TROUBLESHOOTING.md` - Common issues and solutions

#### 5.2 User Documentation

**Sections**:
1. **Admin Guide**: How to configure audit trail
2. **User Guide**: How to view change history
3. **Compliance Guide**: Audit trail for regulatory compliance

## Technical Specifications

### Change History Tab Design Specs

**Tab Bar**:
- Height: 48px
- Background: #FFFFFF
- Border-bottom: 1px solid #E5E7EB
- Active tab: Brand color (#3B82F6) underline, 3px thick
- Inactive tabs: #6B7280 text
- Spacing: 24px between tabs

**Search Toolbar**:
- Background: #F9FAFB
- Padding: 12px
- Input: Rounded 6px, border #D1D5DB
- Search button: Icon button with 'Q' glyph, 32x32px
- Height: 40px

**Table**:
- Header background: #F3F4F6
- Row height: 48px
- Font: Inter, 14px regular, 16px line-height
- Borders: 1px solid #E5E7EB
- Hover: #F9FAFB background

**Column Widths**:
- Checkbox: 48px
- User Name: 200px (20%)
- Modified On: 180px (18%)
- Operation Type: 120px (12%)
- Property Name: 180px (18%)
- Old Value: 160px (16%)
- New Value: 160px (16%)

**Pagination**:
- Height: 48px
- Background: #FFFFFF
- Current page pill: #3B82F6 background, white text
- Arrows: #6B7280, hover #3B82F6
- Page size select: Right-aligned, 120px width

**Responsive Breakpoints**:
- Desktop (>1024px): All columns visible
- Tablet (768-1024px): Hide "Old Value" column
- Mobile (<768px): Show only User Name, Modified On, Operation Type; stack pagination

### Database Schema Enhancements

**Current AuditLog Schema**:
```prisma
model AuditLog {
  id         BigInt      @id @default(autoincrement())
  tenantId   BigInt?
  userId     BigInt
  entityType String
  entityId   BigInt
  action     AuditAction
  changes    Json?
  metadata   Json?
  ipAddress  String?     @db.Text
  userAgent  String?     @db.Text
  location   String?     @db.Text
  timestamp  DateTime    @default(now())
  
  user   User    @relation(fields: [userId], references: [id])
  tenant Tenant? @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, entityType, entityId])
  @@index([userId])
  @@index([timestamp])
  @@index([action])
  @@map("audit_logs")
}
```

**No Changes Needed** - Schema is already comprehensive

### API Response Formats

**GET /api/audit/logs Response**:
```json
{
  "data": [
    {
      "id": "123",
      "tenantId": "1",
      "userId": "456",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "entityType": "Auction",
      "entityId": "789",
      "action": "UPDATE",
      "changes": {
        "title": { "old": "Old Title", "new": "New Title" },
        "status": { "old": "DRAFT", "new": "PUBLISHED" }
      },
      "metadata": { "reason": "Updated per client request" },
      "ipAddress": "192.168.1.1",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalRecords": 95
  }
}
```

## Implementation Timeline

### Week 1: Backend Foundation
- Day 1-2: Enhance Prisma client extension with middleware
- Day 3-4: Upgrade audit service with diff tracking
- Day 5: Create audit configuration service

### Week 2: API & Frontend
- Day 1-2: Build REST API endpoints
- Day 3-5: Implement Change History Tab component

### Week 3: Advanced Features
- Day 1-2: Add audit settings UI
- Day 3: Implement field exclusion metadata
- Day 4: Add dual-database support
- Day 5: Implement role-based visibility

### Week 4: Testing & Documentation
- Day 1-2: Unit tests
- Day 3-4: Integration tests (Playwright)
- Day 5: Documentation and polish

## Success Criteria

✅ **Functional**:
- All CRUD operations automatically logged
- Change History tab displays correctly
- Search and filtering work
- Pagination handles large datasets
- Role-based access enforced

✅ **Performance**:
- Audit logging adds <50ms to operations
- Query 10k logs returns in <2s
- No blocking on main operations

✅ **UX**:
- UI matches reference design
- Responsive on all screen sizes
- Clear, actionable information
- Minimal clicks to view history

✅ **Testing**:
- 90%+ code coverage
- E2E tests pass for all scenarios
- Performance benchmarks met

## Future Enhancements

1. **Real-time Updates**: WebSocket notifications for audit events
2. **Advanced Analytics**: Dashboard with charts and trends
3. **Compliance Reports**: Generate audit reports for regulatory compliance
4. **AI-Powered Insights**: Detect unusual patterns or potential security issues
5. **Audit Log Replay**: Restore entities to previous states
6. **Multi-language Support**: Translate operation types and field names
7. **Custom Workflows**: Trigger actions based on audit events (e.g., notify on sensitive changes)
8. **Data Retention Policies**: Automatic archival to cold storage after X days

## References

- **Prisma Middleware**: https://www.prisma.io/docs/concepts/components/prisma-client/middleware
- **Prisma Client Extensions**: https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions
- **shadcn/ui Components**: https://ui.shadcn.com/docs/components
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction

## Notes

- This implementation leverages existing infrastructure (AuditLog model, basic service)
- Focus on incremental enhancements rather than complete rewrites
- Maintain backward compatibility with existing audit logs
- Ensure performance doesn't degrade with audit logging enabled
- Prioritize user experience in Change History tab
- Follow existing code patterns and conventions in the codebase
