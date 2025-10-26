// tests/ui-plus/07-admin-create-judicial-process-full.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testProcessNumber = `333-UI-PROC-PLUS-${testRunId}`;
const prisma = new PrismaClient();
let createdProcessId: string | null = null;
let testCourtId: string, testStateId: string, testDistrictId: string, testBranchId: string;

test.describe('Testes de UI Exaustivos - Criação de Processo Judicial', () => {

  test.beforeAll(async () => {
    const state = await prisma.state.upsert({ where: { uf: 'TS' }, create: { name: 'Test State', uf: 'TS', slug: 'test-state' }, update: {} });
    testStateId = state.id;
    const court = await prisma.court.create({ data: { name: `Test Court Proc+ ${testRunId}`, slug: `test-court-proc-plus-${testRunId}`, stateUf: 'TS' } });
    testCourtId = court.id;
    const district = await prisma.judicialDistrict.create({ data: { name: `Test District Proc+ ${testRunId}`, slug: `test-district-proc-plus-${testRunId}`, courtId: testCourtId, stateId: testStateId } });
    testDistrictId = district.id;
    const branch = await prisma.judicialBranch.create({ data: { name: `Test Branch Proc+ ${testRunId}`, slug: `test-branch-proc-plus-${testRunId}`, districtId: testDistrictId } });
    testBranchId = branch.id;
  });

  test.afterAll(async () => {
    if (createdProcessId) {
      await prisma.judicialParty.deleteMany({ where: { processId: createdProcessId } });
      await prisma.judicialProcess.delete({ where: { id: createdProcessId } }).catch(e => console.error(e));
    }
    // Opcional: Limpar as entidades de apoio se não forem usadas em outros testes
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');
    await page.goto('/admin/judicial-processes/new');
    await expect(page.locator('[data-ai-id="admin-judicial-process-form-card"]')).toBeVisible({ timeout: 15000 });
  });

  test('Cenário: Deve preencher todos os campos do formulário de Processo Judicial e salvar', async ({ page }) => {
    const processForm = page.locator('[data-ai-id="admin-judicial-process-form-card"]');
    
    // Preencher campos principais
    await processForm.getByLabel('Número do Processo*').fill(testProcessNumber);
    await processForm.locator('label:has-text("Processo Eletrônico")').locator('..').getByRole('switch').uncheck();

    // Selecionar entidades
    await processForm.locator('[data-ai-id="entity-selector-trigger-court"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-court"]`).getByText(new RegExp(`Test Court Proc\\+ ${testRunId}`)).click();

    await processForm.locator('[data-ai-id="entity-selector-trigger-district"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-district"]`).getByText(new RegExp(`Test District Proc\\+ ${testRunId}`)).click();

    await processForm.locator('[data-ai-id="entity-selector-trigger-branch"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-branch"]`).getByText(new RegExp(`Test Branch Proc\\+ ${testRunId}`)).click();

    // Adicionar e preencher múltiplas partes
    await processForm.getByLabel('Nome', { exact: true }).fill(`Autor Principal ${testRunId}`);
    
    await processForm.getByRole('button', { name: 'Adicionar Parte' }).click();
    const secondPartyRow = processForm.locator('.space-y-3 > .bg-background').nth(1);
    await secondPartyRow.getByLabel('Nome').fill(`Réu Principal ${testRunId}`);
    await secondPartyRow.locator('button[role="combobox"]').click();
    await page.getByRole('option', { name: 'Réu / Executado' }).click();

    await processForm.getByRole('button', { name: 'Adicionar Parte' }).click();
    const thirdPartyRow = processForm.locator('.space-y-3 > .bg-background').nth(2);
    await thirdPartyRow.getByLabel('Nome').fill(`Advogado do Autor ${testRunId}`);
    await thirdPartyRow.locator('button[role="combobox"]').click();
    await page.getByRole('option', { name: 'Advogado (Autor)' }).click();

    // Salvar
    await page.getByRole('button', { name: 'Criar Processo' }).click();
    
    // Verificação
    await expect(page.getByText('Processo judicial criado com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('/admin/judicial-processes');
    
    const createdRow = page.getByRole('row', { name: new RegExp(testProcessNumber, 'i') });
    await expect(createdRow).toBeVisible();

    const createdInDB = await prisma.judicialProcess.findFirst({
        where: { processNumber: testProcessNumber },
        include: { parties: true }
    });
    expect(createdInDB).toBeDefined();
    expect(createdInDB?.parties.length).toBe(3);
    createdProcessId = createdInDB!.id;
  });
});
