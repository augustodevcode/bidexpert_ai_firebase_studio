// src/services/platform-settings.service.ts
import { PlatformSettingsRepository } from '@/repositories/platform-settings.repository';
import type { PlatformSettings } from '@/types';
import { samplePlatformSettings } from '@/lib/sample-data';
import type { Prisma } from '@prisma/client';

export class PlatformSettingsService {
  private repository: PlatformSettingsRepository;

  constructor() {
    this.repository = new PlatformSettingsRepository();
  }

  async getSettings(): Promise<PlatformSettings> {
    const settings = await this.repository.findFirst();
    if (!settings) {
      console.warn("Platform settings not found in DB, returning default sample settings.");
      return samplePlatformSettings as PlatformSettings;
    }
    return settings as PlatformSettings;
  }

  async updateSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    try {
      const currentSettings = await this.repository.findFirst();
      if (currentSettings) {
        // @ts-ignore
        await this.repository.update(currentSettings.id, data);
      } else {
        // @ts-ignore
        await this.repository.create({ ...data, id: 'global' });
      }
      return { success: true, message: 'Configurações atualizadas com sucesso.' };
    } catch (error: any) {
      console.error("Error in PlatformSettingsService.updateSettings:", error);
      return { success: false, message: `Falha ao atualizar configurações: ${error.message}` };
    }
  }
}
