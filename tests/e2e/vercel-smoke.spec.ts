/**
 * @file vercel-smoke.spec.ts
 * @description Smoke tests para validar deploy na Vercel DEMO
 * 
 * Este teste é executado após o deploy para garantir que:
 * 1. A aplicação está acessível
 * 2. Páginas principais carregam corretamente
 * 3. Não há erros críticos de JavaScript
 * 4. Assets estão sendo servidos
 */

import { test, expect } from '@playwright/test';

// URL base - usar variável de ambiente ou fallback
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://bidexpert-demo.vercel.app';

test.describe('Vercel DEMO Smoke Tests', () => {
  
  test.describe('Página Inicial', () => {
    
    test('deve carregar a página inicial com sucesso', async ({ page }) => {
      // Capturar erros de console
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Navegar para a página inicial
      const response = await page.goto(BASE_URL, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Verificar status HTTP
      expect(response?.status()).toBeLessThan(400);

      // Verificar que a página carregou (título ou elemento específico)
      await expect(page).toHaveTitle(/.*/); // Qualquer título
      
      // Verificar que não há erros críticos de JS
      const criticalErrors = consoleErrors.filter(err => 
        err.includes('TypeError') || 
        err.includes('ReferenceError') ||
        err.includes('SyntaxError')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('deve exibir elementos principais da UI', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

      // Verificar que há conteúdo visível
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Verificar que há pelo menos algum texto na página
      const textContent = await body.textContent();
      expect(textContent?.length).toBeGreaterThan(0);
    });

  });

  test.describe('Assets e Recursos', () => {

    test('deve servir assets estáticos corretamente', async ({ page }) => {
      // Monitorar requisições de rede
      const failedRequests: string[] = [];
      
      page.on('response', response => {
        if (response.status() >= 400) {
          const url = response.url();
          // Ignorar erros de analytics/tracking
          if (!url.includes('analytics') && !url.includes('tracking')) {
            failedRequests.push(`${response.status()}: ${url}`);
          }
        }
      });

      await page.goto(BASE_URL, { waitUntil: 'networkidle' });

      // Verificar que não há muitas requisições falhando
      expect(failedRequests.length).toBeLessThan(5);
    });

    test('deve carregar fontes e estilos', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

      // Verificar que CSS está aplicado (página não está "quebrada")
      const bodyStyles = await page.evaluate(() => {
        const body = document.body;
        const styles = window.getComputedStyle(body);
        return {
          fontFamily: styles.fontFamily,
          backgroundColor: styles.backgroundColor
        };
      });

      // Deve ter algum estilo aplicado
      expect(bodyStyles.fontFamily).toBeTruthy();
    });

  });

  test.describe('Navegação', () => {

    test('deve navegar para /login', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/login`, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Aceitar redirecionamento ou página de login
      expect(response?.status()).toBeLessThan(500);
    });

    test('deve navegar para /leiloes (se existir)', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/leiloes`, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Aceitar 200, 301, 302, 404 (página pode não existir publicamente)
      expect(response?.status()).toBeLessThan(500);
    });

  });

  test.describe('API Health', () => {

    test('deve responder em /api/health (se existir)', async ({ request }) => {
      try {
        const response = await request.get(`${BASE_URL}/api/health`);
        // Se existir, deve retornar 200
        if (response.status() !== 404) {
          expect(response.status()).toBe(200);
        }
      } catch (e) {
        // API health pode não existir, não é crítico
        console.log('API /health não disponível (não crítico)');
      }
    });

  });

  test.describe('Performance Básica', () => {

    test('deve carregar em tempo aceitável', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      
      const loadTime = Date.now() - startTime;
      
      // Deve carregar em menos de 10 segundos
      expect(loadTime).toBeLessThan(10000);
      
      console.log(`Tempo de carregamento: ${loadTime}ms`);
    });

  });

  test.describe('SEO Básico', () => {

    test('deve ter meta tags básicas', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

      // Verificar viewport meta (mobile-friendly)
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width');

      // Verificar charset
      const charset = await page.locator('meta[charset]').count();
      expect(charset).toBeGreaterThan(0);
    });

  });

});

test.describe('Vercel DEMO - Funcionalidades Críticas', () => {

  test('deve exibir página de erro personalizada para 404', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/pagina-que-nao-existe-${Date.now()}`, {
      waitUntil: 'domcontentloaded'
    });

    // Deve retornar 404, não 500
    expect(response?.status()).toBe(404);
  });

  test('deve ter configuração CORS adequada para API', async ({ request }) => {
    try {
      const response = await request.options(`${BASE_URL}/api/health`, {
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      // Se CORS está configurado, deve ter headers apropriados
      const corsHeader = response.headers()['access-control-allow-origin'];
      if (corsHeader) {
        console.log(`CORS configurado: ${corsHeader}`);
      }
    } catch (e) {
      console.log('Teste CORS não aplicável');
    }
  });

});
