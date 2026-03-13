/**
 * @fileoverview Schema Zod para Asset — Admin Plus.
 */
import { z } from 'zod';

export const ASSET_STATUSES = [
  { value: 'CADASTRO', label: 'Cadastro' },
  { value: 'DISPONIVEL', label: 'Disponível' },
  { value: 'LOTEADO', label: 'Loteado' },
  { value: 'VENDIDO', label: 'Vendido' },
  { value: 'REMOVIDO', label: 'Removido' },
  { value: 'INATIVADO', label: 'Inativado' },
] as const;

export const assetSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal('')),
  categoryId: z.string().optional().or(z.literal('')),
  subcategoryId: z.string().optional().or(z.literal('')),
  sellerId: z.string().optional().or(z.literal('')),
  judicialProcessId: z.string().optional().or(z.literal('')),
  evaluationValue: z.string().optional().or(z.literal('')),
  imageUrl: z.string().optional().or(z.literal('')),
  locationCity: z.string().optional().or(z.literal('')),
  locationState: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  // Vehicle fields
  plate: z.string().optional().or(z.literal('')),
  make: z.string().optional().or(z.literal('')),
  model: z.string().optional().or(z.literal('')),
  year: z.string().optional().or(z.literal('')),
  mileage: z.string().optional().or(z.literal('')),
  color: z.string().optional().or(z.literal('')),
  fuelType: z.string().optional().or(z.literal('')),
  // Real estate fields
  totalArea: z.string().optional().or(z.literal('')),
  builtArea: z.string().optional().or(z.literal('')),
  bedrooms: z.string().optional().or(z.literal('')),
  parkingSpaces: z.string().optional().or(z.literal('')),
});

export type AssetSchema = z.infer<typeof assetSchema>;
