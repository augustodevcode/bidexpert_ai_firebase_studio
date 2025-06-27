import * as z from 'zod';
import type { DirectSaleOfferStatus, DirectSaleOfferType } from '@/types';

const offerStatusValues: [DirectSaleOfferStatus, ...DirectSaleOfferStatus[]] = [
  'ACTIVE', 'PENDING_APPROVAL', 'SOLD', 'EXPIRED'
];
const offerTypeValues: [DirectSaleOfferType, ...DirectSaleOfferType[]] = [
  'BUY_NOW', 'ACCEPTS_PROPOSALS'
];

export const directSaleOfferFormSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres.").max(200, "O título não pode exceder 200 caracteres."),
  description: z.string().max(5000, "A descrição não pode exceder 5000 caracteres.").optional(),
  offerType: z.enum(offerTypeValues, { required_error: "O tipo de oferta é obrigatório." }),
  status: z.enum(offerStatusValues, { required_error: "O status é obrigatório." }),
  price: z.coerce.number().positive("O preço deve ser positivo.").optional().nullable(),
  minimumOfferPrice: z.coerce.number().positive("O valor mínimo da proposta deve ser positivo.").optional().nullable(),
  category: z.string().min(1, "A categoria é obrigatória.").max(100),
  sellerName: z.string().min(1, "O nome do vendedor é obrigatório.").max(150),
  locationCity: z.string().max(100).optional(),
  locationState: z.string().max(100).optional(),
  imageUrl: z.string().url("URL da imagem inválida.").optional().or(z.literal('')),
  imageMediaId: z.string().optional().nullable(),
  dataAiHint: z.string().max(50).optional(),
  galleryImageUrls: z.array(z.string().url()).optional(),
  mediaItemIds: z.array(z.string()).optional(),
  expiresAt: z.date().optional().nullable(),
}).refine(data => {
    if (data.offerType === 'BUY_NOW' && !data.price) {
        return false;
    }
    return true;
}, {
    message: "O preço é obrigatório para ofertas do tipo 'Comprar Já'.",
    path: ['price'],
});

export type DirectSaleOfferFormData = z.infer<typeof directSaleOfferFormSchema>;
