/**
 * @fileoverview E2E do Leilões SuperGrid administrativo.
 * BDD: Cobrir filtros avançados localizados, persistência, busca, grouping, edição e exportação.
 * TDD: Valida o contrato da feature tests/itsm/features/admin-auctions-supergrid.feature.
 */
import { test, expect, type Page } from '@playwright/test';
import { ensureSeedExecuted, loginAsAdmin } from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9006';

test.describe('Admin Auctions SuperGrid', () => {
  test.setTimeout(180_000);

  test.beforeAll(async () => {
    await ensureSeedExecuted(BASE_URL);
  });

  test('opera filtros, busca, agrupamento, edição e exportações', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
    await openSuperGrid(page);

    await expect(page.locator('[data-ai-id="auctions-supergrid-page"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="supergrid-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="supergrid-table-container"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="auctions-supergrid-analytics-cell"]').first()).toBeVisible();

    await validateAdvancedFilterPersistence(page);
    await validateQuickSearch(page);
    await validateColumnVisibilityAndResize(page);
    await validateGroupingAndInlineEditing(page);
    await validateExportDownloads(page);
  });
});

async function openSuperGrid(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/admin/auctions-supergrid`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForSelector('[data-ai-id="supergrid-toolbar"]', { timeout: 90_000 });
  await page.waitForSelector('[data-ai-id^="supergrid-row-"]', { timeout: 90_000 });
}

async function validateAdvancedFilterPersistence(page: Page): Promise<void> {
  const filtersResponse = await page.evaluate(async () => {
    const response = await fetch('/api/admin/super-grid/filters?gridId=auctions-supergrid', { cache: 'no-store' });
    return { status: response.status, payload: await response.json().catch(() => null) };
  });
  expect(filtersResponse.status).toBe(200);
  expect(Array.isArray(filtersResponse.payload?.data)).toBe(true);

  const panel = page.locator('[data-ai-id="supergrid-query-builder-panel"]');
  if (!(await page.getByRole('button', { name: /\+ Regra|Adicionar regra/ }).isVisible().catch(() => false))) {
    await page.locator('[data-ai-id="supergrid-query-builder-toggle"]').click();
  }

  await page.getByRole('button', { name: /\+ Regra|Adicionar regra/ }).click();
  await panel.locator('[data-testid="fields"]').last().selectOption('title');
  await panel.locator('[data-testid="operators"]').last().selectOption('contains');
  await panel.locator('[data-testid="value-editor"]').last().fill('Leil');

  await expect(panel).toContainText('Filtros salvos');
  await expect(panel).toContainText('Salvar filtro atual');
  await expect(panel).toContainText('Não contém');
  await expect(panel.locator('[data-testid="fields"]').last()).toContainText('Título');
  await expect(panel.locator('[data-testid="operators"]').last()).toContainText('Contém');
  await expect(panel.locator('[data-testid="combinators"]').first()).toContainText('E');
  await expect(panel.locator('[data-testid="combinators"]').first()).toContainText('OU');

  const filterName = `E2E SuperGrid ${Date.now()}`;
  const saveResponse = page.waitForResponse(response =>
    response.url().includes('/api/admin/super-grid/filters') && response.request().method() === 'POST'
  );
  await page.locator('[data-ai-id="supergrid-save-filter-btn"]').click();
  await page.locator('[data-ai-id="supergrid-filter-name-input"]').fill(filterName);
  await page.locator('[data-ai-id="supergrid-filter-save-confirm"]').click();
  expect((await saveResponse).status()).toBe(200);

  await expect(page.locator('[data-ai-id="supergrid-saved-filter-select"]')).toContainText(filterName);

  const deleteResponse = page.waitForResponse(response =>
    response.url().includes('/api/admin/super-grid/filters') && response.request().method() === 'DELETE'
  );
  await page.locator('[data-ai-id="supergrid-delete-filter-btn"]').click();
  expect((await deleteResponse).status()).toBe(200);

  await page.locator('[data-ai-id="supergrid-query-builder-clear"]').click();
}

async function validateQuickSearch(page: Page): Promise<void> {
  const quickFilter = page.locator('[data-ai-id="supergrid-quick-filter"]');

  await quickFilter.fill('Campo Grande');
  await expect(page.getByText('Campo Grande').first()).toBeVisible({ timeout: 30_000 });

  await quickFilter.fill('Rascunho');
  await expect(page.getByText('Rascunho').first()).toBeVisible({ timeout: 30_000 });

  await quickFilter.fill('Leilao E2E');
  await expect(page.getByText(/Leil[aã]o E2E/i).first()).toBeVisible({ timeout: 30_000 });

  await quickFilter.fill('');
  await page.waitForSelector('[data-ai-id^="supergrid-row-"]', { timeout: 30_000 });
}

async function validateColumnVisibilityAndResize(page: Page): Promise<void> {
  await page.locator('[data-ai-id="supergrid-column-visibility-btn"]').click();
  await page.locator('[data-ai-id="supergrid-col-toggle-analyticsSummary"]').getByRole('checkbox').click();
  await expect(page.locator('[data-ai-id="supergrid-header-analyticsSummary"]')).toHaveCount(0);
  await page.locator('[data-ai-id="supergrid-col-toggle-analyticsSummary"]').getByRole('checkbox').click();
  await expect(page.locator('[data-ai-id="supergrid-header-analyticsSummary"]')).toBeVisible();
  await page.keyboard.press('Escape');

  const titleHeader = page.locator('[data-ai-id="supergrid-header-title"]');
  const headerBox = await titleHeader.boundingBox();
  expect(headerBox).not.toBeNull();

  if (headerBox) {
    await page.mouse.move(headerBox.x + headerBox.width - 2, headerBox.y + headerBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(headerBox.x + headerBox.width + 36, headerBox.y + headerBox.height / 2, { steps: 6 });
    await page.mouse.up();
  }

  await expect.poll(async () => page.evaluate(() => document.cookie), { timeout: 10_000 })
    .toContain('bidexpert_supergrid_auctions-supergrid');
  await expect.poll(async () => page.evaluate(() => decodeURIComponent(document.cookie)), { timeout: 10_000 })
    .toContain('columnSizing');
}

async function validateGroupingAndInlineEditing(page: Page): Promise<void> {
  await page.locator('[data-ai-id="supergrid-add-group-btn"]').click();
  await page.locator('[data-ai-id="supergrid-group-option-status"]').evaluate(element => {
    (element as HTMLButtonElement).click();
  });
  await expect(page.locator('[data-ai-id="supergrid-group-chip-status"]')).toContainText('Status');
  await expect(page.locator('[data-ai-id^="supergrid-group-row-0-"]').first()).toBeVisible({ timeout: 30_000 });

  await page.locator('[data-ai-id="supergrid-clear-groups-btn"]').click();
  const editableTitleCell = page.locator('[data-ai-id^="supergrid-cell-editable-title-"]').first();
  await editableTitleCell.dblclick();
  await expect(page.locator('[data-ai-id^="supergrid-inline-editor-title-"]').first()).toBeVisible();
  await page.keyboard.press('Escape');
}

async function validateExportDownloads(page: Page): Promise<void> {
  for (const exportCase of [
    { selector: '[data-ai-id="supergrid-export-csv"]', extension: '.csv' },
    { selector: '[data-ai-id="supergrid-export-excel"]', extension: '.xlsx' },
    { selector: '[data-ai-id="supergrid-export-pdf"]', extension: '.pdf' },
  ]) {
    await page.locator('[data-ai-id="supergrid-export-btn"]').click();
    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
    await page.locator(exportCase.selector).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(exportCase.extension);
  }
}
