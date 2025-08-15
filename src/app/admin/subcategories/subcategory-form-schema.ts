
// src/app/admin/subcategories/subcategory-form-schema.ts
import * as z from 'zod';

const optionalUrlSchema = z.string().url({ message: "URL inválida." }).or(z.literal('')).optional().nullable();

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
  iconUrl: optionalUrlSchema,
  iconMediaId: z.string().optional().nullable(),
  dataAiHintIcon: z.string().max(50, {message: "Dica de IA para ícone não pode exceder 50 caracteres."}).optional().nullable(),
});

export type SubcategoryFormValues = z.infer<typeof subcategoryFormSchema>;
