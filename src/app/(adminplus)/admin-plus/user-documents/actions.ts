/**
 * @fileoverview Server actions para UserDocument — Admin Plus.
 * tenantId-scoped; inclui User e DocumentType para joined fields.
 */
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { userDocumentSchema } from './schema';
import type { UserDocumentRow } from './types';
import type { PaginatedResponse } from '@/lib/admin-plus/types';

const include = {
  User: { select: { fullName: true, email: true } },
  DocumentType: { select: { name: true } },
};

function toRow(r: Record<string, unknown>): UserDocumentRow {
  const user = r.User as Record<string, unknown> | null;
  const docType = r.DocumentType as Record<string, unknown> | null;
  return {
    id: String(r.id),
    status: String(r.status ?? ''),
    fileName: String(r.fileName ?? ''),
    fileUrl: String(r.fileUrl ?? ''),
    rejectionReason: String(r.rejectionReason ?? ''),
    userId: String(r.userId ?? ''),
    userName: String(user?.fullName ?? ''),
    userEmail: String(user?.email ?? ''),
    documentTypeId: String(r.documentTypeId ?? ''),
    documentTypeName: String(docType?.name ?? ''),
    tenantId: String(r.tenantId ?? ''),
    createdAt: String(r.createdAt ?? ''),
    updatedAt: String(r.updatedAt ?? ''),
  };
}

/* ───────── LIST ───────── */
export const listUserDocuments = createAdminAction({
  inputSchema: z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(25),
    search: z.string().optional(),
  }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const { page, pageSize, search } = input;

    const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };
    if (search) {
      where.OR = [
        { User: { fullName: { contains: search } } },
        { User: { email: { contains: search } } },
        { fileName: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.userDocument.findMany({
        where,
        include,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userDocument.count({ where }),
    ]);

    const rows = (sanitizeResponse(data) as Record<string, unknown>[]).map(toRow);
    return { data: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) } satisfies PaginatedResponse<UserDocumentRow>;
  },
});

/* ───────── CREATE ───────── */
export const createUserDocument = createAdminAction<typeof userDocumentSchema, UserDocumentRow>({
  inputSchema: userDocumentSchema,
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const created = await prisma.userDocument.create({
      data: {
        userId: BigInt(input.userId),
        documentTypeId: BigInt(input.documentTypeId),
        fileName: input.fileName ?? null,
        fileUrl: input.fileUrl,
        status: input.status as never,
        rejectionReason: input.rejectionReason ?? null,
        tenantId: ctx.tenantIdBigInt,
        updatedAt: new Date(),
      },
      include,
    });
    return toRow(sanitizeResponse(created) as Record<string, unknown>);
  },
});

/* ───────── UPDATE ───────── */
export const updateUserDocument = createAdminAction<
  z.ZodObject<{ id: z.ZodString } & (typeof userDocumentSchema)['shape']>,
  UserDocumentRow
>({
  inputSchema: userDocumentSchema.extend({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    const { id, ...rest } = input;
    const updated = await prisma.userDocument.update({
      where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt },
      data: {
        userId: BigInt(rest.userId),
        documentTypeId: BigInt(rest.documentTypeId),
        fileName: rest.fileName ?? null,
        fileUrl: rest.fileUrl,
        status: rest.status as never,
        rejectionReason: rest.rejectionReason ?? null,
        updatedAt: new Date(),
      },
      include,
    });
    return toRow(sanitizeResponse(updated) as Record<string, unknown>);
  },
});

/* ───────── DELETE ───────── */
export const deleteUserDocument = createAdminAction<
  z.ZodObject<{ id: z.ZodString }>,
  { id: string }
>({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'manage_all',
  handler: async ({ input, ctx }) => {
    await prisma.userDocument.delete({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
    });
    return { id: input.id };
  },
});
