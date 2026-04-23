/**
 * @fileoverview Regressão E2E do modal compartilhado de Processo Judicial.
 */

import { expect, test } from '@playwright/test';

import { loginAsAdmin } from '../helpers/auth-helper';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://demo.localhost:9006';
const SELECTOR_TRIGGER = '[data-ai-id="entity-selector-trigger-Processo Judicial"]';
const SELECTOR_MODAL = '[data-ai-id="entity-selector-modal-Processo Judicial"]';
const REQUIRED_HEADERS = [
  'judicial-process-selector-header-process-number',
  'judicial-process-selector-header-seller',
  'judicial-process-selector-header-branch',
  'judicial-process-selector-header-district',
  'judicial-process-selector-header-court',
  'judicial-process-selector-header-parties',
  'judicial-process-selector-header-electronic',
  'judicial-process-selector-header-matricula',
  'judicial-process-selector-header-registration',
  'judicial-process-selector-header-action-type',
  'judicial-process-selector-header-cnj',
  'judicial-process-selector-header-action-description',
  'judicial-process-selector-header-assets',
  'judicial-process-selector-header-lots',
];

const SURFACES = [
  { slug: 'auction-form', url: '/admin/auctions/new' },
  { slug: 'auction-form-v2', url: '/admin/auctions-v2/new' },
  { slug: 'asset-form-v2', url: '/admin/assets/new' },
  { slug: 'lotting', url: '/admin/lotting' },
];

test('todos os seletores administrativos de processo judicial mostram o grid compartilhado ampliado', async ({ page }) => {
  test.setTimeout(240_000);

  await loginAsAdmin(page, BASE_URL);

  for (const surface of SURFACES) {
    await page.request.get(`${BASE_URL}${surface.url}`, {
      failOnStatusCode: false,
      timeout: 180_000,
    });

    await page.goto(`${BASE_URL}${surface.url}`, {
      waitUntil: 'domcontentloaded',
      timeout: 180_000,
    });

    const trigger = page.locator(SELECTOR_TRIGGER);

    await expect(trigger).toBeVisible({ timeout: 30_000 });
    await trigger.click();

    await expect(page.locator(SELECTOR_MODAL)).toBeVisible();

    for (const header of REQUIRED_HEADERS) {
      await expect(page.locator(`[data-ai-id="${header}"]`)).toBeVisible();
    }

    await page.screenshot({
      path: `test-results/judicial-process-selector-columns-${surface.slug}.png`,
      fullPage: true,
    });
  }
});