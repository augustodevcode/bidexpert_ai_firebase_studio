/**
 * @fileoverview Server Actions para MediaItem — Admin Plus.
 */
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { mediaItemSchema } from './schema';
import type { MediaItemRow } from './types';

const includeUploader = { uploadedBy: { select: { name: true } } } as const;

function toRow(item: Record<string, unknown>): MediaItemRow {
  const i = item as Record<string, unknown> & { uploadedBy?: { name: string } | null };
  return {
    id: String(i.id),
    fileName: String(i.fileName ?? ''),
    storagePath: String(i.storagePath ?? ''),
    urlOriginal: String(i.urlOriginal ?? ''),
    urlThumbnail: i.urlThumbnail ? String(i.urlThumbnail) : null,
    urlMedium: i.urlMedium ? String(i.urlMedium) : null,
    urlLarge: i.urlLarge ? String(i.urlLarge) : null,
    mimeType: String(i.mimeType ?? ''),
    sizeBytes: typeof i.sizeBytes === 'number' ? i.sizeBytes : null,
    altText: i.altText ? String(i.altText) : null,
    caption: i.caption ? String(i.caption) : null,
    description: i.description ? String(i.description) : null,
    title: i.title ? String(i.title) : null,
    dataAiHint: i.dataAiHint ? String(i.dataAiHint) : null,
    uploadedByUserName: i.uploadedBy?.name ?? null,
    tenantId: i.tenantId ? String(i.tenantId) : null,
    uploadedAt: i.uploadedAt instanceof Date ? i.uploadedAt.toISOString() : i.uploadedAt ? String(i.uploadedAt) : null,
  };
}

// ─── List ─────────────────────────────────────────
export const listMediaItems = createAdminAction({
  inputSchema: z.object({
    page: z.coerce.number().optional().default(1),
    pageSize: z.coerce.number().optional().default(25),
    search: z.string().optional(),
    sortField: z.string().optional(),
    sortDir: z.enum(['asc', 'desc']).optional(),
  }),
  requiredPermission: 'media:read',
  handler: async ({ input, ctx }) => {
    const { page, pageSize, search, sortField, sortDir } = input;
    const where: Record<string, unknown> = { tenantId: ctx.tenantIdBigInt };
    if (search) {
      where.OR = [
        { fileName: { contains: search } },
        { title: { contains: search } },
        { altText: { contains: search } },
      ];
    }
    const orderBy = sortField ? { [sortField]: sortDir ?? 'asc' } : { uploadedAt: 'desc' as const };
    const [items, total] = await Promise.all([
      prisma.mediaItem.findMany({
        where,
        include: includeUploader,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.mediaItem.count({ where }),
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
export const createMediaItem = createAdminAction({
  inputSchema: mediaItemSchema,
  requiredPermission: 'media:create',
  handler: async ({ input, ctx }) => {
    const item = await prisma.mediaItem.create({
      data: {
        ...input,
        urlThumbnail: input.urlThumbnail || null,
        urlMedium: input.urlMedium || null,
        urlLarge: input.urlLarge || null,
        sizeBytes: input.sizeBytes ?? null,
        altText: input.altText || null,
        caption: input.caption || null,
        description: input.description || null,
        title: input.title || null,
        dataAiHint: input.dataAiHint || null,
        uploadedByUserId: BigInt(ctx.userId),
        tenantId: ctx.tenantIdBigInt,
      },
      include: includeUploader,
    });
    return toRow(item as unknown as Record<string, unknown>);
  },
});

// ─── Update ───────────────────────────────────────
export const updateMediaItem = createAdminAction({
  inputSchema: z.object({ id: z.string(), data: mediaItemSchema }),
  requiredPermission: 'media:update',
  handler: async ({ input, ctx }) => {
    const item = await prisma.mediaItem.update({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
      data: {
        ...input.data,
        urlThumbnail: input.data.urlThumbnail || null,
        urlMedium: input.data.urlMedium || null,
        urlLarge: input.data.urlLarge || null,
        sizeBytes: input.data.sizeBytes ?? null,
        altText: input.data.altText || null,
        caption: input.data.caption || null,
        description: input.data.description || null,
        title: input.data.title || null,
        dataAiHint: input.data.dataAiHint || null,
      },
      include: includeUploader,
    });
    return toRow(item as unknown as Record<string, unknown>);
  },
});

// ─── Delete ───────────────────────────────────────
export const deleteMediaItem = createAdminAction({
  inputSchema: z.object({ id: z.string() }),
  requiredPermission: 'media:delete',
  handler: async ({ input, ctx }) => {
    await prisma.mediaItem.delete({
      where: { id: BigInt(input.id), tenantId: ctx.tenantIdBigInt },
    });
    return { deleted: true };
  },
});
