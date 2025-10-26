// tests/ui-plus/02-admin-create-asset-full.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testVehicleAssetName = `Veículo Completo Playwright ${testRunId}`;
const testRealEstateAssetName = `Imóvel Completo Playwright ${testRunId}`;
const prisma = new PrismaClient();
let createdAssetIds: string[] = [];
let testSellerId: string, testVehicleCategoryId: string, testRealEstateCategoryId: string;

test.describe('Testes de UI Exaustivos - Criação de Ativo (Bem)', () => {

  test.beforeAll(async () => {
    const seller = await prisma.seller.create({ data: { tenantId: '1', name: `Comitente para Ativos ${testRunId}`, slug: `seller-asset-${testRunId}`, publicId: `pub-seller-asset-${testRunId}` } });
    testSellerId = seller.id;
    const vehicleCat = await prisma.lotCategory.create({ data: { name: `Veículos ${testRunId}`, slug: `veiculos-asset-${testRunId}` } });
    testVehicleCategoryId = vehicleCat.id;
    const realEstateCat = await prisma.lotCategory.create({ data: { name: `Imóveis ${testRunId}`, slug: `imoveis-asset-${testRunId}` } });
    testRealEstateCategoryId = realEstateCat.id;
  });

  test.afterAll(async () => {
    if (createdAssetIds.length > 0) await prisma.asset.deleteMany({ where: { id: { in: createdAssetIds } } });
    if (testSellerId) await prisma.seller.delete({ where: { id: testSellerId } }).catch(e => console.error(e));
    if (testVehicleCategoryId) await prisma.lotCategory.delete({ where: { id: testVehicleCategoryId } }).catch(e => console.error(e));
    if (testRealEstateCategoryId) await prisma.lotCategory.delete({ where: { id: testRealEstateCategoryId } }).catch(e => console.error(e));
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');
    await page.goto('/admin/assets/new');
    await expect(page.getByRole('heading', { name: 'Novo Ativo' })).toBeVisible({ timeout: 15000 });
  });

  test('Cenário: Deve criar um ativo do tipo Veículo preenchendo campos específicos', async ({ page }) => {
    const assetForm = page.locator('[data-ai-id="asset-form"]');
    
    // Aba Geral
    await assetForm.getByLabel('Título/Nome do Bem').fill(testVehicleAssetName);
    await assetForm.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-category"]`).getByText(new RegExp(`Veículos ${testRunId}`)).click();
    await assetForm.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-seller"]`).getByText(new RegExp(`Comitente para Ativos ${testRunId}`)).click();

    // Aba Detalhes Específicos
    await assetForm.getByRole('button', { name: 'Detalhes Específicos' }).click();
    await expect(assetForm.getByLabel('Placa')).toBeVisible();
    await assetForm.getByLabel('Placa').fill('BRA2E19');
    await assetForm.getByLabel('Marca').fill('Ford');
    await assetForm.getByLabel('Modelo').fill('Maverick');
    await assetForm.getByLabel('Ano Fab.').fill('1974');
    await assetForm.getByLabel('KM').fill('55000');
    await assetForm.locator('label:has-text("Possui Chave?")').locator('..').getByRole('switch').check();

    // Salvar
    await page.getByRole('button', { name: 'Criar Ativo' }).click();
    
    // Verificação
    await expect(page.getByText('Ativo criado com sucesso.')).toBeVisible({ timeout: 10000 });
    const url = page.url();
    const match = url.match(/\/admin\/assets\/(.+)\/edit/);
    if (match) createdAssetIds.push(match[1]);

    await page.goto('/admin/assets');
    await expect(page.getByText(testVehicleAssetName)).toBeVisible();
  });
});
