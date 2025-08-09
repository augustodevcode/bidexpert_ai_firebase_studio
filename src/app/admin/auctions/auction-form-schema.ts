// src/app/admin/auctions/auction-form-schema.ts
import * as z from 'zod';
import type { AuctionStatus, AuctionType, AuctionParticipation, AuctionMethod } from '@/types';

// Enums from your types
const auctionStatusValues: [AuctionStatus, ...AuctionStatus[]] = [
  'RASCUNHO', 'EM_PREPARACAO', 'EM_BREVE', 'ABERTO', 'ABERTO_PARA_LANCES', 'ENCERRADO', 'FINALIZADO', 'CANCELADO', 'SUSPENSO'
];

const auctionTypeValues: [AuctionType, ...AuctionType[]] = [
  'JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS'
];

const participationValues: [AuctionParticipation, ...AuctionParticipation[]] = [
  'ONLINE', 'PRESENCIAL', 'HIBRIDO'
];

const methodValues: [AuctionMethod, ...AuctionMethod[]] = [
  'STANDARD', 'DUTCH', 'SILENT'
];

const autoRelistSettingsSchema = z.object({
  enableAutoRelist: z.boolean().optional().default(false),
  recurringAutoRelist: z.boolean().optional().default(false),
  relistIfWinnerNotPaid: z.boolean().optional().default(false),
  relistIfWinnerNotPaidAfterHours: z.coerce.number().int().min(1).optional().nullable(),
  relistIfNoBids: z.boolean().optional().default(false),
  relistIfNoBidsAfterHours: z.coerce.number().int().min(1).optional().nullable(),
  relistIfReserveNotMet: z.boolean().optional().default(false),
  relistIfReserveNotMetAfterHours: z.coerce.number().int().min(1).optional().nullable(),
  relistDurationInHours: z.coerce.number().int().min(1).optional().nullable(),
}).optional();

export const auctionFormSchema = z.object({
  title: z.string().min(5, {
    message: "O título do leilão deve ter pelo menos 5 caracteres.",
  }).max(200, {
    message: "O título do leilão não pode exceder 200 caracteres.",
  }),
  description: z.string().max(5000, {
    message: "A descrição não pode exceder 5000 caracteres.",
  }).optional().nullable(),
  status: z.enum(auctionStatusValues as [string, ...string[]]).optional(),
  
  auctionType: z.enum(auctionTypeValues as [string, ...string[]], {
    errorMap: () => ({ message: "Por favor, selecione uma modalidade válida."}),
  }),
  auctionMethod: z.enum(methodValues as [string, ...string[]]).default('STANDARD'),
  participation: z.enum(participationValues as [string, ...string[]]).default('ONLINE'),
  
  onlineUrl: z.string().url({ message: "URL inválida." }).optional().or(z.literal('')),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zipCode: z.string().max(10).optional().nullable(),

  auctioneerId: z.string().min(1, { message: "O leiloeiro é obrigatório."}),
  sellerId: z.string().min(1, { message: "O comitente é obrigatório."}),
  categoryId: z.string().min(1, { message: "A categoria é obrigatória."}),
  
  imageUrl: z.string().url({ message: "URL da imagem inválida." }).optional().or(z.literal('')),
  imageMediaId: z.string().optional().nullable(),
  documentsUrl: z.string().url({ message: "URL dos documentos inválida."}).optional().or(z.literal('')),
  evaluationReportUrl: z.string().url({ message: "URL inválida."}).optional().or(z.literal('')),
  auctionCertificateUrl: z.string().url({ message: "URL inválida."}).optional().or(z.literal('')),
  sellingBranch: z.string().max(100).optional(),
  automaticBiddingEnabled: z.boolean().optional().default(false),
  allowInstallmentBids: z.boolean().optional().default(true),
  silentBiddingEnabled: z.boolean().optional().default(false),
  allowMultipleBidsPerUser: z.boolean().optional().default(true),
  softCloseEnabled: z.boolean().optional().default(false), 
  softCloseMinutes: z.coerce.number().int().min(1, "Mínimo de 1 minuto").max(30, "Máximo de 30 minutos").optional().default(2), 
  estimatedRevenue: z.coerce.number().positive({message: "Estimativa deve ser positiva."}).optional().nullable(),
  isFeaturedOnMarketplace: z.boolean().optional().default(false),
  marketplaceAnnouncementTitle: z.string().max(150, {message: "Título do anúncio muito longo."}).optional().nullable(),
  auctionStages: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, "Nome da praça é obrigatório"),
      startDate: z.date({ required_error: "Data de início da praça é obrigatória" }),
      endDate: z.date({ required_error: "Data de encerramento da praça é obrigatória" }),
      initialPrice: z.coerce.number().positive("Lance inicial da praça deve ser positivo").optional().nullable(),
    })
  ).min(1, "O leilão deve ter pelo menos uma praça/etapa.").optional().default([{ name: '1ª Praça', startDate: new Date(), endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), initialPrice: null }]),
  decrementAmount: z.coerce.number().positive("O valor do decremento deve ser positivo.").optional().nullable(),
  decrementIntervalSeconds: z.coerce.number().int().min(1, "O intervalo deve ser de no mínimo 1 segundo.").optional().nullable(),
  floorPrice: z.coerce.number().positive("O preço mínimo deve ser positivo.").optional().nullable(),
  autoRelistSettings: autoRelistSettingsSchema,
}).refine(data => {
    // If it's a Dutch auction, the specific fields are required.
    if (data.auctionMethod === 'DUTCH') {
        return !!data.decrementAmount && !!data.decrementIntervalSeconds && !!data.floorPrice;
    }
    return true;
}, {
    message: "Para Leilões Holandeses, o Valor do Decremento, Intervalo e Preço Mínimo são obrigatórios.",
    path: ["decrementAmount"],
});


export type AuctionFormValues = z.infer<typeof auctionFormSchema>;
