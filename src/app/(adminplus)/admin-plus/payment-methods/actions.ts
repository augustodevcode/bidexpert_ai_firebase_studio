/**
 * Server Actions CRUD para PaymentMethod no Admin Plus.
 * tenantId é nullable neste model.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { paymentMethodSchema } from './schema';
import type { PaymentMethodRow } from './types';

function toRow(r: any): PaymentMethodRow {
  return {
    id: r.id.toString(),
    bidderId: r.bidderId?.toString() ?? '',
    bidderName: r.BidderProfile?.User?.fullName ?? r.BidderProfile?.id?.toString() ?? '',
    type: r.type ?? '',
    isDefault: !!r.isDefault,
    isActive: !!r.isActive,
    cardLast4: r.cardLast4 ?? '',
    cardBrand: r.cardBrand ?? '',
    cardToken: r.cardToken ?? '',
    pixKey: r.pixKey ?? '',
    pixKeyType: r.pixKeyType ?? '',
    expiresAt: r.expiresAt?.toISOString?.() ?? '',
    createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
    updatedAt: r.updatedAt?.toISOString?.() ?? String(r.updatedAt),
  };
}

const includeRelations = { BidderProfile: { include: { User: { select: { fullName: true } } } } };

/* ───── LIST ───── */
export const listPaymentMethods = createAdminAction(async (ctx, params?: { page?: number; pageSize?: number; sortField?: string; sortDirection?: string; search?: string }) => {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const search = params?.search?.trim() ?? '';
  const orderBy: any = { [params?.sortField ?? 'createdAt']: params?.sortDirection ?? 'desc' };

  const where: any = { OR: [{ tenantId: ctx.tenantIdBigInt }, { tenantId: null }] };
  if (search) {
    where.AND = [{ OR: [{ cardLast4: { contains: search } }, { pixKey: { contains: search } }] }];
  }

  const [data, total] = await Promise.all([
    prisma.paymentMethod.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: includeRelations }),
    prisma.paymentMethod.count({ where }),
  ]);

  return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

/* ───── GET ───── */
export const getPaymentMethod = createAdminAction(async (ctx, params: { id: string }) => {
  const record = await prisma.paymentMethod.findUnique({ where: { id: BigInt(params.id) }, include: includeRelations });
  if (!record) throw new Error('Registro não encontrado');
  return sanitizeResponse(toRow(record));
});

/* ───── CREATE ───── */
export const createPaymentMethod = createAdminAction(async (ctx, data: unknown) => {
  const parsed = paymentMethodSchema.parse(data);
  const record = await prisma.paymentMethod.create({
    data: {
      bidderId: BigInt(parsed.bidderId),
      type: parsed.type as any,
      isDefault: parsed.isDefault,
      isActive: parsed.isActive,
      cardLast4: parsed.cardLast4 || null,
      cardBrand: parsed.cardBrand || null,
      cardToken: parsed.cardToken || null,
      pixKey: parsed.pixKey || null,
      pixKeyType: parsed.pixKeyType || null,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
      tenantId: ctx.tenantIdBigInt,
      updatedAt: new Date(),
    },
    include: includeRelations,
  });
  return sanitizeResponse(toRow(record));
});

/* ───── UPDATE ───── */
export const updatePaymentMethod = createAdminAction(async (ctx, { id, data }: { id: string; data: unknown }) => {
  const parsed = paymentMethodSchema.parse(data);
  const record = await prisma.paymentMethod.update({
    where: { id: BigInt(id) },
    data: {
      bidderId: BigInt(parsed.bidderId),
      type: parsed.type as any,
      isDefault: parsed.isDefault,
      isActive: parsed.isActive,
      cardLast4: parsed.cardLast4 || null,
      cardBrand: parsed.cardBrand || null,
      cardToken: parsed.cardToken || null,
      pixKey: parsed.pixKey || null,
      pixKeyType: parsed.pixKeyType || null,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
    },
    include: includeRelations,
  });
  return sanitizeResponse(toRow(record));
});

/* ───── DELETE ───── */
export const deletePaymentMethod = createAdminAction(async (ctx, params: { id: string }) => {
  await prisma.paymentMethod.delete({ where: { id: BigInt(params.id) } });
  return { success: true as const };
});
