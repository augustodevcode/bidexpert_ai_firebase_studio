// tests/ui-plus/14-admin-create-subcategory-full.spec.ts
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testCategoryName = `Categoria Pai P+ ${testRunId}`;
const testSubcategoryName = `Subcategoria P+ ${testRunId}`;
const prisma = new PrismaClient();
let createdSubcategoryId: string | null = null;
let testCategoryId: string;

test.describe('Testes de UI Exaustivos - Criação de Subcategoria', () => {

  test.beforeAll(async () => {
    // Dependência: Categoria Pai
    const category = await prisma.lotCategory.create({
      data: { name: testCategoryName, slug: `cat-pai-p-plus-${testRunId}` }
    });
    testCategoryId = category.id;
  });

  test.afterAll(async () => {
    if (createdSubcategoryId) await prisma.subcategory.delete({ where: { id: createdSubcategoryId } }).catch(e => console.error(e));
    if (testCategoryId) await prisma.lotCategory.delete({ where: { id: testCategoryId } }).catch(e => console.error(e));
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('bidexpert_setup_complete', 'true'));
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    await page.waitForURL('/dashboard/overview');
    await page.goto('/admin/subcategories/new');
    await expect(page.getByRole('heading', { name: 'Nova Subcategoria' })).toBeVisible({ timeout: 15000 });
  });

  test('Cenário: Deve preencher todos os campos do formulário de Subcategoria e salvar', async ({ page }) => {
    // Selecionar Categoria Pai
    await page.locator('[data-ai-id="entity-selector-trigger-parentCategory"]').click();
    await page.locator(`[data-ai-id="entity-selector-modal-parentCategory"]`).getByText(testCategoryName).click();
    
    // Preencher campos
    await page.getByLabel('Nome da Subcategoria').fill(testSubcategoryName);
    await page.getByLabel('Descrição (Opcional)').fill('Descrição completa da subcategoria de teste.');
    await page.getByLabel('Ordem de Exibição (Opcional)').fill('10');
    await page.getByLabel('Dica para IA (Ícone - Opcional)').fill('icone categoria teste');
    
    // Salvar
    await page.getByRole('button', { name: 'Criar Subcategoria' }).click();

    // Verificação
    await expect(page.getByText('Subcategoria criada com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('/admin/subcategories');
    
    // Na página de listagem, selecionar a categoria pai para ver a subcategoria criada
    await page.locator('#parentCategorySelect').click();
    await page.getByText(testCategoryName).click();
    
    const createdRow = page.getByRole('row', { name: new RegExp(testSubcategoryName, 'i') });
    await expect(createdRow).toBeVisible();

    const createdInDB = await prisma.subcategory.findFirst({ where: { name: testSubcategoryName } });
    expect(createdInDB).toBeDefined();
    createdSubcategoryId = createdInDB!.id;
  });
});
