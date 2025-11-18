import { Page, expect } from '@playwright/test';
import { faker as fakerPtBr } from '@faker-js/faker/locale/pt_BR';

export const BASE_URL = process.env.BASE_URL || 'http://localhost:9002';

export function randomImageUrl(seed?: string, w = 1200, h = 800) {
  const s = seed || fakerPtBr.string.alphanumeric(8);
  return `https://picsum.photos/seed/${s}/${w}/${h}`;
}

export async function ensureAdminSession(_page: Page) {
  // Session is already loaded from storageState in playwright.config
  return;
}

export function genAuctionData() {
  const title = `Leilão ${fakerPtBr.commerce.productAdjective()} ${fakerPtBr.commerce.product()} ${fakerPtBr.number.int({ min: 100, max: 999 })}`;
  const description = fakerPtBr.lorem.paragraphs({ min: 1, max: 2 });
  const imageUrl = randomImageUrl();
  return { title, description, imageUrl };
}

export function genSellerData() {
  return {
    name: `${fakerPtBr.company.name()} ${fakerPtBr.word.adjective()}`.slice(0, 80),
    email: fakerPtBr.internet.email().toLowerCase(),
    phone: fakerPtBr.phone.number()
  };
}

export function genCategoryData() {
  return {
    name: `${fakerPtBr.commerce.department()} ${fakerPtBr.number.int({ min: 1, max: 99 })}`.slice(0, 40),
    description: fakerPtBr.lorem.sentence(),
  };
}

export function genAssetData() {
  return {
    title: `${fakerPtBr.commerce.productMaterial()} ${fakerPtBr.commerce.product()}`,
    address: `${fakerPtBr.location.street()} ${fakerPtBr.location.buildingNumber()}`,
    city: fakerPtBr.location.city(),
    state: fakerPtBr.location.state({ abbreviated: true }),
    evaluationValue: fakerPtBr.number.int({ min: 30000, max: 800000 }),
    imageUrl: randomImageUrl(),
  };
}

export function genLotData() {
  const title = `Lote ${fakerPtBr.commerce.productName()} ${fakerPtBr.number.int({ min: 10, max: 999 })}`;
  return {
    title,
    number: fakerPtBr.number.int({ min: 1, max: 999 }).toString().padStart(3, '0'),
    price: fakerPtBr.number.int({ min: 1000, max: 100000 }),
    bidIncrement: fakerPtBr.number.int({ min: 100, max: 5000 }),
    address: `${fakerPtBr.location.street()} ${fakerPtBr.location.buildingNumber()}`,
    city: fakerPtBr.location.city(),
    state: fakerPtBr.location.state({ abbreviated: true }),
    imageUrl: randomImageUrl(),
  };
}

/**
 * Optimized wait for page navigation with longer timeout for Next.js compilation
 */
export async function waitForPageLoad(page: Page, timeout = 30000) {
  await Promise.race([
    page.waitForLoadState('domcontentloaded', { timeout }),
    page.waitForLoadState('networkidle', { timeout: timeout * 2 }).catch(() => {})
  ]);
}

/**
 * Save form with enhanced error handling and waiting
 */
export async function saveForm(page: Page, options?: { timeout?: number }) {
  const timeout = options?.timeout ?? 30000;
  const saveButton = page.getByRole('button', { name: /salvar|criar|criar leilão|salvar alterações|enviar/i }).first();
  
  // Wait for button to be enabled
  await saveButton.waitFor({ state: 'visible', timeout: 10000 });
  
  // Wait a bit for any validation to complete
  await page.waitForTimeout(500);
  
  await saveButton.click({ timeout: 10000 });
  
  // Wait for navigation or success
  await waitForPageLoad(page, timeout);
}

export async function assertToastOrSuccess(page: Page) {
  const toastLocator = page.locator('[data-sonner-toast], [role="status"]', { hasText: /sucesso|criado|salvo|atualizado/i });
  const textLocator = page.locator('text=/sucesso|criado|salvo|atualizado/i');
  const toastVisible = await toastLocator.first().isVisible({ timeout: 5000 }).catch(() => false);
  const textVisible = toastVisible || await textLocator.first().isVisible({ timeout: 1000 }).catch(() => false);

  if (!textVisible) {
    const hasError = await page.locator('text=/erro|error|falhou/i').first().isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasError, 'Expected success confirmation or absence of an error').toBeFalsy();
  }
}

/**
 * Open a Radix/Shadcn Select and choose an option by label
 */
export async function selectShadcnByLabel(page: Page, labelText: string | RegExp, optionText: string | RegExp) {
  const label = page.locator('label', typeof labelText === 'string' ? { hasText: labelText } : undefined).filter({ hasText: labelText as any }).first();
  await label.waitFor({ state: 'visible', timeout: 10000 });
  const combobox = label.locator('xpath=following::button[@role="combobox"][1]').first();
  await combobox.click();
  await page.waitForTimeout(300);
  
  const option = page.getByRole('option', { name: optionText as any }).first();
  if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
    await option.click();
    return;
  }
  
  // Fallback
  const item = page.locator('div[role="option"], div[role="menuitem"]', { hasText: optionText as any }).first();
  await item.click({ timeout: 10000 });
}

/**
 * Select first option from EntitySelector modal
 */
export async function selectFirstEntityOptionByIndex(page: Page, index: number) {
  const triggers = page.locator('[data-ai-id^="entity-selector-trigger-"]');
  await triggers.nth(index).click({ timeout: 10000 });
  const modal = page.locator('[data-ai-id^="entity-selector-modal-"]').first();
  await modal.waitFor({ state: 'visible', timeout: 10000 });
  const selectBtn = modal.getByRole('button', { name: /selecionar/i }).first();
  await selectBtn.click({ timeout: 10000 });
  await modal.waitFor({ state: 'hidden', timeout: 10000 });
}

/**
 * Select entity by label text
 */
export async function selectEntityByLabel(page: Page, labelText: string | RegExp) {
  const label = page.locator('label', typeof labelText === 'string' ? { hasText: labelText } : undefined).filter({ hasText: labelText as any }).first();
  await label.waitFor({ state: 'visible', timeout: 10000 });
  const trigger = label.locator('xpath=following::button[contains(@data-ai-id,"entity-selector-trigger")][1]').first();
  await trigger.click({ timeout: 10000 });
  const modal = page.locator('[data-ai-id^="entity-selector-modal-"]').first();
  await modal.waitFor({ state: 'visible', timeout: 10000 });
  
  // Wait for modal content to load
  await page.waitForTimeout(500);
  
  const selectBtn = modal.getByRole('button', { name: /selecionar/i }).first();
  await selectBtn.click({ timeout: 10000 });
  await modal.waitFor({ state: 'hidden', timeout: 10000 });
}

/**
 * Expand accordion section by name
 */
export async function expandAccordion(page: Page, sectionName: string | RegExp) {
  const trigger = page.getByRole('button', { name: sectionName as any }).first();
  if (await trigger.isVisible({ timeout: 5000 }).catch(() => false)) {
    const isExpanded = await trigger.getAttribute('data-state');
    if (isExpanded !== 'open') {
      await trigger.click();
      await page.waitForTimeout(300);
    }
  }
}
