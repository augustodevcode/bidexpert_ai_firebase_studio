import { test, expect } from '@playwright/test';

test.describe('Homepage Section Order', () => {
  test('should render categories carousel before featured lots', async ({ page }) => {
    // Usar subdomínio demo para garantir dados do seed
    // Aumentar timeout para dev mode (lazy compilation)
    await page.goto('http://demo.localhost:9006/', { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Localizar as seções pelos data-ai-id
    const categoriesSection = page.locator('[data-ai-id="top-categories-section"]');
    const featuredLotsSection = page.locator('[data-ai-id="homepage-featured-lots-section"]');

    // Garantir que ambos estão visíveis
    await expect(categoriesSection).toBeVisible();
    await expect(featuredLotsSection).toBeVisible();

    // Validar a ordem no DOM comparando o bounding box
    const categoriesBox = await categoriesSection.boundingBox();
    const lotsBox = await featuredLotsSection.boundingBox();

    if (categoriesBox && lotsBox) {
      // O topo da seção de categorias deve ser menor que o topo da seção de lotes (mais acima na página)
      expect(categoriesBox.y).toBeLessThan(lotsBox.y);
    } else {
      throw new Error('Could not calculate bounding boxes for sections');
    }
  });
});
