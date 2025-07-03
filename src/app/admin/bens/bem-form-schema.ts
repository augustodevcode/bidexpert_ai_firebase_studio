// src/app/admin/bens/bem-form-schema.ts
import * as z from 'zod';
import type { Bem } from '@/types';

const bemStatusValues: [Bem['status'], ...Bem['status'][]] = [
  'DISPONIVEL', 'LOTEADO', 'VENDIDO', 'REMOVIDO'
];

export const bemFormSchema = z.object({
  title: z.string().min(5, {
    message: "O título do bem deve ter pelo menos 5 caracteres.",
  }).max(200, {
    message: "O título do bem não pode exceder 200 caracteres.",
  }),
  description: z.string().max(5000).optional(),
  status: z.enum(bemStatusValues),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  subcategoryId: z.string().optional().nullable(),
  judicialProcessId: z.string().optional().nullable(),
  sellerId: z.string().optional().nullable(),
  evaluationValue: z.coerce.number().positive("O valor de avaliação deve ser positivo.").optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  imageMediaId: z.string().optional().nullable(),
  dataAiHint: z.string().max(50).optional(),
  locationCity: z.string().max(100).optional(),
  locationState: z.string().max(100).optional(),
  address: z.string().max(255).optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
});

export type BemFormData = z.infer<typeof bemFormSchema>;
