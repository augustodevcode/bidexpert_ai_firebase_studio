// tests/e2e/admin-roles-simple.spec.ts
/**
 * @fileoverview Teste simples para verificar se a página de edição de roles carrega
 */
import { test, expect } from '@playwright/test';

test('simple role edit page test', async ({ page }) => {
  // Ir direto para a página de login
  await page.goto('http://demo.localhost:9005/auth/login');
  
  // Verificar se a página carregou
  await expect(page).toHaveTitle(/BidExpert/i);
  
  // Fazer login
  await page.fill('input[name="email"]', 'admin@bidexpert.ai');  
  await page.fill('input[name="password"]', 'senha123');
  await page.click('button[type="submit"]');
  
  // Aguardar redirect por no máximo 10 segundos
  await page.waitForLoadState('networkidle');
  
  // Ir para a página de edição do role
  await page.goto('http://demo.localhost:9005/admin/roles/1/edit');
  
  // Aguardar a página carregar
  await page.waitForLoadState('networkidle');
  
  // Verificar se o formulário está presente
  await expect(page.locator('[data-ai-id="role-form"]')).toBeVisible({ timeout: 15000 });
  
  // Verificar se o nome está preenchido
  const nameInput = page.locator('input[name="name"]');
  await expect(nameInput).toBeVisible();
  await expect(nameInput).toHaveValue('ADMIN');
  
  console.log('✅ Página carregada com sucesso!');
});