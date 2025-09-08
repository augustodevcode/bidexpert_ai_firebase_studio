// packages/core/src/lib/zod-schemas.ts
import { z } from 'zod';
import { auctionStatusValues, lotStatusValues, userHabilitationStatusValues, accountTypeValues, paymentStatusValues } from './zod-enums';

// Bidding Settings Schema
const BiddingSettingsSchema = z.object({
  instantBiddingEnabled: z.boolean().default(true),
  getBidInfoInstantly: z.boolean().default(true),
  biddingInfoCheckIntervalSeconds: z.number().int().min(1).max(60).default(1),
});

// Auction Stage Schema
const AuctionStageSchema = z.object({
  name: z.string().min(1),
  endDate: z.union([z.date(), z.string().datetime()]),
  initialPrice: z.number().positive().optional(),
  statusText: z.string().optional(),
});

// Auction Schema
export const AuctionSchema = z.object({
  id: z.string(),
  publicId: z.string(),
  title: z.string().min(5),
  description: z.string().optional(),
  status: z.enum(auctionStatusValues as [string, ...string[]]).default('RASCUNHO'),
  auctionDate: z.union([z.date(), z.string().datetime()]),
  endDate: z.union([z.date(), z.string().datetime()]).optional().nullable(),
  totalLots: z.number().int().optional(),
  categoryId: z.string().optional(),
  auctioneerId: z.string(),
  sellerId: z.string(),
  imageUrl: z.string().url().optional().nullable(),
  imageMediaId: z.string().optional().nullable(),
  visits: z.number().int().optional(),
  auctionType: z.enum(['JUDICIAL', 'EXTRAJUDICIAL', 'PARTICULAR', 'TOMADA_DE_PRECOS', 'DUTCH', 'SILENT']).optional(),
  auctionStages: z.array(AuctionStageSchema).optional(),
  biddingSettings: BiddingSettingsSchema.optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  // Add other fields as needed, matching the types/index.ts Auction interface
});
export type AuctionZod = z.infer<typeof AuctionSchema>;


// Lot Schema
export const LotSchema = z.object({
    id: z.string(),
    publicId: z.string(),
    auctionId: z.string(),
    number: z.string().optional(),
    title: z.string().min(5),
    description: z.string().optional().nullable(),
    price: z.number(),
    initialPrice: z.number().optional().nullable(),
    status: z.enum(lotStatusValues as [string, ...string[]]).default('EM_BREVE'),
    bidsCount: z.number().int().optional(),
    views: z.number().int().optional(),
    imageUrl: z.string().url().optional().nullable(),
    imageMediaId: z.string().optional().nullable(),
    categoryId: z.string().optional(),
    bemIds: z.array(z.string()).optional(),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
     // Add other fields as needed
});
export type LotZod = z.infer<typeof LotSchema>;

// User Schema
export const UserProfileDataSchema = z.object({
    id: z.string(),
    uid: z.string(),
    email: z.string().email(),
    password: z.string().optional(),
    fullName: z.string().nullable(),
    habilitationStatus: z.enum(userHabilitationStatusValues as [string, ...string[]]),
    accountType: z.enum(accountTypeValues as [string, ...string[]]),
    roleIds: z.array(z.string()),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
    // Add other fields from UserProfileData interface
});
export type UserProfileDataZod = z.infer<typeof UserProfileDataSchema>;

// Seller Schema
export const SellerProfileInfoSchema = z.object({
  id: z.string(),
  publicId: z.string(),
  slug: z.string(),
  name: z.string(),
  isJudicial: z.boolean().default(false),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  // Add other fields
});
export type SellerProfileInfoZod = z.infer<typeof SellerProfileInfoSchema>;


// Auctioneer Schema
export const AuctioneerProfileInfoSchema = z.object({
  id: z.string(),
  publicId: z.string(),
  slug: z.string(),
  name: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  // Add other fields
});
export type AuctioneerProfileInfoZod = z.infer<typeof AuctioneerProfileInfoSchema>;

// Checkout Form Schema
const cardSchema = z.object({
  cardholderName: z.string().min(3, { message: "O nome no cartão é obrigatório." }),
  cardNumber: z.string()
    .min(16, { message: "O número do cartão deve ter 16 dígitos." })
    .max(16, { message: "O número do cartão deve ter 16 dígitos." })
    .regex(/^\d+$/, { message: "O número do cartão deve conter apenas dígitos." }),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: "Formato de validade inválido. Use MM/AA." })
    .refine((val) => {
        const [month, year] = val.split('/');
        const expiry = new Date(2000 + parseInt(year, 10), parseInt(month, 10));
        const now = new Date();
        now.setMonth(now.getMonth() - 1); // Allow current month
        return expiry > now;
    }, { message: "Cartão expirado." }),
  cvc: z.string().min(3, { message: "CVC deve ter 3 dígitos." }).max(4, { message: "CVC inválido." }),
});

export const checkoutFormSchema = z.object({
  paymentMethod: z.enum(['credit_card', 'installments'], {
    required_error: "Selecione um método de pagamento.",
  }),
  installments: z.coerce.number().optional(),
  cardDetails: cardSchema.optional(),
}).superRefine((data, ctx) => {
    if (data.paymentMethod === 'credit_card' && !data.cardDetails) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['cardDetails'],
            message: "Detalhes do cartão são obrigatórios para pagamento à vista.",
        });
    }
});
