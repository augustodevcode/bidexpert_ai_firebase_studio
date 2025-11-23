// src/app/api/audit/route.ts
// API para buscar logs de auditoria
// Uso: GET /api/audit?entityType=Auction&entityId=10

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AuditLogRepository } from '@/repositories/audit-log.repository';
import { EnhancedAuditService } from '@/services/enhanced-audit.service';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const auditRepo = new AuditLogRepository(prisma);
    const auditService = new EnhancedAuditService(auditRepo);

    let logs;

    if (entityType && entityId) {
      // Histórico de uma entidade específica
      logs = await auditService.getEntityHistory(
        entityType,
        BigInt(entityId)
      );
    } else if (userId) {
      // Atividade de um usuário
      logs = await auditService.getUserActivity(BigInt(userId));
    } else {
      // Logs recentes gerais
      logs = await auditRepo.findMany({ limit });
    }

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs: logs.map(log => ({
        ...log,
        id: log.id.toString(),
        userId: log.userId.toString(),
        entityId: log.entityId.toString(),
        tenantId: log.tenantId?.toString(),
      })),
    });

  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
