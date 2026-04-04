/**
 * Server actions for LotRisk CRUD operations.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { lotRiskSchema } from './schema';
import type { LotRiskRow } from './types';

const FK_INCLUDE = {
  Lot: { select: { id: true, title: true } },
  User: { select: { id: true, fullName: true } },
} as const;

function toRow(d: any): LotRiskRow {
  return {
    id: d.id.toString(),
    lotId: d.lotId.toString(),
    lotTitle: d.Lot?.title ?? '',
    riskType: d.riskType,
    riskLevel: d.riskLevel,
    riskDescription: d.riskDescription,
    mitigationStrategy: d.mitigationStrategy ?? null,
    verified: d.verified,
    verifiedBy: d.verifiedBy?.toString() ?? null,
    verifiedByName: d.User?.fullName ?? null,
    verifiedAt: d.verifiedAt?.toISOString?.() ?? d.verifiedAt ?? null,
    createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
  };
}

export const listLotRisks = createAdminAction(async (ctx, params?: { page?: number; pageSize?: number; search?: string; sortField?: string; sortOrder?: string }) => {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const search = params?.search?.trim();
  const where: any = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { riskDescription: { contains: search } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.lotRisk.findMany({ where, include: FK_INCLUDE, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [params?.sortField ?? 'createdAt']: params?.sortOrder ?? 'desc' } }),
    prisma.lotRisk.count({ where }),
  ]);
  return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

export const createLotRisk = createAdminAction(async (ctx, input: unknown) => {
  const parsed = lotRiskSchema.parse(input);
  const created = await prisma.lotRisk.create({
    data: {
      lotId: BigInt(parsed.lotId),
      riskType: parsed.riskType,
      riskLevel: parsed.riskLevel,
      riskDescription: parsed.riskDescription,
      mitigationStrategy: parsed.mitigationStrategy || null,
      verified: parsed.verified ?? false,
      verifiedBy: parsed.verifiedBy ? BigInt(parsed.verifiedBy) : null,
      verifiedAt: parsed.verified ? new Date() : null,
      tenantId: ctx.tenantIdBigInt,
      updatedAt: new Date(),
    },
    include: FK_INCLUDE,
  });
  return sanitizeResponse(toRow(created));
});

export const updateLotRisk = createAdminAction(async (ctx, input: unknown) => {
  const { id, ...rest } = input as any;
  const valid = lotRiskSchema.parse(rest);
  const data: any = { updatedAt: new Date() };
  if (valid.lotId) data.lotId = BigInt(valid.lotId);
  data.riskType = valid.riskType;
  data.riskLevel = valid.riskLevel;
  data.riskDescription = valid.riskDescription;
  data.mitigationStrategy = valid.mitigationStrategy || null;
  data.verified = valid.verified ?? false;
  data.verifiedBy = valid.verifiedBy ? BigInt(valid.verifiedBy) : null;
  if (valid.verified) data.verifiedAt = new Date();
  const updated = await prisma.lotRisk.update({ where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt }, data, include: FK_INCLUDE });
  return sanitizeResponse(toRow(updated));
});

export const deleteLotRisk = createAdminAction(async (ctx, input: unknown) => {
  const { id } = input as any;
  await prisma.lotRisk.delete({ where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt } });
  return { deleted: true };
});
