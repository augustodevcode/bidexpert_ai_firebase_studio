/**
 * @fileoverview Regressão do fluxo visual do wizard: garante que o grafo React Flow continue sendo montado.
 */

import { describe, expect, it } from 'vitest';

import { buildWizardFlowGraph } from '@/components/admin/wizard/wizard-flow-graph';
import type { WizardData } from '@/components/admin/wizard/wizard-context';

describe('buildWizardFlowGraph', () => {
  it('mantém a modalidade VENDA_DIRETA no grafo visual sem voltar ao placeholder', () => {
    const wizardData: WizardData = {
      auctionType: 'VENDA_DIRETA',
      auctionDetails: {
        title: 'Venda Direta teste visual',
        sellerId: '11' as never,
        auctioneerId: '22' as never,
      },
      createdLots: [],
      sessionAssetIds: [],
    };

    const { nodes, edges } = buildWizardFlowGraph(wizardData, 1);
    const vendaDiretaNode = nodes.find((node) => node.id === 'type-VENDA_DIRETA');

    expect(vendaDiretaNode).toBeDefined();
    expect(vendaDiretaNode?.data.status).toBe('done');
    expect(edges.some((edge) => edge.source === 'start' && edge.target === 'type-VENDA_DIRETA')).toBe(true);
    expect(nodes.some((node) => node.id === 'review')).toBe(true);
    expect(nodes.every((node) => node.data.title !== 'Visualização do Fluxo Indisponível')).toBe(true);
  });
});
