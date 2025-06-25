
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
  auctionId: z.string().min(1, { message: "O ID do Leilão é obrigatório."}),
  auctionName: z.string().optional(),
  description: z.string().max(2000, {
    message: "A descrição não pode exceder 2000 caracteres.",
  }).optional(),
  price: z.coerce.number().positive({
    message: "O preço (lance inicial) deve ser um número positivo.",
  }),
  initialPrice: z.coerce.number().positive().optional().nullable(),
  bidIncrementStep: z.coerce.number().positive({ message: "Incremento deve ser positivo."}).optional().nullable(),
  status: z.enum(lotStatusValues, {
    required_error: "O status do lote é obrigatório.",
  }),
  stateId: z.string().optional().nullable(),
  cityId: z.string().optional().nullable(),
  type: z.string().min(1, { message: "O tipo/categoria do lote é obrigatório."}).max(100),
  subcategoryId: z.string().optional().nullable(),
  imageUrl: z.string().url({ message: "Por favor, insira uma URL de imagem válida." }).optional().or(z.literal('')),
  galleryImageUrls: z.array(z.string().url({ message: "Uma das URLs da galeria é inválida." })).optional(),
  mediaItemIds: z.array(z.string()).optional(),
  endDate: z.date().optional().nullable(), 
  lotSpecificAuctionDate: z.date().optional().nullable(), 
  secondAuctionDate: z.date().optional().nullable(), 
  secondInitialPrice: z.coerce.number().positive().optional().nullable(),
  views: z.coerce.number().int().nonnegative().optional(),
  bidsCount: z.coerce.number().int().nonnegative().optional(),
  
  // Campos de localização
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  mapAddress: z.string().max(255, { message: "Endereço do mapa não pode exceder 255 caracteres." }).optional().nullable(),
  mapEmbedUrl: z.string().url({ message: "URL de embed do mapa inválida." }).optional().nullable().or(z.literal('')),
  mapStaticImageUrl: z.string().url({ message: "URL da imagem estática do mapa inválida."}).optional().nullable().or(z.literal('')),

  // Campos de segurança e due diligence
  judicialProcessNumber: z.string().max(100).optional().nullable(),
  courtDistrict: z.string().max(100).optional().nullable(), // Comarca
  courtName: z.string().max(100).optional().nullable(), // Vara
  publicProcessUrl: z.string().url({ message: "URL do processo público inválida."}).optional().nullable().or(z.literal('')),
  propertyRegistrationNumber: z.string().max(100).optional().nullable(), // Matrícula
  propertyLiens: z.string().max(1000).optional().nullable(), // Ônus
  knownDebts: z.string().max(1000).optional().nullable(), // Dívidas
  additionalDocumentsInfo: z.string().max(2000).optional().nullable(), // Observações/links para docs

  // Novos campos para teoria dos leilões e conformidade
  reservePrice: z.coerce.number().positive({ message: "O preço de reserva deve ser positivo." }).optional().nullable(),
  evaluationValue: z.coerce.number().positive({ message: "O valor de avaliação deve ser positivo." }).optional().nullable(),
  debtAmount: z.coerce.number().positive({ message: "O montante da dívida deve ser positivo." }).optional().nullable(),
  itbiValue: z.coerce.number().positive({ message: "O valor do ITBI deve ser positivo." }).optional().nullable(),
});

export type LotFormValues = z.infer<typeof lotFormSchema>;
    

