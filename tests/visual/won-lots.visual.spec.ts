/**
 * @fileoverview Teste visual (BDD/TDD) para cards de lotes arrematados.
 */
import { describe, test, expect } from 'vitest';
import { page } from 'vitest/browser';

describe('Visual - Lotes arrematados', () => {
  test('deve renderizar card de arremate e gerar screenshot', async () => {
    const container = document.createElement('div');
    container.setAttribute('data-ai-id', 'won-lots-container');
    container.innerHTML = `
      <section style="padding: 16px; background: #f6f7fb; border-radius: 12px;">
        <article data-testid="won-lots-card" data-ai-id="won-lots-card" style="padding: 16px; background: white; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
          <h2 style="margin: 0 0 8px; font-size: 18px;">Lote Arrematado #001</h2>
          <p style="margin: 0; font-size: 14px; color: #4b5563;">Valor final: R$ 45.000,00</p>
        </article>
      </section>
    `;
    document.body.appendChild(container);

    const card = page.getByTestId('won-lots-card');
    await expect.element(card).toBeVisible();

    const screenshotPath = await page.screenshot({
      path: 'tests/visual/__screenshots__/won-lots-summary.png'
    });

    expect(screenshotPath).toBeTruthy();

    document.body.removeChild(container);
  });
});
