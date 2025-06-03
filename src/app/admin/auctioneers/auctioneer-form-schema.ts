
import * as z from 'zod';

export const auctioneerFormSchema = z.object({
  name: z.string().min(3, {
    message: "O nome do leiloeiro deve ter pelo menos 3 caracteres.",
  }).max(150, {
    message: "O nome do leiloeiro não pode exceder 150 caracteres.",
  }),
  registrationNumber: z.string().max(50, {
    message: "O número de registro não pode exceder 50 caracteres.",
  }).optional(),
  contactName: z.string().max(150).optional(),
  email: z.string().email({ message: "Formato de email inválido." }).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(), // Pode ser UF (2) ou nome completo
  zipCode: z.string().max(10).optional(),
  website: z.string().url({ message: "URL do website inválida." }).optional().or(z.literal('')),
  logoUrl: z.string().url({ message: "URL do logo inválida." }).optional().or(z.literal('')),
  dataAiHintLogo: z.string().max(50, {message: "Dica de IA para logo não pode exceder 50 caracteres."}).optional(),
  description: z.string().max(2000, {
    message: "A descrição não pode exceder 2000 caracteres.",
  }).optional(),
});

export type AuctioneerFormValues = z.infer<typeof auctioneerFormSchema>;

    