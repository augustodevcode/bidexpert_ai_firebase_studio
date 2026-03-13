/**
 * @fileoverview Server Actions para JudicialBranch — Admin Plus.
 */
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { judicialBranchSchema } from './schema';
import type { JudicialBranchRow } from './types';

const includeRelations = {
  JudicialDistrict: { select: { name: true } },
};

function toRow(r: Record<string, unknown>): JudicialBranchRow {
  const district = r.JudicialDistrict as { name: string } | null;
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    slug: String(r.slug ?? ''),
    districtId: r.districtId ? String(r.districtId) : null,
    districtName: district?.name ?? null,
    contactName: (r.contactName as string) ?? null,
    phone: (r.phone as string) ?? null,
    email: (r.email as string) ?? null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? ''),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt ?? ''),
  };
}

export const listJudicialBranches = createAdminAction({
  inputSchema: z.object({
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(25),
    search: z.string().optional().default(''),
    sortId: z.string().optional().default('name'),
    sortDesc: z.boolean().optional().default(false),
  }),
  requiredPermission: 'judicial_branches:read',
  handler: async ({ input }) => {
    const { page, pageSize, search, sortId, sortDesc } = input;
    const where = search
      ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }] }
      : {};

    const [total, rows] = await Promise.all([
      prisma.judicialBranch.count({ where }),
      prisma.judicialBranch.findMany({
        where,
        include: includeRelations,
        orderBy: { [sortId]: sortDesc ? 'desc' : 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return sanitizeResponse({
      data: rows.map((r) => toRow(r as unknown as Record<string, unknown>)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  },
});

export const createJudicialBranch = createAdminAction({
  inputSchema: judicialBranchSchema,
  requiredPermission: 'judicial_branches:create',
  handler: async ({ input }) => {
    const record = await prisma.judicialBranch.create({
      data: {
        name: input.name,
        slug: input.slug,
        districtId: input.districtId ? BigInt(input.districtId) : null,
        contactName: input.contactName || null,
        phone: input.phone || null,
        email: input.email || null,
      },
      include: includeRelations,
    });
    return sanitizeResponse(toRow(record as unknown as Record<string, unknown>));
  },
});

export const updateJudicialBranch = createAdminAction({
  inputSchema: judicialBranchSchema.extend({ id: z.string().min(1) }),
  requiredPermission: 'judicial_branches:update',
  handler: async ({ input }) => {
    const { id, ...data } = input;
    const record = await prisma.judicialBranch.update({
      where: { id: BigInt(id) },
      data: {
        name: data.name,
        slug: data.slug,
        districtId: data.districtId ? BigInt(data.districtId) : null,
        contactName: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
      },
      include: includeRelations,
    });
    return sanitizeResponse(toRow(record as unknown as Record<string, unknown>));
  },
});

export const deleteJudicialBranch = createAdminAction({
  inputSchema: z.object({ id: z.string().min(1) }),
  requiredPermission: 'judicial_branches:delete',
  handler: async ({ input }) => {
    await prisma.judicialBranch.delete({ where: { id: BigInt(input.id) } });
    return { deleted: true };
  },
});
