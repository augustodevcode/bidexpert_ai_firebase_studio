
import * as z from 'zod';

export const platformSettingsFormSchema = z.object({
  galleryImageBasePath: z.string()
    .min(1, { message: "O caminho base da galeria de imagens é obrigatório." })
    .startsWith("/", { message: "O caminho deve começar com uma barra '/'." })
    .endsWith("/", { message: "O caminho deve terminar com uma barra '/'." })
    .regex(/^(\/[a-zA-Z0-9_-]+)+\/$/, { message: "Caminho inválido. Use apenas letras, números, hífens, underscores e barras. Ex: /media/gallery/" })
    .max(200, { message: "O caminho não pode exceder 200 caracteres." }),
  // Adicione outros campos de configuração aqui conforme necessário
  // Ex: siteName: z.string().min(3).max(50),
});

export type PlatformSettingsFormValues = z.infer<typeof platformSettingsFormSchema>;
