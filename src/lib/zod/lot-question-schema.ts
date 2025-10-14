/**
 * @fileoverview Esquemas de validação Zod para a entidade LotQuestion.
 */

import { z } from 'zod';

export const LotQuestionSchema = z.object({
  id: z.string().cuid().optional(),
  lotId: z.string().cuid({ message: "ID do lote inválido." }),
  userId: z.string().cuid({ message: "ID do usuário inválido." }),
  authorName: z.string().min(2, "O nome do autor é obrigatório."),
  question: z.string().min(10, "A pergunta deve ter pelo menos 10 caracteres."),
  answer: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  answeredAt: z.date().optional().nullable(),
});

export const CreateLotQuestionSchema = LotQuestionSchema.pick({ lotId: true, userId: true, authorName: true, question: true });
export const AnswerLotQuestionSchema = LotQuestionSchema.pick({ answer: true });

export type LotQuestionFormData = z.infer<typeof LotQuestionSchema>;
export type CreateLotQuestionInput = z.infer<typeof CreateLotQuestionSchema>;
export type AnswerLotQuestionInput = z.infer<typeof AnswerLotQuestionSchema>;
