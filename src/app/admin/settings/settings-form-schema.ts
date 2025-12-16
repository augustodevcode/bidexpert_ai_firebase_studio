// src/app/admin/settings/settings-form-schema.ts
/**
 * @fileoverview Este arquivo define o schema de validação (usando Zod) para
 * o formulário de configurações da plataforma. Ele abrange todas as seções de
 * configuração, desde a identidade do site até as regras de lance e integrações,
 * garantindo a consistência e a integridade dos dados de configuração.
 */
import * as z from 'zod';
import type { MapSettings, SearchPaginationType, StorageProviderType, ThemeSettings } from '@/types'; // Import MapSettings, StorageProviderType

// Schema para ThemeSettings
const ThemeColorsSchema = z.object({
  primary: z.string().optional().nullable(),
  background: z.string().optional().nullable(),
  accent: z.string().optional().nullable(),
});

const ThemeSettingsSchema = z.object({
  name: z.string(),
  colors: z.object({
    light: ThemeColorsSchema.optional(),
    dark: ThemeColorsSchema.optional(),
  }).optional(),
});


// Schema para MapSettings
const MapSettingsSchema = z.object({
  defaultProvider: z.enum(['openstreetmap', 'openmap', 'google', 'staticImage']).default('openstreetmap'),
  googleMapsApiKey: z.string().optional().nullable(),
});

// Schema para BiddingSettings
const BiddingSettingsSchema = z.object({
  instantBiddingEnabled: z.boolean().default(true),
  getBidInfoInstantly: z.boolean().default(true),
  biddingInfoCheckIntervalSeconds: z.coerce.number().int().min(1).max(60).default(1),
});

// Schema para IdMasks
const IdMasksSchema = z.object({
    auctionCodeMask: z.string().optional().nullable(),
    lotCodeMask: z.string().optional().nullable(),
    sellerCodeMask: z.string().optional().nullable(),
    auctioneerCodeMask: z.string().optional().nullable(),
    userCodeMask: z.string().optional().nullable(),
    assetCodeMask: z.string().optional().nullable(),
    categoryCodeMask: z.string().optional().nullable(),
    subcategoryCodeMask: z.string().optional().nullable(),
});

// Schema para PaymentGatewaySettings
const PaymentGatewaySettingsSchema = z.object({
    defaultGateway: z.enum(['Manual', 'Pagarme', 'Stripe']).default('Manual'),
    platformCommissionPercentage: z.coerce.number().min(0).max(100).default(5),
    gatewayApiKey: z.string().optional().nullable(),
    gatewayEncryptionKey: z.string().optional().nullable(),
});

// Schema para NotificationSettings
const NotificationSettingsSchema = z.object({
    notifyOnNewAuction: z.boolean().default(true),
    notifyOnFeaturedLot: z.boolean().default(false),
    notifyOnAuctionEndingSoon: z.boolean().default(true),
    notifyOnPromotions: z.boolean().default(true),
});

// Schema para MentalTriggerSettings
const MentalTriggerSettingsSchema = z.object({
    showDiscountBadge: z.boolean().default(true),
    showPopularityBadge: z.boolean().default(true),
    popularityViewThreshold: z.coerce.number().int().min(0).default(500),
    showHotBidBadge: z.boolean().default(true),
    hotBidThreshold: z.coerce.number().int().min(0).default(10),
    showExclusiveBadge: z.boolean().default(true),
});

// Schema para SectionBadgeVisibility
const SectionBadgeVisibilitySchema = z.object({
    searchGrid: z.object({
        showStatusBadge: z.boolean().default(true),
        showDiscountBadge: z.boolean().default(true),
        showUrgencyTimer: z.boolean().default(true),
        showPopularityBadge: z.boolean().default(true),
        showHotBidBadge: z.boolean().default(true),
        showExclusiveBadge: z.boolean().default(true),
    }).optional(),
});

// Schema para VariableIncrementRule
const VariableIncrementRuleSchema = z.object({
    from: z.coerce.number(),
    to: z.coerce.number().nullable(),
    increment: z.coerce.number(),
});

// Schema para RealtimeSettings (Tempo Real & Blockchain)
const RealtimeSettingsSchema = z.object({
    // Blockchain
    blockchainEnabled: z.boolean().default(false),
    blockchainNetwork: z.enum(['HYPERLEDGER', 'ETHEREUM', 'NONE']).default('NONE'),
    
    // Soft Close (Anti-Sniping) - Default da plataforma
    softCloseEnabled: z.boolean().default(false),
    softCloseMinutes: z.coerce.number().int().min(1).max(60).default(5),
    
    // Portal de Advogados
    lawyerPortalEnabled: z.boolean().default(true),
    lawyerMonetizationModel: z.enum(['SUBSCRIPTION', 'PAY_PER_USE', 'REVENUE_SHARE']).default('SUBSCRIPTION'),
    lawyerSubscriptionPrice: z.coerce.number().int().min(0).optional().nullable(),
    lawyerPerUsePrice: z.coerce.number().int().min(0).optional().nullable(),
    lawyerRevenueSharePercent: z.coerce.number().min(0).max(100).optional().nullable(),
});


// Schema principal de configurações da plataforma
export const platformSettingsFormSchema = z.object({
  // General - siteTitle tem default para permitir edição parcial
  siteTitle: z.string().min(3, { message: "O título do site deve ter pelo menos 3 caracteres."}).max(100, { message: "O título do site não pode exceder 100 caracteres."}).default('BidExpert'),
  siteTagline: z.string().max(200, { message: "O tagline não pode exceder 200 caracteres."}).optional().nullable(),
  logoUrl: z.string().url("URL do logo inválida.").optional().nullable().or(z.literal('')),
  crudFormMode: z.enum(['modal', 'sheet']).optional().default('modal'),

  // Realtime & Blockchain - Agora como objeto aninhado
  realtimeSettings: RealtimeSettingsSchema.optional().nullable(),
  
  // Relations - nullable para aceitar null do banco de dados
  themes: z.array(ThemeSettingsSchema).optional().nullable(),
  mapSettings: MapSettingsSchema.optional().nullable(),
  biddingSettings: BiddingSettingsSchema.optional().nullable(),
  platformPublicIdMasks: IdMasksSchema.optional().nullable(),
  paymentGatewaySettings: PaymentGatewaySettingsSchema.optional().nullable(),
  notificationSettings: NotificationSettingsSchema.optional().nullable(),
  mentalTriggerSettings: MentalTriggerSettingsSchema.optional().nullable(),
  sectionBadgeVisibility: SectionBadgeVisibilitySchema.optional().nullable(),
  variableIncrementTable: z.array(VariableIncrementRuleSchema).optional().nullable(),
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsFormSchema>;
export type RealtimeSettingsFormValues = z.infer<typeof RealtimeSettingsSchema>;
