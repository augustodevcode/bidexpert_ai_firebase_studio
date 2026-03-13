/**
 * @fileoverview Schema Zod para UserOnTenant (junction User ↔ Tenant) — Admin Plus.
 */
import { z } from 'zod';

export const userOnTenantSchema = z.object({
  userId: z.string().min(1, 'Usuário é obrigatório'),
  tenantId: z.string().min(1, 'Tenant é obrigatório'),
  assignedBy: z.string().nullable().optional(),
});

export type UserOnTenantFormData = z.infer<typeof userOnTenantSchema>;
