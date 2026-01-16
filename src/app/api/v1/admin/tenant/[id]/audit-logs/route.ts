// src/app/api/v1/admin/tenant/[id]/audit-logs/route.ts
/**
 * @fileoverview API para logs de auditoria de um tenant.
 * 
 * Essencial para compliance jurídico - permite saber
 * quem alterou o quê dentro de um tenant específico.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateAdminApiKey } from '@/lib/auth/admin-api-guard';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  entityType: z.string().optional(), // auction, lot, user, etc.
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Validar API Key
  const authResult = await validateAdminApiKey(request);
  if (!authResult.isValid) {
    return NextResponse.json({ error: 'Unauthorized', message: authResult.error }, { status: 401 });
  }

  try {
    const tenantId = BigInt(params.id);

    // 2. Verificar se tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    // 3. Parsear query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryParams = querySchema.parse(searchParams);

    // 4. Construir filtros para AuditLog
    const where: any = {
      tenantId,
    };

    if (queryParams.entityType) {
      where.entityType = queryParams.entityType;
    }

    if (queryParams.action) {
      where.action = queryParams.action;
    }

    if (queryParams.userId) {
      where.userId = BigInt(queryParams.userId);
    }

    if (queryParams.startDate || queryParams.endDate) {
      where.createdAt = {};
      if (queryParams.startDate) {
        where.createdAt.gte = new Date(queryParams.startDate);
      }
      if (queryParams.endDate) {
        where.createdAt.lte = new Date(queryParams.endDate);
      }
    }

    // 5. Buscar total e logs
    const total = await prisma.auditLog.count({ where });

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (queryParams.page - 1) * queryParams.limit,
      take: queryParams.limit,
    });

    // 6. Formatar resposta
    const formattedLogs = logs.map(log => ({
      id: log.id.toString(),
      entityType: log.entityType,
      entityId: log.entityId?.toString(),
      action: log.action,
      changes: log.changes,
      oldValues: log.oldValues,
      newValues: log.newValues,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      user: log.user ? {
        id: log.user.id.toString(),
        email: log.user.email,
        fullName: log.user.fullName,
      } : null,
      createdAt: log.createdAt,
    }));

    // 7. Estatísticas de auditoria
    const stats = await prisma.auditLog.groupBy({
      by: ['action'],
      where: { tenantId },
      _count: true,
    });

    const actionStats = stats.reduce((acc, s) => {
      acc[s.action] = s._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id.toString(),
          name: tenant.name,
        },
        logs: formattedLogs,
        stats: {
          total,
          byAction: actionStats,
        },
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          total,
          totalPages: Math.ceil(total / queryParams.limit),
        },
      },
    });

  } catch (error) {
    console.error('[GET /api/v1/admin/tenant/[id]/audit-logs] Erro:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Parâmetros inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
