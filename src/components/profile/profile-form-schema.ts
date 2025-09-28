// src/components/profile/profile-form-schema.ts
/**
 * @fileoverview Schema de validação Zod unificado para formulários de perfil de usuário.
 * Este schema define as regras para todos os campos que podem ser editados tanto
 * pelo próprio usuário em seu painel quanto por um administrador. Ele é utilizado
 * pelo componente reutilizável `ProfileForm` para garantir a consistência e
 * integridade dos dados antes da submissão.
 */
import * as z from 'zod';
import type { AccountType } from '@/types';

// This will become the single source of truth for user profile validation.
const passwordSchema = z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }).optional().or(z.literal(''));

export const profileFormSchema = z.object({
  fullName: z.string().min(3, { message: "Nome completo deve ter pelo menos 3 caracteres." }).optional().nullable(),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: passwordSchema,
  cpf: z.string().optional().nullable(),
  rgNumber: z.string().optional().nullable(),
  rgIssuer: z.string().optional().nullable(),
  rgIssueDate: z.date().optional().nullable(),
  rgState: z.string().optional().nullable(),
  dateOfBirth: z.date().optional().nullable(),
  cellPhone: z.string().optional().nullable(),
  homePhone: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  propertyRegime: z.string().optional().nullable(),
  spouseName: z.string().optional().nullable(),
  spouseCpf: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  optInMarketing: z.boolean().default(false).optional(),
  
  // For PJ
  accountType: z.custom<AccountType>(),
  razaoSocial: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  inscricaoEstadual: z.string().optional().nullable(),
  website: z.string().url().or(z.literal('')).optional().nullable(),
  responsibleName: z.string().optional().nullable(),
  responsibleCpf: z.string().optional().nullable(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
