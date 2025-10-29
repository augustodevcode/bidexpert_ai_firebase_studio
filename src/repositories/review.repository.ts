// src/repositories/review.repository.ts
/**
 * @fileoverview Repositório para a entidade Review, lidando com o acesso ao banco de dados.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class ReviewRepository {
  /**
   * Cria uma nova avaliação no banco de dados.
   * @param data Os dados para a nova avaliação.
   * @returns A avaliação criada.
   */
  async create(data: Prisma.ReviewCreateInput) {
    return prisma.review.create({
      data,
    });
  }

  /**
   * Encontra avaliações por ID do lote.
   * @param lotId O ID do lote.
   * @returns Uma lista de avaliações para o lote especificado.
   */
  async findByLotId(lotId: string) {
    return prisma.review.findMany({
      where: { lotId: BigInt(lotId) },
      orderBy: { createdAt: 'desc' },
    });
  }
}
