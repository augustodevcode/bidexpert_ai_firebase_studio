/**
 * @fileoverview Regressão crítica do checkout de arremate para garantir que o winId 27 não volte a quebrar na renderização.
 */

import { test, expect } from './fixtures/browser-telemetry.fixture';
import { ensureSeedExecuted, loginAs } from './helpers/auth-helper';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || process.env.BASE_URL || 'http://demo.localhost:9018';
const NAV_OPTS = { waitUntil: 'domcontentloaded' as const, timeout: 120_000 };

test.describe('Checkout user win regression', () => {
  test.beforeAll(async () => {
    await ensureSeedExecuted(BASE_URL);
  });

  test('deve abrir o checkout do arremate pago sem erro de render', async ({ page, browserTelemetry }) => {
    await loginAs(page, 'analista', BASE_URL, { timeout: 120_000 });

    await page.goto(`${BASE_URL}/checkout/27`, NAV_OPTS);
    await page.waitForURL(/\/(checkout\/27|dashboard\/wins)(\?|$)/, { timeout: 120_000 });

    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });

    const blockingErrors = browserTelemetry.filter((entry) =>
      /Cannot read properties of undefined|reading 'price'|Server Components render/i.test(entry.message)
    );

    expect(blockingErrors).toEqual([]);
  });
});