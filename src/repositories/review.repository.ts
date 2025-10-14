/**
 * @fileoverview Repositório para a entidade Review, lidando com o acesso ao banco de dados.
 */

import { PrismaClient } from '@prisma/client';
import { CreateReviewInput } from '../lib/zod/review-schema';

const prisma = new PrismaClient();

export class ReviewRepository {
  /**
   * Cria uma nova avaliação no banco de dados.
   * @param data Os dados para a nova avaliação.
   * @returns A avaliação criada.
   */
  async create(data: CreateReviewInput) {
    return await prisma.review.create({
      data,
    });
  }

  /**
   * Encontra avaliações por ID do lote.
   * @param lotId O ID do lote.
   * @returns Uma lista de avaliações para o lote especificado.
   */
  async findByLotId(lotId: string) {
    return await prisma.review.findMany({
      where: { lotId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
