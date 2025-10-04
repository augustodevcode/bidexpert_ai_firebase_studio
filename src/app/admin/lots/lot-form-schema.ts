// src/app/admin/lots/lot-form-schema.ts
/**
 * @fileoverview Define o schema de validação (usando Zod) para o formulário
 * de criação e edição de Lotes. Este schema foi simplificado para ser mais
 * flexível.
 */
import * as z from 'zod';
import { lotStatusValues } from '@/lib/zod-enums';

const optionalUrlSchema = z.string().url({ message: "URL inválida." }).or(z.literal('')).optional().nullable();

const lotStageDetailsSchema = z.object({
  stageId: z.string(),
  stageName: z.string(),
  initialBid: z.coerce.number().positive("Lance inicial deve ser positivo.").optional().nullable(),
  bidIncrement: z.coerce.number().positive("Incremento deve ser positivo.").optional().nullable(),
});

export const lotFormSchema = z.object({
  title: z.string().min(5, {
    message: "O título do lote deve ter pelo menos 5 caracteres.",
  }).max(200, {
    message: "O título do lote não pode exceder 200 caracteres.",
  }),
  auctionId: z.string().min(1, { message: "É obrigatório associar o lote a um leilão."}),
  auctionName: z.string().optional(),
  number: z.string().max(20, "Número do lote muito longo.").optional().nullable(),
  description: z.string().max(5000, {
    message: "A descrição não pode exceder 5000 caracteres.",
  }).optional().nullable(),
  properties: z.string().max(10000, "As propriedades não podem exceder 10.000 caracteres.").optional().nullable(),
  status: z.enum(lotStatusValues as [string, ...string[]]),
  stateId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  type: z.string().min(1, { message: "O tipo/categoria do lote é obrigatório."}).max(100),
  subcategoryId: z.string().optional().nullable(),
  imageUrl: optionalUrlSchema,
  imageMediaId: z.string().optional().nullable(),
  winningBidTermUrl: optionalUrlSchema,
  galleryImageUrls: z.array(z.string().url({ message: "Uma das URLs da galeria é inválida." })).optional(),
  mediaItemIds: z.array(z.string()).optional(),
  assetIds: z.array(z.string()).optional(),
  inheritedMediaFromAssetId: z.string().optional().nullable(),
  views: z.coerce.number().int().nonnegative().optional(),
  bidsCount: z.coerce.number().int().nonnegative().optional(),
  isFeatured: z.boolean().default(false).optional(),
  isExclusive: z.boolean().default(false).optional(),
  price: z.coerce.number().positive({message: "O valor deve ser positivo"}),
  initialPrice: z.coerce.number().positive({message: "O valor deve ser positivo"}).optional().nullable(),
  bidIncrementStep: z.coerce.number().positive({message: "O valor deve ser positivo"}).optional().nullable(),
  
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  mapAddress: z.string().max(255, { message: "Endereço do mapa não pode exceder 255 caracteres." }).optional().nullable(),
  
  dataAiHint: z.string().max(100).optional().nullable(),
  sellerId: z.string().optional().nullable(),
  auctioneerId: z.string().optional().nullable(),
  
  stageDetails: z.array(lotStageDetailsSchema).optional(),
  
  // For relisting logic
  originalLotId: z.string().optional(),
  isRelisted: z.boolean().optional(),
  relistCount: z.number().int().optional(),
});

export type LotFormValues = z.infer<typeof lotFormSchema>;
