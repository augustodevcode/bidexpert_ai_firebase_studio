
// src/services/review.service.ts
import { ReviewRepository } from '@/repositories/review.repository';
import type { CreateReviewInput } from '@/lib/zod/review-schema';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class ReviewService {
  private repository: ReviewRepository;
  private prisma;

  constructor() {
    this.repository = new ReviewRepository();
    this.prisma = prisma;
  }

  async create(data: CreateReviewInput) {
    const { lotId, userId, auctionId, ...rest } = data;
    return this.repository.create({
      ...rest,
      lot: { connect: { id: BigInt(lotId) } },
      user: { connect: { id: BigInt(userId) } },
      auction: { connect: { id: BigInt(auctionId) } }
    });
  }

  async findByLotId(lotId: string) {
    return this.repository.findByLotId(lotId);
  }

  async deleteMany(where: Prisma.ReviewWhereInput) {
    return this.prisma.review.deleteMany({ where });
  }
}
