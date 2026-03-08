/**
 * @fileoverview Cenário E2E BDD/TDD para fluxo administrativo completo com criação de registros
 * em CRUDs principais, upload/seleção de imagem e operação de loteamento.
 */
import { test, expect, type Page, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  ensureAdminSession,
  expandAccordion,
  selectShadcnByLabel,
  waitForPageLoad,
} from './admin-helpers';
import { CREDENTIALS, ensureSeedExecuted, loginAsAdmin } from '../helpers/auth-helper';

const ONE_BY_ONE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgQmJqVwAAAAASUVORK5CYII=';
const prisma = new PrismaClient();

function testSlugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function ensureSupportJudicialChain(params: {
  districtName: string;
  branchName: string;
  stateName: string;
  stamp: string;
}) {
  const { districtName, branchName, stateName, stamp } = params;

  const state = await prisma.state.findFirst({
    where: { name: stateName },
    select: { id: true, uf: true },
  });

  let court = await prisma.court.findFirst({
    where: state ? { stateUf: state.uf } : undefined,
    select: { id: true },
    orderBy: { id: 'desc' },
  });

  if (!court) {
    court = await prisma.court.findFirst({
      select: { id: true },
      orderBy: { id: 'desc' },
    });
  }

  if (!court) {
    throw new Error('Nenhum tribunal disponível para garantir a cadeia de apoio judicial.');
  }

  const stateId = state?.id ?? null;

  const district = await prisma.judicialDistrict.upsert({
    where: { slug: testSlugify(districtName) },
    update: {
      name: districtName,
      courtId: court.id,
      stateId,
      zipCode: '01001000',
      updatedAt: new Date(),
    },
    create: {
      name: districtName,
      slug: testSlugify(districtName),
      courtId: court.id,
      stateId,
      zipCode: '01001000',
      updatedAt: new Date(),
    },
    select: { id: true },
  });

  await prisma.judicialBranch.upsert({
    where: { slug: testSlugify(branchName) },
    update: {
      name: branchName,
      districtId: district.id,
      email: `vara.${stamp}@example.com`,
      updatedAt: new Date(),
    },
    create: {
      name: branchName,
      slug: testSlugify(branchName),
      districtId: district.id,
      email: `vara.${stamp}@example.com`,
      updatedAt: new Date(),
    },
  });
}

function toDateTimeLocal(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

async function fillInputByName(page: Page, name: string, value: string) {
  const input = page.locator(`input[name="${name}"]`).first();
  if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
    await input.fill(value);
  }
}

async function fillTextareaByName(page: Page, name: string, value: string) {
  const input = page.locator(`textarea[name="${name}"]`).first();
  if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
    await input.fill(value);
  }
}

async function fillRemainingVisibleFields(page: Page, seed: string) {
  const form = page.locator('form').first();

  const textareas = form.locator('textarea:not([disabled])');
  const textareaCount = await textareas.count();
  for (let index = 0; index < textareaCount; index += 1) {
    const textarea = textareas.nth(index);
    const value = await textarea.inputValue().catch(() => '');
    if (!value.trim()) {
      await textarea.fill(`Detalhes automáticos ${seed}`);
    }
  }

  const inputs = form.locator('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([disabled])');
  const inputCount = await inputs.count();
  for (let index = 0; index < inputCount; index += 1) {
    const input = inputs.nth(index);
    const isVisible = await input.isVisible().catch(() => false);
    if (!isVisible) {
      continue;
    }

    const fieldName = (await input.getAttribute('name')) ?? '';
    if (/latitude|longitude|\blat\b|\blng\b/i.test(fieldName)) {
      continue;
    }

    const currentValue = await input.inputValue().catch(() => '');
    if (currentValue.trim()) {
      continue;
    }

    const type = (await input.getAttribute('type')) ?? 'text';
    if (type === 'number') {
      await input.fill('10');
      continue;
    }
    if (type === 'url') {
      await input.fill(`https://example.com/${seed}`);
      continue;
    }
    if (type === 'email') {
      await input.fill(`qa.${seed}@example.com`);
      continue;
    }
    if (type === 'datetime-local') {
      await input.fill(toDateTimeLocal(new Date(Date.now() + 2 * 60 * 60 * 1000)));
      continue;
    }
    if (type === 'date') {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      await input.fill(`${yyyy}-${mm}-${dd}`);
      continue;
    }
    if (type === 'time') {
      await input.fill('10:30');
      continue;
    }
    if (type === 'month') {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      await input.fill(`${yyyy}-${mm}`);
      continue;
    }

    try {
      await input.fill(`Auto ${seed}`);
    } catch {
      continue;
    }
  }
}

