// src/services/enhanced-audit.service.ts
// Serviço de auditoria com captura automática de contexto
// Registra automaticamente quem, quando, o quê mudou

import { AuditLogRepository } from '@/repositories/audit-log.repository';

export interface LogActionParams {
  userId: bigint;
  tenantId?: bigint;
  entityType: string;
  entityId: bigint;
  action: string;
  before?: any;
  after?: any;
  metadata?: Record<string, any>;
}

export class EnhancedAuditService {
  constructor(private auditRepo: AuditLogRepository) {}

  /**
   * Registra ação com diff automático
   */
  async logAction(params: LogActionParams): Promise<void> {
    try {
      // Calcular diff se antes/depois fornecidos
      const changes = this.calculateDiff(params.before, params.after);

      // Criar log
      await this.auditRepo.create({
        userId: params.userId,
        tenantId: params.tenantId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        changes,
        metadata: params.metadata,
        ipAddress: 'N/A', // TODO: capturar do request
        userAgent: 'N/A',
      });
    } catch (error) {
      console.error('❌ CRITICAL: Failed to create audit log', error);
      // Não quebra operação principal
    }
  }

  /**
   * Calcula diferenças entre objetos
   */
  private calculateDiff(before?: any, after?: any): any {
    if (!before || !after) return null;

    const diff: any = { before: {}, after: {} };
    const allKeys = new Set([
      ...Object.keys(before),
      ...Object.keys(after),
    ]);

    for (const key of allKeys) {
      if (key.startsWith('_') || key === 'updatedAt') continue;

      const beforeVal = before[key];
      const afterVal = after[key];

      if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        diff.before[key] = beforeVal;
        diff.after[key] = afterVal;
      }
    }

    return Object.keys(diff.before).length > 0 ? diff : null;
  }

  /**
   * Busca histórico de entidade
   */
  async getEntityHistory(entityType: string, entityId: bigint, tenantId?: bigint) {
    return this.auditRepo.getEntityHistory(entityType, entityId, tenantId);
  }

  /**
   * Busca atividade de usuário
   */
  async getUserActivity(userId: bigint, startDate?: Date, endDate?: Date) {
    return this.auditRepo.getUserActivity(userId, startDate, endDate);
  }
}
