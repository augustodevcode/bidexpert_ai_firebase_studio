import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth-helper';

/**
 * @fileoverview Teste E2E para a página de relatórios do dashboard.
 * 
 * Este teste valida se a página de relatórios carrega corretamente sem erros de 
 * ReferenceError (especificamente o icone ShoppingBag).
 */

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://demo.localhost:9006';

test.describe('Dashboard Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    // Aumentar o timeout para compilação do Next.js em dev mode
    test.setTimeout(120000);
    
    // Login como admin para acessar o dashboard
    await loginAsAdmin(page, BASE_URL);
  });

  test('should render reports page with all stat cards', async ({ page }) => {
    // Navegar para a página de relatórios
    await page.goto(`${BASE_URL}/dashboard/reports`, { waitUntil: 'domcontentloaded' });

    // Verificar se o título da página está correto
    await expect(page.getByText('Meus Relatórios')).toBeVisible();

    // Verificar se os cards de estatísticas estão presentes
    // Cada card tem um título e um ícone (que era o que estava quebrado)
    await expect(page.getByText('Total Gasto')).toBeVisible();
    await expect(page.getByText('Lotes Arrematados')).toBeVisible();
    await expect(page.getByText('Total de Lances')).toBeVisible();

    // Verificar se o gráfico de "Gastos por Categoria" está visível
    await expect(page.getByText('Gastos por Categoria')).toBeVisible();

    // Tirar um screenshot para evidência visual
    await page.screenshot({ path: 'tests/e2e/screenshots/dashboard-reports-fix.png', fullPage: true });
    
    console.log('✅ Reports page rendered successfully without ReferenceError.');
  });
});
