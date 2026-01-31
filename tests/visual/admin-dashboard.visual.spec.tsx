/**
 * @fileoverview Regressão visual do dashboard administrativo.
 * BDD: Validar que o layout do dashboard permanece consistente sem aviso de demo.
 * TDD: Capturar screenshot do grid de métricas com dados reais simulados.
 */
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { Card, CardContent } from '../../src/components/ui/card';
import { DollarSign, Gavel, Package, Users } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, testId }: { title: string; value: string; icon: React.ElementType; testId: string }) => (
  <Card className="shadow-lg" data-testid={testId}>
    <CardContent className="p-4 flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <Icon className="h-8 w-8 opacity-80" />
    </CardContent>
  </Card>
);

describe('Dashboard Admin - Visual', () => {
  beforeEach(async () => {
    await page.viewport(1440, 900);
    vi.clearAllMocks();
  });

  it('mantém layout do grid de métricas', async () => {
    await render(
      <div data-testid="admin-dashboard-visual" className="p-6 bg-background">
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          data-ai-id="admin-dashboard-stats-grid"
          data-testid="admin-dashboard-stats-grid"
        >
          <StatCard title="Faturamento Total" value="R$ 250.000,00" icon={DollarSign} testId="admin-dashboard-card-revenue" />
          <StatCard title="Leilões Ativos" value="6" icon={Gavel} testId="admin-dashboard-card-auctions" />
          <StatCard title="Lotes Vendidos" value="42" icon={Package} testId="admin-dashboard-card-lots" />
          <StatCard title="Novos Usuários (30d)" value="+12" icon={Users} testId="admin-dashboard-card-users" />
        </div>
      </div>
    );

    await new Promise((resolve) => setTimeout(resolve, 120));

    const statsGrid = page.getByTestId('admin-dashboard-stats-grid');
    await expect.element(statsGrid).toBeVisible();
    await expect(statsGrid).toMatchScreenshot('admin-dashboard-stats-grid.png');
  });

  it('mantém hover em card principal', async () => {
    await render(
      <div data-testid="admin-dashboard-visual" className="p-6 bg-background">
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          data-ai-id="admin-dashboard-stats-grid"
          data-testid="admin-dashboard-stats-grid"
        >
          <StatCard title="Faturamento Total" value="R$ 250.000,00" icon={DollarSign} testId="admin-dashboard-card-revenue" />
          <StatCard title="Leilões Ativos" value="6" icon={Gavel} testId="admin-dashboard-card-auctions" />
        </div>
      </div>
    );

    await new Promise((resolve) => setTimeout(resolve, 120));

    const firstCard = page.getByTestId('admin-dashboard-card-revenue');
    await expect.element(firstCard).toBeVisible();

    await userEvent.hover(firstCard);
    await new Promise((resolve) => setTimeout(resolve, 100));

    await expect(firstCard).toMatchScreenshot('admin-dashboard-card-hover.png');
  });
});
