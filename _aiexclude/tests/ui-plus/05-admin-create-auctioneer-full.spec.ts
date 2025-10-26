// tests/ui-plus/05-admin-create-auctioneer-full.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testAuctioneerName = `Leiloeiro Exaustivo ${testRunId}`;
const prisma = new PrismaClient();
let createdAuctioneerId: string | null = null;

test.describe('Testes de UI Exaustivos - Criação de Leiloeiro', () => {

  test.afterAll(async () => {
    if (createdAuctioneerId) {
      await prisma.auctioneer.delete({ where: { id: createdAuctioneerId } }).catch(e => console.error(e));
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
    await page.goto('/admin/auctioneers/new');
    await expect(page.locator('[data-ai-id="admin-new-auctioneer-page"]')).toBeVisible({ timeout: 15000 });
  });

  test('Cenário: Deve preencher todos os campos do formulário de leiloeiro e salvar com sucesso', async ({ page }) => {
    const auctioneerForm = page.locator('[data-ai-id="auctioneer-form"]');

    await auctioneerForm.getByLabel('Nome do Leiloeiro/Empresa').fill(testAuctioneerName);
    await auctioneerForm.getByLabel('Número de Registro Oficial').fill(`JUCESP/${testRunId}`);
    await auctioneerForm.getByLabel('Nome do Contato (Opcional)').fill('Contato do Leiloeiro');
    await auctioneerForm.getByLabel('Email de Contato (Opcional)').fill(`leiloeiro-${testRunId}@example.com`);
    await auctioneerForm.getByLabel('Telefone Principal (Opcional)').fill('11988887777');
    await auctioneerForm.getByLabel('Website (Opcional)').fill('https://leiloeiro-teste.com');
    await auctioneerForm.getByLabel('CEP').fill('04538133'); // CEP de SP
    await page.getByRole('button', { name: 'Buscar Endereço' }).click();
    await expect(auctioneerForm.getByLabel('Endereço do Escritório/Pátio')).toHaveValue('Avenida Brigadeiro Faria Lima', { timeout: 10000 });
    
    await auctioneerForm.getByRole('button', { name: 'Escolher da Biblioteca' }).click();
    await page.locator('[data-ai-id="media-library-item-2"]').click();
    await page.locator('[data-ai-id="choose-media-confirm-button"]').click();
    await expect(auctioneerForm.getByLabel('Logo do Leiloeiro')).toContainText('Alterar Logo');

    await auctioneerForm.getByLabel('Dica para IA (Logo - Opcional)').fill('martelo leião');
    await auctioneerForm.getByLabel('Sobre o Leiloeiro/Empresa').fill('Descrição completa do leiloeiro para o teste exaustivo.');

    await page.locator('[data-ai-id="form-page-btn-save"]').click();

    await expect(page.getByText('Leiloeiro criado com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('/admin/auctioneers');

    const createdRow = page.getByRole('row', { name: new RegExp(testAuctioneerName, 'i') });
    await expect(createdRow).toBeVisible();

    const createdInDB = await prisma.auctioneer.findFirst({ where: { name: testAuctioneerName } });
    if (createdInDB) {
      createdAuctioneerId = createdInDB.id;
    }
  });
});
