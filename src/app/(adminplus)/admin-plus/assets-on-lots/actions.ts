/**
 * Server actions for AssetsOnLots junction entity (Admin Plus CRUD).
 * Composite PK: lotId + assetId. No auto-increment id.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import type { AssetsOnLotsRow } from './types';

function toRow(r: Record<string, unknown>): AssetsOnLotsRow {
  const lot = (r.Lot as Record<string, unknown>) ?? {};
  const asset = (r.Asset as Record<string, unknown>) ?? {};
  return {
    lotId: String(r.lotId),
    lotTitle: lot.title ? String(lot.title) : '',
    assetId: String(r.assetId),
    assetTitle: asset.title ? String(asset.title) : '',
    assignedAt: r.assignedAt ? new Date(r.assignedAt as string).toISOString() : new Date().toISOString(),
    assignedBy: String(r.assignedBy ?? ''),
  };
}

const FK_INCLUDE = {
  Lot: { select: { id: true, title: true } },
  Asset: { select: { id: true, title: true } },
};

export const listAssetsOnLots = createAdminAction<
  { page?: number; pageSize?: number; search?: string; sortField?: string; sortOrder?: string },
  PaginatedResponse<AssetsOnLotsRow>
>(async (ctx, input) => {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const skip = (page - 1) * pageSize;
  const search = input.search?.trim();

  const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { Lot: { title: { contains: search } } },
      { Asset: { title: { contains: search } } },
      { assignedBy: { contains: search } },
    ];
  }

  const orderBy: Record<string, string> = {};
  if (input.sortField) {
    orderBy[input.sortField] = input.sortOrder === 'asc' ? 'asc' : 'desc';
  } else {
    orderBy.assignedAt = 'desc';
  }

  const [items, total] = await Promise.all([
    prisma.assetsOnLots.findMany({ where, include: FK_INCLUDE, skip, take: pageSize, orderBy }),
    prisma.assetsOnLots.count({ where }),
  ]);

  const data = sanitizeResponse(items).map(toRow);
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
});

export const createAssetsOnLots = createAdminAction<Record<string, unknown>, AssetsOnLotsRow>(
  async (ctx, input) => {
    const record = await prisma.assetsOnLots.create({
      data: {
        lotId: BigInt(input.lotId as string),
        assetId: BigInt(input.assetId as string),
        assignedBy: String(input.assignedBy),
        tenantId: ctx.tenantIdBigInt,
      },
      include: FK_INCLUDE,
    });
    return toRow(sanitizeResponse(record));
  }
);

export const updateAssetsOnLots = createAdminAction<Record<string, unknown>, AssetsOnLotsRow>(
  async (ctx, input) => {
    const lotId = BigInt(input.lotId as string);
    const assetId = BigInt(input.assetId as string);
    const data: Record<string, unknown> = {};
    if (input.assignedBy !== undefined) data.assignedBy = String(input.assignedBy);

    const record = await prisma.assetsOnLots.update({
      where: { lotId_assetId: { lotId, assetId }, tenantId: ctx.tenantIdBigInt },
      data,
      include: FK_INCLUDE,
    });
    return toRow(sanitizeResponse(record));
  }
);

export const deleteAssetsOnLots = createAdminAction<{ lotId: string; assetId: string }, { lotId: string; assetId: string }>(
  async (ctx, input) => {
    await prisma.assetsOnLots.delete({
      where: {
        lotId_assetId: { lotId: BigInt(input.lotId), assetId: BigInt(input.assetId) },
        tenantId: ctx.tenantIdBigInt,
      },
    });
    return { lotId: input.lotId, assetId: input.assetId };
  }
);
