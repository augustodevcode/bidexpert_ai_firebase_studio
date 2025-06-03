
import * as z from 'zod';
import type { AuctionStatus } from '@/types';

const auctionStatusValues: [AuctionStatus, ...AuctionStatus[]] = [
  'EM_BREVE',
  'ABERTO', // Genérico para quando os lances ainda não começaram ou estão em curso
  'ABERTO_PARA_LANCES',
  'ENCERRADO',
  'FINALIZADO', // Após apuração
  'CANCELADO',
  'SUSPENSO'
];

const auctionTypeValues: [Auction['auctionType'], ...(Auction['auctionType'])[]] = [
  'JUDICIAL',
  'EXTRAJUDICIAL',
  'PARTICULAR',
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
  auctionType: z.enum(auctionTypeValues).optional(),
  category: z.string().min(2, { message: "A categoria é obrigatória."}).max(100),
  auctioneer: z.string().min(3, { message: "O nome do leiloeiro é obrigatório."}).max(150),
  seller: z.string().max(150).optional(),
  auctionDate: z.date({
    required_error: "A data do leilão é obrigatória.",
    invalid_type_error: "Por favor, insira uma data de leilão válida.",
  }),
  endDate: z.date().optional().nullable(), // Data de encerramento geral (opcional)
  location: z.string().max(150).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(), // UF
  imageUrl: z.string().url({ message: "URL da imagem inválida." }).optional().or(z.literal('')),
  documentsUrl: z.string().url({ message: "URL dos documentos inválida."}).optional().or(z.literal('')),
  sellingBranch: z.string().max(100).optional(),
});

export type AuctionFormValues = z.infer<typeof auctionFormSchema>;