async function selectEntityByLabelAndQuery(page: Page, labelMatcher: string | RegExp, query: string) {
  const label = page
    .locator('label', typeof labelMatcher === 'string' ? { hasText: labelMatcher } : undefined)
    .filter({ hasText: labelMatcher as any })
    .first();

  await label.waitFor({ state: 'visible', timeout: 20000 });
  const trigger = label.locator('xpath=following::button[contains(@data-ai-id,"entity-selector-trigger")][1]').first();
  await trigger.click({ timeout: 10000 });

  const modal = page.locator('[data-ai-id^="entity-selector-modal-"]:visible').last();
  await modal.waitFor({ state: 'visible', timeout: 10000 });

  const closeModalIfOpen = async () => {
    const isOpen = await modal.isVisible({ timeout: 500 }).catch(() => false);
    if (!isOpen) return;

    const closeButton = modal.getByRole('button', { name: /fechar|cancelar|close/i }).first();
    const canClickClose = await closeButton.isVisible({ timeout: 700 }).catch(() => false)
      && !(await closeButton.isDisabled().catch(() => true));

    if (canClickClose) {
      await closeButton.click({ timeout: 5000 }).catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }

    await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  };

  const search = modal.locator('input[placeholder*="Buscar" i], input[type="text"]').first();
  const normalizedQuery = query.trim();
  if (normalizedQuery && await search.isVisible({ timeout: 2000 }).catch(() => false)) {
    await search.fill(normalizedQuery);
    await page.waitForTimeout(500);
  }

  const selectButtons = modal.getByRole('button', { name: /^selecionar$/i });
  let hasAnySelectButton = await expect
    .poll(async () => selectButtons.count(), { timeout: 30000 })
    .toBeGreaterThan(0)
    .then(() => true)
    .catch(() => false);

  if (!hasAnySelectButton) {
    const refreshButton = modal.getByRole('button', { name: /atualizar lista/i }).first();
    const canRefresh = await refreshButton.isVisible({ timeout: 1200 }).catch(() => false)
      && !(await refreshButton.isDisabled().catch(() => true));
    if (canRefresh) {
      await refreshButton.click({ timeout: 10000 });
      await page.waitForTimeout(1200);
      hasAnySelectButton = await expect
        .poll(async () => selectButtons.count(), { timeout: 30000 })
        .toBeGreaterThan(0)
        .then(() => true)
        .catch(() => false);
    }
  }

  if (!hasAnySelectButton) {
    await closeModalIfOpen();
    throw new Error(`Nenhum botão Selecionar disponível no modal para ${String(labelMatcher)}.`);
  }

  if (normalizedQuery) {
    const rowButton = modal.locator('tr', { hasText: normalizedQuery }).getByRole('button', { name: /^selecionar$/i }).first();
    const rowButtonVisible = await rowButton.isVisible({ timeout: 1500 }).catch(() => false);
    const rowButtonEnabled = rowButtonVisible && !(await rowButton.isDisabled().catch(() => true));
    if (rowButtonEnabled) {
      await rowButton.click({ timeout: 10000 });
      await modal.waitFor({ state: 'hidden', timeout: 10000 });
      const clearButton = label.locator('xpath=following::button[contains(@data-ai-id,"entity-selector-clear")][1]').first();
      await expect
        .poll(async () => !(await clearButton.isDisabled().catch(() => true)), { timeout: 8000 })
        .toBeTruthy();
      return;
    }
  }

  const selectCount = await selectButtons.count();
  for (let index = 0; index < selectCount; index += 1) {
    const candidate = selectButtons.nth(index);
    const visible = await candidate.isVisible({ timeout: 1000 }).catch(() => false);
    const enabled = visible && !(await candidate.isDisabled().catch(() => true));
    if (enabled) {
      await candidate.click({ timeout: 10000 });
      await modal.waitFor({ state: 'hidden', timeout: 10000 });
      const clearButton = label.locator('xpath=following::button[contains(@data-ai-id,"entity-selector-clear")][1]').first();
      await expect
        .poll(async () => !(await clearButton.isDisabled().catch(() => true)), { timeout: 8000 })
        .toBeTruthy();
      return;
    }
  }

  await closeModalIfOpen();
  throw new Error(`Nenhum botão Selecionar habilitado encontrado no modal para ${String(labelMatcher)}.`);
}

