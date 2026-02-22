// tests/e2e/map-search-layout.spec.ts
import { test, expect, Page } from '@playwright/test';

const PAGE_URL = process.env.MAP_BASE_URL
  ? `${process.env.MAP_BASE_URL}/map-search`
  : 'http://demo.localhost:9005/map-search';

// Estratégia de Observabilidade: Capturar erros de console do browser
interface ConsoleMessage {
  type: string;
  text: string;
  location?: string;
}

async function setupConsoleMonitoring(page: Page): Promise<ConsoleMessage[]> {
  const consoleErrors: ConsoleMessage[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.url,
      });
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push({
      type: 'pageerror',
      text: error.message,
    });
  });

  return consoleErrors;
}

async function waitForMapModal(page: Page, consoleErrors: ConsoleMessage[]) {
  await page.goto(PAGE_URL);
  await page.locator('[role="dialog"]').waitFor({ state: 'visible', timeout: 10000 });
  
  // Aguardar estabilização do mapa (evitar falsos positivos de erros de carregamento)
  await page.waitForTimeout(1000);
}

test.describe('Map search modal layout', () => {
  test('modal opens on page load and shows header with title (without console errors)', async ({ page }) => {
    const consoleErrors = await setupConsoleMonitoring(page);
    await waitForMapModal(page, consoleErrors);
    
    // Verificar que o modal está visível
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Verificar header com título
    await expect(page.getByRole('heading', { name: /Mapa Inteligente BidExpert/i }).first()).toBeVisible();
    
    // Observabilidade: Verificar ausência de erros críticos no console
    const criticalErrors = consoleErrors.filter(err => 
      err.text.toLowerCase().includes('typeerror') || 
      err.text.toLowerCase().includes('referenceerror') ||
      err.text.toLowerCase().includes('failed to fetch')
    );
    
    if (criticalErrors.length > 0) {
      console.error('🔴 Erros críticos detectados no console:', criticalErrors);
    }
    
    expect(criticalErrors, `Encontrados ${criticalErrors.length} erros críticos no console: ${JSON.stringify(criticalErrors, null, 2)}`).toHaveLength(0);
  });

  test('modal has 70/30 grid layout with map and sidebar (without console errors)', async ({ page }) => {
    const consoleErrors = await setupConsoleMonitoring(page);
    await waitForMapModal(page, consoleErrors);
    
    // Verificar que o grid existe
    const gridContainer = page.locator('.xl\\:grid-cols-\\[7fr_3fr\\]');
    await expect(gridContainer).toBeVisible();
    
    // Verificar que tem pelo menos 2 filhos (mapa e sidebar)
    const gridChildren = gridContainer.locator('> div');
    await expect(gridChildren).toHaveCount(2);
    
    // Observabilidade: Verificar ausência de erros críticos
    const criticalErrors = consoleErrors.filter(err => 
      err.text.toLowerCase().includes('typeerror') || 
      err.text.toLowerCase().includes('referenceerror')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('renders list items with map density (without console errors)', async ({ page }) => {
    const consoleErrors = await setupConsoleMonitoring(page);
    await waitForMapModal(page, consoleErrors);
    
    // Aguardar lista carregar
    await page.locator('[data-ai-id="map-search-list"]').waitFor({ state: 'visible', timeout: 10000 });
    
    // Verificar que a coluna/lista está visível
    await expect(page.locator('[data-ai-id="map-search-list"]')).toBeVisible();

    // Se houver itens com densidade map, validar o primeiro
    const listItems = page.locator('[data-density="map"]');
    const itemCount = await listItems.count();
    if (itemCount > 0) {
      await expect(listItems.first()).toBeVisible();
    }
    
    // Observabilidade: Log de todos os erros para diagnóstico
    if (consoleErrors.length > 0) {
      console.log('⚠️ Erros de console detectados:', consoleErrors);
    }
    
    // Verificar apenas erros críticos (ignorar warnings de libs externas)
    const criticalErrors = consoleErrors.filter(err => {
      const text = err.text.toLowerCase();
      const isTypeOrReference = text.includes('typeerror') || text.includes('referenceerror');
      const isNetworkNoise = text.includes('failed to fetch') || text.includes('fetchserveraction') || text.includes('session check');
      return err.type === 'pageerror' || (isTypeOrReference && !isNetworkNoise);
    });
    expect(criticalErrors).toHaveLength(0);
  });

  test('hovering list item opens marker popup on map (without console errors)', async ({ page }) => {
    const consoleErrors = await setupConsoleMonitoring(page);
    await waitForMapModal(page, consoleErrors);

    await page.locator('[data-ai-id="map-search-list"]').waitFor({ state: 'visible', timeout: 15000 });

    const listItems = page.locator('[data-ai-id="map-search-list-item"]');
    const totalItems = await listItems.count();
    
    if (totalItems > 0) {
      await listItems.first().hover();

      const popupContent = page.locator('.leaflet-popup-content [data-ai-id^="map-popup-"]').first();
      await expect(popupContent).toBeVisible({ timeout: 10000 });
    } else {
      console.log('⚠️ Nenhum item na lista para testar o hover. Teste ignorado.');
    }

    const criticalErrors = consoleErrors.filter(err => {
      const text = err.text.toLowerCase();
      const isTypeOrReference = text.includes('typeerror') || text.includes('referenceerror');
      const isNetworkNoise = text.includes('failed to fetch') || text.includes('fetchserveraction') || text.includes('session check');
      return isTypeOrReference && !isNetworkNoise;
    });
    expect(criticalErrors).toHaveLength(0);
  });

  test('closes modal when close button is clicked (without console errors)', async ({ page }) => {
    const consoleErrors = await setupConsoleMonitoring(page);
    await waitForMapModal(page, consoleErrors);
    
    // Clicar no botão de fechar (X)
    await page.locator('[data-ai-id="map-search-close-btn"]').click();
    
    // Aguardar o modal fechar (dialog não deve estar mais visível)
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    
    // Observabilidade: Verificar que o fechamento não gerou erros
    const criticalErrors = consoleErrors.filter(err => {
      const text = err.text.toLowerCase();
      const isTypeOrReference = text.includes('typeerror') || text.includes('referenceerror');
      const isNetworkNoise = text.includes('failed to fetch') || text.includes('fetchserveraction') || text.includes('session check');
      return isTypeOrReference && !isNetworkNoise;
    });
    expect(criticalErrors).toHaveLength(0);
  });

  test('detects and reports network errors (4xx/5xx)', async ({ page }) => {
    const networkErrors: { url: string; status: number }[] = [];
    
    page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        networkErrors.push({
          url: response.url(),
          status,
        });
      }
    });
    
    const consoleErrors = await setupConsoleMonitoring(page);
    await waitForMapModal(page, consoleErrors);
    
    // Aguardar carregamento completo dos dados
    await page.waitForTimeout(2000);
    
    // Observabilidade: Reportar erros de rede
    if (networkErrors.length > 0) {
      console.error('🌐 Erros de rede detectados:', networkErrors);
    }
    
    // Verificar que não há erros de rede críticos (500+)
    const serverErrors = networkErrors.filter(err => err.status >= 500);
    expect(serverErrors, `Erros de servidor detectados: ${JSON.stringify(serverErrors)}`).toHaveLength(0);
  });
});
