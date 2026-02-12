import { test, expect } from '@playwright/test';

test.describe('Category Redirects', () => {
  test('should redirect /category/veiculos to /search?category=veiculos', async ({ page }) => {
    await page.goto('/category/veiculos');
    await expect(page).toHaveURL(/.*\/search\?category=veiculos/);
  });

  test('should redirect /veiculos to /search?category=veiculos', async ({ page }) => {
    await page.goto('/veiculos');
    await expect(page).toHaveURL(/.*\/search\?category=veiculos/);
  });

  test('should redirect /imoveis to /search?category=imoveis', async ({ page }) => {
    await page.goto('/imoveis');
    await expect(page).toHaveURL(/.*\/search\?category=imoveis/);
  });

  test('should redirect /maquinas to /search?category=maquinas', async ({ page }) => {
    await page.goto('/maquinas');
    await expect(page).toHaveURL(/.*\/search\?category=maquinas/);
  });

  test('should redirect /tecnologia to /search?category=tecnologia', async ({ page }) => {
    await page.goto('/tecnologia');
    await expect(page).toHaveURL(/.*\/search\?category=tecnologia/);
  });
});
