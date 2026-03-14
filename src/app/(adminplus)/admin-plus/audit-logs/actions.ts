/**
 * Server actions para AuditLog (CRUD Admin Plus).
 * tenantId é nullable nesta model.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import type { AuditLogRow } from './types';

const FK_INCLUDE = {
  User: { select: { fullName: true } },
};

function toRow(r: Record<string, unknown>): AuditLogRow {
  const user = (r.User as Record<string, unknown>) ?? {};
  return {
    id: String(r.id),
    userId: String(r.userId),
    userName: user.fullName ? String(user.fullName) : '',
    entityType: String(r.entityType ?? ''),
    entityId: String(r.entityId ?? ''),
    action: String(r.action ?? ''),
    changedFields: String(r.changedFields ?? ''),
    ipAddress: String(r.ipAddress ?? ''),
    userAgent: String(r.userAgent ?? ''),
    timestamp: r.timestamp ? new Date(r.timestamp as string).toISOString() : new Date().toISOString(),
  };
}

export const listAuditLogs = createAdminAction<
  { page?: number; pageSize?: number; search?: string; sortField?: string; sortOrder?: string },
  PaginatedResponse<AuditLogRow>
>(async (ctx, input) => {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const skip = (page - 1) * pageSize;
  const search = input.search?.trim();

  const where: Record<string, unknown> = {
    OR: [{ tenantId: ctx.tenantIdBigInt }, { tenantId: null }],
  };
  if (search) {
    where.AND = [
      {
        OR: [
          { entityType: { contains: search } },
          { action: { contains: search } },
          { User: { fullName: { contains: search } } },
          { ipAddress: { contains: search } },
        ],
      },
    ];
  }

  const orderBy: Record<string, string> = {};
  if (input.sortField) orderBy[input.sortField] = input.sortOrder === 'asc' ? 'asc' : 'desc';
  else orderBy.timestamp = 'desc';

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, include: FK_INCLUDE, skip, take: pageSize, orderBy }),
    prisma.auditLog.count({ where }),
  ]);

  const data = sanitizeResponse(items).map(toRow);
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
});

export const createAuditLog = createAdminAction<Record<string, unknown>, AuditLogRow>(
  async (ctx, input) => {
    const record = await prisma.auditLog.create({
      data: {
        userId: BigInt(input.userId as string),
        entityType: String(input.entityType),
        entityId: BigInt(input.entityId as string),
        action: String(input.action) as any,
        changedFields: input.changedFields ? String(input.changedFields) : null,
        ipAddress: input.ipAddress ? String(input.ipAddress) : null,
        userAgent: input.userAgent ? String(input.userAgent) : null,
        tenantId: ctx.tenantIdBigInt,
      },
      include: FK_INCLUDE,
    });
    return toRow(sanitizeResponse(record));
  }
);

export const updateAuditLog = createAdminAction<Record<string, unknown>, AuditLogRow>(
  async (ctx, input) => {
    const record = await prisma.auditLog.update({
      where: { id: BigInt(input.id as string) },
      data: {
        entityType: String(input.entityType),
        action: String(input.action) as any,
        changedFields: input.changedFields ? String(input.changedFields) : null,
        ipAddress: input.ipAddress ? String(input.ipAddress) : null,
        userAgent: input.userAgent ? String(input.userAgent) : null,
      },
      include: FK_INCLUDE,
    });
    return toRow(sanitizeResponse(record));
  }
);

export const deleteAuditLog = createAdminAction<{ id: string }, { id: string }>(
  async (_ctx, input) => {
    await prisma.auditLog.delete({ where: { id: BigInt(input.id) } });
    return { id: input.id };
  }
);
