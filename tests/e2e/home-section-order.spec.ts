/**
 * @fileoverview Valida ordem e consistencia das secoes principais de lotes na home publica.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://demo.localhost:9006';

test.describe('Homepage Section Order', () => {
  test('should render categories carousel before featured lots', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });

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

  test('should render a non-overlapping more-active-lots section when additional active lots exist', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });

    const featuredSection = page.locator('[data-ai-id="homepage-featured-lots-section"]');
    await expect(featuredSection).toBeVisible();

    const moreActiveLotsSection = page.locator('[data-ai-id="homepage-more-active-lots-section"]');
    const hasMoreActiveLotsSection = await moreActiveLotsSection.isVisible().catch(() => false);

    if (!hasMoreActiveLotsSection) {
      test.skip(true, 'Sem lotes ativos adicionais no seed para renderizar a seção paralela.');
      return;
    }

    await expect(moreActiveLotsSection).toBeVisible();

    const featuredLotLinks = featuredSection.locator('[data-ai-id="lot-card-link-main"]');
    const moreActiveLotLinks = moreActiveLotsSection.locator('[data-ai-id="lot-card-link-main"]');

    await expect(moreActiveLotLinks.first()).toBeVisible();

    const featuredHrefs = await featuredLotLinks.evaluateAll((elements) =>
      elements
        .map((element) => (element as HTMLAnchorElement).getAttribute('href'))
        .filter((href): href is string => Boolean(href))
    );

    const moreActiveHrefs = await moreActiveLotLinks.evaluateAll((elements) =>
      elements
        .map((element) => (element as HTMLAnchorElement).getAttribute('href'))
        .filter((href): href is string => Boolean(href))
    );

    expect(moreActiveHrefs.length).toBeGreaterThan(0);
    expect(moreActiveHrefs.length).toBeLessThanOrEqual(8);

    const overlappingHrefs = moreActiveHrefs.filter((href) => featuredHrefs.includes(href));
    expect(overlappingHrefs).toEqual([]);
  });
});
