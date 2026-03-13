/**
 * @fileoverview Schema Zod para Auction — Admin Plus.
 */
import { z } from 'zod';

export const AUCTION_STATUSES = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'EM_VALIDACAO', label: 'Em Validação' },
  { value: 'EM_AJUSTE', label: 'Em Ajuste' },
  { value: 'EM_PREPARACAO', label: 'Em Preparação' },
  { value: 'EM_BREVE', label: 'Em Breve' },
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'ABERTO_PARA_LANCES', label: 'Aberto p/ Lances' },
  { value: 'EM_PREGAO', label: 'Em Pregão' },
  { value: 'ENCERRADO', label: 'Encerrado' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'SUSPENSO', label: 'Suspenso' },
] as const;

export const AUCTION_TYPES = [
  { value: 'JUDICIAL', label: 'Judicial' },
  { value: 'EXTRAJUDICIAL', label: 'Extrajudicial' },
  { value: 'PARTICULAR', label: 'Particular' },
  { value: 'TOMADA_DE_PRECOS', label: 'Tomada de Preços' },
  { value: 'VENDA_DIRETA', label: 'Venda Direta' },
] as const;

export const AUCTION_METHODS = [
  { value: 'STANDARD', label: 'Padrão' },
  { value: 'DUTCH', label: 'Holandês' },
  { value: 'SILENT', label: 'Silencioso' },
] as const;

export const AUCTION_PARTICIPATIONS = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'HIBRIDO', label: 'Híbrido' },
] as const;

export const auctionSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  slug: z.string().or(z.literal('')).optional(),
  description: z.string().or(z.literal('')).optional(),
  status: z.string().or(z.literal('')).optional(),
  auctionType: z.string().or(z.literal('')).optional(),
  auctionMethod: z.string().or(z.literal('')).optional(),
  participation: z.string().or(z.literal('')).optional(),
  auctionDate: z.string().or(z.literal('')).optional(),
  endDate: z.string().or(z.literal('')).optional(),
  initialOffer: z.string().or(z.literal('')).optional(),
  onlineUrl: z.string().or(z.literal('')).optional(),
  address: z.string().or(z.literal('')).optional(),
  zipCode: z.string().or(z.literal('')).optional(),
  isFeaturedOnMarketplace: z.boolean().optional(),
  auctioneerId: z.string().or(z.literal('')).optional(),
  sellerId: z.string().or(z.literal('')).optional(),
  categoryId: z.string().or(z.literal('')).optional(),
  cityId: z.string().or(z.literal('')).optional(),
  stateId: z.string().or(z.literal('')).optional(),
  judicialProcessId: z.string().or(z.literal('')).optional(),
  supportPhone: z.string().or(z.literal('')).optional(),
  supportEmail: z.string().or(z.literal('')).optional(),
  supportWhatsApp: z.string().or(z.literal('')).optional(),
});

export type AuctionSchema = z.infer<typeof auctionSchema>;