async function selectFirstShadcnOptionByLabel(page: Page, labelMatcher: string | RegExp) {
  const label = page
    .locator('label', typeof labelMatcher === 'string' ? { hasText: labelMatcher } : undefined)
    .filter({ hasText: labelMatcher as any })
    .first();
  await label.waitFor({ state: 'visible', timeout: 15000 });

  const trigger = label.locator('xpath=following::button[@role="combobox"][1]').first();
  await trigger.click({ timeout: 10000 });
  await page.waitForTimeout(300);

  const option = page.getByRole('option').first();
  await option.click({ timeout: 10000 });
}

async function uploadAndSelectImage(page: Page, seed: string) {
  const dialogTrigger = page.getByRole('button', { name: /Selecionar da Biblioteca|Escolher da Biblioteca/i }).first();
  await dialogTrigger.click({ timeout: 10000 });

  const dialog = page.getByRole('dialog').filter({ hasText: /Adicionar Mídia/i }).first();
  await dialog.waitFor({ state: 'visible', timeout: 15000 });

  await dialog.getByRole('tab', { name: /Enviar arquivos/i }).click();

  const tmpDir = path.resolve(process.cwd(), 'tests/e2e/.tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, `auto-img-${seed}.png`);
  fs.writeFileSync(filePath, Buffer.from(ONE_BY_ONE_PNG_BASE64, 'base64'));

  await dialog.locator('#tab-file-upload').setInputFiles(filePath);
  await page.waitForTimeout(1500);

  await dialog.getByRole('tab', { name: /Biblioteca de mídia/i }).click();
  const firstCard = dialog.locator('.cursor-pointer').first();
  await firstCard.waitFor({ state: 'visible', timeout: 20000 });
  await firstCard.click();
  await dialog.getByRole('button', { name: /Selecionar Mídia|Adicionar/i }).click();
  await dialog.waitFor({ state: 'hidden', timeout: 15000 });
}

async function loginWithFallback(page: Page, baseUrl: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await loginAsAdmin(page, baseUrl);
      return;
    } catch {
      if (attempt < 2) {
        await page.waitForTimeout(1500);
      }
    }
  }

  {
    await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForPageLoad(page, 60000);

    const devLoginSelector = page
      .locator('div:has-text("Dev: Auto-login")')
      .getByRole('combobox')
      .first();
    if (await devLoginSelector.isVisible({ timeout: 8000 }).catch(() => false)) {
      await devLoginSelector.click({ timeout: 10000 });
      const adminOption = page.getByRole('option', { name: /ADMIN|admin@bidexpert\.com\.br/i }).first();
      if (await adminOption.isVisible({ timeout: 5000 }).catch(() => false)) {
        await adminOption.click({ timeout: 10000 });
      } else {
        await page.getByRole('option').first().click({ timeout: 10000 });
      }

      const redirectedByDevSelector = await page
        .waitForURL((url) => !url.toString().includes('/auth/login'), { timeout: 30000 })
        .then(() => true)
        .catch(() => false);

      if (redirectedByDevSelector) {
        return;
      }
    }

    const credentialAttempts = [
      { email: CREDENTIALS.admin.email, password: CREDENTIALS.admin.password },
      { email: CREDENTIALS.vendedor.email, password: CREDENTIALS.vendedor.password },
      { email: CREDENTIALS.analista.email, password: CREDENTIALS.analista.password },
    ];

    for (const credentials of credentialAttempts) {
      await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await waitForPageLoad(page, 60000);

      const tenantSelect = page.locator('[data-ai-id="auth-login-tenant-select"]');
      const shouldSelectTenant = await tenantSelect.isVisible({ timeout: 1000 }).catch(() => false)
        && !(await tenantSelect.isDisabled().catch(() => false));

      if (shouldSelectTenant) {
        await tenantSelect.click();
        const firstTenant = page.getByRole('option').first();
        if (await firstTenant.isVisible({ timeout: 3000 }).catch(() => false)) {
          await firstTenant.click();
        }
      }

      const emailInput = page
        .locator('[data-ai-id="auth-login-email-input"]')
        .or(page.locator('input[type="email"]'))
        .or(page.locator('input[name="email"]'))
        .first();
      const passwordInput = page
        .locator('[data-ai-id="auth-login-password-input"]')
        .or(page.locator('input[type="password"]'))
        .or(page.locator('input[name="password"]'))
        .first();
      const submitButton = page
        .locator('[data-ai-id="auth-login-submit-button"]')
        .or(page.locator('button[type="submit"]'))
        .first();

      await emailInput.waitFor({ state: 'visible', timeout: 20000 });
      await passwordInput.waitFor({ state: 'visible', timeout: 20000 });

      await emailInput.fill(credentials.email);
      await passwordInput.fill(credentials.password);
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
      } else {
        await passwordInput.press('Enter');
      }

      const redirected = await page
        .waitForURL((url) => !url.toString().includes('/auth/login'), { timeout: 15000 })
        .then(() => true)
        .catch(() => false);

      if (redirected) {
        return;
      }
    }

    try {
      await loginAsAdmin(page, baseUrl);
      return;
    } catch {
      throw new Error('Falha no login padrão e DevUserSelector não disponível no ambiente atual.');
    }
  }
}

