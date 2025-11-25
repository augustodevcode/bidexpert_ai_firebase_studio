// src/services/audit-config.service.ts
// Service for managing audit trail configuration

import { prisma } from '@/lib/prisma';

export interface AuditConfig {
  enabled: boolean;
  auditedModels: string[];
  fieldExclusions: Record<string, string[]>;
  retentionDays: number;
  useDedicatedDatabase: boolean;
}

const DEFAULT_CONFIG: AuditConfig = {
  enabled: true,
  auditedModels: [
    'Auction',
    'Lot',
    'Asset',
    'Bid',
    'User',
    'Seller',
    'JudicialProcess',
    'Auctioneer',
    'Category',
    'Subcategory',
  ],
  fieldExclusions: {
    User: ['password', 'resetToken', 'verificationToken'],
    Asset: ['internalNotes', 'privateRemarks'],
    Auction: ['adminNotes'],
  },
  retentionDays: 365,
  useDedicatedDatabase: false,
};

const CONFIG_KEY = 'audit_trail_config';

class AuditConfigService {
  private configCache: AuditConfig | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Get audit configuration
   */
  async getConfig(tenantId?: bigint): Promise<AuditConfig> {
    // Check cache
    if (this.configCache && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
      return this.configCache;
    }

    try {
      // Try to fetch from PlatformSettings
      const settings = await prisma.platformSettings.findFirst({
        where: tenantId ? { tenantId } : {},
      });

      if (settings?.auditTrailConfig) {
        const config = JSON.parse(String(settings.auditTrailConfig)) as AuditConfig;
        this.configCache = { ...DEFAULT_CONFIG, ...config };
        this.cacheTimestamp = Date.now();
        return this.configCache;
      }
    } catch (error) {
      console.error('Failed to fetch audit config:', error);
    }

    // Return default config
    this.configCache = DEFAULT_CONFIG;
    this.cacheTimestamp = Date.now();
    return DEFAULT_CONFIG;
  }

  /**
   * Update audit configuration
   */
  async updateConfig(config: Partial<AuditConfig>, tenantId?: bigint): Promise<AuditConfig> {
    const currentConfig = await this.getConfig(tenantId);
    const newConfig = { ...currentConfig, ...config };

    try {
      // Find or create PlatformSettings
      const existingSettings = await prisma.platformSettings.findFirst({
        where: tenantId ? { tenantId } : {},
      });

      if (existingSettings) {
        await prisma.platformSettings.update({
          where: { id: existingSettings.id },
          data: {
            auditTrailConfig: JSON.stringify(newConfig),
          },
        });
      } else if (tenantId) {
        await prisma.platformSettings.create({
          data: {
            tenantId,
            auditTrailConfig: JSON.stringify(newConfig),
          },
        });
      }

      // Clear cache
      this.configCache = null;
      
      return newConfig;
    } catch (error) {
      console.error('Failed to update audit config:', error);
      throw new Error('Failed to update audit configuration');
    }
  }

  /**
   * Check if a model should be audited
   */
  async shouldAuditModel(modelName: string, tenantId?: bigint): Promise<boolean> {
    const config = await this.getConfig(tenantId);
    return config.enabled && config.auditedModels.includes(modelName);
  }

  /**
   * Get excluded fields for a model
   */
  async getExcludedFields(modelName: string, tenantId?: bigint): Promise<string[]> {
    const config = await this.getConfig(tenantId);
    return config.fieldExclusions[modelName] || [];
  }

  /**
   * Add model to audit list
   */
  async addAuditedModel(modelName: string, tenantId?: bigint): Promise<void> {
    const config = await this.getConfig(tenantId);
    if (!config.auditedModels.includes(modelName)) {
      config.auditedModels.push(modelName);
      await this.updateConfig(config, tenantId);
    }
  }

  /**
   * Remove model from audit list
   */
  async removeAuditedModel(modelName: string, tenantId?: bigint): Promise<void> {
    const config = await this.getConfig(tenantId);
    const index = config.auditedModels.indexOf(modelName);
    if (index > -1) {
      config.auditedModels.splice(index, 1);
      await this.updateConfig(config, tenantId);
    }
  }

  /**
   * Set field exclusions for a model
   */
  async setFieldExclusions(modelName: string, fields: string[], tenantId?: bigint): Promise<void> {
    const config = await this.getConfig(tenantId);
    config.fieldExclusions[modelName] = fields;
    await this.updateConfig(config, tenantId);
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache = null;
    this.cacheTimestamp = 0;
  }
}

export const auditConfigService = new AuditConfigService();
