/**
 * @fileoverview Schema Zod para PlatformSettings (Configurações Gerais da Plataforma).
 * 50+ campos organizados em seções: Branding, Cores, E-mail/SMS, Features, Busca, Marketing, Suporte, JSON avançado.
 */

import { z } from 'zod';

export const platformSettingsSchema = z.object({
  // Branding
  siteTitle: z.string().nullable().optional(),
  siteTagline: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  isSetupComplete: z.boolean().optional().default(false),
  customFontUrl: z.string().nullable().optional(),
  customCss: z.string().nullable().optional(),
  customHeadScripts: z.string().nullable().optional(),

  // Cores HSL
  primaryColorHsl: z.string().nullable().optional(),
  primaryForegroundHsl: z.string().nullable().optional(),
  secondaryColorHsl: z.string().nullable().optional(),
  secondaryForegroundHsl: z.string().nullable().optional(),
  accentColorHsl: z.string().nullable().optional(),
  accentForegroundHsl: z.string().nullable().optional(),
  destructiveColorHsl: z.string().nullable().optional(),
  mutedColorHsl: z.string().nullable().optional(),
  backgroundColorHsl: z.string().nullable().optional(),
  foregroundColorHsl: z.string().nullable().optional(),
  borderColorHsl: z.string().nullable().optional(),
  radiusValue: z.string().nullable().optional(),

  // E-mail e SMS
  emailFromName: z.string().nullable().optional(),
  emailFromAddress: z.string().nullable().optional(),
  smsFromName: z.string().nullable().optional(),

  // Feature Toggles
  enableBlockchain: z.boolean().optional().default(false),
  enableRealtime: z.boolean().optional().default(true),
  enableSoftClose: z.boolean().optional().default(true),
  enableDirectSales: z.boolean().optional().default(true),
  enableMapSearch: z.boolean().optional().default(true),
  enableAIFeatures: z.boolean().optional().default(false),

  // CRUD e Galeria
  crudFormMode: z.string().nullable().optional().default('modal'),
  galleryImageBasePath: z.string().nullable().optional(),
  storageProvider: z.enum(['LOCAL', 'FIREBASE']).nullable().optional(),
  firebaseStorageBucket: z.string().nullable().optional(),
  activeThemeName: z.string().nullable().optional(),

  // Busca
  searchPaginationType: z.enum(['loadMore', 'numberedPages']).nullable().optional(),
  searchItemsPerPage: z.coerce.number().int().nullable().optional().default(12),
  searchLoadMoreCount: z.coerce.number().int().nullable().optional().default(12),

  // Exibição
  showCountdownOnLotDetail: z.boolean().optional().default(true),
  showCountdownOnCards: z.boolean().optional().default(true),
  showRelatedLotsOnLotDetail: z.boolean().optional().default(true),
  relatedLotsCount: z.coerce.number().int().nullable().optional().default(5),
  defaultUrgencyTimerHours: z.coerce.number().int().nullable().optional(),
  defaultListItemsPerPage: z.coerce.number().int().nullable().optional().default(10),

  // Marketing / Super Oportunidades
  marketingSiteAdsSuperOpportunitiesEnabled: z.boolean().optional().default(true),
  marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds: z.coerce.number().int().nullable().optional().default(6),
  marketingSiteAdsSuperOpportunitiesDaysBeforeClosing: z.coerce.number().int().nullable().optional().default(7),

  // Suporte
  supportAddress: z.string().nullable().optional(),
  supportBusinessHours: z.string().nullable().optional(),
  supportEmail: z.string().nullable().optional(),
  supportPhone: z.string().nullable().optional(),
  supportWhatsApp: z.string().nullable().optional(),

  // JSON
  auditTrailConfig: z.any().optional().default(null),
  themeColorsDark: z.any().optional().default(null),
  themeColorsLight: z.any().optional().default(null),
  featureFlags: z.any().optional().default(null),
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsSchema>;
