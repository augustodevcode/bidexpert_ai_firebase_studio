/**
 * @fileoverview Zod schema para PasswordResetToken — Admin Plus.
 */
import { z } from 'zod';

export const passwordResetTokenSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  token: z.string().min(1, 'Token é obrigatório'),
  expires: z.string().min(1, 'Data de expiração é obrigatória'),
});

export type PasswordResetTokenFormValues = z.infer<typeof passwordResetTokenSchema>;
