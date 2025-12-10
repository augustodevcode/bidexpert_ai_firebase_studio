/**
 * BDD Scenario: Map search renders tiles and markers after applying geocode fallbacks.
 */
import { test, expect } from '@playwright/test';

test.describe('Mapa - Busca Geolocalizada', () => {
  test('exibe marcadores após resolver coordenadas', async ({ page }) => {
    await page.goto('/map-search');
    await page.waitForSelector('.leaflet-container', { state: 'visible' });
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 20000 });
    const markerCount = await page.locator('.leaflet-marker-icon').count();
    expect(markerCount).toBeGreaterThan(0);
  });
});
