/**
 * @fileoverview Serviço para a lógica de negócios relacionada a perguntas sobre lotes (LotQuestions).
 */

import { LotQuestionRepository } from '../repositories/lot-question.repository';
import { CreateLotQuestionSchema, CreateLotQuestionInput, AnswerLotQuestionSchema } from '../lib/zod/lot-question-schema';

export class LotQuestionService {
  private lotQuestionRepository: LotQuestionRepository;

  constructor() {
    this.lotQuestionRepository = new LotQuestionRepository();
  }

  /**
   * Cria uma nova pergunta sobre um lote.
   * @param lotId O ID do lote.
   * @param userId O ID do usuário que pergunta.
   * @param authorName O nome do autor.
   * @param question O texto da pergunta.
   * @returns Um objeto de resultado com sucesso ou falha.
   */
  async createQuestion(
    lotId: string,
    userId: string,
    authorName: string,
    question: string
  ) {
    const input: CreateLotQuestionInput = { lotId, userId, authorName, question };
    const validation = CreateLotQuestionSchema.safeParse(input);

    if (!validation.success) {
      return { success: false, message: "Dados da pergunta inválidos.", errors: validation.error.flatten().fieldErrors };
    }

    try {
      const newQuestion = await this.lotQuestionRepository.create(validation.data);
      return { success: true, message: "Pergunta enviada com sucesso.", question: newQuestion };
    } catch (error) {
      console.error('Error creating lot question:', error);
      return { success: false, message: "Falha ao enviar a pergunta." };
    }
  }

  /**
   * Adiciona uma resposta a uma pergunta existente.
   * @param questionId O ID da pergunta.
   * @param answer O texto da resposta.
   * @returns Um objeto de resultado com sucesso ou falha.
   */
  async answerQuestion(questionId: string, answer: string) {
    const validation = AnswerLotQuestionSchema.safeParse({ answer });

    if (!validation.success) {
      return { success: false, message: "Resposta inválida.", errors: validation.error.flatten().fieldErrors };
    }

    try {
      const updatedQuestion = await this.lotQuestionRepository.addAnswer(questionId, validation.data.answer as string);
      return { success: true, message: "Resposta enviada com sucesso.", question: updatedQuestion };
    } catch (error) {
      console.error(`Error answering lot question ${questionId}:`, error);
      return { success: false, message: "Falha ao enviar a resposta." };
    }
  }

  /**
   * Busca todas as perguntas de um lote específico.
   * @param lotId O ID do lote.
   * @returns Uma lista de perguntas.
   */
  async getQuestionsForLot(lotId: string) {
    try {
      const questions = await this.lotQuestionRepository.findByLotId(lotId);
      return { success: true, questions };
    } catch (error) {
      console.error(`Error fetching questions for lot ${lotId}:`, error);
      return { success: false, message: "Falha ao buscar as perguntas." };
    }
  }
}
