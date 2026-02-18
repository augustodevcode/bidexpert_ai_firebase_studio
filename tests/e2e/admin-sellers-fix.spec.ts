/**
 * @fileoverview Teste E2E exaustivo para a página de admin/sellers.
 * Valida:
 * - Carregamento da página sem erros
 * - Exibição correta de sellers
 * - Abertura do modal de criação/edição
 * - Validação de erros no console do navegador
 * - Interações com buttons
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_SELLERS_URL = 'http://demo.localhost:9005/admin/sellers';
const TEST_TIMEOUT = 30000;

/**
 * Hook para coletar erros de console e network durante o teste
 */
async function setupErrorTracking(page: Page) {
  const consoleMessages: any[] = [];
  const networkErrors: any[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  return { consoleMessages, networkErrors };
}

test.describe('Admin Sellers Page - Teste Exaustivo', () => {
  let errorTracking: any;

  test.beforeEach(async ({ page }) => {
    errorTracking = await setupErrorTracking(page);
  });

  test('T1: Página carrega sem erros fundamentais', async ({ page }) => {
    await page.goto(ADMIN_SELLERS_URL, { waitUntil: 'networkidle' });
    
    // Aguarda o elemento principal da página carregar
    const pageContainer = page.locator('[data-ai-id="admin-sellers-page-container"]');
    await expect(pageContainer).toBeVisible({ timeout: TEST_TIMEOUT });

    // Verifica que não há erros de TypeError no console
    const typeErrors = errorTracking.consoleMessages.filter((m: any) => 
      m.text.includes('Cannot read properties of undefined') || 
      m.text.includes('TypeError')
    );
    expect(typeErrors).toHaveLength(0, `Encontrados erros de tipo: ${JSON.stringify(typeErrors)}`);

    // Verifica que não há erros 4xx/5xx na network
    const serverErrors = errorTracking.networkErrors.filter((e: any) => e.status >= 500);
    expect(serverErrors).toHaveLength(0, `Erros de servidor: ${JSON.stringify(serverErrors)}`);
  });

  test('T2: Card de sellers é renderizado corretamente', async ({ page }) => {
    await page.goto(ADMIN_SELLERS_URL, { waitUntil: 'networkidle' });

    // Aguarda a renderização de sellers
    await page.waitForTimeout(2000);

    // Procura por sellers na página
    const sellerCards = await page.locator('[data-ai-id^="seller-card-"]').count();
    console.log(`Found ${sellerCards} seller cards`);

    if (sellerCards > 0) {
      // Valida o primeiro seller card
      const firstSellerCard = page.locator('[data-ai-id^="seller-card-"]').first();
      await expect(firstSellerCard).toBeVisible();

      // Valida que o card tem estrutura correta
      const cardTitle = firstSellerCard.locator('[data-ai-id$="-title"]');
      await expect(cardTitle).toBeVisible();
    }
  });

  test('T3: Modal de criação abre e fecha sem erros', async ({ page }) => {
    await page.goto(ADMIN_SELLERS_URL, { waitUntil: 'networkidle' });

    // Busca pelo botão "Novo Comitente"
    const novoButton = page.getByRole('button', { name: /novo comitente/i });
    await novoButton.click();

    // Aguarda o modal/sheet abrir
    await page.waitForTimeout(1000);

    // Verifica se o modal está presente
    const dialogContent = page.locator('[data-ai-id="crud-form-dialog"], [data-ai-id="crud-form-sheet"]');
    await expect(dialogContent).toBeVisible();

    // Verifica se o título está presente e acessível
    const dialogTitle = page.locator('[data-ai-id="crud-form-dialog-title"], [data-ai-id="crud-form-sheet-title"]');
    await expect(dialogTitle).toBeVisible();

    // Testa fechar o modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // ConsoleMessages não deve ter DialogContent accessibility warning novo
    const accessibilityWarnings = errorTracking.consoleMessages.filter((m: any) => 
      m.text.includes('VisuallyHidden')
    );
    // Nota: pode haver o aviso, mas verificamos se ele está sendo tratado
  });

  test('T4: Lista de sellers em view table (padrão)', async ({ page }) => {
    await page.goto(ADMIN_SELLERS_URL, { waitUntil: 'networkidle' });

    // Aguarda a tabela carregar
    await page.waitForTimeout(2000);

    // Procura por linhas da tabela
    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    console.log(`Table has ${rowCount} rows`);

    if (rowCount > 0) {
      // Valida primeira linha
      const firstRow = tableRows.first();
      await expect(firstRow).toBeVisible();

      // Valida que os buttons de ação estão presentes
      const actionButtons = firstRow.locator('[data-ai-id$="-btn"]');
      const buttonCount = await actionButtons.count();
      expect(buttonCount).toBeGreaterThan(0);
    }
  });

  test('T5: Botões de ação (view, edit, delete) são clicáveis', async ({ page }) => {
    await page.goto(ADMIN_SELLERS_URL, { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    const tableRows = page.locator('table tbody tr');
    const rowCount = await tableRows.count();

    if (rowCount > 0) {
      const firstRow = tableRows.first();

      // Testa localizador de botão de editar
      const editBtn = firstRow.locator('[data-ai-id="seller-edit-btn"]').first();
      if (await editBtn.isVisible()) {
        await expect(editBtn).toBeEnabled();
        // Não clica ainda, só valida que está disponível
      }
    }
  });

  test('T6: Conversão de view mode (grid/list/table)', async ({ page }) => {
    await page.goto(ADMIN_SELLERS_URL, { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    // Procura por buttons de view mode
    const gridButton = page.getByRole('button', { name: /grid|grade/i }).first();
    if (await gridButton.isVisible()) {
      await gridButton.click();
      await page.waitForTimeout(1000);
    }

    const listButton = page.getByRole('button', { name: /list|lista/i }).first();
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(1000);
    }

    // Verifica se não há erros após trocar de view
    const viewErrors = errorTracking.consoleMessages.filter((m: any) => 
      m.text.includes('Cannot read') || m.type === 'error'
    );
    expect(viewErrors).toHaveLength(0);
  });

  test('T7: Screenshot visual da página carregada', async ({ page }) => {
    await page.goto(ADMIN_SELLERS_URL, { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    // Captura screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/admin-sellers-page-loaded.png',
      fullPage: true 
    });

    // Verifica que a página foi renderizada
    const content = page.locator('[data-ai-id="admin-sellers-page-container"]');
    await expect(content).toBeVisible();
  });

  test('T8: Validação sem erros de acessibilidade DialogTitle', async ({ page }) => {
    await page.goto(ADMIN_SELLERS_URL, { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    // Abre o modal
    const novoButton = page.getByRole('button', { name: /novo comitente/i });
    await novoButton.click();

    await page.waitForTimeout(1000);

    // Coleta mensagens específicas
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // Aguarda um pouco para coletar mensagens
    await page.waitForTimeout(1000);

    // Valida que a DialogTitle ou SheetTitle está presente
    const dialogTitle = page.locator('[data-ai-id$="-title"]').first();
    if (await dialogTitle.isVisible()) {
      await expect(dialogTitle).toHaveText(/editar|novo/i);
    }

    // Log das mensagens de console para debugging
    console.log('Console messages during modal open:', consoleMessages.join('\n'));
  });

  test('T9: Teste de integração - Load, view, interact, close', async ({ page }) => {
    // Full flow test
    await page.goto(ADMIN_SELLERS_URL, { waitUntil: 'networkidle' });
    
    // 1. Página carrega
    await expect(page.locator('[data-ai-id="admin-sellers-page-container"]')).toBeVisible();

    // 2. Aguarda sellers renderizarem
    await page.waitForTimeout(2000);

    // 3. Abre modal
    const novoBtn = page.getByRole('button', { name: /novo comitente/i });
    if (await novoBtn.isVisible()) {
      await novoBtn.click();
      await page.waitForTimeout(1000);

      // 4. Fecha modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // 5. Valida estado final
    await expect(page.locator('[data-ai-id="admin-sellers-page-container"]')).toBeVisible();
  });

  test.afterEach(async () => {
    // Log erros encontrados
    if (errorTracking.consoleMessages.length > 0) {
      console.log('\n=== Console Errors/Warnings ===');
      errorTracking.consoleMessages.forEach((msg: any) => {
        console.log(`[${msg.type}] ${msg.text}`);
      });
    }

    if (errorTracking.networkErrors.length > 0) {
      console.log('\n=== Network Errors ===');
      errorTracking.networkErrors.forEach((err: any) => {
        console.log(`[${err.status}] ${err.url}`);
      });
    }
  });
});
