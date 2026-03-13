/**
 * Zod schema for LotDocument entity (Admin Plus CRUD).
 */
import { z } from 'zod';

export const lotDocumentSchema = z.object({
  lotId: z.string().min(1, 'Lote é obrigatório'),
  fileName: z.string().min(1, 'Nome do arquivo é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional().or(z.literal('')),
  fileUrl: z.string().min(1, 'URL do arquivo é obrigatória'),
  fileSize: z.coerce.number().optional(),
  mimeType: z.string().optional().or(z.literal('')),
  displayOrder: z.coerce.number().int().default(0),
  isPublic: z.boolean().default(true),
});
