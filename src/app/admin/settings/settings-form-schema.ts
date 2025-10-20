// src/app/admin/settings/settings-form-schema.ts
/**
 * @fileoverview Este arquivo define o schema de validação (usando Zod) para
 * o formulário de configurações da plataforma. Ele abrange todas as seções de
 * configuração, desde a identidade do site até as regras de lance e integrações,
 * garantindo a consistência e a integridade dos dados de configuração.
 */
import * as z from 'zod';
import type { MapSettings, SearchPaginationType, StorageProviderType, ThemeSettings } from '@/types'; // Import MapSettings, StorageProviderType

export const platformSettingsFormSchema = z.object({
  siteTitle: z.string().min(3, { message: "O título do site deve ter pelo menos 3 caracteres."}).max(100, { message: "O título do site não pode exceder 100 caracteres."}),
  siteTagline: z.string().max(200, { message: "O tagline não pode exceder 200 caracteres."}).optional().nullable(),
  logoUrl: z.string().url("URL do logo inválida.").optional().or(z.literal('')),
  
  // ThemeSettings
  themes: z.object({
    colors: z.object({
      light: z.object({
        primary: z.string().optional(),
        background: z.string().optional(),
        accent: z.string().optional(),
      }).optional(),
      dark: z.object({
        primary: z.string().optional(),
        background: z.string().optional(),
        accent: z.string().optional(),
      }).optional(),
    }).optional(),
  }).optional(),

  // Outras configurações permanecem aqui por enquanto, serão movidas em etapas futuras.
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
  crudFormMode: z.enum(['modal', 'sheet']).optional().default('modal'),
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsFormSchema>;
