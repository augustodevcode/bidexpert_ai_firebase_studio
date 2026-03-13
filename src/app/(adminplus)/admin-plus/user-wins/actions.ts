/**
 * Server Actions para UserWin (Arrematações).
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { userWinSchema } from './schema';
import type { UserWinRow } from './types';

function toRow(r: any): UserWinRow {
  return {
    id: r.id.toString(),
    lotId: r.lotId.toString(),
    lotTitle: r.Lot?.title ?? '',
    userId: r.userId.toString(),
    userName: r.User?.fullName ?? r.User?.email ?? '',
    winningBidAmount: Number(r.winningBidAmount),
    winDate: r.winDate?.toISOString?.() ?? r.winDate,
    paymentStatus: r.paymentStatus,
    retrievalStatus: r.retrievalStatus,
    invoiceUrl: r.invoiceUrl ?? null,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
  };
}

const include = { Lot: { select: { id: true, title: true } }, User: { select: { id: true, fullName: true, email: true } } };

export const listUserWins = createAdminAction(async (_input, ctx) => {
  const { page = 1, pageSize = 25, search = '', sortField = 'id', sortOrder = 'desc' } = _input as any;
  const where: any = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { Lot: { title: { contains: search } } },
      { User: { fullName: { contains: search } } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.userWin.findMany({ where, include, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [sortField]: sortOrder } }),
    prisma.userWin.count({ where }),
  ]);
  return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

export const getUserWin = createAdminAction(async (_input, ctx) => {
  const { id } = _input as any;
  const r = await prisma.userWin.findFirstOrThrow({ where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt }, include });
  return sanitizeResponse(toRow(r));
});

export const createUserWin = createAdminAction(async (_input, ctx) => {
  const d = userWinSchema.parse(_input);
  const r = await prisma.userWin.create({
    data: {
      lotId: BigInt(d.lotId),
      userId: BigInt(d.userId),
      winningBidAmount: parseFloat(d.winningBidAmount),
      winDate: new Date(d.winDate),
      paymentStatus: d.paymentStatus as any,
      retrievalStatus: d.retrievalStatus,
      invoiceUrl: d.invoiceUrl || null,
      tenantId: ctx.tenantIdBigInt,
      updatedAt: new Date(),
    },
    include,
  });
  return sanitizeResponse(toRow(r));
});

export const updateUserWin = createAdminAction(async (_input, ctx) => {
  const { id, ...rest } = _input as any;
  const d = userWinSchema.parse(rest);
  const r = await prisma.userWin.update({
    where: { id: BigInt(id) },
    data: {
      lotId: BigInt(d.lotId),
      userId: BigInt(d.userId),
      winningBidAmount: parseFloat(d.winningBidAmount),
      winDate: new Date(d.winDate),
      paymentStatus: d.paymentStatus as any,
      retrievalStatus: d.retrievalStatus,
      invoiceUrl: d.invoiceUrl || null,
    },
    include,
  });
  return sanitizeResponse(toRow(r));
});

export const deleteUserWin = createAdminAction(async (_input, ctx) => {
  const { id } = _input as any;
  await prisma.userWin.delete({ where: { id: BigInt(id) } });
  return { success: true };
});
