/**
 * @fileoverview Teste UI E2E do painel de auditoria usando Vitest Browser.
 * BDD: Garantir interação com accordions e ações de atualização.
 * TDD: Validar renderização e interação básica da UI.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
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

const baseAuditData: AuditData = {
  auctionsWithoutLots: [{ id: BigInt(1), title: 'Leilão sem lotes', status: 'ABERTO', publicId: 'AUC-1' } as any],
  lotsWithoutAssets: [],
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

describe('Audit Dashboard UI', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
  });

  it('permite acionar atualização e exibe cabeçalho', async () => {
    await render(
      <AuditDashboardView
        auditData={baseAuditData}
        isLoading={false}
        onRefresh={() => undefined}
      />
    );

    const header = page.getByText('Painel de Auditoria de Dados');
    await expect.element(header).toBeVisible();

    const refreshButton = page.getByText(/Atualizar Dados/i);
    await expect.element(refreshButton).toBeVisible();
    await userEvent.click(refreshButton);
  });
});
