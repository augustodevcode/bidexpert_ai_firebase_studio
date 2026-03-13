/**
 * Server Actions para InstallmentPayment (Parcelas de Pagamento).
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { installmentPaymentSchema } from './schema';
import type { InstallmentPaymentRow } from './types';

function toRow(r: any): InstallmentPaymentRow {
  return {
    id: r.id.toString(),
    userWinId: r.userWinId.toString(),
    userWinLabel: r.UserWin ? `#${r.UserWin.id} - ${r.UserWin.Lot?.title ?? ''}` : r.userWinId.toString(),
    installmentNumber: r.installmentNumber,
    amount: Number(r.amount),
    dueDate: r.dueDate?.toISOString?.() ?? r.dueDate,
    paidAt: r.paidAt?.toISOString?.() ?? r.paidAt ?? null,
    status: r.status,
    paymentMethod: r.paymentMethod ?? null,
    transactionId: r.transactionId ?? null,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
  };
}

const include = { UserWin: { select: { id: true, Lot: { select: { title: true } } } } };

export const listInstallmentPayments = createAdminAction(async (_input, ctx) => {
  const { page = 1, pageSize = 25, search = '', sortField = 'dueDate', sortOrder = 'asc' } = _input as any;
  const where: any = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { transactionId: { contains: search } },
      { paymentMethod: { contains: search } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.installmentPayment.findMany({ where, include, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [sortField]: sortOrder } }),
    prisma.installmentPayment.count({ where }),
  ]);
  return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

export const createInstallmentPayment = createAdminAction(async (_input, ctx) => {
  const d = installmentPaymentSchema.parse(_input);
  const r = await prisma.installmentPayment.create({
    data: {
      userWinId: BigInt(d.userWinId),
      installmentNumber: parseInt(d.installmentNumber, 10),
      amount: parseFloat(d.amount),
      dueDate: new Date(d.dueDate),
      paidAt: d.paidAt ? new Date(d.paidAt) : null,
      status: d.status as any,
      paymentMethod: d.paymentMethod || null,
      transactionId: d.transactionId || null,
      tenantId: ctx.tenantIdBigInt,
      updatedAt: new Date(),
    },
    include,
  });
  return sanitizeResponse(toRow(r));
});

export const updateInstallmentPayment = createAdminAction(async (_input, ctx) => {
  const { id, ...rest } = _input as any;
  const d = installmentPaymentSchema.parse(rest);
  const r = await prisma.installmentPayment.update({
    where: { id: BigInt(id) },
    data: {
      userWinId: BigInt(d.userWinId),
      installmentNumber: parseInt(d.installmentNumber, 10),
      amount: parseFloat(d.amount),
      dueDate: new Date(d.dueDate),
      paidAt: d.paidAt ? new Date(d.paidAt) : null,
      status: d.status as any,
      paymentMethod: d.paymentMethod || null,
      transactionId: d.transactionId || null,
    },
    include,
  });
  return sanitizeResponse(toRow(r));
});

export const deleteInstallmentPayment = createAdminAction(async (_input, ctx) => {
  const { id } = _input as any;
  await prisma.installmentPayment.delete({ where: { id: BigInt(id) } });
  return { success: true };
});
