/**
 * @fileoverview Schema Zod para MediaItem — Admin Plus.
 */
import { z } from 'zod';

export const mediaItemSchema = z.object({
  fileName: z.string().min(1, 'Nome do arquivo é obrigatório'),
  storagePath: z.string().min(1, 'Caminho de armazenamento é obrigatório'),
  urlOriginal: z.string().url('URL original inválida'),
  urlThumbnail: z.string().url('URL thumbnail inválida').or(z.literal('')).optional(),
  urlMedium: z.string().url('URL média inválida').or(z.literal('')).optional(),
  urlLarge: z.string().url('URL grande inválida').or(z.literal('')).optional(),
  mimeType: z.string().min(1, 'Tipo MIME é obrigatório'),
  sizeBytes: z.coerce.number().int().min(0).optional(),
  altText: z.string().or(z.literal('')).optional(),
  caption: z.string().or(z.literal('')).optional(),
  description: z.string().or(z.literal('')).optional(),
  title: z.string().or(z.literal('')).optional(),
  dataAiHint: z.string().or(z.literal('')).optional(),
});

export type MediaItemSchema = z.infer<typeof mediaItemSchema>;
