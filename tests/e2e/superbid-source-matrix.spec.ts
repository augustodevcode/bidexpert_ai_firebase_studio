/**
 * Valida as fontes Superbid do ciclo QA multi-modal e a prontidao admin/public BidExpert.
 */
import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { loginAsAdmin } from './helpers/auth-helper';
import { SUPERBID_SOURCE_MATRIX } from '../fixtures/superbid-source-matrix';

const BIDEXPERT_BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9024';
const EVIDENCE_DIR = path.join('test-results', 'superbid-source-matrix');

function normalizeForAssertion(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

async function openAdminWizard(page: Page): Promise<void> {
  await page.goto(`${BIDEXPERT_BASE_URL}/admin/wizard`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });

  if (page.url().includes('/auth/login')) {
    await loginAsAdmin(page, BIDEXPERT_BASE_URL);
    await page.goto(`${BIDEXPERT_BASE_URL}/admin/wizard`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
  }
}

test.describe('Superbid source matrix QA', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Run once in the authenticated Chromium project.');
    mkdirSync(EVIDENCE_DIR, { recursive: true });
  });

  test('confirms every external source has the expected visible volume and captures evidence', async ({ page }) => {
    for (const source of SUPERBID_SOURCE_MATRIX) {
      await page.goto(source.sourceUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });

      await expect
        .poll(async () => normalizeForAssertion(await page.locator('body').innerText()), {
          message: `Superbid source text loaded: ${source.id}`,
          timeout: 30_000,
        })
        .toContain(normalizeForAssertion(source.countText));

      const pageText = normalizeForAssertion(await page.locator('body').innerText());
      expect(pageText, `${source.id} status text`).toContain(normalizeForAssertion(source.statusText));
      expect(pageText, `${source.id} negotiation label`).toContain(
        normalizeForAssertion(source.negotiationLabel),
      );

      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `${source.id}.png`),
        fullPage: true,
      });
    }
  });

  test('confirms BidExpert admin wizard supports the target modalities', async ({ page }) => {
    await openAdminWizard(page);

    await expect(page.getByText(/assistente de cria[cç][aã]o de leil[aã]o/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/leil[aã]o judicial/i).first()).toBeVisible();
    await expect(page.getByText(/leil[aã]o extrajudicial/i).first()).toBeVisible();
    await expect(page.getByText(/tomada de pre[cç]os/i).first()).toBeVisible();
    await expect(page.getByText(/venda direta/i).first()).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, 'bidexpert-admin-wizard-modalities.png'),
      fullPage: true,
    });
  });

  test('confirms BidExpert public catalogue surfaces are reachable for comparison', async ({ page }) => {
    for (const publicPath of ['/lots', '/search']) {
      await page.goto(`${BIDEXPERT_BASE_URL}${publicPath}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await expect(page.locator('body')).toContainText(/BidExpert|Lotes|Busca|leil[oõ]es/i, {
        timeout: 30_000,
      });

      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `bidexpert${publicPath.replace('/', '-')}.png`),
        fullPage: true,
      });
    }
  });
});