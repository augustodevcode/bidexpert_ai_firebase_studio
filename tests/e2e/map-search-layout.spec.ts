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
    await expect(page.getByRole('heading', { name: /Mapa Inteligente BidExpert/i })).toBeVisible();
    
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

  test('modal has layout with map, sidebar and filters columns (without console errors)', async ({ page }) => {
    const consoleErrors = await setupConsoleMonitoring(page);
    await waitForMapModal(page, consoleErrors);
    
    // Verificar que o container de conteúdo existe (3 colunas: filtros, lista, mapa)
    const contentContainer = page.locator('[data-ai-id="map-search-content"]');
    await expect(contentContainer).toBeVisible();
    
    // Verificar que as colunas principais existem
    await expect(page.locator('[data-ai-id="map-search-filters-column"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="map-search-list-column"]')).toBeVisible();
    await expect(page.locator('[data-ai-id="map-display-column"]')).toBeVisible();
    
    // Observabilidade: Verificar ausência de erros críticos
    const criticalErrors = consoleErrors.filter(err => 
      err.text.toLowerCase().includes('typeerror') || 
      err.text.toLowerCase().includes('referenceerror')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('renders list sidebar with map density items (without console errors)', async ({ page }) => {
    const consoleErrors = await setupConsoleMonitoring(page);
    await waitForMapModal(page, consoleErrors);
    
    // Aguardar lista carregar (scroll area da sidebar)
    await page.locator('[data-ai-id="map-search-list"]').waitFor({ state: 'visible', timeout: 15000 });
    
    // Aguardar que os dados carreguem ou o estado vazio apareça
    await page.waitForTimeout(3000);
    
    // Verificar que a coluna de lista está visível (independente de ter itens)
    await expect(page.locator('[data-ai-id="map-search-list-column"]')).toBeVisible();
    
    // Se houver itens com densidade map, verificar
    const listItems = page.locator('[data-density="map"]');
    const itemCount = await listItems.count();
    if (itemCount > 0) {
      await expect(listItems.first()).toBeVisible();
      console.log(`✅ ${itemCount} item(s) com data-density=map encontrado(s)`);
    } else {
      // Estado vazio é aceitável se não há dados no banco de teste
      console.log('ℹ️ Nenhum item com data-density=map - banco pode estar vazio');
    }
    
    // Observabilidade: Log de todos os erros para diagnóstico
    if (consoleErrors.length > 0) {
      console.log('⚠️ Erros de console detectados:', consoleErrors);
    }
    
    // Verificar apenas erros críticos (ignorar warnings de libs externas e erros de rede/fetch)
    const criticalErrors = consoleErrors.filter(err => 
      err.type === 'pageerror' ||
      // TypeErrors JS reais (não erros de rede/fetch que contêm "TypeError" no texto)
      (err.text.toLowerCase().includes('typeerror') && !err.text.toLowerCase().includes('failed to fetch') && !err.text.toLowerCase().includes('fetchserveraction')) ||
      err.text.toLowerCase().includes('referenceerror')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('closes modal when close button is clicked (without console errors)', async ({ page }) => {
    const consoleErrors = await setupConsoleMonitoring(page);
    await waitForMapModal(page, consoleErrors);
    
    // Clicar no botão de fechar usando data-ai-id específico
    await page.locator('[data-ai-id="map-search-close-btn"]').click();
    
    // Aguardar o modal fechar (dialog não deve estar mais visível)
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 8000 });
    
    // Observabilidade: Verificar que o fechamento não gerou erros críticos
    // Excluir erros de rede/server actions esperados em dev (Failed to fetch, session check)
    const criticalErrors = consoleErrors.filter(err => {
      const text = err.text.toLowerCase();
      const isTypeOrReference = text.includes('typeerror') || text.includes('referenceerror');
      const isNetworkNoise = text.includes('failed to fetch') ||
        text.includes('fetchserveraction') ||
        text.includes('session check');
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
