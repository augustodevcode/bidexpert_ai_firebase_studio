
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
  iconName: z.string().max(50, "Nome do ícone muito longo.").optional().nullable(),
  logoUrl: z.string().url("URL do logo inválida.").optional().nullable().or(z.literal('')),
  logoMediaId: z.string().optional().nullable(),
  dataAiHintIcon: z.string().max(50).optional().nullable(),
  coverImageUrl: z.string().url({ message: "URL da imagem de capa inválida." }).optional().or(z.literal('')),
  coverImageMediaId: z.string().optional().nullable(),
  dataAiHintCover: z.string().max(50).optional().nullable(),
  megaMenuImageUrl: z.string().url({ message: "URL da imagem do megamenu inválida." }).optional().or(z.literal('')),
  megaMenuImageMediaId: z.string().optional().nullable(),
  dataAiHintMegaMenu: z.string().max(50).optional().nullable(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
