/**
 * @fileoverview Regressão E2E para garantir que o fluxo visual do wizard continue renderizando o React Flow.
 */

import { test, expect } from '../fixtures/browser-telemetry.fixture';
import { ensureSeedExecuted, loginAsAdmin } from '../helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://demo.localhost:9008';

test.describe('BDD-WIZARD-FLOW-01 — fluxo visual do wizard', () => {
  test.beforeAll(async () => {
    await ensureSeedExecuted(BASE_URL);
  });

  test('renderiza o React Flow e remove o placeholder de indisponibilidade', async ({ page }) => {
    await loginAsAdmin(page, BASE_URL);
    await page.goto(`${BASE_URL}/admin/wizard`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

    await expect(page.locator('[data-ai-id="wizard-step1-type-selection"]')).toBeVisible();
    await expect(page.getByText(/Assistente de Criação de Leilão/i)).toBeVisible();
    await expect(page.locator('[data-ai-id="wizard-flow-reactflow"]')).toBeVisible();
    await expect(page.getByText(/Visualização do Fluxo Indisponível/i)).toHaveCount(0);
    await expect(page.getByText(/Venda Direta/i).first()).toBeVisible();
  });
});
