// tests/ui-plus/03-admin-create-lot-full.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testLotTitle = `Lote Completo Playwright ${testRunId}`;
const prisma = new PrismaClient();
let createdLotId: string | null = null;
let testAuctionId: string, testAssetId: string, testCategoryId: string;

test.describe('Testes de UI Exaustivos - Criação de Lote', () => {

  test.beforeAll(async () => {
    const tenantId = '1';
    const seller = await prisma.seller.create({ data: { tenantId, name: `Comitente para Lote ${testRunId}`, slug: `seller-lot-${testRunId}`, publicId: `pub-seller-lot-${testRunId}` } });
    const auctioneer = await prisma.auctioneer.create({ data: { tenantId, name: `Leiloeiro para Lote ${testRunId}`, slug: `auct-lot-${testRunId}`, publicId: `pub-auct-lot-${testRunId}` } });
    const category = await prisma.lotCategory.create({ data: { name: `Categoria para Lote ${testRunId}`, slug: `cat-lot-${testRunId}` } });
    testCategoryId = category.id;
    const auction = await prisma.auction.create({ data: { tenantId, title: `Leilão para Lote ${testRunId}`, slug: `leilao-lot-${testRunId}`, publicId: `pub-auc-lot-${testRunId}`, status: 'ABERTO_PARA_LANCES', auctionDate: new Date(), auctioneerId: auctioneer.id, sellerId: seller.id } as any });
    testAuctionId = auction.id;
    const asset = await prisma.asset.create({ data: { tenantId, title: `Ativo para Lote ${testRunId}`, publicId: `pub-asset-lot-${testRunId}`, status: 'DISPONIVEL', categoryId: category.id, sellerId: seller.id } });
    testAssetId = asset.id;
  });

  test.afterAll(async () => {
    if (createdLotId) await prisma.lot.delete({ where: { id: createdLotId } }).catch(e => console.error(e));
    if (testAuctionId) await prisma.auction.delete({ where: { id: testAuctionId } }).catch(e => console.error(e));
    await prisma.seller.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.lotCategory.deleteMany({ where: { name: { contains: testRunId } } });
    await prisma.asset.deleteMany({ where: { title: { contains: testRunId } } });
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

  test('Cenário: Deve preencher todos os campos do formulário de lote e salvar com sucesso', async ({ page }) => {
    await page.goto(`/admin/lots/new?auctionId=${testAuctionId}`);
    await expect(page.locator('[data-ai-id="lot-form"]')).toBeVisible({ timeout: 15000 });
    const lotForm = page.locator('[data-ai-id="lot-form"]');

    // Aba Geral
    await lotForm.getByRole('button', { name: 'Geral' }).click();
    await lotForm.getByLabel('Título do Lote').fill(testLotTitle);
    
    // O leilão já deve vir selecionado pela URL
    await expect(lotForm.locator('[data-ai-id="entity-selector-trigger-auction"]')).not.toContainText('Selecione o leilão');
    
    // Aba Financeiro
    await lotForm.getByRole('button', { name: 'Financeiro' }).click();
    // Acessando o input dentro do contexto correto
    const financeiroTab = lotForm.locator('[data-radix-collection-item="financeiro"]');
    await financeiroTab.getByLabel('Lance Inicial (R$)').fill('2500');

    // Aba Bens Vinculados
    await lotForm.getByRole('button', { name: 'Bens Vinculados' }).click();
    // Selecionar o bem na tabela de disponíveis
    const availableAssetsTable = page.locator('[data-ai-id="available-assets-table"]');
    await availableAssetsTable.getByText(new RegExp(`Ativo para Lote ${testRunId}`)).click();
    await page.getByRole('button', { name: 'Vincular Bem' }).click();
    // Verificar se o bem apareceu na lista de vinculados
    const linkedAssetsSection = page.locator('[data-ai-id="linked-assets-section"]');
    await expect(linkedAssetsSection.getByText(new RegExp(`Ativo para Lote ${testRunId}`))).toBeVisible();

    // Salvar
    await page.getByRole('button', { name: 'Criar Lote' }).click();

    // Verificação
    await expect(page.getByText('Lote criado com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL(new RegExp(`/admin/auctions/${testAuctionId}/edit`));
    
    // Na página de edição do leilão, verificar se o lote está listado
    const lotRowInAuctionPage = page.getByRole('row', { name: new RegExp(testLotTitle, 'i') });
    await expect(lotRowInAuctionPage).toBeVisible();

    // Extrair o ID do lote para o cleanup
    const lotLink = await lotRowInAuctionPage.getByRole('link', { name: testLotTitle }).getAttribute('href');
    const match = lotLink?.match(/\/admin\/lots\/(.+)\/edit/);
    if (match) {
        createdLotId = match[1];
    }
  });
});
