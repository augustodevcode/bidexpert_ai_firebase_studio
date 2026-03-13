/**
 * @fileoverview E2E focado nas entidades EmailLog e Report do Admin Plus.
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9008';

test.describe('Admin Plus entity parity', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('renders admin-plus email logs and opens the details sheet', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/email-logs`, {
      waitUntil: 'networkidle',
      timeout: 120_000,
    });

    await expect(page.getByRole('heading', { name: /logs de e-mail/i })).toBeVisible();
    await expect(page.locator('[data-ai-id="email-logs-stats-grid"]')).toBeVisible();

    const firstActionButton = page.locator('button[aria-label="Ações do log de e-mail"]').first();
    if (await firstActionButton.isVisible().catch(() => false)) {
      await firstActionButton.click();
      await page.getByRole('menuitem', { name: /ver detalhes/i }).click();
      await expect(page.locator('[data-ai-id="email-log-details-sheet"]')).toBeVisible();
    }
  });

  test('renders admin-plus reports and opens the create form', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/reports`, {
      waitUntil: 'networkidle',
      timeout: 120_000,
    });

    await expect(page.getByRole('heading', { name: /relatórios/i })).toBeVisible();
    await expect(page.locator('[data-ai-id="reports-data-table"]')).toBeVisible();

    await page.getByRole('button', { name: /novo relatório/i }).click();
    await expect(page.locator('[data-ai-id="report-form-sheet"]')).toBeVisible();
    await expect(page.getByLabel(/definição json/i)).toBeVisible();
  });
});