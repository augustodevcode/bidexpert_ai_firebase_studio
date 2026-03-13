/**
 * @fileoverview Schemas Zod para CRUD de Tenant no Admin Plus.
 * Valida dados de criação e edição de tenants (inquilinos/leiloeiros).
 */
import { z } from 'zod';

const tenantStatusEnum = z.enum([
  'PENDING', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED',
]);

const resolutionStrategyEnum = z.enum([
  'SUBDOMAIN', 'PATH', 'CUSTOM_DOMAIN',
]);

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  subdomain: z
    .string()
    .min(2, 'Subdomínio deve ter pelo menos 2 caracteres')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Subdomínio aceita apenas letras minúsculas, números e hifens'),
  domain: z.string().nullable().optional(),
  resolutionStrategy: resolutionStrategyEnum.default('SUBDOMAIN'),
  status: tenantStatusEnum.default('PENDING'),
  planId: z.string().nullable().optional(),
  maxUsers: z.coerce.number().int().positive().nullable().optional(),
  maxStorageBytes: z.coerce.number().int().positive().nullable().optional(),
  maxAuctions: z.coerce.number().int().positive().nullable().optional(),
});

export const updateTenantSchema = createTenantSchema.partial();

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
