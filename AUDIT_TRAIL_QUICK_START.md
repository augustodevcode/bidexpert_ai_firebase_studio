# Audit Trail Module - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Prisma client installed and configured
- Database schema up to date
- Next.js 13+ with App Router
- Authentication system in place

### 1. Run Database Migration

First, apply the schema changes to add the `auditTrailConfig` field:

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_audit_trail_config
```

### 2. Enable Audit Trail

Add environment variable (optional - enabled by default):

```env
# .env or .env.local
AUDIT_TRAIL_ENABLED=true
```

### 3. Test Automatic Audit Logging

The audit middleware is automatically active. Create, update, or delete any entity:

```typescript
// Example: This will automatically create an audit log
const auction = await prisma.auction.create({
  data: {
    title: 'Test Auction',
    tenantId: 1n,
    // ... other fields
  },
});
```

Check the `audit_logs` table to see the automatically created entry.

### 4. Add Change History to a CRUD Form

```tsx
import { ChangeHistoryTab } from '@/components/audit/change-history-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AuctionEditModal({ auctionId }: { auctionId: string }) {
  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="history">Change History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details">
        {/* Your edit form */}
      </TabsContent>
      
      <TabsContent value="history">
        <ChangeHistoryTab
          entityType="Auction"
          entityId={auctionId}
        />
      </TabsContent>
    </Tabs>
  );
}
```

## 📖 Usage Scenarios

### Scenario 1: View Audit Logs via API

```typescript
// GET /api/audit?entityType=Auction&page=1&pageSize=20
const response = await fetch('/api/audit?entityType=Auction&page=1&pageSize=20');
const data = await response.json();

console.log(data.data); // Array of audit logs
console.log(data.pagination); // Pagination info
```

### Scenario 2: View Specific Entity History

```typescript
// GET /api/audit/Auction/123
const response = await fetch('/api/audit/Auction/123');
const data = await response.json();

// data.data contains complete change history for Auction ID 123
```

### Scenario 3: Configure Audit Settings (Admin Only)

```typescript
// Get current config
const response = await fetch('/api/audit/config');
const config = await response.json();

// Update config
await fetch('/api/audit/config', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    config: {
      enabled: true,
      auditedModels: ['Auction', 'Lot', 'Bid'],
      fieldExclusions: {
        User: ['password', 'resetToken']
      },
      retentionDays: 365
    }
  })
});
```

### Scenario 4: View Statistics (Admin Only)

```typescript
// GET /api/audit/stats?days=7
const response = await fetch('/api/audit/stats?days=7');
const stats = await response.json();

console.log(stats.data.summary); // Total logs, period
console.log(stats.data.byModel); // Breakdown by model
console.log(stats.data.byAction); // Breakdown by action
console.log(stats.data.byUser); // Top users
```

## 🎨 Customizing the Change History Tab

### Basic Usage

```tsx
<ChangeHistoryTab
  entityType="Auction"
  entityId="123"
/>
```

### With All Options

```tsx
<ChangeHistoryTab
  entityType="Lot"
  entityId="456"
  tenantId="1"
  showUserFilter={true}
  defaultPageSize={50}
/>
```

### Custom Styling

The component uses shadcn/ui and Tailwind CSS. Customize via className:

```tsx
<div className="my-custom-wrapper">
  <ChangeHistoryTab
    entityType="Asset"
    entityId="789"
  />
</div>
```

## 🔧 Configuration Options

### Audit Config Object

```typescript
interface AuditConfig {
  enabled: boolean;              // Master switch
  auditedModels: string[];       // Which models to audit
  fieldExclusions: Record<string, string[]>;  // Fields to skip per model
  retentionDays: number;         // How long to keep logs
  useDedicatedDatabase: boolean; // Use separate audit DB (future)
}
```

### Default Configuration

```typescript
{
  enabled: true,
  auditedModels: [
    'Auction',
    'Lot',
    'Asset',
    'Bid',
    'User',
    'Seller',
    'JudicialProcess',
    'Auctioneer',
    'Category',
    'Subcategory',
  ],
  fieldExclusions: {
    User: ['password', 'resetToken', 'verificationToken'],
    Asset: ['internalNotes', 'privateRemarks'],
    Auction: ['adminNotes'],
  },
  retentionDays: 365,
  useDedicatedDatabase: false,
}
```

## 🛠️ Programmatic Usage

### Audit Config Service

```typescript
import { auditConfigService } from '@/services/audit-config.service';

// Get config
const config = await auditConfigService.getConfig();

// Check if model is audited
const shouldAudit = await auditConfigService.shouldAuditModel('Auction');

// Add model to audit list
await auditConfigService.addAuditedModel('CustomModel');

// Remove model from audit list
await auditConfigService.removeAuditedModel('CustomModel');

// Set field exclusions
await auditConfigService.setFieldExclusions('User', [
  'password',
  'secretKey',
]);

// Clear cache
auditConfigService.clearCache();
```

### Manual Audit Logging

```typescript
import { prisma } from '@/lib/prisma';

