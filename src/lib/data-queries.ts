// src/lib/data-queries.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { 
    PlatformSettings
} from '@/types';

/**
 * Fetches the platform settings from the database.
 * This is a centralized query function safe to be used by Server Components.
 * @returns {Promise<PlatformSettings>}
 */
export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const settings = await prisma.platformSettings.findFirst();
  if (!settings) {
    throw new Error("As configurações da plataforma não puderam ser carregadas. Execute o setup inicial.");
  }
  // Assegura que o tipo retornado corresponde à interface PlatformSettings, mesmo que o DB retorne campos opcionais
  return settings as PlatformSettings;
}
