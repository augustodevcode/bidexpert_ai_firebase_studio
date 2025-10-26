// tests/ui-plus/11-admin-create-direct-sale-full.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testBuyNowOfferTitle = `Oferta Compra Imediata P+ ${testRunId}`;
const testProposalOfferTitle = `Oferta de Proposta P+ ${testRunId}`;
const prisma = new PrismaClient();
let createdOfferIds: string[] = [];
let testSellerId: string, testCategoryId: string;

test.describe('Testes de UI Exaustivos - Criação de Oferta de Venda Direta', () => {

  test.beforeAll(async () => {
    // Dependências para a oferta
    const seller = await prisma.seller.create({ data: { tenantId: '1', name: `Vendedor para Ofertas ${testRunId}`, slug: `seller-offer-${testRunId}`, publicId: `pub-seller-offer-${testRunId}` } });
    testSellerId = seller.id;
    const category = await prisma.lotCategory.create({ data: { name: `Categoria para Ofertas ${testRunId}`, slug: `cat-offer-${testRunId}` } });
    testCategoryId = category.id;
  });

  test.afterAll(async () => {
    if (createdOfferIds.length > 0) {
      await prisma.directSaleOffer.deleteMany({ where: { id: { in: createdOfferIds } } }).catch(e => console.error(e));
    }
    if (testSellerId) await prisma.seller.delete({ where: { id: testSellerId } }).catch(e => console.error(e));
    if (testCategoryId) await prisma.lotCategory.delete({ where: { id: testCategoryId } }).catch(e => console.error(e));
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');
    await page.goto('/admin/direct-sales/new');
    await expect(page.getByRole('heading', { name: 'Nova Oferta de Venda Direta' })).toBeVisible({ timeout: 15000 });
  });

  test('Cenário: Deve criar uma oferta do tipo "Comprar Já"', async ({ page }) => {
    const form = page.locator('[data-ai-id="direct-sale-offer-form"]');

    // Preencher campos
    await form.getByLabel('Título da Oferta').fill(testBuyNowOfferTitle);
    await form.getByLabel('Descrição').fill('Descrição completa para a oferta de compra imediata.');
    
    await form.getByLabel('Tipo de Oferta').click();
    await page.getByRole('option', { name: 'Comprar Já (Preço Fixo)' }).click();

    await expect(form.getByLabel('Preço Fixo (R$)')).toBeVisible();
    await form.getByLabel('Preço Fixo (R$)').fill('199.99');

    // Seletores
    await form.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-category"]').getByText(new RegExp(`Categoria para Ofertas ${testRunId}`)).click();
    
    await form.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-seller"]').getByText(new RegExp(`Vendedor para Ofertas ${testRunId}`)).click();

    // Salvar
    await form.getByRole('button', { name: 'Criar Oferta' }).click();

    // Verificação
    await expect(page.getByText('Oferta criada com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('/admin/direct-sales');
    
    const createdRow = page.getByRole('row', { name: new RegExp(testBuyNowOfferTitle, 'i') });
    await expect(createdRow).toBeVisible();
    
    const createdInDB = await prisma.directSaleOffer.findFirst({ where: { title: testBuyNowOfferTitle } });
    expect(createdInDB).toBeDefined();
    createdOfferIds.push(createdInDB!.id);
  });
  
  test('Cenário: Deve criar uma oferta do tipo "Aceita Propostas"', async ({ page }) => {
    const form = page.locator('[data-ai-id="direct-sale-offer-form"]');

    // Preencher campos
    await form.getByLabel('Título da Oferta').fill(testProposalOfferTitle);
    
    await form.getByLabel('Tipo de Oferta').click();
    await page.getByRole('option', { name: 'Aceita Propostas' }).click();

    await expect(form.getByLabel('Proposta Mínima (R$ - Opcional)')).toBeVisible();
    await form.getByLabel('Proposta Mínima (R$ - Opcional)').fill('99.90');

    // Seletores
    await form.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-category"]`).getByText(new RegExp(`Categoria para Ofertas ${testRunId}`)).click();
    
    await form.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-seller"]`).getByText(new RegExp(`Vendedor para Ofertas ${testRunId}`)).click();

    // Salvar
    await form.getByRole('button', { name: 'Criar Oferta' }).click();

    // Verificação
    await expect(page.getByText('Oferta criada com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('/admin/direct-sales');
    
    const createdRow = page.getByRole('row', { name: new RegExp(testProposalOfferTitle, 'i') });
    await expect(createdRow).toBeVisible();
    
    const createdInDB = await prisma.directSaleOffer.findFirst({ where: { title: testProposalOfferTitle } });
    expect(createdInDB).toBeDefined();
    createdOfferIds.push(createdInDB!.id);
  });
});
