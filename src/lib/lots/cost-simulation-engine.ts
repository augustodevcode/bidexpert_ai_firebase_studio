/**
 * @fileoverview Motor compartilhado de simulação de custos de aquisição.
 */

import { toMonetaryNumber } from '@/lib/format';

export type CostCategoryType = 'property' | 'vehicle' | 'electronics' | 'machinery' | 'livestock' | 'default';

export interface CostConfig {
  commissionRatePercent: number;
  itbiPercent?: number;
  registryFeePercent?: number;
  legalFeesFixed?: number;
  notaryFeesFixed?: number;
  documentationFeesFixed?: number;
  logisticsFeesFixed?: number;
  stateUf?: string | null;
  categoryName?: string | null;
}

export interface CostBreakdownItem {
  key: string;
  name: string;
  value: number;
  percentage?: number;
  isRequired: boolean;
  notes?: string;
}

export interface CostBreakdown {
  purchasePrice: number;
  commissionRatePercent: number;
  categoryType: CostCategoryType;
  items: CostBreakdownItem[];
  totalCosts: number;
  totalInvestment: number;
  costPercentage: number;
  disclaimer: string;
}

interface CostLineDefinition {
  key: string;
  name: string;
  isRequired: boolean;
  notes?: string;
  percentage?: number;
  fixed?: number;
  source?: 'commission' | 'itbi';
}

const DEFAULT_ITBI_PERCENT_BY_STATE: Record<string, number> = {
  SP: 3,
  RJ: 2,
  MG: 2.5,
  PR: 2.5,
  RS: 3,
};

const CATEGORY_COST_LINES: Record<CostCategoryType, CostLineDefinition[]> = {
  property: [
    {
      key: 'commission',
      name: 'Comissão do leiloeiro/plataforma',
      isRequired: true,
      notes: 'Usa a mesma comissão configurada no planejamento do lance.',
      source: 'commission',
    },
    {
      key: 'itbi',
      name: 'ITBI',
      isRequired: true,
      notes: 'Alíquota estimada conforme a UF.',
      source: 'itbi',
    },
    {
      key: 'registry',
      name: 'Registro em cartório',
      isRequired: true,
      notes: 'Estimativa média de emolumentos cartorários.',
      percentage: 1.5,
    },
    {
      key: 'documentation',
      name: 'Certidões e diligências',
      isRequired: true,
      notes: 'Custos com certidões, buscas e diligências documentais.',
      fixed: 800,
    },
    {
      key: 'notary',
      name: 'Escritura e autenticações',
      isRequired: false,
      notes: 'Valor de referência para escritura/autenticações.',
      fixed: 1500,
    },
    {
      key: 'legal',
      name: 'Assessoria jurídica',
      isRequired: false,
      notes: 'Reserva recomendada para análise jurídica especializada.',
      fixed: 3000,
    },
  ],
  vehicle: [
    {
      key: 'commission',
      name: 'Comissão do leiloeiro/plataforma',
      isRequired: true,
      notes: 'Usa a mesma comissão configurada no planejamento do lance.',
      source: 'commission',
    },
    {
      key: 'transfer',
      name: 'Transferência DETRAN',
      isRequired: true,
      notes: 'Taxa estimada de transferência veicular.',
      fixed: 262.57,
    },
    {
      key: 'ipva',
      name: 'IPVA / taxas pendentes',
      isRequired: true,
      notes: 'Reserva para regularização tributária e documental.',
      percentage: 4,
    },
    {
      key: 'logistics',
      name: 'Despachante e logística',
      isRequired: false,
      notes: 'Reserva para vistoria, transporte e despachante.',
      fixed: 600,
    },
  ],
  electronics: [
    {
      key: 'commission',
      name: 'Comissão do leiloeiro/plataforma',
      isRequired: true,
      notes: 'Usa a mesma comissão configurada no planejamento do lance.',
      source: 'commission',
    },
    {
      key: 'logistics',
      name: 'Frete e seguro',
      isRequired: false,
      notes: 'Reserva para envio e seguro do item.',
      fixed: 150,
    },
  ],
  machinery: [
    {
      key: 'commission',
      name: 'Comissão do leiloeiro/plataforma',
      isRequired: true,
      notes: 'Usa a mesma comissão configurada no planejamento do lance.',
      source: 'commission',
    },
    {
      key: 'inspection',
      name: 'Inspeção técnica',
      isRequired: false,
      notes: 'Laudo técnico e checagem mecânica.',
      fixed: 2500,
    },
    {
      key: 'logistics',
      name: 'Transporte especializado',
      isRequired: true,
      notes: 'Reserva para remoção, guincho e transporte.',
      percentage: 2,
    },
  ],
  livestock: [
    {
      key: 'commission',
      name: 'Comissão do leiloeiro/plataforma',
      isRequired: true,
      notes: 'Usa a mesma comissão configurada no planejamento do lance.',
      source: 'commission',
    },
    {
      key: 'health',
      name: 'Exames e documentação sanitária',
      isRequired: true,
      notes: 'Reserva para GTA, exames e documentos sanitários.',
      fixed: 500,
    },
    {
      key: 'logistics',
      name: 'Transporte animal',
      isRequired: true,
      notes: 'Reserva para transporte dos semoventes.',
      percentage: 1.5,
    },
  ],
  default: [
    {
      key: 'commission',
      name: 'Comissão do leiloeiro/plataforma',
      isRequired: true,
      notes: 'Usa a mesma comissão configurada no planejamento do lance.',
      source: 'commission',
    },
    {
      key: 'logistics',
      name: 'Custos acessórios estimados',
      isRequired: false,
      notes: 'Reserva genérica para logística e documentação.',
      fixed: 200,
    },
  ],
};

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function resolveCostCategoryType(categoryName?: string | null): CostCategoryType {
  const normalized = (categoryName || '').toLowerCase();

  if (
    normalized.includes('imóv') ||
    normalized.includes('imov') ||
    normalized.includes('casa') ||
    normalized.includes('apartamento') ||
    normalized.includes('terreno')
  ) {
    return 'property';
  }

  if (
    normalized.includes('veículo') ||
    normalized.includes('veiculo') ||
    normalized.includes('carro') ||
    normalized.includes('moto')
  ) {
    return 'vehicle';
  }

  if (
    normalized.includes('eletrônico') ||
    normalized.includes('eletronico') ||
    normalized.includes('celular') ||
    normalized.includes('notebook')
  ) {
    return 'electronics';
  }

  if (
    normalized.includes('máquina') ||
    normalized.includes('maquina') ||
    normalized.includes('equipamento') ||
    normalized.includes('trator')
  ) {
    return 'machinery';
  }

  if (
    normalized.includes('semovente') ||
    normalized.includes('gado') ||
    normalized.includes('cavalo') ||
    normalized.includes('bovino')
  ) {
    return 'livestock';
  }

  return 'default';
}

