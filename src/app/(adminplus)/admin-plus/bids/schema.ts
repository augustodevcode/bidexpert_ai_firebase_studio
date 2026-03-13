/**
 * Zod schema and enum constants for the Bid entity (Admin Plus CRUD).
 */
import { z } from 'zod';

export const BID_STATUSES = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'VENCEDOR', label: 'Vencedor' },
  { value: 'EXPIRADO', label: 'Expirado' },
] as const;

export const BID_ORIGINS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTO_BID', label: 'Auto Bid' },
  { value: 'PROXY', label: 'Proxy' },
  { value: 'API', label: 'API' },
] as const;

export const bidSchema = z.object({
  lotId: z.string().min(1, 'Lote é obrigatório'),
  auctionId: z.string().min(1, 'Leilão é obrigatório'),
  bidderId: z.string().min(1, 'Arrematante é obrigatório'),
  amount: z.coerce.number().min(0, 'Valor deve ser positivo'),
  status: z.string().default('ATIVO'),
  bidOrigin: z.string().default('MANUAL'),
  isAutoBid: z.boolean().default(false),
  bidderDisplay: z.string().optional().or(z.literal('')),
  bidderAlias: z.string().optional().or(z.literal('')),
});
