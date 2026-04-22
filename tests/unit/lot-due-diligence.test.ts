/**
 * @fileoverview Cobre as regras derivadas do painel de due diligence do lote.
 */

import { describe, expect, it } from 'vitest';

import { buildLotDueDiligenceSummary, sortLotRisksBySeverity } from '../../src/lib/lots/due-diligence';

describe('lot-due-diligence', () => {
  it('orders risks from critical to low severity', () => {
    const risks = sortLotRisksBySeverity([
      { id: 'risk-medium', riskLevel: 'MEDIO' },
      { id: 'risk-critical', riskLevel: 'CRITICO' },
      { id: 'risk-low', riskLevel: 'BAIXO' },
    ] as any);

    expect(risks.map((risk) => risk.id)).toEqual(['risk-critical', 'risk-medium', 'risk-low']);
  });

  it('builds a critical checklist summary when occupancy, debts and risks are present', () => {
    const summary = buildLotDueDiligenceSummary({
      lot: {
        propertyMatricula: '12.345',
        occupancyStatus: 'OCCUPIED' as any,
        judicialProcessNumber: '0001234-56.2026.8.26.0001',
        publicProcessUrl: 'https://tribunal.exemplo/processo/123',
        propertyLiens: 'Hipoteca em favor do banco exequente.',
        knownDebts: 'Débitos condominiais até março/2026.',
        additionalDocumentsInfo: 'Laudo e certidões disponíveis no edital.',
        lotRisks: [
          { id: 'risk-medium', riskLevel: 'MEDIO' },
          { id: 'risk-critical', riskLevel: 'CRITICO' },
        ] as any,
      },
      auction: {
        auctionType: 'JUDICIAL' as any,
        documentsUrl: 'https://bidexpert.com.br/edital.pdf',
      },
    });

    expect(summary.alert.tone).toBe('critical');
    expect(summary.sortedRisks[0]?.riskLevel).toBe('CRITICO');
    expect(summary.links.map((link) => link.key)).toEqual(['public-process', 'auction-notice']);
    expect(summary.checklist.find((item) => item.key === 'registry')?.status).toBe('available');
    expect(summary.checklist.find((item) => item.key === 'occupancy')?.status).toBe('attention');
    expect(summary.checklist.find((item) => item.key === 'edital')?.status).toBe('available');
  });

  it('uses normalized auction documents when legacy URLs are not available', () => {
    const summary = buildLotDueDiligenceSummary({
      lot: {
        occupancyStatus: 'UNOCCUPIED' as any,
      },
      auction: {
        auctionType: 'EXTRAJUDICIAL' as any,
        documents: [
          {
            id: 'doc-1',
            auctionId: 'auction-1',
            tenantId: 'tenant-1',
            fileName: 'edital.pdf',
            title: 'Edital oficial',
            description: null,
            fileUrl: 'https://cdn.bidexpert.com.br/docs/edital.pdf',
            fileSize: 1024n,
            mimeType: 'application/pdf',
            displayOrder: 0,
            isPublic: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ] as any,
      },
    });

    expect(summary.checklist.find((item) => item.key === 'edital')?.status).toBe('available');
    expect(summary.links.some((link) => link.key === 'auction-notice')).toBe(true);
    expect(summary.links.find((link) => link.key === 'auction-notice')?.href).toBe('https://cdn.bidexpert.com.br/docs/edital.pdf');
  });
});