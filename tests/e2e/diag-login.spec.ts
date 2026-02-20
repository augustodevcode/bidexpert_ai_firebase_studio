/**
 * Teste simplificado de login no BidExpert
 * Objetivo: Diagnosticar problemas de login
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://bidexpertaifirebasestudio.vercel.app';
const ADMIN_EMAIL = 'admin@bidexpert.com.br';
const ADMIN_PASSWORD = 'Admin@123';

test.setTimeout(120000);

test('Diagnóstico: Login Admin no BidExpert', async ({ page }) => {
  console.log('🔍 Iniciando diagnóstico de login...');
  
  // Navegar para a página de login
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
  
  // Capturar estado inicial
  await page.screenshot({ path: 'test-results/robot-auction/diag-01-initial.png', fullPage: true });
  console.log('📸 Screenshot inicial salvo');
  
  // Verificar URL atual
  console.log(`URL atual: ${page.url()}`);
  
  // Listar todos os elementos de input
  const inputs = await page.locator('input').all();
  console.log(`\n📋 Encontrados ${inputs.length} inputs:`);
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    const disabled = await input.isDisabled();
    const visible = await input.isVisible();
    console.log(`  Input ${i}: type=${type}, name=${name}, placeholder=${placeholder}, disabled=${disabled}, visible=${visible}`);
  }
  
  // Listar todos os botões
  const buttons = await page.locator('button').all();
  console.log(`\n📋 Encontrados ${buttons.length} botões:`);
  
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const text = await btn.textContent();
    const disabled = await btn.isDisabled();
    const visible = await btn.isVisible();
    console.log(`  Botão ${i}: text="${text?.trim()}", disabled=${disabled}, visible=${visible}`);
  }
  
  // Verificar campo de tenant/workspace
  const tenantCombo = page.locator('button[role="combobox"]').first();
  const hasTenantCombo = await tenantCombo.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`\n🏢 Tenant combo visível: ${hasTenantCombo}`);
  
  if (hasTenantCombo) {
    console.log('Clicando no tenant combo...');
    await tenantCombo.click();
    await page.waitForTimeout(500);
    
    // Listar opções de tenant
    const options = await page.locator('[role="option"], [role="listitem"]').allTextContents();
    console.log(`Opções de tenant: ${options.join(', ')}`);
    
    // Selecionar primeira opção
    const firstOption = page.locator('[role="option"], [role="listitem"]').first();
    if (await firstOption.isVisible({ timeout: 2000 })) {
      await firstOption.click();
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ path: 'test-results/robot-auction/diag-02-after-tenant.png', fullPage: true });
  }
  
  // Aguardar campos serem habilitados
  await page.waitForTimeout(2000);
  
  // Verificar se email já está preenchido
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const emailValue = await emailInput.inputValue().catch(() => '');
  console.log(`\n📧 Email atual: "${emailValue}"`);
  
  // Verificar se senha já está preenchida
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  const passwordValue = await passwordInput.inputValue().catch(() => '');
  console.log(`🔑 Senha atual: "${passwordValue.replace(/./g, '*')}"`);
  
  // Se campos não estão preenchidos, preencher
  if (!emailValue || !emailValue.includes('@')) {
    console.log('\n📝 Preenchendo email...');
    await emailInput.click();
    await emailInput.fill(ADMIN_EMAIL);
  }
  
  if (!passwordValue) {
    console.log('📝 Preenchendo senha...');
    await passwordInput.click();
    await passwordInput.fill(ADMIN_PASSWORD);
  }
  
  await page.screenshot({ path: 'test-results/robot-auction/diag-03-filled.png', fullPage: true });
  
  // Verificar estado do botão de submit
  const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();
  const submitVisible = await submitBtn.isVisible({ timeout: 3000 }).catch(() => false);
  const submitDisabled = await submitBtn.isDisabled().catch(() => true);
  console.log(`\n🚀 Botão submit: visível=${submitVisible}, disabled=${submitDisabled}`);
  
  // Tentar clicar no botão
  if (submitVisible && !submitDisabled) {
    console.log('Clicando no botão de submit...');
    await submitBtn.click();
    
    // Aguardar navegação
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  }
  
  await page.screenshot({ path: 'test-results/robot-auction/diag-04-after-submit.png', fullPage: true });
  
  // Verificar resultado
  const finalUrl = page.url();
  console.log(`\n📊 URL final: ${finalUrl}`);
  console.log(`Login bem sucedido: ${!finalUrl.includes('/auth/login')}`);
  
  // Se ainda está na página de login, verificar erros
  if (finalUrl.includes('/auth/login')) {
    const errorText = await page.locator('.text-destructive, .text-red-500, [role="alert"], .error').first().textContent().catch(() => 'Nenhum erro visível');
    console.log(`Mensagem de erro: ${errorText}`);
    
    // Verificar se há um modal ou overlay
    const modalVisible = await page.locator('[role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`Modal visível: ${modalVisible}`);
  }
  
  // O teste passa para fins de diagnóstico
  expect(true).toBe(true);
});
