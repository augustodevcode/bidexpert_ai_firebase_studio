import { NextRequest, NextResponse } from 'next/server';
import { getTenantId } from '@/lib/get-tenant-id';
import { AuditService } from '@/services/audit.service';
import logger from '@/lib/logger';

/**
 * GET /api/admin/audit-logs
 * Retorna os audit logs do tenant com filtros opcionais
 * Query params: userId, model, action, startDate, endDate, limit, offset
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const model = searchParams.get('model') || undefined;
    const action = searchParams.get('action') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const logs = await AuditService.getLogs(tenantId, {
      userId,
      model,
      action: action as any,
      startDate,
      endDate,
      limit,
      offset,
    });

    const stats = await AuditService.getStats(tenantId, 7);

    return NextResponse.json(
      {
        success: true,
        data: {
          logs,
          stats,
          pagination: { limit, offset },
          testId: 'admin-audit-logs-container',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[GET_AUDIT_LOGS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to get audit logs' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/audit-logs?olderThanDays=30
 * Limpa audit logs antigos (cleanup)
 */
export async function DELETE(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '30', 10);

    const deletedCount = await AuditService.deleteOldLogs(tenantId, olderThanDays);

    logger.info('[AUDIT_LOGS_CLEANUP]', {
      tenantId,
      deletedCount,
      olderThanDays,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          deletedCount,
          testId: 'admin-audit-logs-deleted',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[DELETE_AUDIT_LOGS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to delete audit logs' },
      { status: 500 }
    );
  }
}
