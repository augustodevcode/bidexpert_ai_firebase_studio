// tests/ui/admin-crud-judicial-branch.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testBranchName = `Vara Playwright ${testRunId}`;
const updatedBranchName = `Vara Editada ${testRunId}`;
const prisma = new PrismaClient();
let createdBranchId: string | null = null;
let testCourt: any, testState: any, testDistrict: any;

test.describe('Módulo 1: Administração - CRUD de Vara Judicial (UI com Verificação no DB)', () => {
    
  test.beforeAll(async () => {
    testState = await prisma.state.upsert({ where: { uf: 'TS' }, update: {}, create: { name: `Test State ${testRunId}`, uf: 'TS', slug: `test-state-branch-${testRunId}`}});
    testCourt = await prisma.court.create({ data: { name: `Test Court ${testRunId}`, slug: `test-court-branch-${testRunId}`, stateUf: 'TS' }});
    testDistrict = await prisma.judicialDistrict.create({ data: { name: `Test District ${testRunId}`, slug: `test-district-branch-${testRunId}`, courtId: testCourt.id, stateId: testState.id }});
  });

  test.afterAll(async () => {
    if (createdBranchId) {
        await prisma.judicialBranch.delete({ where: { id: createdBranchId } }).catch(e => console.error(e));
    }
    if (testDistrict) await prisma.judicialDistrict.delete({ where: { id: testDistrict.id } });
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

    await page.goto('/admin/judicial-branches');
    await expect(page.getByRole('heading', { name: 'Gerenciar Varas Judiciais' })).toBeVisible({timeout: 20000});
  });

  test('Cenário: should perform a full CRUD cycle for a Judicial Branch', async ({ page }) => {
    
    // --- CREATE ---
    await page.getByRole('button', { name: 'Nova Vara' }).click();
    await expect(page.getByRole('heading', { name: 'Nova Vara Judicial' })).toBeVisible({ timeout: 15000 });

    await page.locator('[data-ai-id="entity-selector-trigger-district"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-district"]').getByText(testDistrict.name).click();

    await page.getByLabel('Nome da Vara').fill(testBranchName);
    
    await page.getByRole('button', { name: 'Criar Vara' }).click();
    
    await expect(page.getByText('Vara criada com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Gerenciar Varas Judiciais' })).toBeVisible();

    // --- READ & DB VERIFICATION (CREATE) ---
    const createdInDB = await prisma.judicialBranch.findFirst({ where: { name: testBranchName } });
    expect(createdInDB).toBeDefined();
    expect(createdInDB?.name).toBe(testBranchName);
    expect(createdInDB?.districtId).toBe(testDistrict.id);
    createdBranchId = createdInDB!.id;

    await page.getByPlaceholder('Buscar por nome da vara...').fill(testBranchName);
    const newRow = page.getByRole('row', { name: new RegExp(testBranchName, 'i') });
    await expect(newRow).toBeVisible();

    // --- UPDATE ---
    await newRow.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/judicial-branches\/.+\/edit/);
    
    await expect(page.getByRole('heading', { name: 'Editar Vara Judicial' })).toBeVisible();
    await page.getByLabel('Nome da Vara').fill(updatedBranchName);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Vara atualizada com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/judicial-branches');
    await expect(page.getByText(updatedBranchName)).toBeVisible();
    
    // --- DB VERIFICATION (UPDATE) ---
    const updatedInDB = await prisma.judicialBranch.findUnique({ where: { id: createdBranchId } });
    expect(updatedInDB?.name).toBe(updatedBranchName);


    // --- DELETE ---
    const rowToDelete = page.getByRole('row', { name: new RegExp(updatedBranchName, 'i') });
    await rowToDelete.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();

    await expect(page.getByText('Vara excluída com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedBranchName)).not.toBeVisible();
    
    // --- DB VERIFICATION (DELETE) ---
    const deletedInDB = await prisma.judicialBranch.findUnique({ where: { id: createdBranchId } });
    expect(deletedInDB).toBeNull();
    createdBranchId = null;
  });
});
