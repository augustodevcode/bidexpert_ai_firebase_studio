/**
 * @fileoverview Schema Zod para JudicialBranch — Admin Plus.
 */
import { z } from 'zod';

export const judicialBranchSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  districtId: z.string().optional().or(z.literal('')),
  contactName: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
});

export type JudicialBranchSchema = z.infer<typeof judicialBranchSchema>;
