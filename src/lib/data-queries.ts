// src/lib/data-queries.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { 
    PlatformSettings
} from '@/types';
import { samplePlatformSettings } from './sample-data'; // Importando dados de exemplo

/**
 * Fetches the platform settings from the database.
 * This is a centralized query function safe to be used by Server Components.
 * If no settings are found, it returns a default sample configuration to ensure app stability.
 * @returns {Promise<PlatformSettings>}
 */
export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const settings = await prisma.platformSettings.findFirst();
  if (!settings) {
    console.warn("Platform settings not found in DB, returning default sample settings.");
    return samplePlatformSettings as PlatformSettings;
  }
  // Assegura que o tipo retornado corresponde à interface PlatformSettings, mesmo que o DB retorne campos opcionais
  return settings as PlatformSettings;
}
