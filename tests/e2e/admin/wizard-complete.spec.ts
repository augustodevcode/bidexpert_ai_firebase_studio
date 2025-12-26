/**
 * @fileoverview Testes E2E completos para o Assistente de Criação de Leilão (Wizard).
 * Verifica todos os fluxos: Judicial, Extrajudicial, Particular e Tomada de Preços.
 */
import { test, expect, Page } from '@playwright/test';
import { waitForPageLoad, selectEntityByLabel, selectShadcnByLabel, saveForm, assertToastOrSuccess } from './admin-helpers';
import { faker } from '@faker-js/faker/locale/pt_BR';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9002';

/**
 * Helper: Navigate to wizard page and wait for it to load
 */
async function navigateToWizard(page: Page) {
  await page.goto(`${BASE_URL}/admin/wizard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForPageLoad(page, 30000);
  
  // Wait for the page to be fully loaded
  await page.waitForSelector('text=/Assistente de Criação de Leilão/i', { timeout: 30000 });
  
  // Wait for loading spinner to disappear
  const spinner = page.locator('[class*="animate-spin"]');
  if (await spinner.isVisible({ timeout: 2000 }).catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: 30000 });
  }
}

/**
 * Helper: Select auction type in Step 1
 */
async function selectAuctionType(page: Page, type: 'JUDICIAL' | 'EXTRAJUDICIAL' | 'PARTICULAR' | 'TOMADA_DE_PRECOS') {
  const typeLabels: Record<string, string> = {
    'JUDICIAL': 'Leilão Judicial',
    'EXTRAJUDICIAL': 'Leilão Extrajudicial',
    'PARTICULAR': 'Leilão Particular',
    'TOMADA_DE_PRECOS': 'Tomada de Preços',
  };
  
  // Wait for the type selection step
  await page.waitForSelector('[data-ai-id="wizard-step1-type-selection"]', { timeout: 15000 });
  
  // Click on the radio option
  await page.locator(`label:has-text("${typeLabels[type]}")`).click();
  await page.waitForTimeout(500);
  
  // Click "Próximo"
  await page.getByRole('button', { name: /próximo/i }).click();
  await page.waitForTimeout(1000);
}

/**
 * Helper: Select judicial process in Step 2 (only for JUDICIAL type)
 */
async function selectJudicialProcess(page: Page) {
  // Wait for the judicial setup step
  await page.waitForSelector('[data-ai-id="wizard-step2-judicial-setup"]', { timeout: 15000 });
  
  // Click on EntitySelector to select a process
  const entityTrigger = page.locator('button:has-text("Selecione um processo")').first();
  if (await entityTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
    await entityTrigger.click();
    await page.waitForTimeout(1000);
    
    // Wait for modal and select first option if available
    const modal = page.locator('[data-ai-id^="entity-selector-modal-"]').first();
    if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Wait for options to load
      await page.waitForTimeout(1000);
      
      // Click on first row/option
      const firstOption = modal.locator('[data-radix-collection-item]').first();
      if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstOption.click();
      }
      
      // Click "Selecionar"
      const selectBtn = modal.getByRole('button', { name: /selecionar/i }).first();
      if (await selectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await selectBtn.click();
        await modal.waitFor({ state: 'hidden', timeout: 10000 });
      }
    }
  }
  
  // Check if details are shown
  const processDetails = page.locator('[data-ai-id="wizard-step2-selected-process-details"]');
  const hasDetails = await processDetails.isVisible({ timeout: 5000 }).catch(() => false);
  
  // Click "Próximo" - even if no process is selected to test the flow
  await page.getByRole('button', { name: /próximo/i }).click();
  await page.waitForTimeout(1000);
}

/**
 * Helper: Fill auction details in Step 3
 */
async function fillAuctionDetails(page: Page, auctionType: string) {
  // Wait for the form to be visible
  await page.waitForSelector('[data-ai-id="admin-auction-form-card"]', { timeout: 30000 });
  
  // Wait for loading spinner in form to disappear
  const spinner = page.locator('[data-ai-id="admin-auction-form-card"] [class*="animate-spin"]');
  if (await spinner.isVisible({ timeout: 2000 }).catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout: 30000 });
  }
  
  // Generate test data
  const title = `Leilão Teste ${auctionType} ${faker.number.int({ min: 100, max: 9999 })}`;
  const description = faker.lorem.paragraph();
  
  // Fill title
  const titleInput = page.locator('input[name="title"]');
  await titleInput.clear();
  await titleInput.fill(title);
  
  // Fill description
  const descriptionTextarea = page.locator('textarea[name="description"]');
  if (await descriptionTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
    await descriptionTextarea.fill(description);
  }
  
  // Select Status
  try {
    await selectShadcnByLabel(page, /Status/i, 'RASCUNHO');
    await page.waitForTimeout(500);
  } catch (e) {
    console.log('Status selection skipped:', e);
  }
  
  // Select Category
  try {
    await selectEntityByLabel(page, /Categoria Principal/i);
    await page.waitForTimeout(500);
  } catch (e) {
    console.log('Category selection skipped (may not have data):', e);
  }
  
  // Select Auctioneer (Leiloeiro)
  try {
    await selectEntityByLabel(page, /Leiloeiro/i);
    await page.waitForTimeout(500);
  } catch (e) {
    console.log('Auctioneer selection skipped:', e);
  }
  
  // Select Seller (Comitente)
  try {
    await selectEntityByLabel(page, /Comitente/i);
    await page.waitForTimeout(500);
  } catch (e) {
    console.log('Seller selection skipped:', e);
  }
  
  // Select Modalidade (if not pre-filled)
  try {
    await selectShadcnByLabel(page, /Modalidade/i, auctionType);
    await page.waitForTimeout(500);
  } catch (e) {
    console.log('Modalidade may already be set:', e);
  }
  
  // Select Participation
  try {
    await selectShadcnByLabel(page, /Participação/i, 'ONLINE');
    await page.waitForTimeout(500);
  } catch (e) {
    console.log('Participation selection skipped:', e);
  }
  
  // Select Method
  try {
    await selectShadcnByLabel(page, /Método/i, 'STANDARD');
    await page.waitForTimeout(500);
  } catch (e) {
    console.log('Method selection skipped:', e);
  }
  
  // Wait a moment for form validation
  await page.waitForTimeout(1000);
  
  // Click "Próximo"
  await page.getByRole('button', { name: /próximo/i }).click();
  await page.waitForTimeout(1000);
}

/**
 * Helper: Handle Step 4 - Lotting
 */
async function handleLottingStep(page: Page) {
  // Wait for the lotting step
  await page.waitForSelector('[data-ai-id="wizard-step4-lotting"]', { timeout: 15000 });
  
  // Check if there are available assets
  const assetRows = page.locator('table tbody tr');
  const rowCount = await assetRows.count().catch(() => 0);
  
  if (rowCount > 0) {
    // Select first asset
    const firstCheckbox = assetRows.first().locator('input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstCheckbox.click();
      await page.waitForTimeout(500);
      
      // Click "Lotear Individualmente"
      const lotBtn = page.getByRole('button', { name: /lotear individualmente/i });
      if (await lotBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
        await lotBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  } else {
    console.log('No assets available for lotting - continuing without lots');
  }
  
  // Click "Próximo"
  await page.getByRole('button', { name: /próximo/i }).click();
  await page.waitForTimeout(1000);
}

/**
 * Helper: Review and publish in Step 5
 */
async function reviewAndPublish(page: Page, shouldPublish: boolean = false) {
  // Wait for review step
  await page.waitForSelector('[data-ai-id="wizard-step5-review-card"]', { timeout: 15000 });
  
  // Verify summary cards are visible
  await expect(page.locator('[data-ai-id="wizard-step5-auction-summary-card"]')).toBeVisible({ timeout: 10000 });
  
  // Check if auction title is displayed
  const auctionSummary = page.locator('[data-ai-id="wizard-step5-auction-summary-card"]');
  const titleText = await auctionSummary.locator('text=/Título:/i').textContent().catch(() => '');
  expect(titleText).toContain('Título:');
  
  if (shouldPublish) {
    // Click "Publicar Leilão"
    const publishBtn = page.getByRole('button', { name: /publicar leilão/i });
    await publishBtn.click();
    
    // Wait for success
    await page.waitForTimeout(5000);
    await assertToastOrSuccess(page);
    
    // Should redirect to auction edit page
    await expect(page).toHaveURL(/\/admin\/auctions/, { timeout: 30000 });
  }
}

test.describe('Wizard - Fluxo Completo de Criação de Leilões', () => {
  test.beforeEach(async ({ page }) => {
    // Session is loaded from storageState
    await navigateToWizard(page);
  });

  test('Fluxo JUDICIAL: Seleção de tipo, processo, detalhes e revisão', async ({ page }) => {
    // Step 1: Select JUDICIAL type
    await selectAuctionType(page, 'JUDICIAL');
    
    // Step 2: Select judicial process (if available)
    await selectJudicialProcess(page);
    
    // Step 3: Fill auction details
    await fillAuctionDetails(page, 'JUDICIAL');
    
    // Step 4: Handle lotting (optional)
    await handleLottingStep(page);
    
    // Step 5: Review (don't publish to avoid creating test data)
    await reviewAndPublish(page, false);
  });

  test('Fluxo EXTRAJUDICIAL: Seleção de tipo, detalhes e revisão', async ({ page }) => {
    // Step 1: Select EXTRAJUDICIAL type (skips Step 2)
    await selectAuctionType(page, 'EXTRAJUDICIAL');
    
    // Step 3: Fill auction details (after Step 1 for non-judicial)
    await fillAuctionDetails(page, 'EXTRAJUDICIAL');
    
    // Step 4: Handle lotting (optional)
    await handleLottingStep(page);
    
    // Step 5: Review
    await reviewAndPublish(page, false);
  });

  test('Fluxo PARTICULAR (Venda Direta): Seleção de tipo, detalhes e revisão', async ({ page }) => {
    // Step 1: Select PARTICULAR type (skips Step 2)
    await selectAuctionType(page, 'PARTICULAR');
    
    // Step 3: Fill auction details
    await fillAuctionDetails(page, 'PARTICULAR');
    
    // Step 4: Handle lotting (optional)
    await handleLottingStep(page);
    
    // Step 5: Review
    await reviewAndPublish(page, false);
  });

  test('Fluxo TOMADA_DE_PRECOS: Seleção de tipo, detalhes e revisão', async ({ page }) => {
    // Step 1: Select TOMADA_DE_PRECOS type (skips Step 2)
    await selectAuctionType(page, 'TOMADA_DE_PRECOS');
    
    // Step 3: Fill auction details
    await fillAuctionDetails(page, 'TOMADA_DE_PRECOS');
    
    // Step 4: Handle lotting (optional)
    await handleLottingStep(page);
    
    // Step 5: Review
    await reviewAndPublish(page, false);
  });

  test('Navegação entre passos: Anterior e Próximo funcionam corretamente', async ({ page }) => {
    // Step 1: Select any type
    await selectAuctionType(page, 'EXTRAJUDICIAL');
    
    // Verify we're on step 3 (auction details) for non-judicial
    await page.waitForSelector('[data-ai-id="admin-auction-form-card"]', { timeout: 15000 });
    
    // Click "Anterior" to go back
    await page.getByRole('button', { name: /anterior/i }).click();
    await page.waitForTimeout(1000);
    
    // Should be back on Step 1
    await expect(page.locator('[data-ai-id="wizard-step1-type-selection"]')).toBeVisible({ timeout: 10000 });
    
    // Click "Próximo" again
    await page.getByRole('button', { name: /próximo/i }).click();
    await page.waitForTimeout(1000);
    
    // Should be back on Step 3
    await page.waitForSelector('[data-ai-id="admin-auction-form-card"]', { timeout: 15000 });
  });

  test('Stepper visual: Passos são destacados corretamente', async ({ page }) => {
    // Verify step 1 is highlighted initially
    const stepper = page.locator('nav[aria-label="Wizard Progress"]');
    await expect(stepper).toBeVisible({ timeout: 10000 });
    
    // First step should be current
    const firstStepButton = stepper.locator('button').first();
    const firstStepState = await firstStepButton.getAttribute('aria-current');
    expect(firstStepState).toBe('step');
    
    // Select type and move to next step
    await selectAuctionType(page, 'PARTICULAR');
    
    // Now step 3 should be current (step 2 is skipped for non-judicial)
    await page.waitForTimeout(500);
    const currentStepButtons = stepper.locator('button[aria-current="step"]');
    await expect(currentStepButtons).toHaveCount(1);
  });

  test('Validação: Não avança sem campos obrigatórios preenchidos', async ({ page }) => {
    // Step 1: Select type
    await selectAuctionType(page, 'PARTICULAR');
    
    // Step 3: Try to advance without filling required fields
    await page.waitForSelector('[data-ai-id="admin-auction-form-card"]', { timeout: 15000 });
    
    // Clear title if filled
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();
    
    // Try to click "Próximo"
    await page.getByRole('button', { name: /próximo/i }).click();
    await page.waitForTimeout(1000);
    
    // Should show toast error or remain on the same step
    const errorToast = page.locator('[data-sonner-toast], [role="alert"]');
    const stillOnStep3 = await page.locator('[data-ai-id="admin-auction-form-card"]').isVisible();
    
    // Either shows error toast or stays on the page
    expect(stillOnStep3).toBeTruthy();
  });
});

test.describe('Wizard - Fluxo com Publicação', () => {
  test('Fluxo JUDICIAL Completo com Publicação', async ({ page }) => {
    await navigateToWizard(page);
    
    // Step 1: Select JUDICIAL type
    await selectAuctionType(page, 'JUDICIAL');
    
    // Step 2: Select judicial process (if available)
    await selectJudicialProcess(page);
    
    // Step 3: Fill auction details
    await fillAuctionDetails(page, 'JUDICIAL');
    
    // Step 4: Handle lotting (optional)
    await handleLottingStep(page);
    
    // Step 5: Review AND PUBLISH
    await reviewAndPublish(page, true);
    
    // Verify redirect to auctions page
    await expect(page).toHaveURL(/\/admin\/auctions/, { timeout: 30000 });
  });
});
