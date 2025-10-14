/**
 * @fileoverview Serviço para a lógica de negócios relacionada a avaliações (Reviews).
 */

import { ReviewRepository } from '../repositories/review.repository';
import { CreateReviewSchema, CreateReviewInput } from '../lib/zod/review-schema';

export class ReviewService {
  private reviewRepository: ReviewRepository;

  constructor() {
    this.reviewRepository = new ReviewRepository();
  }

  /**
   * Cria uma nova avaliação após validar os dados.
   * @param lotId ID do lote a ser avaliado.
   * @param userId ID do usuário que está avaliando.
   * @param authorName Nome do autor da avaliação.
   * @param rating A nota da avaliação (1-5).
   * @param comment O comentário da avaliação.
   * @returns Um objeto de resultado com sucesso ou falha.
   */
  async createReview(
    lotId: string,
    userId: string,
    authorName: string,
    rating: number,
    comment?: string
  ) {
    const input: CreateReviewInput = {
      lotId,
      userId,
      authorName,
      rating,
      comment,
    };

    const validation = CreateReviewSchema.safeParse(input);

    if (!validation.success) {
      console.error('Validation errors:', validation.error.flatten().fieldErrors);
      return { success: false, message: "Dados de avaliação inválidos.", errors: validation.error.flatten().fieldErrors };
    }

    try {
      const newReview = await this.reviewRepository.create(validation.data);
      return { success: true, message: "Avaliação criada com sucesso.", review: newReview };
    } catch (error) {
      console.error('Error creating review:', error);
      return { success: false, message: "Falha ao criar a avaliação." };
    }
  }

  /**
   * Busca todas as avaliações de um lote específico.
   * @param lotId O ID do lote.
   * @returns Uma lista de avaliações.
   */
  async getReviewsForLot(lotId: string) {
    try {
      const reviews = await this.reviewRepository.findByLotId(lotId);
      return { success: true, reviews };
    } catch (error) {
      console.error(`Error fetching reviews for lot ${lotId}:`, error);
      return { success: false, message: "Falha ao buscar as avaliações." };
    }
  }
}
