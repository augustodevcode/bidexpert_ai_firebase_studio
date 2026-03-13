/**
 * @fileoverview Server actions para EmailLog no Admin Plus.
 */
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import type { PaginatedResponse } from '@/lib/admin-plus/types';
import type { EmailLogRow, EmailLogStats } from './types';

const listEmailLogsSchema = z.object({
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(25),
  search: z.string().optional().default(''),
  sortField: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const emptySchema = z.object({});

const ALLOWED_SORT_FIELDS = new Set(['recipient', 'subject', 'provider', 'status', 'createdAt', 'sentAt', 'updatedAt']);

function toRow(value: Record<string, unknown>): EmailLogRow {
  return {
    id: String(value.id),
    recipient: String(value.recipient ?? ''),
    subject: String(value.subject ?? ''),
    provider: String(value.provider ?? ''),
    status: String(value.status ?? 'PENDING') as EmailLogRow['status'],
    sentAt: value.sentAt ? new Date(String(value.sentAt)).toISOString() : null,
    createdAt: value.createdAt ? new Date(String(value.createdAt)).toISOString() : new Date().toISOString(),
    updatedAt: value.updatedAt ? new Date(String(value.updatedAt)).toISOString() : new Date().toISOString(),
    errorMessage: String(value.errorMessage ?? ''),
    content: String(value.content ?? ''),
  };
}

export const listEmailLogsAction = createAdminAction({
  inputSchema: listEmailLogsSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    const { page, pageSize, search, sortField, sortOrder } = input;
    const where = search
      ? {
          OR: [
            { recipient: { contains: search } },
            { subject: { contains: search } },
            { provider: { contains: search } },
            { status: { equals: search as 'PENDING' | 'SENT' | 'FAILED' } },
            { errorMessage: { contains: search } },
          ],
        }
      : undefined;

    const finalSortField = ALLOWED_SORT_FIELDS.has(sortField) ? sortField : 'createdAt';

    const [rows, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { [finalSortField]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.emailLog.count({ where }),
    ]);

    const data = sanitizeResponse(rows).map((row) => toRow(row as Record<string, unknown>));

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    } satisfies PaginatedResponse<EmailLogRow>;
  },
});

export const getEmailLogStatsAction = createAdminAction({
  inputSchema: emptySchema,
  requiredPermission: 'manage_all',
  handler: async () => {
    const [total, sent, failed, pending] = await Promise.all([
      prisma.emailLog.count(),
      prisma.emailLog.count({ where: { status: 'SENT' } }),
      prisma.emailLog.count({ where: { status: 'FAILED' } }),
      prisma.emailLog.count({ where: { status: 'PENDING' } }),
    ]);

    return { total, sent, failed, pending } satisfies EmailLogStats;
  },
});