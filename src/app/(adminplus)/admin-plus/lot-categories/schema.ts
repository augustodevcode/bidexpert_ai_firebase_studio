/**
 * @fileoverview Zod schemas para LotCategory — Admin Plus.
 */
import { z } from 'zod';

export const lotCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  slug: z.string().min(1, 'Slug é obrigatório').max(200),
  description: z.string().max(5000).optional().or(z.literal('')),
  logoUrl: z.string().max(500).optional().or(z.literal('')),
  coverImageUrl: z.string().max(500).optional().or(z.literal('')),
  megaMenuImageUrl: z.string().max(500).optional().or(z.literal('')),
  dataAiHintLogo: z.string().max(200).optional().or(z.literal('')),
  dataAiHintCover: z.string().max(200).optional().or(z.literal('')),
  dataAiHintMegaMenu: z.string().max(200).optional().or(z.literal('')),
  hasSubcategories: z.boolean().optional().default(false),
  isGlobal: z.boolean().optional().default(true),
});

export type LotCategoryFormValues = z.infer<typeof lotCategorySchema>;
