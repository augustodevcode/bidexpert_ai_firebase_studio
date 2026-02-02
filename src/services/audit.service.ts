import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { Prisma } from '@prisma/client';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  entityType: string; // Was 'model'
  action: string;
  entityId: string; // Was 'recordId'
  changes?: Record<string, any>; // Legacy JSON
  oldValues?: Record<string, any>; // New 360
  newValues?: Record<string, any>; // New 360
  traceId?: string; // New 360
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Log uma ação de auditoria (Manual)
   * Prefer using the automatic Audit Extension when possible.
   */
  static async logAction(
    tenantId: string,
    userId: string,
    entityType: string,
    action: string,
    entityId: string,
    changes?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    traceId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    try {
      // @ts-ignore - prisma.audit_logs might be typed differently based on generation
      await prisma.audit_logs.create({
        data: {
          tenantId: BigInt(tenantId),
          userId: BigInt(userId),
          entityType,
          action: action as any, // Enum casing might differ
          entityId: BigInt(entityId),
          changes: changes ? JSON.stringify(changes) : Prisma.JsonNull,
          oldValues: oldValues ? JSON.stringify(oldValues) : Prisma.JsonNull,
          newValues: newValues ? JSON.stringify(newValues) : Prisma.JsonNull,
          traceId: traceId || null,
          timestamp: new Date(),
          ipAddress,
          userAgent,
        },
      });

      // Log também em arquivo para redundância
      logger.info(`[AUDIT] ${action} on ${entityType}`, {
        tenantId,
        userId,
        entityId,
        hasDiff: !!(oldValues || newValues),
        traceId
      });
    } catch (error) {
      logger.error('[AUDIT_ERROR]', {
        entityType,
        action,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Obter logs de auditoria filtrados
   */
  static async getLogs(
    tenantId: string,
    options: {
      userId?: string;
      model?: string;
      action?: string;
      recordId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<AuditLogEntry[]> {
    const {
      userId,
      model,
      action,
      recordId,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = options;

    // @ts-ignore
    const logs = await prisma.audit_logs.findMany({
      where: {
        tenantId: BigInt(tenantId),
        ...(userId && { userId: BigInt(userId) }),
        ...(model && { entityType: model }),
        ...(action && { action: action as any }),
        ...(recordId && { entityId: BigInt(recordId) }),
        ...(startDate || endDate) && {
          timestamp: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        User: {
          select: { name: true, email: true }
        }
      }
    });

    return logs.map((log: any) => ({
      id: log.id.toString(),
      tenantId: log.tenantId?.toString() || '',
      userId: log.userId.toString(),
      userEmail: log.User?.email,
      userName: log.User?.name,
      entityType: log.entityType,
      action: log.action,
      entityId: log.entityId.toString(),
      changes: log.changes ? (typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes) : null,
      oldValues: log.oldValues ? (typeof log.oldValues === 'string' ? JSON.parse(log.oldValues) : log.oldValues) : null,
      newValues: log.newValues ? (typeof log.newValues === 'string' ? JSON.parse(log.newValues) : log.newValues) : null,
      traceId: log.traceId,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent
    }));
  }

  /**
   * Obter estatísticas de auditoria
   */
  static async getStats(tenantId: string, days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // @ts-ignore
    const logs = await prisma.audit_logs.groupBy({
      by: ['entityType', 'action'],
      where: {
        tenantId: BigInt(tenantId),
        timestamp: { gte: startDate },
      },
      _count: true,
    });

    return logs.map((l: any) => ({
      model: l.entityType,
      action: l.action,
      count: l._count
    }));
  }

  /**
   * Deletar logs antigos (cleanup)
   */
  static async deleteOldLogs(tenantId: string, olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // @ts-ignore
    const result = await prisma.audit_logs.deleteMany({
      where: {
        tenantId: BigInt(tenantId),
        timestamp: { lt: cutoffDate },
      },
    });

    logger.info(`[AUDIT_CLEANUP] Deleted ${result.count} old logs for tenant ${tenantId}`);
    return result.count;
  }
}
