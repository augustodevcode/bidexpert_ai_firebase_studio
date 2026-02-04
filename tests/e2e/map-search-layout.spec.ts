// tests/e2e/map-search-layout.spec.ts
import { test, expect } from '@playwright/test';

const PAGE_URL = 'http://localhost:9005/map-search';

async function waitForMapModal(page) {
  await page.goto(PAGE_URL);
  await page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 10000 });
}

test.describe('Map search modal layout', () => {
  test('modal opens on page load and shows header with title', async ({ page }) => {
    await waitForMapModal(page);
    
    // Verificar que o modal está visível
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Verificar header com título
    await expect(page.getByRole('heading', { name: /Mapa Inteligente BidExpert/i })).toBeVisible();
  });

  test('modal has 70/30 grid layout with map and sidebar', async ({ page }) => {
    await waitForMapModal(page);
    
    // Verificar que o grid existe
    const gridContainer = page.locator('.xl\\:grid-cols-\\[7fr_3fr\\]');
    await expect(gridContainer).toBeVisible();
    
    // Verificar que tem pelo menos 2 filhos (mapa e sidebar)
    const gridChildren = gridContainer.locator('> div');
    await expect(gridChildren).toHaveCount(2);
  });

  test('renders list items with map density', async ({ page }) => {
    await waitForMapModal(page);
    
    // Aguardar lista carregar
    await page.locator('[data-ai-id="map-search-list"]').waitFor({ state: 'visible', timeout: 10000 });
    
    // Verificar que existe pelo menos um item com densidade map
    const listItems = page.locator('[data-density="map"]');
    await expect(listItems.first()).toBeVisible();
  });

  test('closes modal when close button is clicked', async ({ page }) => {
    await waitForMapModal(page);
    
    // Clicar no botão de fechar (X)
    await page.getByRole('button').filter({ has: page.locator('svg') }).first().click();
    
    // Aguardar o modal fechar (dialog não deve estar mais visível)
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  });
});
