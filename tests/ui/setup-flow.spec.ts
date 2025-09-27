// tests/ui/setup-flow.spec.ts
import { test, expect, type Page } from '@playwright/test';

// Este teste é especial porque ele precisa garantir que o estado de "setup" não está completo.
// Vamos usar um truque para simular isso antes de cada teste.

test.describe('Módulo 22: Fluxo de Configuração Inicial (Setup)', () => {

  test.beforeEach(async ({ page }) => {
    // ESSENCIAL: Limpa o indicador de que o setup foi concluído.
    // Isso garante que o middleware de setup redirecione para a página correta.
    await page.addInitScript(() => {
      window.localStorage.removeItem('bidexpert_setup_complete');
    });

    console.log('[Setup Flow Test] Navigating to root to trigger setup...');
    await page.goto('/');
    
    // Aguarda o redirecionamento para a página de setup
    await page.waitForURL('/setup', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Bem-vindo ao Assistente de Configuração/i })).toBeVisible();
    console.log('[Setup Flow Test] Successfully redirected to setup page.');
  });

  test('Cenário 22.1: should complete the entire setup wizard flow', async ({ page }) => {
    
    // --- STEP 1: Welcome & DB Check ---
    console.log('[Setup Flow Test] Step 1: Welcome Screen...');
    // A verificação do DB é visual. O botão de avançar estar habilitado já é um bom sinal.
    await expect(page.getByRole('button', { name: 'Avançar para Dados Iniciais' })).toBeEnabled();
    await page.getByRole('button', { name: 'Avançar para Dados Iniciais' }).click();
    
    await expect(page.getByRole('heading', { name: 'População Inicial do Banco de Dados' })).toBeVisible();
    console.log('- PASSED: Advanced to Seeding step.');
    
    // --- STEP 2: Seeding Data ---
    console.log('[Setup Flow Test] Step 2: Seeding Data...');
    // Clicar para popular os dados de demonstração
    await page.getByRole('button', { name: /Popular com Dados de Demonstração/i }).click();

    // Esperar pelo toast de sucesso (pode levar um tempo)
    await expect(page.getByText('Banco de dados populado com dados de demonstração com sucesso!')).toBeVisible({ timeout: 45000 });
    
    // Clicar para verificar e avançar
    await page.getByRole('button', { name: 'Verificar e Avançar' }).click();
    await expect(page.getByRole('heading', { name: 'Criar Conta de Administrador' })).toBeVisible();
    console.log('- PASSED: Data seeded and advanced to Admin User step.');

    // --- STEP 3: Admin User Creation ---
    console.log('[Setup Flow Test] Step 3: Creating Admin User...');
    // Os valores padrão já estão preenchidos, então só precisamos salvar.
    await page.getByRole('button', { name: 'Salvar e Avançar' }).click();
    await expect(page.getByText('Administrador Criado!')).toBeVisible({ timeout: 10000 });
    
    await expect(page.getByRole('heading', { name: 'Configuração Concluída!' })).toBeVisible();
    console.log('- PASSED: Admin user created and advanced to Finish step.');

    // --- STEP 4: Finish ---
    console.log('[Setup Flow Test] Step 4: Finishing setup...');
    // Clicar no botão final para ir para o dashboard
    await page.getByRole('button', { name: 'Ir para o Painel de Administração' }).click();

    // Verificar o redirecionamento para o dashboard de admin
    await page.waitForURL('/admin/dashboard', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Painel de Administração' })).toBeVisible();
    console.log('- PASSED: Successfully redirected to the admin dashboard.');

    // --- FINAL VERIFICATION ---
    console.log('[Setup Flow Test] Final Verification: Trying to access setup again...');
    // Tentar acessar a página de setup novamente
    await page.goto('/setup');
    
    // Deve ser redirecionado para longe do setup (para o dashboard, por exemplo)
    await page.waitForURL(/\/admin\/dashboard|\/dashboard\/overview/);
    await expect(page).not.toHaveURL('/setup');
    console.log('- PASSED: Access to /setup is now blocked. Setup flow is complete.');
  });
});
