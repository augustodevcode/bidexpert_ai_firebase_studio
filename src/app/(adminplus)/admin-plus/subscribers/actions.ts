/**
 * Server Actions CRUD para Subscriber no Admin Plus.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { subscriberSchema } from './schema';
import type { SubscriberRow } from './types';

function toRow(r: any): SubscriberRow {
  return {
    id: r.id.toString(),
    email: r.email,
    name: r.name ?? '',
    phone: r.phone ?? '',
    preferences: r.preferences ? JSON.stringify(r.preferences) : '',
    createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
    updatedAt: r.updatedAt?.toISOString?.() ?? String(r.updatedAt),
  };
}

/* ───── LIST ───── */
export const listSubscribers = createAdminAction(async (ctx, params?: { page?: number; pageSize?: number; sortField?: string; sortDirection?: string; search?: string }) => {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const search = params?.search?.trim() ?? '';
  const orderBy: any = { [params?.sortField ?? 'createdAt']: params?.sortDirection ?? 'desc' };

  const where: any = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.subscriber.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.subscriber.count({ where }),
  ]);

  return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

/* ───── GET ───── */
export const getSubscriber = createAdminAction(async (ctx, params: { id: string }) => {
  const record = await prisma.subscriber.findUnique({ where: { id: BigInt(params.id) } });
  if (!record) throw new Error('Registro não encontrado');
  return sanitizeResponse(toRow(record));
});

/* ───── CREATE ───── */
export const createSubscriber = createAdminAction(async (ctx, data: unknown) => {
  const parsed = subscriberSchema.parse(data);
  const record = await prisma.subscriber.create({
    data: {
      email: parsed.email,
      name: parsed.name || null,
      phone: parsed.phone || null,
      preferences: parsed.preferences ? JSON.parse(parsed.preferences) : undefined,
      tenantId: ctx.tenantIdBigInt,
    },
  });
  return sanitizeResponse(toRow(record));
});

/* ───── UPDATE ───── */
export const updateSubscriber = createAdminAction(async (ctx, { id, data }: { id: string; data: unknown }) => {
  const parsed = subscriberSchema.parse(data);
  const record = await prisma.subscriber.update({
    where: { id: BigInt(id) },
    data: {
      email: parsed.email,
      name: parsed.name || null,
      phone: parsed.phone || null,
      preferences: parsed.preferences ? JSON.parse(parsed.preferences) : undefined,
    },
  });
  return sanitizeResponse(toRow(record));
});

/* ───── DELETE ───── */
export const deleteSubscriber = createAdminAction(async (ctx, params: { id: string }) => {
  await prisma.subscriber.delete({ where: { id: BigInt(params.id) } });
  return { success: true as const };
});
