/**
 * Server actions for LotQuestion CRUD operations.
 */
'use server';

import { createAdminAction } from '@/lib/admin-plus/safe-action';
import { prisma } from '@/lib/prisma';
import { sanitizeResponse } from '@/lib/serialization-helper';
import { lotQuestionSchema } from './schema';
import type { LotQuestionRow } from './types';

const FK_INCLUDE = {
  Lot: { select: { id: true, title: true } },
  Auction: { select: { id: true, title: true } },
  User: { select: { id: true, name: true } },
} as const;

function toRow(d: any): LotQuestionRow {
  return {
    id: d.id.toString(),
    lotId: d.lotId.toString(),
    lotTitle: d.Lot?.title ?? '',
    auctionId: d.auctionId.toString(),
    auctionTitle: d.Auction?.title ?? '',
    userId: d.userId.toString(),
    userName: d.User?.name ?? '',
    userDisplayName: d.userDisplayName,
    questionText: d.questionText,
    answerText: d.answerText ?? null,
    isPublic: d.isPublic,
    answeredAt: d.answeredAt?.toISOString?.() ?? d.answeredAt ?? null,
    answeredByUserId: d.answeredByUserId?.toString() ?? null,
    answeredByUserDisplayName: d.answeredByUserDisplayName ?? null,
    createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
  };
}

export const listLotQuestions = createAdminAction(async (ctx, params?: { page?: number; pageSize?: number; search?: string; sortField?: string; sortOrder?: string }) => {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 25;
  const search = params?.search?.trim();
  const where: any = { tenantId: ctx.tenantIdBigInt };
  if (search) {
    where.OR = [
      { questionText: { contains: search } },
      { userDisplayName: { contains: search } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.lotQuestion.findMany({ where, include: FK_INCLUDE, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [params?.sortField ?? 'createdAt']: params?.sortOrder ?? 'desc' } }),
    prisma.lotQuestion.count({ where }),
  ]);
  return sanitizeResponse({ data: data.map(toRow), total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

export const createLotQuestion = createAdminAction(async (ctx, input: unknown) => {
  const parsed = lotQuestionSchema.parse(input);
  const created = await prisma.lotQuestion.create({
    data: {
      lotId: BigInt(parsed.lotId),
      auctionId: BigInt(parsed.auctionId),
      userId: BigInt(parsed.userId),
      userDisplayName: parsed.userDisplayName,
      questionText: parsed.questionText,
      answerText: parsed.answerText || null,
      isPublic: parsed.isPublic ?? true,
      answeredByUserId: parsed.answeredByUserId ? BigInt(parsed.answeredByUserId) : null,
      answeredByUserDisplayName: parsed.answeredByUserDisplayName || null,
      answeredAt: parsed.answerText ? new Date() : null,
      tenantId: ctx.tenantIdBigInt,
      updatedAt: new Date(),
    },
    include: FK_INCLUDE,
  });
  return sanitizeResponse(toRow(created));
});

export const updateLotQuestion = createAdminAction(async (ctx, input: unknown) => {
  const { id, ...rest } = input as any;
  const valid = lotQuestionSchema.parse(rest);
  const data: any = { updatedAt: new Date() };
  if (valid.lotId) data.lotId = BigInt(valid.lotId);
  if (valid.auctionId) data.auctionId = BigInt(valid.auctionId);
  if (valid.userId) data.userId = BigInt(valid.userId);
  data.userDisplayName = valid.userDisplayName;
  data.questionText = valid.questionText;
  data.answerText = valid.answerText || null;
  data.isPublic = valid.isPublic ?? true;
  data.answeredByUserId = valid.answeredByUserId ? BigInt(valid.answeredByUserId) : null;
  data.answeredByUserDisplayName = valid.answeredByUserDisplayName || null;
  if (valid.answerText && !rest.answeredAt) data.answeredAt = new Date();
  const updated = await prisma.lotQuestion.update({ where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt }, data, include: FK_INCLUDE });
  return sanitizeResponse(toRow(updated));
});

export const deleteLotQuestion = createAdminAction(async (ctx, input: unknown) => {
  const { id } = input as any;
  await prisma.lotQuestion.delete({ where: { id: BigInt(id), tenantId: ctx.tenantIdBigInt } });
  return { deleted: true };
});
