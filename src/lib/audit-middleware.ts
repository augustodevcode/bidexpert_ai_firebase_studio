// src/lib/audit-middleware.ts
// Prisma middleware for automatic audit logging

import { Prisma, type audit_logs_action } from '@prisma/client';
import { getAuditContext } from './audit-context';
import { auditConfigService } from '@/services/audit-config.service';

// Models that should be audited by default
const DEFAULT_AUDITED_MODELS = [
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
];

// Sensitive fields that should never be logged
const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordHash',
  'resetToken',
  'verificationToken',
  'accessToken',
  'refreshToken',
  'privateKey',
  'secretKey',
]);

// Fields to ignore in diff calculation
const IGNORED_FIELDS = new Set([
  'updatedAt',
  'createdAt',
  '_count',
  '_avg',
  '_sum',
  '_min',
  '_max',
]);

/**
 * Audit middleware for Prisma
 * Automatically logs CREATE, UPDATE, and DELETE operations
 */
export const auditMiddleware: Prisma.Middleware = async (params, next) => {
  // Execute the operation first
  const result = await next(params);

  // Only audit specific operations
  if (!['create', 'update', 'delete', 'deleteMany', 'updateMany'].includes(params.action)) {
    return result;
  }

  // Skip audit log model to prevent infinite loops
  if (params.model === 'AuditLog') {
    return result;
  }

  // Check if this model should be audited
  const isAudited = await shouldAuditModel(params.model);
  if (!isAudited) {
    return result;
  }

  // Get audit context (userId, tenantId, request info)
  const context = getAuditContext();
  if (!context?.userId) {
    // No user context available, skip audit logging
    return result;
  }

  // Log the operation asynchronously (don't block main operation)
  setImmediate(async () => {
    try {
      await logAuditEntry(params, result, context);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Silently fail - don't affect main operation
    }
  });

  return result;
};

/**
 * Check if a model should be audited based on configuration
 */
async function shouldAuditModel(model?: string): Promise<boolean> {
  if (!model) return false;

  try {
    const config = await auditConfigService.getConfig();
    if (!config.enabled) return false;

    const auditedModels = config.auditedModels || DEFAULT_AUDITED_MODELS;
    return auditedModels.includes(model);
  } catch (error) {
    // If config service fails, use default list
    return DEFAULT_AUDITED_MODELS.includes(model);
  }
}

/**
 * Create audit log entry
 */
async function logAuditEntry(
  params: Prisma.MiddlewareParams,
  result: any,
  context: AuditContext
): Promise<void> {
  const { prisma } = await import('./prisma');
  
  const action = mapPrismaActionToAuditAction(params.action);
  if (!action) {
    return;
  }
  const entityId = extractEntityId(params, result);
  
  if (!entityId) {
    // Can't log without entity ID
    return;
  }

  // Calculate changes for UPDATE operations
  let changes = null;
  if (params.action === 'update') {
    changes = await calculateChanges(params, result, context);
  } else if (params.action === 'create') {
    changes = { after: filterSensitiveData(result) };
  } else if (params.action === 'delete') {
    changes = { before: filterSensitiveData(params.args?.where) };
  }

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      userId: BigInt(context.userId),
      tenantId: context.tenantId ? BigInt(context.tenantId) : null,
      entityType: params.model!,
      entityId: BigInt(entityId),
      action,
      changes: changes ? JSON.stringify(changes) : null,
      metadata: {
        operation: params.action,
        args: filterSensitiveData(params.args),
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      timestamp: new Date(),
    },
  });
}

/**
 * Map Prisma action to AuditAction enum
 */
function mapPrismaActionToAuditAction(action: Prisma.PrismaAction): audit_logs_action | null {
  const actionMap: Partial<Record<Prisma.PrismaAction, audit_logs_action>> = {
    create: 'CREATE',
    update: 'UPDATE',
    delete: 'DELETE',
    deleteMany: 'DELETE',
    updateMany: 'UPDATE',
  };
  // Read-only operations (find*, count, aggregate, upsert) are intentionally ignored.
  return actionMap[action] ?? null;
}

/**
 * Extract entity ID from params or result
 */
function extractEntityId(params: Prisma.MiddlewareParams, result: any): string | number | null {
  // For single operations
  if (result?.id) {
    return result.id;
  }
  
  // From where clause
  if (params.args?.where?.id) {
    return params.args.where.id;
  }
  
  // For create operations, ID might be in result
  if (params.action === 'create' && result?.id) {
    return result.id;
  }
  
  return null;
}

/**
 * Calculate changes between before and after states
 */
async function calculateChanges(
  params: Prisma.MiddlewareParams,
  result: any,
  context: AuditContext
): Promise<any> {
  const { prisma } = await import('./prisma');
  
  try {
    // Fetch the "before" state
    const entityId = extractEntityId(params, result);
    if (!entityId || !params.model) return null;

    // Get the model delegate
    const model = (prisma as any)[params.model.toLowerCase()];
    if (!model) return null;

    // Fetch the record before update
    const before = await model.findUnique({
      where: { id: entityId },
    });

    if (!before) return null;

    // Calculate field-level diff
    const diff: any = {};
    const updateData = params.args?.data || {};
    
    for (const [key, newValue] of Object.entries(updateData)) {
      // Skip ignored fields
      if (IGNORED_FIELDS.has(key)) continue;
      
      // Skip sensitive fields
      if (SENSITIVE_FIELDS.has(key)) continue;
      
      const oldValue = (before as any)[key];
      
      // Check if value actually changed
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diff[key] = {
          old: oldValue,
          new: newValue,
        };
      }
    }

    return Object.keys(diff).length > 0 ? diff : null;
  } catch (error) {
    console.error('Error calculating changes:', error);
    return null;
  }
}

/**
 * Filter sensitive data from objects
 */
function filterSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveData(item));
  }

  const filtered: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.has(key)) {
      filtered[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value);
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Audit context type
 */
export interface AuditContext {
  userId: string | number;
  tenantId?: string | number;
  ipAddress?: string;
  userAgent?: string;
}
