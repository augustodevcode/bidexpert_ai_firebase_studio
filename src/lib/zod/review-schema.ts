/**
 * @fileoverview Esquemas de validação Zod para a entidade Review.
 */

import { z } from 'zod';

export const ReviewSchema = z.object({
  id: z.string().cuid().optional(),
  lotId: z.string().cuid({ message: "ID do lote inválido." }),
  userId: z.string().cuid({ message: "ID do usuário inválido." }),
  authorName: z.string().min(2, "O nome do autor é obrigatório."),
  rating: z.number().min(1, "A avaliação deve ser no mínimo 1.").max(5, "A avaliação deve ser no máximo 5."),
  comment: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CreateReviewSchema = ReviewSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type ReviewFormData = z.infer<typeof ReviewSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
