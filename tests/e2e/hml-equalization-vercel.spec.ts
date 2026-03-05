/**
 * @file hml-equalization-vercel.spec.ts
 * @description Testes de verificação de equalização HML vs DEMO no Vercel
 *
 * Valida que a branch hml está equalizada com demo-stable verificando:
 * 1. Ambos os ambientes respondem com HTTP 2xx
 * 2. Páginas principais carregam corretamente em ambos
 * 3. Não há erros críticos de JavaScript em nenhum ambiente
 * 4. Títulos e conteúdo principal são equivalentes
 * 5. Assets estáticos são servidos corretamente
 *
 * Uso:
 *   npx playwright test tests/e2e/hml-equalization-vercel.spec.ts \
 *     --config=playwright.vercel.config.ts
 *
 * Variáveis de ambiente:
 *   DEMO_URL - URL do ambiente DEMO (default: https://bidexpertaifirebasestudio.vercel.app)
 *   HML_URL  - URL do ambiente HML  (default: usa PLAYWRIGHT_BASE_URL)
 */

import { test, expect, type Page } from '@playwright/test';

const DEMO_URL = process.env.DEMO_URL || process.env.PLAYWRIGHT_DEMO_URL || 'https://bidexpertaifirebasestudio.vercel.app';
const HML_URL = process.env.HML_URL || process.env.PLAYWRIGHT_BASE_URL || 'https://bidexpertaifirebasestudio-git-hml.vercel.app';

// Padrões de recursos externos a ignorar nos filtros de erro
const EXTERNAL_SERVICE_PATTERNS = ['google', 'analytics', 'gtag', 'tracking', 'sentry'];

// Páginas públicas a serem verificadas em ambos os ambientes
const PUBLIC_ROUTES = ['/', '/auctions', '/search'];

/**
 * Coleta informações de uma página carregada
 */
async function collectPageInfo(page: Page, url: string) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filtrar erros de recursos externos (analytics, etc.)
      if (!EXTERNAL_SERVICE_PATTERNS.some(p => text.toLowerCase().includes(p))) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('response', response => {
    if (response.status() >= 500) {
      const reqUrl = response.url();
      if (!EXTERNAL_SERVICE_PATTERNS.some(p => reqUrl.includes(p))) {
        failedRequests.push(`${response.status()}: ${reqUrl}`);
      }
    }
  });

  const response = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  const title = await page.title();
  const statusCode = response?.status() ?? 0;
  const bodyText = await page.locator('body').textContent() ?? '';

  const criticalErrors = consoleErrors.filter(err =>
    err.includes('TypeError') ||
    err.includes('ReferenceError') ||
    err.includes('SyntaxError') ||
    err.includes('Unhandled') ||
    err.includes('Application error')
  );

  return {
    statusCode,
    title,
    bodyLength: bodyText.length,
    criticalErrors,
    failedRequests,
    hasContent: bodyText.length > 100,
  };
}

