/**
 * Zod schema and enum definitions for the Lot entity (Admin Plus CRUD).
 * Core lot fields + location + deposit + sale mode enums.
 */
import { z } from 'zod';

export const LOT_STATUSES = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'AGUARDANDO', label: 'Aguardando' },
  { value: 'EM_BREVE', label: 'Em Breve' },
  { value: 'ABERTO_PARA_LANCES', label: 'Aberto para Lances' },
  { value: 'EM_PREGAO', label: 'Em Pregão' },
  { value: 'ENCERRADO', label: 'Encerrado' },
  { value: 'VENDIDO', label: 'Vendido' },
  { value: 'NAO_VENDIDO', label: 'Não Vendido' },
  { value: 'RELISTADO', label: 'Relistado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'RETIRADO', label: 'Retirado' },
] as const;

export const LOT_SALE_MODES = [
  { value: 'LEILAO', label: 'Leilão' },
  { value: 'VENDA_DIRETA', label: 'Venda Direta' },
  { value: 'LANCE_CONDICIONAL', label: 'Lance Condicional' },
] as const;

export const lotSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  number: z.coerce.number().int().optional(),
  description: z.string().or(z.literal('')).optional(),
  slug: z.string().or(z.literal('')).optional(),
  price: z.coerce.number().min(0, 'Preço deve ser >= 0'),
  initialPrice: z.coerce.number().optional().or(z.literal('')),
  secondInitialPrice: z.coerce.number().optional().or(z.literal('')),
  bidIncrementStep: z.coerce.number().optional().or(z.literal('')),
  status: z.string().min(1, 'Status é obrigatório'),
  saleMode: z.string().or(z.literal('')).optional(),
  type: z.string().min(1, 'Tipo é obrigatório'),
  condition: z.string().or(z.literal('')).optional(),
  imageUrl: z.string().or(z.literal('')).optional(),
  auctionId: z.string().min(1, 'Leilão é obrigatório'),
  auctioneerId: z.string().or(z.literal('')).optional(),
  lotCategoryId: z.string().or(z.literal('')).optional(),
  subcategoryId: z.string().or(z.literal('')).optional(),
  cityId: z.string().or(z.literal('')).optional(),
  stateId: z.string().or(z.literal('')).optional(),
  sellerId: z.string().or(z.literal('')).optional(),
  // Location
  cityName: z.string().or(z.literal('')).optional(),
  stateUf: z.string().or(z.literal('')).optional(),
  mapAddress: z.string().or(z.literal('')).optional(),
  latitude: z.coerce.number().optional().or(z.literal('')),
  longitude: z.coerce.number().optional().or(z.literal('')),
  // Deposit
  requiresDepositGuarantee: z.boolean().optional(),
  depositGuaranteeAmount: z.coerce.number().optional().or(z.literal('')),
  depositGuaranteeInfo: z.string().or(z.literal('')).optional(),
  // Flags
  isFeatured: z.boolean().optional(),
  isExclusive: z.boolean().optional(),
  discountPercentage: z.coerce.number().optional().or(z.literal('')),
});

export type LotFormValues = z.infer<typeof lotSchema>;
