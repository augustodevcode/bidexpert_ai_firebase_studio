// tests/ui-e2e/01-full-auction-creation-flow.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const prisma = new PrismaClient();
const createdEntityIds: string[] = [];

test.describe('Cenário E2E: Criação Completa de Leilão com Loteamento e Herança de Mídia', () => {

  test.afterAll(async () => {
    // Cleanup logic
    console.log(`[E2E Cleanup] Deleting records for run ID: ${testRunId}`);
    try {
      await prisma.lot.deleteMany({ where: { auctionId: { in: createdEntityIds } } });
      await prisma.auction.deleteMany({ where: { id: { in: createdEntityIds } } });
      await prisma.asset.deleteMany({ where: { title: { contains: testRunId } } });
      await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
      await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
      await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
    } catch(e) {
      console.error("Error during E2E cleanup:", e);
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');
  });

  test('should create multiple assets, lot them with different media strategies, and create a full auction', async ({ page }) => {
    // 1. Create a Seller and Auctioneer to be used
    const sellerName = `Comitente E2E ${testRunId}`;
    const auctioneerName = `Leiloeiro E2E ${testRunId}`;
    const categoryName = `Veículos E2E ${testRunId}`;
    const cattleCategoryName = `Semoventes E2E ${testRunId}`;

    await page.goto('/admin/sellers/new');
    await page.locator('[data-ai-id="seller-form"]').getByLabel('Nome do Comitente/Empresa').fill(sellerName);
    await page.locator('[data-ai-id="form-page-btn-save"]').click();
    await expect(page.getByText('Comitente criado com sucesso.')).toBeVisible();

    await page.goto('/admin/auctioneers/new');
    await page.locator('[data-ai-id="auctioneer-form"]').getByLabel('Nome do Leiloeiro/Empresa').fill(auctioneerName);
    await page.locator('[data-ai-id="form-page-btn-save"]').click();
    await expect(page.getByText('Leiloeiro criado com sucesso.')).toBeVisible();

    await page.goto('/admin/categories/new');
    await page.locator('input[name="name"]').fill(categoryName);
    await page.getByRole('button', {name: 'Criar Categoria'}).click();
    await expect(page.getByText('Categoria criada com sucesso.')).toBeVisible();
    
    await page.goto('/admin/categories/new');
    await page.locator('input[name="name"]').fill(cattleCategoryName);
    await page.getByRole('button', {name: 'Criar Categoria'}).click();
    await expect(page.getByText('Categoria criada com sucesso.')).toBeVisible();


    // 2. Create multiple Assets
    await page.goto('/admin/assets/new');
    const assetForm = page.locator('[data-ai-id="asset-form"]');
    
    // Asset 1: Vehicle with specific image
    await assetForm.getByLabel('Título/Nome do Bem').fill(`Carro Teste E2E ${testRunId}`);
    await assetForm.getByLabel('Valor de Avaliação').fill('50000');
    await assetForm.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-category"]`).getByText(new RegExp(categoryName)).click();
    await assetForm.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-seller"]`).getByText(new RegExp(sellerName)).click();
    await assetForm.getByRole('button', { name: 'Mídia' }).click();
    await assetForm.getByRole('button', { name: 'Escolher da Biblioteca' }).first().click();
    await page.locator('[data-ai-id="media-library-item-2"]').click();
    await page.locator('[data-ai-id="choose-media-confirm-button"]').click();
    await expect(assetForm.getByRole('button', { name: 'Alterar Imagem' })).toBeVisible();
    await page.getByRole('button', { name: 'Criar Ativo' }).click();
    await expect(page.getByText('Ativo criado com sucesso.')).toBeVisible();

    // Assets 2 & 3: Cattle
    await page.goto('/admin/assets/new');
    await assetForm.getByLabel('Título/Nome do Bem').fill(`Boi Nelore 1 ${testRunId}`);
    await assetForm.getByLabel('Valor de Avaliação').fill('5000');
    await assetForm.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-category"]`).getByText(new RegExp(cattleCategoryName)).click();
    await assetForm.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-seller"]`).getByText(new RegExp(sellerName)).click();
    await page.getByRole('button', { name: 'Criar Ativo' }).click();
    await expect(page.getByText('Ativo criado com sucesso.')).toBeVisible();
    
    await page.goto('/admin/assets/new');
    await assetForm.getByLabel('Título/Nome do Bem').fill(`Boi Nelore 2 ${testRunId}`);
    await assetForm.getByLabel('Valor de Avaliação').fill('5500');
    await assetForm.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-category"]`).getByText(new RegExp(cattleCategoryName)).click();
    await assetForm.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-seller"]`).getByText(new RegExp(sellerName)).click();
    await page.getByRole('button', { name: 'Criar Ativo' }).click();
    await expect(page.getByText('Ativo criado com sucesso.')).toBeVisible();
    
    
    // 3. Create Lots
    await page.goto('/admin/lots/new');
    const lotForm = page.locator('[data-ai-id="lot-form"]');

    // Lot 1 (Car) - Inherit media
    await lotForm.getByLabel('Título do Lote').fill(`Lote Carro Herda Mídia ${testRunId}`);
    await lotForm.getByRole('button', { name: 'Bens Vinculados' }).click();
    await page.locator('[data-ai-id="available-assets-table"] tbody tr').filter({ hasText: `Carro Teste E2E ${testRunId}` }).locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Vincular Bem' }).click();
    await expect(page.locator('[data-ai-id="linked-assets-section"]')).toContainText(`Carro Teste E2E ${testRunId}`);
    await lotForm.getByRole('button', { name: 'Mídia' }).click();
    await lotForm.getByLabel('Herdar de um Bem Vinculado').click();
    await lotForm.getByRole('button', { name: 'Criar Lote' }).click();
    await expect(page.getByText('Lote criado com sucesso.')).toBeVisible();

    // Lot 2 (Cattle) - Grouped with custom media
    await page.goto('/admin/lots/new');
    await lotForm.getByLabel('Título do Lote').fill(`Lote Gado Agrupado ${testRunId}`);
    await lotForm.getByRole('button', { name: 'Bens Vinculados' }).click();
    await page.locator('[data-ai-id="available-assets-table"] tbody tr').filter({ hasText: `Boi Nelore 1 ${testRunId}` }).locator('input[type="checkbox"]').check();
    await page.locator('[data-ai-id="available-assets-table"] tbody tr').filter({ hasText: `Boi Nelore 2 ${testRunId}` }).locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Vincular Bem' }).click();
    await expect(page.locator('[data-ai-id="linked-assets-section"]')).toContainText(`Boi Nelore 1`);
    await expect(page.locator('[data-ai-id="linked-assets-section"]')).toContainText(`Boi Nelore 2`);
    await lotForm.getByRole('button', { name: 'Mídia' }).click();
    await lotForm.getByLabel('Usar Galeria Customizada').click();
    await lotForm.getByRole('button', { name: 'Escolher da Biblioteca' }).first().click();
    await page.locator('[data-ai-id="media-library-item-5"]').click();
    await page.locator('[data-ai-id="choose-media-confirm-button"]').click();
    await expect(lotForm.getByRole('button', { name: 'Alterar Imagem' })).toBeVisible();
    await page.getByRole('button', { name: 'Criar Lote' }).click();
    await expect(page.getByText('Lote criado com sucesso.')).toBeVisible();

    // 4. Create Auction
    await page.goto('/admin/auctions/new');
    const newAuctionForm = page.locator('[data-ai-id="admin-auction-form-card"]');
    await newAuctionForm.getByLabel('Título do Leilão').fill(`Leilão Final E2E ${testRunId}`);
    // ... Fill other auction details ...
    await newAuctionForm.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-seller"]`).getByText(new RegExp(sellerName)).click();
    await newAuctionForm.locator('[data-ai-id="entity-selector-trigger-auctioneer"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-auctioneer"]`).getByText(new RegExp(auctioneerName)).click();
    await newAuctionForm.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-category"]`).getByText(new RegExp(categoryName)).click();
    
    // Add 2 stages
    await newAuctionForm.getByRole('button', { name: 'Datas e Prazos' }).click();
    await newAuctionForm.getByRole('button', { name: 'Adicionar Praça/Etapa' }).click();
    // Fill stage details...

    await page.locator('[data-ai-id="form-page-btn-save"]').click();
    await expect(page.getByText('Leilão criado com sucesso.')).toBeVisible();

    const url = page.url();
    const match = url.match(/\/admin\/auctions\/([a-zA-Z0-9-]+)\/edit/);
    if (match) createdEntityIds.push(match[1]);

    // 5. Final verification (e.g., check if lots are associated)
    await page.goto(`/admin/auctions/${createdEntityIds[0]}/edit`);
    await expect(page.getByText(`Lote Carro Herda Mídia ${testRunId}`)).toBeVisible();
    await expect(page.getByText(`Lote Gado Agrupado ${testRunId}`)).toBeVisible();
  });
});
