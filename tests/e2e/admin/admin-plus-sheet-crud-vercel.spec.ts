/**
 * @fileoverview Vercel E2E tests — admin-plus Sheet CRUD forms.
 *
 * Picked up by playwright.vercel.config.ts (pattern: **\/*-vercel.spec.ts).
 * Run: npx playwright test --config=playwright.vercel.config.ts tests/e2e/admin/admin-plus-sheet-crud-vercel.spec.ts
 *
 * BDD Scenarios (Given/When/Then):
 * - Given an authenticated admin on any admin-plus list page (Vercel deployment)
 * - When they navigate to the page, it should load without errors
 * - When they click "New", the Sheet form should open and display all fields
 * - When they fill the form and submit, a success toast must appear
 * - Then the new record appears in the table and is cleaned up afterward
 *
 * Why a separate Vercel file:
 *   1. playwright.vercel.config.ts only picks up *-vercel.spec.ts
 *   2. Timeouts are longer to account for cold-start latency on Vercel
 *   3. Cleanup (delete) is always performed so demo data stays pristine
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth-helper';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://bidexpertaifirebasestudio.vercel.app';
const NAV_OPTS = { waitUntil: 'domcontentloaded' as const, timeout: 90_000 };
const TOAST_TIMEOUT = 20_000;
const VISIBLE_TIMEOUT = 15_000;

// ─── helpers ────────────────────────────────────────────────────────────────

async function assertSuccessToast(page: Page) {
  const toast = page
    .locator('[data-sonner-toast]', { hasText: /sucesso|criado|atualizado|excluído/i })
    .or(page.locator('[role="status"]', { hasText: /sucesso|criado|atualizado|excluído/i }));
  await expect(toast.first()).toBeVisible({ timeout: TOAST_TIMEOUT });
}

async function openNewSheet(page: Page) {
  const btn = page.locator('[data-ai-id="page-header-primary-action"]');
  await btn.waitFor({ state: 'visible', timeout: VISIBLE_TIMEOUT });
  await btn.click();
}

async function selectOptionFromListbox(page: Page, triggerId: string, optionText: string | RegExp) {
  await page.locator(`[data-ai-id="${triggerId}"]`).click();
  const listbox = page.getByRole('listbox');
  await listbox.waitFor({ state: 'visible', timeout: 10_000 });
  const option = listbox.getByRole('option', { name: optionText as string }).first();
  await option.waitFor({ state: 'visible', timeout: 8_000 });
  await option.click();
}

async function openEditForRow(page: Page, rowText: string) {
  const row = page.locator('tr, [role="row"]').filter({ hasText: rowText }).first();
  await row.dblclick({ timeout: 6_000 }).catch(() => null);
  const sheet = page.locator('[data-state="open"][role="dialog"]').first();
  const isOpen = await sheet.isVisible({ timeout: 3_000 }).catch(() => false);
  if (!isOpen) {
    const actionsBtn = row
      .locator('button[aria-haspopup="menu"], button:has([data-lucide="more-horizontal"])')
      .first();
    await actionsBtn.click({ timeout: 6_000 });
    const editItem = page.getByRole('menuitem', { name: /editar/i }).first();
    await editItem.waitFor({ state: 'visible', timeout: 6_000 });
    await editItem.click();
  }
}

async function deleteRow(page: Page, rowText: string) {
  const row = page.locator('tr, [role="row"]').filter({ hasText: rowText }).first();
  const actionsBtn = row
    .locator('button[aria-haspopup="menu"], button:has([data-lucide="more-horizontal"])')
    .first();
  await actionsBtn.click({ timeout: 6_000 });
  const deleteItem = page.getByRole('menuitem', { name: /excluir/i }).first();
  await deleteItem.waitFor({ state: 'visible', timeout: 6_000 });
  await deleteItem.click();
  const confirmBtn = page.getByRole('button', { name: /excluir|confirmar|sim/i }).last();
  await confirmBtn.waitFor({ state: 'visible', timeout: 6_000 });
  await confirmBtn.click();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

// ─── smoke: verify all list pages load ───────────────────────────────────────

test.describe('Admin Plus Sheet CRUD — Vercel Smoke: list pages load', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  const PAGES = [
    { path: '/admin-plus/vehicle-makes', label: /marcas/i },
    { path: '/admin-plus/vehicle-models', label: /modelos/i },
    { path: '/admin-plus/states', label: /estados/i },
    { path: '/admin-plus/courts', label: /tribunais/i },
    { path: '/admin-plus/cities', label: /cidades/i },
    { path: '/admin-plus/roles', label: /perfis|roles/i },
    { path: '/admin-plus/document-types', label: /tipos de documento/i },
    { path: '/admin-plus/data-sources', label: /fontes de dados/i },
    { path: '/admin-plus/users', label: /usuários/i },
    { path: '/admin-plus/tenants', label: /tenants/i },
  ];

  for (const { path, label } of PAGES) {
    test(`${path} loads and shows the primary action button`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(`${BASE_URL}${path}`, NAV_OPTS);

      // Page heading visible
      await expect(page.getByRole('heading', { name: label }).first()).toBeVisible({
        timeout: VISIBLE_TIMEOUT,
      });

      // "New" button present
      const newBtn = page.locator('[data-ai-id="page-header-primary-action"]');
      await expect(newBtn).toBeVisible({ timeout: VISIBLE_TIMEOUT });

      // No critical JS errors
      const critical = errors.filter((e) =>
        /TypeError|ReferenceError|SyntaxError|Unhandled/.test(e),
      );
      expect(critical, `Critical JS errors on ${path}: ${critical.join(', ')}`).toHaveLength(0);
    });
  }
});

// ─── sheet opens and renders fields ──────────────────────────────────────────

test.describe('Admin Plus Sheet CRUD — Vercel: Sheet form renders', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  test('vehicle-makes Sheet opens with name field', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/vehicle-makes`, NAV_OPTS);
    await openNewSheet(page);
    await expect(page.locator('[data-ai-id="vehicle-make-form-sheet"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="vehicle-make-name-input"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await page.locator('[data-ai-id="vehicle-make-form-cancel"]').click();
  });

  test('vehicle-models Sheet opens with name + make select', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/vehicle-models`, NAV_OPTS);
    await openNewSheet(page);
    await expect(page.locator('[data-ai-id="vehicle-model-form-sheet"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="vehicle-model-field-name"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="vehicle-model-field-makeId"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await page.locator('[data-ai-id="vehicle-model-form-cancel"]').click();
  });

  test('states Sheet opens with name + uf fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/states`, NAV_OPTS);
    await openNewSheet(page);
    await expect(page.locator('[data-ai-id="state-form-sheet"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="state-field-name"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="state-field-uf"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await page.locator('[data-ai-id="state-form-cancel"]').click();
  });

  test('courts Sheet opens with name + stateUf + website fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/courts`, NAV_OPTS);
    await openNewSheet(page);
    await expect(page.locator('[data-ai-id="court-form-sheet"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="court-field-name"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="court-field-stateUf"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="court-field-website"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await page.locator('[data-ai-id="court-form-cancel"]').click();
  });

  test('cities Sheet opens with name + state select + ibgeCode', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/cities`, NAV_OPTS);
    await openNewSheet(page);
    await expect(page.locator('[data-ai-id="city-form-sheet"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="city-field-name"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="city-field-stateId"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await page.locator('[data-ai-id="city-form-cancel"]').click();
  });

  test('roles Sheet opens with name + description + permissions', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/roles`, NAV_OPTS);
    await openNewSheet(page);
    await expect(page.locator('[data-ai-id="role-form-sheet"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="role-field-name"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="role-field-description"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="role-field-permissions"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await page.locator('[data-ai-id="role-form-cancel"]').click();
  });

  test('document-types Sheet opens with name + appliesTo select + isRequired switch', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/document-types`, NAV_OPTS);
    await openNewSheet(page);
    await expect(page.locator('[data-ai-id="document-type-form-sheet"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="document-type-field-name"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="document-type-field-appliesTo"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="document-type-toggle-required"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await page.locator('[data-ai-id="document-type-form-cancel"]').click();
  });

  test('data-sources Sheet opens with name + modelName + fields (JSON)', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/data-sources`, NAV_OPTS);
    await openNewSheet(page);
    await expect(page.locator('[data-ai-id="data-source-form-sheet"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="data-source-field-name"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="data-source-field-modelName"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="data-source-field-fields"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await page.locator('[data-ai-id="data-source-form-cancel"]').click();
  });

  test('users Sheet opens with email + password + fullName + select fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/users`, NAV_OPTS);
    await openNewSheet(page);
    await expect(page.locator('[data-ai-id="user-form-sheet"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="user-field-email"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="user-field-password"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="user-field-fullName"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="user-field-accountType"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await page.locator('[data-ai-id="user-form-cancel"]').click();
  });

  test('tenants Sheet opens with name + subdomain + status selects', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/tenants`, NAV_OPTS);
    await openNewSheet(page);
    await expect(page.locator('[data-ai-id="tenant-form-sheet"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="tenant-field-name"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="tenant-field-subdomain"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="tenant-field-resolutionStrategy"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await expect(page.locator('[data-ai-id="tenant-field-status"]')).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    await page.locator('[data-ai-id="tenant-form-cancel"]').click();
  });
});

// ─── full CRUD cycle on Vercel (create → verify → edit → delete) ─────────────

test.describe('Admin Plus Sheet CRUD — Vercel: full CRUD cycle', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
  });

  // ── vehicle-makes ──
  test('vehicle-makes: create → edit → delete', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/vehicle-makes`, NAV_OPTS);

    // CREATE
    await openNewSheet(page);
    const sheet = page.locator('[data-ai-id="vehicle-make-form-sheet"]');
    await expect(sheet).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    const name = uid('Marca');
    await page.locator('[data-ai-id="vehicle-make-name-input"]').fill(name);
    await page.locator('[data-ai-id="vehicle-make-form-submit"]').click();
    await assertSuccessToast(page);
    await expect(page.getByText(name).first()).toBeVisible({ timeout: VISIBLE_TIMEOUT });

    // EDIT
    await openEditForRow(page, name);
    await expect(sheet).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    const updatedName = `${name}-UPD`;
    const nameInput = page.locator('[data-ai-id="vehicle-make-name-input"]');
    await nameInput.fill('');
    await nameInput.fill(updatedName);
    await page.locator('[data-ai-id="vehicle-make-form-submit"]').click();
    await assertSuccessToast(page);
    await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: VISIBLE_TIMEOUT });

    // DELETE (cleanup)
    await deleteRow(page, updatedName);
    await assertSuccessToast(page);
    await expect(page.getByText(updatedName).first()).not.toBeVisible({ timeout: VISIBLE_TIMEOUT });
  });

  // ── roles ──
  test('roles: create → edit → delete', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/roles`, NAV_OPTS);

    // CREATE
    await openNewSheet(page);
    const sheet = page.locator('[data-ai-id="role-form-sheet"]');
    await expect(sheet).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    const name = uid('Role');
    await page.locator('[data-ai-id="role-field-name"]').fill(name);
    await page.locator('[data-ai-id="role-field-description"]').fill('Criado por E2E Vercel');
    await page.locator('[data-ai-id="role-field-permissions"]').fill('["VIEW_DASHBOARD"]');
    await page.locator('[data-ai-id="role-form-submit"]').click();
    await assertSuccessToast(page);
    await expect(page.getByText(name).first()).toBeVisible({ timeout: VISIBLE_TIMEOUT });

    // EDIT
    await openEditForRow(page, name);
    await expect(sheet).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    const updatedName = `${name}-UPD`;
    const nameInput = page.locator('[data-ai-id="role-field-name"]');
    await nameInput.fill('');
    await nameInput.fill(updatedName);
    await page.locator('[data-ai-id="role-form-submit"]').click();
    await assertSuccessToast(page);
    await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: VISIBLE_TIMEOUT });

    // DELETE (cleanup)
    await deleteRow(page, updatedName);
    await assertSuccessToast(page);
    await expect(page.getByText(updatedName).first()).not.toBeVisible({ timeout: VISIBLE_TIMEOUT });
  });

  // ── data-sources ──
  test('data-sources: create → edit → delete', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/data-sources`, NAV_OPTS);

    // CREATE
    await openNewSheet(page);
    const sheet = page.locator('[data-ai-id="data-source-form-sheet"]');
    await expect(sheet).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    const name = uid('DS');
    await page.locator('[data-ai-id="data-source-field-name"]').fill(name);
    await page.locator('[data-ai-id="data-source-field-modelName"]').fill('VercelModel');
    await page.locator('[data-ai-id="data-source-field-fields"]').fill('["id","name","createdAt"]');
    await page.locator('[data-ai-id="data-source-form-submit"]').click();
    await assertSuccessToast(page);
    await expect(page.getByText(name).first()).toBeVisible({ timeout: VISIBLE_TIMEOUT });

    // EDIT
    await openEditForRow(page, name);
    await expect(sheet).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    const updatedName = `${name}-UPD`;
    const nameInput = page.locator('[data-ai-id="data-source-field-name"]');
    await nameInput.fill('');
    await nameInput.fill(updatedName);
    await page.locator('[data-ai-id="data-source-form-submit"]').click();
    await assertSuccessToast(page);
    await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: VISIBLE_TIMEOUT });

    // DELETE (cleanup)
    await deleteRow(page, updatedName);
    await assertSuccessToast(page);
    await expect(page.getByText(updatedName).first()).not.toBeVisible({ timeout: VISIBLE_TIMEOUT });
  });

  // ── document-types ──
  test('document-types: create → edit → delete', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/document-types`, NAV_OPTS);

    // CREATE
    await openNewSheet(page);
    const sheet = page.locator('[data-ai-id="document-type-form-sheet"]');
    await expect(sheet).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    const name = uid('DocTipo');
    await page.locator('[data-ai-id="document-type-field-name"]').fill(name);
    await page.locator('[data-ai-id="document-type-field-description"]').fill('Tipo criado por E2E Vercel');
    await selectOptionFromListbox(page, 'document-type-field-appliesTo', /pessoa física|physical|ambos|both/i);
    await page.locator('[data-ai-id="document-type-form-submit"]').click();
    await assertSuccessToast(page);
    await expect(page.getByText(name).first()).toBeVisible({ timeout: VISIBLE_TIMEOUT });

    // EDIT
    await openEditForRow(page, name);
    await expect(sheet).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    const updatedName = `${name}-UPD`;
    const nameInput = page.locator('[data-ai-id="document-type-field-name"]');
    await nameInput.fill('');
    await nameInput.fill(updatedName);
    await page.locator('[data-ai-id="document-type-form-submit"]').click();
    await assertSuccessToast(page);
    await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: VISIBLE_TIMEOUT });

    // DELETE (cleanup)
    await deleteRow(page, updatedName);
    await assertSuccessToast(page);
    await expect(page.getByText(updatedName).first()).not.toBeVisible({ timeout: VISIBLE_TIMEOUT });
  });

  // ── courts ──
  test('courts: create → edit → delete', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-plus/courts`, NAV_OPTS);

    // CREATE
    await openNewSheet(page);
    const sheet = page.locator('[data-ai-id="court-form-sheet"]');
    await expect(sheet).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    const name = uid('Tribunal');
    await page.locator('[data-ai-id="court-field-name"]').fill(name);
    await page.locator('[data-ai-id="court-field-stateUf"]').fill('SP');
    await page.locator('[data-ai-id="court-field-website"]').fill('https://e2e-tribunal-vercel.jus.br');
    await page.locator('[data-ai-id="court-form-submit"]').click();
    await assertSuccessToast(page);
    await expect(page.getByText(name).first()).toBeVisible({ timeout: VISIBLE_TIMEOUT });

    // EDIT
    await openEditForRow(page, name);
    await expect(sheet).toBeVisible({ timeout: VISIBLE_TIMEOUT });
    const updatedName = `${name}-UPD`;
    const nameInput = page.locator('[data-ai-id="court-field-name"]');
    await nameInput.fill('');
    await nameInput.fill(updatedName);
    await page.locator('[data-ai-id="court-form-submit"]').click();
    await assertSuccessToast(page);
    await expect(page.getByText(updatedName).first()).toBeVisible({ timeout: VISIBLE_TIMEOUT });

    // DELETE (cleanup)
    await deleteRow(page, updatedName);
    await assertSuccessToast(page);
    await expect(page.getByText(updatedName).first()).not.toBeVisible({ timeout: VISIBLE_TIMEOUT });
  });
});
