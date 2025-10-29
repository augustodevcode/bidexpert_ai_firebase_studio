// src/repositories/lot-question.repository.ts
/**
 * @fileoverview Repositório para a entidade LotQuestion, lidando com o acesso ao banco de dados.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export class LotQuestionRepository {
  /**
   * Cria uma nova pergunta no banco de dados.
   * @param data Os dados para a nova pergunta.
   * @returns A pergunta criada.
   */
  async create(data: Prisma.LotQuestionCreateInput) {
    return prisma.lotQuestion.create({
      data,
    });
  }

  /**
   * Adiciona uma resposta a uma pergunta existente.
   * @param questionId O ID da pergunta a ser respondida.
   * @param answer O texto da resposta.
   * @param answeredByUserId O ID do usuário que respondeu.
   * @param answeredByUserDisplayName O nome de exibição do usuário que respondeu.
   * @returns A pergunta atualizada com a resposta.
   */
  async addAnswer(questionId: string, answer: string, answeredByUserId: string, answeredByUserDisplayName: string) {
    return prisma.lotQuestion.update({
      where: { id: BigInt(questionId) },
      data: {
        answerText: answer,
        answeredByUserId: BigInt(answeredByUserId),
        answeredByUserDisplayName: answeredByUserDisplayName,
        answeredAt: new Date(),
      },
    });
  }

  /**
   * Encontra perguntas por ID do lote.
   * @param lotId O ID do lote.
   * @returns Uma lista de perguntas para o lote especificado.
   */
  async findByLotId(lotId: string) {
    return prisma.lotQuestion.findMany({
      where: { lotId: BigInt(lotId) },
      orderBy: { createdAt: 'desc' },
    });
  }
}
