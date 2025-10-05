// src/app/admin/assets/asset-form-schema.ts
/**
 * @fileoverview Define o schema de validação (usando Zod) para o formulário
 * de criação e edição de Assets (ativos). Este schema foi simplificado para
 * usar um campo de texto genérico de "propriedades" em vez de dezenas de campos
 * específicos por categoria.
 */
import * as z from 'zod';
import type { Asset } from '@/types';

const assetStatusValues: [Asset['status'], ...Asset['status'][]] = [
  'CADASTRO', 'DISPONIVEL', 'LOTEADO', 'VENDIDO', 'REMOVIDO', 'INATIVADO'
];

const optionalUrlSchema = z.string().url({ message: "URL inválida." }).or(z.literal('')).optional().nullable();

export const assetFormSchema = z.object({
  title: z.string().min(5, {
    message: "O título do bem deve ter pelo menos 5 caracteres.",
  }).max(200, {
    message: "O título do bem não pode exceder 200 caracteres.",
  }),
  description: z.string().max(5000).optional().nullable(),
  properties: z.string().max(10000, "As propriedades não podem exceder 10.000 caracteres.").optional().nullable(),
  status: z.enum(assetStatusValues),
  categoryId: z.string().min(1, "A categoria é obrigatória."),
  subcategoryId: z.string().optional().nullable(),
  judicialProcessId: z.string().optional().nullable(),
  sellerId: z.string().min(1, "O comitente/vendedor é obrigatório."),
  evaluationValue: z.coerce.number().positive("O valor de avaliação deve ser positivo.").optional().nullable(),
  imageUrl: optionalUrlSchema,
  imageMediaId: z.string().optional().nullable(),
  galleryImageUrls: z.array(z.string().url()).optional(),
  mediaItemIds: z.array(z.string()).optional(),
  dataAiHint: z.string().max(50).optional().nullable(),
  
  // Endereço
  street: z.string().max(255).optional().nullable(),
  number: z.string().max(20).optional().nullable(),
  complement: z.string().max(100).optional().nullable(),
  neighborhood: z.string().max(100).optional().nullable(),
  cityId: z.string().optional().nullable(),
  stateId: z.string().optional().nullable(),
  zipCode: z.string().max(10).optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
});

export type AssetFormData = z.infer<typeof assetFormSchema>;
