/**
 * @fileoverview Serviço de Audit Log para a Máquina de Estado.
 * Cria registros de auditoria obrigatórios para TODA transição de estado
 * de leilões, lotes e lances.
 */

import type { PrismaClient } from '@prisma/client';
import logger from '@/lib/logger';

export type AuditEntityType = 'AUCTION' | 'LOT' | 'BID';

export interface AuditLogEntry {
  entityType: AuditEntityType;
  entityId: bigint;
  action: string;
  userId: bigint;
  tenantId: bigint;
  previousState?: Record<string, unknown> | null;
  currentState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Cria um registro de audit log dentro de uma transação Prisma.
 * OBRIGATÓRIO para toda mudança de estado.
 */
export async function createStateAuditLog(
  tx: PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  entry: AuditLogEntry
): Promise<void> {
  try {
    // Mapear action string para audit_logs_action enum
    const actionEnum = mapActionToEnum(entry.action);

    await (tx as PrismaClient).audit_logs.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: actionEnum,
        userId: entry.userId,
        tenantId: entry.tenantId,
        oldValues: entry.previousState ? JSON.parse(JSON.stringify(entry.previousState, bigIntReplacer)) : null,
        newValues: entry.currentState ? JSON.parse(JSON.stringify(entry.currentState, bigIntReplacer)) : null,
        metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata, bigIntReplacer)) : null,
      },
    });

    logger.info(`[AuditLog] ${entry.action} - ${entry.entityType}#${entry.entityId}`, {
      userId: entry.userId.toString(),
      tenantId: entry.tenantId.toString(),
    });
  } catch (error) {
    // Audit log failure should NOT block the transaction
    logger.error('[AuditLog] Falha ao criar audit log (não-bloqueante)', {
      error: error instanceof Error ? error.message : String(error),
      entry: {
        entityType: entry.entityType,
        entityId: entry.entityId.toString(),
        action: entry.action,
      },
    });
  }
}

/**
 * Mapeia ação de estado para enum audit_logs_action do Prisma.
 */
function mapActionToEnum(action: string): 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'RESTORE' | 'PUBLISH' | 'UNPUBLISH' | 'APPROVE' | 'REJECT' | 'EXPORT' | 'IMPORT' {
  const actionMap: Record<string, 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'RESTORE' | 'PUBLISH' | 'UNPUBLISH' | 'APPROVE' | 'REJECT' | 'EXPORT' | 'IMPORT'> = {
    'AUCTION_SUBMITTED': 'UPDATE',
    'AUCTION_APPROVED': 'APPROVE',
    'AUCTION_REJECTED': 'REJECT',
    'AUCTION_RETURNED_TO_DRAFT': 'UPDATE',
    'AUCTION_OPENED': 'PUBLISH',
    'AUCTION_RETURNED_TO_VALIDATION': 'UPDATE',
    'AUCTION_IN_AUCTION': 'UPDATE',
    'AUCTION_CLOSED': 'UPDATE',
    'AUCTION_CANCELLED': 'SOFT_DELETE',
    'LOT_OPENED': 'UPDATE',
    'LOT_IN_AUCTION': 'UPDATE',
    'LOT_SOLD': 'UPDATE',
    'LOT_UNSOLD': 'UPDATE',
    'LOT_CLOSED': 'UPDATE',
    'LOT_CANCELLED': 'SOFT_DELETE',
    'BID_PLACED': 'CREATE',
    'BID_CANCELLED': 'SOFT_DELETE',
    'BID_WON': 'UPDATE',
    'LOTS_CASCADE_OPEN': 'UPDATE',
    'LOTS_CASCADE_CANCEL': 'SOFT_DELETE',
    'BIDS_CASCADE_CANCEL': 'SOFT_DELETE',
  };

  return actionMap[action] || 'UPDATE';
}

/**
 * Serializa BigInt para JSON.
 */
function bigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}
