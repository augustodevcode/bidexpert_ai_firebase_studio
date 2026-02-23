/**
 * Testes E2E para o dashboard do advogado.
 * Valida a renderização das métricas, listas e cards expostos com data-testids.
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsLawyer } from './helpers/auth-helper';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9002';

async function ensureDashboardLoaded(page: Page) {
  await expect(page.getByTestId('lawyer-dashboard-root')).toBeVisible({ timeout: 15_000 });
}

test.describe('Dashboard do Advogado', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsLawyer(page);
    await ensureDashboardLoaded(page);
  });

  test('exibe o cabeçalho e a URL corretos', async ({ page }) => {
    await expect(page).toHaveURL(/\/lawyer\/dashboard/i);
    await expect(page.getByTestId('lawyer-dashboard-title')).toHaveText(/Painel Jurídico/i);
    await expect(page.getByTestId('lawyer-dashboard-subtitle')).toContainText(/Visão consolidada/i);
  });

  test('renderiza as métricas principais com valores', async ({ page }) => {
    const metrics = [
      'lawyer-metric-active-cases',
      'lawyer-metric-hearings-week',
      'lawyer-metric-documents-pending',
      'lawyer-metric-portfolio-value',
    ];

    for (const testId of metrics) {
      const card = page.getByTestId(testId);
      await expect(card).toBeVisible();
      await expect(card).toContainText(/\d|R\$/);
    }
  });

  test('lista processos na carteira jurídica com o processo determinístico', async ({ page }) => {
    await expect(page.getByTestId('lawyer-cases-card')).toBeVisible();

    const caseRows = page.getByTestId('lawyer-case-row');
    const rowCount = await caseRows.count();
    expect(rowCount).toBeGreaterThan(0);

    await expect(page.getByTestId('lawyer-cases-card')).toContainText('5001234-56.2025.8.26.0100');
  });

  test('exibe o card de monetização com tarefas prioritárias', async ({ page }) => {
    const monetizationCard = page.getByTestId('lawyer-monetization-card');
    await expect(monetizationCard).toBeVisible();
    await expect(monetizationCard).toContainText(/Modelo comercial/i);

    const taskItems = page.getByTestId('lawyer-task-item');
    const taskCount = await taskItems.count();
    expect(taskCount).toBeGreaterThan(0);
  });

  test('apresenta audiências próximas na agenda', async ({ page }) => {
    const hearingsCard = page.getByTestId('lawyer-hearings-card');
    await expect(hearingsCard).toBeVisible();

    const hearings = page.getByTestId('lawyer-hearing-item');
    const hearingsCount = await hearings.count();
    expect(hearingsCount).toBeGreaterThan(0);
  });

  test('mostra documentos operacionais com status pendente', async ({ page }) => {
    const documentsCard = page.getByTestId('lawyer-documents-card');
    await expect(documentsCard).toBeVisible();

    const documentItems = page.getByTestId('lawyer-document-item');
    const documentCount = await documentItems.count();
    expect(documentCount).toBeGreaterThan(0);

    await expect(documentsCard).toContainText(/certificado_oab\.pdf|Em análise/i);
  });

  test('mantém o contexto jurídico após recarregar a página', async ({ page }) => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ensureDashboardLoaded(page);

    await expect(page.getByTestId('lawyer-dashboard-title')).toHaveText(/Painel Jurídico/i);
    await expect(page.getByTestId('lawyer-metric-active-cases')).toBeVisible();
  });
});
