import * as z from 'zod';

export const userFormSchema = z.object({
  fullName: z.string().min(3, {
    message: "O nome completo deve ter pelo menos 3 caracteres.",
  }).max(150, {
    message: "O nome completo não pode exceder 150 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, insira um endereço de email válido.",
  }),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres.",
  }).optional().or(z.literal('')),
  roleId: z.string().optional().nullable(),
  cpf: z.string().optional(), 
  cellPhone: z.string().optional(), 
  dateOfBirth: z.date().optional().nullable(), 
  // Campos para Pessoa Jurídica / Comitente
  accountType: z.enum(['PHYSICAL', 'LEGAL', 'DIRECT_SALE_CONSIGNOR']).optional(),
  razaoSocial: z.string().optional(),
  cnpj: z.string().optional(),
  inscricaoEstadual: z.string().optional(),
  websiteComitente: z.string().url({ message: "URL do website inválida."}).optional().or(z.literal('')),
  // Campos de endereço (comuns)
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  optInMarketing: z.boolean().default(false).optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
