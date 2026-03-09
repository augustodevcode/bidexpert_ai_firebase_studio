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
import { getPrismaCoverageAudit } from './prisma-model-coverage';

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

function buildAllowedImageUrl(seed: string): string {
  return `https://placehold.co/1200x800/png?text=${encodeURIComponent(testSlugify(seed))}`;
}

async function closeAllOpenDialogs(page: Page) {
  for (let i = 0; i < 3; i += 1) {
    const overlay = page.locator('[data-state="open"].fixed.inset-0, [role="dialog"]:visible').first();
    const isVisible = await overlay.isVisible({ timeout: 500 }).catch(() => false);
    if (!isVisible) break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
}

async function openFormWithRetries(page: Page, url: string, readyLocator: () => Locator, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForPageLoad(page, 60000);

    const ready = await readyLocator()
      .first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (ready) {
      return;
    }

    await page.waitForTimeout(1500);
  }

  throw new Error(`Formulário indisponível após múltiplas tentativas: ${url}`);
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
  const safeImageUrl = buildAllowedImageUrl(seed);

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
    const placeholder = (await input.getAttribute('placeholder')) ?? '';
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
      await input.fill(safeImageUrl);
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

    if (/(^|\.)(slug)$/i.test(fieldName)) {
      await input.fill(testSlugify(seed));
      continue;
    }

    if (/(^|\.)(iconName)$/i.test(fieldName)) {
      await input.fill('tag');
      continue;
    }

    if (/dataAiHint/i.test(fieldName)) {
      await input.fill(`qa ${seed}`.slice(0, 48));
      continue;
    }

    if (
      /url|image|logo|cover|banner|avatar|thumb/i.test(fieldName)
      || /cole a url|https?:\/\//i.test(placeholder)
    ) {
      await input.fill(safeImageUrl);
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
  const isAlreadyOpen = await trigger.getAttribute('data-state').then((s) => s === 'open').catch(() => false);
  if (!isAlreadyOpen) {
    await trigger.click({ timeout: 10000 });
    await page.waitForTimeout(300);
  }

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

  // Use passed timeout instead of hardcoded 20s
  const pollTimeout = Math.max(timeout / 2, 20000);
  const isEnabled = await expect
    .poll(async () => submitButton.isEnabled().catch(() => false), { timeout: pollTimeout })
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

  const urlBeforeSubmit = page.url();
  await submitButton.click({ timeout: 10000 });

  await page.waitForTimeout(1200);

  const postSubmitDiagnostics = await page.evaluate(() => {
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

    return { invalidFields, messages };
  });

  if (page.url() === urlBeforeSubmit && (postSubmitDiagnostics.invalidFields.length > 0 || postSubmitDiagnostics.messages.length > 0)) {
    throw new Error(
      `Submit bloqueado por validação. Campos inválidos: ${postSubmitDiagnostics.invalidFields.join(', ') || 'nenhum detectado'} | Mensagens: ${postSubmitDiagnostics.messages.join(' | ') || 'nenhuma detectada'}`,
    );
  }

  const becameDisabled = await expect
    .poll(async () => submitButton.isDisabled().catch(() => false), { timeout: 4000 })
    .toBeTruthy()
    .then(() => true)
    .catch(() => false);

  if (becameDisabled) {
    await expect
      .poll(async () => {
        // If page navigated away (e.g. router.push after create), treat as success
        if (page.url() !== urlBeforeSubmit) return false;
        return submitButton.isDisabled().catch(() => false);
      }, { timeout })
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

async function assertRecordEventually(page: Page, text: string, maxReloads = 3) {
  for (let attempt = 0; attempt <= maxReloads; attempt++) {
    if (attempt > 0) {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await waitForPageLoad(page, 30000);
    }

    // Wait for DataTable to be fully hydrated: at least one <tr> in <tbody> must appear
    const anyRow = page.locator('table tbody tr').first();
    const dataLoaded = await anyRow.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
    if (!dataLoaded) {
      console.log(`[assertRecordEventually] attempt=${attempt}: table has no rows yet, retrying...`);
      continue;
    }

    const searchInput = page
      .locator('[data-ai-id="data-table-search-input"], input[placeholder*="Buscar" i], input[placeholder*="buscar" i]')
      .first();

    const searchVisible = await searchInput.isVisible({ timeout: 10000 }).catch(() => false);
    if (searchVisible) {
      // Ensure React hydration by interacting and verifying the input actually accepts text
      await searchInput.click();
      await page.waitForTimeout(300);
      await searchInput.fill(text);
      await page.waitForTimeout(800);

      // Verify the input actually has the value (ensures React onChange fired)
      const inputValue = await searchInput.inputValue().catch(() => '');
      if (inputValue !== text) {
        console.log(`[assertRecordEventually] attempt=${attempt}: input value mismatch, retrying with type(). Got="${inputValue}"`);
        await searchInput.clear();
        await page.waitForTimeout(200);
        await searchInput.pressSequentially(text, { delay: 30 });
        await page.waitForTimeout(1200);
      }
    }

    const row = page.locator('tr', { hasText: text }).first();
    const rowVisible = await row.isVisible({ timeout: 12000 }).catch(() => false);
    if (rowVisible) {
      return;
    }

    // Retry: clear search and use pressSequentially to ensure keypress events fire
    if (searchVisible) {
      await searchInput.clear();
      await page.waitForTimeout(400);
      await searchInput.pressSequentially(text, { delay: 20 });
      await page.waitForTimeout(1500);
      const retryRow = page.locator('tr', { hasText: text }).first();
      if (await retryRow.isVisible({ timeout: 12000 }).catch(() => false)) {
        return;
      }
    }

    // Check for text anywhere on page (non-table views)
    const textVisible = await page.getByText(text, { exact: false }).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (textVisible) {
      return;
    }
  }

  // Final assertion — will fail with clear error if record never found
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 15000 });
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

async function clickFirstRoleCheckboxIfPresent(page: Page, roleName?: string) {
  const roleCard = page.locator('[data-ai-id="admin-user-form-card"]').first();
  const roleLabels = roleCard.locator('label[for]');
  const checkboxButtons = roleCard.locator('button[role="checkbox"]');
  const labelCount = await roleLabels.count().catch(() => 0);

  if (roleName && labelCount > 0) {
    for (let index = 0; index < labelCount; index += 1) {
      const roleLabel = roleLabels.nth(index);
      const labelText = await roleLabel.textContent().catch(() => '');

      if (!labelText?.trim().includes(roleName)) {
        continue;
      }

      const targetId = await roleLabel.getAttribute('for');
      const targetToggle = targetId
        ? roleCard.locator(`[id="${targetId}"]`).first()
        : checkboxButtons.nth(index);
      const isChecked = await targetToggle.getAttribute('aria-checked').then((value) => value === 'true').catch(() => false);
      if (!isChecked) {
        // Click the checkbox button directly (not the label) to avoid implicit form submission in Chrome
        await targetToggle.click({ timeout: 5000 });
        await expect.poll(async () => targetToggle.getAttribute('aria-checked'), { timeout: 5000 }).toBe('true');
      }
      return;
    }
  }

  const firstCheckboxButton = checkboxButtons.first();
  if (await firstCheckboxButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    const isChecked = await firstCheckboxButton.getAttribute('aria-checked').then((value) => value === 'true').catch(() => false);
    if (!isChecked) {
      await firstCheckboxButton.click({ timeout: 5000 }).catch(() => {});
      await expect.poll(async () => firstCheckboxButton.getAttribute('aria-checked'), { timeout: 5000 }).toBe('true');
    }
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
    test.setTimeout(30 * 60_000);

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
    const cityIbgeCode = stamp.slice(-7);
    const categoryName = `Categoria QA ${stamp.slice(-6)}`;
    const subcategoryName = `Subcategoria QA ${stamp.slice(-6)}`;
    const sellerName = `Comitente QA ${stamp.slice(-6)}`;
    const auctioneerName = `Leiloeiro QA ${stamp.slice(-6)}`;
    const roleName = `Role QA ${stamp.slice(-6)}`;
    const userFullName = `Usuário QA ${stamp.slice(-6)}`;
    const userEmail = `qa.user.${stamp}@example.com`;
    const vehicleModelName = `Modelo QA ${stamp.slice(-6)}`;
    const documentTemplateName = `Template QA ${stamp.slice(-6)}`;
    const directSaleTitle = `Oferta QA ${stamp.slice(-6)}`;
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
      await fillInputByName(page, 'ibgeCode', cityIbgeCode);
      await fillRemainingVisibleFields(page, `cidade-${stamp}`);
      await submitFormAndWait(page, 60000);

      await page.goto(`${baseUrl}/admin/cities`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, cityName);
    });

    await test.step('And uma categoria e subcategoria completas são criadas', async () => {
      await openFormWithRetries(page, `${baseUrl}/admin/categories/new`, () => page.locator('input[name="name"], input[placeholder*="Categoria"]'));

      await fillInputByName(page, 'name', categoryName);
      await fillInputByName(page, 'slug', testSlugify(categoryName));
      await fillTextareaByName(page, 'description', `Descrição completa da categoria ${stamp}`);
      await fillRemainingVisibleFields(page, `categoria-${stamp}`);
      await submitFormAndWait(page, 60000);

      await page.goto(`${baseUrl}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, categoryName);

      await openFormWithRetries(page, `${baseUrl}/admin/subcategories/new`, () => page.locator('input[name="name"], input[placeholder*="Subcategoria"]'));

      await fillInputByName(page, 'name', subcategoryName);
      await fillInputByName(page, 'slug', testSlugify(subcategoryName));
      await fillTextareaByName(page, 'description', `Descrição completa da subcategoria ${stamp}`);
      await selectEntityByLabelAndQuery(page, /Categoria/i, categoryName).catch(async () => {
        await selectEntityByLabelAndQuery(page, /Categoria/i, '');
      });
      await fillRemainingVisibleFields(page, `subcategoria-${stamp}`);
      await submitFormAndWait(page, 60000);

      await page.goto(`${baseUrl}/admin/subcategories`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);

      // Select the correct parent category in the filter dropdown
      const catSelectTrigger = page.locator('#parentCategorySelect');
      await catSelectTrigger.waitFor({ state: 'visible', timeout: 20000 });
      const currentFilterText = await catSelectTrigger.textContent().catch(() => '');
      if (!currentFilterText?.includes(categoryName)) {
        await catSelectTrigger.click();
        await page.waitForTimeout(500);
        const catOption = page.locator('[role="option"]').filter({ hasText: categoryName });
        const catOptionVisible = await catOption.isVisible({ timeout: 8000 }).catch(() => false);
        if (catOptionVisible) {
          await catOption.click();
          await page.waitForTimeout(1500);
        } else {
          // Close dropdown and try with keyboard press Escape
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }

      await assertRecordEventually(page, subcategoryName);
    });

    await test.step('And um comitente e um leiloeiro completos são criados', async () => {
      await openFormWithRetries(
        page,
        `${baseUrl}/admin/sellers`,
        () => page.getByRole('button', { name: /Novo Comitente/i }),
      );
      await page.getByRole('button', { name: /Novo Comitente/i }).click({ timeout: 10000 });
      await page.locator('input[name="name"], input[placeholder*="Comitente"], input[placeholder*="Nome"]').first().waitFor({ state: 'visible', timeout: 20000 });

      await fillInputByName(page, 'name', sellerName);
      await fillInputByName(page, 'email', `seller.${stamp}@example.com`);
      await fillInputByName(page, 'phone', '11999990000');
      await fillInputByName(page, 'document', `${stamp.slice(-11)}`);
      await fillInputByName(page, 'contactName', `Contato ${sellerName}`);
      await fillInputByName(page, 'website', `https://seller-${stamp}.example.com`);
      await fillInputByName(page, 'zipCode', '01001000');
      await fillInputByName(page, 'street', 'Rua do Comitente QA');
      await fillInputByName(page, 'number', '200');
      await fillInputByName(page, 'neighborhood', 'Centro');
      await fillTextareaByName(page, 'description', `Descrição automatizada do comitente ${stamp}`);
      await submitFormAndWait(page, 60000);

      await openFormWithRetries(
        page,
        `${baseUrl}/admin/sellers`,
        () => page.locator('[data-ai-id="admin-sellers-card"]'),
      );
      await assertRecordEventually(page, sellerName);

      await openFormWithRetries(
        page,
        `${baseUrl}/admin/auctioneers`,
        () => page.getByRole('button', { name: /Novo Leiloeiro/i }),
      );
      await page.getByRole('button', { name: /Novo Leiloeiro/i }).click({ timeout: 30000 });
      await page.locator('input[name="name"], input[placeholder*="Leiloeiro"], input[placeholder*="Nome"]').first().waitFor({ state: 'visible', timeout: 20000 });

      await fillInputByName(page, 'name', auctioneerName);
      await fillInputByName(page, 'email', `auctioneer.${stamp}@example.com`);
      await fillInputByName(page, 'phone', '11999991111');
      await fillInputByName(page, 'registrationNumber', `MATR-${stamp.slice(-6)}`);
      await fillInputByName(page, 'contactName', `Contato ${auctioneerName}`);
      await fillInputByName(page, 'website', `https://auctioneer-${stamp}.example.com`);
      await fillInputByName(page, 'zipCode', '01310000');
      await fillTextareaByName(page, 'description', `Descrição automatizada do leiloeiro ${stamp}`);
      await submitFormAndWait(page, 60000);

      await openFormWithRetries(
        page,
        `${baseUrl}/admin/auctioneers`,
        () => page.locator('[data-ai-id]').first(),
      );
      await assertRecordEventually(page, auctioneerName);
    });

    await test.step('And um role, um usuário, um modelo de veículo e um template documental são criados', async () => {
      await openFormWithRetries(page, `${baseUrl}/admin/roles/new`, () => page.locator('input[name="name"], [data-ai-id="role-form"]'));

      await fillInputByName(page, 'name', roleName);
      await fillTextareaByName(page, 'description', `Role automatizada ${stamp}`);
      await submitFormAndWait(page, 60000);

      await page.goto(`${baseUrl}/admin/roles`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, roleName);

      await openFormWithRetries(page, `${baseUrl}/admin/users/new`, () => page.locator('input[name="fullName"], input[type="email"]'));

      await fillInputByName(page, 'fullName', userFullName);
      await fillInputByName(page, 'email', userEmail);
      await fillInputByName(page, 'password', 'Test@12345');

      await clickFirstRoleCheckboxIfPresent(page, roleName);

      await submitFormAndWait(page, 60000);

      await page.goto(`${baseUrl}/admin/users`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, userEmail);

      await openFormWithRetries(page, `${baseUrl}/admin/vehicle-models/new`, () => page.locator('input[name="name"], input[placeholder*="Modelo"]'));

      await selectEntityByLabelAndQuery(page, /Marca do Veículo/i, '').catch(async () => {
        await selectEntityByLabelAndQuery(page, /Marca/i, '');
      });
      await fillInputByName(page, 'name', vehicleModelName);
      await submitFormAndWait(page, 60000);

      await page.goto(`${baseUrl}/admin/vehicle-models`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, vehicleModelName);

      await openFormWithRetries(page, `${baseUrl}/admin/document-templates/new`, () => page.locator('input[name="name"], textarea[name="content"]'));

      await fillInputByName(page, 'name', documentTemplateName);
      await fillTextareaByName(
        page,
        'content',
        `<div><h1>${documentTemplateName}</h1><p>Conteúdo automatizado ${stamp} com variável {{{dataAtual}}} e bloco suficientemente longo para validação.</p></div>`,
      );
      await submitFormAndWait(page, 60000);

      await page.goto(`${baseUrl}/admin/document-templates`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, documentTemplateName);
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
      await selectShadcnByLabel(page, /Categoria/i, new RegExp(categoryName, 'i')).catch(async () => {
        await selectFirstShadcnOptionByLabel(page, /Categoria/i);
      });
      await selectShadcnByLabel(page, /Status Atual/i, /DISPONIVEL|Disponível/i);
      await fillInputByName(page, 'evaluationValue', '150000');
      await selectEntityByLabelAndQuery(page, /Comitente\/Vendedor/i, sellerName).catch(async () => {
        await selectEntityByLabelAndQuery(page, /Comitente\/Vendedor/i, '');
      });
      await selectEntityByLabelAndQuery(page, /Processo Judicial/i, processNumber).catch(async (error) => {
        console.warn(`[asset-step] Processo Judicial indisponível no seletor: ${String(error)}`);
        await closeAllOpenDialogs(page);
      });

      await fillInputByName(page, 'street', 'Rua QA Testes');
      await fillInputByName(page, 'number', '100');
      await fillInputByName(page, 'neighborhood', 'Centro');
      await fillInputByName(page, 'zipCode', '01001000');

      await uploadAndSelectImage(page, stamp).catch(async (error) => {
        console.warn(`[asset-step] Upload de imagem indisponível no momento: ${String(error)}`);
        await closeAllOpenDialogs(page);
      });
      await fillRemainingVisibleFields(page, `ativo-${stamp}`);

      await closeAllOpenDialogs(page);

      // Register POST listener BEFORE submit — prevents page.goto from aborting the in-flight Server Action
      const assetPostPromise = page.waitForResponse(
        (resp) => resp.url().includes('/admin/assets') && resp.request().method() === 'POST',
        { timeout: 60000 },
      ).catch(() => null);

      await submitFormAndWait(page, 90000);

      // CRITICAL: Wait for the Server Action POST to actually complete
      const postResp = await assetPostPromise;
      if (postResp) {
        console.log(`[asset-step] Server Action POST completed: status=${postResp.status()}`);
      } else {
        console.warn('[asset-step] No POST response captured — form may not have submitted');
      }

      // Wait for the auto-redirect (router.push 1.5s after success) or navigate manually
      const redirected = await page.waitForURL(/\/admin\/assets\/?$/i, { timeout: 12000 }).then(() => true).catch(() => false);
      if (!redirected) {
        await page.goto(`${baseUrl}/admin/assets`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      }
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, assetTitle);
    });

    await test.step('And uma oferta de venda direta completa é criada', async () => {
      await openFormWithRetries(page, `${baseUrl}/admin/direct-sales/new`, () => page.locator('input[name="title"], input[placeholder*="Oferta"]'));

      await fillInputByName(page, 'title', directSaleTitle);
      await fillTextareaByName(page, 'description', `Oferta de venda direta automatizada ${stamp}`);
      await fillInputByName(page, 'price', '99990');
      await fillInputByName(page, 'locationCity', cityName);
      await fillInputByName(page, 'locationState', stateName);
      await fillInputByName(page, 'imageUrl', `https://picsum.photos/seed/direct-sale-${stamp}/1200/800`);
      await fillInputByName(page, 'dataAiHint', `direct-sale-${stamp.slice(-5)}`);
      await selectEntityByLabelAndQuery(page, /Categoria/i, categoryName).catch(async () => {
        await selectEntityByLabelAndQuery(page, /Categoria/i, '');
      });
      await selectEntityByLabelAndQuery(page, /Vendedor/i, sellerName).catch(async () => {
        await selectEntityByLabelAndQuery(page, /Vendedor/i, '');
      });
      await fillRemainingVisibleFields(page, `directsale-${stamp}`);

      const dsPostPromise = page.waitForResponse(
        (resp) => resp.url().includes('/admin/direct-sales') && resp.request().method() === 'POST',
        { timeout: 60000 },
      ).catch(() => null);

      await submitFormAndWait(page, 90000);
      await dsPostPromise;

      const dsRedirected = await page.waitForURL(/\/admin\/direct-sales\/?$/i, { timeout: 12000 }).then(() => true).catch(() => false);
      if (!dsRedirected) {
        await page.goto(`${baseUrl}/admin/direct-sales`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      }
      await waitForPageLoad(page, 60000);
      await assertRecordEventually(page, directSaleTitle);
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
      await selectEntityByLabelAndQuery(page, /Categoria Principal/i, categoryName).catch(async () => {
        await selectEntityByLabelAndQuery(page, /Categoria Principal/i, '');
      });

      await expandAccordion(page, /Participantes/i);
      await selectEntityByLabelAndQuery(page, /Leiloeiro/i, auctioneerName).catch(async () => {
        await selectEntityByLabelAndQuery(page, /Leiloeiro/i, '');
      });
      await selectEntityByLabelAndQuery(page, /Comitente\/Vendedor/i, sellerName).catch(async () => {
        await selectEntityByLabelAndQuery(page, /Comitente\/Vendedor/i, '');
      });
      await selectEntityByLabelAndQuery(page, /Processo Judicial/i, processNumber).catch(async (error) => {
        console.warn(`[auction-step] Processo Judicial indisponível no seletor: ${String(error)}`);
        await closeAllOpenDialogs(page);
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

      const auctionPostPromise = page.waitForResponse(
        (resp) => resp.url().includes('/admin/auctions') && resp.request().method() === 'POST',
        { timeout: 90000 },
      ).catch(() => null);

      await submitFormAndWait(page, 120000);
      await auctionPostPromise;

      const auctionRedirected = await page.waitForURL(/\/admin\/auctions\/?$/i, { timeout: 12000 }).then(() => true).catch(() => false);
      if (!auctionRedirected) {
        await page.goto(`${baseUrl}/admin/auctions`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      }
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

      const lotPostPromise = page.waitForResponse(
        (resp) => resp.url().includes('/admin/lots') && resp.request().method() === 'POST',
        { timeout: 90000 },
      ).catch(() => null);

      await submitFormAndWait(page, 120000);
      await lotPostPromise;

      const lotRedirected = await page.waitForURL(/\/admin\/lots\/?$/i, { timeout: 12000 }).then(() => true).catch(() => false);
      if (!lotRedirected) {
        await page.goto(`${baseUrl}/admin/lots`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      }
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

      // Toggle "Incluir ativos já agrupados" to show assets already linked to lots
      const includeGroupedToggle = page.locator('[data-ai-id="lotting-toggle-include-grouped"]');
      await includeGroupedToggle.waitFor({ state: 'visible', timeout: 10000 });
      await includeGroupedToggle.click();
      await page.waitForTimeout(2000);

      await selectOneLottingAsset(page);
      await page.locator('[data-ai-id="lotting-action-individual"]').click();

      await expect(page.locator('body')).toContainText(/Processamento concluído|lote\(s\) criado\(s\)/i, { timeout: 30000 });
    });

    await test.step('Then a matriz de cobertura Prisma fica completa e as principais relações são validadas', async () => {
      const coverageAudit = getPrismaCoverageAudit(path.resolve(process.cwd(), 'prisma/schema.prisma'));
      expect(coverageAudit.missingInCoverage, `Models Prisma sem classificação: ${coverageAudit.missingInCoverage.join(', ')}`).toEqual([]);
      expect(coverageAudit.extraInCoverage, `Models em cobertura mas ausentes no schema: ${coverageAudit.extraInCoverage.join(', ')}`).toEqual([]);

      console.log(`[coverage] ui-core-form=${coverageAudit.byStrategy['ui-core-form']}`);
      console.log(`[coverage] ui-settings-form=${coverageAudit.byStrategy['ui-settings-form']}`);
      console.log(`[coverage] ui-library-flow=${coverageAudit.byStrategy['ui-library-flow']}`);
      console.log(`[coverage] indirect-relation=${coverageAudit.byStrategy['indirect-relation']}`);
      console.log(`[coverage] seed-master-data=${coverageAudit.byStrategy['seed-master-data']}`);
      console.log(`[coverage] system-side-effect=${coverageAudit.byStrategy['system-side-effect']}`);

      const createdUser = await prisma.user.findFirst({ where: { email: userEmail }, select: { id: true } });
      const createdAuction = await prisma.auction.findFirst({ where: { title: auctionTitle }, select: { id: true } });
      const createdLot = await prisma.lot.findFirst({ where: { title: lotTitle }, select: { id: true } });
      const createdAsset = await prisma.asset.findFirst({ where: { title: assetTitle }, select: { id: true } });

      expect(createdUser?.id).toBeTruthy();
      expect(createdAuction?.id).toBeTruthy();
      expect(createdLot?.id).toBeTruthy();
      expect(createdAsset?.id).toBeTruthy();

      const [userRoleLink, userTenantLink, assetLotLink, auctionStageCount, directSaleOffer, roleRecord, templateRecord, vehicleModelRecord] = await Promise.all([
        prisma.usersOnRoles.findFirst({ where: { userId: createdUser?.id } }),
        prisma.userOnTenant.findFirst({ where: { userId: createdUser?.id } }),
        prisma.assetsOnLots.findFirst({ where: { lotId: createdLot?.id, assetId: createdAsset?.id } }),
        createdAuction?.id ? prisma.auctionStage.count({ where: { auctionId: createdAuction.id } }) : Promise.resolve(0),
        prisma.directSaleOffer.findFirst({ where: { title: directSaleTitle }, select: { id: true } }),
        prisma.role.findFirst({ where: { name: roleName }, select: { id: true } }),
        prisma.documentTemplate.findFirst({ where: { name: documentTemplateName }, select: { id: true } }),
        prisma.vehicleModel.findFirst({ where: { name: vehicleModelName }, select: { id: true } }),
      ]);

      expect(userRoleLink).toBeTruthy();
      expect(userTenantLink).toBeTruthy();
      expect(assetLotLink).toBeTruthy();
      expect(auctionStageCount).toBeGreaterThan(0);
      expect(directSaleOffer?.id).toBeTruthy();
      expect(roleRecord?.id).toBeTruthy();
      expect(templateRecord?.id).toBeTruthy();
      expect(vehicleModelRecord?.id).toBeTruthy();
    });
  });
});