function resolveItbiPercent(config: Partial<CostConfig>): number {
  if (toMonetaryNumber(config.itbiPercent) > 0) {
    return toMonetaryNumber(config.itbiPercent);
  }

  const stateKey = (config.stateUf || '').toUpperCase();
  return DEFAULT_ITBI_PERCENT_BY_STATE[stateKey] ?? 3;
}

function buildCostItem(
  definition: CostLineDefinition,
  purchasePrice: number,
  config: Partial<CostConfig>,
): CostBreakdownItem {
  let percentage: number | undefined = definition.percentage;
  let value = definition.fixed ?? 0;

  if (definition.source === 'commission') {
    percentage = toMonetaryNumber(config.commissionRatePercent);
  }

  if (definition.source === 'itbi') {
    percentage = resolveItbiPercent(config);
  }

  if (definition.key === 'registry' && toMonetaryNumber(config.registryFeePercent) > 0) {
    percentage = toMonetaryNumber(config.registryFeePercent);
  }

  if (definition.key === 'legal' && toMonetaryNumber(config.legalFeesFixed) > 0) {
    value = toMonetaryNumber(config.legalFeesFixed);
  }

  if (definition.key === 'notary' && toMonetaryNumber(config.notaryFeesFixed) > 0) {
    value = toMonetaryNumber(config.notaryFeesFixed);
  }

  if (definition.key === 'documentation' && toMonetaryNumber(config.documentationFeesFixed) > 0) {
    value = toMonetaryNumber(config.documentationFeesFixed);
  }

  if (definition.key === 'logistics' && toMonetaryNumber(config.logisticsFeesFixed) > 0) {
    value = toMonetaryNumber(config.logisticsFeesFixed);
  }

  if (percentage && percentage > 0) {
    value = purchasePrice * (percentage / 100);
  }

  return {
    key: definition.key,
    name: definition.name,
    value: roundCurrency(value),
    percentage,
    isRequired: definition.isRequired,
    notes: definition.notes,
  };
}

export function buildCostSimulation(args: {
  purchasePrice: number;
  config?: Partial<CostConfig>;
}): CostBreakdown {
  const purchasePrice = toMonetaryNumber(args.purchasePrice);
  const config = args.config ?? {};
  const categoryType = resolveCostCategoryType(config.categoryName);
  const definitions = CATEGORY_COST_LINES[categoryType] ?? CATEGORY_COST_LINES.default;

  const items = definitions.map((definition) => buildCostItem(definition, purchasePrice, config));
  const totalCosts = roundCurrency(items.reduce((sum, item) => sum + item.value, 0));
  const totalInvestment = roundCurrency(purchasePrice + totalCosts);
  const costPercentage = purchasePrice > 0 ? roundCurrency((totalCosts / purchasePrice) * 100) : 0;

  return {
    purchasePrice,
    commissionRatePercent: toMonetaryNumber(config.commissionRatePercent),
    categoryType,
    items,
    totalCosts,
    totalInvestment,
    costPercentage,
    disclaimer:
      'Valores estimados para planejamento. Custos cartorários, tributos, retirada, transporte e honorários podem variar conforme edital, UF e condições do lote.',
  };
}