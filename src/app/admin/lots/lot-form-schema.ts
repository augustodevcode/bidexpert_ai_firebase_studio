import * as z from 'zod';
import { lotStatusValues } from '@/lib/zod-enums';

const optionalUrlSchema = z.string().url({ message: "URL inválida." }).or(z.literal('')).optional().nullable();

export const lotFormSchema = z.object({
  title: z.string().min(5, {
    message: "O título do lote deve ter pelo menos 5 caracteres.",
  }).max(200, {
    message: "O título do lote não pode exceder 200 caracteres.",
  }),
  auctionId: z.string().min(1, { message: "O ID do Leilão é obrigatório."}),
  auctionName: z.string().optional(),
  number: z.string().max(20, "Número do lote muito longo.").optional().nullable(),
  description: z.string().max(5000, {
    message: "A descrição não pode exceder 5000 caracteres.",
  }).optional().nullable(),
  price: z.coerce.number().positive({
    message: "O preço (lance inicial) deve ser um número positivo.",
  }),
  initialPrice: z.coerce.number().positive().optional().nullable(),
  secondInitialPrice: z.coerce.number().positive().optional().nullable(),
  bidIncrementStep: z.coerce.number().positive("O incremento de lance deve ser um número positivo.").optional().nullable(),
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
  bemIds: z.array(z.string()).optional(),
  views: z.coerce.number().int().nonnegative().optional(),
  bidsCount: z.coerce.number().int().nonnegative().optional(),
  isFeatured: z.boolean().default(false).optional(),
  isExclusive: z.boolean().default(false).optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  additionalTriggers: z.array(z.string()).optional(),
  
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  mapAddress: z.string().max(255, { message: "Endereço do mapa não pode exceder 255 caracteres." }).optional().nullable(),
  mapEmbedUrl: optionalUrlSchema,
  mapStaticImageUrl: optionalUrlSchema,

  judicialProcessNumber: z.string().max(100).optional().nullable(),
  courtDistrict: z.string().max(100).optional().nullable(),
  courtName: z.string().max(100).optional().nullable(),
  publicProcessUrl: optionalUrlSchema,
  propertyRegistrationNumber: z.string().max(100).optional().nullable(),
  propertyLiens: z.string().max(1000).optional().nullable(),
  knownDebts: z.string().max(1000).optional().nullable(),
  additionalDocumentsInfo: z.string().max(2000).optional().nullable(),

  reservePrice: z.coerce.number().positive({ message: "O preço de reserva deve ser positivo." }).optional().nullable(),
  evaluationValue: z.coerce.number().positive({ message: "O valor de avaliação deve ser positivo." }).optional().nullable(),
  debtAmount: z.coerce.number().positive({ message: "O montante da dívida deve ser positivo." }).optional().nullable(),
  itbiValue: z.coerce.number().positive({ message: "O valor do ITBI deve ser positivo." }).optional().nullable(),
  
  endDate: z.date().optional().nullable(),
  lotSpecificAuctionDate: z.date().optional().nullable(),
  secondAuctionDate: z.date().optional().nullable(),
  condition: z.string().max(100).optional().nullable(),
  dataAiHint: z.string().max(100).optional().nullable(),
  sellerId: z.string().optional().nullable(),
  auctioneerId: z.string().optional().nullable(),
});

export type LotFormValues = z.infer<typeof lotFormSchema>;
