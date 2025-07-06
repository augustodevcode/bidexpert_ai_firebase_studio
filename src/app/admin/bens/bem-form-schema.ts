
// src/app/admin/bens/bem-form-schema.ts
import * as z from 'zod';
import type { Bem } from '@/types';

const bemStatusValues: [Bem['status'], ...Bem['status'][]] = [
  'DISPONIVEL', 'LOTEADO', 'VENDIDO', 'REMOVIDO'
];

export const bemFormSchema = z.object({
  title: z.string().min(5, {
    message: "O título do bem deve ter pelo menos 5 caracteres.",
  }).max(200, {
    message: "O título do bem não pode exceder 200 caracteres.",
  }),
  description: z.string().max(5000).optional(),
  status: z.enum(bemStatusValues),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  subcategoryId: z.string().optional().nullable(),
  judicialProcessId: z.string().optional().nullable(),
  sellerId: z.string().optional().nullable(),
  evaluationValue: z.coerce.number().positive("O valor de avaliação deve ser positivo.").optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  imageMediaId: z.string().optional().nullable(),
  dataAiHint: z.string().max(50).optional(),
  locationCity: z.string().max(100).optional(),
  locationState: z.string().max(100).optional(),
  address: z.string().max(255).optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),

  // Vehicle
  plate: z.string().max(10).optional().nullable(),
  make: z.string().max(50).optional().nullable(),
  model: z.string().max(50).optional().nullable(),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  color: z.string().max(30).optional().nullable(),
  fuelType: z.string().optional().nullable(),
  transmissionType: z.string().optional().nullable(),
  vin: z.string().max(17).optional().nullable(),
  hasKey: z.boolean().optional(),
  engineDetails: z.string().max(100).optional().nullable(),

  // Real Estate
  propertyRegistrationNumber: z.string().max(50).optional().nullable(),
  isOccupied: z.boolean().optional(),
  area: z.coerce.number().min(0).optional().nullable(),
  bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).optional().nullable(),
  parkingSpaces: z.coerce.number().int().min(0).optional().nullable(),
  propertyType: z.string().optional().nullable(),
  amenities: z.array(z.string()).optional().nullable(),

  // Machinery
  modelYear: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  hoursUsed: z.coerce.number().int().min(0).optional().nullable(),
  serialNumber: z.string().max(50).optional().nullable(),

  // Livestock
  breed: z.string().max(50).optional().nullable(),
  age: z.string().max(30).optional().nullable(),
  sex: z.enum(['Macho', 'Fêmea']).optional().nullable(),
  vaccinationStatus: z.string().max(100).optional().nullable(),
});

export type BemFormData = z.infer<typeof bemFormSchema>;

