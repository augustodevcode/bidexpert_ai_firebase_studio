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
  colors: z.object({
    light: ThemeColorsSchema.optional(),
    dark: ThemeColorsSchema.optional(),
  }).optional(),
});

// Schema para MapSettings
const MapSettingsSchema = z.object({
  defaultProvider: z.enum(['openstreetmap', 'google', 'staticImage']).default('openstreetmap'),
  googleMapsApiKey: z.string().optional().nullable(),
  staticImageMapZoom: z.number().int().min(1).max(20).default(15),
  staticImageMapMarkerColor: z.string().default('blue'),
});

// Schema para BiddingSettings
const BiddingSettingsSchema = z.object({
  instantBiddingEnabled: z.boolean().default(true),
  getBidInfoInstantly: z.boolean().default(true),
  biddingInfoCheckIntervalSeconds: z.number().int().min(1).max(60).default(1),
});

// Schema para IdMasks
const IdMasksSchema = z.object({
    auctions: z.string().optional().nullable(),
    lots: z.string().optional().nullable(),
    auctioneers: z.string().optional().nullable(),
    sellers: z.string().optional().nullable(),
});


// Schema principal de configurações da plataforma
export const platformSettingsFormSchema = z.object({
  siteTitle: z.string().min(3, { message: "O título do site deve ter pelo menos 3 caracteres."}).max(100, { message: "O título do site não pode exceder 100 caracteres."}),
  siteTagline: z.string().max(200, { message: "O tagline não pode exceder 200 caracteres."}).optional().nullable(),
  logoUrl: z.string().url("URL do logo inválida.").optional().or(z.literal('')),
  
  // Relações que serão tratadas separadamente
  themes: ThemeSettingsSchema.optional(),
  mapSettings: MapSettingsSchema.optional(),
  biddingSettings: BiddingSettingsSchema.optional(),
  platformPublicIdMasks: IdMasksSchema.optional(),
  
  // Configurações Gerais
  crudFormMode: z.enum(['modal', 'sheet']).optional().default('modal'),
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsFormSchema>;
