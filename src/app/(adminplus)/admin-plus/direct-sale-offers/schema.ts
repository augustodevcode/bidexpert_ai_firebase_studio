/**
 * Schema Zod para DirectSaleOffer (Ofertas de Venda Direta).
 */
import { z } from 'zod';

export const OFFER_TYPE_OPTIONS = [
  { value: 'BUY_NOW', label: 'Compra Imediata' },
  { value: 'ACCEPTS_PROPOSALS', label: 'Aceita Propostas' },
] as const;

export const OFFER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'PENDING_APPROVAL', label: 'Aprovação Pendente' },
  { value: 'SOLD', label: 'Vendido' },
  { value: 'EXPIRED', label: 'Expirado' },
  { value: 'RASCUNHO', label: 'Rascunho' },
] as const;

export const directSaleOfferSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().or(z.literal('')).optional(),
  offerType: z.string().min(1, 'Tipo de oferta obrigatório'),
  price: z.string().or(z.literal('')).optional(),
  minimumOfferPrice: z.string().or(z.literal('')).optional(),
  status: z.string().min(1, 'Status obrigatório'),
  locationCity: z.string().or(z.literal('')).optional(),
  locationState: z.string().or(z.literal('')).optional(),
  imageUrl: z.string().or(z.literal('')).optional(),
  expiresAt: z.string().or(z.literal('')).optional(),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  sellerId: z.string().min(1, 'Vendedor obrigatório'),
  sellerName: z.string().or(z.literal('')).optional(),
});
