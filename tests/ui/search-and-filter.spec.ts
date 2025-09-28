// tests/ui/search-and-filter.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Módulo 5: Funcionalidades Públicas - Busca e Filtro (UI)', () => {

  // Antes de cada teste, garantir que o setup está completo e ir para a página de busca
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bidexpert_setup_complete', 'true');
    });
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1', { hasText: 'Busca Avançada' })).toBeVisible({ timeout: 20000 });
  });

  test('Cenário 5.1.1: Deve filtrar lotes por um termo de busca', async ({ page }) => {
    console.log('--- Test Case: Filtering lots by search term ---');
    
    // Mudar para a aba de Lotes, se não estiver ativa
    await page.getByRole('tab', { name: /Lotes/ }).click();
    
    // Digitar um termo de busca que sabemos que existe do seed (ex: "carro" ou "apartamento")
    await page.getByPlaceholder('O que você está procurando?').fill('Carro');
    
    // Clicar no botão de busca
    await page.getByRole('button', { name: 'Buscar' }).click();

    // Esperar pelos resultados e verificar se são visíveis
    // Aumentamos o timeout para dar tempo para a re-renderização
    await expect(page.locator('[data-ai-id^="lot-card-"]').first()).toBeVisible({ timeout: 15000 });
    
    // Verificar se todos os cards visíveis contêm o termo "Carro" no título ou descrição
    const cardTitles = await page.locator('[data-ai-id="lot-card-title"]').allInnerTexts();
    for (const title of cardTitles) {
      expect(title.toLowerCase()).toContain('carro');
    }
    console.log('- PASSED: Search results correctly filtered by term "Carro".');
  });

  test('Cenário 5.1.2: Deve filtrar por categoria', async ({ page }) => {
    console.log('--- Test Case: Filtering by category ---');
    
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
    await expect(page.locator('[data-ai-id^="lot-card-"]').first()).toBeVisible({ timeout: 15000 });
    
    // Verificar se todos os cards visíveis são da categoria "Veículos"
    for (const card of await page.locator('[data-ai-id^="lot-card-"]').all()) {
      await expect(card.locator('[data-ai-id="lot-card-category"]')).toContainText(/Veículos/i);
    }
    console.log('- PASSED: Search results correctly filtered by "Veículos" category.');
  });
});
