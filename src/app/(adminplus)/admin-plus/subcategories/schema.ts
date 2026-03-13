/**
 * @fileoverview Zod schemas para Subcategory — Admin Plus.
 */
import { z } from 'zod';

export const subcategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  slug: z.string().min(1, 'Slug é obrigatório').max(200),
  description: z.string().max(5000).optional().or(z.literal('')),
  parentCategoryId: z.string().min(1, 'Categoria pai é obrigatória'),
  displayOrder: z.coerce.number().int().min(0).default(0),
  iconUrl: z.string().max(500).optional().or(z.literal('')),
  dataAiHintIcon: z.string().max(200).optional().or(z.literal('')),
  isGlobal: z.boolean().optional().default(true),
});

export type SubcategoryFormValues = z.infer<typeof subcategorySchema>;
