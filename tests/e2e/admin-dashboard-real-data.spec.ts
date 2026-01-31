/**
 * @fileoverview Teste E2E do dashboard administrativo com dados reais.
 * BDD: Garantir ausência de aviso de demonstração e presença de métricas do banco.
 * TDD: Validar renderização do grid de KPIs no dashboard admin.
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://demo.servidor:9007';
const ADMIN_EMAIL = 'admin@bidexpert.com.br';
const ADMIN_PASSWORD = 'Admin@123';

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.fill('[data-ai-id="auth-login-email-input"]', ADMIN_EMAIL);
  await page.fill('[data-ai-id="auth-login-password-input"]', ADMIN_PASSWORD);
  await page.click('[data-ai-id="auth-login-submit-button"]');
  await page.waitForLoadState('networkidle');
}

test.describe('Dashboard Admin - Dados Reais', () => {
  test('exibe métricas reais sem alerta de demonstração', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' });

    const dashboard = page.locator('[data-ai-id="admin-dashboard-page-container"]');
    await expect(dashboard).toBeVisible();

    const demoAlert = page.getByText('Esta é uma área de demonstração', { exact: false });
    await expect(demoAlert).toHaveCount(0);

    const statsGrid = page.locator('[data-ai-id="admin-dashboard-stats-grid"]');
    await expect(statsGrid).toBeVisible();
    await expect(statsGrid).toContainText(/\d|R\$/);
  });
});
