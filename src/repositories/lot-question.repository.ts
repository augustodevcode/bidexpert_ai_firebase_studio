/**
 * @fileoverview Repositório para a entidade LotQuestion, lidando com o acesso ao banco de dados.
 */

import { PrismaClient } from '@prisma/client';
import { CreateLotQuestionInput } from '../lib/zod/lot-question-schema';

const prisma = new PrismaClient();

export class LotQuestionRepository {
  /**
   * Cria uma nova pergunta no banco de dados.
   * @param data Os dados para a nova pergunta.
   * @returns A pergunta criada.
   */
  async create(data: CreateLotQuestionInput) {
    return await prisma.lotQuestion.create({
      data,
    });
  }

  /**
   * Adiciona uma resposta a uma pergunta existente.
   * @param questionId O ID da pergunta a ser respondida.
   * @param answer O texto da resposta.
   * @returns A pergunta atualizada com a resposta.
   */
  async addAnswer(questionId: string, answer: string) {
    return await prisma.lotQuestion.update({
      where: { id: questionId },
      data: {
        answer,
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
    return await prisma.lotQuestion.findMany({
      where: { lotId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
