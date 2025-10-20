// src/repositories/user-lot-max-bid.repository.ts
import { prisma } from '@/lib/prisma';
import type { Prisma, UserLotMaxBid } from '@prisma/client';

export class UserLotMaxBidRepository {
  async create(data: Prisma.UserLotMaxBidCreateInput): Promise<UserLotMaxBid> {
    return prisma.userLotMaxBid.create({ data });
  }

  async upsert(data: Prisma.UserLotMaxBidCreateInput): Promise<UserLotMaxBid> {
    return prisma.userLotMaxBid.upsert({
      where: { userId_lotId: { userId: data.userId, lotId: data.lotId } },
      update: data,
      create: data,
    });
  }

  async deleteMany(where: Prisma.UserLotMaxBidWhereInput): Promise<Prisma.BatchPayload> {
    return prisma.userLotMaxBid.deleteMany({ where });
  }}
