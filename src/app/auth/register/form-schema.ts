// src/app/auth/register/form-schema.ts
import * as z from 'zod';

const passwordSchema = z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." });

export const registrationFormSchema = z.object({
  accountType: z.enum(['PHYSICAL', 'LEGAL', 'DIRECT_SALE_CONSIGNOR'], {
    required_error: "Você deve selecionar um tipo de conta."
  }),
  
  // Common fields
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  emailConfirmation: z.string().email(),
  cellPhone: z.string().min(10, { message: "Número de celular inválido." }),
  cellPhoneConfirmation: z.string().min(10),
  password: passwordSchema,
  passwordConfirmation: passwordSchema,
  zipCode: z.string().min(8, { message: "CEP inválido." }).optional().or(z.literal('')),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os Termos de Uso e a Política de Privacidade."
  }),
  optInMarketing: z.boolean().default(false),

  // Physical Person fields
  fullName: z.string().optional(),
  cpf: z.string().optional(),
  dateOfBirth: z.date().optional().nullable(),
  
  // Legal Person fields
  razaoSocial: z.string().optional(),
  cnpj: z.string().optional(),
  inscricaoEstadual: z.string().optional(),

  // Consignor fields
  website: z.string().url().or(z.literal('')).optional(),
  
  // Fields for PJ responsible person
  responsibleName: z.string().optional(),
  responsibleCpf: z.string().optional(),

}).superRefine((data, ctx) => {
  if (data.email !== data.emailConfirmation) {
    ctx.addIssue({
      code: "custom",
      message: "Os emails não coincidem.",
      path: ["emailConfirmation"],
    });
  }
  if (data.cellPhone !== data.cellPhoneConfirmation) {
    ctx.addIssue({
      code: "custom",
      message: "Os números de celular não coincidem.",
      path: ["cellPhoneConfirmation"],
    });
  }
  if (data.password !== data.passwordConfirmation) {
    ctx.addIssue({
      code: "custom",
      message: "As senhas não coincidem.",
      path: ["passwordConfirmation"],
    });
  }

  // Conditional validation based on accountType
  if (data.accountType === 'PHYSICAL') {
    if (!data.fullName || data.fullName.length < 3) {
      ctx.addIssue({ code: "custom", message: "Nome completo é obrigatório.", path: ["fullName"] });
    }
    if (!data.cpf || data.cpf.length < 11) { // Basic length check
      ctx.addIssue({ code: "custom", message: "CPF é obrigatório.", path: ["cpf"] });
    }
    if (!data.dateOfBirth) {
      ctx.addIssue({ code: "custom", message: "Data de nascimento é obrigatória.", path: ["dateOfBirth"] });
    }
  } else if (data.accountType === 'LEGAL' || data.accountType === 'DIRECT_SALE_CONSIGNOR') {
    if (!data.razaoSocial || data.razaoSocial.length < 3) {
      ctx.addIssue({ code: "custom", message: "Razão Social é obrigatória.", path: ["razaoSocial"] });
    }
    if (!data.cnpj || data.cnpj.length < 14) { // Basic length check
      ctx.addIssue({ code: "custom", message: "CNPJ é obrigatório.", path: ["cnpj"] });
    }
    if (!data.responsibleName || data.responsibleName.length < 3) {
      ctx.addIssue({ code: "custom", message: "Nome do responsável é obrigatório.", path: ["responsibleName"]});
    }
    if (!data.responsibleCpf || data.responsibleCpf.length < 11) {
       ctx.addIssue({ code: "custom", message: "CPF do responsável é obrigatório.", path: ["responsibleCpf"]});
    }
  }
});

export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;
