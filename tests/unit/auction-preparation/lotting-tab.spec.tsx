/**
 * @fileoverview Valida a aba de loteamento com seleção apenas de bens elegíveis
 * e geração correta do link de criação de lote com contexto de retorno.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LottingTab } from '@/components/admin/auction-preparation/tabs/lotting-tab';
import type { AuctionPreparationAssetSummary } from '@/types';

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string | { pathname: string; query?: Record<string, string> };
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
    title: 'Bem padrão',
    source: 'PROCESS',
    categoryName: 'Categoria Padrão',
    status: 'DISPONIVEL',
    evaluationValue: 100000,
    lottingReadiness: 'READY',
    lottingIssues: [],
    locationLabel: 'São Paulo/SP',
    judicialProcessNumber: '0001234-56.2026.8.26.0001',
    ...overrides,
  };
}

describe('LottingTab', () => {
  it('gera link de criar lote com auctionId, assetIds elegíveis e returnTo da central', async () => {
    const user = userEvent.setup();

    const auction = {
      id: 'auction-1',
      publicId: 'AUC-0001',
    };

    const assets: AuctionPreparationAssetSummary[] = [
      buildAsset({ id: 'asset-ready-1', title: 'Bem Elegível 1', lottingReadiness: 'READY' }),
      buildAsset({
        id: 'asset-pending-1',
        title: 'Bem Pendente',
        lottingReadiness: 'PENDING',
        lottingIssues: ['Bem já vinculado em lote ativo.'],
        blockingLotLabel: 'LOTE-0099',
      }),
    ];

    render(<LottingTab auction={auction} availableAssets={assets} />);

    const eligibleCheckbox = screen.getByLabelText('Selecionar Bem Elegível 1');
    await user.click(eligibleCheckbox);

    const createLink = screen.getByRole('link', { name: /criar lote \(1\)/i });
    expect(createLink).toHaveAttribute(
      'href',
      '/admin/lots/new?auctionId=auction-1&assetIds=asset-ready-1&returnTo=%2Fadmin%2Fauctions%2FAUC-0001%2Fauction-control-center%3Ftab%3Dlotting',
    );
  });

  it('não permite selecionar bem pendente e mantém contador apenas com itens prontos', async () => {
    const user = userEvent.setup();

    const auction = {
      id: 'auction-2',
      publicId: 'AUC-0002',
    };

    const assets: AuctionPreparationAssetSummary[] = [
      buildAsset({ id: 'asset-ready-2', title: 'Bem Elegível 2', lottingReadiness: 'READY' }),
      buildAsset({
        id: 'asset-pending-2',
        title: 'Bem Bloqueado',
        lottingReadiness: 'PENDING',
        lottingIssues: ['Já está em lote ativo.'],
      }),
    ];

    render(<LottingTab auction={auction} availableAssets={assets} />);

    const pendingCheckbox = screen.getByLabelText('Selecionar Bem Bloqueado');
    expect(pendingCheckbox).toBeDisabled();

    const selectAllEligible = screen.getByLabelText('Selecionar todos os bens elegíveis');
    await user.click(selectAllEligible);

    expect(screen.getByRole('link', { name: /criar lote \(1\)/i })).toBeInTheDocument();
  });
});
