/**
 * @fileoverview Cobre o motor compartilhado de simulação CET/TCO do detalhe do lote.
 */

import { describe, expect, it } from 'vitest';

import { buildCostSimulation, resolveCostCategoryType } from '../../src/lib/lots/cost-simulation-engine';

describe('cost-simulation-engine', () => {
  it('classifies property categories and applies state aware costs', () => {
    expect(resolveCostCategoryType('Imóveis Judiciais')).toBe('property');

    const simulation = buildCostSimulation({
      purchasePrice: 100000,
      config: {
        categoryName: 'Imóveis Judiciais',
        stateUf: 'SP',
        commissionRatePercent: 5,
        documentationFeesFixed: 900,
        notaryFeesFixed: 1200,
        legalFeesFixed: 2500,
      },
    });

    expect(simulation.categoryType).toBe('property');
    expect(simulation.commissionRatePercent).toBe(5);
    expect(simulation.items.map((item) => item.key)).toEqual([
      'commission',
      'itbi',
      'registry',
      'documentation',
      'notary',
      'legal',
    ]);
    expect(simulation.totalCosts).toBe(14100);
    expect(simulation.totalInvestment).toBe(114100);
    expect(simulation.costPercentage).toBe(14.1);
  });

  it('falls back to default category when the label is unknown', () => {
    const simulation = buildCostSimulation({
      purchasePrice: 1000,
      config: {
        categoryName: 'Colecionáveis',
        commissionRatePercent: 6,
      },
    });

    expect(simulation.categoryType).toBe('default');
    expect(simulation.totalCosts).toBe(260);
    expect(simulation.totalInvestment).toBe(1260);
  });
});