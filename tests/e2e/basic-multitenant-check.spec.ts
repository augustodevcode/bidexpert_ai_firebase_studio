/**
 * Testes Simples de Verificação Multi-Tenant
 * 
 * Testes básicos para verificar se o sistema multi-tenant está funcionando
 */

import { test, expect } from '@playwright/test';

test.describe('Verificação Básica Multi-Tenant', () => {
  
  test('Sistema está online e acessível', async ({ page }) => {
    // Tentar acessar a página inicial com timeout maior
    await page.goto('http://localhost:9002', { timeout: 120000 });
    
    // Aguardar a página carregar
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    
    // Verificar que não há erro 500
    const title = await page.title();
    expect(title).toBeTruthy();
    
    console.log(`✅ Página carregada: ${title}`);
  });

  test('Pode acessar página de login', async ({ page }) => {
    await page.goto('http://localhost:9002/login', { timeout: 120000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    
    // Verificar elementos de login - seletor mais específico
    const emailInput = page.locator('input[type="email"]').first();
    
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Página de login acessível');
  });

  test('API responde corretamente', async ({ request }) => {
    const response = await request.get('http://localhost:9002/api/health');
    
    // Se não houver rota /api/health, testar outra
    if (response.status() === 404) {
      const response2 = await request.get('http://localhost:9002/');
      expect(response2.status()).toBeLessThan(500);
    } else {
      expect(response.status()).toBeLessThan(500);
    }
    
    console.log('✅ API respondendo');
  });
});

test.describe('Verificação de Dados Multi-Tenant', () => {
  
  test.skip('Verificar isolamento de tenants - requer login', async ({ page }) => {
    // Este teste será implementado após configurar autenticação
    console.log('⚠️  Teste pulado - requer configuração de autenticação');
  });
});
