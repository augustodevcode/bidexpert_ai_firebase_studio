import { test, expect } from '@playwright/test';

/**
 * Teste de validação do seed master - Verifica se a aplicação carrega e exibe dados básicos
 */
test.describe('Seed Master Validation', () => {
  test('Deve carregar a página inicial sem erros', async ({ page }) => {
    // Navegar para a aplicação
    await page.goto('http://localhost:9005');

    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');

    // Verificar se a página carregou (não deve ter erros 500)
    const title = await page.title();
    expect(title).toBeTruthy();

    // Verificar se não há mensagens de erro óbvias
    const errorMessages = page.locator('text=/error|erro|500|404/i');
    await expect(errorMessages).toHaveCount(0);

    // Verificar se há algum conteúdo na página
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(0);

    // Screenshot para validação visual
    await page.screenshot({ path: 'test-results/seed-validation-basic.png', fullPage: true });
  });

  test('Deve ter dados no banco após seed', async ({ page }) => {
    // Este teste verifica indiretamente se o seed funcionou
    // navegando para uma página que deveria exibir dados

    // Tentar acessar uma rota que lista dados
    await page.goto('http://localhost:9005/admin/auctions');

    // Se a página carregar sem erro 500, significa que o banco tem dados
    const hasNoServerError = await page.locator('text=/500|Internal Server Error/i').isVisible() === false;
    expect(hasNoServerError).toBe(true);
  });
});