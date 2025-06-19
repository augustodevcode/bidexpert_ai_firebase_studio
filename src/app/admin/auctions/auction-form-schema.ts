
import * as z from 'zod';
import type { AuctionStatus, Auction } from '@/types'; // Auction importado para auctionTypeValues

const auctionStatusValues: [AuctionStatus, ...AuctionStatus[]] = [
  'RASCUNHO', // Novo
  'EM_PREPARACAO', // Novo
  'EM_BREVE',
  'ABERTO', 
  'ABERTO_PARA_LANCES',
  'ENCERRADO',
  'FINALIZADO', 
  'CANCELADO',
  'SUSPENSO'
];

const auctionTypeValues: [Auction['auctionType'], ...(Exclude<Auction['auctionType'], undefined>)[]] = [
  'JUDICIAL',
  'EXTRAJUDICIAL',
  'PARTICULAR',
  'TOMADA_DE_PRECOS',
];


export const auctionFormSchema = z.object({
  title: z.string().min(5, {
    message: "O título do leilão deve ter pelo menos 5 caracteres.",
  }).max(200, {
    message: "O título do leilão não pode exceder 200 caracteres.",
  }),
  fullTitle: z.string().max(300, {
    message: "O título completo não pode exceder 300 caracteres.",
  }).optional(),
  description: z.string().max(5000, {
    message: "A descrição não pode exceder 5000 caracteres.",
  }).optional(),
  status: z.enum(auctionStatusValues, {
    required_error: "O status do leilão é obrigatório.",
  }),
  auctionType: z.enum(auctionTypeValues, {
    errorMap: () => ({ message: "Por favor, selecione uma modalidade válida."}),
  }).optional(),
  category: z.string().min(1, { message: "A categoria é obrigatória."}).max(100),
  auctioneer: z.string().min(1, { message: "O nome do leiloeiro é obrigatório."}).max(150),
  seller: z.string().max(150).optional(),
  auctionDate: z.date({
    required_error: "A data do leilão é obrigatória.",
    invalid_type_error: "Por favor, insira uma data de leilão válida.",
  }),
  endDate: z.date().optional().nullable(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(), // UF
  imageUrl: z.string().url({ message: "URL da imagem inválida." }).optional().or(z.literal('')),
  documentsUrl: z.string().url({ message: "URL dos documentos inválida."}).optional().or(z.literal('')),
  sellingBranch: z.string().max(100).optional(),
  automaticBiddingEnabled: z.boolean().optional().default(false),
  allowInstallmentBids: z.boolean().optional().default(false),
  estimatedRevenue: z.coerce.number().positive({message: "Estimativa deve ser positiva."}).optional().nullable(),
  isFeaturedOnMarketplace: z.boolean().optional().default(false),
  marketplaceAnnouncementTitle: z.string().max(150, {message: "Título do anúncio muito longo."}).optional().nullable(),
  auctionStages: z.array(
    z.object({
      name: z.string().min(1, "Nome da praça é obrigatório"),
      endDate: z.date({ required_error: "Data de encerramento da praça é obrigatória" }),
      statusText: z.string().optional(),
      initialPrice: z.coerce.number().positive("Lance inicial da praça deve ser positivo").optional(),
    })
  ).optional().default([]),
});

export type AuctionFormValues = z.infer<typeof auctionFormSchema>;

    

    

