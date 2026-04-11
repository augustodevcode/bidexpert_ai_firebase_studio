/**
 * @fileoverview Teste E2E para validar que o Dev Info fica oculto por padrão
 * e só aparece após clique no botão da sidebar.
 * BDD: O modal de Dev Info não deve existir inline no layout antes da ação do usuário.
 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth-helper';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || 'http://demo.localhost:9016';

test.describe('DevInfo - Abertura sob demanda pela sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
    await page.goto(`${BASE_URL}/dashboard/overview`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await expect(page.locator('[data-ai-id="env-info-sidebar-button"]').first()).toBeVisible({ timeout: 30000 });
  });

  test('Dev Info fica oculto por padrão e abre por clique na sidebar', async ({ page }) => {
    await expect(page.locator('[data-ai-id="dashboard-footer"]')).toHaveCount(0);

    const trigger = page.locator('[data-ai-id="env-info-sidebar-button"]').first();
    await expect(trigger).toBeVisible({ timeout: 30000 });
    await trigger.click();

    const modal = page.locator('[data-ai-id="env-info-modal"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

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

  test('Modal exibe todas as 7 seções preenchidas', async ({ page }) => {
    await page.locator('[data-ai-id="env-info-sidebar-button"]').first().click();

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