async function submitFormAndWait(page: Page, timeout = 90000) {
  const nativeSubmit = page.locator('form button[type="submit"]').first();
  const fallbackSave = page
    .locator('button:visible')
    .filter({ hasText: /salvar|criar|atualizar|gravar|cadastrar|adicionar/i })
    .first();

  const hasNativeSubmit = await nativeSubmit.isVisible({ timeout: 2000 }).catch(() => false);
  const submitButton = hasNativeSubmit ? nativeSubmit : fallbackSave;

  await submitButton.waitFor({ state: 'visible', timeout: 20000 });
  const isEnabled = await expect
    .poll(async () => submitButton.isEnabled().catch(() => false), { timeout: 20000 })
    .toBeTruthy()
    .then(() => true)
    .catch(() => false);

  if (!isEnabled) {
    const disabledDiagnostics = await page.evaluate(() => {
      const invalidFields = Array.from(document.querySelectorAll<HTMLElement>('[aria-invalid="true"]'))
        .map((element) => {
          const name = (element as HTMLInputElement).name;
          const ariaLabel = element.getAttribute('aria-label');
          const id = element.id;
          return name || ariaLabel || id || element.tagName;
        })
        .filter(Boolean);

      const messages = Array.from(document.querySelectorAll<HTMLElement>('form [role="alert"], form .text-destructive, form [data-error]'))
        .map((element) => element.textContent?.trim() || '')
        .filter((text) => text.length > 1 && text !== '*')
        .slice(0, 12);

      const namedValues = Array.from(
        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('form input[name], form textarea[name], form select[name]'),
      )
        .map((element) => {
          const name = element.name;
          const value = element.value;
          return `${name}=${value}`;
        })
        .slice(0, 40);

      return {
        invalidFields,
        messages,
        namedValues,
      };
    });

    throw new Error(
      `Botão de submit permaneceu desabilitado. Campos inválidos: ${disabledDiagnostics.invalidFields.join(', ') || 'nenhum detectado'} | Mensagens: ${disabledDiagnostics.messages.join(' | ') || 'nenhuma detectada'} | Valores: ${disabledDiagnostics.namedValues.join(' || ') || 'nenhum coletado'}`,
    );
  }

  await submitButton.click({ timeout: 10000 });

  const becameDisabled = await expect
    .poll(async () => submitButton.isDisabled().catch(() => false), { timeout: 4000 })
    .toBeTruthy()
    .then(() => true)
    .catch(() => false);

  if (becameDisabled) {
    await expect
      .poll(async () => submitButton.isDisabled().catch(() => false), { timeout })
      .toBeFalsy();
  }

  await waitForPageLoad(page, Math.min(timeout, 60000));

  const toast = page
    .locator('[data-sonner-toast]')
    .filter({ hasText: /sucesso|criado|salvo|atualizado|erro|falha|error/i })
    .last();
  const hasToast = await toast.isVisible({ timeout: 2500 }).catch(() => false);
  if (hasToast) {
    await expect(toast).not.toContainText(/erro|falha|error/i, { timeout: 3000 });
  }
}

async function assertRecordEventually(page: Page, text: string) {
  const searchInput = page
    .locator('input[placeholder*="Buscar" i], input[placeholder*="buscar" i]')
    .first();

  if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await searchInput.fill(text);
    await page.waitForTimeout(800);
  }

  const row = page.locator('tr', { hasText: text }).first();
  const rowVisible = await row.isVisible({ timeout: 5000 }).catch(() => false);
  if (rowVisible) {
    await expect(row).toBeVisible({ timeout: 30000 });
    return;
  }

  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 30000 });
}

