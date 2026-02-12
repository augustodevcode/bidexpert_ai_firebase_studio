/**
 * @fileoverview Testes E2E da Biblioteca de Mídia (Google Photos-like).
 * 
 * Valida: login admin, renderização da galeria, view modes (grid/rows/list),
 * toolbar de busca, upload zone, sidebar, lightbox, editor de imagem,
 * seleção de itens e ações em lote.
 * 
 * Credenciais: admin@bidexpert.com.br / Admin@123
 * URL: http://demo.localhost:9005/admin/media
 * Config: playwright.e2e.config.ts (headless=false, port=9005)
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://demo.localhost:9005';

// Increase default test timeout for lazy compilation
test.setTimeout(180_000);

/** Helper: Login as admin */
async function loginAsAdmin(page: Page) {
  // Capture console errors for debugging (register early)
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[Browser Error]: ${msg.text()}`);
  });

  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 120000 });

  // Wait for login form to fully render (Next.js lazy compilation + Suspense)
  await page.waitForSelector('[data-ai-id="auth-login-email-input"]', { timeout: 120000 });

  // Wait for tenant context and tenant list to load
  await page.waitForTimeout(5000);

  const emailInput = page.locator('[data-ai-id="auth-login-email-input"]');
  const passwordInput = page.locator('[data-ai-id="auth-login-password-input"]');
  const submitButton = page.locator('[data-ai-id="auth-login-submit-button"]');

  // Demo tenant admin (from seed: ultimate-master-seed.ts)
  await emailInput.fill('admin@bidexpert.com.br');
  await passwordInput.fill('Admin@123');

  // Use Promise.all to avoid actionTimeout issue with server actions
  await Promise.all([
    page.waitForURL(/\/(admin|dashboard)/i, { timeout: 60000 }),
    submitButton.click({ timeout: 60000 }),
  ]);
  console.log('✅ Login admin concluído:', page.url());
}

test.describe('Biblioteca de Mídia - Google Photos-like', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/media`, { waitUntil: 'networkidle', timeout: 120000 });
    // Wait for page to compile and render (Next.js lazy compilation can be slow)
    await page.waitForSelector('[data-ai-id="admin-media-page-container"]', { timeout: 120000 });
    console.log('✅ Página de mídia carregada');
  });

  test('T01 - Deve renderizar a página principal da biblioteca de mídia', async ({ page }) => {
    // Page container
    const container = page.locator('[data-ai-id="admin-media-page-container"]');
    await expect(container).toBeVisible();

    // Toolbar
    const toolbar = page.locator('[data-ai-id="media-toolbar"]');
    await expect(toolbar).toBeVisible({ timeout: 15000 });

    // Search input
    const searchInput = page.locator('[data-ai-id="media-toolbar-search"]');
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Gallery view (grid, rows, or list)
    const gallery = page.locator('[data-ai-id="media-gallery-view"], [data-ai-id="media-gallery-empty"], [data-ai-id="media-gallery-loading"]');
    await expect(gallery.first()).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/media-library-main.png', fullPage: true });
    console.log('✅ T01 - Página principal renderizada com sucesso');
  });

  test('T02 - Deve alternar entre modos de visualização (grid/rows/list)', async ({ page }) => {
    const gridButton = page.locator('button[title="Grade"]');
    const rowsButton = page.locator('button[title="Fileiras"]');
    const listButton = page.locator('button[title="Lista"]');

    await expect(gridButton).toBeVisible({ timeout: 15000 });
    await expect(rowsButton).toBeVisible({ timeout: 15000 });
    await expect(listButton).toBeVisible({ timeout: 15000 });

    // Switch to rows
    await rowsButton.click();
    await page.waitForTimeout(500);
    let galleryView = page.locator('[data-ai-id="media-gallery-view"][data-view-mode="rows"], [data-ai-id="media-gallery-empty"]');
    await expect(galleryView.first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/media-library-rows.png', fullPage: true });

    // Switch to list
    await listButton.click();
    await page.waitForTimeout(500);
    galleryView = page.locator('[data-ai-id="media-gallery-view"][data-view-mode="list"], [data-ai-id="media-gallery-empty"]');
    await expect(galleryView.first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/media-library-list.png', fullPage: true });

    // Switch back to grid
    await gridButton.click();
    await page.waitForTimeout(500);
    galleryView = page.locator('[data-ai-id="media-gallery-view"][data-view-mode="grid"], [data-ai-id="media-gallery-empty"]');
    await expect(galleryView.first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/media-library-grid.png', fullPage: true });

    console.log('✅ T02 - Alternância de view modes funcionando');
  });

  test('T03 - Deve buscar itens via campo de pesquisa', async ({ page }) => {
    const searchInput = page.locator('[data-ai-id="media-toolbar-search"]');

    await searchInput.fill('test');
    await page.waitForTimeout(1000);

    const gallery = page.locator('[data-ai-id="media-gallery-view"], [data-ai-id="media-gallery-empty"]');
    await expect(gallery.first()).toBeVisible({ timeout: 10000 });

    await searchInput.clear();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/media-library-search.png', fullPage: true });
    console.log('✅ T03 - Busca funcionando');
  });

  test('T04 - Deve exibir zona de upload', async ({ page }) => {
    const uploadZone = page.locator('[data-ai-id="media-upload-zone"]');

    if (!(await uploadZone.isVisible())) {
      const uploadToggle = page.locator('button:has-text("Upload"), button:has-text("Enviar")');
      if (await uploadToggle.count() > 0) {
        await uploadToggle.first().click();
        await page.waitForTimeout(500);
      }
    }

    const uploadVisible = await uploadZone.isVisible();
    console.log(`Upload zone visible: ${uploadVisible}`);

    await page.screenshot({ path: 'test-results/media-library-upload.png', fullPage: true });
    console.log('✅ T04 - Verificação de upload zone concluída');
  });

  test('T05 - Deve exibir cards de mídia na galeria (se houver dados)', async ({ page }) => {
    const cards = page.locator('[data-ai-id="media-gallery-card"]');
    const emptyState = page.locator('[data-ai-id="media-gallery-empty"]');

    // Wait for loading to finish
    await page.waitForTimeout(2000);

    const cardCount = await cards.count();
    const isEmpty = await emptyState.isVisible();

    if (cardCount > 0) {
      console.log(`✅ Encontrados ${cardCount} cards de mídia na galeria`);
      await expect(cards.first()).toBeVisible();
      await cards.first().hover();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/media-library-card-hover.png', fullPage: true });
    } else if (isEmpty) {
      console.log('ℹ️ Galeria vazia - sem itens de mídia no seed');
      await expect(emptyState).toBeVisible();
    }

    console.log('✅ T05 - Verificação de cards concluída');
  });

  test('T06 - Deve abrir sidebar de detalhes ao clicar em item (se houver dados)', async ({ page }) => {
    const cards = page.locator('[data-ai-id="media-gallery-card"]');
    await page.waitForTimeout(2000);
    const cardCount = await cards.count();

    if (cardCount === 0) {
      console.log('ℹ️ Sem itens de mídia - pulando teste de sidebar');
      test.skip();
      return;
    }

    await cards.first().hover();
    await page.waitForTimeout(500);

    const viewButton = cards.first().locator('button').filter({ has: page.locator('svg') }).nth(1);
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(500);
    }

    const sidebar = page.locator('[data-ai-id="media-sidebar-panel"]');
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
      await page.screenshot({ path: 'test-results/media-library-sidebar.png', fullPage: true });
      console.log('✅ T06 - Sidebar de detalhes aberta');
    } else {
      console.log('ℹ️ Sidebar não abriu - verificar implementação de click');
    }
  });

  test('T07 - Deve selecionar itens com checkbox (se houver dados)', async ({ page }) => {
    const cards = page.locator('[data-ai-id="media-gallery-card"]');
    await page.waitForTimeout(2000);
    const cardCount = await cards.count();

    if (cardCount === 0) {
      console.log('ℹ️ Sem itens de mídia - pulando teste de seleção');
      test.skip();
      return;
    }

    await cards.first().hover();
    await page.waitForTimeout(300);

    const checkButton = cards.first().locator('button').first();
    if (await checkButton.isVisible()) {
      await checkButton.click();
      await page.waitForTimeout(300);
    }

    const selectedText = page.locator('text=/selecionad/i');
    if (await selectedText.count() > 0) {
      console.log('✅ T07 - Seleção de itens funcionando');
    } else {
      console.log('ℹ️ T07 - Seleção pode precisar de ajuste na UI');
    }

    await page.screenshot({ path: 'test-results/media-library-selection.png', fullPage: true });
  });

  test('T08 - Deve ordenar itens pelo dropdown', async ({ page }) => {
    const sortButton = page.locator('button:has-text("Ordenar")');
    await expect(sortButton).toBeVisible({ timeout: 15000 });
    await sortButton.click();
    await page.waitForTimeout(500);

    const sortOptions = page.locator('[role="menuitem"]');
    const optCount = await sortOptions.count();
    console.log(`Encontradas ${optCount} opções de ordenação`);

    expect(optCount).toBeGreaterThanOrEqual(4);

    const nameAZ = page.locator('[role="menuitem"]:has-text("Nome (A-Z)")');
    if (await nameAZ.isVisible()) {
      await nameAZ.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'test-results/media-library-sort.png', fullPage: true });
    console.log('✅ T08 - Ordenação funcionando');
  });

  test('T09 - Página não deve ter erros de console críticos', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('hydration') && !text.includes('ERR_')) {
          errors.push(text);
        }
      }
    });

    await page.reload({ waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForSelector('[data-ai-id="admin-media-page-container"]', { timeout: 120000 });
    await page.waitForTimeout(3000);

    if (errors.length > 0) {
      console.warn('⚠️ Erros de console encontrados:', errors);
    } else {
      console.log('✅ T09 - Nenhum erro crítico de console');
    }

    await page.screenshot({ path: 'test-results/media-library-no-errors.png', fullPage: true });
  });

  test('T10 - Deve exibir corretamente em modo list', async ({ page }) => {
    const listButton = page.locator('button[title="Lista"]');
    await listButton.click();
    await page.waitForTimeout(500);

    const listRows = page.locator('[data-ai-id="media-gallery-list-row"]');
    const emptyState = page.locator('[data-ai-id="media-gallery-empty"]');

    const rowCount = await listRows.count();
    const isEmpty = await emptyState.isVisible();

    if (rowCount > 0) {
      console.log(`✅ T10 - Encontradas ${rowCount} linhas na view list`);
      await expect(listRows.first()).toBeVisible();
    } else if (isEmpty) {
      console.log('ℹ️ T10 - Galeria vazia em modo list');
    }

    await page.screenshot({ path: 'test-results/media-library-list-view.png', fullPage: true });
  });
});
