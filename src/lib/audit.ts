import logger from '@/lib/logger';

interface AuditParams<T> {
  model: string;
  action: string;
  prismaAction: Promise<T>;
  where?: any;
  data?: any;
}

/**
 * Envolve uma operação do Prisma com logging de auditoria.
 * Substitui a necessidade de middleware em ambientes Edge.
 * @param params Parâmetros de auditoria e a ação do Prisma a ser executada.
 * @returns O resultado da ação do Prisma.
 */
export async function withAudit<T>({ model, action, prismaAction, where, data }: AuditParams<T>): Promise<T> {
  const start = Date.now();
  try {
    const result = await prismaAction;
    const durationMs = Date.now() - start;

    // Log de auditoria para ações de escrita
    const writeActions = ['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'];
    if (writeActions.includes(action)) {
      logger.info('[AUDIT]', {
        model,
        action,
        durationMs,
        where,
        dataKeys: data ? Object.keys(data) : undefined,
      });
    }

    return result;
  } catch (error) {
    const durationMs = Date.now() - start;
    logger.error('[AUDIT_ERROR]', {
      model,
      action,
      durationMs,
      error: error instanceof Error ? error.message : String(error),
    });
    // Re-lança o erro para que a aplicação possa tratá-lo
    throw error;
  }
}
