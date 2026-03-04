/**
 * @fileoverview Teste E2E para validar que o rodapé Dev Info não é fixed/sticky,
 * que o sidebar não contém "Voltar ao Site", e que cada seção do footer possui ícone.
 * BDD: O footer deve ser inline (não sobrepor sidebar) e exibir ícones (favicons).
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://demo.localhost:9016';

async function loginAndGoToDashboard(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });

  const autoLoginLabel = page.getByText('Dev: Auto-login (Ambiente de Teste)').first();
  const hasDevSelector = await autoLoginLabel.isVisible({ timeout: 15000 }).catch(() => false);

  if (hasDevSelector) {
    const trigger = page.locator('button[role="combobox"]').filter({ hasText: /Selecione para auto-login/i }).first();
    await trigger.click();
    await page.getByRole('option').filter({ hasText: /ADMIN: admin@bidexpert.com.br/i }).first().click();
  } else {
    const emailInput = page.locator('[data-ai-id="auth-login-email-input"]').first();
    const passwordInput = page.locator('[data-ai-id="auth-login-password-input"]').first();
    const submitButton = page.locator('[data-ai-id="auth-login-submit-button"]').first();

    await emailInput.fill('admin@bidexpert.com.br');
    await passwordInput.fill('Admin@123');
    await submitButton.click();
  }

  await page.waitForURL(/\/(dashboard|admin|home|$)/i, { timeout: 120000 });
  await page.goto(`${BASE_URL}/dashboard/overview`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(3000);
}

test.describe('Footer DevInfo - Não-sticky e sem sobreposição', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoToDashboard(page);
  });

  test('Footer existe, é inline (não fixed/sticky) e possui ícones em cada seção', async ({ page }) => {
    const footer = page.locator('[data-ai-id="dashboard-footer"]');
    await expect(footer).toBeVisible({ timeout: 30000 });

    // Validar que NÃO é fixed nem sticky
    const computedPosition = await footer.evaluate((el) => window.getComputedStyle(el).position);
    expect(computedPosition).not.toBe('fixed');
    expect(computedPosition).not.toBe('sticky');

    // Validar que cada célula do grid tem um ícone SVG (lucide icons renderizam como <svg>)
    const cells = [
      'dev-info-tenant',
      'dev-info-user',
      'dev-info-db',
      'dev-info-provider',
      'dev-info-branch',
      'dev-info-server-link',
      'dev-info-project',
    ];

    for (const cellId of cells) {
      const cell = page.locator(`[data-ai-id="${cellId}"]`);
      await expect(cell).toBeVisible({ timeout: 10000 });
      const svgIcon = cell.locator('svg').first();
      await expect(svgIcon).toBeVisible({ timeout: 5000 });
    }
  });

  test('Sidebar NÃO contém botão "Voltar ao Site"', async ({ page }) => {
    const sidebar = page.locator('[data-ai-id="user-dashboard-sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 30000 });

    const voltarButton = sidebar.getByText('Voltar ao Site');
    await expect(voltarButton).toHaveCount(0);
  });

  test('Footer com todas as 7 seções preenchidas', async ({ page }) => {
    const grid = page.locator('[data-ai-id="dev-info-grid"]');
    await expect(grid).toBeVisible({ timeout: 30000 });

    // Verificar labels de cada seção
    await expect(page.locator('[data-ai-id="dev-info-tenant-label"]')).toContainText('Tenant ID');
    await expect(page.locator('[data-ai-id="dev-info-user-label"]')).toContainText('User');
    await expect(page.locator('[data-ai-id="dev-info-db-label"]')).toContainText('DB System');
    await expect(page.locator('[data-ai-id="dev-info-provider-label"]')).toContainText('Provider');
    await expect(page.locator('[data-ai-id="dev-info-branch-label"]')).toContainText('Branch');
    await expect(page.locator('[data-ai-id="dev-info-server-link-label"]')).toContainText('Server');
    await expect(page.locator('[data-ai-id="dev-info-project-label"]')).toContainText('Project');
  });
});
