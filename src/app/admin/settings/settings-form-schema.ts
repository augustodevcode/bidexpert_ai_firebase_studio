
import * as z from 'zod';

const themeColorSchema = z.record(z.string().regex(/^hsl\(\d{1,3}(deg)?(\s\d{1,3}%){2}\)$/i, {
    message: "Cor deve estar no formato HSL, ex: hsl(25 95% 53%)"
}));

const themeSchema = z.object({
    name: z.string().min(1, "Nome do tema é obrigatório."),
    colors: themeColorSchema,
});

export const platformSettingsFormSchema = z.object({
  siteTitle: z.string().min(3, { message: "O título do site deve ter pelo menos 3 caracteres."}).max(100, { message: "O título do site não pode exceder 100 caracteres."}).optional(),
  siteTagline: z.string().max(200, { message: "O tagline não pode exceder 200 caracteres."}).optional(),
  galleryImageBasePath: z.string()
    .min(1, { message: "O caminho base da galeria de imagens é obrigatório." })
    .startsWith("/", { message: "O caminho deve começar com uma barra '/'." })
    .endsWith("/", { message: "O caminho deve terminar com uma barra '/'." })
    .regex(/^(\/[a-zA-Z0-9_-]+)+\/$/, { message: "Caminho inválido. Use apenas letras, números, hífens, underscores e barras. Ex: /media/gallery/" })
    .max(200, { message: "O caminho não pode exceder 200 caracteres." }),
  activeThemeName: z.string().optional().nullable(),
  themes: z.array(themeSchema).optional().default([]), 
  platformPublicIdMasks: z.object({ 
    auctions: z.string().optional(),
    lots: z.string().optional(),
    auctioneers: z.string().optional(),
    sellers: z.string().optional(),
  }).optional().nullable(),
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsFormSchema>;

    