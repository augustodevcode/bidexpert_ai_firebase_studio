/**
 * @fileoverview Teste visual do componente PublicSectionAdminTooltip.
 *
 * BDD: Validar que o tooltip administrativo aparece apenas para usuários com permissão
 * e exibe a regra de negócio correta ao hover.
 *
 * TDD: Renderizar isoladamente com vitest-browser-react, mockando auth context.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { TooltipProvider } from '../../src/components/ui/tooltip';

// --- Mock do auth context ---
const mockUseAuth = vi.fn();
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import AFTER mock registration
const { default: PublicSectionAdminTooltip } = await import(
  '../../src/components/admin/public-section-admin-tooltip'
);

// Helper to build a fake user profile
function fakeUser(permissions: string[]) {
  return {
    id: '1',
    email: 'admin@bidexpert.com.br',
    name: 'Admin',
    permissions,
    tenants: [{ id: '1', name: 'Demo' }],
  };
}

describe('PublicSectionAdminTooltip - Visual', () => {
  beforeEach(async () => {
    await page.viewport(1280, 720);
    vi.clearAllMocks();
  });

  it('mostra tooltip ao hover para admin (manage_all)', async () => {
    mockUseAuth.mockReturnValue({
      userProfileWithPermissions: fakeUser(['manage_all']),
      activeTenantId: '1',
      loading: false,
      unreadNotificationsCount: 0,
      setUserProfileWithPermissions: vi.fn(),
      setActiveTenantId: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
      loginUser: vi.fn(),
    });

    await render(
      <TooltipProvider delayDuration={0}>
        <div data-testid="tooltip-visual-admin" className="p-12 bg-background">
          <PublicSectionAdminTooltip
            sectionId="super-oportunidades"
            description="Lotes com encerramento em até 7 dias, status ABERTO_PARA_LANCES e cadeia referencial completa."
          >
            <h2 data-testid="section-title" className="text-2xl font-bold cursor-pointer">
              Super Oportunidades
            </h2>
          </PublicSectionAdminTooltip>
        </div>
      </TooltipProvider>,
    );

    // Verifica que o título está visível
    const title = page.getByTestId('section-title');
    await expect.element(title).toBeVisible();
    await expect.element(title).toHaveTextContent('Super Oportunidades');

    // Screenshot antes do hover (tooltip oculto)
    const container = page.getByTestId('tooltip-visual-admin');
    await expect(container).toMatchScreenshot('tooltip-admin-before-hover.png');

    // Hover para exibir tooltip
    await userEvent.hover(title);
    await new Promise((r) => setTimeout(r, 300));

    // Use role-scoped locator to avoid strict mode violation (tooltip duplicates text)
    const tooltipContent = page.getByRole('tooltip').getByRole('paragraph');
    await expect.element(tooltipContent).toBeVisible();

    // Screenshot com tooltip visível
    await expect(container).toMatchScreenshot('tooltip-admin-after-hover.png');
  });

  it('NÃO mostra tooltip para usuário sem permissão', async () => {
    mockUseAuth.mockReturnValue({
      userProfileWithPermissions: fakeUser([]),
      activeTenantId: '1',
      loading: false,
      unreadNotificationsCount: 0,
      setUserProfileWithPermissions: vi.fn(),
      setActiveTenantId: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
      loginUser: vi.fn(),
    });

    await render(
      <TooltipProvider delayDuration={0}>
        <div data-testid="tooltip-visual-noperm" className="p-12 bg-background">
          <PublicSectionAdminTooltip
            sectionId="lotes-leilao"
            description="Todos os lotes vinculados a este leilão com praça ativa."
          >
            <h2 data-testid="section-title-noperm" className="text-2xl font-bold">
              Lotes do Leilão
            </h2>
          </PublicSectionAdminTooltip>
        </div>
      </TooltipProvider>,
    );

    // Título deve estar visível
    const title = page.getByTestId('section-title-noperm');
    await expect.element(title).toBeVisible();

    // Hover NÃO deve revelar tooltip
    await userEvent.hover(title);
    await new Promise((r) => setTimeout(r, 300));

    // Tooltip text should NOT be in the DOM
    const tooltipText = page.getByText('Todos os lotes vinculados a este leilão');
    await expect.element(tooltipText).not.toBeInTheDocument();

    // Screenshot sem tooltip (prova visual)
    const container = page.getByTestId('tooltip-visual-noperm');
    await expect(container).toMatchScreenshot('tooltip-noperm-no-tooltip.png');
  });

  it('mostra tooltip com permissão auctions:update', async () => {
    mockUseAuth.mockReturnValue({
      userProfileWithPermissions: fakeUser(['auctions:update']),
      activeTenantId: '1',
      loading: false,
      unreadNotificationsCount: 0,
      setUserProfileWithPermissions: vi.fn(),
      setActiveTenantId: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
      loginUser: vi.fn(),
    });

    await render(
      <TooltipProvider delayDuration={0}>
        <div data-testid="tooltip-visual-partial" className="p-12 bg-background">
          <PublicSectionAdminTooltip
            sectionId="leiloes-recentes"
            description="Leilões do leiloeiro ordenados por data de criação, limite de 6 itens."
          >
            <h2 data-testid="section-title-partial" className="text-2xl font-bold cursor-pointer">
              Leilões Recentes
            </h2>
          </PublicSectionAdminTooltip>
        </div>
      </TooltipProvider>,
    );

    const title = page.getByTestId('section-title-partial');
    await expect.element(title).toBeVisible();

    await userEvent.hover(title);
    await new Promise((r) => setTimeout(r, 300));

    // Use role-scoped locator to avoid strict mode violation (tooltip duplicates text)
    const tooltipContent = page.getByRole('tooltip').getByRole('paragraph');
    await expect.element(tooltipContent).toBeVisible();

    const container = page.getByTestId('tooltip-visual-partial');
    await expect(container).toMatchScreenshot('tooltip-partial-perm-hover.png');
  });
});
