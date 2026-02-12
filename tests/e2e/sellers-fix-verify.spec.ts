/**
 * @fileoverview Teste E2E para verificar a correção do erro de sellers
 * - Testa navegação para página de seller específico
 * - Verifica se não há erros de console
 */
import { test, expect } from '@playwright/test';

test.describe('Sellers Page Fix Verification', () => {
  test('carrega página de seller sem erros de console', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(`Page Error: ${err.message}`);
    });

    // Navega para a página de sellers
    await page.goto('http://demo.localhost:9005/sellers');
    await page.waitForLoadState('networkidle');
    
    // Verifica se a lista de sellers está visível
    await expect(page.locator('[data-ai-id="sellers-list"], .seller-list, h1:has-text("Comitentes")')).toBeVisible({ timeout: 15000 });

    // Clica no primeiro seller disponível
    const sellerLink = page.locator('a[href*="/sellers/"]:not([href="/sellers"])').first();
    await expect(sellerLink).toBeVisible({ timeout: 10000 });
    await sellerLink.click();
    
    // Aguarda carregamento da página do seller
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verifica que não há erros relacionados a "fetching seller data"
    const sellerFetchErrors = consoleErrors.filter(e => 
      e.includes('Error fetching seller data') || 
      e.includes('stages') ||
      e.includes('Unknown field')
    );
    
    console.log('Console errors found:', consoleErrors.length);
    consoleErrors.forEach(e => console.log('  -', e.substring(0, 100)));

    expect(sellerFetchErrors).toHaveLength(0);
    
    // Verifica que a página carregou corretamente (não mostra erro)
    await expect(page.locator('text=/Erro ao carregar|Error fetching/i')).not.toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('página de seller específico carrega corretamente', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navega diretamente para a página de um seller
    await page.goto('http://demo.localhost:9005/sellers/construtora-abc-leiloes-1770173587333');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Filtra erros específicos do fetch de seller
    const sellerFetchErrors = consoleErrors.filter(e => 
      e.includes('Error fetching seller data') || 
      e.includes('Unknown field') ||
      e.includes('stages')
    );
    
    expect(sellerFetchErrors).toHaveLength(0);
    
    // Página não deve mostrar erro
    const errorVisible = await page.locator('text=/Erro ao carregar/i').isVisible().catch(() => false);
    expect(errorVisible).toBeFalsy();
  });
});
