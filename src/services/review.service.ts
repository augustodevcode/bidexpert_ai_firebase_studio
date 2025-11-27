
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

  async create(data: CreateReviewInput & { tenantId: string }) {
    const { lotId, userId, tenantId, ...rest } = data;
    
    // Buscar auction e tenant do lot
    const lot = await this.prisma.lot.findUnique({
      where: { id: BigInt(lotId) },
      select: { auctionId: true }
    });
    
    if (!lot || !lot.auctionId) {
      throw new Error('Lote não encontrado ou sem leilão associado');
    }
    
    return this.repository.create({
      ...rest,
      lot: { connect: { id: BigInt(lotId) } },
      user: { connect: { id: BigInt(userId) } },
      auction: { connect: { id: lot.auctionId } },
      tenant: { connect: { id: BigInt(tenantId) } }
    });
  }

  async findByLotId(lotId: string) {
    return this.repository.findByLotId(lotId);
  }

  async deleteMany(where: Prisma.ReviewWhereInput) {
    return this.prisma.review.deleteMany({ where });
  }
}
