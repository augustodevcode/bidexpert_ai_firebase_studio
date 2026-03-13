/**
 * Server Actions para CRUD de JudicialParty (Parte Processual).
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { judicialPartySchema } from './schema';
import type { JudicialPartyRow } from './types';

function toRow(r: any): JudicialPartyRow {
  return {
    id: r.id.toString(),
    name: r.name,
    documentNumber: r.documentNumber ?? '',
    partyType: r.partyType,
    processId: r.processId?.toString() ?? '',
    processNumber: r.JudicialProcess?.processNumber ?? '—',
  };
}

export const listJudicialParties = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ page = 1, pageSize = 10, search = '', sortField, sortOrder }, ctx) => {
    const where: any = { tenantId: ctx.tenantIdBigInt };
    if (search) { where.OR = [{ name: { contains: search } }, { documentNumber: { contains: search } }]; }
    const orderBy = sortField ? { [sortField]: sortOrder || 'asc' } : { name: 'asc' as const };
    const [data, total] = await Promise.all([
      prisma.judicialParty.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: { JudicialProcess: { select: { processNumber: true } } } }),
      prisma.judicialParty.count({ where }),
    ]);
    return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  },
});

export const createJudicialParty = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async (input: Record<string, unknown>, ctx) => {
    const parsed = judicialPartySchema.parse(input);
    const r = await prisma.judicialParty.create({
      data: { name: parsed.name, documentNumber: parsed.documentNumber || null, partyType: parsed.partyType as any, processId: BigInt(parsed.processId), tenantId: ctx.tenantIdBigInt },
      include: { JudicialProcess: { select: { processNumber: true } } },
    });
    return sanitizeResponse(toRow(r));
  },
});

export const updateJudicialParty = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async (input: Record<string, unknown>) => {
    const { id, ...rest } = input as any;
    const parsed = judicialPartySchema.parse(rest);
    const r = await prisma.judicialParty.update({
      where: { id: BigInt(id) },
      data: { name: parsed.name, documentNumber: parsed.documentNumber || null, partyType: parsed.partyType as any, processId: BigInt(parsed.processId) },
      include: { JudicialProcess: { select: { processNumber: true } } },
    });
    return sanitizeResponse(toRow(r));
  },
});

export const deleteJudicialParty = createAdminAction({
  requiredPermission: 'manage_all',
  handler: async ({ id }: { id: string }) => {
    await prisma.judicialParty.delete({ where: { id: BigInt(id) } });
    return { deleted: true };
  },
});
