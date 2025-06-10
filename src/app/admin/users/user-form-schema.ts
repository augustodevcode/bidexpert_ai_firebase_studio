
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
  cpf: z.string().optional(), // Adicionado
  cellPhone: z.string().optional(), // Adicionado
  dateOfBirth: z.date().optional().nullable(), // Adicionado
});

export type UserFormValues = z.infer<typeof userFormSchema>;
