
import * as z from 'zod';

export const sellerFormSchema = z.object({
  name: z.string().min(3, {
    message: "O nome do comitente deve ter pelo menos 3 caracteres.",
  }).max(150, {
    message: "O nome do comitente não pode exceder 150 caracteres.",
  }),
  contactName: z.string().max(150).optional().nullable(),
  email: z.string().email({ message: "Formato de email inválido." }).optional().or(z.literal('')),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(), // Pode ser UF (2) ou nome completo
  zipCode: z.string().max(10).optional().nullable(),
  website: z.string().url({ message: "URL do website inválida." }).optional().or(z.literal('')),
  logoUrl: z.string().url({ message: "URL do logo inválida." }).optional().or(z.literal('')),
  dataAiHintLogo: z.string().max(50, {message: "Dica de IA para logo não pode exceder 50 caracteres."}).optional().nullable(),
  description: z.string().max(2000, {
    message: "A descrição não pode exceder 2000 caracteres.",
  }).optional().nullable(),
  judicialBranchId: z.string().optional().nullable(),
  isJudicial: z.boolean().default(false),
});

export type SellerFormValues = z.infer<typeof sellerFormSchema>;
