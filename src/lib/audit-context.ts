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
