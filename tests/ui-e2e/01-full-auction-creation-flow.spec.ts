// tests/ui-e2e/01-full-auction-creation-flow.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const prisma = new PrismaClient();

const entityNames = {
  seller: `Comitente E2E ${testRunId}`,
  auctioneer: `Leiloeiro E2E ${testRunId}`,
  vehicleCategory: `Veículos E2E ${testRunId}`,
  cattleCategory: `Semoventes E2E ${testRunId}`,
  carAsset: `Carro Teste E2E ${testRunId}`,
  cattleAsset1: `Boi Nelore 1 ${testRunId}`,
  cattleAsset2: `Boi Nelore 2 ${testRunId}`,
  carLot: `Lote Carro Herda Mídia ${testRunId}`,
  cattleLot: `Lote Gado Agrupado ${testRunId}`,
  auction: `Leilão Final E2E ${testRunId}`,
};

let createdEntityIds: { [key: string]: string } = {};

test.describe('Cenário E2E: Criação Completa de Leilão com Loteamento e Herança de Mídia', () => {

  test.afterAll(async () => {
    console.log(`[E2E Cleanup] Deleting records for run ID: ${testRunId}`);
    try {
      if (createdEntityIds.auction) await prisma.lot.deleteMany({ where: { auctionId: createdEntityIds.auction } });
      if (createdEntityIds.auction) await prisma.auction.delete({ where: { id: createdEntityIds.auction } });
      await prisma.asset.deleteMany({ where: { title: { contains: testRunId } } });
      await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
      await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
      await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
    } catch (e) {
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

  test('should create entities, lot them with different strategies, and create a full auction', async ({ page }) => {
    // 1. Create dependencies
    await page.goto('/admin/sellers/new');
    await page.locator('[data-ai-id="seller-form"]').getByLabel('Nome do Comitente/Empresa').fill(entityNames.seller);
    await page.locator('[data-ai-id="form-page-btn-save"]').click();
    await expect(page.getByText('Comitente criado com sucesso.')).toBeVisible();

    await page.goto('/admin/auctioneers/new');
    await page.locator('[data-ai-id="auctioneer-form"]').getByLabel('Nome do Leiloeiro/Empresa').fill(entityNames.auctioneer);
    await page.locator('[data-ai-id="form-page-btn-save"]').click();
    await expect(page.getByText('Leiloeiro criado com sucesso.')).toBeVisible();
    
    await page.goto('/admin/categories/new');
    await page.locator('input[name="name"]').fill(entityNames.vehicleCategory);
    await page.getByRole('button', {name: 'Criar Categoria'}).click();
    await expect(page.getByText('Categoria criada com sucesso.')).toBeVisible();

    await page.goto('/admin/categories/new');
    await page.locator('input[name="name"]').fill(entityNames.cattleCategory);
    await page.getByRole('button', {name: 'Criar Categoria'}).click();
    await expect(page.getByText('Categoria criada com sucesso.')).toBeVisible();

    // 2. Create multiple Assets
    await page.goto('/admin/assets/new');
    const assetForm = page.locator('[data-ai-id="asset-form"]');
    
    // Asset 1: Vehicle
    await assetForm.getByLabel('Título/Nome do Bem').fill(entityNames.carAsset);
    await assetForm.getByLabel('Valor de Avaliação (R$)').fill('50000');
    await assetForm.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-category"]`).getByText(new RegExp(entityNames.vehicleCategory)).click();
    await assetForm.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-seller"]`).getByText(new RegExp(entityNames.seller)).click();
    await assetForm.getByRole('button', { name: 'Mídia' }).click();
    await assetForm.getByRole('button', { name: 'Escolher da Biblioteca' }).first().click();
    await page.locator('[data-ai-id="media-library-item-2"]').click();
    await page.locator('[data-ai-id="choose-media-confirm-button"]').click();
    await page.getByRole('button', { name: 'Criar Ativo' }).click();
    await expect(page.getByText('Ativo criado com sucesso.')).toBeVisible();
    
    // Asset 2 & 3: Cattle
    await page.goto('/admin/assets/new');
    await assetForm.getByLabel('Título/Nome do Bem').fill(entityNames.cattleAsset1);
    await assetForm.getByLabel('Valor de Avaliação (R$)').fill('5000');
    await assetForm.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-category"]`).getByText(new RegExp(entityNames.cattleCategory)).click();
    await assetForm.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-seller"]`).getByText(new RegExp(entityNames.seller)).click();
    await page.getByRole('button', { name: 'Criar Ativo' }).click();
    await expect(page.getByText('Ativo criado com sucesso.')).toBeVisible();

    await page.goto('/admin/assets/new');
    await assetForm.getByLabel('Título/Nome do Bem').fill(entityNames.cattleAsset2);
    await assetForm.getByLabel('Valor de Avaliação (R$)').fill('5500');
    await assetForm.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-category"]`).getByText(new RegExp(entityNames.cattleCategory)).click();
    await assetForm.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-seller"]`).getByText(new RegExp(entityNames.seller)).click();
    await page.getByRole('button', { name: 'Criar Ativo' }).click();
    await expect(page.getByText('Ativo criado com sucesso.')).toBeVisible();
    
    // 3. Create Lots
    await page.goto('/admin/auctions/new');
    const auctionForm = page.locator('[data-ai-id="admin-auction-form-card"]');
    await auctionForm.getByLabel('Título do Leilão').fill(entityNames.auction);
    await auctionForm.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-seller"]`).getByText(new RegExp(entityNames.seller)).click();
    await auctionForm.locator('[data-ai-id="entity-selector-trigger-auctioneer"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-auctioneer"]`).getByText(new RegExp(entityNames.auctioneer)).click();
    await auctionForm.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-category"]`).getByText(new RegExp(entityNames.vehicleCategory)).click();
    await auctionForm.getByRole('button', { name: 'Datas e Prazos' }).click();
    await auctionForm.getByRole('button', { name: 'Adicionar Praça/Etapa' }).click();
    await page.locator('[data-ai-id="form-page-btn-save"]').click();
    await expect(page.getByText('Leilão criado com sucesso.')).toBeVisible();
    
    const url = page.url();
    const match = url.match(/\/admin\/auctions\/([a-zA-Z0-9-]+)\/edit/);
    if (match) createdEntityIds.auction = match[1];

    await page.goto(`/admin/lots/new?auctionId=${createdEntityIds.auction}`);
    const lotForm = page.locator('[data-ai-id="lot-form"]');

    // Lot 1 (Car) - Inherit media
    await lotForm.getByLabel('Título do Lote').fill(entityNames.carLot);
    await lotForm.getByRole('button', { name: 'Bens Vinculados' }).click();
    await page.locator('[data-ai-id="available-assets-table"] tbody tr').filter({ hasText: entityNames.carAsset }).locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Vincular Bem' }).click();
    await expect(page.locator('[data-ai-id="linked-assets-section"]')).toContainText(entityNames.carAsset);
    await lotForm.getByRole('button', { name: 'Mídia' }).click();
    await lotForm.getByLabel('Herdar de um Bem Vinculado').click();
    await lotForm.locator('[data-ai-id="entity-selector-trigger-inheritedMediaFromAssetId"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-inheritedMediaFromAssetId"]`).getByText(entityNames.carAsset).click();
    await page.getByRole('button', { name: 'Criar Lote' }).click();
    await expect(page.getByText('Lote criado com sucesso.')).toBeVisible();
    
    // Lot 2 (Cattle) - Grouped with custom media
    await page.goto(`/admin/lots/new?auctionId=${createdEntityIds.auction}`);
    await lotForm.getByLabel('Título do Lote').fill(entityNames.cattleLot);
    await lotForm.getByRole('button', { name: 'Bens Vinculados' }).click();
    await page.locator('[data-ai-id="available-assets-table"] tbody tr').filter({ hasText: entityNames.cattleAsset1 }).locator('input[type="checkbox"]').check();
    await page.locator('[data-ai-id="available-assets-table"] tbody tr').filter({ hasText: entityNames.cattleAsset2 }).locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Vincular Bem' }).click();
    await lotForm.getByRole('button', { name: 'Mídia' }).click();
    await lotForm.getByLabel('Usar Galeria Customizada').click();
    await lotForm.getByRole('button', { name: 'Escolher da Biblioteca' }).first().click();
    await page.locator('[data-ai-id="media-library-item-5"]').click();
    await page.locator('[data-ai-id="choose-media-confirm-button"]').click();
    await page.getByRole('button', { name: 'Criar Lote' }).click();
    await expect(page.getByText('Lote criado com sucesso.')).toBeVisible();

    // 4. Set featured lot and check auction image inheritance
    await page.goto(`/admin/auctions/${createdEntityIds.auction}/edit`);
    const lotRow = page.getByRole('row', { name: new RegExp(entityNames.carLot, 'i') });
    await lotRow.locator('[data-ai-id*="entity-edit-trigger"]').click();
    await page.getByText('Destacar no Marketplace').click();
    await expect(page.getByText('Status de destaque atualizado.')).toBeVisible();

    await page.reload();
    await auctionForm.getByRole('button', { name: 'Mídia' }).click();
    await auctionForm.locator('button[role="combobox"]').click();
    await page.getByText(new RegExp(`Herdar do Lote em Destaque: ${entityNames.carLot}`, 'i')).click();
    await page.locator('[data-ai-id="form-page-btn-save"]').click();
    await expect(page.getByText('Leilão atualizado com sucesso.')).toBeVisible();

    // 5. Final verification
    await page.goto(`/auctions/${createdEntityIds.auction}`);
    await expect(page.locator(`img[alt*="${entityNames.auction}"]`)).toHaveAttribute('src', /placehold\.co\/600x400/);
  });
});
