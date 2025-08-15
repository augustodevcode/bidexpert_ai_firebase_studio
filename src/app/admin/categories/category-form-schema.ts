
import * as z from 'zod';

const optionalUrlSchema = z.string().url({ message: "URL inválida." }).or(z.literal('')).optional().nullable();

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
  logoUrl: optionalUrlSchema,
  logoMediaId: z.string().optional().nullable(),
  dataAiHintIcon: z.string().max(50).optional().nullable(),
  coverImageUrl: optionalUrlSchema,
  coverImageMediaId: z.string().optional().nullable(),
  dataAiHintCover: z.string().max(50).optional().nullable(),
  megaMenuImageUrl: optionalUrlSchema,
  megaMenuImageMediaId: z.string().optional().nullable(),
  dataAiHintMegaMenu: z.string().max(50).optional().nullable(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
