// tests/ui/admin-crud-auctioneer.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testAuctioneerName = `Leiloeiro Playwright ${testRunId}`;
const updatedContactName = `Contato Editado ${testRunId}`;
const prisma = new PrismaClient();

test.describe('Módulo 1: Administração - CRUD de Leiloeiro (UI com Verificação no DB)', () => {
  let createdAuctioneerId: string | null = null;

  test.afterAll(async () => {
    try {
      if (createdAuctioneerId) {
        await prisma.auctioneer.delete({ where: { id: createdAuctioneerId } });
      }
      await prisma.auctioneer.deleteMany({ where: { name: { contains: testRunId } } });
    } catch (error) {
      console.error('[CLEANUP] Failed to delete test auctioneer:', error);
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    console.log('[Admin CRUD Auctioneer] Logging in as Admin...');
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    
    await page.waitForURL('/dashboard/overview', { timeout: 20000 });
    console.log('[Admin CRUD Auctioneer] Login successful. Navigating to auctioneers page...');

    await page.goto('/admin/auctioneers');
    await expect(page.locator('[data-ai-id="admin-auctioneers-page-container"]')).toBeVisible({ timeout: 20000 });
    console.log('[Admin CRUD Auctioneer] Arrived at auctioneers page.');
  });

  test('Cenário: should perform a full CRUD cycle for an Auctioneer', async ({ page }) => {
    
    // --- CREATE ---
    console.log('[Admin CRUD Auctioneer] Starting CREATE step...');
    await page.getByRole('button', { name: 'Novo Leiloeiro' }).click();
    await expect(page.locator('[data-ai-id="admin-new-auctioneer-page"]')).toBeVisible({ timeout: 15000 });

    await page.locator('[data-ai-id="auctioneer-form"]').getByLabel('Nome do Leiloeiro/Empresa').fill(testAuctioneerName);
    await page.locator('[data-ai-id="auctioneer-form"]').getByLabel('Nome do Contato (Opcional)').fill('Contato Leiloeiro');
    await page.locator('[data-ai-id="form-page-layout-card"]').getByRole('button', { name: 'Salvar' }).click();
    
    await expect(page.getByText('Leiloeiro criado com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-ai-id="admin-auctioneers-page-container"]')).toBeVisible();
    console.log('[Admin CRUD Auctioneer] CREATE step UI finished successfully.');

    // --- READ & DB VERIFICATION (CREATE) ---
    console.log('[Admin CRUD Auctioneer] Starting READ and DB VERIFICATION (CREATE) step...');
    const createdAuctioneerInDB = await prisma.auctioneer.findFirst({ where: { name: testAuctioneerName } });
    expect(createdAuctioneerInDB).toBeDefined();
    expect(createdAuctioneerInDB?.name).toBe(testAuctioneerName);
    createdAuctioneerId = createdAuctioneerInDB!.id;
    
    await page.locator('[data-ai-id="search-results-frame-search-input"]').fill(testAuctioneerName);
    const newRow = page.getByRole('row', { name: new RegExp(testAuctioneerName, 'i') });
    await expect(newRow).toBeVisible();
    console.log('[Admin CRUD Auctioneer] READ and DB VERIFICATION (CREATE) step finished successfully.');

    // --- UPDATE ---
    console.log('[Admin CRUD Auctioneer] Starting UPDATE step...');
    await newRow.getByRole('link', { name: 'Editar' }).click();
    await page.waitForURL(new RegExp(`/admin/auctioneers/${createdAuctioneerId}/edit`), { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Visualizar Leiloeiro' })).toBeVisible();
    
    await page.locator('[data-ai-id="form-page-btn-edit-mode"]').click();
    const contactInput = page.locator('[data-ai-id="auctioneer-form"]').getByLabel('Nome do Contato (Opcional)');
    await contactInput.fill(updatedContactName);

    await page.locator('[data-ai-id="form-page-btn-save"]').click();
    
    await expect(page.getByText('Leiloeiro atualizado.')).toBeVisible();
    await expect(page.locator('[data-ai-id="auctioneer-form"]').getByLabel('Nome do Contato (Opcional)')).toHaveValue(updatedContactName);
    console.log('[Admin CRUD Auctioneer] UPDATE step UI finished successfully.');
    
    // --- DB VERIFICATION (UPDATE) ---
    console.log('[Admin CRUD Auctioneer] Starting DB VERIFICATION (UPDATE) step...');
    const updatedAuctioneerInDB = await prisma.auctioneer.findUnique({ where: { id: createdAuctioneerId } });
    expect(updatedAuctioneerInDB?.contactName).toBe(updatedContactName);
    console.log('[Admin CRUD Auctioneer] DB VERIFICATION (UPDATE) step finished successfully.');
    
    // --- DELETE ---
    console.log('[Admin CRUD Auctioneer] Starting DELETE step...');
    await page.locator('[data-ai-id="form-page-btn-delete-trigger"]').click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.locator('[data-ai-id="form-page-btn-delete-confirm"]').click();
    
    await expect(page.getByText('Leiloeiro excluído com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/auctioneers');
    
    await page.locator('[data-ai-id="search-results-frame-search-input"]').fill(testAuctioneerName);
    await expect(page.getByText('Nenhum resultado encontrado.')).toBeVisible();
    console.log('[Admin CRUD Auctioneer] DELETE step UI finished successfully.');
    
    // --- DB VERIFICATION (DELETE) ---
    console.log('[Admin CRUD Auctioneer] Starting DB VERIFICATION (DELETE) step...');
    const deletedAuctioneerInDB = await prisma.auctioneer.findUnique({ where: { id: createdAuctioneerId } });
    expect(deletedAuctioneerInDB).toBeNull();
    createdAuctioneerId = null; // Clear ID after successful deletion
    console.log('[Admin CRUD Auctioneer] DB VERIFICATION (DELETE) step finished successfully.');
  });
});
