/**
 * @fileoverview Teste visual da página de leilões admin com dados mockados.
 * BDD: Renderizar a página com lista de leilões carregada.
 * TDD: Garantir layout estável para captura visual no browser.
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import AdminAuctionsPage from '../../src/app/admin/auctions/page';

const mockAuctions = [
  {
    id: '1',
    publicId: 'AUC-DEMO',
    title: 'Leilão Demo',
    status: 'ABERTO',
    auctionDate: new Date().toISOString(),
    sellerName: 'Comitente Demo',
    auctioneerName: 'Leiloeiro Demo',
  },
] as any[];

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../src/app/admin/auctions/actions', () => ({
  getAuctions: vi.fn().mockResolvedValue(mockAuctions),
  deleteAuction: vi.fn().mockResolvedValue({ success: true, message: 'ok' }),
}));

vi.mock('@/app/admin/settings/actions', () => ({
  getPlatformSettings: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/components/BidExpertSearchResultsFrame', () => ({
  __esModule: true,
  default: ({ items }: { items: any[] }) => (
    <div data-testid="mock-search-results-frame">{items?.length ?? 0}</div>
  ),
}));

vi.mock('../../src/app/admin/auctions/columns', () => ({
  createColumns: () => [],
}));

describe('Admin Auctions Page - Visual', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
  });

  it('renderiza a página com leilões carregados', async () => {
    await render(
      <div className="p-6 bg-background" data-testid="admin-auctions-visual">
        <AdminAuctionsPage />
      </div>
    );

    await expect.element(page.getByText('Gerenciar Leilões')).toBeVisible();
    await expect.element(page.getByTestId('mock-search-results-frame')).toBeVisible();
    await expect(page.getByTestId('admin-auctions-visual')).toMatchScreenshot('admin-auctions-page.png');
  });
});
