/**
 * @fileoverview Server actions para Report no Admin Plus.
 */
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import type { ReportRow } from './types';
import { reportSchema } from './schema';

const listReportsSchema = z.object({
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(25),
  search: z.string().optional().default(''),
  sortField: z.string().optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const updateReportSchema = z.object({
  id: z.string(),
  data: reportSchema,
});

const deleteReportSchema = z.object({
  id: z.string(),
});

const ALLOWED_SORT_FIELDS = new Set(['name', 'createdAt', 'updatedAt']);

function formatDefinitionPreview(definition: unknown) {
  const text = JSON.stringify(definition);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function toRow(value: Record<string, unknown>): ReportRow {
  const user = (value.User as Record<string, unknown> | undefined) ?? {};
  const definition = value.definition;
  const definitionText = JSON.stringify(definition, null, 2);

  return {
    id: String(value.id),
    name: String(value.name ?? ''),
    description: String(value.description ?? ''),
    definitionPreview: formatDefinitionPreview(definition),
    definitionText,
    createdByName: String(user.fullName ?? user.email ?? value.createdById ?? ''),
    createdAt: value.createdAt ? new Date(String(value.createdAt)).toISOString() : new Date().toISOString(),
    updatedAt: value.updatedAt ? new Date(String(value.updatedAt)).toISOString() : new Date().toISOString(),
  };
}

export const listReportsAction = createAdminAction({
  inputSchema: listReportsSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const { page, pageSize, search, sortField, sortOrder } = input;
    const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const finalSortField = ALLOWED_SORT_FIELDS.has(sortField) ? sortField : 'updatedAt';

    const [rows, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          User: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { [finalSortField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.report.count({ where }),
    ]);

    const data = sanitizeResponse(rows).map((row) => toRow(row as Record<string, unknown>));

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    } satisfies PaginatedResponse<ReportRow>;
  },
});

export const createReportAction = createAdminAction({
  inputSchema: reportSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const record = await prisma.report.create({
      data: {
        name: input.name,
        description: input.description || null,
        definition: JSON.parse(input.definitionText),
        tenantId: ctx.tenantIdBigInt,
        createdById: BigInt(ctx.userId),
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return toRow(sanitizeResponse(record) as Record<string, unknown>);
  },
});

export const updateReportAction = createAdminAction({
  inputSchema: updateReportSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const record = await prisma.report.update({
      where: {
        id: BigInt(input.id),
        tenantId: ctx.tenantIdBigInt,
      },
      data: {
        name: input.data.name,
        description: input.data.description || null,
        definition: JSON.parse(input.data.definitionText),
      },
      include: {
        User: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return toRow(sanitizeResponse(record) as Record<string, unknown>);
  },
});

export const deleteReportAction = createAdminAction({
  inputSchema: deleteReportSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    await prisma.report.delete({
      where: {
        id: BigInt(input.id),
        tenantId: ctx.tenantIdBigInt,
      },
    });

    return { deleted: true };
  },
});