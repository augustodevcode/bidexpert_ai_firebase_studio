// tests/ui/admin-crud-court.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testCourtName = `Tribunal Playwright ${testRunId}`;
const updatedCourtName = `Tribunal Editado ${testRunId}`;
const prisma = new PrismaClient();

test.describe('Módulo 1: Administração - CRUD de Tribunal (UI com Verificação no DB)', () => {
  let createdCourtId: string | null = null;

  test.afterAll(async () => {
    if (createdCourtId) {
        await prisma.court.delete({ where: { id: createdCourtId } }).catch(e => console.error(e));
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill('admin@bidexpert.com.br');
    await page.locator('input[name="password"]').fill('Admin@123');
    await page.getByRole('button', { name: 'Login' }).click();
    
    await page.waitForURL('/dashboard/overview', { timeout: 20000 });

    await page.goto('/admin/courts');
    await expect(page.getByRole('heading', { name: 'Gerenciar Tribunais de Justiça' })).toBeVisible({ timeout: 20000 });
  });

  test('Cenário: should perform a full CRUD cycle for a Court', async ({ page }) => {
    
    // --- CREATE ---
    await page.getByRole('button', { name: 'Novo Tribunal' }).click();
    await expect(page.getByRole('heading', { name: 'Novo Tribunal' })).toBeVisible({ timeout: 15000 });

    await page.getByLabel('Nome do Tribunal').fill(testCourtName);
    
    // Selecionar o estado
    await page.locator('[data-ai-id="entity-selector-trigger-state"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-state"]').getByText('São Paulo (SP)').click();


    await page.getByRole('button', { name: 'Criar Tribunal' }).click();
    
    await expect(page.getByText('Tribunal criado com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Gerenciar Tribunais de Justiça' })).toBeVisible();

    // --- READ & DB VERIFICATION (CREATE) ---
    const createdCourtInDB = await prisma.court.findFirst({ where: { name: testCourtName } });
    expect(createdCourtInDB).toBeDefined();
    expect(createdCourtInDB?.name).toBe(testCourtName);
    expect(createdCourtInDB?.stateUf).toBe('SP');
    createdCourtId = createdCourtInDB!.id;

    await page.getByPlaceholder('Buscar por nome...').fill(testCourtName);
    const newRow = page.getByRole('row', { name: new RegExp(testCourtName, 'i') });
    await expect(newRow).toBeVisible();
    await expect(newRow).toContainText('SP');

    // --- UPDATE ---
    await newRow.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/courts\/.+\/edit/);
    
    await expect(page.getByRole('heading', { name: 'Editar Tribunal' })).toBeVisible();
    await page.getByLabel('Nome do Tribunal').fill(updatedCourtName);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Tribunal atualizado com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/courts');
    await expect(page.getByText(updatedCourtName)).toBeVisible();

    // --- DB VERIFICATION (UPDATE) ---
    const updatedCourtInDB = await prisma.court.findUnique({ where: { id: createdCourtId } });
    expect(updatedCourtInDB?.name).toBe(updatedCourtName);

    // --- DELETE ---
    const rowToDelete = page.getByRole('row', { name: new RegExp(updatedCourtName, 'i') });
    await rowToDelete.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();

    await expect(page.getByText('Tribunal excluído com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedCourtName)).not.toBeVisible();
    
    // --- DB VERIFICATION (DELETE) ---
    const deletedCourtInDB = await prisma.court.findUnique({ where: { id: createdCourtId } });
    expect(deletedCourtInDB).toBeNull();
    createdCourtId = null; // Clear ID after successful deletion
  });
});
