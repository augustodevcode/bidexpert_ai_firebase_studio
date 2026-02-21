/**
 * @fileoverview Valida visibilidade do CTA de pregão online para usuário não autenticado.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9005';

test.describe('CTA Ir para pregão online', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('não exibe CTA para visitante sem login', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const goLiveButtons = page.locator('[data-ai-id*="go-live"]');
    await expect(goLiveButtons).toHaveCount(0);
  });
});
