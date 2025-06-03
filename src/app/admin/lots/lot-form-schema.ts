
import * as z from 'zod';
import type { LotStatus } from '@/types';

const lotStatusValues: [LotStatus, ...LotStatus[]] = [
  'EM_BREVE',
  'ABERTO_PARA_LANCES',
  'ENCERRADO',
  'VENDIDO',
  'NAO_VENDIDO',
];

export const lotFormSchema = z.object({
  title: z.string().min(5, {
    message: "O título do lote deve ter pelo menos 5 caracteres.",
  }).max(200, {
    message: "O título do lote não pode exceder 200 caracteres.",
  }),
  auctionId: z.string().min(1, { message: "O ID do Leilão é obrigatório."}), // Can be optional if lot is not yet in an auction
  auctionName: z.string().optional(),
  description: z.string().max(2000, {
    message: "A descrição não pode exceder 2000 caracteres.",
  }).optional(),
  price: z.coerce.number().positive({
    message: "O preço (lance inicial) deve ser um número positivo.",
  }),
  initialPrice: z.coerce.number().positive().optional(),
  status: z.enum(lotStatusValues, {
    required_error: "O status do lote é obrigatório.",
  }),
  location: z.string().min(2, { message: "A localização é obrigatória."}).max(100).optional(),
  type: z.string().min(2, { message: "O tipo/categoria do lote é obrigatório."}).max(100), // Categoria do lote
  imageUrl: z.string().url({ message: "Por favor, insira uma URL de imagem válida." }).optional().or(z.literal('')),
  endDate: z.date({
    required_error: "A data de encerramento é obrigatória.",
    invalid_type_error: "Por favor, insira uma data de encerramento válida.",
  }),
  views: z.coerce.number().int().nonnegative().optional(),
  bidsCount: z.coerce.number().int().nonnegative().optional(),
  // Adicionar outros campos da interface Lot conforme necessário
  // Ex: year, make, model, etc.
  // Para simplificar, vamos começar com estes.
});

export type LotFormValues = z.infer<typeof lotFormSchema>;
