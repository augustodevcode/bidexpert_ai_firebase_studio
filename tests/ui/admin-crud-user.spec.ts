// tests/ui/admin-crud-user.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

const testRunId = uuidv4().substring(0, 8);
const testUserEmail = `testuser-playwright-${testRunId}@example.com`;
const testUserName = `Usuário Playwright ${testRunId}`;
const updatedUserName = `Usuário Editado ${testRunId}`;

test.describe('Módulo 1: Administração - CRUD de Usuário (UI)', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });

    console.log('[Admin CRUD User] Logging in as Admin...');
    await page.goto('/auth/login');
    await page.locator('[data-ai-id="auth-login-email-input"]').fill('admin@bidexpert.com.br');
    await page.locator('[data-ai-id="auth-login-password-input"]').fill('Admin@123');
    await page.locator('[data-ai-id="auth-login-submit-button"]').click();
    
    await page.waitForURL('/dashboard/overview', { timeout: 15000 });
    console.log('[Admin CRUD User] Login successful. Navigating to users page...');

    await page.goto('/admin/users');
    await expect(page.locator('[data-ai-id="admin-users-page-container"]')).toBeVisible({ timeout: 20000 });
    console.log('[Admin CRUD User] Arrived at users page.');
  });

  test('Cenário: should perform a full CRUD cycle for a User', async ({ page }) => {
    
    // --- CREATE ---
    console.log('[Admin CRUD User] Starting CREATE step...');
    await page.getByRole('button', { name: 'Novo Usuário' }).click();
    await expect(page.getByRole('heading', { name: 'Novo Usuário' })).toBeVisible();

    await page.getByLabel('Nome Completo').fill(testUserName);
    await page.getByLabel('Email').fill(testUserEmail);
    await page.getByLabel('Senha (Opcional)').fill('password123');
    await page.getByRole('button', { name: 'Criar Usuário' }).click();
    
    await expect(page.getByText('Usuário criado com sucesso.')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-ai-id="admin-users-page-container"]')).toBeVisible();
    console.log('[Admin CRUD User] CREATE step finished successfully.');

    // --- READ ---
    console.log('[Admin CRUD User] Starting READ step...');
    await page.locator('[data-ai-id="data-table-search-input"]').fill(testUserEmail);
    const newRow = page.getByRole('row', { name: new RegExp(testUserName, 'i') });
    await expect(newRow).toBeVisible();
    console.log('[Admin CRUD User] READ step finished successfully.');

    // --- UPDATE ---
    console.log('[Admin CRUD User] Starting UPDATE step...');
    await newRow.getByRole('button', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/users\/.+\/edit/);
    
    // Alterar o nome
    const nameInput = page.getByLabel('Nome Completo');
    await nameInput.fill(updatedUserName);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(page.getByText('Perfil atualizado com sucesso.')).toBeVisible();
    
    // Alterar o perfil (role)
    const roleCheckbox = page.getByLabel('Administrator');
    await roleCheckbox.check();
    await page.getByRole('button', { name: 'Salvar Perfis' }).click();
    await expect(page.getByText('Perfis do usuário atualizados com sucesso.')).toBeVisible();
    
    // Voltar e verificar
    await page.goto('/admin/users');
    await page.locator('[data-ai-id="data-table-search-input"]').fill(testUserEmail);
    const updatedRow = page.getByRole('row', { name: new RegExp(updatedUserName, 'i') });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow.getByText('Administrator')).toBeVisible();
    console.log('[Admin CRUD User] UPDATE step finished successfully.');

    // --- DELETE ---
    console.log('[Admin CRUD User] Starting DELETE step...');
    await updatedRow.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByRole('heading', { name: 'Você tem certeza?' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();
    
    await expect(page.getByText('Usuário excluído com sucesso.')).toBeVisible();
    
    await page.locator('[data-ai-id="data-table-search-input"]').fill(testUserEmail);
    await expect(page.getByText('Nenhum resultado encontrado.')).toBeVisible();
    console.log('[Admin CRUD User] DELETE step finished successfully.');
  });
});
