
// src/app/admin/courts/court-form-schema.ts
import * as z from 'zod';

const optionalUrlSchema = z.string().url({ message: "URL inválida." }).or(z.literal('')).optional().nullable();

export const courtFormSchema = z.object({
  name: z.string().min(5, {
    message: "O nome do tribunal deve ter pelo menos 5 caracteres.",
  }).max(150, {
    message: "O nome do tribunal não pode exceder 150 caracteres.",
  }),
  stateUf: z.string().length(2, {
    message: "Selecione o estado (UF).",
  }),
  website: optionalUrlSchema,
});

export type CourtFormValues = z.infer<typeof courtFormSchema>;
