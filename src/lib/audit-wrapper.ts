// src/lib/audit-wrapper.ts
// Helper para adicionar auditoria em qualquer Server Action
// USO: const audit = createAuditWrapper(session, prisma);
//      await audit.track('Auction', id, 'UPDATE', before, after);

import { PrismaClient } from '@prisma/client';
import { AuditLogRepository } from '@/repositories/audit-log.repository';
import { EnhancedAuditService } from '@/services/enhanced-audit.service';

interface AuditSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    tenantId?: string | null;
  };
}

export function createAuditWrapper(
  session: AuditSession | null,
  prisma: PrismaClient
) {
  const auditRepo = new AuditLogRepository(prisma);
  const auditService = new EnhancedAuditService(auditRepo);

  return {
    /**
     * Rastreia ação com diff automático
     * @example
     * await audit.track('Auction', auctionId, 'UPDATE', before, after);
     */
    async track(
      entityType: string,
      entityId: bigint | string | number,
      action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH',
      before?: any,
      after?: any,
      metadata?: Record<string, any>
    ): Promise<void> {
      if (!session?.user) {
        console.warn('⚠️ Audit skipped - no session');
        return;
      }

      try {
        await auditService.logAction({
          userId: BigInt(session.user.id),
          tenantId: session.user.tenantId ? BigInt(session.user.tenantId) : undefined,
          entityType,
          entityId: typeof entityId === 'bigint' ? entityId : BigInt(entityId),
          action,
          before,
          after,
          metadata: {
            ...metadata,
            userEmail: session.user.email,
            userName: session.user.name,
          },
        });
      } catch (error) {
        console.error('❌ CRITICAL: Audit logging failed', error);
        // Não quebra a operação principal
      }
    },

    /**
     * Rastreia criação
     */
    async created(entityType: string, entityId: bigint | string | number, data: any) {
      return this.track(entityType, entityId, 'CREATE', undefined, data);
    },

    /**
     * Rastreia atualização
     */
    async updated(
      entityType: string,
      entityId: bigint | string | number,
      before: any,
      after: any
    ) {
      return this.track(entityType, entityId, 'UPDATE', before, after);
    },

    /**
     * Rastreia deleção
     */
    async deleted(entityType: string, entityId: bigint | string | number, data: any) {
      return this.track(entityType, entityId, 'DELETE', data, undefined);
    },

    /**
     * Rastreia publicação
     */
    async published(entityType: string, entityId: bigint | string | number, data: any) {
      return this.track(entityType, entityId, 'PUBLISH', undefined, data);
    },
  };
}
