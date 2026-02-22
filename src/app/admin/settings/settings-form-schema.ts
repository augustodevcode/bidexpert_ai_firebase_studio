// src/app/admin/settings/settings-form-schema.ts
/**
 * @fileoverview Este arquivo define o schema de validação (usando Zod) para
 * o formulário de configurações da plataforma. Ele abrange todas as seções de
 * configuração, desde a identidade do site até as regras de lance e integrações,
 * garantindo a consistência e a integridade dos dados de configuração.
 */
import * as z from 'zod';
import type { MapSettings, SearchPaginationType, StorageProviderType } from '@/types'; // Import MapSettings, StorageProviderType
import type { ThemeTokens } from '@/lib/theme-tokens';

// Schema para tokens completos do tema Shadcn
const ThemeTokensSchema: z.ZodType<ThemeTokens> = z.object({
  background: z.string().optional().nullable(),
  foreground: z.string().optional().nullable(),
  card: z.string().optional().nullable(),
  cardForeground: z.string().optional().nullable(),
  popover: z.string().optional().nullable(),
  popoverForeground: z.string().optional().nullable(),
  primary: z.string().optional().nullable(),
  primaryForeground: z.string().optional().nullable(),
  secondary: z.string().optional().nullable(),
  secondaryForeground: z.string().optional().nullable(),
  muted: z.string().optional().nullable(),
  mutedForeground: z.string().optional().nullable(),
  accent: z.string().optional().nullable(),
  accentForeground: z.string().optional().nullable(),
  destructive: z.string().optional().nullable(),
  destructiveForeground: z.string().optional().nullable(),
  border: z.string().optional().nullable(),
  input: z.string().optional().nullable(),
  ring: z.string().optional().nullable(),
  chart1: z.string().optional().nullable(),
  chart2: z.string().optional().nullable(),
  chart3: z.string().optional().nullable(),
  chart4: z.string().optional().nullable(),
  chart5: z.string().optional().nullable(),
  sidebarBackground: z.string().optional().nullable(),
  sidebarForeground: z.string().optional().nullable(),
  sidebarPrimary: z.string().optional().nullable(),
  sidebarPrimaryForeground: z.string().optional().nullable(),
  sidebarAccent: z.string().optional().nullable(),
  sidebarAccentForeground: z.string().optional().nullable(),
  sidebarBorder: z.string().optional().nullable(),
  sidebarRing: z.string().optional().nullable(),
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
  // V2 Monitor Pregão
  proxyBiddingEnabled: z.boolean().default(true),
  softCloseTriggerMinutes: z.coerce.number().int().min(1).max(30).default(3),
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

    // V2 Monitor Pregão - Admin Toggles
    communicationStrategy: z.enum(['WEBSOCKET', 'POLLING']).default('WEBSOCKET'),
    videoStrategy: z.enum(['HLS', 'WEBRTC', 'DISABLED']).default('DISABLED'),
    idempotencyStrategy: z.enum(['SERVER_HASH', 'CLIENT_UUID']).default('SERVER_HASH'),
});

// Schema para Marketing > Publicidade do Site
const SiteAdsSettingsSchema = z.object({
  marketingSiteAdsSuperOpportunitiesEnabled: z.boolean().default(true),
  marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds: z.coerce.number().int().min(3).max(60).default(6),
});


// Schema principal de configurações da plataforma
export const platformSettingsFormSchema = z.object({
  // General - siteTitle tem default para permitir edição parcial
  siteTitle: z.string().min(3, { message: "O título do site deve ter pelo menos 3 caracteres."}).max(100, { message: "O título do site não pode exceder 100 caracteres."}).default('BidExpert'),
  siteTagline: z.string().max(200, { message: "O tagline não pode exceder 200 caracteres."}).optional().nullable(),
  logoUrl: z.string().url("URL do logo inválida.").optional().nullable().or(z.literal('')),
  logoMediaId: z.string().optional().nullable(),
  radiusValue: z.string().optional().nullable(),
  crudFormMode: z.enum(['modal', 'sheet']).optional().default('modal'),

  // Realtime & Blockchain - Agora como objeto aninhado
  realtimeSettings: RealtimeSettingsSchema.optional().nullable(),
  
  // Relations - nullable para aceitar null do banco de dados
  themeColorsLight: ThemeTokensSchema.optional().nullable(),
  themeColorsDark: ThemeTokensSchema.optional().nullable(),
  mapSettings: MapSettingsSchema.optional().nullable(),
  biddingSettings: BiddingSettingsSchema.optional().nullable(),
  platformPublicIdMasks: IdMasksSchema.optional().nullable(),
  paymentGatewaySettings: PaymentGatewaySettingsSchema.optional().nullable(),
  notificationSettings: NotificationSettingsSchema.optional().nullable(),
  mentalTriggerSettings: MentalTriggerSettingsSchema.optional().nullable(),
  sectionBadgeVisibility: SectionBadgeVisibilitySchema.optional().nullable(),
  variableIncrementTable: z.array(VariableIncrementRuleSchema).optional().nullable(),
  marketingSiteAdsSuperOpportunitiesEnabled: SiteAdsSettingsSchema.shape.marketingSiteAdsSuperOpportunitiesEnabled,
  marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds: SiteAdsSettingsSchema.shape.marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds,
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsFormSchema>;
export type RealtimeSettingsFormValues = z.infer<typeof RealtimeSettingsSchema>;