test.describe('HML vs DEMO - Verificação de Equalização', () => {

  test.describe('Smoke Tests - Disponibilidade', () => {

    test('DEMO: deve estar acessível e respondendo', async ({ page }) => {
      const response = await page.goto(DEMO_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      expect(response?.status(), `DEMO retornou HTTP ${response?.status()}`).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
    });

    test('HML: deve estar acessível e respondendo', async ({ page }) => {
      const response = await page.goto(HML_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      expect(response?.status(), `HML retornou HTTP ${response?.status()}`).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
    });

  });

  test.describe('Equivalência de Conteúdo - Página Inicial', () => {

    test('DEMO e HML devem ter título equivalente na página inicial', async ({ page }) => {
      // Verificar DEMO
      await page.goto(DEMO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const demoTitle = await page.title();

      // Verificar HML
      await page.goto(HML_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const hmlTitle = await page.title();

      // Títulos devem ser iguais ou muito similares (mesmo código = mesmos títulos)
      expect(demoTitle, `Título DEMO: "${demoTitle}" != HML: "${hmlTitle}"`).toBe(hmlTitle);
    });

    test('DEMO e HML devem carregar sem erros críticos de JavaScript', async ({ browser }) => {
      const demoContext = await browser.newContext();
      const hmlContext = await browser.newContext();

      const demoPage = await demoContext.newPage();
      const hmlPage = await hmlContext.newPage();

      const [demoInfo, hmlInfo] = await Promise.all([
        collectPageInfo(demoPage, DEMO_URL),
        collectPageInfo(hmlPage, HML_URL),
      ]);

      await demoContext.close();
      await hmlContext.close();

      expect(
        demoInfo.criticalErrors,
        `DEMO tem erros críticos: ${JSON.stringify(demoInfo.criticalErrors)}`
      ).toHaveLength(0);

      expect(
        hmlInfo.criticalErrors,
        `HML tem erros críticos: ${JSON.stringify(hmlInfo.criticalErrors)}`
      ).toHaveLength(0);
    });

    test('DEMO e HML devem ter conteúdo visível (não tela em branco)', async ({ browser }) => {
      const demoContext = await browser.newContext();
      const hmlContext = await browser.newContext();

      const demoPage = await demoContext.newPage();
      const hmlPage = await hmlContext.newPage();

      const [demoInfo, hmlInfo] = await Promise.all([
        collectPageInfo(demoPage, DEMO_URL),
        collectPageInfo(hmlPage, HML_URL),
      ]);

      await demoContext.close();
      await hmlContext.close();

      expect(demoInfo.hasContent, 'DEMO não tem conteúdo visível').toBe(true);
      expect(hmlInfo.hasContent, 'HML não tem conteúdo visível').toBe(true);
    });

  });

  test.describe('Equivalência de Páginas Públicas', () => {

    for (const route of PUBLIC_ROUTES) {
      test(`Rota ${route}: DEMO e HML devem carregar com HTTP 2xx`, async ({ browser }) => {
        const demoContext = await browser.newContext();
        const hmlContext = await browser.newContext();

        const demoPage = await demoContext.newPage();
        const hmlPage = await hmlContext.newPage();

        const [demoResponse, hmlResponse] = await Promise.all([
          demoPage.goto(`${DEMO_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 }),
          hmlPage.goto(`${HML_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 }),
        ]);

        await demoContext.close();
        await hmlContext.close();

        const demoStatus = demoResponse?.status() ?? 0;
        const hmlStatus = hmlResponse?.status() ?? 0;

        expect(demoStatus, `DEMO ${route} retornou HTTP ${demoStatus}`).toBeLessThan(400);
        expect(hmlStatus, `HML ${route} retornou HTTP ${hmlStatus}`).toBeLessThan(400);
      });
    }

  });

  test.describe('Verificação de Assets Estáticos', () => {

    test('DEMO: assets Next.js (_next) devem ser servidos corretamente', async ({ page }) => {
      const assetErrors: string[] = [];

      page.on('response', response => {
        const url = response.url();
        if (url.includes('/_next/') && response.status() >= 400) {
          assetErrors.push(`${response.status()}: ${url}`);
        }
      });

      await page.goto(DEMO_URL, { waitUntil: 'networkidle', timeout: 60000 });

      await page.goto(HML_URL, { waitUntil: 'networkidle', timeout: 60000 });

      expect(
        assetErrors,
        `HML tem assets quebrados: ${JSON.stringify(assetErrors)}`
      ).toHaveLength(0);
    });

  });

  test.describe('Verificação de Erros 500 em Rotas Admin', () => {

    const ADMIN_ROUTES_TO_CHECK = [
      '/admin/dashboard',
      '/admin/auctions',
      '/admin/lots',
    ];

    for (const route of ADMIN_ROUTES_TO_CHECK) {
      test(`Rota ${route}: DEMO e HML não devem retornar 500`, async ({ browser }) => {
        const demoContext = await browser.newContext();
        const hmlContext = await browser.newContext();

        const demoPage = await demoContext.newPage();
        const hmlPage = await hmlContext.newPage();

        const demoErrors: string[] = [];
        const hmlErrors: string[] = [];

        demoPage.on('response', r => {
          if (r.status() >= 500 && !r.url().includes('analytics')) {
            demoErrors.push(`${r.status()}: ${r.url()}`);
          }
        });

        hmlPage.on('response', r => {
          if (r.status() >= 500 && !r.url().includes('analytics')) {
            hmlErrors.push(`${r.status()}: ${r.url()}`);
          }
        });

        const [demoResponse, hmlResponse] = await Promise.all([
          demoPage.goto(`${DEMO_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 }),
          hmlPage.goto(`${HML_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 }),
        ]);

        await demoContext.close();
        await hmlContext.close();

        const demoStatus = demoResponse?.status() ?? 0;
        const hmlStatus = hmlResponse?.status() ?? 0;

        // Admin routes redirect to login (302/307) or show content — not 500
        expect(
          demoStatus,
          `DEMO ${route} retornou erro inesperado HTTP ${demoStatus}`
        ).not.toBe(500);
        expect(
          hmlStatus,
          `HML ${route} retornou erro inesperado HTTP ${hmlStatus}`
        ).not.toBe(500);

        expect(
          demoErrors,
          `DEMO ${route} tem erros 500: ${JSON.stringify(demoErrors)}`
        ).toHaveLength(0);
        expect(
          hmlErrors,
          `HML ${route} tem erros 500: ${JSON.stringify(hmlErrors)}`
        ).toHaveLength(0);
      });
    }

  });

});
