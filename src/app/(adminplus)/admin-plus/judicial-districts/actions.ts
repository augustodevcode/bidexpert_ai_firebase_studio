/**
 * @fileoverview Server Actions para JudicialDistrict — Admin Plus.
 */
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { judicialDistrictSchema } from './schema';
import type { JudicialDistrictRow } from './types';

const includeRelations = {
  Court: { select: { name: true } },
  State: { select: { name: true } },
} as const;

function toRow(item: Record<string, unknown>): JudicialDistrictRow {
  const i = item as Record<string, unknown> & {
    Court?: { name: string } | null;
    State?: { name: string } | null;
  };
  return {
    id: String(i.id),
    name: String(i.name ?? ''),
    slug: String(i.slug ?? ''),
    courtId: i.courtId ? String(i.courtId) : null,
    courtName: i.Court?.name ?? null,
    stateId: i.stateId ? String(i.stateId) : null,
    stateName: i.State?.name ?? null,
    zipCode: i.zipCode ? String(i.zipCode) : null,
    createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : i.createdAt ? String(i.createdAt) : null,
    updatedAt: i.updatedAt instanceof Date ? i.updatedAt.toISOString() : i.updatedAt ? String(i.updatedAt) : null,
  };
}

// ─── List ─────────────────────────────────────────
export const listJudicialDistricts = createAdminAction({
  inputSchema: z.object({
    page: z.coerce.number().optional().default(1),
    pageSize: z.coerce.number().optional().default(25),
    search: z.string().optional(),
    sortField: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
  }),
  requiredPermission: 'judicial-districts:read',
  handler: async ({ input }) => {
    const { page, pageSize, search, sortField, sortDir } = input;
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ];
    }
    const orderBy = sortField ? { [sortField]: sortDir ?? 'asc' } : { name: 'asc' as const };
    const [items, total] = await Promise.all([
      prisma.judicialDistrict.findMany({
        where,
        include: includeRelations,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.judicialDistrict.count({ where }),
    ]);
    return sanitizeResponse({
      data: items.map((i) => toRow(i as unknown as Record<string, unknown>)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  },
});

// ─── Create ───────────────────────────────────────
export const createJudicialDistrict = createAdminAction({
  inputSchema: judicialDistrictSchema,
  requiredPermission: 'judicial-districts:create',
  handler: async ({ input }) => {
    const item = await prisma.judicialDistrict.create({
      data: {
        name: input.name,
        slug: input.slug,
        courtId: input.courtId ? BigInt(input.courtId) : null,
        stateId: input.stateId ? BigInt(input.stateId) : null,
        zipCode: input.zipCode || null,
        updatedAt: new Date(),
      },
      include: includeRelations,
    });
    return toRow(item as unknown as Record<string, unknown>);
  },
});

// ─── Update ───────────────────────────────────────
export const updateJudicialDistrict = createAdminAction({
  inputSchema: z.object({ id: z.string(), data: judicialDistrictSchema }),
  requiredPermission: 'judicial-districts:update',
  handler: async ({ input }) => {
    const item = await prisma.judicialDistrict.update({
      where: { id: BigInt(input.id) },
      data: {
        name: input.data.name,
        slug: input.data.slug,
        courtId: input.data.courtId ? BigInt(input.data.courtId) : null,
        stateId: input.data.stateId ? BigInt(input.data.stateId) : null,
        zipCode: input.data.zipCode || null,
      },
      include: includeRelations,
    });
    return toRow(item as unknown as Record<string, unknown>);
  },
});

// ─── Delete ───────────────────────────────────────
export const deleteJudicialDistrict = createAdminAction({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'judicial-districts:delete',
  handler: async ({ input }) => {
    await prisma.judicialDistrict.delete({
      where: { id: BigInt(input.id) },
    });
    return { deleted: true };
  },
});
