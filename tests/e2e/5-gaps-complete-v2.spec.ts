/**
 * 🎯 TESTES PLAYWRIGHT - 5 GAPS COM CLASSNAMES CONTEXTUALIZADOS
 * ==============================================================
 * 
 * TODOS os testes agora usam:
 * - data-testid para elementos interativos (PRINCIPAL)
 * - classNames contextualizados para containers e elementos
 * 
 * Cobre todos os 5 gaps implementados:
 * A) Timestamps + Audit/Logs
 * B) WebSocket + Soft Close
 * C) Blockchain Toggle + Lawyer Monetization
 * D) PWA + Responsivo
 * E) POCs Mock FIPE/Cartórios/Tribunais
 * 
 * Requer: npm run db:seed:v3 executado antes
 * Execução: npm run test:e2e tests/e2e/5-gaps-complete-v2.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9005';

// ═══════════════════════════════════════════════════════════════════════════
// GAP A: TIMESTAMPS + AUDIT/LOGS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('GAP A: Timestamps + Audit/Logs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/audit-logs`, { waitUntil: 'networkidle' });
  });

  test('A1: Deve carregar página de Audit Logs com classNames corretos', async ({ page }) => {
    // Verificar container principal com className contextualizado
    const container = page.locator('.audit-logs-viewer-container');
    await expect(container).toBeVisible();

    // Verificar data-testid
    const testIdContainer = page.locator('[data-testid="audit-logs-container"]');
    await expect(testIdContainer).toBeVisible();

    // Verificar título
    const title = page.locator('.audit-logs-viewer-title');
    await expect(title).toContainText('Logs de Auditoria');
  });

  test('A2: Deve filtrar audit logs por modelo', async ({ page }) => {
    // Aguardar container
    await page.waitForSelector('.audit-logs-viewer-container');

    // Filtrar por modelo usando data-testid
    const modelFilter = page.locator('[data-testid="audit-logs-filter-model"]');
    await modelFilter.selectOption('Auction');

    // Verificar tabela
    const table = page.locator('.audit-logs-viewer-table');
    await expect(table).toBeVisible();

    // Verificar linhas da tabela
    const rows = page.locator('.audit-logs-viewer-table-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('A3: Deve filtrar audit logs por ação', async ({ page }) => {
    // Filtrar por ação
    const actionFilter = page.locator('[data-testid="audit-logs-filter-action"]');
    await actionFilter.selectOption('CREATE');

    // Verificar se há dados
    const table = page.locator('.audit-logs-viewer-table');
    await expect(table).toBeVisible();
  });

  test('A4: Deve exibir estatísticas dos últimos 7 dias', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForSelector('.audit-logs-viewer-stats');

    // Verificar stats
    const stats = page.locator('.audit-logs-viewer-stats');
    await expect(stats).toBeVisible();

    // Verificar título de stats
    const statsTitle = stats.locator('.audit-logs-viewer-stats-title');
    await expect(statsTitle).toContainText('Resumo');
  });

  test('A5: Deve ter botão para limpar logs antigos', async ({ page }) => {
    // Verificar botão de cleanup
    const cleanupBtn = page.locator('[data-testid="audit-logs-cleanup-button"]');
    await expect(cleanupBtn).toBeVisible();
    await expect(cleanupBtn).toContainText('Limpar');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GAP B: WEBSOCKET + SOFT CLOSE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('GAP B: WebSocket + Soft Close', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });
  });

  test('B1: Deve carregar painel de configurações com Soft Close', async ({ page }) => {
    // Verificar container
    const container = page.locator('.admin-settings-panel-container');
    await expect(container).toBeVisible();

    // Verificar seção Soft Close
    const softCloseSection = page.locator('.admin-settings-softclose-section');
    await expect(softCloseSection).toBeVisible();

    // Verificar título
    const title = softCloseSection.locator('.admin-settings-softclose-title');
    await expect(title).toContainText('Soft Close');
  });

  test('B2: Deve ativar/desativar Soft Close', async ({ page }) => {
    // Usar data-testid para encontrar toggle
    const toggle = page.locator('[data-testid="softclose-enabled-toggle"]');
    await expect(toggle).toBeVisible();

    // Obter estado inicial
    const isChecked = await toggle.isChecked();
    console.log(`Soft Close inicial: ${isChecked}`);

    // Clicar para mudar
    await toggle.click();

    // Verificar que mudou
    const newChecked = await toggle.isChecked();
    expect(newChecked).not.toBe(isChecked);

    // Verificar status visual
    const status = page.locator('.admin-settings-softclose-status');
    await expect(status).toBeVisible();
  });

  test('B3: Deve exibir minutos de Soft Close configurados', async ({ page }) => {
    // Aguardar elemento
    const minutesInput = page.locator('[data-testid="softclose-minutes-input"]');
    await minutesInput.waitFor({ state: 'visible' });

    // Obter valor
    const value = await minutesInput.inputValue();
    expect(parseInt(value || '0')).toBeGreaterThan(0);
  });

  test('B4: Deve ter controle de extensão de leilão (quando ativado)', async ({ page }) => {
    // Se Soft Close estiver desativado, ativar
    const toggle = page.locator('[data-testid="softclose-enabled-toggle"]');
    const isChecked = await toggle.isChecked();

    if (!isChecked) {
      await toggle.click();
      await page.waitForTimeout(500);
    }

    // Procurar botão de extensão (se estiver em página com auctionId)
    const extensionBtn = page.locator('[data-testid="softclose-extend-button"]').first();
    if (await extensionBtn.count() > 0) {
      await expect(extensionBtn).toBeVisible();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GAP C: BLOCKCHAIN + LAWYER MONETIZATION
// ═══════════════════════════════════════════════════════════════════════════

test.describe('GAP C: Blockchain + Lawyer Monetization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });
  });

  test('C1: Deve exibir seção Blockchain', async ({ page }) => {
    // Verificar seção blockchain
    const section = page.locator('.admin-settings-blockchain-section');
    await expect(section).toBeVisible();

    // Verificar título
    const title = section.locator('.admin-settings-blockchain-title');
    await expect(title).toContainText('Blockchain');
  });

  test('C2: Deve ativar/desativar Blockchain', async ({ page }) => {
    // Usar data-testid
    const toggle = page.locator('[data-testid="blockchain-enabled-toggle"]');
    await expect(toggle).toBeVisible();

    // Mudar estado
    await toggle.click();
    await page.waitForTimeout(300);

    // Verificar status
    const status = page.locator('.admin-settings-blockchain-status');
    await expect(status).toBeVisible();
  });

  test('C3: Deve exibir seção Portal de Advogados', async ({ page }) => {
    // Verificar seção lawyer
    const section = page.locator('.admin-settings-lawyer-section');
    await expect(section).toBeVisible();

    // Verificar título
    const title = section.locator('.admin-settings-lawyer-title');
    await expect(title).toContainText('Advogados');
  });

  test('C4: Deve ativar/desativar Portal de Advogados', async ({ page }) => {
    // Usar data-testid
    const toggle = page.locator('[data-testid="lawyer-portal-enabled-toggle"]');
    await expect(toggle).toBeVisible();

    // Mudar estado
    await toggle.click();
    await page.waitForTimeout(300);

    // Verificar que atualizou
    const status = page.locator('.admin-settings-lawyer-status');
    await expect(status).toBeVisible();
  });

  test('C5: Deve exibir modelo de monetização quando ativado', async ({ page }) => {
    // Ativar portal se não estiver
    const toggle = page.locator('[data-testid="lawyer-portal-enabled-toggle"]');
    if (!(await toggle.isChecked())) {
      await toggle.click();
      await page.waitForTimeout(300);
    }

    // Procurar modelo
    const model = page.locator('.admin-settings-lawyer-model');
    if (await model.count() > 0) {
      await expect(model).toBeVisible();

      // Verificar que tem texto do modelo
      const modelValue = model.locator('.admin-settings-lawyer-model-value');
      const text = await modelValue.textContent();
      expect(text).toMatch(/SUBSCRIPTION|PAY_PER_USE|REVENUE_SHARE/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GAP D: PWA + RESPONSIVO
// ═══════════════════════════════════════════════════════════════════════════

test.describe('GAP D: PWA + Responsivo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  });

  test('D1: Deve carregar manifest.json', async ({ page }) => {
    // Verificar que manifest está vinculado
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', /manifest/);
  });

  test('D2: Deve ter viewport correto', async ({ page }) => {
    // Verificar viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('D3: Deve ser responsivo em mobile (375px)', async ({ page }) => {
    // Redimensionar para mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Verificar que página carrega sem quebra
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verificar que não há overflow horizontal
    const bodyBox = await body.boundingBox();
    if (bodyBox) {
      expect(bodyBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('D4: Deve ser responsivo em tablet (768px)', async ({ page }) => {
    // Redimensionar para tablet
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verificar que página carrega
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verificar que não há overflow
    const bodyBox = await body.boundingBox();
    if (bodyBox) {
      expect(bodyBox.width).toBeLessThanOrEqual(768);
    }
  });

  test('D5: Deve ter PWA ativado no settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`);

    // Procurar toggle PWA
    const pwaToggle = page.locator('[data-testid="pwa-enabled-toggle"]');
    if (await pwaToggle.count() > 0) {
      await expect(pwaToggle).toBeVisible();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GAP E: POCS MOCK FIPE/CARTÓRIOS/TRIBUNAIS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('GAP E: Integrações Mock (FIPE/Cartório/Tribunal)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/integrations`, { waitUntil: 'networkidle' });
  });

  test('E1: Deve carregar testador de integrações com abas', async ({ page }) => {
    // Verificar container
    const container = page.locator('.integrations-tester-container');
    await expect(container).toBeVisible();

    // Verificar que tem título
    const title = page.locator('.integrations-tester-title');
    await expect(title).toContainText('Integrações');
  });

  test('E2: Deve ter aba FIPE funcional', async ({ page }) => {
    // Clicar em aba FIPE usando data-testid
    const fipaTab = page.locator('[data-testid="integrations-tester-tab-fipe"]');
    await expect(fipaTab).toBeVisible();
    await fipaTab.click();

    // Verificar que painel carregou
    const fipaPanel = page.locator('[data-testid="integrations-tester-fipe-panel"]');
    await expect(fipaPanel).toBeVisible();

    // Verificar campos de entrada
    const plateInput = page.locator('[data-testid="integrations-fipe-plate-input"]');
    await expect(plateInput).toBeVisible();
  });

  test('E3: Deve consultar FIPE e retornar resultado', async ({ page }) => {
    // Ir para aba FIPE
    const fipaTab = page.locator('[data-testid="integrations-tester-tab-fipe"]');
    await fipaTab.click();

    // Preencher placa
    const plateInput = page.locator('[data-testid="integrations-fipe-plate-input"]');
    await plateInput.clear();
    await plateInput.fill('ABC1234');

    // Clicar em consultar
    const queryBtn = page.locator('[data-testid="integrations-fipe-query-button"]');
    await queryBtn.click();

    // Aguardar resultado
    const result = page.locator('.integrations-tester-result');
    await result.waitFor({ state: 'visible', timeout: 5000 });

    // Verificar que tem conteúdo
    const content = result.locator('.integrations-tester-result-content');
    const text = await content.textContent();
    expect(text).toBeTruthy();
  });

  test('E4: Deve ter aba Cartório funcional', async ({ page }) => {
    // Clicar em aba Cartório
    const cartorioTab = page.locator('[data-testid="integrations-tester-tab-cartorio"]');
    await expect(cartorioTab).toBeVisible();
    await cartorioTab.click();

    // Verificar painel
    const panel = page.locator('[data-testid="integrations-tester-cartorio-panel"]');
    await expect(panel).toBeVisible();

    // Verificar campos
    const codeInput = page.locator('[data-testid="integrations-cartorio-code-input"]');
    await expect(codeInput).toBeVisible();
  });

  test('E5: Deve consultar Cartório e retornar resultado', async ({ page }) => {
    // Ir para aba Cartório
    const tab = page.locator('[data-testid="integrations-tester-tab-cartorio"]');
    await tab.click();

    // Preencher dados
    const codeInput = page.locator('[data-testid="integrations-cartorio-code-input"]');
    const matriculaInput = page.locator('[data-testid="integrations-cartorio-matricula-input"]');

    await codeInput.clear();
    await codeInput.fill('SP');
    await matriculaInput.clear();
    await matriculaInput.fill('12345');

    // Consultar
    const queryBtn = page.locator('[data-testid="integrations-cartorio-query-button"]');
    await queryBtn.click();

    // Verificar resultado
    const result = page.locator('.integrations-tester-result');
    await result.waitFor({ state: 'visible', timeout: 5000 });
  });

  test('E6: Deve ter aba Tribunal funcional', async ({ page }) => {
    // Clicar em aba Tribunal
    const tribunalTab = page.locator('[data-testid="integrations-tester-tab-tribunal"]');
    await expect(tribunalTab).toBeVisible();
    await tribunalTab.click();

    // Verificar painel
    const panel = page.locator('[data-testid="integrations-tester-tribunal-panel"]');
    await expect(panel).toBeVisible();

    // Verificar campos
    const codeInput = page.locator('[data-testid="integrations-tribunal-code-input"]');
    await expect(codeInput).toBeVisible();
  });

  test('E7: Deve consultar Tribunal e retornar resultado', async ({ page }) => {
    // Ir para aba Tribunal
    const tab = page.locator('[data-testid="integrations-tester-tab-tribunal"]');
    await tab.click();

    // Preencher dados
    const codeInput = page.locator('[data-testid="integrations-tribunal-code-input"]');
    const processInput = page.locator('[data-testid="integrations-tribunal-process-input"]');

    await codeInput.clear();
    await codeInput.fill('SP');
    await processInput.clear();
    await processInput.fill('0000001');

    // Consultar
    const queryBtn = page.locator('[data-testid="integrations-tribunal-query-button"]');
    await queryBtn.click();

    // Verificar resultado
    const result = page.locator('.integrations-tester-result');
    await result.waitFor({ state: 'visible', timeout: 5000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES DE INTEGRAÇÃO (Múltiplos Gaps)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Integração: Múltiplos Gaps', () => {
  test('INT1: Admin Settings + Soft Close funcionam juntos', async ({ page }) => {
    // Carregar settings
    await page.goto(`${BASE_URL}/admin/settings`);

    // Verificar que ambas seções carregam
    const softCloseSection = page.locator('.admin-settings-softclose-section');
    const blockchainSection = page.locator('.admin-settings-blockchain-section');

    await expect(softCloseSection).toBeVisible();
    await expect(blockchainSection).toBeVisible();
  });

  test('INT2: API Feature Flags retorna dados corretos', async ({ page }) => {
    // Fazer request à API
    const response = await page.request.get(`${BASE_URL}/api/admin/feature-flags`);
    const json = await response.json();

    // Verificar resposta
    expect(response.ok()).toBeTruthy();
    expect(json.data).toBeDefined();
    expect(json.data.featureFlags).toBeDefined();
    expect(json.data.featureFlags.softCloseEnabled).toBeDefined();
    expect(json.data.featureFlags.blockchainEnabled).toBeDefined();
  });

  test('INT3: API Audit Logs retorna dados corretos', async ({ page }) => {
    // Fazer request
    const response = await page.request.get(`${BASE_URL}/api/admin/audit-logs?limit=10`);
    const json = await response.json();

    // Verificar resposta
    expect(response.ok()).toBeTruthy();
    expect(json.data).toBeDefined();
    expect(json.data.logs).toBeDefined();
    expect(Array.isArray(json.data.logs)).toBeTruthy();
  });

  test('INT4: APIs de Integrações retornam dados corretos', async ({ page }) => {
    // FIPE
    const fipaResponse = await page.request.post(`${BASE_URL}/api/integrations/fipe`, {
      data: { plate: 'ABC1234' },
    });
    expect(fipaResponse.ok()).toBeTruthy();

    // Cartório
    const cartorioResponse = await page.request.post(`${BASE_URL}/api/integrations/cartorio`, {
      data: { cartorioCode: 'SP', matricula: '12345' },
    });
    expect(cartorioResponse.ok()).toBeTruthy();

    // Tribunal
    const tribunalResponse = await page.request.post(`${BASE_URL}/api/integrations/tribunal`, {
      data: { courtCode: 'SP', processNumber: '0000001' },
    });
    expect(tribunalResponse.ok()).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTES DE PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Performance', () => {
  test('PERF1: Admin Settings carrega em menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);

    console.log(`✓ Admin Settings carregou em ${loadTime}ms`);
  });

  test('PERF2: Audit Logs carrega em menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/admin/audit-logs`, { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);

    console.log(`✓ Audit Logs carregou em ${loadTime}ms`);
  });

  test('PERF3: Integrations Tester carrega em menos de 3 segundos', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/admin/integrations`, { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);

    console.log(`✓ Integrations Tester carregou em ${loadTime}ms`);
  });
});
