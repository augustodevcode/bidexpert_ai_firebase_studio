// tests/ui/admin-crud-judicial-process.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testProcessNumber = `111-UI-PROC-${testRunId}`;
const updatedProcessNumber = `222-UI-PROC-${testRunId}`;
const prisma = new PrismaClient();
let createdProcessId: string | null = null;
let testCourt: any, testState: any, testDistrict: any, testBranch: any;


test.describe('Módulo 1: Administração - CRUD de Processo Judicial (UI com Verificação no DB)', () => {

  test.beforeAll(async () => {
    testState = await prisma.state.upsert({ where: { uf: 'TP' }, update: {}, create: { name: `Test State Proc ${testRunId}`, uf: 'TP', slug: `test-state-proc-${testRunId}`}});
    testCourt = await prisma.court.create({ data: { name: `Test Court Proc ${testRunId}`, slug: `test-court-proc-${testRunId}`, stateUf: 'TP' }});
    testDistrict = await prisma.judicialDistrict.create({ data: { name: `Test District Proc ${testRunId}`, slug: `test-district-proc-${testRunId}`, courtId: testCourt.id, stateId: testState.id }});
    testBranch = await prisma.judicialBranch.create({ data: { name: `Test Branch Proc ${testRunId}`, slug: `test-branch-proc-${testRunId}`, districtId: testDistrict.id }});
  });

  test.afterAll(async () => {
    if (createdProcessId) {
        await prisma.judicialProcess.delete({ where: { id: createdProcessId } }).catch(e => console.error(e));
    }
    if (testBranch) await prisma.judicialBranch.delete({ where: { id: testBranch.id } });
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

    await page.goto('/admin/judicial-processes');
    await expect(page.getByRole('heading', { name: 'Gerenciar Processos Judiciais' })).toBeVisible({ timeout: 20000 });
  });

  test('Cenário: should perform a full CRUD cycle for a Judicial Process', async ({ page }) => {
    
    // --- CREATE ---
    await page.getByRole('button', { name: 'Novo Processo' }).click();
    await expect(page.getByRole('heading', { name: 'Novo Processo Judicial' })).toBeVisible({ timeout: 15000 });

    // Preencher o formulário
    await page.getByLabel('Número do Processo*').fill(testProcessNumber);
    
    await page.locator('[data-ai-id="entity-selector-trigger-court"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-court"]').getByText(testCourt.name).click();

    await page.locator('[data-ai-id="entity-selector-trigger-district"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-district"]').getByText(testDistrict.name).click();

    await page.locator('[data-ai-id="entity-selector-trigger-branch"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-branch"]').getByText(testBranch.name).click();
    
    await page.getByLabel('Nome', { exact: true }).fill(`Autor Teste ${testRunId}`);
    
    await page.getByRole('button', { name: 'Criar Processo' }).click();
    
    await expect(page.getByText('Processo judicial criado com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Gerenciar Processos Judiciais' })).toBeVisible();

    // --- READ & DB VERIFICATION (CREATE) ---
    const createdInDB = await prisma.judicialProcess.findFirst({ where: { processNumber: testProcessNumber }, include: { parties: true } });
    expect(createdInDB).toBeDefined();
    expect(createdInDB?.processNumber).toBe(testProcessNumber);
    expect(createdInDB?.branchId).toBe(testBranch.id);
    expect(createdInDB?.parties.length).toBe(1);
    createdProcessId = createdInDB!.id;

    await page.getByPlaceholder('Buscar por nº do processo...').fill(testProcessNumber);
    const newRow = page.getByRole('row', { name: new RegExp(testProcessNumber, 'i') });
    await expect(newRow).toBeVisible();

    // --- UPDATE ---
    await newRow.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/judicial-processes\/.+\/edit/);
    
    await expect(page.getByRole('heading', { name: 'Editar Processo Judicial' })).toBeVisible();
    await page.getByLabel('Número do Processo*').fill(updatedProcessNumber);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    
    await expect(page.getByText('Processo judicial atualizado com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/judicial-processes');
    await expect(page.getByText(updatedProcessNumber)).toBeVisible();

    // --- DB VERIFICATION (UPDATE) ---
    const updatedInDB = await prisma.judicialProcess.findUnique({ where: { id: createdProcessId } });
    expect(updatedInDB?.processNumber).toBe(updatedProcessNumber);

    // --- DELETE ---
    const rowToDelete = page.getByRole('row', { name: new RegExp(updatedProcessNumber, 'i') });
    await rowToDelete.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();
    
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();

    await expect(page.getByText('Processo judicial excluído com sucesso.')).toBeVisible();
    await expect(page.getByText(updatedProcessNumber)).not.toBeVisible();
    
    // --- DB VERIFICATION (DELETE) ---
    const deletedInDB = await prisma.judicialProcess.findUnique({ where: { id: createdProcessId } });
    expect(deletedInDB).toBeNull();
    createdProcessId = null;
  });
});
