// tests/ui-plus/13-admin-create-state-city-full.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testStateName = `Estado P+ ${testRunId}`;
const testStateUf = `P${testRunId.charAt(0)}`;
const testCityName = `Cidade P+ ${testRunId}`;

const prisma = new PrismaClient();
let createdStateId: string | null = null;
let createdCityId: string | null = null;

test.describe('Testes de UI Exaustivos - Criação de Estado e Cidade', () => {

  test.afterAll(async () => {
    if (createdCityId) await prisma.city.delete({ where: { id: createdCityId } }).catch(e => console.error(e));
    if (createdStateId) await prisma.state.delete({ where: { id: createdStateId } }).catch(e => console.error(e));
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

  test('Cenário: Deve criar um novo Estado e depois uma nova Cidade associada', async ({ page }) => {
    // 1. Criar Estado
    await page.goto('/admin/states/new');
    await expect(page.getByRole('heading', { name: 'Novo Estado' })).toBeVisible({ timeout: 15000 });
    
    await page.getByLabel('Nome do Estado').fill(testStateName);
    await page.getByLabel('UF (Sigla)').fill(testStateUf);
    await page.getByRole('button', { name: 'Criar Estado' }).click();
    
    await expect(page.getByText('Estado criado com sucesso.')).toBeVisible();
    
    const stateInDb = await prisma.state.findFirst({ where: { uf: testStateUf } });
    expect(stateInDb).toBeDefined();
    createdStateId = stateInDb!.id;

    // 2. Criar Cidade
    await page.goto('/admin/cities/new');
    await expect(page.getByRole('heading', { name: 'Nova Cidade' })).toBeVisible();

    await page.getByLabel('Nome da Cidade').fill(testCityName);
    await page.getByLabel('Código IBGE da Cidade (Opcional)').fill('1234567');
    
    await page.locator('[data-ai-id="entity-selector-trigger-state"]').click();
    await page.locator('[data-ai-id="entity-selector-modal-state"]').getByText(new RegExp(testStateName)).click();

    await page.getByRole('button', { name: 'Criar Cidade' }).click();
    
    await expect(page.getByText('Cidade criada com sucesso.')).toBeVisible();
    await page.waitForURL('/admin/cities');

    // 3. Verificação Final
    const createdCityRow = page.getByRole('row', { name: new RegExp(testCityName, 'i') });
    await expect(createdCityRow).toBeVisible();
    await expect(createdCityRow).toContainText(testStateUf);

    const cityInDb = await prisma.city.findFirst({ where: { name: testCityName } });
    expect(cityInDb).toBeDefined();
    expect(cityInDb?.stateId).toBe(createdStateId);
    createdCityId = cityInDb!.id;
  });
});
