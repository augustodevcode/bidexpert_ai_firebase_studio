import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  model: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  recordId: string;
  changes?: Record<string, { old: any; new: any }>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Log uma ação de auditoria
   */
  static async logAction(
    tenantId: string,
    userId: string,
    model: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ',
    recordId: string,
    changes?: Record<string, { old: any; new: any }>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          model,
          action,
          recordId,
          changes: changes ? JSON.stringify(changes) : null,
          timestamp: new Date(),
          ipAddress,
          userAgent,
        },
      });

      // Log também em arquivo
      logger.info(`[AUDIT] ${action} on ${model}`, {
        tenantId,
        userId,
        recordId,
        changes,
      });
    } catch (error) {
      logger.error('[AUDIT_ERROR]', {
        model,
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

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        ...(userId && { userId }),
        ...(model && { model }),
        ...(action && { action }),
        ...(recordId && { recordId }),
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
    });

    return logs as AuditLogEntry[];
  }

  /**
   * Obter estatísticas de auditoria
   */
  static async getStats(tenantId: string, days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.auditLog.groupBy({
      by: ['model', 'action'],
      where: {
        tenantId,
        timestamp: { gte: startDate },
      },
      _count: true,
    });

    return logs;
  }

  /**
   * Deletar logs antigos (cleanup)
   */
  static async deleteOldLogs(tenantId: string, olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        tenantId,
        timestamp: { lt: cutoffDate },
      },
    });

    logger.info(`[AUDIT_CLEANUP] Deleted ${result.count} old logs for tenant ${tenantId}`);
    return result.count;
  }
}