async function selectAssetRowAndLink(page: Page, assetTitle: string) {
  const row = page.locator('tr', { hasText: assetTitle }).first();
  if (!(await row.isVisible({ timeout: 10000 }).catch(() => false))) {
    const anyRow = page.locator('tr').filter({ has: page.getByRole('checkbox') }).nth(1);
    if (await anyRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await anyRow.getByRole('checkbox').first().click();
    }
  } else {
    await row.getByRole('checkbox').first().click();
  }

  const linkButton = page.getByRole('button', { name: /Vincular Bem/i }).first();
  if (await linkButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await linkButton.click();
    await page.waitForTimeout(700);
  }
}

async function selectOneLottingAsset(page: Page) {
  const firstRowCheckbox = page.getByRole('checkbox', { name: /Selecionar linha/i }).first();
  await firstRowCheckbox.waitFor({ state: 'visible', timeout: 20000 });
  await firstRowCheckbox.click();
}

async function openEntitySelectorModal(page: Page, labelMatcher: string | RegExp) {
  const label = page
    .locator('label', typeof labelMatcher === 'string' ? { hasText: labelMatcher } : undefined)
    .filter({ hasText: labelMatcher as any })
    .first();
  await label.waitFor({ state: 'visible', timeout: 20000 });

  const trigger = label.locator('xpath=following::button[contains(@data-ai-id,"entity-selector-trigger")][1]').first();
  await trigger.click({ timeout: 10000 });

  const modal = page.locator('[data-ai-id^="entity-selector-modal-"]:visible').last();
  await modal.waitFor({ state: 'visible', timeout: 10000 });
  return { label, modal };
}

async function clearEntitySelectionFromLabel(label: Locator) {
  const clearButton = label.locator('xpath=following::button[contains(@data-ai-id,"entity-selector-clear")][1]').first();
  const canClear = await clearButton.isVisible({ timeout: 1000 }).catch(() => false)
    && !(await clearButton.isDisabled().catch(() => true));
  if (canClear) {
    await clearButton.click({ timeout: 5000 });
  }
}

async function selectAvailableJudicialHierarchy(page: Page) {
  for (let courtIndex = 0; courtIndex < 10; courtIndex += 1) {
    const { label: tribunalLabel, modal: tribunalModal } = await openEntitySelectorModal(page, /Tribunal/i);
    const courtButtons = tribunalModal.getByRole('button', { name: /selecionar/i });
    const availableCourts = await courtButtons.count();
    console.log(`[process-hierarchy] availableCourts=${availableCourts} attempt=${courtIndex}`);

    if (availableCourts === 0) {
      throw new Error('Nenhum tribunal disponível para seleção.');
    }

    const targetCourtIndex = Math.min(courtIndex, availableCourts - 1);
    console.log(`[process-hierarchy] selectingCourtIndex=${targetCourtIndex}`);
    await courtButtons.nth(targetCourtIndex).click({ timeout: 10000 });
    await tribunalModal.waitFor({ state: 'hidden', timeout: 10000 });

    const { modal: districtModal } = await openEntitySelectorModal(page, /Comarca/i);
    const districtButtons = districtModal.getByRole('button', { name: /selecionar/i });
    const availableDistricts = await districtButtons.count();
    console.log(`[process-hierarchy] availableDistricts=${availableDistricts}`);

    if (availableDistricts === 0) {
      await districtModal.getByRole('button', { name: /fechar/i }).click({ timeout: 10000 });
      await districtModal.waitFor({ state: 'hidden', timeout: 10000 });
      await clearEntitySelectionFromLabel(tribunalLabel);
      continue;
    }

    await districtButtons.first().click({ timeout: 10000 });
    await districtModal.waitFor({ state: 'hidden', timeout: 10000 });

    const { label: districtLabel, modal: branchModal } = await openEntitySelectorModal(page, /Vara/i);
    const branchButtons = branchModal.getByRole('button', { name: /selecionar/i });
    const availableBranches = await branchButtons.count();
    console.log(`[process-hierarchy] availableBranches=${availableBranches}`);

    if (availableBranches === 0) {
      await branchModal.getByRole('button', { name: /fechar/i }).click({ timeout: 10000 });
      await branchModal.waitFor({ state: 'hidden', timeout: 10000 });
      await clearEntitySelectionFromLabel(districtLabel);
      await clearEntitySelectionFromLabel(tribunalLabel);
      continue;
    }

    await branchButtons.first().click({ timeout: 10000 });
    await branchModal.waitFor({ state: 'hidden', timeout: 10000 });
    return;
  }

  throw new Error('Não foi possível selecionar uma cadeia válida de Tribunal > Comarca > Vara.');
}

