// tests/ui-plus/08-admin-create-judicial-entities-full.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testCourtName = `Tribunal P+ ${testRunId}`;
const testDistrictName = `Comarca P+ ${testRunId}`;
const testBranchName = `Vara P+ ${testRunId}`;

const prisma = new PrismaClient();
let createdCourtId: string | null = null;
let createdDistrictId: string | null = null;
let createdBranchId: string | null = null;
let testStateId: string;

test.describe('Testes de UI Exaustivos - Criação de Entidades Judiciais', () => {

  test.beforeAll(async () => {
    const state = await prisma.state.upsert({ where: { uf: 'TP' }, create: { name: 'Test State JE', uf: 'TP', slug: 'test-state-je' }, update: {} });
    testStateId = state.id;
  });

  test.afterAll(async () => {
    if (createdBranchId) await prisma.judicialBranch.delete({ where: { id: createdBranchId } }).catch(e => console.error(e));
    if (createdDistrictId) await prisma.judicialDistrict.delete({ where: { id: createdDistrictId } }).catch(e => console.error(e));
    if (createdCourtId) await prisma.court.delete({ where: { id: createdCourtId } }).catch(e => console.error(e));
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

  test('Cenário: Deve criar um Tribunal, depois uma Comarca e por fim uma Vara', async ({ page }) => {
    
    // 1. Criar Tribunal
    await page.goto('/admin/courts/new');
    await page.getByLabel('Nome do Tribunal').fill(testCourtName);
    await page.getByLabel('Website (Opcional)').fill('https://tjp.jus.br');
    await page.locator('[data-ai-id="entity-selector-trigger-state"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-state"]').getByText('Test State JE').click();
    await page.getByRole('button', { name: 'Criar Tribunal' }).click();
    await expect(page.getByText('Tribunal criado com sucesso.')).toBeVisible();

    const courtInDb = await prisma.court.findFirst({ where: { name: testCourtName } });
    expect(courtInDb).toBeDefined();
    createdCourtId = courtInDb!.id;

    // 2. Criar Comarca
    await page.goto('/admin/judicial-districts/new');
    await page.getByLabel('Nome da Comarca').fill(testDistrictName);
    await page.getByLabel('CEP (Opcional)').fill('12345-000');
    await page.locator('[data-ai-id="entity-selector-trigger-court"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-court"]`).getByText(testCourtName).click();
    await page.locator('[data-ai-id="entity-selector-trigger-state"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-state"]`).getByText('Test State JE').click();
    await page.getByRole('button', { name: 'Criar Comarca' }).click();
    await expect(page.getByText('Comarca criada com sucesso.')).toBeVisible();

    const districtInDb = await prisma.judicialDistrict.findFirst({ where: { name: testDistrictName } });
    expect(districtInDb).toBeDefined();
    createdDistrictId = districtInDb!.id;

    // 3. Criar Vara
    await page.goto('/admin/judicial-branches/new');
    await page.getByLabel('Nome da Vara').fill(testBranchName);
    await page.getByLabel('Nome do Contato (Opcional)').fill('Escrivão Teste');
    await page.getByLabel('Telefone (Opcional)').fill('11912345678');
    await page.getByLabel('Email (Opcional)').fill('vara@teste.com');
    await page.locator('[data-ai-id="entity-selector-trigger-district"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-district"]`).getByText(testDistrictName).click();
    await page.getByRole('button', { name: 'Criar Vara' }).click();
    await expect(page.getByText('Vara criada com sucesso.')).toBeVisible();

    const branchInDb = await prisma.judicialBranch.findFirst({ where: { name: testBranchName } });
    expect(branchInDb).toBeDefined();
    createdBranchId = branchInDb!.id;
  });
});
