// tests/ui-plus/10-admin-create-vehicle-model-full.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testMakeName = `Marca para Modelo P+ ${testRunId}`;
const testModelName = `Modelo P+ ${testRunId}`;
const prisma = new PrismaClient();
let createdModelId: string | null = null;
let testMakeId: string;

test.describe('Testes de UI Exaustivos - Criação de Modelo de Veículo', () => {

  test.beforeAll(async () => {
    const make = await prisma.vehicleMake.create({ data: { name: testMakeName, slug: `make-p-plus-${testRunId}` } });
    testMakeId = make.id;
  });

  test.afterAll(async () => {
    if (createdModelId) await prisma.vehicleModel.delete({ where: { id: createdModelId } }).catch(e => console.error(e));
    if (testMakeId) await prisma.vehicleMake.delete({ where: { id: testMakeId } }).catch(e => console.error(e));
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');
    await page.goto('/admin/vehicle-models/new');
    await expect(page.getByRole('heading', { name: 'Novo Modelo de Veículo' })).toBeVisible({ timeout: 15000 });
  });

  test('Cenário: Deve criar um novo Modelo de Veículo', async ({ page }) => {
    // Selecionar a Marca
    await page.locator('[data-ai-id="entity-selector-trigger-make"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-make"]`).getByText(testMakeName).click();
    
    // Preencher o nome do modelo
    await page.getByLabel('Nome do Modelo').fill(testModelName);
    
    // Salvar
    await page.getByRole('button', { name: 'Criar Modelo' }).click();
    
    // Verificação
    await expect(page.getByText('Modelo criado com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('/admin/vehicle-models');
    
    const createdRow = page.getByRole('row', { name: new RegExp(testModelName, 'i') });
    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText(testMakeName);

    const createdInDB = await prisma.vehicleModel.findFirst({ where: { name: testModelName } });
    expect(createdInDB).toBeDefined();
    createdModelId = createdInDB!.id;
  });
});
