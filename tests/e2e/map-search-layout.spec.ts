// tests/e2e/map-search-layout.spec.ts
import { test, expect } from '@playwright/test';

const PAGE_URL = '/map-search';

async function waitForMapSidebar(page) {
  await page.goto(PAGE_URL);
  await page.locator('[data-ai-id="map-search-list"]').waitFor({ state: 'visible' });
}

test.describe('Map search layout enhancements', () => {
  test('opens and closes fullscreen mode', async ({ page }) => {
    await waitForMapSidebar(page);
    await page.getByRole('button', { name: /Tela cheia/i }).click();
    await expect(page.getByRole('button', { name: /Fechar tela cheia/i })).toBeVisible();
    await page.getByRole('button', { name: /Fechar tela cheia/i }).click();
    await expect(page.getByRole('button', { name: /Tela cheia/i })).toBeVisible();
  });

  test('renders compact list items inside the sidebar', async ({ page }) => {
    await waitForMapSidebar(page);
    const firstListItem = page.locator('[data-ai-id="map-search-list-item"]').first();
    await expect(firstListItem.locator('[data-density="default"]')).toBeVisible();
    await page.getByRole('button', { name: /Recentrar mapa/i }).click();
    await expect(page.locator('[data-ai-id="map-search-count"]')).toBeVisible();
  });
});
