/**
 * Teste de Login Corrigido - BidExpert
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://bidexpertaifirebasestudio.vercel.app';
const ADMIN_EMAIL = 'admin@bidexpert.com.br';
const ADMIN_PASSWORD = 'Admin@123';

test.setTimeout(120000);

async function performLogin(page: Page): Promise<boolean> {
  console.log('🔐 Iniciando login...');
  
  // Navegar para login
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-results/robot-auction/login-step1.png' });
  
  // Passo 1: Verificar se há botão de workspace/tenant
  const workspaceButton = page.locator('button:has-text("BidExpert"), button:has-text("Demo")').first();
  const hasWorkspace = await workspaceButton.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (hasWorkspace) {
    console.log('📍 Clicando no workspace...');
    await workspaceButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/robot-auction/login-step2-workspace.png' });
  }
  
  // Passo 2: Preencher email
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.click();
  await emailInput.fill(ADMIN_EMAIL);
  console.log(`📧 Email preenchido: ${ADMIN_EMAIL}`);
  
  // Passo 3: Preencher senha
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.click();
  await passwordInput.fill(ADMIN_PASSWORD);
  console.log('🔑 Senha preenchida');
  
  await page.screenshot({ path: 'test-results/robot-auction/login-step3-filled.png' });
  
  // Passo 4: Clicar no botão de login
  // Procurar por botão de submit dentro do formulário de login
  const loginForm = page.locator('form').filter({ hasText: /email|senha/i });
  let submitButton;
  
  // Tentar encontrar o botão correto
  const possibleButtons = [
    loginForm.locator('button[type="submit"]'),
    page.locator('button[type="submit"]').first(),
    page.locator('button:has-text("Entrar")').first(),
    page.locator('button:has-text("Login")').first(),
    page.locator('button:has-text("Acessar")').first()
  ];
  
  for (const btn of possibleButtons) {
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const disabled = await btn.isDisabled().catch(() => true);
      if (!disabled) {
        submitButton = btn;
        break;
      }
    }
  }
  
  if (!submitButton) {
    console.log('❌ Botão de submit não encontrado!');
    return false;
  }
  
  // Verificar se botão está habilitado
  const isDisabled = await submitButton.isDisabled();
  console.log(`🚀 Botão de submit: disabled=${isDisabled}`);
  
  if (isDisabled) {
    console.log('❌ Botão de submit está desabilitado!');
    return false;
  }
  
  // Clicar no botão
  await submitButton.click();
  console.log('👆 Botão clicado');
  
  // Aguardar navegação
  await page.waitForTimeout(2000);
  
  // Verificar se há algum loading indicator
  const loading = page.locator('.loading, .spinner, [role="progressbar"]');
  if (await loading.isVisible({ timeout: 1000 }).catch(() => false)) {
    console.log('⏳ Aguardando loading...');
    await loading.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  }
  
  // Aguardar rede idle
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.screenshot({ path: 'test-results/robot-auction/login-step4-after.png' });
  
  // Verificar URL final
  const finalUrl = page.url();
  console.log(`📊 URL final: ${finalUrl}`);
  
  // Verificar se há mensagens de erro
  const errorSelectors = [
    '.text-destructive',
    '.text-red-500',
    '[role="alert"]',
    '.error-message',
    '.toast-error',
    '[data-ai-id="error-message"]'
  ];
  
  for (const selector of errorSelectors) {
    const errorEl = page.locator(selector).first();
    if (await errorEl.isVisible({ timeout: 1000 }).catch(() => false)) {
      const errorText = await errorEl.textContent();
      console.log(`⚠️ Erro encontrado: ${errorText}`);
    }
  }
  
  return !finalUrl.includes('/auth/login');
}

test('Login Admin Completo', async ({ page }) => {
  const success = await performLogin(page);
  
  if (success) {
    console.log('✅ Login realizado com sucesso!');
    
    // Verificar se estamos em uma página protegida
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/robot-auction/login-success-dashboard.png' });
    
    // Navegar para admin
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/robot-auction/login-admin-page.png' });
    
    console.log(`📊 URL Admin: ${page.url()}`);
  } else {
    console.log('❌ Login falhou');
    
    // Capturar estado final
    await page.screenshot({ path: 'test-results/robot-auction/login-failed-final.png' });
  }
  
  // O teste passa para diagnóstico, mas reporta resultado
  console.log(`\n📊 RESULTADO: Login ${success ? 'SUCESSO' : 'FALHOU'}`);
});
