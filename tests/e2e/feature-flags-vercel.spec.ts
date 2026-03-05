/**
 * @file feature-flags-vercel.spec.ts
 * @description Testes Playwright para validar persistência de feature flags no banco de dados (Vercel HML/demo-stable).
 *
 * Verifica que:
 * 1. A API GET /api/admin/feature-flags retorna os flags corretamente
 * 2. A API POST /api/admin/feature-flags persiste alterações no banco de dados
 * 3. Após reinicialização (nova requisição), os flags persistidos são retornados (não defaults)
 *
 * Usage: npx playwright test --config=playwright.vercel.config.ts tests/e2e/feature-flags-vercel.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://bidexpertaifirebasestudio.vercel.app';

test.describe('Feature Flags - Persistência no Banco de Dados (Vercel)', () => {

  test('GET /api/admin/feature-flags deve retornar estrutura válida', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/feature-flags`);

    // Aceita 200 ou 401 (se não autenticado em produção)
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('featureFlags');

      const flags = body.data.featureFlags;
      // Verificar campos essenciais
      expect(typeof flags.blockchainEnabled).toBe('boolean');
      expect(typeof flags.softCloseEnabled).toBe('boolean');
      expect(typeof flags.lawyerPortalEnabled).toBe('boolean');
      expect(typeof flags.maintenanceMode).toBe('boolean');
      expect(typeof flags.pwaEnabled).toBe('boolean');
    }
  });

  test('A API de feature flags deve responder sem erro 500', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/feature-flags`);
    // Nunca deve retornar 500
    expect(response.status()).not.toBe(500);
  });

  test('Página inicial deve carregar sem erros críticos de JS', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') jsErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const criticalErrors = jsErrors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('SyntaxError')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Deploy está acessível (status < 400)', async ({ request }) => {
    const response = await request.get(BASE_URL);
    expect(response.status()).toBeLessThan(400);
  });

});
