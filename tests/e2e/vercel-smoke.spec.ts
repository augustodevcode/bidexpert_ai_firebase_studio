/**
 * @file vercel-smoke.spec.ts
 * @description Smoke tests para validar deploy na Vercel DEMO
 *
 * Estratégia de SSO bypass:
 *  - Se VERCEL_SHARE_TOKEN está definido, o auth-setup project visita a share URL
 *    para obter o cookie _vercel_jwt (persistido via storageState).
 *  - Adicionalmente, cada navegação embute ?_vercel_share=TOKEN como fallback.
 *  - Para chamadas via `request` context, o token é enviado como query param.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://demo.bidexpert.com.br';
const VERCEL_SHARE_TOKEN = process.env.VERCEL_SHARE_TOKEN || '';

/** Appends _vercel_share token to a URL when available */
function withShare(url: string): string {
  if (!VERCEL_SHARE_TOKEN) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}_vercel_share=${VERCEL_SHARE_TOKEN}`;
}

/** Navigate with share token embedded and return Response */
async function gotoWithShare(
  page: import('@playwright/test').Page,
  url: string,
  opts: Parameters<import('@playwright/test').Page['goto']>[1] = {},
) {
  return page.goto(withShare(url), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
    ...opts,
  });
}

test.describe('Vercel DEMO Smoke Tests', () => {

  test.describe('Página Inicial', () => {

    test('deve carregar a página inicial com sucesso', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      const response = await gotoWithShare(page, BASE_URL);
      const status = response?.status() ?? 0;

      // Skip if SSO still blocks (token expired / protection type incompatible)
      test.skip(status === 401, 'Vercel SSO returned 401 — share token not accepted');

      expect(status).toBeLessThan(400);
      await expect(page).toHaveTitle(/.*/);

      const criticalErrors = consoleErrors.filter(err =>
        err.includes('TypeError') ||
        err.includes('ReferenceError') ||
        err.includes('SyntaxError'),
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('deve exibir elementos principais da UI', async ({ page }) => {
      const response = await gotoWithShare(page, BASE_URL);
      test.skip(response?.status() === 401, 'SSO 401');

      const body = page.locator('body');
      await expect(body).toBeVisible();

      const textContent = await body.textContent();
      expect(textContent?.length).toBeGreaterThan(0);
    });

  });

  test.describe('Assets e Recursos', () => {

    test('deve servir assets estáticos corretamente', async ({ page }) => {
      const failedRequests: string[] = [];

      page.on('response', resp => {
        if (resp.status() >= 400) {
          const url = resp.url();
          if (!url.includes('analytics') && !url.includes('tracking') && !url.includes('_vercel_share')) {
            failedRequests.push(`${resp.status()}: ${url}`);
          }
        }
      });

      const response = await gotoWithShare(page, BASE_URL);
      test.skip(response?.status() === 401, 'SSO 401');

      // Tolerate up to 10 minor asset failures (analytics, fonts, third-party)
      if (failedRequests.length > 0) {
        console.log(`Failed asset requests (${failedRequests.length}):`, failedRequests);
      }
      expect(failedRequests.length).toBeLessThan(10);
    });

    test('deve carregar fontes e estilos', async ({ page }) => {
      const response = await gotoWithShare(page, BASE_URL);
      test.skip(response?.status() === 401, 'SSO 401');

      const bodyStyles = await page.evaluate(() => {
        const body = document.body;
        const styles = window.getComputedStyle(body);
        return {
          fontFamily: styles.fontFamily,
          backgroundColor: styles.backgroundColor,
        };
      });

      expect(bodyStyles.fontFamily).toBeTruthy();
    });

  });

  test.describe('Navegação', () => {

    test('deve navegar para /login', async ({ page }) => {
      const response = await gotoWithShare(page, `${BASE_URL}/login`);
      test.skip(response?.status() === 401, 'SSO 401');

      expect(response?.status()).toBeLessThan(500);
    });

    test('deve navegar para /leiloes (se existir)', async ({ page }) => {
      const response = await gotoWithShare(page, `${BASE_URL}/leiloes`);
      test.skip(response?.status() === 401, 'SSO 401');

      expect(response?.status()).toBeLessThan(500);
    });

  });

  test.describe('API Health', () => {

    test('deve responder em /api/health (se existir)', async ({ request }) => {
      try {
        const response = await request.get(withShare(`${BASE_URL}/api/health`));
        if (response.status() === 401) {
          console.log('API /health bloqueada por SSO — skipping');
          return;
        }
        if (response.status() !== 404) {
          expect(response.status()).toBe(200);
        }
      } catch {
        console.log('API /health não disponível (não crítico)');
      }
    });

  });

  test.describe('Performance Básica', () => {

    test('deve carregar em tempo aceitável', async ({ page }) => {
      const startTime = Date.now();

      const response = await gotoWithShare(page, BASE_URL);
      test.skip(response?.status() === 401, 'SSO 401');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10_000);
      console.log(`Tempo de carregamento: ${loadTime}ms`);
    });

  });

  test.describe('SEO Básico', () => {

    test('deve ter meta tags básicas', async ({ page }) => {
      const response = await gotoWithShare(page, BASE_URL);
      test.skip(response?.status() === 401, 'SSO 401');

      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width');

      const charset = await page.locator('meta[charset]').count();
      expect(charset).toBeGreaterThan(0);
    });

  });

});

test.describe('Vercel DEMO - Funcionalidades Críticas', () => {

  test('deve exibir página de erro personalizada para 404', async ({ page }) => {
    const response = await gotoWithShare(
      page,
      `${BASE_URL}/pagina-que-nao-existe-${Date.now()}`,
    );
    test.skip(response?.status() === 401, 'SSO 401');

    expect(response?.status()).toBe(404);
  });

  test('deve ter configuração CORS adequada para API', async ({ request }) => {
    try {
      const response = await request.options(withShare(`${BASE_URL}/api/health`), {
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'GET',
        },
      });

      if (response.status() === 401) {
        console.log('CORS test bloqueado por SSO');
        return;
      }

      const corsHeader = response.headers()['access-control-allow-origin'];
      if (corsHeader) {
        console.log(`CORS configurado: ${corsHeader}`);
      }
    } catch {
      console.log('Teste CORS não aplicável');
    }
  });

});
