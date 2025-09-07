// src/app/admin/auctioneers/auctioneer-form-schema.ts
import * as z from 'zod';

const optionalUrlSchema = z.string().url({ message: "URL inválida." }).or(z.literal('')).optional().nullable();

export const auctioneerFormSchema = z.object({
  name: z.string().min(3, {
    message: "O nome do leiloeiro deve ter pelo menos 3 caracteres.",
  }).max(150, {
    message: "O nome do leiloeiro não pode exceder 150 caracteres.",
  }),
  registrationNumber: z.string().max(50, {
    message: "O número de registro não pode exceder 50 caracteres.",
  }).optional().nullable(),
  contactName: z.string().max(150).optional().nullable(),
  email: z.string().email({ message: "Formato de email inválido." }).optional().nullable().or(z.literal('')),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(), // Pode ser UF (2) ou nome completo
  zipCode: z.string().max(10).optional().nullable(),
  website: optionalUrlSchema,
  logoUrl: optionalUrlSchema,
  logoMediaId: z.string().optional().nullable(),
  dataAiHintLogo: z.string().max(50, {message: "Dica de IA para logo não pode exceder 50 caracteres."}).optional().nullable(),
  description: z.string().max(2000, {
    message: "A descrição não pode exceder 2000 caracteres.",
  }).optional().nullable(),
  userId: z.string().optional().nullable(), // Se o leiloeiro pode ser um usuário da plataforma
});

export type AuctioneerFormData = z.infer<typeof auctioneerFormSchema>;
