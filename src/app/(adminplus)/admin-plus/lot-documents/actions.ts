/**
 * Server actions for LotDocument CRUD operations.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { lotDocumentSchema } from './schema';
import type { LotDocumentRow } from './types';

const FK_INCLUDE = {
  Lot: { select: { id: true, title: true } },
} as const;

function toRow(d: any): LotDocumentRow {
  return {
    id: d.id.toString(),
    lotId: d.lotId.toString(),
    lotTitle: d.Lot?.title ?? '',
    fileName: d.fileName,
    title: d.title,
    description: d.description ?? null,
    fileUrl: d.fileUrl,
    fileSize: d.fileSize != null ? Number(d.fileSize) : null,
    mimeType: d.mimeType ?? null,
    displayOrder: d.displayOrder,
    isPublic: d.isPublic,
    createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
  };
}

export const listLotDocuments = createAdminAction(async (ctx, params?: { page?: number; pageSize?: number; search?: string; sortField?: string; sortOrder?: string }) => {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const search = params?.search?.trim();
  const where: any = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { fileName: { contains: search } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.lotDocument.findMany({ where, include: FK_INCLUDE, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [params?.sortField ?? 'createdAt']: params?.sortOrder ?? 'desc' } }),
    prisma.lotDocument.count({ where }),
  ]);
  return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

export const createLotDocument = createAdminAction(async (ctx, input: unknown) => {
  const parsed = lotDocumentSchema.parse(input);
  const created = await prisma.lotDocument.create({
    data: {
      lotId: BigInt(parsed.lotId),
      fileName: parsed.fileName,
      title: parsed.title,
      description: parsed.description || null,
      fileUrl: parsed.fileUrl,
      fileSize: parsed.fileSize != null ? BigInt(parsed.fileSize) : null,
      mimeType: parsed.mimeType || null,
      displayOrder: parsed.displayOrder ?? 0,
      isPublic: parsed.isPublic ?? true,
      tenantId: ctx.tenantIdBigInt,
      updatedAt: new Date(),
    },
    include: FK_INCLUDE,
  });
  return sanitizeResponse(toRow(created));
});

export const updateLotDocument = createAdminAction(async (ctx, input: unknown) => {
  const { id, ...parsed } = input as any;
  const valid = lotDocumentSchema.parse(parsed);
  const data: any = { updatedAt: new Date() };
  if (valid.lotId) data.lotId = BigInt(valid.lotId);
  if (valid.fileName) data.fileName = valid.fileName;
  if (valid.title) data.title = valid.title;
  data.description = valid.description || null;
  if (valid.fileUrl) data.fileUrl = valid.fileUrl;
  data.fileSize = valid.fileSize != null ? BigInt(valid.fileSize) : null;
  data.mimeType = valid.mimeType || null;
  data.displayOrder = valid.displayOrder ?? 0;
  data.isPublic = valid.isPublic ?? true;
  const updated = await prisma.lotDocument.update({ where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt }, data, include: FK_INCLUDE });
  return sanitizeResponse(toRow(updated));
});

export const deleteLotDocument = createAdminAction(async (ctx, input: unknown) => {
  const { id } = input as any;
  await prisma.lotDocument.delete({ where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt } });
  return { deleted: true };
});
