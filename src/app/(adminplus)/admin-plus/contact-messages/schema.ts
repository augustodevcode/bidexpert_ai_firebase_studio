/**
 * Schema Zod para ContactMessage (Mensagens de Contato).
 */
import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().or(z.literal('')).optional(),
  subject: z.string().or(z.literal('')).optional(),
  message: z.string().min(1, 'Mensagem obrigatória'),
  isRead: z.boolean().optional(),
});
