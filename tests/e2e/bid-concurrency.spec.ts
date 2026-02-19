/**
 * @fileoverview Teste Playwright para validar operação concorrente de lances
 * usando endpoint de diagnóstico em ambiente DEV/container.
 */
import { test, expect } from '@playwright/test';

test.describe('Bid Concurrency - Atomic Update', () => {
  test('deve aceitar apenas 1 lance e rejeitar o concorrente', async ({ request, page }) => {
    const apiResponse = await request.post('http://127.0.0.1:9005/api/test/bid-concurrency');
    expect(apiResponse.ok()).toBeTruthy();

    const payload = await apiResponse.json();

    await page.setViewportSize({ width: 1400, height: 900 });
    await page.setContent(`
      <html>
        <head><title>Bid Concurrency Evidence</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h1 data-ai-id="bid-concurrency-title">Resultado da Validação de Concorrência</h1>
          <p data-ai-id="bid-concurrency-status">Status: ${payload.success ? 'SUCESSO' : 'FALHA'}</p>
          <p data-ai-id="bid-concurrency-lot">Lote: ${payload.lotId ?? 'N/A'}</p>
          <p data-ai-id="bid-concurrency-bid-amount">Valor testado: ${payload.bidAmount ?? 'N/A'}</p>
          <pre data-ai-id="bid-concurrency-json" style="white-space: pre-wrap; background: #f6f8fa; padding: 16px; border-radius: 8px;">${JSON.stringify(payload, null, 2)}</pre>
        </body>
      </html>
    `);

    await page.screenshot({
      path: 'test-results/bid-concurrency-result.png',
      fullPage: true,
    });

    expect(payload.success, JSON.stringify(payload)).toBe(true);
    expect(payload.successCount).toBe(1);
    expect(payload.failureCount).toBe(1);
  });
});
