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
    return this.repository.create({
      ...data,
      lot: { connect: { id: data.lotId } },
      user: { connect: { id: data.userId } },
      auction: { connect: { id: data.auctionId } }
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
