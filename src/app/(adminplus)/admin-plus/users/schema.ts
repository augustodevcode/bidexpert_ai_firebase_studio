/**
 * @fileoverview Schemas Zod para validação de formulários de Usuário no Admin Plus.
 * Define campos de autenticação, dados pessoais, endereço, dados empresariais e perfis.
 */
import { z } from 'zod';

export const habilitationStatusEnum = z.enum([
  'PENDING_DOCUMENTS',
  'PENDING_ANALYSIS',
  'HABILITADO',
  'REJECTED_DOCUMENTS',
  'BLOCKED',
]);

export const accountTypeEnum = z.enum([
  'PHYSICAL',
  'LEGAL',
  'DIRECT_SALE_CONSIGNOR',
]);

export const createUserSchema = z.object({
  // Autenticação
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  // Dados Pessoais
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(150),
  cpf: z.string().nullable().optional(),
  cellPhone: z.string().nullable().optional(),
  // Configuração
  accountType: accountTypeEnum.default('PHYSICAL'),
  habilitationStatus: habilitationStatusEnum.default('PENDING_DOCUMENTS'),
  optInMarketing: z.boolean().default(false),
  // Perfis (roles)
  roleIds: z.array(z.string()).default([]),
  // Endereço
  zipCode: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  // Dados Empresariais
  razaoSocial: z.string().nullable().optional(),
  cnpj: z.string().nullable().optional(),
  inscricaoEstadual: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .extend({
    password: z.string().min(6).optional().or(z.literal('')),
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
