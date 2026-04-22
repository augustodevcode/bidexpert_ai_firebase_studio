/**
 * @fileoverview Teste visual da aba de loteamento com foco em elegibilidade de seleção.
 * BDD: Given bens ready/pending, When seleciono elegíveis, Then o CTA reflete apenas elegíveis.
 * TDD: Garantir renderização estável dos KPIs, tabela e estado do CTA.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { LottingTab } from '../../src/components/admin/auction-preparation/tabs/lotting-tab';
import type { AuctionPreparationAssetSummary } from '../../src/types';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string | { pathname: string; query?: Record<string, string> };
    children: React.ReactNode;
  }) => {
    const resolvedHref =
      typeof href === 'string'
        ? href
        : `${href.pathname}${href.query ? `?${new URLSearchParams(href.query).toString()}` : ''}`;

    return <a href={resolvedHref}>{children}</a>;
  },
}));

function buildAsset(overrides: Partial<AuctionPreparationAssetSummary>): AuctionPreparationAssetSummary {
  return {
    id: 'asset-default',
    title: 'Bem Padrão',
    source: 'PROCESS',
    categoryName: 'Imóvel',
    status: 'DISPONIVEL',
    evaluationValue: 125000,
    lottingReadiness: 'READY',
    lottingIssues: [],
    locationLabel: 'São Paulo/SP',
    judicialProcessNumber: '0001234-56.2026.8.26.0001',
    ...overrides,
  };
}

describe('Lotting Tab - Visual', () => {
  beforeEach(async () => {
    await page.viewport(1366, 768);
  });

  it('renderiza o estado de elegibilidade e atualiza o CTA ao selecionar bens prontos', async () => {
    const auction = { id: 'auction-visual-1', publicId: 'AUC-VIS-1' };
    const assets: AuctionPreparationAssetSummary[] = [
      buildAsset({ id: 'asset-ready-a', title: 'Apartamento Centro', lottingReadiness: 'READY' }),
      buildAsset({
        id: 'asset-pending-a',
        title: 'Galpão Industrial',
        lottingReadiness: 'PENDING',
        lottingIssues: ['Bem já vinculado em lote ativo.'],
        blockingLotLabel: 'LOTE-0042',
      }),
    ];

    await render(
      <div className="p-6 bg-background" data-testid="lotting-tab-visual-wrapper">
        <LottingTab auction={auction} availableAssets={assets} />
      </div>
    );

    await expect.element(page.getByText('Loteamento de Bens')).toBeVisible();
    await expect.element(page.getByText('Com pendências')).toBeVisible();
    await expect.element(page.getByLabelText('Selecionar Galpão Industrial')).toBeDisabled();

    await page.getByLabelText('Selecionar Apartamento Centro').click();
    await expect.element(page.getByRole('link', { name: /Criar Lote \(1\)/ })).toBeVisible();

    await expect(page.getByTestId('lotting-tab-visual-wrapper')).toMatchScreenshot(
      'auction-lotting-readiness.visual.png'
    );
  });
});
