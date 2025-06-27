// src/app/admin/settings/settings-form-schema.ts
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

export const platformSettingsFormSchema = z.object({
  siteTitle: z.string().min(3, { message: "O título do site deve ter pelo menos 3 caracteres."}).max(100, { message: "O título do site não pode exceder 100 caracteres."}).optional(),
  siteTagline: z.string().max(200, { message: "O tagline não pode exceder 200 caracteres."}).optional(),
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
  themes: z.array(themeSchema).optional().default([]), 
  platformPublicIdMasks: z.object({ 
    auctions: z.string().optional(),
    lots: z.string().optional(),
    auctioneers: z.string().optional(),
    sellers: z.string().optional(),
  }).optional().nullable(),
  mapSettings: z.object({
    defaultProvider: z.enum(['google', 'openstreetmap', 'staticImage'], {
        errorMap: () => ({ message: "Selecione um provedor de mapa válido."})
    }).optional().default('openstreetmap'),
    googleMapsApiKey: z.string().max(100, { message: "Chave API do Google Maps não pode exceder 100 caracteres."}).optional().nullable().or(z.literal('')),
    staticImageMapZoom: z.coerce.number().min(1, {message: "Zoom deve ser entre 1 e 20."}).max(20, {message: "Zoom deve ser entre 1 e 20."}).optional().default(15),
    staticImageMapMarkerColor: z.string().max(50, {message: "Cor do marcador não pode exceder 50 caracteres."}).optional().default('blue'),
  }).optional(),
  searchPaginationType: z.enum(['loadMore', 'numberedPages'], {
    errorMap: () => ({ message: "Selecione um tipo de paginação válido."})
  }).optional().default('loadMore'),
  searchItemsPerPage: z.coerce.number().min(1, {message: "Deve ser pelo menos 1."}).max(100, {message: "Não pode exceder 100."}).optional().default(12),
  searchLoadMoreCount: z.coerce.number().min(1, {message: "Deve ser pelo menos 1."}).max(100, {message: "Não pode exceder 100."}).optional().default(12),
  showCountdownOnLotDetail: z.boolean().optional().default(true),
  showCountdownOnCards: z.boolean().optional().default(true),
  showRelatedLotsOnLotDetail: z.boolean().optional().default(true),
  relatedLotsCount: z.coerce.number().min(1, {message: "Deve ser pelo menos 1."}).max(20, {message: "Não pode exceder 20."}).optional().default(5),
  variableIncrementTable: z.array(variableIncrementRuleSchema).optional().default([]),
  biddingSettings: biddingSettingsSchema,
  defaultListItemsPerPage: z.coerce.number().min(5, "Mínimo de 5 itens por página").max(100, "Máximo de 100 itens por página").optional().default(10),
}).refine(data => {
  const table = data.variableIncrementTable;
  if (!table || table.length === 0) return true;

  for (let i = 0; i < table.length; i++) {
    const current = table[i];
    // O valor 'De' deve ser menor que o valor 'Até'
    if (current.to !== null && current.from >= current.to) {
      return false;
    }
    // O valor 'De' da linha atual deve ser igual ao valor 'Até' da linha anterior
    if (i > 0) {
      const prev = table[i - 1];
      if (prev.to !== current.from) {
        return false;
      }
    }
    // A última linha não pode ter um valor 'Até'
    if (i === table.length - 1 && current.to !== null) {
      return false;
    }
    // Todas as linhas, exceto a última, devem ter um valor 'Até'
    if (i < table.length - 1 && current.to === null) {
        return false;
    }
  }

  return true;
}, {
  message: "As faixas de incremento são inválidas. Verifique se não há sobreposições, se os valores 'De' e 'Até' são sequenciais e se a última faixa termina em 'em diante'.",
  path: ['variableIncrementTable'], // Associa o erro à tabela inteira
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsFormSchema>;
