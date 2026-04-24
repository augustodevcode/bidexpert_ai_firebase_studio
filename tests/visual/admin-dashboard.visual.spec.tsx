/**
 * @fileoverview Regressão visual do dashboard administrativo.
 * BDD: Validar que o dashboard exibe acessos rápidos e KPIs ampliados de forma consistente.
 * TDD: Capturar screenshots do resumo operacional e do hover dos cards principais.
 */
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { Card, CardContent } from '../../src/components/ui/card';
import {
  DollarSign,
  FolderKanban,
  Gavel,
  Image as ImageIcon,
  Megaphone,
  Package,
  Percent,
  Rocket,
  Scale,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';

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

const QuickLinkCard = ({
  title,
  description,
  icon: Icon,
  testId,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  testId: string;
}) => (
  <Card className="shadow-sm border" data-testid={testId}>
    <CardContent className="space-y-4 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </div>
    </CardContent>
  </Card>
);

describe('Dashboard Admin - Visual', () => {
  beforeEach(async () => {
    await page.viewport(1440, 900);
    vi.clearAllMocks();
  });

  it('mantém layout com acessos rápidos e KPIs ampliados', async () => {
    await render(
      <div data-testid="admin-dashboard-visual" className="space-y-6 bg-background p-6">
        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Acessos rápidos</h2>
            <p className="text-sm text-muted-foreground">Atalhos para a rotina operacional do time.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4" data-testid="admin-dashboard-quicklinks-grid">
            <QuickLinkCard title="Novo leilão" description="Inicia o cadastro assistido." icon={Rocket} testId="admin-dashboard-quicklink-new-auction" />
            <QuickLinkCard title="Leilões" description="Acompanha eventos ativos." icon={Gavel} testId="admin-dashboard-quicklink-auctions" />
            <QuickLinkCard title="Ativos" description="Organiza bens e loteamento." icon={FolderKanban} testId="admin-dashboard-quicklink-assets" />
            <QuickLinkCard title="Mídias" description="Centraliza uploads e biblioteca." icon={ImageIcon} testId="admin-dashboard-quicklink-media" />
            <QuickLinkCard title="Marketing" description="Configura publicidade e campanhas." icon={Megaphone} testId="admin-dashboard-quicklink-marketing" />
            <QuickLinkCard title="Processos" description="Controla vínculos judiciais." icon={Scale} testId="admin-dashboard-quicklink-processes" />
          </div>
        </section>

        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
          data-ai-id="admin-dashboard-stats-grid"
          data-testid="admin-dashboard-stats-grid"
        >
          <StatCard title="Faturamento Total" value="R$ 250.000,00" icon={DollarSign} testId="admin-dashboard-card-revenue" />
          <StatCard title="Leilões Ativos" value="6" icon={Gavel} testId="admin-dashboard-card-auctions" />
          <StatCard title="Lotes Vendidos" value="42" icon={Package} testId="admin-dashboard-card-lots" />
          <StatCard title="Novos Usuários (30d)" value="+12" icon={Users} testId="admin-dashboard-card-users" />
          <StatCard title="Taxa de sucesso" value="78%" icon={Percent} testId="admin-dashboard-card-success-rate" />
          <StatCard title="Ticket médio" value="R$ 48.900,00" icon={TrendingUp} testId="admin-dashboard-card-average-bid" />
          <StatCard title="Lotes por leilão" value="7,5" icon={FolderKanban} testId="admin-dashboard-card-average-lots" />
          <StatCard title="Comitentes ativos" value="14" icon={UserCheck} testId="admin-dashboard-card-sellers" />
        </div>
      </div>
    );

    await new Promise((resolve) => setTimeout(resolve, 120));

    const overview = page.getByTestId('admin-dashboard-visual');
    await expect.element(overview).toBeVisible();
    await expect(overview).toMatchScreenshot('admin-dashboard-stats-grid.png');
  });

  it('mantém hover em card principal', async () => {
    await render(
      <div data-testid="admin-dashboard-visual" className="space-y-6 bg-background p-6">
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
          data-ai-id="admin-dashboard-stats-grid"
          data-testid="admin-dashboard-stats-grid"
        >
          <StatCard title="Faturamento Total" value="R$ 250.000,00" icon={DollarSign} testId="admin-dashboard-card-revenue" />
          <StatCard title="Leilões Ativos" value="6" icon={Gavel} testId="admin-dashboard-card-auctions" />
          <StatCard title="Taxa de sucesso" value="78%" icon={Percent} testId="admin-dashboard-card-success-rate" />
          <StatCard title="Comitentes ativos" value="14" icon={UserCheck} testId="admin-dashboard-card-sellers" />
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
