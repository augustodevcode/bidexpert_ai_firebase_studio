/**
 * @fileoverview E2E de regressão para configuração de mídia entre ativo e lote no admin.
 * BDD:
 * - Given admin autenticado
 * - When abre formulários de ativo/lote
 * - Then controles de galeria e origem da mídia ficam disponíveis para operação
 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9011';

async function gotoAdminRoute(page: import('@playwright/test').Page, path: '/admin/assets/new' | '/admin/lots/new') {
  const targetUrl = `${BASE_URL}${path}`;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    if (!page.url().includes('/auth/login')) {
      return;
    }

    await loginAsAdmin(page, BASE_URL);
  }

  throw new Error(`Nao foi possivel autenticar para acessar ${path}`);
}

test.describe('Admin lot media inheritance UI', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(/noauth/i.test(testInfo.project.name), 'Fluxo administrativo exige sessão autenticada.');
  });

  test('asset form shows gallery controls', async ({ page }) => {
    await gotoAdminRoute(page, '/admin/assets/new');

    await expect(page.locator('[data-ai-id="asset-form"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="asset-gallery-card"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="asset-gallery-open-library-button"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="asset-gallery-empty-state"]')).toContainText('Nenhuma imagem na galeria');
  });

  test('lot form shows media source mode toggle', async ({ page }) => {
    await gotoAdminRoute(page, '/admin/lots/new');

    await expect(page.locator('[data-ai-id="lot-form"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="lot-form-media-section"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="lot-form-media-source-custom"]')).toContainText('Usar Galeria Customizada');
    await expect(page.locator('[data-ai-id="lot-form-media-source-inherit"]')).toContainText('Herdar de um Bem Vinculado');
    await expect(page.getByRole('button', { name: 'Adicionar à Galeria' })).toBeEnabled();
  });
});
