/**
 * @fileoverview Server Actions para JudicialProcess — Admin Plus.
 */
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { judicialProcessSchema } from './schema';
import type { JudicialProcessRow } from './types';

const includeRelations = {
  Court: { select: { name: true } },
  JudicialDistrict: { select: { name: true } },
  JudicialBranch: { select: { name: true } },
  Seller: { select: { name: true } },
};

function toRow(r: Record<string, unknown>): JudicialProcessRow {
  const court = r.Court as { name: string } | null;
  const district = r.JudicialDistrict as { name: string } | null;
  const branch = r.JudicialBranch as { name: string } | null;
  const seller = r.Seller as { name: string } | null;
  return {
    id: String(r.id),
    publicId: String(r.publicId ?? ''),
    processNumber: String(r.processNumber ?? ''),
    isElectronic: Boolean(r.isElectronic),
    courtId: r.courtId ? String(r.courtId) : null,
    courtName: court?.name ?? null,
    districtId: r.districtId ? String(r.districtId) : null,
    districtName: district?.name ?? null,
    branchId: r.branchId ? String(r.branchId) : null,
    branchName: branch?.name ?? null,
    sellerId: r.sellerId ? String(r.sellerId) : null,
    sellerName: seller?.name ?? null,
    propertyMatricula: (r.propertyMatricula as string) ?? null,
    propertyRegistrationNumber: (r.propertyRegistrationNumber as string) ?? null,
    actionType: (r.actionType as string) ?? null,
    actionDescription: (r.actionDescription as string) ?? null,
    actionCnjCode: (r.actionCnjCode as string) ?? null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? ''),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt ?? ''),
  };
}

function generatePublicId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `JP-${ts}-${rand}`.toUpperCase();
}

export const listJudicialProcesses = createAdminAction({
  inputSchema: z.object({
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(25),
    search: z.string().optional().default(''),
    sortId: z.string().optional().default('processNumber'),
    sortDesc: z.boolean().optional().default(false),
  }),
  requiredPermission: 'judicial_processes:read',
  handler: async ({ input, ctx }) => {
    const { page, pageSize, search, sortId, sortDesc } = input;
    const where = {
      tenantId: ctx.tenantIdBigInt,
      ...(search
        ? { OR: [{ processNumber: { contains: search } }, { publicId: { contains: search } }] }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.judicialProcess.count({ where }),
      prisma.judicialProcess.findMany({
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

export const createJudicialProcess = createAdminAction({
  inputSchema: judicialProcessSchema,
  requiredPermission: 'judicial_processes:create',
  handler: async ({ input, ctx }) => {
    const record = await prisma.judicialProcess.create({
      data: {
        publicId: generatePublicId(),
        processNumber: input.processNumber,
        isElectronic: input.isElectronic ?? true,
        tenantId: ctx.tenantIdBigInt,
        courtId: input.courtId ? BigInt(input.courtId) : null,
        districtId: input.districtId ? BigInt(input.districtId) : null,
        branchId: input.branchId ? BigInt(input.branchId) : null,
        sellerId: input.sellerId ? BigInt(input.sellerId) : null,
        propertyMatricula: input.propertyMatricula || null,
        propertyRegistrationNumber: input.propertyRegistrationNumber || null,
        actionType: (input.actionType as string) || null,
        actionDescription: input.actionDescription || null,
        actionCnjCode: input.actionCnjCode || null,
        updatedAt: new Date(),
      },
      include: includeRelations,
    });
    return sanitizeResponse(toRow(record as unknown as Record<string, unknown>));
  },
});

export const updateJudicialProcess = createAdminAction({
  inputSchema: judicialProcessSchema.extend({ id: z.string().min(1) }),
  requiredPermission: 'judicial_processes:update',
  handler: async ({ input, ctx }) => {
    const { id, ...data } = input;
    const record = await prisma.judicialProcess.update({
      where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt },
      data: {
        processNumber: data.processNumber,
        isElectronic: data.isElectronic ?? true,
        courtId: data.courtId ? BigInt(data.courtId) : null,
        districtId: data.districtId ? BigInt(data.districtId) : null,
        branchId: data.branchId ? BigInt(data.branchId) : null,
        sellerId: data.sellerId ? BigInt(data.sellerId) : null,
        propertyMatricula: data.propertyMatricula || null,
        propertyRegistrationNumber: data.propertyRegistrationNumber || null,
        actionType: (data.actionType as string) || null,
        actionDescription: data.actionDescription || null,
        actionCnjCode: data.actionCnjCode || null,
      },
      include: includeRelations,
    });
    return sanitizeResponse(toRow(record as unknown as Record<string, unknown>));
  },
});

export const deleteJudicialProcess = createAdminAction({
  inputSchema: z.object({ id: z.string().min(1) }),
  requiredPermission: 'judicial_processes:delete',
  handler: async ({ input, ctx }) => {
    await prisma.judicialProcess.delete({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
    });
    return { deleted: true };
  },
});
