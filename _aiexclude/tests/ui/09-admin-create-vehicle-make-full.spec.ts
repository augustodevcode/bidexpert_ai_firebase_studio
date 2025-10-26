// tests/ui-plus/09-admin-create-vehicle-make-full.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testMakeName = `Marca P+ ${testRunId}`;
const prisma = new PrismaClient();
let createdMakeId: string | null = null;

test.describe('Testes de UI Exaustivos - Criação de Marca de Veículo', () => {

  test.afterAll(async () => {
    if (createdMakeId) {
      await prisma.vehicleMake.delete({ where: { id: createdMakeId } }).catch(e => console.error(e));
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
    await page.goto('/admin/vehicle-makes/new');
    await expect(page.getByRole('heading', { name: 'Nova Marca de Veículo' })).toBeVisible({ timeout: 15000 });
  });

  test('Cenário: Deve criar uma nova Marca de Veículo', async ({ page }) => {
    // Preencher o formulário
    await page.getByLabel('Nome da Marca').fill(testMakeName);
    
    // Salvar
    await page.getByRole('button', { name: 'Criar Marca' }).click();
    
    // Verificar
    await expect(page.getByText('Marca criada com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('/admin/vehicle-makes');
    
    const createdRow = page.getByRole('row', { name: new RegExp(testMakeName, 'i') });
    await expect(createdRow).toBeVisible();

    const createdInDB = await prisma.vehicleMake.findFirst({ where: { name: testMakeName } });
    expect(createdInDB).toBeDefined();
    createdMakeId = createdInDB!.id;
  });
});
