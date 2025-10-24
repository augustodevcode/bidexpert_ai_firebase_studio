// tests/ui-plus/01-admin-create-auction-full.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testAuctionTitle = `Leilão Exaustivo Playwright ${testRunId}`;
const prisma = new PrismaClient();
let createdAuctionId: string | null = null;
let testSellerId: string, testAuctioneerId: string, testCategoryId: string, testStateId: string, testCityId: string;

test.describe('Testes de UI Exaustivos - Criação de Leilão', () => {

  test.beforeAll(async () => {
    // Criar dependências
    const state = await prisma.state.upsert({ where: { uf: 'TP' }, create: { name: 'Test State', uf: 'TP', slug: 'test-state' }, update: {} });
    testStateId = state.id;
    const city = await prisma.city.create({ data: { name: `Test City ${testRunId}`, stateId: state.id, slug: `test-city-${testRunId}` }});
    testCityId = city.id;
    
    // Assume-se que o tenant '1' (landlord) existe
    const seller = await prisma.seller.create({ data: { name: `Comitente para Leilão ${testRunId}`, slug: `seller-leilao-${testRunId}`, publicId: `pub-seller-${testRunId}`, tenantId: '1' } });
    testSellerId = seller.id;
    const auctioneer = await prisma.auctioneer.create({ data: { name: `Leiloeiro para Leilão ${testRunId}`, slug: `auct-leilao-${testRunId}`, publicId: `pub-auct-${testRunId}`, tenantId: '1' } });
    testAuctioneerId = auctioneer.id;
    const category = await prisma.lotCategory.create({ data: { name: `Categoria para Leilão ${testRunId}`, slug: `cat-leilao-${testRunId}` } });
    testCategoryId = category.id;
  });

  test.afterAll(async () => {
    // Limpar os dados criados
    if (createdAuctionId) await prisma.auction.delete({ where: { id: createdAuctionId } }).catch(e => console.error(e));
    if (testSellerId) await prisma.seller.delete({ where: { id: testSellerId } }).catch(e => console.error(e));
    if (testAuctioneerId) await prisma.auctioneer.delete({ where: { id: testAuctioneerId } }).catch(e => console.error(e));
    if (testCategoryId) await prisma.lotCategory.delete({ where: { id: testCategoryId } }).catch(e => console.error(e));
    if (testCityId) await prisma.city.delete({ where: { id: testCityId } }).catch(e => console.error(e));
    // Não deletar o estado para evitar problemas com outras FKs.
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

  test('Cenário: Deve preencher todos os campos do formulário de leilão e salvar com sucesso', async ({ page }) => {
    await page.goto('/admin/auctions/new');
    await expect(page.locator('[data-ai-id="admin-auction-form-card"]')).toBeVisible({ timeout: 15000 });
    const auctionForm = page.locator('[data-ai-id="admin-auction-form-card"]');

    // Aba 1: Informações Gerais
    await auctionForm.getByRole('button', { name: 'Informações Gerais' }).click();
    await auctionForm.getByLabel('Título do Leilão').fill(testAuctionTitle);
    await auctionForm.getByLabel('Descrição (Opcional)').fill(`Descrição completa para o ${testAuctionTitle}.`);
    
    // Seletores de Entidade
    await auctionForm.locator('[data-ai-id="entity-selector-trigger-category"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-category"]`).getByText(new RegExp(`Categoria para Leilão ${testRunId}`)).click();
    
    await auctionForm.locator('[data-ai-id="entity-selector-trigger-auctioneer"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-auctioneer"]`).getByText(new RegExp(`Leiloeiro para Leilão ${testRunId}`)).click();
    
    await auctionForm.locator('[data-ai-id="entity-selector-trigger-seller"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-seller"]`).getByText(new RegExp(`Comitente para Leilão ${testRunId}`)).click();
    
    // Aba 2: Modalidade, Método e Local
    await auctionForm.getByRole('button', { name: 'Modalidade, Método e Local' }).click();
    await auctionForm.getByLabel('Modalidade do Leilão').locator('button').click();
    await page.getByRole('option', { name: 'Extrajudicial' }).click();
    
    await auctionForm.getByLabel('Forma de Participação').locator('button').click();
    await page.getByRole('option', { name: 'Híbrido (Online e Presencial)' }).click();
    
    await auctionForm.getByLabel('URL do Leilão Online').fill('https://meet.google.com/test');
    await auctionForm.getByLabel('CEP').fill('01001000'); // Exemplo de CEP de SP
    await page.waitForTimeout(500); // Aguardar o preenchimento automático
    await expect(auctionForm.getByLabel('Endereço')).toHaveValue('Praça da Sé');
    
    // Aba 3: Datas e Prazos
    await auctionForm.getByRole('button', { name: 'Datas e Prazos' }).click();
    await auctionForm.getByLabel('Nome da Etapa').fill('1ª Super Praça');
    
    // Aba 4: Opções Avançadas
    await auctionForm.getByRole('button', { name: 'Opções Avançadas' }).click();
    await auctionForm.locator('label:has-text("Destaque")').locator('..').getByRole('switch').check();
    
    // Salvar
    await page.locator('[data-ai-id="form-page-btn-save"]').click();

    // Verificação
    await expect(page.getByText('Leilão criado com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL(/\/admin\/auctions\/.+\/edit/);
    
    // Verifica se os dados salvos estão corretos na página de edição
    await expect(page.getByLabel('Título do Leilão')).toHaveValue(testAuctionTitle);
    await expect(page.getByLabel('Forma de Participação')).toContainText('Híbrido');
    await expect(page.locator('label:has-text("Destaque")').locator('..').getByRole('switch')).toBeChecked();
    
    // Guarda o ID para o cleanup
    const url = page.url();
    const match = url.match(/\/admin\/auctions\/([a-zA-Z0-9-]+)\/edit/);
    if (match) {
        createdAuctionId = match[1];
    }
  });
});
