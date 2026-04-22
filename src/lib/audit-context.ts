// src/lib/audit-context.ts
// Audit context management using AsyncLocalStorage

import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContext {
  userId: string | number;
  tenantId?: string | number;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

// AsyncLocalStorage for storing request-scoped audit context
const auditContextStorage = new AsyncLocalStorage<AuditContext>();

/**
 * Set audit context for the current async context
 */
export function setAuditContext(context: AuditContext): void {
  auditContextStorage.enterWith(context);
}

/**
 * Get audit context from the current async context
 */
export function getAuditContext(): AuditContext | undefined {
  return auditContextStorage.getStore();
}

/**
 * Run a function within a specific audit context
 */
export function runWithAuditContext<T>(
  context: AuditContext,
  fn: () => T
): T {
  return auditContextStorage.run(context, fn);
}

/**
 * Clear audit context
 */
export function clearAuditContext(): void {
  auditContextStorage.disable();
}

/**
 * Extract audit context from Next.js request
 */
export function extractAuditContextFromRequest(request: Request, userId?: string | number, tenantId?: string | number): AuditContext | null {
  if (!userId) return null;

  const ipAddress = request.headers.get('x-forwarded-for') 
    || request.headers.get('x-real-ip')
    || 'unknown';
    
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  return {
    userId,
    tenantId,
    ipAddress,
    userAgent,
    requestId,
  };
}

/**
 * Manual audit log creation for transactional contexts
 * Used when audit logging needs to happen within a Prisma transaction
 */
export interface ManualAuditLogParams {
  entityType: string;
  entityId: string | number | bigint;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Create a manual audit log entry within a transaction
 * This is a stub implementation that logs to console in development
 * In production, this should write to an audit log table
 */
export async function createManualAuditLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any, // Prisma transaction client
  params: ManualAuditLogParams
): Promise<void> {
  const context = getAuditContext();

  if (!context?.userId) {
    console.warn('[AuditLog] Contexto de auditoria ausente; pulando persistência manual.', {
      entityType: params.entityType,
      entityId: params.entityId.toString(),
      action: params.action,
    });
    return;
  }

  const before = params.changes?.before ?? null;
  const after = params.changes?.after ?? null;
  const changedFields = Array.from(new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ].filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]))));

  await tx.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: BigInt(params.entityId),
      action: params.action,
      changes: params.changes ?? undefined,
      oldValues: before ?? undefined,
      newValues: after ?? undefined,
      changedFields: changedFields.length ? changedFields.join(',') : null,
      metadata: params.metadata ?? undefined,
      userId: BigInt(context.userId),
      tenantId: context.tenantId ? BigInt(context.tenantId) : null,
      ipAddress: context.ipAddress || null,
      userAgent: context.userAgent || null,
      timestamp: new Date(),
    },
  });
}
