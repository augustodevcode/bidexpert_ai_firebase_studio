// src/app/api/v1/tenant/create/schema.ts
import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(3, "O nome do tenant é obrigatório."),
  subdomain: z.string().min(3, "O subdomínio é obrigatório.").regex(/^[a-z0-9-]+$/, "Subdomínio pode conter apenas letras minúsculas, números e hífens."),
  adminUser: z.object({
    email: z.string().email("Email do administrador inválido."),
    fullName: z.string().min(3, "Nome completo do administrador é obrigatório."),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres.").optional(),
  }),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
