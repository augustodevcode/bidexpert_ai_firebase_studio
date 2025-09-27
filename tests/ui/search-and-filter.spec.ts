// tests/ui/search-and-filter.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Search and Filter UI Test', () => {

  // Antes de cada teste, garantir que o setup está completo e ir para a página de busca
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Busca Avançada/i })).toBeVisible();
  });

  test('Cenário 5.1.1: should filter by a search term', async ({ page }) => {
    console.log('--- Test Case: Filtering by search term ---');
    
    // Mudar para a aba de Lotes
    await page.getByRole('tab', { name: /Lotes/ }).click();
    
    // Digitar um termo de busca que sabemos que existe do seed
    await page.getByPlaceholder('O que você está procurando?').fill('Notebook');
    
    // Clicar no botão de busca
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Esperar pelos resultados e verificar se são visíveis
    await expect(page.locator('[data-ai-id^="lot-card-"]').first()).toBeVisible({ timeout: 10000 });
    
    // Verificar se todos os cards visíveis contêm o termo "Notebook"
    const cardTitles = await page.locator('[data-ai-id="lot-card-title"]').allInnerTexts();
    for (const title of cardTitles) {
      expect(title.toLowerCase()).toContain('notebook');
    }
    console.log('- PASSED: Search results correctly filtered by term "Notebook".');
  });

  test('Cenário 5.1.2: should filter by category', async ({ page }) => {
    console.log('--- Test Case: Filtering by category ---');
    
    // Mudar para a aba de Lotes
    await page.getByRole('tab', { name: /Lotes/ }).click();
    
    // Abrir o painel de filtros
    await page.getByRole('button', { name: 'Filtros' }).click();
    
    // Clicar para expandir a seção de categorias
    await page.getByRole('button', { name: 'Categorias' }).click();
    
    // Selecionar a categoria "Veículos" (assumindo que existe do seed)
    await page.locator('aside').getByLabel(/Veículos/i).check();
    
    // Aplicar os filtros
    await page.locator('aside').getByRole('button', { name: 'Aplicar Filtros' }).click();

    // Esperar os resultados atualizarem e verificar
    await expect(page.locator('[data-ai-id^="lot-card-"]').first()).toBeVisible({ timeout: 10000 });
    
    // Verificar se todos os cards visíveis são da categoria "Veículos"
    for (const card of await page.locator('[data-ai-id^="lot-card-"]').all()) {
      await expect(card.locator('[data-ai-id="lot-card-category"]')).toContainText(/Veículos/i);
    }
    console.log('- PASSED: Search results correctly filtered by "Veículos" category.');
  });
});
