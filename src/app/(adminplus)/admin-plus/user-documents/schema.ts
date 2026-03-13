/**
 * @fileoverview Schema Zod para UserDocument — Admin Plus.
 */
import { z } from 'zod';

export const userDocumentSchema = z.object({
  userId: z.string().min(1, 'Usuário obrigatório'),
  documentTypeId: z.string().min(1, 'Tipo de documento obrigatório'),
  fileName: z.string().optional(),
  fileUrl: z.string().min(1, 'URL do arquivo obrigatória'),
  status: z.enum(['NOT_SENT', 'SUBMITTED', 'PENDING_ANALYSIS', 'APPROVED', 'REJECTED']).default('PENDING_ANALYSIS'),
  rejectionReason: z.string().optional(),
});