// Create audit log manually
await prisma.auditLog.create({
  data: {
    userId: 123n,
    tenantId: 1n,
    entityType: 'Auction',
    entityId: 456n,
    action: 'PUBLISH',
    changes: JSON.stringify({
      status: {
        old: 'DRAFT',
        new: 'PUBLISHED'
      }
    }),
    metadata: {
      reason: 'Manual publication',
      approvedBy: 'Admin User'
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    timestamp: new Date(),
  },
});
```

## 📊 API Reference

### GET /api/audit

Fetch audit logs with filtering and pagination.

**Query Parameters:**
- `entityType` - Filter by entity type
- `entityId` - Filter by entity ID
- `userId` - Filter by user
- `action` - Filter by action type
- `tenantId` - Filter by tenant
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)
- `sortBy` - Sort column (default: 'timestamp')
- `sortOrder` - 'asc' or 'desc' (default: 'desc')

**Example:**
```
GET /api/audit?entityType=Auction&page=1&pageSize=20&sortBy=timestamp&sortOrder=desc
```

### GET /api/audit/[entityType]/[entityId]

Get complete change history for a specific entity.

**Example:**
```
GET /api/audit/Auction/123?page=1&pageSize=20
```

### GET /api/audit/config

Get current audit configuration.

**Example:**
```
GET /api/audit/config?tenantId=1
```

### PUT /api/audit/config

Update audit configuration (admin only).

**Request Body:**
```json
{
  "tenantId": "1",
  "config": {
    "enabled": true,
    "auditedModels": ["Auction", "Lot"],
    "fieldExclusions": {
      "User": ["password"]
    },
    "retentionDays": 365
  }
}
```

### GET /api/audit/stats

Get audit statistics (admin only).

**Query Parameters:**
- `tenantId` - Filter by tenant
- `days` - Time period (default: 7)

**Example:**
```
GET /api/audit/stats?days=30&tenantId=1
```

## 🔒 Security & Permissions

### Role-Based Access

- **Regular Users**: Can only view their own audit logs
- **Admins**: Can view all audit logs
- **System Admins**: Can manage audit configuration

### Sensitive Field Filtering

The following fields are automatically filtered from audit logs:
- `password`, `passwordHash`
- `resetToken`, `verificationToken`
- `accessToken`, `refreshToken`
- `privateKey`, `secretKey`

Values are replaced with `[REDACTED]`.

### Add Custom Sensitive Fields

```typescript
// In audit-middleware.ts
const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordHash',
  'myCustomSecretField', // Add your field here
]);
```

Or configure via field exclusions in audit config.

## 🎯 Best Practices

### 1. Regular Cleanup

Schedule periodic cleanup of old audit logs:

```typescript
// Cleanup logs older than retention period
import { prisma } from '@/lib/prisma';

const retentionDays = 365;
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

await prisma.auditLog.deleteMany({
  where: {
    timestamp: { lt: cutoffDate },
  },
});
```

### 2. Monitor Audit Log Volume

```typescript
// Get audit log count by model
const stats = await prisma.auditLog.groupBy({
  by: ['entityType'],
  _count: true,
  orderBy: {
    _count: {
      entityType: 'desc'
    }
  }
});

console.log('Audit log volume:', stats);
```

### 3. Export Audit Logs for Compliance

```typescript
// Export audit logs to JSON
const logs = await prisma.auditLog.findMany({
  where: {
    timestamp: {
      gte: startDate,
      lte: endDate,
    },
  },
  include: {
    user: {
      select: {
        email: true,
        fullName: true,
      },
    },
  },
});

const json = JSON.stringify(logs, null, 2);
// Save or send json
```

### 4. Configure Audit Scope

Only audit models that need auditing to reduce database load:

```typescript
await auditConfigService.updateConfig({
  auditedModels: [
    'Auction',  // Critical
    'Lot',      // Critical
    'Bid',      // Critical
    // Remove non-critical models
  ],
});
```

## 🐛 Troubleshooting

### Audit Logs Not Being Created

1. **Check if audit trail is enabled:**
   ```bash
   echo $AUDIT_TRAIL_ENABLED  # Should be 'true' or not set
   ```

2. **Check if model is in audited list:**
   ```typescript
   const shouldAudit = await auditConfigService.shouldAuditModel('YourModel');
   console.log('Should audit:', shouldAudit);
   ```

3. **Check Prisma middleware is active:**
   ```typescript
   // In src/lib/prisma.ts
   console.log('Audit middleware enabled');  // Should see this on startup
   ```

### Change History Tab Not Loading

1. **Check API endpoint:**
   ```typescript
   const response = await fetch('/api/audit/Auction/123');
   console.log(response.status, await response.json());
   ```

2. **Check authentication:**
   - User must be logged in
   - User must have permission to view audit logs

3. **Check browser console for errors**

### Performance Issues

1. **Add database indexes** (already included in schema):
   ```sql
   CREATE INDEX idx_audit_tenant_entity ON audit_logs(tenantId, entityType, entityId);
   CREATE INDEX idx_audit_user ON audit_logs(userId);
   CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
   ```

2. **Use pagination:**
   ```tsx
   <ChangeHistoryTab
     entityType="Auction"
     entityId="123"
     defaultPageSize={20}  // Don't use large page sizes
   />
   ```

3. **Implement log archival** for old records

## 📚 Additional Resources

- **Implementation Plan**: `plan-auditTrailModule.prompt.md`
- **Implementation Summary**: `AUDIT_TRAIL_IMPLEMENTATION_SUMMARY.md`
- **Component Source**: `src/components/audit/change-history-tab.tsx`
- **API Source**: `src/app/api/audit/`
- **Services**: `src/services/audit-config.service.ts`
- **Middleware**: `src/lib/audit-middleware.ts`

## 💡 Tips

1. **Test in Development First**: Use a development database to test audit logging before production
2. **Monitor Storage**: Audit logs can grow quickly - plan for storage and archival
3. **Customize Field Names**: Update property names in UI for better user experience
4. **Add Filters**: Extend the Change History Tab with additional filters as needed
5. **Export Capability**: Add export to CSV/PDF for compliance reports

## 🎉 You're All Set!

The audit trail module is now ready to use. Start by:
1. ✅ Testing automatic audit logging with CRUD operations
2. ✅ Adding Change History Tab to a form
3. ✅ Configuring which models to audit
4. ✅ Viewing audit statistics

For questions or issues, refer to the implementation documentation or check the API endpoints.
