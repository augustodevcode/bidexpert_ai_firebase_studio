// tests/ui/setup-flow.spec.ts
import { test, expect, type Page } from '@playwright/test';

// This test is special because it needs to ensure the setup state is incomplete.
// We'll use a script to simulate this before each test run.

test.describe('Módulo 22: Fluxo de Configuração Inicial (Setup)', () => {

  test.beforeEach(async ({ page }) => {
    // ESSENTIAL: Clear any existing flag that indicates setup is complete.
    await page.addInitScript(() => {
      // This script runs in the browser context before the page loads.
      window.localStorage.removeItem('bidexpert_setup_complete');
    });

    console.log('[Setup Flow Test] Navigating to root to trigger setup...');
    await page.goto('/');
    
    // Wait for the redirect to the setup page and verify the welcome heading
    await page.waitForURL('/setup', { timeout: 20000 });
    await expect(page.locator('[data-ai-id="setup-page-container"]')).toBeVisible({ timeout: 10000 });
    console.log('[Setup Flow Test] Successfully redirected to setup page.');
  });

  test('Cenário 22.1: should complete the entire setup wizard flow', async ({ page }) => {
    
    // --- STEP 1: Welcome & DB Check ---
    console.log('[Setup Flow Test] Step 1: Welcome Screen...');
    await expect(page.getByRole('button', { name: 'Avançar' })).toBeEnabled({ timeout: 10000 });
    await page.getByRole('button', { name: 'Avançar' }).click();
    
    await expect(page.getByRole('heading', { name: 'População Inicial do Banco de Dados' })).toBeVisible();
    console.log('- PASSED: Advanced to Seeding step.');
    
    // --- STEP 2: Seeding Data ---
    console.log('[Setup Flow Test] Step 2: Seeding Data...');
    await page.getByRole('button', { name: /Popular com Dados de Demonstração/i }).click();

    await expect(page.getByText('Banco de dados populado com dados de demonstração com sucesso!')).toBeVisible({ timeout: 60000 });
    
    await page.getByRole('button', { name: 'Verificar e Avançar' }).click();
    await expect(page.getByRole('heading', { name: 'Criar Conta de Administrador' })).toBeVisible();
    console.log('- PASSED: Data seeded and advanced to Admin User step.');

    // --- STEP 3: Admin User Creation ---
    console.log('[Setup Flow Test] Step 3: Creating Admin User...');
    // Default values are already filled, so we just need to save.
    await page.getByRole('button', { name: 'Salvar e Avançar' }).click();
    await expect(page.getByText('Administrador Criado!')).toBeVisible({ timeout: 10000 });
    
    await expect(page.getByRole('heading', { name: 'Configuração Concluída!' })).toBeVisible();
    console.log('- PASSED: Admin user created and advanced to Finish step.');

    // --- STEP 4: Finish ---
    console.log('[Setup Flow Test] Step 4: Finishing setup...');
    // Click the final button to go to the admin dashboard
    await page.getByRole('button', { name: 'Ir para o Painel de Administração' }).click();

    // Verify redirection to the admin dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 20000 });
    await expect(page.locator('[data-ai-id="admin-dashboard-page-container"]')).toBeVisible();
    console.log('- PASSED: Successfully redirected to the admin dashboard.');

    // --- FINAL VERIFICATION ---
    console.log('[Setup Flow Test] Final Verification: Trying to access setup again...');
    // The setup completion is now handled by a server-side check on the database,
    // so `isSetupComplete` in localStorage is no longer the source of truth.
    // The redirect logic in the layout will handle this. We just need to verify
    // we don't land on /setup again.
    await page.goto('/setup');
    
    // Should be redirected away from setup (e.g., to the dashboard or home)
    await page.waitForURL(/\/dashboard|\/$/);
    await expect(page).not.toHaveURL('/setup');
    console.log('- PASSED: Access to /setup is now blocked. Setup flow is complete.');
  });
});
