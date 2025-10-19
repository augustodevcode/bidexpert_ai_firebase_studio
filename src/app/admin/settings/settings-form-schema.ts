// src/app/admin/settings/settings-form-schema.ts
/**
 * @fileoverview Este arquivo define o schema de validação (usando Zod) para
 * o formulário de configurações da plataforma. Ele abrange todas as seções de
 * configuração, desde a identidade do site até as regras de lance e integrações,
 * garantindo a consistência e a integridade dos dados de configuração.
 */
import * as z from 'zod';
import type { MapSettings, SearchPaginationType, StorageProviderType } from '@/types'; // Import MapSettings, StorageProviderType

const themeColorSchema = z.record(z.string().regex(/^hsl\(\d{1,3}(deg)?(\s\d{1,3}%){2}\)$/i, {
    message: "Cor deve estar no formato HSL, ex: hsl(25 95% 53%)"
}));

const themeSchema = z.object({
    name: z.string().min(1, "Nome do tema é obrigatório."),
    colors: themeColorSchema,
});

const variableIncrementRuleSchema = z.object({
  from: z.coerce.number().min(0, "O valor 'De' deve ser no mínimo 0."),
  to: z.coerce.number().positive("O valor 'Até' deve ser positivo.").nullable(),
  increment: z.coerce.number().positive("O incremento deve ser positivo."),
});

const biddingSettingsSchema = z.object({
  instantBiddingEnabled: z.boolean().optional().default(true),
  getBidInfoInstantly: z.boolean().optional().default(true),
  biddingInfoCheckIntervalSeconds: z.coerce.number().min(1, "O intervalo deve ser de no mínimo 1 segundo.").max(60, "O intervalo não pode ser maior que 60 segundos.").optional().default(1),
}).optional();

const paymentGatewaySettingsSchema = z.object({
    defaultGateway: z.enum(['Pagarme', 'Stripe', 'Manual']).optional().default('Manual'),
    platformCommissionPercentage: z.coerce.number().min(0, "A comissão não pode ser negativa.").max(20, "A comissão não pode exceder 20%.").optional().default(5),
    gatewayApiKey: z.string().max(100).optional().nullable(),
    gatewayEncryptionKey: z.string().max(100).optional().nullable(),
}).optional();

// Novo schema para configurações de notificação
const notificationSettingsSchema = z.object({
    notifyOnNewAuction: z.boolean().optional().default(true),
    notifyOnFeaturedLot: z.boolean().optional().default(false),
    notifyOnAuctionEndingSoon: z.boolean().optional().default(true),
    notifyOnPromotions: z.boolean().optional().default(true),
}).optional();


export const platformSettingsFormSchema = z.object({
  siteTitle: z.string().min(3, { message: "O título do site deve ter pelo menos 3 caracteres."}).max(100, { message: "O título do site não pode exceder 100 caracteres."}),
  siteTagline: z.string().max(200, { message: "O tagline não pode exceder 200 caracteres."}).optional().nullable(),
  galleryImageBasePath: z.string()
    .min(1, { message: "O caminho base da galeria de imagens é obrigatório." })
    .startsWith("/", { message: "O caminho deve começar com uma barra '/'." })
    .endsWith("/", { message: "O caminho deve terminar com uma barra '/'." })
    .regex(/^(\/[a-zA-Z0-9_-]+)+\/$/, { message: "Caminho inválido. Use apenas letras, números, hífens, underscores e barras. Ex: /media/gallery/" })
    .max(200, { message: "O caminho não pode exceder 200 caracteres." }),
  storageProvider: z.enum(['local', 'firebase'], {
    errorMap: () => ({ message: "Por favor, selecione um provedor de armazenamento válido." })
  }).optional().default('local'),
  firebaseStorageBucket: z.string().max(200, {message: "Nome do bucket muito longo."}).optional().nullable(),
  activeThemeName: z.string().optional().nullable(),
  themesJson: z.array(themeSchema).optional().default([]), 
  platformPublicIdMasksJson: z.object({ 
    auctions: z.string().optional(),
    lots: z.string().optional(),
    auctioneers: z.string().optional(),
    sellers: z.string().optional(),
  }).optional().nullable(),
  crudFormMode: z.enum(['modal', 'sheet']).optional().default('modal'),
  mapSettingsJson: z.object({
    defaultProvider: z.enum(['google', 'openstreetmap', 'staticImage'], {
        errorMap: () => ({ message: "Selecione um provedor de mapa válido."})
    }).optional().default('openstreetmap'),
    googleMapsApiKey: z.string().max(100, { message: "Chave API do Google Maps não pode exceder 100 caracteres."}).optional().nullable().or(z.literal('')),
    staticImageMapZoom: z.coerce.number().min(1, {message: "Zoom deve ser entre 1 e 20."}).max(20, {message: "Zoom deve ser entre 1 e 20."}).optional().default(15),
    staticImageMapMarkerColor: z.string().max(50, {message: "Cor do marcador não pode exceder 50 caracteres."}).optional().default('blue'),
  }).optional(),
  notificationSettingsJson: notificationSettingsSchema,
  searchPaginationType: z.enum(['loadMore', 'numberedPages'], {
    errorMap: () => ({ message: "Selecione um tipo de paginação válido."})
  }).optional().default('loadMore'),
  searchItemsPerPage: z.coerce.number().min(1, {message: "Deve ser pelo menos 1."}).max(100, {message: "Não pode exceder 100."}).optional().default(12),
  searchLoadMoreCount: z.coerce.number().min(1, {message: "Deve ser pelo menos 1."}).max(100, {message: "Não pode exceder 100."}).optional().default(12),
  showCountdownOnLotDetail: z.boolean().optional().default(true),
  showCountdownOnCards: z.boolean().optional().default(true),
  showRelatedLotsOnLotDetail: z.boolean().optional().default(true),
  relatedLotsCount: z.coerce.number().min(1, {message: "Deve ser pelo menos 1."}).max(20, {message: "Não pode exceder 20."}).optional().default(5),
  defaultUrgencyTimerHours: z.coerce.number().min(1, {message: "O tempo de urgência deve ser de no mínimo 1 hora."}).optional().nullable(),
  variableIncrementTableJson: z.array(variableIncrementRuleSchema).optional().default([]),
  biddingSettingsJson: biddingSettingsSchema,
  paymentGatewaySettingsJson: paymentGatewaySettingsSchema,
  defaultListItemsPerPage: z.coerce.number().min(5, "Mínimo de 5 itens por página").max(100, "Máximo de 100 itens por página").optional().default(10),
}).refine(data => {
  const table = data.variableIncrementTableJson;
  if (!table || table.length === 0) return true;

  for (let i = 0; i < table.length; i++) {
    const current = table[i];
    if (current.to !== null && current.from >= current.to) {
      return false;
    }
    if (i > 0) {
      const prev = table[i - 1];
      if (prev.to !== current.from) {
        return false;
      }
    }
    if (i === table.length - 1 && current.to !== null) {
      return false;
    }
    if (i < table.length - 1 && current.to === null) {
        return false;
    }
  }

  return true;
}, {
  message: "As faixas de incremento são inválidas. Verifique se não há sobreposições, se os valores 'De' e 'Até' são sequenciais e se a última faixa termina em 'em diante'.",
  path: ['variableIncrementTableJson'], 
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsFormSchema>;
