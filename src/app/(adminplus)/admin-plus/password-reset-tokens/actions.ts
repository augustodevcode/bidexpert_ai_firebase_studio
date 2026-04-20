/**
 * @fileoverview Server actions para PasswordResetToken — Admin Plus.
 * Entidade GLOBAL (sem tenantId). Apenas list + create + delete.
 */
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { passwordResetTokenSchema } from './schema';
import type { PasswordResetTokenRow } from './types';
import type { PaginatedResponse, ActionResult } from '@/lib/admin-plus/types';

/* ───────── LIST ───────── */
export const listPasswordResetTokens = createAdminAction({
  inputSchema: z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(25),
    search: z.string().optional(),
  }),
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    const { page = 1, pageSize = 25, search } = (input ?? {}) as {
      page?: number;
      pageSize?: number;
      search?: string;
    };

    const where = search
      ? { email: { contains: search } }
      : {};

    const [data, total] = await Promise.all([
      prisma.passwordResetToken.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.passwordResetToken.count({ where }),
    ]);

    const rows: PasswordResetTokenRow[] = (sanitizeResponse(data) as Record<string, unknown>[]).map(
      (r) => ({
        id: String(r.id),
        email: String(r.email ?? ''),
        token: String(r.token ?? ''),
        expires: String(r.expires ?? ''),
        createdAt: String(r.createdAt ?? ''),
      }),
    );

    return { data: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },
});

/* ───────── CREATE ───────── */
export const createPasswordResetToken = createAdminAction<
  typeof passwordResetTokenSchema,
  PasswordResetTokenRow
>({
  inputSchema: passwordResetTokenSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    const created = await prisma.passwordResetToken.create({
      data: {
        email: input.email,
        token: input.token,
        expires: new Date(input.expires),
      },
    });

    const r = sanitizeResponse(created) as Record<string, unknown>;
    return {
      id: String(r.id),
      email: String(r.email ?? ''),
      token: String(r.token ?? ''),
      expires: String(r.expires ?? ''),
      createdAt: String(r.createdAt ?? ''),
    };
  },
});

/* ───────── DELETE ───────── */
export const deletePasswordResetToken = createAdminAction<
  z.ZodObject<{ id: z.ZodString }>,
  { id: string }
>({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input }) => {
    await prisma.passwordResetToken.delete({ where: { id: BigInt(input.id) } });
    return { id: input.id };
  },
});
