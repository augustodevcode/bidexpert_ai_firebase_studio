
import * as z from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome da categoria deve ter pelo menos 2 caracteres.",
  }).max(100, {
    message: "O nome da categoria não pode exceder 100 caracteres.",
  }),
  description: z.string().max(500, {
    message: "A descrição não pode exceder 500 caracteres.",
  }).optional(),
  logoUrl: z.string().url({ message: "URL do logo inválida." }).optional().or(z.literal('')),
  dataAiHintLogo: z.string().max(50).optional().nullable(),
  coverImageUrl: z.string().url({ message: "URL da imagem de capa inválida." }).optional().or(z.literal('')),
  dataAiHintCover: z.string().max(50).optional().nullable(),
  megaMenuImageUrl: z.string().url({ message: "URL da imagem do megamenu inválida." }).optional().or(z.literal('')),
  dataAiHintMegaMenu: z.string().max(50).optional().nullable(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
