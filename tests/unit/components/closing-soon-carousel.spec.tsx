/**
 * @fileoverview Testes unitários do ClosingSoonCarousel.
 * BDD: Garantir que a seção Super Oportunidades renderiza sem contador superior.
 * TDD: Validar renderização básica com dados mínimos.
 */

import { describe, it, beforeEach, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import ClosingSoonCarousel from '@/components/closing-soon-carousel';

vi.mock('embla-carousel-react', () => ({
  __esModule: true,
  default: () => [
    () => null,
    {
      scrollPrev: vi.fn(),
      scrollNext: vi.fn(),
      canScrollNext: () => false,
      scrollTo: vi.fn(),
    },
  ],
}));

vi.mock('@/components/BidExpertCard', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-bidexpert-card" />,
}));

describe('ClosingSoonCarousel', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
  });

  it('renderiza Super Oportunidades sem contador acima dos cards', async () => {
    await render(
      <ClosingSoonCarousel
        lots={[{ id: '1', auctionId: '1', status: 'ABERTO_PARA_LANCES' } as any]}
        auctions={[{ id: '1', status: 'ABERTO_PARA_LANCES' } as any]}
        platformSettings={{
          id: '1',
          tenantId: '1',
          marketingSiteAdsSuperOpportunitiesEnabled: true,
          marketingSiteAdsSuperOpportunitiesScrollIntervalSeconds: 6,
        } as any}
      />
    );

    const title = page.getByText('Super Oportunidades');
    await expect.element(title).toBeVisible();
    expect(document.body.textContent).not.toContain('Encerra em');
  });
});
