// tests/ui-plus/06-admin-create-user-full.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testUserEmail = `user-exaustivo-${testRunId}@example.com`;
const testUserName = `Usuário Exaustivo ${testRunId}`;
const prisma = new PrismaClient();
let createdUserId: string | null = null;

test.describe('Testes de UI Exaustivos - Criação de Usuário', () => {

  test.afterAll(async () => {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(e => console.error(e));
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
    await page.goto('/admin/users/new');
    await expect(page.getByRole('heading', { name: 'Novo Usuário' })).toBeVisible({ timeout: 15000 });
  });

  test('Cenário: Deve preencher todos os campos do formulário de usuário e salvar com sucesso', async ({ page }) => {
    const userForm = page.locator('[data-ai-id="user-profile-form"]');

    // Aba Conta
    await userForm.getByLabel('Nome Completo').fill(testUserName);
    await userForm.getByLabel('Email', { exact: true }).fill(testUserEmail);
    await userForm.getByLabel('Nova Senha').fill('Senha@1234');
    
    // Aba Informações Pessoais
    await userForm.getByRole('button', { name: 'Informações Pessoais' }).click();
    await userForm.getByLabel('CPF').fill('123.456.789-00');
    await userForm.getByLabel('Telefone Celular').fill('11988887777');
    await userForm.getByLabel('RG').fill('12.345.678-9');
    
    // Aba Endereço
    await userForm.getByRole('button', { name: 'Endereço' }).click();
    await userForm.getByLabel('CEP').fill('01311-000'); // CEP Av. Paulista
    await page.getByRole('button', { name: 'Buscar Endereço' }).click();
    await expect(userForm.getByLabel('Logradouro')).toHaveValue('Avenida Paulista', { timeout: 10000 });
    await userForm.getByLabel('Número').fill('1578');
    await userForm.getByLabel('Complemento').fill('Andar 4');

    // Salvar
    await page.locator('[data-ai-id="profile-form-save-button"]').click();

    // Verificação
    await expect(page.getByText('Perfil do usuário criado com sucesso.')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('/admin/users');

    const createdRow = page.getByRole('row', { name: new RegExp(testUserName, 'i') });
    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText(testUserEmail);

    const createdInDB = await prisma.user.findFirst({ where: { email: testUserEmail } });
    if (createdInDB) {
      createdUserId = createdInDB.id;
    }
    expect(createdInDB).toBeDefined();
  });
});
