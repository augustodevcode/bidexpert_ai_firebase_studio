// (C) BLOCKCHAIN TOGGLE + LAWYER MONETIZATION MODELS (#5/#27)
import { z } from 'zod';

export const LawyerMonetizationModel = z.enum([
  'SUBSCRIPTION',      // Taxa mensal fixa
  'PAY_PER_USE',       // Cobrança por consulta/documento gerado
  'REVENUE_SHARE',     // Percentual sobre transações que advogado intermediou
]);

export type LawyerMonetizationModel = z.infer<typeof LawyerMonetizationModel>;

export interface FeatureFlags {
  // Realtime & Blockchain
  blockchainEnabled: boolean;
  blockchainNetwork: 'HYPERLEDGER' | 'ETHEREUM' | 'NONE';
  softCloseEnabled: boolean;
  softCloseMinutes: number;

  // Lawyer Portal
  lawyerPortalEnabled: boolean;
  lawyerMonetizationModel: LawyerMonetizationModel;
  lawyerSubscriptionPrice?: number; // Para SUBSCRIPTION
  lawyerPerUsePrice?: number; // Para PAY_PER_USE (em centavos)
  lawyerRevenueSharePercent?: number; // Para REVENUE_SHARE (0-100)

  // Integrations
  fipeIntegrationEnabled: boolean;
  cartorioIntegrationEnabled: boolean;
  tribunalIntegrationEnabled: boolean;

  // PWA & Mobile
  pwaEnabled: boolean;
  offlineFirstEnabled: boolean;

  // Admin toggles
  maintenanceMode: boolean;
  debugLogsEnabled: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  blockchainEnabled: false,
  blockchainNetwork: 'NONE',
  softCloseEnabled: true,
  softCloseMinutes: 5,
  lawyerPortalEnabled: true,
  lawyerMonetizationModel: 'SUBSCRIPTION',
  lawyerSubscriptionPrice: 29900, // R$ 299,00 em centavos
  fipeIntegrationEnabled: false,
  cartorioIntegrationEnabled: false,
  tribunalIntegrationEnabled: false,
  pwaEnabled: true,
  offlineFirstEnabled: false,
  maintenanceMode: false,
  debugLogsEnabled: false,
};

// Configuração de Smart Contracts (se blockchain ativado)
export interface BlockchainConfig {
  enabled: boolean;
  network: 'HYPERLEDGER' | 'ETHEREUM';
  nodeUrl?: string;
  contractAddress?: string;
  privateKey?: string; // Encrypted in env
  gasLimit?: number;
  recordBids: boolean; // Gravar cada lance na blockchain
  recordTransactions: boolean; // Gravar transações finais
  recordDocuments: boolean; // Hash de documentos
}

export const defaultBlockchainConfig: BlockchainConfig = {
  enabled: false,
  network: 'HYPERLEDGER',
  recordBids: false,
  recordTransactions: false,
  recordDocuments: false,
};

// Validação de configs antes de salvar
export function validateFeatureFlags(flags: Partial<FeatureFlags>): FeatureFlags {
  // Se blockchain desabilitado, certifique de que não há configs órfãs
  if (!flags.blockchainEnabled) {
    flags.blockchainNetwork = 'NONE';
  }

  // Se lawyer portal desabilitado, reset de monetization
  if (!flags.lawyerPortalEnabled) {
    flags.lawyerMonetizationModel = 'SUBSCRIPTION';
    flags.lawyerSubscriptionPrice = undefined;
    flags.lawyerPerUsePrice = undefined;
    flags.lawyerRevenueSharePercent = undefined;
  }

  // Validar modelo de monetização tem preço configurado
  if (flags.lawyerPortalEnabled) {
    switch (flags.lawyerMonetizationModel) {
      case 'SUBSCRIPTION':
        if (!flags.lawyerSubscriptionPrice || flags.lawyerSubscriptionPrice < 0) {
          throw new Error('SUBSCRIPTION model requires lawyerSubscriptionPrice >= 0');
        }
        break;
      case 'PAY_PER_USE':
        if (!flags.lawyerPerUsePrice || flags.lawyerPerUsePrice < 0) {
          throw new Error('PAY_PER_USE model requires lawyerPerUsePrice >= 0');
        }
        break;
      case 'REVENUE_SHARE':
        if (!flags.lawyerRevenueSharePercent || flags.lawyerRevenueSharePercent < 0 || flags.lawyerRevenueSharePercent > 100) {
          throw new Error('REVENUE_SHARE model requires lawyerRevenueSharePercent between 0-100');
        }
        break;
    }
  }

  return {
    ...defaultFeatureFlags,
    ...flags,
  };
}

// Context para feature flags (usado em Server Components)
export async function getFeatureFlags(tenantId: string): Promise<FeatureFlags> {
  // TODO: Carregar do banco de dados (PlatformSettings)
  // Por enquanto, retorna defaults
  return defaultFeatureFlags;
}

export async function updateFeatureFlags(tenantId: string, flags: Partial<FeatureFlags>): Promise<FeatureFlags> {
  // Validar antes de salvar
  const validated = validateFeatureFlags(flags);

  // TODO: Salvar em PlatformSettings via Prisma
  // Implementar aqui quando Prisma estiver funcional

  return validated;
}
