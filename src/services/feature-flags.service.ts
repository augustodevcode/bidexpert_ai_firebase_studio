import { z } from 'zod';

// Define the schema for our feature flags
export const featureFlagsSchema = z.object({
  useNewAdminSidebar: z.boolean().default(false),
  blockchainEnabled: z.boolean().default(false),
  lawyerMonetizationModel: z.enum(['SUBSCRIPTION', 'PAY_PER_USE', 'REVENUE_SHARE']).default('PAY_PER_USE'),
});

export type FeatureFlags = z.infer<typeof featureFlagsSchema>;

class FeatureFlagService {
  private flags: FeatureFlags;

  constructor() {
    // For now, we'll use a hardcoded configuration.
    // This can be replaced with a fetch from a remote service or PlatformSettings.
    const localConfig = {
      useNewAdminSidebar: true,
      blockchainEnabled: process.env.BLOCKCHAIN_ENABLED === 'true',
      lawyerMonetizationModel: (process.env.LAWYER_MONETIZATION_MODEL as any) || 'PAY_PER_USE',
    };

    try {
      this.flags = featureFlagsSchema.parse(localConfig);
    } catch (error) {
      console.error("Invalid feature flag configuration:", error);
      this.flags = featureFlagsSchema.parse({}); // Use defaults on error
    }
  }

  getFlags(): FeatureFlags {
    return this.flags;
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] ?? false;
  }
}

export const featureFlagService = new FeatureFlagService();
