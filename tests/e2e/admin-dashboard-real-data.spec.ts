/**
 * @fileoverview Teste E2E do dashboard administrativo com dados reais.
 * BDD: Garantir presença dos acessos rápidos e dos KPIs ampliados no dashboard admin.
 * TDD: Validar renderização do resumo operacional com dados reais e sem aviso de demonstração.
 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://dev.localhost:9006';

test.describe('Dashboard Admin - Dados Reais', () => {
  test('exibe métricas reais sem alerta de demonstração e com atalhos operacionais', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });

    const dashboard = page.locator('[data-ai-id="admin-dashboard-page-container"]');
    await expect(dashboard).toBeVisible();

    const demoAlert = page.getByText('Esta é uma área de demonstração', { exact: false });
    await expect(demoAlert).toHaveCount(0);

    const statsGrid = page.locator('[data-ai-id="admin-dashboard-stats-grid"]');
    await expect(statsGrid).toBeVisible();
    await expect(statsGrid).toContainText(/\d|R\$/);
    await expect(statsGrid).toContainText('Taxa de sucesso');
    await expect(statsGrid).toContainText('Ticket médio');
    await expect(statsGrid).toContainText('Lotes por leilão');
    await expect(statsGrid).toContainText('Comitentes ativos');

    const quickLinksGrid = page.locator('[data-ai-id="admin-dashboard-quicklinks-grid"]');
    await expect(quickLinksGrid).toBeVisible();
    await expect(quickLinksGrid).toContainText('Novo leilão');
    await expect(quickLinksGrid).toContainText('Marketing');
    await expect(quickLinksGrid).toContainText('Processos');
  });
});
