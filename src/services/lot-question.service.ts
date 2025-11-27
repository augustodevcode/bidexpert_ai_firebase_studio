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

  async create(data: CreateLotQuestionInput & { tenantId: string }) {
    const { lotId, userId, authorName, question, tenantId } = data;
    
    // Buscar auction e tenant do lot
    const lot = await this.prisma.lot.findUnique({
      where: { id: BigInt(lotId) },
      select: { auctionId: true }
    });
    
    if (!lot || !lot.auctionId) {
      throw new Error('Lote não encontrado ou sem leilão associado');
    }
    
    return this.repository.create({
      userDisplayName: authorName,
      questionText: question,
      lot: { connect: { id: BigInt(lotId) } },
      user: { connect: { id: BigInt(userId) } },
      auction: { connect: { id: lot.auctionId } },
      tenant: { connect: { id: BigInt(tenantId) } }
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
