
import * as z from 'zod';

export const subcategoryFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome da subcategoria deve ter pelo menos 2 caracteres.",
  }).max(100, {
    message: "O nome da subcategoria não pode exceder 100 caracteres.",
  }),
  parentCategoryId: z.string().min(1, {
    message: "Selecione a categoria principal.",
  }),
  description: z.string().max(500, {
    message: "A descrição não pode exceder 500 caracteres.",
  }).optional().nullable(),
  displayOrder: z.coerce.number().int().optional().default(0),
  iconUrl: z.string().url({ message: "URL do ícone inválida." }).optional().nullable().or(z.literal('')),
  dataAiHintIcon: z.string().max(50, {message: "Dica de IA para ícone não pode exceder 50 caracteres."}).optional().nullable(),
});

export type SubcategoryFormValues = z.infer<typeof subcategoryFormSchema>;
