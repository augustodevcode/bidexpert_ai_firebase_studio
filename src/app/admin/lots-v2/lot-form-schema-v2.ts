// src/app/admin/lots-v2/lot-form-schema-v2.ts
/**
 * @fileoverview Schema de validação Zod V2 para o formulário de Lote.
 * Inclui validações reforçadas, campos condicionais e tipos derivados
 * para uso com react-hook-form.
 */
import * as z from 'zod';
import { lotStatusValues } from '@/lib/zod-enums';

const optionalUrlSchema = z
  .string()
  .url({ message: 'URL inválida.' })
  .or(z.literal(''))
  .optional()
  .nullable();

export const lotFormSchemaV2 = z.object({
  // Identificação
  title: z
    .string()
    .min(5, { message: 'Título deve ter pelo menos 5 caracteres.' })
    .max(200, { message: 'Título não pode exceder 200 caracteres.' }),

  number: z
    .string()
    .max(20, { message: 'Número do lote muito longo.' })
    .optional()
    .nullable(),

  description: z
    .string()
    .max(5000, { message: 'Descrição não pode exceder 5000 caracteres.' })
    .optional()
    .nullable(),

  // Associação
  auctionId: z.string().min(1, { message: 'Selecione o leilão associado.' }),

  // Status
  status: z.enum(lotStatusValues as [string, ...string[]], {
    required_error: 'Selecione o status do lote.',
  }),

  // Categoria
  type: z
    .string()
    .min(1, { message: 'O tipo/categoria é obrigatório.' })
    .max(100),
  categoryId: z.string().optional().nullable(),
  subcategoryId: z.string().optional().nullable(),

  // Preços
  price: z.coerce
    .number({ invalid_type_error: 'Informe um valor numérico.' })
    .positive({ message: 'O lance mínimo deve ser positivo.' }),

  initialPrice: z.coerce
    .number()
    .positive({ message: 'O valor de avaliação deve ser positivo.' })
    .optional()
    .nullable(),

  bidIncrementStep: z.coerce
    .number()
    .positive({ message: 'O incremento deve ser positivo.' })
    .optional()
    .nullable(),

  // Localização
  stateId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  mapAddress: z
    .string()
    .max(255, { message: 'Endereço não pode exceder 255 caracteres.' })
    .optional()
    .nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),

  // Participantes
  sellerId: z.string().optional().nullable(),
  auctioneerId: z.string().optional().nullable(),

  // Mídia
  imageUrl: optionalUrlSchema,
  imageMediaId: z.string().optional().nullable(),
  winningBidTermUrl: optionalUrlSchema,

  // Flags
  isFeatured: z.boolean().default(false).optional(),
  isExclusive: z.boolean().default(false).optional(),

  // SEO / AI
  dataAiHint: z.string().max(100).optional().nullable(),
});

export type LotFormValuesV2 = z.infer<typeof lotFormSchemaV2>;

// Labels para status de lote
export const LOT_STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  AGUARDANDO: 'Aguardando',
  EM_BREVE: 'Em Breve',
  ABERTO_PARA_LANCES: 'Aberto para Lances',
  EM_PREGAO: 'Em Pregão',
  ENCERRADO: 'Encerrado',
  VENDIDO: 'Vendido',
  NAO_VENDIDO: 'Não Vendido',
  RELISTADO: 'Relistado',
  CANCELADO: 'Cancelado',
  RETIRADO: 'Retirado',
};

// Cores para status de lote
export const LOT_STATUS_COLORS: Record<string, string> = {
  RASCUNHO: 'bg-muted text-muted-foreground',
  AGUARDANDO: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  EM_BREVE: 'bg-blue-100 text-blue-800 border border-blue-200',
  ABERTO_PARA_LANCES: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  EM_PREGAO: 'bg-green-500 text-white',
  ENCERRADO: 'bg-slate-200 text-slate-700 border border-slate-300',
  VENDIDO: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  NAO_VENDIDO: 'bg-orange-100 text-orange-800 border border-orange-200',
  RELISTADO: 'bg-purple-100 text-purple-800 border border-purple-200',
  CANCELADO: 'bg-destructive/10 text-destructive border border-destructive/30',
  RETIRADO: 'bg-gray-100 text-gray-600 border border-gray-300',
};
