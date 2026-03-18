/**
 * @fileoverview E2E tests for the 10 admin-plus CRUD resources that use Sheet overlay forms.
 *
 * BDD Scenarios (Given/When/Then):
 * - Given an authenticated admin on a list page
 * - When they click the primary action button, fill the sheet form and submit
 * - Then a success toast appears and the new record appears in the table
 * - When they double-click the row, update a field and save
 * - Then the updated value appears in the table
 * - When they click Delete in the row actions and confirm
 * - Then the row is removed from the table
 *
 * Data-ai-id selector strategy used throughout (per accessibility guidelines):
 *   [data-ai-id="<resource>-form-sheet"]  — Sheet container
 *   [data-ai-id="<resource>-field-<name>"] — individual field
 *   [data-ai-id="<resource>-form-submit"] — submit button
 *   [data-ai-id="page-header-primary-action"] — "New" button in page header
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth-helper';

const BASE_URL = process.env.BASE_URL ?? 'http://demo.localhost:9008';
const NAV_OPTS = { waitUntil: 'domcontentloaded' as const, timeout: 60_000 };
const TOAST_TIMEOUT = 12_000;

// ─── helpers ────────────────────────────────────────────────────────────────

/** Wait for a success toast from sonner / shadcn */
async function assertSuccessToast(page: Page) {
  const toast = page.locator('[data-sonner-toast]', { hasText: /sucesso|criado|atualizado|excluído/i })
    .or(page.locator('[role="status"]', { hasText: /sucesso|criado|atualizado|excluído/i }));
  await expect(toast.first()).toBeVisible({ timeout: TOAST_TIMEOUT });
}

/** Open the Sheet form using the page-header primary action button */
async function openNewSheet(page: Page) {
  await page.locator('[data-ai-id="page-header-primary-action"]').click();
}

/** Click a Radix/Shadcn SelectTrigger identified by data-ai-id and choose an option */
async function selectOption(page: Page, triggerId: string, optionText: string | RegExp) {
  await page.locator(`[data-ai-id="${triggerId}"]`).click();
  // Wait for the dropdown portal (listbox) to appear before querying options
  const listbox = page.getByRole('listbox');
  await listbox.waitFor({ state: 'visible', timeout: 8_000 });
  const option = listbox.getByRole('option', { name: optionText as string }).first();
  await option.waitFor({ state: 'visible', timeout: 8_000 });
  await option.click();
}

/** Click the first visible "Editar" or "Edit" action for the given row text */
async function openEditForRow(page: Page, rowText: string) {
  const row = page.locator('tr, [role="row"]').filter({ hasText: rowText }).first();
  // Try double-click first (onRowDoubleClick)
  await row.dblclick({ timeout: 5_000 }).catch(() => null);
  // If the sheet didn't open, fall back to the dropdown action menu
  const sheet = page.locator('[data-state="open"][role="dialog"]').first();
  const isOpen = await sheet.isVisible({ timeout: 2_000 }).catch(() => false);
  if (!isOpen) {
    const actionsBtn = row.locator('button[aria-haspopup="menu"], button:has([data-lucide="more-horizontal"])').first();
    await actionsBtn.click({ timeout: 5_000 });
    const editItem = page.getByRole('menuitem', { name: /editar/i }).first();
    await editItem.waitFor({ state: 'visible', timeout: 5_000 });
    await editItem.click();
  }
}

/** Click the Delete action for the given row and confirm the dialog */
async function deleteRow(page: Page, rowText: string) {
  const row = page.locator('tr, [role="row"]').filter({ hasText: rowText }).first();
  const actionsBtn = row.locator('button[aria-haspopup="menu"], button:has([data-lucide="more-horizontal"])').first();
  await actionsBtn.click({ timeout: 5_000 });
  const deleteItem = page.getByRole('menuitem', { name: /excluir/i }).first();
  await deleteItem.waitFor({ state: 'visible', timeout: 5_000 });
  await deleteItem.click();
  // Confirmation dialog
  const confirmBtn = page.getByRole('button', { name: /excluir|confirmar|sim/i }).last();
  await confirmBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await confirmBtn.click();
}

