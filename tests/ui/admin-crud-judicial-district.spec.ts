// tests/ui/admin-crud-judicial-district.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testDistrictName = `Comarca Playwright ${testRunId}`;
const updatedDistrictName = `Comarca Editada ${testRunId}`;
const prisma = new PrismaClient();
let createdDistrictId: string | null = null;
let testCourt: any, testState: any;

test.describe('Módulo 1: Administração - CRUD de Comarca (UI com Verificação no DB)', () => {

  test.beforeAll(async () => {
    testState = await prisma.state.upsert({ where: { uf: 'TS' }, update: {}, create: { name: `Test State ${testRunId}`, uf: 'TS', slug: `test-state-${testRunId}`}});
    testCourt = await prisma.court.create({ data: { name: `Test Court ${testRunId}`, slug: `test-court-${testRunId}`, stateUf: 'TS' }});
  });

  test.afterAll(async () => {
    if (createdDistrictId) {
        await prisma.judicialDistrict.delete({ where: { id: createdDistrictId } }).catch(e => console.error(e));
    }
    if (testCourt) await prisma.court.delete({ where: { id: testCourt.id } });
    if (testState) await prisma.state.delete({ where: { id: testState.id } });
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
    await page.waitForURL('/dashboard/overview');

    await page.goto('/admin/judicial-districts');
    await expect(page.getByRole('heading', { name: 'Gerenciar Comarcas' })).toBeVisible({ timeout: 20000 });
  });

  test('Cenário: should perform a full CRUD cycle for a Judicial District', async ({ page }) => {
    
    // --- CREATE ---
    await page.getByRole('button', { name: 'Nova Comarca' }).click();
    await expect(page.getByRole('heading', { name: 'Nova Comarca' })).toBeVisible({ timeout: 15000 });

    await page.getByLabel('Nome da Comarca').fill(testDistrictName);
    
    await page.locator('[data-ai-id="entity-selector-trigger-court"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-court"]').getByText(testCourt.name).click();

    await page.locator('[data-ai-id="entity-selector-trigger-state"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-state"]').getByText(testState.name).click();

    await page.getByRole('button', { name: 'Criar Comarca' }).click();
    
    await expect(page.getByText('Comarca criada com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Gerenciar Comarcas' })).toBeVisible();

    // --- READ & DB VERIFICATION (CREATE) ---
    const createdInDB = await prisma.judicialDistrict.findFirst({ where: { name: testDistrictName } });
    expect(createdInDB).toBeDefined();
    expect(createdInDB?.name).toBe(testDistrictName);
    expect(createdInDB?.courtId).toBe(testCourt.id);
    createdDistrictId = createdInDB!.id;

    await page.getByPlaceholder('Buscar por nome da comarca...').fill(testDistrictName);
    const newRow = page.getByRole('row', { name: new RegExp(testDistrictName, 'i') });
    await expect(newRow).toBeVisible();

    // --- UPDATE ---
    await newRow.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/judicial-districts\/.+\/edit/);
    
    await expect(page.getByRole('heading', { name: 'Editar Comarca' })).toBeVisible();
    await page.getByLabel('Nome da Comarca').fill(updatedDistrictName);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Comarca atualizada com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/judicial-districts');
    await expect(page.getByText(updatedDistrictName)).toBeVisible();

    // --- DB VERIFICATION (UPDATE) ---
    const updatedInDB = await prisma.judicialDistrict.findUnique({ where: { id: createdDistrictId } });
    expect(updatedInDB?.name).toBe(updatedDistrictName);

    // --- DELETE ---
    const rowToDelete = page.getByRole('row', { name: new RegExp(updatedDistrictName, 'i') });
    await rowToDelete.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();

    await expect(page.getByText('Comarca excluída com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedDistrictName)).not.toBeVisible();
    
    // --- DB VERIFICATION (DELETE) ---
    const deletedInDB = await prisma.judicialDistrict.findUnique({ where: { id: createdDistrictId } });
    expect(deletedInDB).toBeNull();
    createdDistrictId = null;
  });
});
