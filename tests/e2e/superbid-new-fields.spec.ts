import { test, expect } from '@playwright/test';
import { loginAsAdmin, CREDENTIALS } from './helpers/auth-helper';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://demo.localhost:9006';

test.describe('SuperBid New Fields - E2E Review', () => {
  test.beforeEach(async ({ page }) => {
    // Aumentar o timeout para o servidor em dev
    test.setTimeout(120000);
    await loginAsAdmin(page, BASE_URL);
  });

  test('should create a vehicle asset with new fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/assets/new`);
    await page.waitForLoadState('networkidle');

    // Preencher campos base
    await page.fill('[name="title"]', 'AUDI A4 TEST E2E');
    
    // Selecionar categoria Veículos
    await page.click('[data-ai-id="asset-category-select"]');
    await page.click('role=option[name=/veículo/i]');

    // Selecionar comitente (pegar o primeiro disponível)
    await page.click('[data-ai-id="asset-seller-select"]');
    await page.click('role=option >> nth=0');

    // Preencher campos específicos de veículos (novos campos)
    await page.fill('[name="plateFinal"]', '7');
    await page.fill('[name="plateState"]', 'RJ');
    await page.fill('[name="chassis"]', '123456');
    await page.fill('[name="engineStatus"]', 'Excelente');
    
    // Checkbox IPVA
    await page.check('[name="ipvaPaid"]');

    // Salvar
    await page.click('[data-ai-id="asset-form-submit"]');

    // Aguardar redirecionamento ou mensagem de sucesso
    await expect(page).toHaveURL(/\/admin\/assets/);
    await expect(page.getByText(/Ativo criado com sucesso/i)).toBeVisible();
  });

  test('should create a lot from assets with new financial fields', async ({ page }) => {
    // Ir para a página de loteamento
    await page.goto('/admin/lotting');
    await page.waitForLoadState('networkidle');

    // Selecionar o primeiro asset disponível (usando o checkbox da tabela)
    const firstRowCheckbox = page.getByRole('checkbox', { name: /Selecionar linha/i }).first();
    await firstRowCheckbox.waitFor({ state: 'visible', timeout: 30000 });
    await firstRowCheckbox.click(); // Click is safer for shadcn checkboxes than .check()

    // Clicar no botão de criar lote a partir de ativos (deve estar em uma barra flutuante ou menu)
    // O botão deve aparecer agora
    const createLotBtn = page.getByRole('button', { name: /Criar Lote/i }).first();
    await createLotBtn.waitFor({ state: 'visible', timeout: 30000 });
    await createLotBtn.click();

    // Modal deve abrir
    await expect(page.getByText(/Criar Lote Agrupado/i)).toBeVisible({ timeout: 15000 });

    // Preencher novos campos financeiros
    await page.fill('[name="number"]', 'Lote-999');
    await page.fill('[name="title"]', 'Lote Teste Financeiro');
    await page.fill('[name="reservePrice"]', '50000');
    await page.fill('[name="commissionRate"]', '5');
    await page.fill('[name="adminFee"]', '150.50');
    
    // Submeter o modal
    await page.click('button[type="submit"]:has-text("Salvar Lote")');

    // Aguardar sucesso
    await expect(page.getByText(/Lote criado com sucesso/i)).toBeVisible();
  });
});