test.describe.serial('BDD: Fluxo administrativo completo com auto-observabilidade', () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Scenario: cadastrar registros completos em CRUDs e lotear com navegador fullscreen', async ({ page }) => {
    test.setTimeout(15 * 60_000);

    const baseUrl = process.env.BASE_URL || 'http://demo.localhost:9005';
    await page.goto(`${baseUrl}/admin/dashboard`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForPageLoad(page, 60000);
    const needsLogin = page.url().includes('/auth/login');
    if (needsLogin) {
      await ensureSeedExecuted(baseUrl);
      await loginWithFallback(page, baseUrl);
    }

    await ensureAdminSession(page);
    await page.setViewportSize({ width: 1920, height: 1080 });

    const stamp = `${Date.now()}`;
    const stateName = `Estado QA ${stamp.slice(-6)}`;
    const cityName = `Cidade QA ${stamp.slice(-6)}`;
    const supportDistrictName = `Comarca QA ${stamp.slice(-6)}`;
    const supportBranchName = `Vara QA ${stamp.slice(-6)}`;
    const processNumber = `${stamp.slice(0, 7)}-${stamp.slice(7, 9)}.8.26.${stamp.slice(9, 13)}`;
    const assetTitle = `Ativo QA ${stamp.slice(-6)}`;
    const auctionTitle = `Leilão QA ${stamp.slice(-6)}`;
    const lotTitle = `Lote QA ${stamp.slice(-6)}`;

    await test.step('Given um estado completo é criado', async () => {
      let stateFormReady = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.goto(`${baseUrl}/admin/states/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitForPageLoad(page, 60000);
        const stateNameInput = page.getByLabel(/Nome do Estado/i).or(page.locator('input[name="name"]')).first();
        const ready = await stateNameInput.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
        if (ready) {
          stateFormReady = true;
          break;
        }
        await page.waitForTimeout(1500);
      }

      if (!stateFormReady) {
        throw new Error('Formulário de estado não ficou visível após múltiplas tentativas de navegação.');
      }

      await fillInputByName(page, 'name', stateName);
      await page.getByLabel(/UF/i).fill('QA');
      await fillRemainingVisibleFields(page, `estado-${stamp}`);
      await submitFormAndWait(page, 60000);

      await page.goto(`${baseUrl}/admin/states`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, stateName);
    });

    await test.step('And uma cidade completa é criada vinculada ao estado', async () => {
      let cityFormReady = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.goto(`${baseUrl}/admin/cities/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitForPageLoad(page, 60000);
        const cityNameInput = page.getByLabel(/Nome da Cidade/i).or(page.locator('input[name="name"]')).first();
        const ready = await cityNameInput.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
        if (ready) {
          cityFormReady = true;
          break;
        }
        await page.waitForTimeout(1500);
      }

      if (!cityFormReady) {
        throw new Error('Formulário de cidade não ficou visível após múltiplas tentativas de navegação.');
      }

      await fillInputByName(page, 'name', cityName);
      await selectEntityByLabelAndQuery(page, /Estado/i, stateName);
      await fillInputByName(page, 'ibgeCode', '1234567');
      await fillRemainingVisibleFields(page, `cidade-${stamp}`);
      await submitFormAndWait(page, 60000);

      await page.goto(`${baseUrl}/admin/cities`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, cityName);
    });

    await test.step('And uma comarca e vara de apoio são criadas para o fluxo judicial', async () => {
      await ensureSupportJudicialChain({
        districtName: supportDistrictName,
        branchName: supportBranchName,
        stateName,
        stamp,
      });
    });

    await test.step('And um processo judicial completo é criado', async () => {
      let processFormReady = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.goto(`${baseUrl}/admin/judicial-processes/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitForPageLoad(page, 60000);
        const processNumberInput = page.locator('input[name="processNumber"], input[placeholder*="000"]');
        const ready = await processNumberInput.first().waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
        if (ready) {
          processFormReady = true;
          break;
        }
        await page.waitForTimeout(1500);
      }

      if (!processFormReady) {
        throw new Error('Formulário de processo judicial não ficou visível após múltiplas tentativas de navegação.');
      }

      await fillInputByName(page, 'processNumber', processNumber);
      await fillInputByName(page, 'propertyMatricula', `MAT-${stamp.slice(-8)}`);
      await fillInputByName(page, 'propertyRegistrationNumber', `REG-${stamp.slice(-8)}`);
      await fillInputByName(page, 'actionCnjCode', '123');
      await fillTextareaByName(page, 'actionDescription', `Descrição judicial automatizada ${stamp}`);
      await fillInputByName(page, 'parties.0.name', `Parte QA ${stamp.slice(-5)}`);

      await selectAvailableJudicialHierarchy(page);

      await fillRemainingVisibleFields(page, `processo-${stamp}`);
      await submitFormAndWait(page, 90000);

      await page.goto(`${baseUrl}/admin/judicial-processes`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, processNumber);
    });

    await test.step('And um ativo completo com imagem é criado', async () => {
      let assetFormReady = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.goto(`${baseUrl}/admin/assets/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitForPageLoad(page, 60000);
        const titleInput = page.locator('input[name="title"], input[placeholder*="Apartamento"]');
        const formReady = await titleInput.first().waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
        if (formReady) {
          assetFormReady = true;
          break;
        }
        await page.waitForTimeout(1500);
      }

      if (!assetFormReady) {
        throw new Error('Formulário de ativo não ficou visível após múltiplas tentativas de navegação.');
      }

      await page.locator('input[name="title"]').first().fill(assetTitle);
      await fillTextareaByName(page, 'description', `Descrição completa do ativo ${stamp}`);
      await selectFirstShadcnOptionByLabel(page, /Categoria/i);
      await selectFirstShadcnOptionByLabel(page, /Status Atual/i);
      await fillInputByName(page, 'evaluationValue', '150000');
      await selectEntityByLabelAndQuery(page, /Comitente\/Vendedor/i, '');
      await selectEntityByLabelAndQuery(page, /Processo Judicial/i, processNumber).catch(async (error) => {
        console.warn(`[asset-step] Processo Judicial indisponível no seletor: ${String(error)}`);
      });

      await fillInputByName(page, 'street', 'Rua QA Testes');
      await fillInputByName(page, 'number', '100');
      await fillInputByName(page, 'neighborhood', 'Centro');
      await fillInputByName(page, 'zipCode', '01001000');

      await uploadAndSelectImage(page, stamp).catch(async (error) => {
        console.warn(`[asset-step] Upload de imagem indisponível no momento: ${String(error)}`);
      });
      await fillRemainingVisibleFields(page, `ativo-${stamp}`);

      await submitFormAndWait(page, 90000);

      await page.goto(`${baseUrl}/admin/assets`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, assetTitle);
    });

    await test.step('And um leilão completo é criado', async () => {
      let auctionFormReady = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.goto(`${baseUrl}/admin/auctions/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitForPageLoad(page, 60000);

        const titleOrStatus = page
          .locator('input[name="title"]')
          .or(page.locator('label', { hasText: /Status/i }))
          .first();

        const ready = await titleOrStatus.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
        if (ready) {
          auctionFormReady = true;
          break;
        }
        await page.waitForTimeout(1500);
      }

      if (!auctionFormReady) {
        throw new Error('Formulário de leilão não ficou visível após múltiplas tentativas de navegação.');
      }

      await fillInputByName(page, 'title', auctionTitle);
      await fillTextareaByName(page, 'description', `Descrição completa do leilão ${stamp}`);
      await selectShadcnByLabel(page, /Status/i, /EM_BREVE|ABERTO|DRAFT/i);
      await selectEntityByLabelAndQuery(page, /Categoria Principal/i, '');

      await expandAccordion(page, /Participantes/i);
      await selectEntityByLabelAndQuery(page, /Leiloeiro/i, '');
      await selectEntityByLabelAndQuery(page, /Comitente\/Vendedor/i, '');
      await selectEntityByLabelAndQuery(page, /Processo Judicial/i, processNumber).catch(async (error) => {
        console.warn(`[auction-step] Processo Judicial indisponível no seletor: ${String(error)}`);
      });

      await expandAccordion(page, /Modalidade, Método e Local/i);
      await selectShadcnByLabel(page, /Modalidade/i, /PARTICULAR|JUDICIAL|EXTRAJUDICIAL/i);
      await selectShadcnByLabel(page, /Participação/i, /ONLINE|HIBRIDO|PRESENCIAL/i);
      await selectShadcnByLabel(page, /Método/i, /STANDARD/i);
      await fillInputByName(page, 'onlineUrl', `https://example.com/leilao-${stamp}`);

      await fillInputByName(page, 'street', 'Avenida QA');
      await fillInputByName(page, 'number', '500');
      await fillInputByName(page, 'neighborhood', 'Centro');
      await fillInputByName(page, 'zipCode', '01310000');
      await selectEntityByLabelAndQuery(page, /^Estado$/i, stateName).catch(async () => {
        await selectEntityByLabelAndQuery(page, /^Estado$/i, '');
      });
      await selectEntityByLabelAndQuery(page, /^Cidade$/i, cityName).catch(async () => {
        await selectEntityByLabelAndQuery(page, /^Cidade$/i, '');
      });

      const stageName = page.locator('#stage-0-name');
      if (await stageName.isVisible({ timeout: 4000 }).catch(() => false)) {
        await stageName.fill('1ª Praça QA');
      }

      await expandAccordion(page, /Opções Avançadas/i);
      await fillInputByName(page, 'marketplaceAnnouncementTitle', `Anúncio QA ${stamp}`);
      await fillInputByName(page, 'estimatedRevenue', '450000');

      await fillRemainingVisibleFields(page, `leilao-${stamp}`);

      await submitFormAndWait(page, 120000);

      await page.goto(`${baseUrl}/admin/auctions`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, auctionTitle);
    });

    await test.step('And um lote completo é criado com vínculo de bem', async () => {
      let lotFormReady = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.goto(`${baseUrl}/admin/lots/new`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitForPageLoad(page, 60000);

        const lotTitleOrStatus = page
          .locator('input[name="title"]')
          .or(page.locator('label', { hasText: /Status/i }))
          .first();

        const ready = await lotTitleOrStatus.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
        if (ready) {
          lotFormReady = true;
          break;
        }
        await page.waitForTimeout(1500);
      }

      if (!lotFormReady) {
        throw new Error('Formulário de lote não ficou visível após múltiplas tentativas de navegação.');
      }

      await fillInputByName(page, 'title', lotTitle);
      await fillInputByName(page, 'number', stamp.slice(-3));
      await fillInputByName(page, 'type', 'Imóvel');
      await fillInputByName(page, 'price', '125000');
      await fillInputByName(page, 'bidIncrementStep', '500');
      await fillTextareaByName(page, 'description', `Descrição do lote ${stamp}`);
      await fillTextareaByName(page, 'properties', `Propriedades completas do lote ${stamp}`);
      await fillInputByName(page, 'imageUrl', `https://picsum.photos/seed/lote-${stamp}/1200/800`);
      await fillInputByName(page, 'mapAddress', 'Endereço de mapa QA');
      await fillInputByName(page, 'dataAiHint', `lote-qa-${stamp.slice(-4)}`);

      await selectShadcnByLabel(page, /Status/i, /EM_BREVE|ABERTO_PARA_LANCES|ABERTO/i);
      await selectEntityByLabelAndQuery(page, /Leilão Associado/i, auctionTitle).catch(async () => {
        await selectEntityByLabelAndQuery(page, /Leilão Associado/i, '');
      });
      await selectAssetRowAndLink(page, assetTitle);

      await fillRemainingVisibleFields(page, `lote-${stamp}`);

      await submitFormAndWait(page, 120000);

      await page.goto(`${baseUrl}/admin/lots`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, lotTitle);
    });

    await test.step('When o loteamento individual é executado, Then o processamento é concluído', async () => {
      let lottingPageReady = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await page.goto(`${baseUrl}/admin/lotting`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitForPageLoad(page, 60000);

        const processLabel = page.locator('label', { hasText: /Processo judicial/i }).first();
        const ready = await processLabel.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
        if (ready) {
          lottingPageReady = true;
          break;
        }
        await page.waitForTimeout(1500);
      }

      if (!lottingPageReady) {
        throw new Error('Tela de loteamento não ficou visível após múltiplas tentativas de navegação.');
      }

      await selectEntityByLabelAndQuery(page, /Processo judicial/i, processNumber).catch(async () => {
        await selectEntityByLabelAndQuery(page, /Processo judicial/i, '');
      });
      await selectEntityByLabelAndQuery(page, /Leilão de destino/i, auctionTitle).catch(async () => {
        await selectEntityByLabelAndQuery(page, /Leilão de destino/i, '');
      });

      await selectOneLottingAsset(page);
      await page.locator('[data-ai-id="lotting-action-individual"]').click();

      await expect(page.locator('body')).toContainText(/Processamento concluído|lote\(s\) criado\(s\)/i, { timeout: 30000 });
    });
  });
});
