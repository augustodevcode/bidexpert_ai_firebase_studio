/**
 * @fileoverview Teste de regressão visual do painel de auditoria.
 * BDD: Garantir consistência visual do grid de indicadores.
 * TDD: Capturar screenshot de referência do resumo da auditoria.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { AuditDashboardView } from '../../src/app/admin/reports/audit/audit-view';
import type { AuditData } from '../../src/app/admin/reports/audit/audit-utils';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/components/ui/accordion', () => ({
  __esModule: true,
  Accordion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AccordionTrigger: ({ children, ...props }: { children: React.ReactNode }) => (
    <button type="button" {...props}>{children}</button>
  ),
  AccordionContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const auditData: AuditData = {
  auctionsWithoutLots: [{ id: BigInt(1), title: 'Leilão A', status: 'ABERTO', publicId: 'AUC-1' } as any],
  lotsWithoutAssets: [{ id: BigInt(2), title: 'Lote B', status: 'EM_BREVE', publicId: 'LOT-2' } as any],
  auctionsWithoutStages: [],
  closedAuctionsWithOpenLots: [],
  canceledAuctionsWithOpenLots: [],
  auctionsWithoutLocation: [],
  lotsWithoutLocation: [],
  assetsWithoutLocation: [],
  assetsWithoutRequiredLinks: [],
  endedLotsWithoutBids: [],
  directSalesWithMissingData: [],
  directSalesWithoutImages: [],
  directSalesWithoutLocation: [],
  lotsWithoutQuestions: [],
  lotsWithoutReviews: [],
  habilitatedUsersWithoutDocs: [],
  lotsWithoutImages: [],
  assetsWithoutImages: [],
  judicialAuctionsWithoutProcess: [],
  judicialAuctionsWithProcessMismatch: [],
  judicialSellersWithoutBranch: [],
  auctionsMissingResponsibleParties: [],
  auctionsMissingSchedule: [],
  lotsSoldWithoutWinner: [],
  assetsLoteadoWithoutLots: [],
  assetsDisponivelWithLots: [],
};

describe('Audit Dashboard Visual', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
  });

  it('captura o grid de indicadores', async () => {
    await render(
      <AuditDashboardView
        auditData={auditData}
        isLoading={false}
        onRefresh={() => undefined}
      />
    );

    const cardTitle = page.getByText('Leilões sem Lotes', { exact: true });
    await expect.element(cardTitle).toBeVisible();
    await expect(cardTitle).toMatchScreenshot('audit-stat-card-title');
  });
});
