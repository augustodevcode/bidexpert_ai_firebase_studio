/**
 * Server Actions para DocumentTemplate (modelo global, sem tenantId).
 */
'use server';

import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { documentTemplateSchema } from './schema';
import type { DocumentTemplateRow } from './types';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import { z } from 'zod';

function toRow(r: any): DocumentTemplateRow {
  return {
    id: r.id.toString(),
    name: r.name,
    type: r.type,
    content: r.content ?? null,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    updatedAt: r.updatedAt?.toISOString?.() ?? r.updatedAt,
  };
}

export const listDocumentTemplates = createAdminAction(
  z.object({ page: z.number().optional(), pageSize: z.number().optional(), search: z.string().optional(), sortField: z.string().optional(), sortOrder: z.enum(['asc', 'desc']).optional() }),
  async (input): Promise<PaginatedResponse<DocumentTemplateRow>> => {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const where: any = {};
    if (input.search) {
      where.OR = [
        { name: { contains: input.search } },
        { type: { contains: input.search } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.documentTemplate.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: input.sortField ? { [input.sortField]: input.sortOrder || 'asc' } : { name: 'asc' } }),
      prisma.documentTemplate.count({ where }),
    ]);
    return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  }
);

export const createDocumentTemplate = createAdminAction(
  documentTemplateSchema,
  async (data) => {
    const record = await prisma.documentTemplate.create({ data: { name: data.name, type: data.type, content: data.content || null } });
    return sanitizeResponse(toRow(record));
  }
);

export const updateDocumentTemplate = createAdminAction(
  documentTemplateSchema.extend({ id: z.string().min(1) }),
  async (data) => {
    const record = await prisma.documentTemplate.update({ where: { id: BigInt(data.id) }, data: { name: data.name, type: data.type, content: data.content || null } });
    return sanitizeResponse(toRow(record));
  }
);

export const deleteDocumentTemplate = createAdminAction(
  z.object({ id: z.string().min(1) }),
  async (data) => {
    await prisma.documentTemplate.delete({ where: { id: BigInt(data.id) } });
    return { deleted: true };
  }
);
