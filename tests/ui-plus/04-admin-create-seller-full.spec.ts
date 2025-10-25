// tests/ui-plus/04-admin-create-seller-full.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testSellerName = `Comitente Exaustivo Playwright ${testRunId}`;
const prisma = new PrismaClient();
let createdSellerId: string | null = null;
let testJudicialBranchId: string;

test.describe('Testes de UI Exaustivos - Criação de Comitente', () => {

  test.beforeAll(async () => {
    // Dependências para um vendedor judicial
    const state = await prisma.state.upsert({ where: { uf: 'TS' }, update: {}, create: { name: 'Test State', uf: 'TS', slug: 'test-state' } });
    const court = await prisma.court.create({ data: { name: `Test Court ${testRunId}`, slug: `test-court-${testRunId}`, stateUf: 'TS' } });
    const district = await prisma.judicialDistrict.create({ data: { name: `Test District ${testRunId}`, slug: `test-district-${testRunId}`, courtId: court.id, stateId: state.id } });
    const branch = await prisma.judicialBranch.create({ data: { name: `Test Branch ${testRunId}`, slug: `test-branch-${testRunId}`, districtId: district.id } });
    testJudicialBranchId = branch.id;
  });

  test.afterAll(async () => {
    if (createdSellerId) {
      await prisma.seller.delete({ where: { id: createdSellerId } }).catch(e => console.error(e));
    }
    // Adicionar limpeza de outras entidades criadas se necessário
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');
    await page.goto('/admin/sellers/new');
    await expect(page.locator('[data-ai-id="admin-new-seller-page"]')).toBeVisible({ timeout: 15000 });
  });

  test('Cenário: Deve preencher todos os campos do formulário de comitente e salvar com sucesso', async ({ page }) => {
    const sellerForm = page.locator('[data-ai-id="seller-form"]');

    // Preencher campos de texto
    await sellerForm.getByLabel('Nome do Comitente/Empresa').fill(testSellerName);
    await sellerForm.getByLabel('Nome do Contato (Opcional)').fill('Contato Teste');
    await sellerForm.getByLabel('Email (Opcional)').fill(`seller-${testRunId}@example.com`);
    await sellerForm.getByLabel('Telefone (Opcional)').fill('11999998888');
    await sellerForm.getByLabel('Website (Opcional)').fill('https://www.seller-test.com');
    
    // Endereço
    await sellerForm.getByLabel('CEP').fill('01001000');
    await page.getByRole('button', { name: 'Buscar Endereço' }).click();
    await expect(sellerForm.getByLabel('Endereço')).toHaveValue('Praça da Sé', { timeout: 10000 });
    
    // Logo
    await sellerForm.getByRole('button', { name: 'Escolher da Biblioteca' }).click();
    await page.locator('[data-ai-id="media-library-item-1"]').click(); // Clica na primeira imagem da biblioteca
    await page.locator('[data-ai-id="choose-media-confirm-button"]').click();
    await expect(sellerForm.getByLabel('Logo do Comitente')).toContainText('Alterar Logo');

    await sellerForm.getByLabel('Dica para IA (Logo - Opcional)').fill('logo empresa');
    await sellerForm.getByLabel('Descrição/Observações (Opcional)').fill('Descrição completa do comitente de teste.');

    // Configuração Judicial
    await sellerForm.locator('label:has-text("É Comitente Judicial?")').locator('..').getByRole('switch').check();
    await expect(sellerForm.getByLabel('Vara Judicial Vinculada (Opcional)')).toBeVisible();
    await sellerForm.locator('[data-ai-id="entity-selector-trigger-judicialBranch"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-judicialBranch"]`).getByText(new RegExp(`Test Branch ${testRunId}`)).click();
    
    // Salvar
    await page.locator('[data-ai-id="form-page-btn-save"]').click();

    // Verificação
    await expect(page.getByText('Comitente criado com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('/admin/sellers');

    const createdRow = page.getByRole('row', { name: new RegExp(testSellerName, 'i') });
    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText('Judicial');

    // Pegar o ID do DB para cleanup
    const sellerFromDb = await prisma.seller.findFirst({ where: { name: testSellerName }});
    if (sellerFromDb) {
      createdSellerId = sellerFromDb.id;
    }
  });
});
