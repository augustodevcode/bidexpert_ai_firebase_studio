// src/services/lot-question.service.ts
import { LotQuestionRepository } from '@/repositories/lot-question.repository';
import type { CreateLotQuestionInput } from '@/lib/zod/lot-question-schema';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class LotQuestionService {
  private repository: LotQuestionRepository;
  private prisma;

  constructor() {
    this.repository = new LotQuestionRepository();
    this.prisma = prisma;
  }

  async create(data: CreateLotQuestionInput) {
    const { lotId, userId, auctionId, ...rest } = data;
    return this.repository.create({
      ...rest,
      lot: { connect: { id: lotId } },
      user: { connect: { id: userId } },
      auction: { connect: { id: auctionId } }
    });
  }

  async addAnswer(questionId: string, answer: string, answeredByUserId: string, answeredByUserDisplayName: string) {
    return this.repository.addAnswer(questionId, answer, answeredByUserId, answeredByUserDisplayName);
  }

  async findByLotId(lotId: string) {
    return this.repository.findByLotId(lotId);
  }
  
  async deleteMany(where: Prisma.LotQuestionWhereInput) {
    return this.prisma.lotQuestion.deleteMany({ where });
  }
}
