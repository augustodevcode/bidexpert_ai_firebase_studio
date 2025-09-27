// tests/ui/wizard.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testAuctionTitle = `Leilão do Wizard Playwright ${testRunId}`;
const testLotTitle = `Lote do Wizard Playwright ${testRunId}`;

test.describe('Módulo 29: Auction Creation Wizard UI Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Garante que o setup foi concluído
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    // 1. Autenticar como Admin
    console.log('[Wizard Test] Navigating to login...');
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard/overview', { timeout: 15000 });
    console.log('[Wizard Test] Login successful.');

    // 2. Navegar para a página do Wizard
    await page.goto('/admin/wizard');
    await expect(page.getByRole('heading', { name: 'Assistente de Criação de Leilão' })).toBeVisible();
    console.log('[Wizard Test] Arrived at the wizard page.');
  });

  test('Cenário 29.1: should create a new Extrajudicial auction through the wizard', async ({ page }) => {
    
    // --- STEP 1: Type Selection ---
    console.log('[Wizard Test] Step 1: Selecting auction type...');
    await page.getByLabel('Leilão Extrajudicial').click();
    await page.getByRole('button', { name: 'Próximo' }).click();
    
    const auctionDetailsSection = page.locator('[data-ai-id="admin-auction-form-card"]');
    await expect(auctionDetailsSection).toBeVisible();
    await expect(auctionDetailsSection.getByRole('heading', { name: 'Detalhes do Leilão' })).toBeVisible();
    console.log('[Wizard Test] Step 1 complete.');

    // --- STEP 2: Auction Details ---
    console.log('[Wizard Test] Step 2: Filling auction details...');
    
    // Preencher título
    await auctionDetailsSection.getByLabel('Título do Leilão').fill(testAuctionTitle);

    // Selecionar Leiloeiro
    await auctionDetailsSection.locator('[data-ai-id="entity-selector-trigger-auctioneer"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-auctioneer"]').getByRole('row').first().getByRole('button', { name: 'Selecionar' }).click();
    await expect(auctionDetailsSection.locator('[data-ai-id="entity-selector-trigger-auctioneer"]')).not.toContainText('Selecione o leiloeiro');

    // Selecionar Comitente
    await auctionDetailsSection.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-seller"]').getByRole('row').first().getByRole('button', { name: 'Selecionar' }).click();
    await expect(auctionDetailsSection.locator('[data-ai-id="entity-selector-trigger-seller"]')).not.toContainText('Selecione o comitente');

    // Selecionar Categoria
    await auctionDetailsSection.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-category"]').getByRole('row').first().getByRole('button', { name: 'Selecionar' }).click();
    await expect(auctionDetailsSection.locator('[data-ai-id="entity-selector-trigger-category"]')).not.toContainText('Selecione a categoria');
    
    // Avançar
    await page.getByRole('button', { name: 'Próximo' }).click();
    await expect(page.locator('[data-ai-id="wizard-step4-lotting"]')).toContainText('Loteamento de Ativos', { timeout: 10000 });
    console.log('[Wizard Test] Step 2 complete.');


    // --- STEP 3: Lotting ---
    console.log('[Wizard Test] Step 3: Creating a lot...');
    const lottingSection = page.locator('[data-ai-id="wizard-step4-lotting"]');
    
    // Selecionar o primeiro ativo na tabela
    await lottingSection.locator('table tbody tr').first().locator('input[type="checkbox"]').check();
    
    // Clicar para agrupar em lote único
    await lottingSection.getByRole('button', { name: 'Agrupar em Lote Único' }).click();

    // Preencher o modal de criação de lote
    const lotModal = page.locator('[role="dialog"]');
    await expect(lotModal.getByRole('heading', { name: 'Criar Novo Lote Agrupado' })).toBeVisible();
    await lotModal.getByLabel('Título do Lote').fill(testLotTitle);
    await lotModal.getByLabel('Número do Lote').fill('WIZ-01');
    await lotModal.getByLabel('Lance Inicial (R$)').fill('1500');
    await lotModal.getByRole('button', { name: 'Salvar Lote' }).click();
    
    // Verificar se o lote aparece na lista de "Lotes Preparados"
    await expect(page.getByText(`Lote WIZ-01: ${testLotTitle}`)).toBeVisible();
    console.log('[Wizard Test] Step 3 complete.');

    // Avançar
    await page.getByRole('button', { name: 'Próximo' }).click();
    await expect(page.locator('[data-ai-id="wizard-step5-review-card"]')).toContainText('Revise e Confirme', { timeout: 10000 });
    console.log('[Wizard Test] Arrived at review step.');

    // --- STEP 4: Review & Publish ---
    console.log('[Wizard Test] Step 4: Reviewing and publishing...');
    const reviewSection = page.locator('[data-ai-id="wizard-step5-review-card"]');
    await expect(reviewSection).toContainText(testAuctionTitle);
    await expect(reviewSection).toContainText(`Lote WIZ-01: ${testLotTitle}`);

    // Publicar
    await page.getByRole('button', { name: 'Publicar Leilão' }).click();

    // Verificar o resultado
    await expect(page.getByText('Leilão e lotes criados com sucesso!')).toBeVisible({ timeout: 15000 });
    await page.waitForURL(/\/admin\/auctions\/.+\/edit/, { timeout: 10000 });
    
    // Na página de edição do novo leilão, verificar se o título está correto
    await expect(page.getByRole('heading', { name: `Editar Leilão` })).toBeVisible();
    await expect(page.getByLabel('Título do Leilão')).toHaveValue(testAuctionTitle);
    console.log('[Wizard Test] Step 4 complete. Auction created and verified.');
  });
});
