// src/repositories/audit-log.repository.ts
// Repository para gerenciar logs de auditoria
// Rastreia TODAS ações no sistema (quem, quando, o quê mudou)

import { PrismaClient } from '@prisma/client';

export interface CreateAuditLogInput {
  tenantId?: bigint;
  userId: bigint;
  entityType: string;
  entityId: bigint;
  action: string; // 'CREATE' | 'UPDATE' | 'DELETE' | etc
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface AuditLogFilters {
  tenantId?: bigint;
  userId?: bigint;
  entityType?: string;
  entityId?: bigint;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateAuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action as any,
        changes: data.changes || undefined,
        metadata: data.metadata || undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
      },
    });
  }

  async findMany(filters: AuditLogFilters) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId: filters.tenantId,
        userId: filters.userId,
        entityType: filters.entityType,
        entityId: filters.entityId,
        action: filters.action as any,
        timestamp: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }

  async getEntityHistory(
    entityType: string,
    entityId: bigint,
    tenantId?: bigint
  ) {
    return this.findMany({
      tenantId,
      entityType,
      entityId,
    });
  }

  async getUserActivity(
    userId: bigint,
    startDate?: Date,
    endDate?: Date
  ) {
    return this.findMany({
      userId,
      startDate,
      endDate,
      limit: 50,
    });
  }

  async getRecentActivity(tenantId: bigint, limit: number = 20) {
    return this.findMany({
      tenantId,
      limit,
    });
  }
}