/** Generate a unique string for test isolation */
function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

// ─── shared beforeEach ───────────────────────────────────────────────────────

test.describe('Admin Plus — Sheet CRUD Forms', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  // ── 1. VEHICLE MAKES ──────────────────────────────────────────────────────
  test.describe('Vehicle Makes', () => {
    const URL = `${BASE_URL}/admin-plus/vehicle-makes`;

    test('creates a new vehicle make via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);

      const sheet = page.locator('[data-ai-id="vehicle-make-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });

      const name = uid('Marca');
      await page.locator('[data-ai-id="vehicle-make-name-input"]').fill(name);
      await page.locator('[data-ai-id="vehicle-make-form-submit"]').click();

      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    });

    test('edits a vehicle make via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      // create one to edit
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="vehicle-make-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const name = uid('MarcaEdit');
      await page.locator('[data-ai-id="vehicle-make-name-input"]').fill(name);
      await page.locator('[data-ai-id="vehicle-make-form-submit"]').click();
      await assertSuccessToast(page);

      // now edit
      await openEditForRow(page, name);
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const updatedName = `${name}-UPD`;
      const input = page.locator('[data-ai-id="vehicle-make-name-input"]');
      await input.fill('');
      await input.fill(updatedName);
      await page.locator('[data-ai-id="vehicle-make-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 10_000 });
    });
  });

  // ── 2. VEHICLE MODELS ─────────────────────────────────────────────────────
  test.describe('Vehicle Models', () => {
    const URL = `${BASE_URL}/admin-plus/vehicle-models`;

    test('creates a new vehicle model via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);

      const sheet = page.locator('[data-ai-id="vehicle-model-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });

      const name = uid('Modelo');
      await page.locator('[data-ai-id="vehicle-model-field-name"]').fill(name);

      // Select first available make
      const makeSelect = page.locator('[data-ai-id="vehicle-model-field-makeId"]');
      await makeSelect.click();
      const makeListbox = page.getByRole('listbox');
      const hasOption = await makeListbox.waitFor({ state: 'visible', timeout: 6_000 }).then(() => true).catch(() => false);
      if (hasOption) {
        const firstOption = makeListbox.getByRole('option').first();
        await firstOption.waitFor({ state: 'visible', timeout: 5_000 });
        await firstOption.click();
      }

      await page.locator('[data-ai-id="vehicle-model-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    });

    test('edits a vehicle model via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="vehicle-model-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const name = uid('ModeloEdit');
      await page.locator('[data-ai-id="vehicle-model-field-name"]').fill(name);

      const makeSelect2 = page.locator('[data-ai-id="vehicle-model-field-makeId"]');
      await makeSelect2.click();
      const makeListbox2 = page.getByRole('listbox');
      const hasMakeOption = await makeListbox2.waitFor({ state: 'visible', timeout: 6_000 }).then(() => true).catch(() => false);
      if (hasMakeOption) {
        const firstMakeOption = makeListbox2.getByRole('option').first();
        await firstMakeOption.waitFor({ state: 'visible', timeout: 5_000 });
        await firstMakeOption.click();
      }

      await page.locator('[data-ai-id="vehicle-model-form-submit"]').click();
      await assertSuccessToast(page);

      await openEditForRow(page, name);
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const updatedName = `${name}-UPD`;
      const input = page.locator('[data-ai-id="vehicle-model-field-name"]');
      await input.fill('');
      await input.fill(updatedName);
      await page.locator('[data-ai-id="vehicle-model-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 10_000 });
    });
  });

  // ── 3. STATES ─────────────────────────────────────────────────────────────
  test.describe('States', () => {
    const URL = `${BASE_URL}/admin-plus/states`;

    test('creates a new state via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);

      const sheet = page.locator('[data-ai-id="state-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });

      const name = uid('Estado Teste');
      const uf = `T${Date.now().toString(36).slice(-1).toUpperCase()}`;
      await page.locator('[data-ai-id="state-field-name"]').fill(name);
      await page.locator('[data-ai-id="state-field-uf"]').fill(uf.slice(0, 2));

      await page.locator('[data-ai-id="state-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    });

    test('edits a state via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="state-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const name = uid('EstEdit');
      await page.locator('[data-ai-id="state-field-name"]').fill(name);
      await page.locator('[data-ai-id="state-field-uf"]').fill('ZZ');
      await page.locator('[data-ai-id="state-form-submit"]').click();
      await assertSuccessToast(page);

      await openEditForRow(page, name);
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const updatedName = `${name}-UPD`;
      const input = page.locator('[data-ai-id="state-field-name"]');
      await input.fill('');
      await input.fill(updatedName);
      await page.locator('[data-ai-id="state-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 10_000 });
    });

    test('deletes a state after confirming dialog', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="state-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const name = uid('EstDel');
      await page.locator('[data-ai-id="state-field-name"]').fill(name);
      await page.locator('[data-ai-id="state-field-uf"]').fill('XZ');
      await page.locator('[data-ai-id="state-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });

      await deleteRow(page, name);
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).not.toBeVisible({ timeout: 8_000 });
    });
  });

  // ── 4. COURTS ─────────────────────────────────────────────────────────────
  test.describe('Courts', () => {
    const URL = `${BASE_URL}/admin-plus/courts`;

    test('creates a new court via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);

      const sheet = page.locator('[data-ai-id="court-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });

      const name = uid('Tribunal');
      await page.locator('[data-ai-id="court-field-name"]').fill(name);
      await page.locator('[data-ai-id="court-field-stateUf"]').fill('SP');
      await page.locator('[data-ai-id="court-field-website"]').fill('https://tribunal-teste.jus.br');

      await page.locator('[data-ai-id="court-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    });

    test('edits a court via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="court-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const name = uid('TribEdit');
      await page.locator('[data-ai-id="court-field-name"]').fill(name);
      await page.locator('[data-ai-id="court-field-stateUf"]').fill('RJ');
      await page.locator('[data-ai-id="court-form-submit"]').click();
      await assertSuccessToast(page);

      await openEditForRow(page, name);
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const updatedName = `${name}-UPD`;
      const input = page.locator('[data-ai-id="court-field-name"]');
      await input.fill('');
      await input.fill(updatedName);
      await page.locator('[data-ai-id="court-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 10_000 });
    });
  });

  // ── 5. CITIES ─────────────────────────────────────────────────────────────
  test.describe('Cities', () => {
    const URL = `${BASE_URL}/admin-plus/cities`;

    test('creates a new city via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);

      const sheet = page.locator('[data-ai-id="city-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });

      const name = uid('Cidade');
      await page.locator('[data-ai-id="city-field-name"]').fill(name);

      // Select first available state
      const stateSelect = page.locator('[data-ai-id="city-field-stateId"]');
      await stateSelect.click();
      const stateListbox = page.getByRole('listbox');
      const hasState = await stateListbox.waitFor({ state: 'visible', timeout: 6_000 }).then(() => true).catch(() => false);
      if (hasState) {
        const firstState = stateListbox.getByRole('option').first();
        await firstState.waitFor({ state: 'visible', timeout: 5_000 });
        await firstState.click();
      }

      await page.locator('[data-ai-id="city-field-ibgeCode"]').fill('9999999');

      await page.locator('[data-ai-id="city-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    });

    test('edits a city via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="city-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const name = uid('CidadeEdit');
      await page.locator('[data-ai-id="city-field-name"]').fill(name);

      const stateSelectEdit = page.locator('[data-ai-id="city-field-stateId"]');
      await stateSelectEdit.click();
      const stateListboxEdit = page.getByRole('listbox');
      const hasStateEdit = await stateListboxEdit.waitFor({ state: 'visible', timeout: 6_000 }).then(() => true).catch(() => false);
      if (hasStateEdit) {
        const firstStateEdit = stateListboxEdit.getByRole('option').first();
        await firstStateEdit.waitFor({ state: 'visible', timeout: 5_000 });
        await firstStateEdit.click();
      }

      await page.locator('[data-ai-id="city-field-ibgeCode"]').fill('8888888');
      await page.locator('[data-ai-id="city-form-submit"]').click();
      await assertSuccessToast(page);

      await openEditForRow(page, name);
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const updatedName = `${name}-UPD`;
      const input = page.locator('[data-ai-id="city-field-name"]');
      await input.fill('');
      await input.fill(updatedName);
      await page.locator('[data-ai-id="city-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 10_000 });
    });
  });

  // ── 6. ROLES ──────────────────────────────────────────────────────────────
  test.describe('Roles', () => {
    const URL = `${BASE_URL}/admin-plus/roles`;

    test('creates a new role via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);

      const sheet = page.locator('[data-ai-id="role-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });

      const name = uid('Perfil');
      await page.locator('[data-ai-id="role-field-name"]').fill(name);
      await page.locator('[data-ai-id="role-field-description"]').fill('Perfil criado por teste E2E');
      await page.locator('[data-ai-id="role-field-permissions"]').fill('["VIEW_DASHBOARD"]');

      await page.locator('[data-ai-id="role-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    });

    test('edits a role via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="role-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const name = uid('RoleEdit');
      await page.locator('[data-ai-id="role-field-name"]').fill(name);
      await page.locator('[data-ai-id="role-form-submit"]').click();
      await assertSuccessToast(page);

      await openEditForRow(page, name);
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const updatedName = `${name}-UPD`;
      const input = page.locator('[data-ai-id="role-field-name"]');
      await input.fill('');
      await input.fill(updatedName);
      await page.locator('[data-ai-id="role-field-description"]').fill('Descrição atualizada E2E');
      await page.locator('[data-ai-id="role-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 10_000 });
    });

    test('deletes a role after confirming dialog', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="role-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const name = uid('RoleDel');
      await page.locator('[data-ai-id="role-field-name"]').fill(name);
      await page.locator('[data-ai-id="role-form-submit"]').click();
      await assertSuccessToast(page);

      await deleteRow(page, name);
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).not.toBeVisible({ timeout: 8_000 });
    });
  });

  // ── 7. DOCUMENT TYPES ─────────────────────────────────────────────────────
  test.describe('Document Types', () => {
    const URL = `${BASE_URL}/admin-plus/document-types`;

    test('creates a new document type via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);

      const sheet = page.locator('[data-ai-id="document-type-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });

      const name = uid('DocTipo');
      await page.locator('[data-ai-id="document-type-field-name"]').fill(name);
      await page.locator('[data-ai-id="document-type-field-description"]').fill('Descrição do tipo de documento');

      // Select "appliesTo"
      await selectOption(page, 'document-type-field-appliesTo', /pessoa física|physical|ambos|both/i);

      // Toggle isRequired switch (click on the toggle area)
      const reqToggle = page.locator('[data-ai-id="document-type-toggle-required"]').locator('button[role="switch"]');
      if (await reqToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await reqToggle.click();
      }

      await page.locator('[data-ai-id="document-type-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    });

    test('edits a document type via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="document-type-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const name = uid('DocEdit');
      await page.locator('[data-ai-id="document-type-field-name"]').fill(name);
      await selectOption(page, 'document-type-field-appliesTo', /pessoa física|physical|ambos|both/i);
      await page.locator('[data-ai-id="document-type-form-submit"]').click();
      await assertSuccessToast(page);

      await openEditForRow(page, name);
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const updatedName = `${name}-UPD`;
      const input = page.locator('[data-ai-id="document-type-field-name"]');
      await input.fill('');
      await input.fill(updatedName);
      await page.locator('[data-ai-id="document-type-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 10_000 });
    });
  });

  // ── 8. DATA SOURCES ───────────────────────────────────────────────────────
  test.describe('Data Sources', () => {
    const URL = `${BASE_URL}/admin-plus/data-sources`;

    test('creates a new data source via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);

      const sheet = page.locator('[data-ai-id="data-source-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });

      const name = uid('DataSrc');
      await page.locator('[data-ai-id="data-source-field-name"]').fill(name);
      await page.locator('[data-ai-id="data-source-field-modelName"]').fill('TestModel');
      await page.locator('[data-ai-id="data-source-field-fields"]').fill('["id","name","createdAt"]');

      await page.locator('[data-ai-id="data-source-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    });

    test('edits a data source via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="data-source-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const name = uid('DSEdit');
      await page.locator('[data-ai-id="data-source-field-name"]').fill(name);
      await page.locator('[data-ai-id="data-source-field-modelName"]').fill('EditModel');
      await page.locator('[data-ai-id="data-source-field-fields"]').fill('["id","name"]');
      await page.locator('[data-ai-id="data-source-form-submit"]').click();
      await assertSuccessToast(page);

      await openEditForRow(page, name);
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const updatedName = `${name}-UPD`;
      const input = page.locator('[data-ai-id="data-source-field-name"]');
      await input.fill('');
      await input.fill(updatedName);
      await page.locator('[data-ai-id="data-source-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 10_000 });
    });

    test('deletes a data source after confirming dialog', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="data-source-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const name = uid('DSDel');
      await page.locator('[data-ai-id="data-source-field-name"]').fill(name);
      await page.locator('[data-ai-id="data-source-field-modelName"]').fill('DelModel');
      await page.locator('[data-ai-id="data-source-field-fields"]').fill('["id"]');
      await page.locator('[data-ai-id="data-source-form-submit"]').click();
      await assertSuccessToast(page);

      await deleteRow(page, name);
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).not.toBeVisible({ timeout: 8_000 });
    });
  });

  // ── 9. USERS ──────────────────────────────────────────────────────────────
  test.describe('Users', () => {
    const URL = `${BASE_URL}/admin-plus/users`;

    test('creates a new user via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);

      const sheet = page.locator('[data-ai-id="user-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });

      const ts = Date.now().toString(36);
      const email = `e2e-${ts}@bidexpert-test.com`;
      const fullName = `E2E User ${ts.toUpperCase()}`;

      await page.locator('[data-ai-id="user-field-email"]').fill(email);
      await page.locator('[data-ai-id="user-field-password"]').fill('Test@123456');
      await page.locator('[data-ai-id="user-field-fullName"]').fill(fullName);
      await page.locator('[data-ai-id="user-field-cpf"]').fill('00000000000');
      await page.locator('[data-ai-id="user-field-cellPhone"]').fill('11999999999');

      // accountType select
      await selectOption(page, 'user-field-accountType', /pessoa física|physical/i);
      // habilitationStatus select
      await selectOption(page, 'user-field-habilitationStatus', /habilitado/i);

      await page.locator('[data-ai-id="user-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(fullName).first()).toBeVisible({ timeout: 10_000 });
    });

    test('edits a user via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="user-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const ts = Date.now().toString(36);
      const email = `edit-${ts}@bidexpert-test.com`;
      const fullName = `EditUser ${ts.toUpperCase()}`;

      await page.locator('[data-ai-id="user-field-email"]').fill(email);
      await page.locator('[data-ai-id="user-field-password"]').fill('Test@123456');
      await page.locator('[data-ai-id="user-field-fullName"]').fill(fullName);
      await selectOption(page, 'user-field-accountType', /pessoa física|physical/i);
      await selectOption(page, 'user-field-habilitationStatus', /pendente|pending/i);

      await page.locator('[data-ai-id="user-form-submit"]').click();
      await assertSuccessToast(page);

      await openEditForRow(page, fullName);
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const updatedName = `${fullName}-UPD`;
      const input = page.locator('[data-ai-id="user-field-fullName"]');
      await input.fill('');
      await input.fill(updatedName);
      await page.locator('[data-ai-id="user-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 10_000 });
    });
  });

  // ── 10. TENANTS ───────────────────────────────────────────────────────────
  test.describe('Tenants', () => {
    const URL = `${BASE_URL}/admin-plus/tenants`;

    test('creates a new tenant via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);

      const sheet = page.locator('[data-ai-id="tenant-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });

      const ts = Date.now().toString(36).toLowerCase();
      const name = `Tenant E2E ${ts.toUpperCase()}`;
      const subdomain = `e2e-${ts}`;

      await page.locator('[data-ai-id="tenant-field-name"]').fill(name);
      await page.locator('[data-ai-id="tenant-field-subdomain"]').fill(subdomain);
      await page.locator('[data-ai-id="tenant-field-domain"]').fill(`${subdomain}.leilao.com.br`);

      await selectOption(page, 'tenant-field-resolutionStrategy', /subdomínio|subdomain/i);
      await selectOption(page, 'tenant-field-status', /pendente|pending/i);

      await page.locator('[data-ai-id="tenant-field-maxUsers"]').fill('50');
      await page.locator('[data-ai-id="tenant-field-maxAuctions"]').fill('10');

      await page.locator('[data-ai-id="tenant-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    });

    test('edits a tenant via Sheet form', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="tenant-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const ts = Date.now().toString(36).toLowerCase();
      const name = `TenantEdit ${ts.toUpperCase()}`;
      const subdomain = `edit-${ts}`;

      await page.locator('[data-ai-id="tenant-field-name"]').fill(name);
      await page.locator('[data-ai-id="tenant-field-subdomain"]').fill(subdomain);
      await selectOption(page, 'tenant-field-resolutionStrategy', /subdomínio|subdomain/i);
      await selectOption(page, 'tenant-field-status', /pendente|pending/i);
      await page.locator('[data-ai-id="tenant-form-submit"]').click();
      await assertSuccessToast(page);

      await openEditForRow(page, name);
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const updatedName = `${name}-UPD`;
      const input = page.locator('[data-ai-id="tenant-field-name"]');
      await input.fill('');
      await input.fill(updatedName);
      await selectOption(page, 'tenant-field-status', /trial/i);
      await page.locator('[data-ai-id="tenant-form-submit"]').click();
      await assertSuccessToast(page);
      await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: 10_000 });
    });

    test('deletes a tenant after confirming dialog', async ({ page }) => {
      await page.goto(URL, NAV_OPTS);
      await openNewSheet(page);
      const sheet = page.locator('[data-ai-id="tenant-form-sheet"]');
      await expect(sheet).toBeVisible({ timeout: 8_000 });
      const ts = Date.now().toString(36).toLowerCase();
      const name = `TenantDel ${ts.toUpperCase()}`;
      const subdomain = `del-${ts}`;

      await page.locator('[data-ai-id="tenant-field-name"]').fill(name);
      await page.locator('[data-ai-id="tenant-field-subdomain"]').fill(subdomain);
      await selectOption(page, 'tenant-field-resolutionStrategy', /subdomínio|subdomain/i);
      await selectOption(page, 'tenant-field-status', /pendente|pending/i);
      await page.locator('[data-ai-id="tenant-form-submit"]').click();
      await assertSuccessToast(page);

      await deleteRow(page, name);
      await assertSuccessToast(page);
      await expect(page.getByText(name).first()).not.toBeVisible({ timeout: 8_000 });
    });
  });
});
